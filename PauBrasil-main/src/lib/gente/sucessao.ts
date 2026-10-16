/**
 * Recrutamento interno e pipeline de sucessão.
 *
 * São as duas telas de maior valor estratégico do módulo e as menos urgentes
 * no dia a dia — por isso vêm por último. O que elas respondem: quem da casa
 * está pronto para crescer, e quem cobre cada cargo crítico se a pessoa sair.
 */

import { z } from 'zod'
import {
  normalizar,
  resolverOperacao,
  converterData,
  type LinhaPlanilha,
  type OperacaoRef,
  type ProblemaImportacao,
} from './vaga-importador'
import type { RelatorioImportacao } from './quadro-importador'
import { listaDeTexto } from './lista-campo'

export const SITUACOES_INTERNO = [
  'AGUARDANDO',
  'PROMOVIDO',
  'NAO_ATENDE',
  'DESLIGADO',
  'OUTRA',
] as const

export type SituacaoInterno = (typeof SITUACOES_INTERNO)[number]

export const SITUACAO_INTERNO_LABEL: Record<SituacaoInterno, string> = {
  AGUARDANDO: 'Aguardando',
  PROMOVIDO: 'Promovido',
  NAO_ATENDE: 'Não atende',
  DESLIGADO: 'Desligado',
  OUTRA: 'Outra',
}

/**
 * Identidade do candidato interno: operação + nome.
 *
 * Usada nos dois lados — repetição dentro da planilha e reconhecimento no
 * banco. Não há matrícula nesta planilha.
 */
export function chaveInterno(i: { operacaoId: string | null; nome: string }): string {
  return `${i.operacaoId ?? ''}|${normalizar(i.nome)}`
}

/**
 * Identidade do mapeamento de sucessão: operação + cargo + sucessor.
 *
 * O cargo entra porque a mesma pessoa pode ser sucessora de mais de um cargo
 * crítico, e são dois mapeamentos distintos.
 */
export function chaveSucessao(s: {
  operacaoId: string | null
  cargoSucessao: string
  nomeSucessor: string
}): string {
  return `${s.operacaoId ?? ''}|${normalizar(s.cargoSucessao)}|${normalizar(s.nomeSucessor)}`
}

