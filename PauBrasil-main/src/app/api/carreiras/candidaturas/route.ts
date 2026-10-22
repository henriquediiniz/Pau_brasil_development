import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { chaveDeCvValida } from '@/lib/armazenamento'
import { notify } from '@/lib/notify'
import { montarCatalogo, gruposDosCargos, nomesDoCatalogo } from '@/lib/gente/cargo-publico'
import { candidatarRatelimit } from '@/lib/rate-limit'
import { waitUntil } from '@vercel/functions'
import {
  VALORES_ESCOLARIDADE, VALORES_GENERO, IDADE_MAXIMA, IDADE_MINIMA,
  idadeAceita, lerDataNascimento,
} from '@/lib/carreiras-perfil'

export const dynamic = 'force-dynamic'

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
] as const

// Rate limit: 3 candidaturas por e-mail por 24h
const emailRateMap = new Map<string, { count: number; resetAt: number }>()

function checkEmailRateLimit(email: string): boolean {
  const now = Date.now()
  const entry = emailRateMap.get(email)
  if (!entry || now > entry.resetAt) {
    emailRateMap.set(email, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

const CandidaturaSchema = z.object({
  nome:                z.string().min(2).max(120).trim(),
  email:               z.string().email().toLowerCase().trim(),
  telefone:            z.string().max(20).trim().optional(),
  cidade:              z.string().min(2).max(80).trim(),
  estado:              z.enum(ESTADOS_BR),
  /*
    Era `z.enum(TODOS_CARGOS)`, derivado da lista chumbada. Agora o catalogo
    cresce com os descritivos que o RH publica, e um enum fixo recusaria
    justamente o cargo recem-publicado: o candidato veria a opcao e nao
    conseguiria enviar. Continua sendo lista de permitidos — so que montada em
    tempo de execucao, logo abaixo, contra o mesmo catalogo que a pagina serve.
  */
  cargosInteresse:     z.array(z.string().min(1).max(160)).min(1).max(3),
  cvUrl:               z.string().url(),
  cvPublicId:          z.string().min(1),
  cvOriginalFilename:  z.string().max(260).optional(),
  cvMimeType:          z.string().optional(),
  cvSizeBytes:         z.number().int().positive().optional(),
  cvHash:              z.string().optional(),
  mensagem:            z.string().max(1000).trim().optional(),
  /*
    Perfil de triagem. Opcional AQUI, obrigatorio no formulario: quem estava
    com a pagina antiga aberta no momento do deploy nao pode perder a
    candidatura por um campo que a tela dele nem mostrava.
  */
  genero:              z.enum(VALORES_GENERO).optional(),
  dataNascimento:      z.string()
    .refine((s) => lerDataNascimento(s) !== null, 'Data de nascimento inválida')
    .refine((s) => { const d = lerDataNascimento(s); return !d || idadeAceita(d) },
      `Idade deve estar entre ${IDADE_MINIMA} e ${IDADE_MAXIMA} anos`)
    .optional(),
  escolaridade:        z.enum(VALORES_ESCOLARIDADE).optional(),
  consentimentoLgpd:   z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar os termos de privacidade.' }),
  }),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  // Rate Limiter Estrito Anti-Spam (Upstash Redis)
  if (candidatarRatelimit) {
    const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
    const { success } = await candidatarRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Muitas candidaturas. Tente novamente mais tarde.' }, { status: 429 })
    }
  }

  const parsed = CandidaturaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const data = parsed.data

  /*
    Lista de permitidos em tempo de execucao: os mesmos nomes que a pagina
    oferece. Sem vaga aberta aqui — o destaque e enfeite da tela e nao muda o
    que pode ser enviado.
  */
  const catalogo = montarCatalogo(
    await prisma.recCargo.findMany({
      where: { publicarNoSite: true, ativo: true },
      take: 500,
      select: {
        id: true, cargo: true, area: true, tipoVaga: true, descricaoAtividades: true,
        experienciaSugerida: true, formacao: true, statusCurso: true, curso: true,
        exigencias: true, publicarNoSite: true, grupoPublico: true, turnos: true,
      },
    })
  )

  const permitidos = new Set(nomesDoCatalogo(catalogo))
  const foraDoCatalogo = data.cargosInteresse.filter((c) => !permitidos.has(c))

  if (foraDoCatalogo.length > 0) {
    return NextResponse.json(
      {
        error: 'Cargo não disponível para candidatura.',
        details: { cargosInteresse: foraDoCatalogo },
      },
      { status: 422 }
    )
  }

  // Validar a chave do arquivo — deve ser um CV enviado por /api/carreiras/upload-cv
  if (!chaveDeCvValida(data.cvPublicId)) {
    return NextResponse.json({ error: 'Upload do currículo inválido. Envie o PDF novamente.' }, { status: 422 })
  }

  // Rate limit por e-mail
  if (!checkEmailRateLimit(data.email)) {
    return NextResponse.json(
      { error: 'Muitas candidaturas. Tente novamente em 24 horas.' },
      { status: 429 }
    )
  }

  // Verificar duplicidade: mesmo email + pelo menos 1 cargo em comum nos últimos 30 dias
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const candidaturaRecente = await prisma.candidatura.findFirst({
    where: {
      email:           data.email,
      createdAt:       { gte: trintaDiasAtras },
      cargosInteresse: { hasSome: data.cargosInteresse },
    },
    select: { id: true },
  })

  if (candidaturaRecente) {
    return NextResponse.json(
      { error: 'Você já se candidatou para um ou mais desses cargos nos últimos 30 dias.' },
      { status: 409 }
    )
  }

  const gruposInteresse = gruposDosCargos(catalogo, data.cargosInteresse)

  let candidatura: { id: string; nome: string; cargosInteresse: string[] }

  try {
    candidatura = await prisma.candidatura.create({
      data: {
        nome:               data.nome,
        email:              data.email,
        telefone:           data.telefone,
        cidade:             data.cidade,
        estado:             data.estado,
        cargosInteresse:    data.cargosInteresse,
        gruposInteresse,
        cvUrl:              data.cvUrl,
        cvPublicId:         data.cvPublicId,
        cvOriginalFilename: data.cvOriginalFilename,
        cvMimeType:         data.cvMimeType,
        cvSizeBytes:        data.cvSizeBytes,
        cvHash:             data.cvHash,
        mensagem:           data.mensagem,
        genero:             data.genero,
        dataNascimento:     data.dataNascimento ? lerDataNascimento(data.dataNascimento) : undefined,
        escolaridade:       data.escolaridade,
        consentimentoLgpd:  data.consentimentoLgpd,
      },
      select: { id: true, nome: true, cargosInteresse: true },
    })
  } catch (error) {
    console.error('[candidaturas] falha ao criar candidatura:', error)
    return NextResponse.json({ error: 'Erro ao salvar candidatura. Tente novamente.' }, { status: 500 })
  }

  // Notificar todos RH_ADMIN de forma assíncrona blindada (waitUntil)
  waitUntil(
    prisma.user.findMany({
      where: { role: 'RH_ADMIN' },
      select: { id: true },
    }).then(rhAdmins => {
      const titulo = `Nova candidatura: ${candidatura.nome}`
      const descricao = `Cargos: ${candidatura.cargosInteresse.join(', ')}`
      return Promise.allSettled(rhAdmins.map(u => notify(u.id, titulo, descricao)))
    }).catch(err => console.error('[candidaturas] falha ao notificar RH_ADMIN:', err))
  )

  return NextResponse.json({ id: candidatura.id }, { status: 201 })
}
