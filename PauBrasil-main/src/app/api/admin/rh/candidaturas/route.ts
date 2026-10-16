import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isRhAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { EtapaCandidatura } from '@prisma/client'
import { withHandler } from '@/lib/api-handler'
import { OPERACOES_RH } from '@/lib/operacoes-rh'
import {
  VALORES_ESCOLARIDADE, VALORES_GENERO, calcularIdade, intervaloDeNascimento,
  rotuloEscolaridade, rotuloGenero,
} from '@/lib/carreiras-perfil'

/**
 * Valor especial dos filtros de perfil: quem nao respondeu. Candidaturas de
 * antes do campo existir e CVs importados pelo RH caem aqui — o RH precisa
 * achar essas pessoas para completar a ficha.
 */
const NAO_INFORMADO = 'sem'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export const GET = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!isRhAdmin(session.user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const url  = req.nextUrl
  const page  = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = url.searchParams.has('limit') ? parseInt(url.searchParams.get('limit')!) : PAGE_SIZE

  // Filtros
  const cargo      = url.searchParams.get('cargo')
  const grupo      = url.searchParams.get('grupo')
  const etapa      = url.searchParams.get('etapa') as EtapaCandidatura | null
  const operacao   = url.searchParams.get('operacao')
  const dataInicio = url.searchParams.get('dataInicio')
  const dataFim    = url.searchParams.get('dataFim')
  const q          = url.searchParams.get('q')
  const tipoVaga   = url.searchParams.get('tipoVaga')
  const genero       = url.searchParams.get('genero')
  const faixaEtaria  = url.searchParams.get('faixaEtaria')
  const escolaridade = url.searchParams.get('escolaridade')
  const exportCsv  = url.searchParams.get('export') === 'csv'

  const op = operacao ? OPERACOES_RH[operacao] : null

  const where: Record<string, unknown> = {}
  if (cargo)  where.cargosInteresse = { has: cargo }
  if (grupo)  where.gruposInteresse = { has: grupo }
  if (etapa && Object.values(EtapaCandidatura).includes(etapa)) where.etapa = etapa
  if (dataInicio || dataFim) {
    where.createdAt = {
      ...(dataInicio ? { gte: new Date(dataInicio) } : {}),
      ...(dataFim    ? { lte: new Date(dataFim + 'T23:59:59Z') } : {}),
    }
  }
  if (tipoVaga === 'pcd')      where.mensagem = { contains: '[Vaga Exclusiva PCD]',      mode: 'insensitive' }
  if (tipoVaga === 'mulheres') where.mensagem = { contains: '[Vaga Exclusiva Mulheres]', mode: 'insensitive' }

  // Perfil de triagem. Valor fora da lista e ignorado, nao vira filtro vazio.
  if (genero === NAO_INFORMADO) where.genero = null
  else if (genero && (VALORES_GENERO as readonly string[]).includes(genero)) where.genero = genero

  if (escolaridade === NAO_INFORMADO) where.escolaridade = null
  else if (escolaridade && (VALORES_ESCOLARIDADE as readonly string[]).includes(escolaridade)) {
    where.escolaridade = escolaridade
  }

  // Faixa etaria vira intervalo de nascimento: filtra no banco, e a paginacao
  // continua contando certo.
  if (faixaEtaria === NAO_INFORMADO) where.dataNascimento = null
  else if (faixaEtaria) {
    const intervalo = intervaloDeNascimento(faixaEtaria)
    if (intervalo) where.dataNascimento = intervalo
  }

  // Filtros com OR precisam ser combinados em AND para não se sobrepor
  const andConditions: Record<string, unknown>[] = []
  if (q) {
    andConditions.push({
      OR: [
        { nome:  { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    })
  }
  if (op) {
    andConditions.push({
      OR: op.cidades.map(c => ({ cidade: { equals: c, mode: 'insensitive' } })),
    })
  }
  if (andConditions.length > 0) where.AND = andConditions

  // CSV export — retorna todos os registros filtrados
  if (exportCsv) {
    const all = await prisma.candidatura.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, nome: true, email: true, telefone: true,
        cidade: true, estado: true, cargosInteresse: true,
        gruposInteresse: true, etapa: true, mensagem: true, createdAt: true,
        genero: true, dataNascimento: true, escolaridade: true,
      },
    })

    // Audit log
    audit({
      actorId:    session.user.id,
      actorName:  session.user.name ?? session.user.email ?? '',
      action:     'CANDIDATURA_CSV_EXPORTADO',
      targetType: 'Candidatura',
      meta:       { filtros: { cargo, grupo, etapa, operacao, q, dataInicio, dataFim, tipoVaga, genero, faixaEtaria, escolaridade }, total: all.length },
    }).catch(console.error)

    const header = 'ID,Nome,Email,Telefone,Cidade,Estado,Genero,Idade,Escolaridade,Cargos,Grupos,Etapa,Mensagem,Data,Link CV\n'
    const rows = all.map(c =>
      [
        c.id,
        `"${c.nome.replace(/"/g, '""')}"`,
        c.email,
        c.telefone ?? '',
        `"${c.cidade}"`,
        c.estado,
        rotuloGenero(c.genero) ?? '',
        c.dataNascimento ? calcularIdade(c.dataNascimento) : '',
        `"${rotuloEscolaridade(c.escolaridade) ?? ''}"`,
        `"${c.cargosInteresse.join('; ')}"`,
        `"${c.gruposInteresse.join('; ')}"`,
        c.etapa,
        `"${(c.mensagem ?? '').replace(/"/g, '""')}"`,
        c.createdAt.toISOString().slice(0, 10),
        `${req.nextUrl.origin}/api/admin/rh/candidaturas/${c.id}/cv-url`,
      ].join(',')
    ).join('\n')

    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="candidaturas-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  // Paginado
  const [total, items] = await Promise.all([
    prisma.candidatura.count({ where }),
    prisma.candidatura.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
      select: {
        id: true, nome: true, email: true, telefone: true,
        cidade: true, estado: true, cargosInteresse: true,
        gruposInteresse: true, etapa: true, createdAt: true, updatedAt: true,
        genero: true, dataNascimento: true, escolaridade: true,
      },
    }),
  ])

  return NextResponse.json({
    // A idade sai pronta: calcular no navegador leria a data no fuso local e
    // erraria o aniversario por um dia.
    items: items.map(({ dataNascimento, ...c }) => ({
      ...c,
      idade: dataNascimento ? calcularIdade(dataNascimento) : null,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
})
