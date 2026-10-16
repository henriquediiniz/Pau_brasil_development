import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { empresaPadraoGente, podeEscreverNaOperacao } from '@/lib/gente/scope'
import {
  SELECT_COLABORADOR,
  colaboradorSchema,
  registrarDesligamentoSchema,
} from '@/lib/gente/quadro'
import { formatarCpf } from '@/lib/gente/cpf'
import { ehFormatoExportacao, responderExportacao } from '@/lib/gente/responder-exportacao'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 100

/** Teto das acoes em massa: mantem a transacao curta e o engano reversivel. */
const MAX_EM_MASSA = 500

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ items: [], total: 0, page: 1, pages: 0, semEscopo: true })
  }

  const url = req.nextUrl
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(300, Math.max(1, parseInt(url.searchParams.get('limit') ?? String(PAGE_SIZE))))

  const operacaoId = url.searchParams.get('operacaoId')
  const area = url.searchParams.get('area')
  const q = url.searchParams.get('q')
  const incluirInativos = url.searchParams.get('incluirInativos') === 'true'

  // `?export=xlsx` (padrão da tela) ou `?export=csv` para outras ferramentas.
  const exportBruto = url.searchParams.get('export')
  const formatoExport = ehFormatoExportacao(exportBruto) ? exportBruto : null

  const where: Record<string, unknown> = { ...escopo }

  // Por padrão o quadro mostra quem está, não quem já saiu.
  if (!incluirInativos) where.ativo = true
  if (area) where.area = area

  if (operacaoId) {
    if (!podeEscreverNaOperacao(user, operacaoId)) {
      return NextResponse.json({ items: [], total: 0, page: 1, pages: 0 })
    }
    where.operacaoId = operacaoId
  }

  if (q) {
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { cargo: { contains: q, mode: 'insensitive' } },
      { area: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (formatoExport) {
    const todos = await prisma.quadroColaborador.findMany({
      where,
      orderBy: [{ nome: 'asc' }],
      select: SELECT_COLABORADOR,
    })

    await audit({
      ...autor(user),
      action: 'GENTE_QUADRO_EXPORTADO',
      targetType: 'QuadroColaborador',
      meta: {
        total: todos.length,
        formato: formatoExport,
        filtros: { operacaoId, area, q, incluirInativos },
      },
    })

    return responderExportacao(
      {
        titulo: 'Quadro',
        cabecalhos: [
          'Nome',
          'Matrícula',
          'CPF',
          'Unidade',
          'Cargo',
          'Área',
          'Admissão',
          'Ativo',
          'Vinculado ao portal',
        ],
        linhas: todos.map((c) => [
          c.nome,
          c.matricula,
          formatarCpf(c.cpf),
          c.operacao?.nome ?? null,
          c.cargo,
          c.area,
          c.dataAdmissao ? c.dataAdmissao.toISOString().slice(0, 10) : null,
          c.ativo ? 'Sim' : 'Não',
          c.user ? 'Sim' : 'Não',
        ]),
      },
      'quadro',
      formatoExport
    )
  }

  const [total, items, ativos] = await Promise.all([
    prisma.quadroColaborador.count({ where }),
    prisma.quadroColaborador.findMany({
      where,
      orderBy: [{ nome: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: SELECT_COLABORADOR,
    }),
    /*
      O "N no quadro ativo" do topo segue o filtro de operacao (PO,
      2026-10-07): filtrar Sousa e continuar vendo 209 de todas as unidades
      fazia o numero parecer errado. A busca por texto nao entra — ela acha
      pessoas, nao muda o tamanho do quadro.
    */
    prisma.quadroColaborador.count({
      where: { ...escopo, ativo: true, ...(operacaoId ? { operacaoId } : {}) },
    }),
  ])

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit), ativos })
})

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

  const parsed = colaboradorSchema.safeParse(body)
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
    select: { nome: true, empresaId: true },
  })
  if (!operacao) return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })

  const empresaId = operacao.empresaId ?? empresaPadraoGente(user)
  if (!empresaId) {
    return NextResponse.json({ error: 'Não foi possível determinar a empresa' }, { status: 400 })
  }

  const colaborador = await prisma.quadroColaborador.create({
    data: { ...dados, empresaId },
    select: SELECT_COLABORADOR,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_QUADRO_CRIADO',
    targetType: 'QuadroColaborador',
    targetId: colaborador.id,
    meta: { nome: colaborador.nome, operacao: operacao.nome },
  })

  return NextResponse.json(colaborador, { status: 201 })
})