export const internoSchema = z.object({
  operacaoId: z.string().min(1, 'Operação é obrigatória'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  cargoAtual: z.string().nullish(),
  setorAtual: z.string().nullish(),
  tempoFuncao: z.string().nullish(),
  cargoPretendido: z.string().nullish(),
  avaliacaoCiclo: z.string().nullish(),
  possuiRequisitos: z.boolean().default(false),
  matrizOuFilial: z.string().nullish(),
  observacoes: z.string().nullish(),
  futurosCargos: listaDeTexto(),
  situacao: z.enum(SITUACOES_INTERNO).default('AGUARDANDO'),
  userId: z.string().nullish(),
})

export const internoPatchSchema = internoSchema.partial()

export const sucessaoSchema = z.object({
  operacaoId: z.string().min(1, 'Operação é obrigatória'),
  cargoSucessao: z.string().min(1, 'Cargo de sucessão é obrigatório'),
  areaCargoSucessao: z.string().nullish(),
  functionId: z.string().nullish(),
  nomeSucessor: z.string().min(1, 'Nome do sucessor é obrigatório'),
  sucessorId: z.string().nullish(),
  cargoAtualSucessor: z.string().nullish(),
  prontoAgora: z.boolean().default(false),
  pronto1Ano: z.boolean().default(false),
  pronto2Anos: z.boolean().default(false),
  habilidadeTecnica: z.string().nullish(),
  habilidadeComportamental: z.string().nullish(),
  planoDesenvolvimento: z.string().nullish(),
  inicioMapeamento: z.coerce.date().nullish(),
  houveMovimentacao: z.boolean().nullish(),
  observacao: z.string().nullish(),
  mesAno: z.string().nullish(),
  cicloGente: z.string().nullish(),
  ativo: z.boolean().default(true),
})

export const sucessaoPatchSchema = sucessaoSchema.partial()

export const SELECT_INTERNO = {
  id: true,
  empresaId: true,
  operacaoId: true,
  userId: true,
  nome: true,
  cargoAtual: true,
  setorAtual: true,
  tempoFuncao: true,
  cargoPretendido: true,
  avaliacaoCiclo: true,
  possuiRequisitos: true,
  matrizOuFilial: true,
  observacoes: true,
  futurosCargos: true,
  situacao: true,
  createdAt: true,
  updatedAt: true,
  operacao: { select: { id: true, nome: true } },
} as const

export const SELECT_SUCESSAO = {
  id: true,
  empresaId: true,
  operacaoId: true,
  cargoSucessao: true,
  areaCargoSucessao: true,
  functionId: true,
  nomeSucessor: true,
  sucessorId: true,
  cargoAtualSucessor: true,
  prontoAgora: true,
  pronto1Ano: true,
  pronto2Anos: true,
  habilidadeTecnica: true,
  habilidadeComportamental: true,
  planoDesenvolvimento: true,
  inicioMapeamento: true,
  houveMovimentacao: true,
  observacao: true,
  mesAno: true,
  cicloGente: true,
  ativo: true,
  createdAt: true,
  updatedAt: true,
  operacao: { select: { id: true, nome: true } },
} as const

export type Prontidao = 'agora' | '1_ano' | '2_anos' | 'nao_mapeado'

export const PRONTIDAO_LABEL: Record<Prontidao, string> = {
  agora: 'Pronto agora',
  '1_ano': 'Pronto em 1 ano',
  '2_anos': 'Pronto em 2 anos',
  nao_mapeado: 'Sem horizonte definido',
}

/**
 * Horizonte de prontidão do sucessor.
 *
 * O app do RH guardava três "sim/não" independentes, o que permitia estados
 * contraditórios (pronto agora mas não em 1 ano). Aqui os três viram um
 * horizonte único, tomando sempre o mais próximo — se está pronto agora, o
 * resto é consequência.
 */
export function horizonteProntidao(s: {
  prontoAgora: boolean
  pronto1Ano: boolean
  pronto2Anos: boolean
}): Prontidao {
  if (s.prontoAgora) return 'agora'
  if (s.pronto1Ano) return '1_ano'
  if (s.pronto2Anos) return '2_anos'
  return 'nao_mapeado'
}

export interface CoberturaCargo {
  cargo: string
  sucessores: number
  prontosAgora: number
  /** Cargo crítico sem ninguém pronto agora nem em 1 ano. */
  emRisco: boolean
}

/**
 * Consolida a cobertura por cargo.
 *
 * O número que interessa não é "quantos sucessores existem", é "quantos cargos
 * ficariam descobertos amanhã" — por isso `emRisco` olha o horizonte, não a
 * contagem.
 */
export function consolidarCobertura(
  itens: { cargoSucessao: string; prontoAgora: boolean; pronto1Ano: boolean; pronto2Anos: boolean }[]
): CoberturaCargo[] {
  const porCargo = new Map<string, CoberturaCargo & { prontos1Ano: number }>()

  for (const item of itens) {
    const chave = normalizar(item.cargoSucessao)
    if (!porCargo.has(chave)) {
      porCargo.set(chave, {
        cargo: item.cargoSucessao,
        sucessores: 0,
        prontosAgora: 0,
        prontos1Ano: 0,
        emRisco: true,
      })
    }

    const linha = porCargo.get(chave)!
    linha.sucessores++

    const horizonte = horizonteProntidao(item)
    if (horizonte === 'agora') linha.prontosAgora++
    if (horizonte === '1_ano') linha.prontos1Ano++
  }

  return Array.from(porCargo.values())
    .map(({ prontos1Ano, ...linha }) => ({
      ...linha,
      emRisco: linha.prontosAgora === 0 && prontos1Ano === 0,
    }))
    .sort((a, b) => Number(b.emRisco) - Number(a.emRisco) || a.cargo.localeCompare(b.cargo))
}

// ─── Importadores ─────────────────────────────────────────────────────────────

/**
 * Cabeçalhos aceitos.
 *
 * Os nomes em maiúsculas vieram da planilha real do ciclo de gente do RH
 * ("Modelo Pipeline.xlsx", aba "Plano de Sucessão") — inclusive o typo
 * "POTECIALIZAR", que está no arquivo deles e precisa casar do jeito que veio.
 */
export const COLUNAS_SUCESSAO: Record<string, string[]> = {
  unidade: ['unidade', 'operacao', 'filial'],
  nome: ['nome', 'colaborador'],
  cargoAtual: ['cargo atual', 'cargo'],
  setorAtual: ['setor atual', 'setor', 'area'],
  tempoFuncao: ['tempo funcao', 'tempo na funcao', 'tempo'],
  cargoPretendido: ['cargo pretendido', 'pretendido'],
  avaliacaoCiclo: ['avaliacao ciclo', 'avaliacao do ciclo', 'avaliacao'],
  possuiRequisitos: ['possui requisitos', 'requisitos'],
  matrizOuFilial: ['matriz ou filial', 'matriz filial'],
  situacao: ['situacao'],
  futurosCargos: ['futuros cargos', 'cargos futuros'],
  observacoes: ['observacoes', 'obs'],
  cargoSucessao: ['cargo sucessao', 'cargo de sucessao', 'cargo a sucessao', 'cargo critico'],
  areaCargoSucessao: [
    'area cargo sucessao',
    'area do cargo a sucessao',
    'area do cargo sucessao',
    'area sucessao',
  ],
  nomeSucessor: ['nome sucessor', 'sucessor'],
  cargoAtualSucessor: ['cargo atual sucessor', 'cargo atual do sucessor', 'cargo do sucessor'],
  prontoAgora: ['pronto agora'],
  pronto1Ano: ['pronto 1 ano', 'pronto em 1 ano'],
  pronto2Anos: ['pronto 2 anos', 'pronto em 2 anos'],
  habilidadeTecnica: [
    'habilidade tecnica',
    'habilidade tecnica a potecializar ou desenvolver',
    'habilidade tecnica a potencializar ou desenvolver',
  ],
  habilidadeComportamental: [
    'habilidade comportamental',
    'habilidade comportamental a potencializar ou desenvolver',
    'habilidade comportamental a potecializar ou desenvolver',
  ],
  planoDesenvolvimento: ['plano desenvolvimento', 'plano de desenvolvimento'],
  inicioMapeamento: ['inicio mapeamento', 'inicio do mapeamento'],
  cicloGente: ['ciclo gente', 'ciclo de gente', 'ciclo'],
  mesAno: ['mes ano', 'mes / ano'],
  /** ATIVO / DESLIGADO / INATIVO — vira o booleano `ativo`. */
  status: ['status'],
  houveMovimentacao: ['houve movimentacao', 'movimentacao'],
  observacao: ['observacao'],
}

const COLUNAS = COLUNAS_SUCESSAO

function campo(dados: Record<string, unknown>, nome: string): unknown {
  const aceitos = COLUNAS[nome] ?? [nome]
  for (const [chave, valor] of Object.entries(dados)) {
    if (aceitos.includes(normalizar(chave))) return valor
  }
  return undefined
}

function texto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null
  const s = String(valor).trim()
  return s === '' ? null : s
}

