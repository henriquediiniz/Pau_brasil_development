import { ehFrontline, indexarFrontline, whereFrontline } from '@/lib/gente/frontline-cargo'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { empresaPadraoGente, podeEscreverNaOperacao } from '@/lib/gente/scope'
import {
  ORIGEM_LABEL,
  SELECT_CANDIDATO,
  SITUACAO_LABEL,
  SITUACOES,
  candidatoSchema,
  serializarCandidato,
  type CandidatoDoBanco,
  type OrigemCurriculo,
  type SituacaoCandidato,
} from '@/lib/gente/candidato'
import { resumirEtapas, type EtapaRegistrada } from '@/lib/gente/etapas'
import { ehFormatoExportacao, responderExportacao } from '@/lib/gente/responder-exportacao'
import { agruparCargos, grafiasDasChaves } from '@/lib/gente/cargo-agrupado'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

// ─── GET: lista paginada + exportação CSV ─────────────────────────────────────

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ items: [], total: 0, page: 1, pages: 0, semEscopo: true })
  }

  const url = req.nextUrl
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(
    200,
    Math.max(1, parseInt(url.searchParams.get('limit') ?? String(PAGE_SIZE)))
  )

  const situacao = url.searchParams.get('situacao')
  const operacaoId = url.searchParams.get('operacaoId')
  const setor = url.searchParams.get('setor')
  const origem = url.searchParams.get('origem')
  const vagaId = url.searchParams.get('vagaId')
  const q = url.searchParams.get('q')
  const apenasFrontline = url.searchParams.get('frontline') === '1'
  /** Chave de `chaveDeCargo`, vinda das opcoes de `cargos` desta mesma rota. */
  const cargoChave = url.searchParams.get('cargo')

  // `?export=xlsx` (padrão da tela) ou `?export=csv` para outras ferramentas.
  const exportBruto = url.searchParams.get('export')
  const formatoExport = ehFormatoExportacao(exportBruto) ? exportBruto : null

  const where: Record<string, unknown> = { ...escopo }

  if (situacao && (SITUACOES as readonly string[]).includes(situacao)) where.situacao = situacao
  if (setor === 'DPO' || setor === 'SPO') where.setor = setor
  if (origem) where.origemCurriculo = origem
  if (vagaId) where.vagaId = vagaId

  // O filtro de operação só estreita o escopo; nunca o amplia.
  if (operacaoId) {
    if (!podeEscreverNaOperacao(user, operacaoId)) {
      return NextResponse.json({ items: [], total: 0, page: 1, pages: 0 })
    }
    where.operacaoId = operacaoId
  }

  /*
    O filtro de frontline precisa entrar no `where`, e nao depois da consulta:
    a lista e paginada, e filtrar em memoria devolveria paginas de tamanhos
    aleatorios e contagem errada.
  */
  const [descritivos, cargosNoEscopo] = await Promise.all([
    prisma.recCargo.findMany({
      where: { ativo: true },
      take: 1000,
      select: { id: true, cargo: true, frontline: true },
    }),
    /*
      As grafias de cargo que existem, com quantos candidatos cada. Servem a
      tres coisas: as opcoes do filtro de cargo, e a traducao da chave
      escolhida (no filtro de cargo e no de frontline) para as grafias reais.
      O escopo e a operacao entram; os demais filtros nao, para a lista de
      opcoes nao encolher a cada escolha.
    */
    prisma.recCandidato.groupBy({
      by: ['cargo'],
      where: { ...escopo, ...(operacaoId ? { operacaoId } : {}) },
      _count: { _all: true },
    }),
  ])
  const descritivosFrontline = descritivos.filter((d) => d.frontline)
  const grafias = cargosNoEscopo.map((c) => c.cargo)
  const vazio = () => NextResponse.json({ items: [], total: 0, page: 1, pages: 0, cargos: [] })

  /*
    Cada filtro com OR entra numa lista AND. Antes, o de frontline e a busca
    gravavam ambos em `where.OR`, e a busca apagava o filtro de frontline
    quando os dois eram usados juntos.
  */
  const e: Record<string, unknown>[] = []

  if (apenasFrontline) {
    const filtro = whereFrontline(descritivosFrontline, grafias)
    // Nenhum cargo marcado significa nenhum candidato, e nao "mostrar todos".
    if (!filtro) return vazio()
    e.push(filtro)
  }

  if (cargoChave) {
    const doCargo = grafiasDasChaves(grafias, [cargoChave])
    if (doCargo.length === 0) return vazio()
    e.push({ cargo: { in: doCargo } })
  }

  if (q) {
    e.push({
      OR: [
        { nome: { contains: q, mode: 'insensitive' } },
        { cargo: { contains: q, mode: 'insensitive' } },
        { telefone: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { quemIndicou: { contains: q, mode: 'insensitive' } },
      ],
    })
  }

  if (e.length > 0) where.AND = e

  if (formatoExport) {
    const todos = await prisma.recCandidato.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: SELECT_CANDIDATO,
    })

    await audit({
      ...autor(user),
      action: 'GENTE_CANDIDATOS_EXPORTADOS',
      targetType: 'RecCandidato',
      meta: {
        total: todos.length,
        formato: formatoExport,
        filtros: { situacao, operacaoId, setor, origem, q, cargo: cargoChave },
      },
    })

    return responderExportacao(
      {
        titulo: 'Candidatos',
        cabecalhos: [
          'Nome', 'Unidade', 'Cargo', 'Telefone', 'E-mail', 'Mês', 'Setor',
          'Situação', 'Situação final', 'Data situação final',
          'Etapas aprovadas', 'Etapas aplicáveis', 'Progresso %', 'Origem', 'Quem indicou',
        ],
        linhas: todos.map((c) => {
          const r = resumirEtapas(c.etapas as unknown as EtapaRegistrada[])
          return [
            c.nome,
            c.operacao?.nome ?? null,
            c.cargo,
            c.telefone,
            c.email,
            c.mesProcesso,
            c.setor,
            SITUACAO_LABEL[c.situacao as SituacaoCandidato] ?? c.situacao,
            c.situacaoFinal
              ? SITUACAO_LABEL[c.situacaoFinal as SituacaoCandidato] ?? c.situacaoFinal
              : null,
            c.dataSituacaoFinal,
            r.aprovadas,
            r.aplicaveis,
            r.percentual,
            ORIGEM_LABEL[c.origemCurriculo as OrigemCurriculo] ?? c.origemCurriculo,
            c.quemIndicou,
          ]
        }),
      },
      'candidatos',
      formatoExport
    )
  }

  const [total, items] = await Promise.all([
    prisma.recCandidato.count({ where }),
    prisma.recCandidato.findMany({
      where,
      orderBy: [{ situacao: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: SELECT_CANDIDATO,
    }),
  ])

  /*
    Marca quem esta concorrendo a um cargo de frontline.

    Uma consulta so para todos os descritivos marcados, e o cruzamento em
    memoria — sao dezenas de cargos contra a pagina de candidatos, e resolver
    por candidato daria um N+1 no meio da listagem.
  */
  const indice = indexarFrontline(descritivosFrontline)

  return NextResponse.json({
    items: items.map((c) => {
      const serializado = serializarCandidato(c as unknown as CandidatoDoBanco)
      return {
        ...serializado,
        frontline: ehFrontline(
          { cargo: c.cargo, vagaCargoId: c.vaga?.cargoId ?? null },
          indice
        ),
      }
    }),
    total,
    page,
    pages: Math.ceil(total / limit),
    // Opcoes do filtro de cargo: grafias agrupadas, com o nome do descritivo.
    cargos: agruparCargos(
      cargosNoEscopo.map((c) => ({ cargo: c.cargo, total: c._count._all })),
      descritivos.map((d) => d.cargo)
    ),
  })
})

