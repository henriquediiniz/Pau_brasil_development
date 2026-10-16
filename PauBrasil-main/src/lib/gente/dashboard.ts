/**
 * Agregações do painel de Gente.
 *
 * Tudo aqui é função pura sobre linhas já lidas do banco. A razão é o SLA:
 * o painel precisa das mesmas regras de `vaga-sla.ts`, e reimplementá-las em
 * SQL criaria uma segunda verdade que divergiria da tela de vagas na primeira
 * mudança de regra. Então o cálculo é um só, e o painel apenas o agrega.
 */

import { calcularSlaVaga, type RecStatusFechamentoValue, type RecVagaStatusValue } from './vaga-sla'
import { resumirEtapas, type EtapaRegistrada } from './etapas'
import { SITUACOES, type OrigemCurriculo, type SituacaoCandidato } from './candidato'

// ─── Vagas ────────────────────────────────────────────────────────────────────

export interface VagaParaPainel {
  status: RecVagaStatusValue
  dataAbertura: Date | null
  dataPrevistaFechamento: Date | null
  dataContratacao: Date | null
  encerradaEm: Date | null
  statusFechamentoManual: RecStatusFechamentoValue | null
  quantidadeVagas: number
  operacaoId: string | null
  operacao: { nome: string } | null
}

export interface ResumoPorOperacao {
  operacaoId: string
  nome: string
  abertas: number
  atrasadas: number
  fechadas: number
}

export interface PainelVagas {
  total: number
  abertas: number
  fechadas: number
  canceladas: number
  /** Vagas abertas que já passaram do prazo — o número que o RH persegue. */
  abertasAtrasadas: number
  /** Postos de trabalho em aberto (soma de `quantidadeVagas`), não requisições. */
  posicoesAbertas: number
  /** Média de dias entre abertura e contratação, só das fechadas. */
  tempoMedioFechamento: number | null
  /** Percentual das fechadas que fecharam dentro do prazo. */
  percentualNoPrazo: number | null
  porOperacao: ResumoPorOperacao[]
}

export function agregarVagas(vagas: VagaParaPainel[], hoje: Date = new Date()): PainelVagas {
  let abertas = 0
  let fechadas = 0
  let canceladas = 0
  let abertasAtrasadas = 0
  let posicoesAbertas = 0
  let somaDiasFechamento = 0
  let fechadasNoPrazo = 0

  const porOperacao = new Map<string, ResumoPorOperacao>()

  for (const vaga of vagas) {
    const sla = calcularSlaVaga(
      {
        status: vaga.status,
        dataAbertura: vaga.dataAbertura,
        dataPrevistaFechamento: vaga.dataPrevistaFechamento,
        dataContratacao: vaga.dataContratacao,
        encerradaEm: vaga.encerradaEm,
        statusFechamentoManual: vaga.statusFechamentoManual,
      },
      hoje
    )

    const chave = vaga.operacaoId ?? '__sem_operacao'
    if (!porOperacao.has(chave)) {
      porOperacao.set(chave, {
        operacaoId: chave,
        nome: vaga.operacao?.nome ?? 'Sem operação',
        abertas: 0,
        atrasadas: 0,
        fechadas: 0,
      })
    }
    const linha = porOperacao.get(chave)!

    if (vaga.status === 'ABERTA') {
      abertas++
      posicoesAbertas += vaga.quantidadeVagas
      linha.abertas++
      if (sla.atrasada) {
        abertasAtrasadas++
        linha.atrasadas++
      }
    } else if (vaga.status === 'FECHADA') {
      fechadas++
      linha.fechadas++
      somaDiasFechamento += sla.diasEmAberto
      if (!sla.atrasada) fechadasNoPrazo++
    } else {
      canceladas++
    }
  }

  return {
    total: vagas.length,
    abertas,
    fechadas,
    canceladas,
    abertasAtrasadas,
    posicoesAbertas,
    tempoMedioFechamento: fechadas === 0 ? null : Math.round(somaDiasFechamento / fechadas),
    percentualNoPrazo: fechadas === 0 ? null : Math.round((fechadasNoPrazo / fechadas) * 100),
    porOperacao: Array.from(porOperacao.values()).sort((a, b) => b.abertas - a.abertas),
  }
}

// ─── Candidatos ───────────────────────────────────────────────────────────────

export interface CandidatoParaPainel {
  situacao: SituacaoCandidato
  origemCurriculo: OrigemCurriculo
  candidaturaId: string | null
  etapas: EtapaRegistrada[]
}