/**
 * Acoes em massa sobre o quadro: excluir ou desligar os selecionados.
 *
 * Existe porque corrigir uma importacao errada, ou dar baixa numa leva de
 * desligamentos, e trabalho de dezenas de linhas — e uma a uma nao e tarefa
 * que se peca a alguem.
 *
 * As regras nao afrouxam por ser em massa: cada id passa pelo escopo do
 * usuario, e desligar em massa cria o registro de desligamento de cada pessoa,
 * exatamente como a acao individual faz. Desligar nao apaga: o colaborador sai
 * do quadro ativo e o historico permanece.
 */
export const DELETE = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ error: 'Nenhum colaborador encontrado' }, { status: 404 })
  }

  let body: { ids?: unknown; acao?: unknown; dataDesligamento?: unknown; motivo?: unknown; setor?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const ids = Array.isArray(body.ids)
    ? Array.from(new Set(body.ids.filter((id): id is string => typeof id === 'string' && id !== '')))
    : []

  if (ids.length === 0) {
    return NextResponse.json({ error: 'Nenhum colaborador selecionado' }, { status: 400 })
  }
  if (ids.length > MAX_EM_MASSA) {
    return NextResponse.json({ error: `Máximo de ${MAX_EM_MASSA} por vez` }, { status: 400 })
  }

  // O escopo entra no `where` junto com os ids: um id de outra operacao
  // simplesmente nao e encontrado, e a resposta nao distingue "nao existe" de
  // "nao e seu".
  const alvos = await prisma.quadroColaborador.findMany({
    where: { id: { in: ids }, ...escopo },
    select: {
      id: true,
      empresaId: true,
      operacaoId: true,
      userId: true,
      nome: true,
      cargo: true,
      area: true,
      ativo: true,
      operacao: { select: { nome: true } },
    },
  })

  if (alvos.length === 0) {
    return NextResponse.json({ error: 'Nenhum colaborador encontrado' }, { status: 404 })
  }

  // ── Desligar: cria o registro de cada um e tira do quadro ativo ──
  if (body.acao === 'desligar') {
    const parsed = registrarDesligamentoSchema.safeParse({
      dataDesligamento: body.dataDesligamento,
      motivo: body.motivo,
      setor: body.setor,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { dataDesligamento, motivo, setor } = parsed.data

    // Quem ja esta fora do quadro nao e desligado de novo: geraria um segundo
    // registro de desligamento para a mesma saida.
    const ativos = alvos.filter((c) => c.ativo)
    if (ativos.length === 0) {
      return NextResponse.json(
        { error: 'Os selecionados já estão fora do quadro ativo' },
        { status: 400 }
      )
    }

    // Forma em lista: um batch so, sem o limite de 5 s da forma interativa.
    await prisma.$transaction([
      prisma.quadroDesligamento.createMany({
        data: ativos.map((c) => ({
          empresaId: c.empresaId,
          operacaoId: c.operacaoId,
          userId: c.userId,
          nome: c.nome,
          cargo: c.cargo,
          area: c.area,
          setor: setor ?? null,
          dataDesligamento,
          motivo: motivo ?? null,
        })),
      }),
      prisma.quadroColaborador.updateMany({
        where: { id: { in: ativos.map((c) => c.id) } },
        data: { ativo: false },
      }),
    ])

    await audit({
      ...autor(user),
      action: 'GENTE_QUADRO_DESLIGADOS_EM_MASSA',
      targetType: 'QuadroColaborador',
      meta: {
        pedidos: ids.length,
        desligados: ativos.length,
        dataDesligamento: dataDesligamento.toISOString().slice(0, 10),
        motivo: motivo ?? null,
        // Sinaliza para a Fase 3: desligado com conta no portal deveria
        // disparar revisao de acesso.
        comUsuarioNoPortal: ativos.filter((c) => c.userId).length,
        operacoes: Array.from(
          new Set(ativos.map((c) => c.operacao?.nome).filter((nome): nome is string => Boolean(nome)))
        ),
      },
    })

    return NextResponse.json({
      desligados: ativos.length,
      jaInativos: alvos.length - ativos.length,
    })
  }

  // ── Excluir: apaga o cadastro ──
  const excluidos = (
    await prisma.quadroColaborador.deleteMany({ where: { id: { in: alvos.map((c) => c.id) } } })
  ).count

  await audit({
    ...autor(user),
    action: 'GENTE_QUADRO_EXCLUIDOS_EM_MASSA',
    targetType: 'QuadroColaborador',
    meta: {
      pedidos: ids.length,
      excluidos,
      operacoes: Array.from(
        new Set(alvos.map((c) => c.operacao?.nome).filter((nome): nome is string => Boolean(nome)))
      ),
    },
  })

  return NextResponse.json({ excluidos })
})
