import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { empresaPadraoGente } from '@/lib/gente/scope'
import { analisarPlanilhaCargos } from '@/lib/gente/cargo-importador'
import { normalizar, type LinhaPlanilha } from '@/lib/gente/vaga-importador'

export const dynamic = 'force-dynamic'

/**
 * Importação dos descritivos de cargo.
 *
 * Não usa `criarRotaImportacao` de propósito. A fábrica resolve a empresa a
 * partir da operação de destino de cada linha, e o descritivo não tem operação
 * — é da empresa inteira. Forçar cargos lá dentro exigiria afrouxar o tipo da
 * fábrica para as outras sete importações, que dependem do escopo por
 * operação para não gravar fora do lugar.
 *
 * O contrato com a tela é o mesmo das demais: dry-run por padrão, grava só com
 * `confirmar: true`, e audita ao final.
 */

const MAX_LINHAS = 2000

export const POST = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  const empresaId = empresaPadraoGente(user)
  if (!empresaId) {
    return NextResponse.json(
      { error: 'Seu usuário não está vinculado a uma empresa' },
      { status: 400 }
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

  const relatorio = analisarPlanilhaCargos(linhas as LinhaPlanilha[])

  // Quais já existem: o RH precisa saber, antes de confirmar, quantos
  // descritivos vão ser reescritos. "Importei e perdi o texto que eu tinha
  // ajustado na tela" é o acidente que esta contagem evita.
  const existentes = await prisma.recCargo.findMany({
    where: { empresaId },
    select: { id: true, cargo: true, area: true },
  })
  const idPorChave = new Map(
    // Mesma normalizacao do importador, para a chave bater dos dois lados.
    existentes.map((c) => [`${normalizar(c.cargo)}|${normalizar(c.area)}`, c.id])
  )

  const aAtualizar = relatorio.validos.filter((v) => idPorChave.has(v.chaveDedupe))
  const aCriar = relatorio.validos.filter((v) => !idPorChave.has(v.chaveDedupe))

  const resumo = {
    total: relatorio.total,
    validos: relatorio.validos.length,
    comErro: relatorio.erros.length,
    avisos: relatorio.avisos.length,
    duplicados: relatorio.duplicados.length,
    novos: aCriar.length,
    atualizados: aAtualizar.length,
  }

  if (body.confirmar !== true) {
    return NextResponse.json({
      dryRun: true,
      resumo,
      previa: relatorio.validos.slice(0, 20).map((c) => ({
        linha: c.linha,
        cargo: c.cargo,
        area: c.area,
        tipoVaga: c.tipoVaga,
        existente: idPorChave.has(c.chaveDedupe),
      })),
      erros: relatorio.erros.slice(0, 100),
      avisos: relatorio.avisos.slice(0, 100),
      duplicados: relatorio.duplicados.slice(0, 100),
    })
  }

  if (relatorio.validos.length === 0) {
    return NextResponse.json(
      { error: 'Nenhuma linha válida para importar', resumo },
      { status: 400 }
    )
  }

  /*
    Transação em lote, não interativa.

    A primeira versão abria `$transaction(async tx => ...)` e fazia um `create`
    por linha lá dentro. Com as 57 linhas da planilha real isso estourou o
    limite de 5s da transação interativa e devolveu P2028 em produção: cada
    `await` é uma ida e volta até o banco, e são 57 delas em sequência.

    A forma em lista manda tudo num batch só, e continua atômica: ou entra a
    planilha inteira, ou não entra nada.
  */
  const operacoes = [
    ...(aCriar.length > 0
      ? [
          prisma.recCargo.createMany({
            data: aCriar.map(({ linha: _l, chaveDedupe: _c, ...campos }) => ({
              ...campos,
              empresaId,
            })),
          }),
        ]
      : []),
    // `ativo` fica de fora do update: um descritivo desativado na tela não
    // deve voltar sozinho só porque continua listado na planilha.
    ...aAtualizar.map(({ linha: _l, chaveDedupe, ...campos }) =>
      prisma.recCargo.update({ where: { id: idPorChave.get(chaveDedupe)! }, data: campos })
    ),
  ]

  await prisma.$transaction(operacoes)

  await audit({
    ...autor(user),
    action: 'GENTE_CARGOS_IMPORTADOS',
    targetType: 'RecCargo',
    meta: resumo,
  })

  return NextResponse.json({
    dryRun: false,
    resumo: { ...resumo, criados: aCriar.length },
    avisos: relatorio.avisos.slice(0, 100),
    observacao:
      aAtualizar.length > 0
        ? `${aAtualizar.length} descritivo${aAtualizar.length === 1 ? ' que já existia foi atualizado' : 's que já existiam foram atualizados'} com o conteúdo da planilha. Descritivos desativados continuam desativados.`
        : undefined,
  })
})
