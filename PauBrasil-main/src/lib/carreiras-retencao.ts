/**
 * Retenção do currículo de quem saiu do funil do Banco de Talentos.
 *
 * Decisão do PO (2026-10-01): o CV de quem está em Rejeitado ou Arquivado é
 * apagado **10 dias depois de a pessoa sair do funil**. É a janela para o RH
 * perceber uma rejeição por engano e reabrir o candidato com o currículo.
 *
 * Até essa data o CV era apagado no instante da rejeição, e dos 71 candidatos
 * nessas etapas, 70 já não tinham currículo quando a reabertura foi liberada.
 */

export const DIAS_RETENCAO_CV = 10

/** Etapas fora do funil. Mover de uma para a outra não zera o prazo. */
export const ETAPAS_DE_SAIDA = ['REJEITADO', 'ARQUIVADO'] as const

const MS_POR_DIA = 24 * 60 * 60 * 1000

export interface MudancaDeEtapa {
  etapaAnterior: string | null
  etapaNova: string | null
  createdAt: Date
}

function ehSaida(etapa: string | null): boolean {
  return etapa !== null && (ETAPAS_DE_SAIDA as readonly string[]).includes(etapa)
}

/**
 * Quando a pessoa saiu do funil pela última vez.
 *
 * É a mudança mais recente que **entrou** no grupo Rejeitado/Arquivado vindo
 * de fora dele. "Rejeitado → Arquivado" não conta: a pessoa já estava fora, e
 * contar reiniciaria o prazo a cada reorganização do RH.
 *
 * Sem registro no histórico, usa `alternativa` (o `updatedAt`). Ele é sempre
 * igual ou posterior à saída real, então erra para o lado de guardar o CV
 * mais tempo — nunca de apagar antes.
 */
export function saidaDoFunil(historico: MudancaDeEtapa[], alternativa: Date): Date {
  const entradas = historico
    .filter((m) => ehSaida(m.etapaNova) && !ehSaida(m.etapaAnterior))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return entradas[0]?.createdAt ?? alternativa
}

/** O prazo de retenção já passou? */
export function cvVencido(saida: Date, hoje: Date = new Date()): boolean {
  return hoje.getTime() - saida.getTime() >= DIAS_RETENCAO_CV * MS_POR_DIA
}

/** Dias que faltam para o CV ser apagado (0 quando já venceu). */
export function diasParaApagar(saida: Date, hoje: Date = new Date()): number {
  const restante = DIAS_RETENCAO_CV * MS_POR_DIA - (hoje.getTime() - saida.getTime())
  return Math.max(0, Math.ceil(restante / MS_POR_DIA))
}