export interface PainelCandidatos {
  total: number
  porSituacao: Record<SituacaoCandidato, number>
  /** Todas as etapas aplicáveis aprovadas — prontos para decisão. */
  prontos: number
  /** Reprovados em alguma etapa: o processo parou. */
  bloqueados: number
  /** Em processo, sem reprovação e com etapa pendente. */
  emAndamento: number
  /** Quantos vieram do Banco de Talentos, em vez de cadastro manual. */
  vindosDoSite: number
  porOrigem: { origem: OrigemCurriculo; total: number }[]
  /** Quantos candidatos estão parados em cada etapa. */
  gargalos: { chave: string; label: string; total: number }[]
}

export function agregarCandidatos(candidatos: CandidatoParaPainel[]): PainelCandidatos {
  const porSituacao = Object.fromEntries(SITUACOES.map((s) => [s, 0])) as Record<
    SituacaoCandidato,
    number
  >

  let prontos = 0
  let bloqueados = 0
  let emAndamento = 0
  let vindosDoSite = 0

  const porOrigem = new Map<OrigemCurriculo, number>()
  const gargalos = new Map<string, { label: string; total: number }>()

  for (const c of candidatos) {
    porSituacao[c.situacao] = (porSituacao[c.situacao] ?? 0) + 1
    porOrigem.set(c.origemCurriculo, (porOrigem.get(c.origemCurriculo) ?? 0) + 1)
    if (c.candidaturaId) vindosDoSite++

    const resumo = resumirEtapas(c.etapas)

    if (resumo.bloqueada) {
      bloqueados++
    } else if (resumo.concluida) {
      prontos++
    } else {
      emAndamento++
      // Só conta gargalo de quem ainda está correndo: quem já foi reprovado
      // não está "parado" numa etapa, está fora.
      if (resumo.proxima) {
        const atual = gargalos.get(resumo.proxima.chave)
        gargalos.set(resumo.proxima.chave, {
          label: resumo.proxima.label,
          total: (atual?.total ?? 0) + 1,
        })
      }
    }
  }

  return {
    total: candidatos.length,
    porSituacao,
    prontos,
    bloqueados,
    emAndamento,
    vindosDoSite,
    porOrigem: Array.from(porOrigem.entries())
      .map(([origem, total]) => ({ origem, total }))
      .sort((a, b) => b.total - a.total),
    gargalos: Array.from(gargalos.entries())
      .map(([chave, { label, total }]) => ({ chave, label, total }))
      .sort((a, b) => b.total - a.total),
  }
}

// ─── Período ──────────────────────────────────────────────────────────────────

export const PERIODOS = ['2d', '7d', '30d', '90d', '12m', 'tudo', 'personalizado'] as const
export type Periodo = (typeof PERIODOS)[number]

/** Atalhos que aparecem como pílula. `personalizado` tem controle próprio. */
export const PERIODOS_RAPIDOS: readonly Periodo[] = ['2d', '7d', '30d', '90d', '12m', 'tudo']

/**
 * Rótulos curtos de propósito.
 *
 * Com seis atalhos, repetir "Últimos" em cada um enche a linha e some no
 * celular sem dizer mais nada — o grupo já é anunciado como "Período".
 */
export const PERIODO_LABEL: Record<Periodo, string> = {
  '2d': '2 dias',
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
  '12m': '12 meses',
  tudo: 'Tudo',
  personalizado: 'Escolher datas',
}

/** Quantos dias de calendário cada atalho cobre, contando hoje. */
const DIAS_DO_ATALHO: Partial<Record<Periodo, number>> = { '2d': 2, '7d': 7, '30d': 30, '90d': 90 }

export interface Intervalo {
  /** Início inclusivo (`gte`). `null` = sem corte. */
  inicio: Date | null
  /** Fim **exclusivo** (`lt`). `null` = até agora. */
  fim: Date | null
}

/** Meia-noite UTC do dia de uma data. */
function diaUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/** `aaaa-mm-dd` → meia-noite UTC. Qualquer outra coisa vira `null`. */
export function lerDataIso(valor: unknown): Date | null {
  if (typeof valor !== 'string') return null

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim())
  if (!m) return null

  const [, ano, mes, dia] = m
  const d = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)))

  // 2026-02-31 faz o Date rolar para março; só aceita o que voltou igual.
  if (d.getUTCMonth() !== Number(mes) - 1 || d.getUTCDate() !== Number(dia)) return null
  if (d.getUTCFullYear() < 2000 || d.getUTCFullYear() > 2100) return null

  return d
}

export function escreverDataIso(d: Date): string {
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dia = String(d.getUTCDate()).padStart(2, '0')
  return `${d.getUTCFullYear()}-${mes}-${dia}`
}