// ─── POST: cria candidato ─────────────────────────────────────────────────────

export const POST = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = candidatoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { vagaId, email, ...dados } = parsed.data

  if (!podeEscreverNaOperacao(user, dados.operacaoId)) {
    return NextResponse.json({ error: 'Operação fora do seu escopo' }, { status: 403 })
  }

  const operacao = await prisma.operacao.findUnique({
    where: { id: dados.operacaoId },
    select: { id: true, nome: true, empresaId: true },
  })
  if (!operacao) {
    return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })
  }

  // Vaga só pode ser vinculada se estiver dentro do mesmo escopo.
  if (vagaId) {
    const vaga = await prisma.recVaga.findFirst({
      where: { id: vagaId, ...auth.ctx.where },
      select: { id: true },
    })
    if (!vaga) {
      return NextResponse.json({ error: 'Vaga não encontrada no seu escopo' }, { status: 404 })
    }
  }

  const empresaId = operacao.empresaId ?? empresaPadraoGente(user)
  if (!empresaId) {
    return NextResponse.json({ error: 'Não foi possível determinar a empresa' }, { status: 400 })
  }

  const candidato = await prisma.recCandidato.create({
    data: {
      ...dados,
      email: email || null,
      vagaId: vagaId ?? null,
      empresaId,
    },
    select: SELECT_CANDIDATO,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_CANDIDATO_CRIADO',
    targetType: 'RecCandidato',
    targetId: candidato.id,
    meta: { nome: candidato.nome, operacao: operacao.nome, situacao: candidato.situacao },
  })

  return NextResponse.json(serializarCandidato(candidato as unknown as CandidatoDoBanco), {
    status: 201,
  })
})