/** Aceita SIM/NÃO, S/N, X e vazio. Vazio é `false`, não erro. */
export function converterSimNao(valor: unknown): boolean {
  const s = normalizar(valor)
  return ['sim', 's', 'x', 'true', '1', 'ok'].includes(s)
}

const SITUACOES_ACEITAS: Record<string, SituacaoInterno> = {
  aguardando: 'AGUARDANDO',
  promovido: 'PROMOVIDO',
  promovida: 'PROMOVIDO',
  'nao atende': 'NAO_ATENDE',
  desligado: 'DESLIGADO',
  desligada: 'DESLIGADO',
  outra: 'OUTRA',
  outro: 'OUTRA',
}

export function converterSituacaoInterno(valor: unknown): SituacaoInterno | null | 'invalida' {
  const s = normalizar(valor)
  if (s === '') return null
  return SITUACOES_ACEITAS[s] ?? 'invalida'
}

export interface InternoImportado {
  linha: number
  operacaoId: string
  nome: string
  cargoAtual: string | null
  setorAtual: string | null
  tempoFuncao: string | null
  cargoPretendido: string | null
  avaliacaoCiclo: string | null
  possuiRequisitos: boolean
  matrizOuFilial: string | null
  observacoes: string | null
  futurosCargos: string[]
  situacao: SituacaoInterno
  chaveDedupe: string
}

