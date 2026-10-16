/**
 * Lotes de importação de vagas: listar e desfazer.
 *
 * GET    → os lotes que o usuário pode desfazer, dentro do escopo dele.
 * DELETE → apaga um lote inteiro (`{ chave }`), respeitando as mesmas regras
 *          da exclusão avulsa: escopo da operação e vaga com candidato fica.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { agruparEmLotes, alvoDaChave, type VagaDoLote } from '@/lib/gente/vaga-lotes'

export const dynamic = 'force-dynamic'

/**
 * Teto da varredura. Desfazer é uma operação de correção recente; carregar o
 * histórico inteiro só para montar a lista pesaria sem servir a ninguém.
 */
const MAX_VAGAS = 5000

/** Um minuto, em milissegundos — a janela do lote inferido pelo horário. */
const JANELA_MINUTO = 60_000

/** As vagas do escopo, no formato que o agrupador espera. */
async function carregarVagas(escopo: Record<string, unknown>): Promise<VagaDoLote[]> {
  const vagas = await prisma.recVaga.findMany({
    where: escopo,
    orderBy: { createdAt: 'desc' },
    take: MAX_VAGAS,
    select: {
      id: true,
      importacaoId: true,
      createdAt: true,
      cargo: true,
      operacao: { select: { nome: true } },
      _count: { select: { candidatos: true } },
    },
  })

  return vagas.map((v) => ({
    id: v.id,
    importacaoId: v.importacaoId,
    createdAt: v.createdAt,
    cargo: v.cargo,
    operacaoNome: v.operacao?.nome ?? null,
    temCandidatos: v._count.candidatos > 0,
  }))
}

export const GET = withHandler(async () => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ lotes: [] })

  return NextResponse.json({ lotes: agruparEmLotes(await carregarVagas(escopo)) })
})

export const DELETE = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 })

  let body: { chave?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const chave = typeof body.chave === 'string' ? body.chave : ''
  const alvo = alvoDaChave(chave)
  if (!alvo) return NextResponse.json({ error: 'Lote inválido' }, { status: 400 })

  /*
    O filtro nasce do escopo do usuário, e o lote só o estreita. Assim uma
    chave vinda do cliente nunca amplia o alcance: no pior caso ela seleciona
    menos vagas, nunca as de outra operação.
  */
  const where = {
    ...escopo,
    ...(alvo.importacaoId
      ? { importacaoId: alvo.importacaoId }
      : {
          importacaoId: null,
          createdAt: {
            gte: alvo.minutoInicio!,
            lt: new Date(alvo.minutoInicio!.getTime() + JANELA_MINUTO),
          },
        }),
  }

  const candidatas = await prisma.recVaga.findMany({
    where,
    select: {
      id: true,
      cargo: true,
      operacao: { select: { nome: true } },
      _count: { select: { candidatos: true } },
    },
  })

  if (candidatas.length === 0) {
    return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 })
  }

  // Mesma regra da exclusão avulsa: candidato vinculado é histórico de
  // processo seletivo. A vaga fica, e o RH é avisado de quais sobraram.
  const removiveis = candidatas.filter((v) => v._count.candidatos === 0)
  const mantidas = candidatas.filter((v) => v._count.candidatos > 0)

  const removidas =
    removiveis.length > 0
      ? (await prisma.recVaga.deleteMany({ where: { id: { in: removiveis.map((v) => v.id) } } }))
          .count
      : 0

  await audit({
    ...autor(user),
    action: 'GENTE_VAGAS_IMPORTACAO_DESFEITA',
    targetType: 'RecVaga',
    meta: {
      chave,
      removidas,
      mantidas: mantidas.length,
      operacoes: Array.from(
        new Set(candidatas.map((v) => v.operacao?.nome).filter((n): n is string => Boolean(n)))
      ),
    },
  })

  return NextResponse.json({
    removidas,
    mantidas: mantidas.map((v) => ({ cargo: v.cargo, candidatos: v._count.candidatos })),
  })
})