// ─── PATCH: muda a situação de vários candidatos de uma vez ───────────────────

/** Uma página inteira selecionada, com folga; mais que isso é engano. */
const MAX_EM_MASSA = 200

/**
 * Pedido do RH (2026-10-07): passar vários candidatos de "Em andamento" para
 * "Em stand-by" (e vice-versa) sem abrir um por um.
 *
 * Muda só `situacao`, como o seletor da edição individual. A situação final e
 * a data dela são outra coisa — encerrar o processo de alguém pede a data de
 * cada um, e por isso não entram aqui.
 */
export const PATCH = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ error: 'Nenhum candidato encontrado' }, { status: 404 })
  }

  let body: { ids?: unknown; situacao?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const ids = Array.isArray(body.ids)
    ? Array.from(new Set(body.ids.filter((id): id is string => typeof id === 'string' && id !== '')))
    : []
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Nenhum candidato selecionado' }, { status: 400 })
  }
  if (ids.length > MAX_EM_MASSA) {
    return NextResponse.json({ error: `Máximo de ${MAX_EM_MASSA} por vez` }, { status: 400 })
  }

  const situacao = body.situacao
  if (typeof situacao !== 'string' || !(SITUACOES as readonly string[]).includes(situacao)) {
    return NextResponse.json({ error: 'Situação inválida' }, { status: 400 })
  }

  // O escopo vai junto com os ids: id de outra operação simplesmente não é
  // encontrado, e a resposta não distingue "não existe" de "não é seu".
  const alvos = await prisma.recCandidato.findMany({
    where: { id: { in: ids }, ...escopo },
    select: { id: true, situacao: true },
  })
  const mudar = alvos.filter((a) => a.situacao !== situacao).map((a) => a.id)

  if (mudar.length > 0) {
    await prisma.recCandidato.updateMany({
      where: { id: { in: mudar }, ...escopo },
      data: { situacao: situacao as SituacaoCandidato },
    })
  }

  await audit({
    ...autor(user),
    action: 'GENTE_CANDIDATOS_SITUACAO_EM_MASSA',
    targetType: 'RecCandidato',
    meta: { situacaoNova: situacao, alterados: mudar, jaEstavam: alvos.length - mudar.length },
  })

  return NextResponse.json({
    alterados: mudar.length,
    jaEstavam: alvos.length - mudar.length,
    naoEncontrados: ids.length - alvos.length,
  })
})