export function analisarPlanilhaInternos(
  linhas: LinhaPlanilha[],
  operacoes: OperacaoRef[]
): RelatorioImportacao<InternoImportado> {
  const validos: InternoImportado[] = []
  const erros: ProblemaImportacao[] = []
  const avisos: ProblemaImportacao[] = []
  const duplicados: ProblemaImportacao[] = []
  const vistos = new Map<string, number>()

  for (const { linha, dados } of linhas) {
    const errosDaLinha: ProblemaImportacao[] = []

    const nome = texto(campo(dados, 'nome'))
    if (!nome) errosDaLinha.push({ linha, campo: 'nome', mensagem: 'Nome é obrigatório' })

    const unidadeBruta = texto(campo(dados, 'unidade'))
    const operacao = resolverOperacao(unidadeBruta, operacoes)
    if (!unidadeBruta) {
      errosDaLinha.push({ linha, campo: 'unidade', mensagem: 'Unidade é obrigatória' })
    } else if (!operacao) {
      errosDaLinha.push({
        linha,
        campo: 'unidade',
        mensagem: 'Unidade não corresponde a nenhuma operação cadastrada.',
        valor: unidadeBruta,
      })
    }

    let situacao = converterSituacaoInterno(campo(dados, 'situacao'))
    if (situacao === 'invalida') {
      errosDaLinha.push({
        linha,
        campo: 'situacao',
        mensagem: 'Situação deve ser Aguardando, Promovido, Não atende, Desligado ou Outra',
        valor: String(campo(dados, 'situacao')),
      })
      situacao = null
    }

    if (errosDaLinha.length > 0) {
      erros.push(...errosDaLinha)
      continue
    }

    if (!texto(campo(dados, 'cargoPretendido'))) {
      avisos.push({
        linha,
        campo: 'cargoPretendido',
        mensagem: 'Sem cargo pretendido — fica difícil usar esta pessoa no recrutamento interno',
      })
    }

    const chaveDedupe = chaveInterno({ operacaoId: operacao!.id, nome: nome! })
    const anterior = vistos.get(chaveDedupe)
    if (anterior !== undefined) {
      duplicados.push({
        linha,
        mensagem: `Repete a linha ${anterior} (mesma pessoa na mesma operação).`,
        valor: nome ?? undefined,
      })
      continue
    }
    vistos.set(chaveDedupe, linha)

    const futuros = texto(campo(dados, 'futurosCargos'))

    validos.push({
      linha,
      operacaoId: operacao!.id,
      nome: nome!,
      cargoAtual: texto(campo(dados, 'cargoAtual')),
      setorAtual: texto(campo(dados, 'setorAtual')),
      tempoFuncao: texto(campo(dados, 'tempoFuncao')),
      cargoPretendido: texto(campo(dados, 'cargoPretendido')),
      avaliacaoCiclo: texto(campo(dados, 'avaliacaoCiclo')),
      possuiRequisitos: converterSimNao(campo(dados, 'possuiRequisitos')),
      matrizOuFilial: texto(campo(dados, 'matrizOuFilial')),
      observacoes: texto(campo(dados, 'observacoes')),
      // Aceita ponto e vírgula ou vírgula como separador.
      futurosCargos: futuros
        ? futuros.split(/[;,]/).map((c) => c.trim()).filter(Boolean)
        : [],
      situacao: (situacao as SituacaoInterno | null) ?? 'AGUARDANDO',
      chaveDedupe,
    })
  }

  return { total: linhas.length, validos, erros, avisos, duplicados }
}

export interface SucessaoImportada {
  linha: number
  operacaoId: string
  cargoSucessao: string
  areaCargoSucessao: string | null
  nomeSucessor: string
  cargoAtualSucessor: string | null
  prontoAgora: boolean
  pronto1Ano: boolean
  pronto2Anos: boolean
  habilidadeTecnica: string | null
  habilidadeComportamental: string | null
  planoDesenvolvimento: string | null
  inicioMapeamento: Date | null
  houveMovimentacao: boolean | null
  observacao: string | null
  mesAno: string | null
  cicloGente: string | null
  ativo: boolean
  chaveDedupe: string
}

/**
 * A coluna STATUS da planilha do RH vira o booleano `ativo`.
 * "DESLIGADO" e "INATIVO" saem do pipeline; vazio conta como ativo.
 */
export function converterStatusSucessao(valor: unknown): boolean {
  const s = normalizar(valor)
  if (s === '') return true
  return !['desligado', 'inativo', 'encerrado', 'nao'].includes(s)
}

