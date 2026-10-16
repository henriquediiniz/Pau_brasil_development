import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { canViewDadoSensivel } from '@/lib/auth-helpers'
import { autenticarGente, autor } from '@/lib/gente/api'
import { empresaPadraoGente, podeEscreverNaOperacao } from '@/lib/gente/scope'
import {
  SELECT_VAGA,
  STATUS_VAGA,
  serializarVaga,
  vagaSchema,
  type VagaDoBanco,
} from '@/lib/gente/vaga'
import { STATUS_FECHAMENTO_LABEL } from '@/lib/gente/vaga-sla'
import { ehFormatoExportacao, responderExportacao } from '@/lib/gente/responder-exportacao'

/** Rótulos legíveis na planilha, em vez dos valores crus do enum. */
const STATUS_LABEL: Record<string, string> = {
  ABERTA: 'Aberta',
  FECHADA: 'Fechada',
  CANCELADA: 'Cancelada',
}

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

/** Teto da exclusao em massa: mantem a transacao curta e o engano reversivel. */
const MAX_EXCLUSAO = 200

// ─── GET: lista paginada + exportação CSV ─────────────────────────────────────

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  // Sem escopo o usuário não enxerga nada — devolve vazio sem ir ao banco.
  if (escopo === null) {
    return NextResponse.json({ items: [], total: 0, page: 1, pages: 0, semEscopo: true })
  }

  const url = req.nextUrl
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(
    200,
    Math.max(1, parseInt(url.searchParams.get('limit') ?? String(PAGE_SIZE)))
  )

  const status = url.searchParams.get('status')
  const operacaoId = url.searchParams.get('operacaoId')
  const departamento = url.searchParams.get('departamento')
  const frontline = url.searchParams.get('frontline')
  const q = url.searchParams.get('q')

  // `?export=xlsx` (padrão da tela) ou `?export=csv` para outras ferramentas.
  const exportBruto = url.searchParams.get('export')
  const formatoExport = ehFormatoExportacao(exportBruto) ? exportBruto : null

  const where: Record<string, unknown> = { ...escopo }

  if (status && (STATUS_VAGA as readonly string[]).includes(status)) where.status = status
  if (departamento === 'DPO' || departamento === 'SPO') where.departamento = departamento
  if (frontline) where.frontline = frontline

  // O filtro de operação só estreita o escopo; nunca o amplia.
  if (operacaoId) {
    if (!podeEscreverNaOperacao(user, operacaoId)) {
      return NextResponse.json({ items: [], total: 0, page: 1, pages: 0 })
    }
    where.operacaoId = operacaoId
  }

  if (q) {
    where.OR = [
      { cargo: { contains: q, mode: 'insensitive' } },
      { area: { contains: q, mode: 'insensitive' } },
      { nomeContratado: { contains: q, mode: 'insensitive' } },
      { colaboradorAnterior: { contains: q, mode: 'insensitive' } },
      { responsavelVaga: { contains: q, mode: 'insensitive' } },
      { codigo: { contains: q, mode: 'insensitive' } },
    ]
  }

  const podeVerSalario = canViewDadoSensivel(user)

  if (formatoExport) {
    const todas = await prisma.recVaga.findMany({
      where,
      orderBy: { dataAbertura: 'desc' },
      select: SELECT_VAGA,
    })

    await audit({
      ...autor(user),
      action: 'GENTE_VAGAS_EXPORTADAS',
      targetType: 'RecVaga',
      meta: {
        total: todas.length,
        formato: formatoExport,
        filtros: { status, operacaoId, departamento, frontline, q },
        incluiSalario: podeVerSalario,
      },
    })

    return responderExportacao(
      {
        titulo: 'Vagas',
        cabecalhos: [
          'Código', 'Unidade', 'Departamento', 'Cargo', 'Área', 'Qtd',
          ...(podeVerSalario ? ['Salário'] : []),
          'Abertura', 'Previsão', 'Contratação', 'Dias em aberto', 'Dias de atraso',
          'Status', 'Situação do prazo', 'Responsável', 'Solicitante', 'Contratado',
        ],
        linhas: todas.map((v) => {
          const item = serializarVaga(v as unknown as VagaDoBanco, podeVerSalario)
          return [
            v.codigo,
            v.operacao?.nome ?? null,
            v.departamento,
            v.cargo,
            v.area,
            v.quantidadeVagas,
            ...(podeVerSalario ? [v.salario === null ? null : Number(v.salario)] : []),
            v.dataAbertura,
            v.dataPrevistaFechamento,
            v.dataContratacao,
            item.sla.diasEmAberto,
            item.sla.diasDeAtraso,
            STATUS_LABEL[v.status] ?? v.status,
            item.sla.statusFechamento
              ? STATUS_FECHAMENTO_LABEL[item.sla.statusFechamento]
              : null,
            v.responsavelVaga,
            v.solicitanteVaga,
            v.nomeContratado,
          ]
        }),
      },
      'vagas',
      formatoExport
    )
  }

  const [total, items] = await Promise.all([
    prisma.recVaga.count({ where }),
    prisma.recVaga.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dataAbertura: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: SELECT_VAGA,
    }),
  ])

  return NextResponse.json({
    items: items.map((v) => serializarVaga(v as unknown as VagaDoBanco, podeVerSalario)),
    total,
    page,
    pages: Math.ceil(total / limit),
    podeVerSalario,
  })
})

