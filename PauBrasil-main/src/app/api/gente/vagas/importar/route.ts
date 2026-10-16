import { randomUUID } from 'crypto'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { resolverEscopoGente } from '@/lib/gente/scope'
import {
  analisarPlanilhaVagas,
  type LinhaPlanilha,
  type OperacaoRef,
} from '@/lib/gente/vaga-importador'

export const dynamic = 'force-dynamic'

/** Teto por lote: mantém a transação curta e a resposta legível na tela. */
const MAX_LINHAS = 2000

export const POST = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  const escopo = resolverEscopoGente(user)
  if (escopo.tipo === 'nenhuma') {
    return NextResponse.json(
      { error: 'Seu usuário não tem operação atribuída. Peça ao administrador para cadastrar.' },
      { status: 403 }
    )
  }

  let body: { linhas?: unknown; confirmar?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const linhas = body.linhas
  if (!Array.isArray(linhas) || linhas.length === 0) {
    return NextResponse.json({ error: 'Nenhuma linha enviada' }, { status: 400 })
  }
  if (linhas.length > MAX_LINHAS) {
    return NextResponse.json(
      { error: `Máximo de ${MAX_LINHAS} linhas por importação` },
      { status: 400 }
    )
  }

  // Só as operações que o usuário pode gravar entram na lista de destino.
  // Uma unidade fora do escopo não "não casa": ela simplesmente não existe
  // para este usuário, e a linha é recusada com a mesma mensagem.
  const operacoes: OperacaoRef[] = await prisma.operacao.findMany({
    where: {
      ativo: true,
      ...(escopo.tipo === 'operacoes'
        ? { id: { in: escopo.operacaoIds }, ...(escopo.empresaId ? { empresaId: escopo.empresaId } : {}) }
        : {}),
    },
    select: { id: true, nome: true, nomeAbrev: true },
  })

  /*
    Descritivos da empresa, para a vaga importada ja nascer vinculada em vez de
    depender do nome digitado depois. So os cargos que o usuario enxerga: um
    descritivo de outra empresa nao pode virar o vinculo de uma vaga daqui.
  */
  const descritivos = await prisma.recCargo.findMany({
    // SYS_ADMIN (`tipo: 'todas'`) nao tem recorte de empresa; os demais so
    // enxergam a propria.
    where: {
      ativo: true,
      ...(escopo.tipo === 'operacoes' && escopo.empresaId ? { empresaId: escopo.empresaId } : {}),
    },
    take: 2000,
    select: { id: true, cargo: true },
  })

  const relatorio = analisarPlanilhaVagas(linhas as LinhaPlanilha[], operacoes, descritivos)

  const resumo = {
    total: relatorio.total,
    validas: relatorio.validas.length,
    comErro: relatorio.erros.length,
    avisos: relatorio.avisos.length,
    duplicadas: relatorio.duplicadas.length,
  }

  // ── Dry-run: o padrão. Só grava quando `confirmar === true`. ──
  if (body.confirmar !== true) {
    return NextResponse.json({
      dryRun: true,
      resumo,
      // Amostra: a tela mostra o suficiente para decidir sem despejar 2000 itens.
      previa: relatorio.validas.slice(0, 20),
      erros: relatorio.erros.slice(0, 100),
      avisos: relatorio.avisos.slice(0, 100),
      duplicadas: relatorio.duplicadas.slice(0, 100),
      operacoesDisponiveis: operacoes.map((o) => o.nome),
    })
  }

  if (relatorio.validas.length === 0) {
    return NextResponse.json(
      { error: 'Nenhuma linha válida para importar', resumo },
      { status: 400 }
    )
  }

  // Empresa vem sempre da operação de destino, nunca do arquivo.
  const empresaPorOperacao = new Map(
    (
      await prisma.operacao.findMany({
        where: { id: { in: Array.from(new Set(relatorio.validas.map((v) => v.operacaoId))) } },
        select: { id: true, empresaId: true },
      })
    ).map((o) => [o.id, o.empresaId])
  )

  /*
    Carimbo do lote. Toda vaga deste arquivo nasce com o mesmo `importacaoId`,
    e e so por ele que o "desfazer importacao" apaga — sem encostar no que foi
    cadastrado a mao nem em importacoes anteriores. Vem do servidor, nunca do
    corpo da requisicao.
  */
  const importacaoId = randomUUID()

  const registros = relatorio.validas.flatMap((v) => {
    const empresaId = empresaPorOperacao.get(v.operacaoId)
    if (!empresaId) return []

    const { linha: _linha, chaveDedupe: _chave, ...campos } = v
    return [{ ...campos, empresaId, importacaoId }]
  })

  const criadas = await prisma.$transaction(async (tx) => {
    const resultado = await tx.recVaga.createMany({ data: registros })
    return resultado.count
  })

  await audit({
    ...autor(user),
    action: 'GENTE_VAGAS_IMPORTADAS',
    targetType: 'RecVaga',
    meta: {
      ...resumo,
      criadas,
      importacaoId,
      operacoes: Array.from(new Set(relatorio.validas.map((v) => v.operacaoId))),
    },
  })

  return NextResponse.json({
    dryRun: false,
    resumo: { ...resumo, criadas },
    avisos: relatorio.avisos.slice(0, 100),
    // A tela usa para oferecer o desfazer logo apos importar, que e quando o
    // RH percebe que a planilha veio errada.
    importacaoId,
  })
})