export function analisarPlanilhaSucessao(
  linhas: LinhaPlanilha[],
  operacoes: OperacaoRef[]
): RelatorioImportacao<SucessaoImportada> {
  const validos: SucessaoImportada[] = []
  const erros: ProblemaImportacao[] = []
  const avisos: ProblemaImportacao[] = []
  const duplicados: ProblemaImportacao[] = []
  const vistos = new Map<string, number>()

  for (const { linha, dados } of linhas) {
    const errosDaLinha: ProblemaImportacao[] = []

    const cargoSucessao = texto(campo(dados, 'cargoSucessao'))
    if (!cargoSucessao) {
      errosDaLinha.push({ linha, campo: 'cargoSucessao', mensagem: 'Cargo de sucessão é obrigatório' })
    }

    const nomeSucessor = texto(campo(dados, 'nomeSucessor'))
    if (!nomeSucessor) {
      errosDaLinha.push({ linha, campo: 'nomeSucessor', mensagem: 'Nome do sucessor é obrigatório' })
    }

    const unidadeBruta = texto(campo(dados, 'unidade'))
    const operacao = resolverOperacao(unidadeBruta, operacoes)
    if (!unidadeBruta) {
      errosDaLinha.push({ linha, campo: 'unidade', mensagem: 'Unidade é obrigatória' })
    } else if (!operacao) {
      errosDaLinha.push({
        linha,
        campo: 'unidade',
        mensagem: 'Unidade não corresponde a nenhuma operação cadastrada.',
        valor: unidadeBruta,
      })
    }

    const inicio = converterData(campo(dados, 'inicioMapeamento'))
    if (inicio === 'invalida') {
      errosDaLinha.push({
        linha,
        campo: 'inicioMapeamento',
        mensagem: 'Data de início do mapeamento inválida',
        valor: String(campo(dados, 'inicioMapeamento')),
      })
    }

    if (errosDaLinha.length > 0) {
      erros.push(...errosDaLinha)
      continue
    }

    const prontoAgora = converterSimNao(campo(dados, 'prontoAgora'))
    const pronto1Ano = converterSimNao(campo(dados, 'pronto1Ano'))
    const pronto2Anos = converterSimNao(campo(dados, 'pronto2Anos'))

    if (!prontoAgora && !pronto1Ano && !pronto2Anos) {
      avisos.push({
        linha,
        mensagem: 'Nenhum horizonte de prontidão marcado — o sucessor entra como "sem horizonte"',
      })
    }
    if (!texto(campo(dados, 'planoDesenvolvimento')) && !prontoAgora) {
      avisos.push({
        linha,
        campo: 'planoDesenvolvimento',
        mensagem: 'Sucessor não está pronto e não tem plano de desenvolvimento registrado',
      })
    }

    const chaveDedupe = chaveSucessao({
      operacaoId: operacao!.id,
      cargoSucessao: cargoSucessao!,
      nomeSucessor: nomeSucessor!,
    })
    const anterior = vistos.get(chaveDedupe)
    if (anterior !== undefined) {
      duplicados.push({
        linha,
        mensagem: `Repete a linha ${anterior} (mesmo sucessor para o mesmo cargo).`,
        valor: nomeSucessor ?? undefined,
      })
      continue
    }
    vistos.set(chaveDedupe, linha)

    const movimentacao = texto(campo(dados, 'houveMovimentacao'))

    validos.push({
      linha,
      operacaoId: operacao!.id,
      cargoSucessao: cargoSucessao!,
      areaCargoSucessao: texto(campo(dados, 'areaCargoSucessao')),
      nomeSucessor: nomeSucessor!,
      cargoAtualSucessor: texto(campo(dados, 'cargoAtualSucessor')),
      prontoAgora,
      pronto1Ano,
      pronto2Anos,
      habilidadeTecnica: texto(campo(dados, 'habilidadeTecnica')),
      habilidadeComportamental: texto(campo(dados, 'habilidadeComportamental')),
      planoDesenvolvimento: texto(campo(dados, 'planoDesenvolvimento')),
      inicioMapeamento: inicio === 'invalida' ? null : inicio,
      houveMovimentacao: movimentacao === null ? null : converterSimNao(movimentacao),
      observacao: texto(campo(dados, 'observacao')),
      mesAno: texto(campo(dados, 'mesAno')),
      cicloGente: texto(campo(dados, 'cicloGente')),
      ativo: converterStatusSucessao(campo(dados, 'status')),
      chaveDedupe,
    })
  }

  return { total: linhas.length, validos, erros, avisos, duplicados }
}
