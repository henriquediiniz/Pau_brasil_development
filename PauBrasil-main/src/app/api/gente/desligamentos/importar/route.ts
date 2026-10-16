import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { resolverEscopoGente } from '@/lib/gente/scope'
import { analisarPlanilhaDesligamentos, chaveDesligamento } from '@/lib/gente/quadro-importador'
import { idsColididos, TRANSACAO_IMPORTACAO } from '@/lib/gente/sobreposicao'
import type { LinhaPlanilha, OperacaoRef } from '@/lib/gente/vaga-importador'

export const dynamic = 'force-dynamic'

const MAX_LINHAS = 3000

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
    return NextResponse.json({ error: `Máximo de ${MAX_LINHAS} linhas por importação` }, { status: 400 })
  }

  const operacoes: OperacaoRef[] = await prisma.operacao.findMany({
    where: {
      ativo: true,
      ...(escopo.tipo === 'operacoes'
        ? {
            id: { in: escopo.operacaoIds },
            ...(escopo.empresaId ? { empresaId: escopo.empresaId } : {}),
          }
        : {}),
    },
    select: { id: true, nome: true, nomeAbrev: true },
  })

  const relatorio = analisarPlanilhaDesligamentos(linhas as LinhaPlanilha[], operacoes)

  const resumo = {
    total: relatorio.total,
    validos: relatorio.validos.length,
    comErro: relatorio.erros.length,
    avisos: relatorio.avisos.length,
    duplicados: relatorio.duplicados.length,
  }

  if (body.confirmar !== true) {
    return NextResponse.json({
      dryRun: true,
      resumo,
      previa: relatorio.validos.slice(0, 20).map((d) => ({
        linha: d.linha,
        nome: d.nome,
        cargo: d.cargo,
        data: d.dataDesligamento.toISOString().slice(0, 10),
      })),
      erros: relatorio.erros.slice(0, 100),
      avisos: relatorio.avisos.slice(0, 100),
      duplicados: relatorio.duplicados.slice(0, 100),
    })
  }

  if (relatorio.validos.length === 0) {
    return NextResponse.json({ error: 'Nenhuma linha válida para importar', resumo }, { status: 400 })
  }

  const empresaPorOperacao = new Map(
    (
      await prisma.operacao.findMany({
        where: { id: { in: Array.from(new Set(relatorio.validos.map((d) => d.operacaoId))) } },
        select: { id: true, empresaId: true },
      })
    ).map((o) => [o.id, o.empresaId])
  )

  const preparados = relatorio.validos.flatMap((d) => {
    const empresaId = empresaPorOperacao.get(d.operacaoId)
    if (!empresaId) return []

    const { linha: _l, chaveDedupe, ...campos } = d
    return [{ registro: { ...campos, empresaId }, chave: chaveDedupe }]
  })

  const registros = preparados.map((p) => p.registro)

  // Importar desligamento NÃO mexe no quadro de lotação: a planilha de
  // desligados costuma trazer histórico antigo, de gente que nunca esteve no
  // QLP importado. Dar baixa automática apagaria quadro ativo por engano.
  /*
    Reimportar **sobrepoe**. A identidade inclui a data: a mesma pessoa pode
    ser desligada mais de uma vez (recontratacao), e sao dois registros — nao
    um corrigido. So colide quem tem pessoa, operacao **e data** iguais.

    Nada aponta para `QuadroDesligamento`, entao apagar e recriar e seguro.
  */
  const { criados, substituidos } = await prisma.$transaction(async (tx) => {
    const operacaoIds = Array.from(new Set(registros.map((r) => r.operacaoId)))

    const existentes = await tx.quadroDesligamento.findMany({
      where: { operacaoId: { in: operacaoIds } },
      select: { id: true, operacaoId: true, nome: true, dataDesligamento: true },
    })

    const colididos = idsColididos(
      new Set(preparados.map((p) => p.chave)),
      existentes,
      chaveDesligamento
    )
    if (colididos.length > 0) {
      await tx.quadroDesligamento.deleteMany({ where: { id: { in: colididos } } })
    }

    const r = await tx.quadroDesligamento.createMany({ data: registros })
    return { criados: r.count, substituidos: colididos.length }
  }, TRANSACAO_IMPORTACAO)

  await audit({
    ...autor(user),
    action: 'GENTE_DESLIGAMENTOS_IMPORTADOS',
    targetType: 'QuadroDesligamento',
    meta: { ...resumo, criados, substituidos, observacao: 'importação não altera o quadro de lotação' },
  })

  return NextResponse.json({
    dryRun: false,
    resumo: { ...resumo, criados },
    observacao:
      (substituidos > 0
        ? `${substituidos} já estavam registrados com a mesma data e foram substituídos — reimportar não duplica. `
        : '') +
      'O quadro de lotação não foi alterado — se alguém ainda aparece como ativo no QLP, desligue pela tela do quadro.',
  })
})