// ─── POST: cria vaga ──────────────────────────────────────────────────────────

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

  const parsed = vagaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const dados = parsed.data

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

  // A empresa vem da operação, não do corpo da requisição — assim ninguém
  // cria registro em outra empresa passando um id diferente no JSON.
  const empresaId = operacao.empresaId ?? empresaPadraoGente(user)
  if (!empresaId) {
    return NextResponse.json({ error: 'Não foi possível determinar a empresa' }, { status: 400 })
  }

  /*
    O descritivo vinculado precisa ser da mesma empresa. Sem esta checagem,
    mandar um `cargoId` de outra empresa no JSON criaria uma vaga apontando
    para um descritivo que o usuário não pode nem ver — e o verificador de
    aderência passaria a comparar contra ele.
  */
  if (dados.cargoId) {
    const descritivo = await prisma.recCargo.findFirst({
      where: { id: dados.cargoId, empresaId },
      select: { id: true },
    })
    if (!descritivo) {
      return NextResponse.json(
        { error: 'Descritivo de cargo não encontrado nesta empresa' },
        { status: 400 }
      )
    }
  }

  const vaga = await prisma.recVaga.create({
    data: { ...dados, empresaId, unidadeTexto: operacao.nome },
    select: SELECT_VAGA,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_VAGA_CRIADA',
    targetType: 'RecVaga',
    targetId: vaga.id,
    meta: { cargo: vaga.cargo, operacao: operacao.nome, status: vaga.status },
  })

  return NextResponse.json(
    serializarVaga(vaga as unknown as VagaDoBanco, canViewDadoSensivel(user)),
    { status: 201 }
  )
})

/**
 * Exclusao em massa: as vagas que o RH marcou na lista.
 *
 * Existe porque corrigir uma planilha importada errada exige apagar dezenas de
 * vagas, e uma a uma nao e tarefa que se peca a alguem.
 *
 * As regras nao afrouxam por ser em massa: cada vaga passa pelo escopo do
 * usuario, e vaga com candidato vinculado continua intocada — e historico de
 * processo seletivo. A resposta diz o que ficou e por que.
 */
export const DELETE = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Nenhuma vaga encontrada' }, { status: 404 })

  let body: { ids?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const ids = Array.isArray(body.ids)
    ? Array.from(new Set(body.ids.filter((id): id is string => typeof id === 'string' && id !== '')))
    : []

  if (ids.length === 0) {
    return NextResponse.json({ error: 'Nenhuma vaga selecionada' }, { status: 400 })
  }
  if (ids.length > MAX_EXCLUSAO) {
    return NextResponse.json(
      { error: `Máximo de ${MAX_EXCLUSAO} vagas por vez` },
      { status: 400 }
    )
  }

  /*
    O escopo entra no `where` junto com os ids: um id de outra operacao
    simplesmente nao e encontrado, e a resposta nao distingue "nao existe" de
    "nao e sua".
  */
  const candidatas = await prisma.recVaga.findMany({
    where: { id: { in: ids }, ...escopo },
    select: {
      id: true,
      cargo: true,
      status: true,
      operacao: { select: { nome: true } },
      _count: { select: { candidatos: true } },
    },
  })

  if (candidatas.length === 0) {
    return NextResponse.json({ error: 'Nenhuma vaga encontrada' }, { status: 404 })
  }

  const removiveis = candidatas.filter((v) => v._count.candidatos === 0)
  const mantidas = candidatas.filter((v) => v._count.candidatos > 0)

  const removidas =
    removiveis.length > 0
      ? (await prisma.recVaga.deleteMany({ where: { id: { in: removiveis.map((v) => v.id) } } }))
          .count
      : 0

  await audit({
    ...autor(user),
    action: 'GENTE_VAGAS_EXCLUIDAS_EM_MASSA',
    targetType: 'RecVaga',
    meta: {
      pedidas: ids.length,
      removidas,
      mantidas: mantidas.length,
      operacoes: Array.from(
        new Set(candidatas.map((v) => v.operacao?.nome).filter((n): n is string => Boolean(n)))
      ),
    },
  })

  return NextResponse.json({
    removidas,
    mantidas: mantidas.map((v) => ({ id: v.id, cargo: v.cargo, candidatos: v._count.candidatos })),
  })
})
