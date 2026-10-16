import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { resolverEscopoGente } from '@/lib/gente/scope'
import { analisarPlanilhaCandidatos, chaveCandidato } from '@/lib/gente/candidato-importador'
import { parearPorChave } from '@/lib/gente/sobreposicao'
import { definicaoEtapa } from '@/lib/gente/etapas'
import type { LinhaPlanilha, OperacaoRef } from '@/lib/gente/vaga-importador'

export const dynamic = 'force-dynamic'

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

  // Só as operações que o usuário pode gravar são destino possível.
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

  const relatorio = analisarPlanilhaCandidatos(linhas as LinhaPlanilha[], operacoes)

  const resumo = {
    total: relatorio.total,
    validos: relatorio.validos.length,
    comErro: relatorio.erros.length,
    avisos: relatorio.avisos.length,
    duplicados: relatorio.duplicados.length,
  }

  // ── Dry-run é o padrão ──
  if (body.confirmar !== true) {
    return NextResponse.json({
      dryRun: true,
      resumo,
      previa: relatorio.validos.slice(0, 20).map((c) => ({
        linha: c.linha,
        nome: c.nome,
        cargo: c.cargo,
        situacao: c.situacao,
        etapas: c.etapas.length,
      })),
      erros: relatorio.erros.slice(0, 100),
      avisos: relatorio.avisos.slice(0, 100),
      duplicados: relatorio.duplicados.slice(0, 100),
      operacoesDisponiveis: operacoes.map((o) => o.nome),
    })
  }

  if (relatorio.validos.length === 0) {
    return NextResponse.json(
      { error: 'Nenhuma linha válida para importar', resumo },
      { status: 400 }
    )
  }

  const empresaPorOperacao = new Map(
    (
      await prisma.operacao.findMany({
        where: { id: { in: Array.from(new Set(relatorio.validos.map((c) => c.operacaoId))) } },
        select: { id: true, empresaId: true },
      })
    ).map((o) => [o.id, o.empresaId])
  )

  /*
    Candidato e etapas nascem juntos: `createMany` não cria os filhos, então
    cada pessoa vai num `create` aninhado.

    O lote vai na forma em lista, e não em `$transaction(async tx => ...)`:
    na forma interativa cada `await` é uma ida e volta e o limite é de 5s, o
    que estoura numa planilha de algumas dezenas de candidatos (foi o que
    aconteceu na importação de cargos, com P2028). A forma em lista manda tudo
    de uma vez e continua atômica.
  */
  const validos = relatorio.validos.flatMap((c) => {
    const empresaId = empresaPorOperacao.get(c.operacaoId)
    if (!empresaId) return []
    return [{ ...c, empresaId }]
  })

  /*
    Reimportar **sobrepoe**, e aqui a sobreposicao nao pode apagar.

    O candidato carrega o processo seletivo: etapas avaliadas, quem avaliou e
    quando, notas. Nada disso esta na planilha. Apagar para recriar jogaria
    fora o historico de quem ja esta em andamento — e o RH reimporta a
    planilha justamente enquanto o processo corre.

    Entao quem ja existe e **atualizado** no cadastro, e as etapas ficam como
    estao. Quem e novo entra com o processo completo.
  */
  const chavesQueChegam = new Set(validos.map((c) => c.chaveDedupe))

  const existentes = await prisma.recCandidato.findMany({
    where: {
      OR: [
        { telefone: { not: null } },
        { operacaoId: { in: Array.from(new Set(validos.map((c) => c.operacaoId))) } },
      ],
    },
    select: { id: true, operacaoId: true, nome: true, telefone: true },
  })

  const { atualizar, criar } = parearPorChave(
    validos,
    (c) => c.chaveDedupe,
    // So os que podem colidir: casar a base inteira aumentaria o custo sem
    // mudar o resultado.
    existentes.filter((e) => chavesQueChegam.has(chaveCandidato(e))),
    chaveCandidato
  )

  const gravacoes = [
    ...criar.map(({ linha: _l, chaveDedupe: _c, etapas, ...campos }) =>
      prisma.recCandidato.create({
        data: {
          ...campos,
          etapas: {
            create: etapas.map((e) => ({
              chave: e.chave,
              ordem: definicaoEtapa(e.chave).ordem,
              resultado: e.resultado,
              avaliadoPor: user.id,
              avaliadoEm: new Date(),
            })),
          },
        },
      })
    ),
    /*
      `situacao` e as etapas ficam de fora do update: quem avancou no pipeline
      pela tela nao pode ser puxado de volta para o estagio que a planilha
      registrava quando foi exportada. A planilha atualiza o cadastro, nao o
      andamento.
    */
    ...atualizar.map(({ antigo, novo }) => {
      const {
        linha: _l,
        chaveDedupe: _c,
        etapas: _e,
        situacao: _s,
        situacaoFinal: _sf,
        dataSituacaoFinal: _d,
        ...campos
      } = novo
      return prisma.recCandidato.update({ where: { id: antigo.id }, data: campos })
    }),
  ]

  // Forma em lista: um batch so, sem o limite de 5 s da forma interativa.
  await prisma.$transaction(gravacoes)
  const criados = criar.length
  const atualizados = atualizar.length

  await audit({
    ...autor(user),
    action: 'GENTE_CANDIDATOS_IMPORTADOS',
    targetType: 'RecCandidato',
    meta: {
      ...resumo,
      criados,
      atualizados,
      operacoes: Array.from(new Set(relatorio.validos.map((c) => c.operacaoId))),
    },
  })

  return NextResponse.json({
    dryRun: false,
    resumo: { ...resumo, criados: criados + atualizados },
    avisos: relatorio.avisos.slice(0, 100),
    observacao:
      (atualizados > 0
        ? `${atualizados} já estavam cadastrados e tiveram os dados atualizados — reimportar não duplica. `
        : 'Quem já estiver cadastrado é atualizado, não duplicado. ') +
      'As etapas já avaliadas e a situação no pipeline não são alteradas pela planilha.',
  })
})