/**
 * O intervalo que o painel vai consultar.
 *
 * Duas regras que não são óbvias:
 *
 * 1. **"Últimos N dias" conta N dias de calendário incluindo hoje.** "2 dias"
 *    é ontem e hoje, não anteontem também. A versão anterior subtraía N dias
 *    da meia-noite de hoje e filtrava por `gte`, o que dava N+1 dias — em 30
 *    ninguém percebe, em 2 a diferença é de 50%.
 *
 * 2. **O fim é exclusivo.** Escolher 22/09 como fim precisa incluir o que
 *    entrou às 14h do dia 22, então o corte vai para a meia-noite do dia 23 e
 *    a consulta usa `lt`. Usar `lte` na meia-noite do 22 perderia o dia todo.
 */
export function resolverIntervalo(
  periodo: Periodo,
  hoje: Date = new Date(),
  personalizado?: { de?: unknown; ate?: unknown }
): Intervalo {
  if (periodo === 'tudo') return { inicio: null, fim: null }

  const hojeUtc = diaUtc(hoje)

  if (periodo === 'personalizado') {
    const de = lerDataIso(personalizado?.de)
    const ate = lerDataIso(personalizado?.ate)

    // Sem as duas pontas não há recorte a aplicar; melhor mostrar tudo do que
    // mostrar vazio sem explicar por quê.
    if (!de || !ate) return { inicio: null, fim: null }

    // Datas invertidas são engano de clique, não pedido de intervalo vazio.
    const [inicio, fim] = de <= ate ? [de, ate] : [ate, de]

    const fimExclusivo = new Date(fim)
    fimExclusivo.setUTCDate(fimExclusivo.getUTCDate() + 1)

    return { inicio, fim: fimExclusivo }
  }

  const dias = DIAS_DO_ATALHO[periodo]
  if (dias !== undefined) {
    const inicio = new Date(hojeUtc)
    inicio.setUTCDate(inicio.getUTCDate() - (dias - 1))
    return { inicio, fim: null }
  }

  // 12m
  const inicio = new Date(hojeUtc)
  inicio.setUTCMonth(inicio.getUTCMonth() - 12)
  return { inicio, fim: null }
}

export function ehPeriodoValido(valor: unknown): valor is Periodo {
  return typeof valor === 'string' && (PERIODOS as readonly string[]).includes(valor)
}

const MESES_CURTOS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
] as const

/**
 * O recorte em texto, para ficar ao lado dos números.
 *
 * A pílula diz "90 dias"; ninguém calcula de cabeça que dia é 90 dias atrás.
 * O fim é devolvido ao dia inclusivo, porque é assim que a pessoa escolheu.
 */
export function descreverIntervalo(intervalo: Intervalo, hoje: Date = new Date()): string {
  const { inicio, fim } = intervalo
  if (!inicio && !fim) return 'Todo o período'

  const dia = (d: Date) => `${d.getUTCDate()} ${MESES_CURTOS[d.getUTCMonth()]}`
  const diaComAno = (d: Date) => `${dia(d)} ${d.getUTCFullYear()}`

  const fimInclusivo = fim ? new Date(fim.getTime() - 86_400_000) : diaUtc(hoje)
  const de = inicio ?? null

  if (!de) return `até ${diaComAno(fimInclusivo)}`

  // Só se repete o que muda: dentro do mesmo mês, "15 – 21 set 2026"; dentro
  // do mesmo ano, "1 jul – 21 set 2026"; virando o ano, os dois completos.
  const mesmoAno = de.getUTCFullYear() === fimInclusivo.getUTCFullYear()
  if (!mesmoAno) return `${diaComAno(de)} – ${diaComAno(fimInclusivo)}`

  const mesmoMes = de.getUTCMonth() === fimInclusivo.getUTCMonth()
  return mesmoMes
    ? `${de.getUTCDate()} – ${diaComAno(fimInclusivo)}`
    : `${dia(de)} – ${diaComAno(fimInclusivo)}`
}

/**
 * O intervalo como filtro do Prisma para um campo de data.
 *
 * Existe para as duas rotas que recortam por período montarem a condição do
 * mesmo jeito — `gte` no início, `lt` no fim. `undefined` quando não há corte,
 * para o spread não injetar um objeto vazio no `where`.
 */
export function filtroDeData(intervalo: Intervalo): { gte?: Date; lt?: Date } | undefined {
  const filtro: { gte?: Date; lt?: Date } = {}
  if (intervalo.inicio) filtro.gte = intervalo.inicio
  if (intervalo.fim) filtro.lt = intervalo.fim

  return Object.keys(filtro).length > 0 ? filtro : undefined
}
