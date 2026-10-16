import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { resolverEscopoGente } from '@/lib/gente/scope'
import { analisarPlanilhaQuadro, chaveColaborador } from '@/lib/gente/quadro-importador'
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

  const relatorio = analisarPlanilhaQuadro(linhas as LinhaPlanilha[], operacoes)

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
      // A prévia leva matrícula, que é o que o RH confere para saber se pegou
      // a coluna certa. CPF fica de fora: prévia é listagem, e listagem não
      // entrega dado pessoal.
      previa: relatorio.validos.slice(0, 20).map((c) => ({
        linha: c.linha,
        nome: c.nome,
        cargo: c.cargo,
        area: c.area,
        matricula: c.matricula,
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
        where: { id: { in: Array.from(new Set(relatorio.validos.map((c) => c.operacaoId))) } },
        select: { id: true, empresaId: true },
      })
    ).map((o) => [o.id, o.empresaId])
  )

  const preparados = relatorio.validos.flatMap((c) => {
    const empresaId = empresaPorOperacao.get(c.operacaoId)
    if (!empresaId) return []

    const { linha: _l, chaveDedupe, ...campos } = c
    return [{ registro: { ...campos, empresaId }, chave: chaveDedupe }]
  })

  const registros = preparados.map((p) => p.registro)

  /*
    Reimportar **sobrepoe**, nao duplica.

    A planilha do QLP e revisada e reenviada o tempo todo, e com `createMany`
    puro a segunda importacao criava copia de todo mundo — foi o que o RH viu,
    a mesma pessoa duas vezes na lista.

    A identidade e a mesma que o analisador ja usa dentro do arquivo
    (`chaveColaborador`): matricula quando existe, senao nome + operacao. Se as
    duas regras divergissem, voltaria a duplicar.

    Apaga-e-recria em vez de `update` um a um: sao duas consultas, nao N. Nada
    aponta para `QuadroColaborador`, entao trocar o id nao quebra vinculo.
  */
  const { criados, substituidos } = await prisma.$transaction(async (tx) => {
    const operacaoIds = Array.from(new Set(registros.map((r) => r.operacaoId)))

    const existentes = await tx.quadroColaborador.findMany({
      where: { operacaoId: { in: operacaoIds } },
      select: { id: true, operacaoId: true, nome: true, matricula: true },
    })

    const colididos = idsColididos(
      new Set(preparados.map((p) => p.chave)),
      existentes,
      chaveColaborador
    )
    if (colididos.length > 0) {
      await tx.quadroColaborador.deleteMany({ where: { id: { in: colididos } } })
    }

    const r = await tx.quadroColaborador.createMany({ data: registros })
    return { criados: r.count, substituidos: colididos.length }
  }, TRANSACAO_IMPORTACAO)

  await audit({
    ...autor(user),
    action: 'GENTE_QUADRO_IMPORTADO',
    targetType: 'QuadroColaborador',
    meta: { ...resumo, criados, substituidos },
  })

  return NextResponse.json({
    dryRun: false,
    resumo: { ...resumo, criados },
    observacao:
      substituidos > 0
        ? `${substituidos} já estavam cadastrados e foram substituídos pelos dados da planilha — reimportar atualiza, não duplica.`
        : 'Quem já estiver cadastrado é substituído pelos dados da planilha — reimportar atualiza, não duplica.',
  })
})
