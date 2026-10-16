/**
 * Fábrica das rotas de importação do módulo Gente.
 *
 * Todas seguem o mesmo contrato — dry-run por padrão, grava só com
 * `confirmar: true`, escopo aplicado nas operações de destino — e só mudam o
 * analisador e como os registros viram linhas no banco. Centralizar isso
 * garante que uma importação nova não nasça sem o dry-run ou sem auditoria.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { audit, type AuditActionGente } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from './api'
import { resolverEscopoGente } from './scope'
import type { LinhaPlanilha, OperacaoRef, ProblemaImportacao } from './vaga-importador'
import { TRANSACAO_IMPORTACAO } from './sobreposicao'

export interface RelatorioGenerico<T> {
  total: number
  validos: T[]
  erros: ProblemaImportacao[]
  avisos: ProblemaImportacao[]
  duplicados: ProblemaImportacao[]
}

interface Config<T extends { linha: number; operacaoId: string; chaveDedupe: string }, P> {
  analisar: (linhas: LinhaPlanilha[], operacoes: OperacaoRef[]) => RelatorioGenerico<T>
  /**
   * Grava os registros. Recebe os válidos já com `empresaId` resolvido.
   *
   * `chaves` vem na **mesma ordem** de `registros`: é o `chaveDedupe` que o
   * analisador calculou, e é o que permite reconhecer no banco a linha que
   * está chegando — sem ele, reimportar a planilha duplicaria tudo. Fica num
   * array à parte, e não dentro do registro, para não haver como vazar um
   * campo que não existe na tabela.
   */
  gravar: (
    tx: Prisma.TransactionClient,
    registros: (Omit<T, 'linha' | 'chaveDedupe'> & { empresaId: string })[],
    userId: string,
    chaves: string[]
  ) => Promise<number>
  /** Resumo de cada item na prévia do dry-run. */
  previa: (item: T) => P
  acaoAuditoria: AuditActionGente
  targetType: string
  maxLinhas?: number
  /** Explicação mostrada ao concluir, quando há regra que surpreende. */
  observacao?: string
}

export function criarRotaImportacao<
  T extends { linha: number; operacaoId: string; chaveDedupe: string },
  P,
>(config: Config<T, P>) {
  const MAX_LINHAS = config.maxLinhas ?? 3000

  return withHandler(async (req: NextRequest) => {
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

    // Só as operações que o usuário pode gravar são destino possível. Unidade
    // fora do escopo é recusada com a mesma mensagem de "não cadastrada", sem
    // vazar que ela existe.
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

    const relatorio = config.analisar(linhas as LinhaPlanilha[], operacoes)

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
        previa: relatorio.validos.slice(0, 20).map(config.previa),
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

    // A empresa vem sempre da operação de destino, nunca do arquivo.
    const empresaPorOperacao = new Map(
      (
        await prisma.operacao.findMany({
          where: { id: { in: Array.from(new Set(relatorio.validos.map((v) => v.operacaoId))) } },
          select: { id: true, empresaId: true },
        })
      ).map((o) => [o.id, o.empresaId])
    )

    const preparados = relatorio.validos.flatMap((v) => {
      const empresaId = empresaPorOperacao.get(v.operacaoId)
      if (!empresaId) return []

      const { linha: _l, chaveDedupe, ...campos } = v
      return [
        {
          registro: { ...campos, empresaId } as Omit<T, 'linha' | 'chaveDedupe'> & {
            empresaId: string
          },
          chave: chaveDedupe,
        },
      ]
    })

    const registros = preparados.map((p) => p.registro)
    const chaves = preparados.map((p) => p.chave)

    // Folga além dos 5 s padrão: uma sobreposição faz busca, exclusão e
    // criação na mesma transação, e foi o limite padrão que derrubou a
    // importação de cargos com P2028.
    const criados = await prisma.$transaction(
      (tx) => config.gravar(tx, registros, user.id, chaves),
      TRANSACAO_IMPORTACAO
    )

    await audit({
      ...autor(user),
      action: config.acaoAuditoria,
      targetType: config.targetType,
      meta: { ...resumo, criados },
    })

    return NextResponse.json({
      dryRun: false,
      resumo: { ...resumo, criados },
      avisos: relatorio.avisos.slice(0, 100),
      ...(config.observacao ? { observacao: config.observacao } : {}),
    })
  })
}
