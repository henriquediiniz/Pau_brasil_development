/**
 * O resumo de frontline que aparece no topo de Candidatos.
 *
 * Função pura: recebe o que já foi lido do banco e devolve os números da tela.
 * O cálculo mora aqui, e não na rota, porque cada decisão dele é discutível e
 * precisa de teste — "maior solicitação" pode ser muita coisa, e a escolha
 * está registrada abaixo.
 */

/**
 * Situações que significam "ainda disputando".
 *
 * `CONTRATADO`, `NAO_CONTRATADO` e `INDISPONIVEL` ficam de fora: são desfechos.
 * Contá-los faria um cargo já resolvido continuar parecendo aquecido.
 */
const EM_DISPUTA = ['EM_STAND_BY', 'EM_ANDAMENTO']

import { chaveDeCargo } from './cargo-publico'

export interface CandidatoResumo {
  cargo: string | null
  situacao: string
  operacaoId: string | null
  operacaoNome: string | null
  frontline: boolean
}

export interface VagaResumo {
  cargo: string | null
  quantidade: number
  frontline: boolean
}

export interface ResumoFrontline {
  /** Quantos cargos o RH marcou como frontline. Zero explica um painel vazio. */
  cargosMarcados: number
  totalCandidatos: number
  candidatosFrontline: number
  /** Posições descobertas em cargos de frontline, vindas do Controle de Vagas. */
  posicoesAbertas: number
  porOperacao: { operacaoId: string; nome: string; total: number }[]
  /**
   * Quantos candidatos de frontline há em cada cargo, do maior para o menor.
   * Conta todos, em qualquer situação — a soma bate com `candidatosFrontline`.
   * Era "Mais disputados" (só quem estava em processo, top 3, com as vagas ao
   * lado); o PO pediu a quantidade simples por cargo em 2026-10-07.
   */
  porCargo: { cargo: string; candidatos: number }[]
  /**
   * Cargo com vaga aberta e nenhum candidato. É o número que pede ação:
   * posição descoberta sem ninguém no funil não se resolve sozinha.
   */
  semCandidato: { cargo: string; posicoesAbertas: number }[]
}

/*
  A mesma chave que liga o candidato ao descritivo (`chaveDeCargo`): ignora
  acento, caixa, turno e preposicao.

  Ate 2026-10-07 o painel tinha chave propria, que nao ignorava preposicao, e
  "Mais disputados" mostrava "AJUDANTE DISTRIBUICAO" (15) e "Ajudante da
  Distribuicao" (4) como dois cargos. No banco eram 4 grafias da mesma funcao,
  e mais quatro cargos com o mesmo problema.
*/
function chave(valor: string | null | undefined): string {
  return chaveDeCargo(valor ?? '')
}

/**
 * O nome a exibir para um grupo de grafias.
 *
 * O do descritivo, quando existe: e o nome que o RH escreveu de proposito. Sem
 * descritivo, a grafia mais usada — o mais provavel de ser a "certa".
 */
function nomeDoGrupo(grafias: Map<string, number>, oficial: string | undefined): string {
  if (oficial) return oficial
  return Array.from(grafias.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))[0][0]
}

function contarGrafia(grafias: Map<string, number>, nome: string, peso = 1) {
  grafias.set(nome, (grafias.get(nome) ?? 0) + peso)
}

export function resumirFrontline({
  candidatos,
  vagasAbertas,
  cargosMarcados,
  nomesOficiais = [],
}: {
  candidatos: CandidatoResumo[]
  vagasAbertas: VagaResumo[]
  cargosMarcados: number
  /** Nomes dos descritivos (`RecCargo.cargo`), para exibir no lugar das grafias livres. */
  nomesOficiais?: string[]
}): ResumoFrontline {
  const oficial = new Map<string, string>()
  for (const n of nomesOficiais) {
    const k = chave(n)
    if (k && !oficial.has(k)) oficial.set(k, n)
  }

  const doFrontline = candidatos.filter((c) => c.frontline)
  const vagasFrontline = vagasAbertas.filter((v) => v.frontline)

  // ── Por operação ───────────────────────────────────────────────────────────
  const porOp = new Map<string, { nome: string; total: number }>()
  for (const c of doFrontline) {
    if (!c.operacaoId) continue
    const atual = porOp.get(c.operacaoId)
    if (atual) atual.total += 1
    else porOp.set(c.operacaoId, { nome: c.operacaoNome ?? 'Sem nome', total: 1 })
  }

  // ── Demanda aberta por cargo ───────────────────────────────────────────────
  const demanda = new Map<string, { grafias: Map<string, number>; posicoes: number }>()
  for (const v of vagasFrontline) {
    if (!v.cargo) continue
    const k = chave(v.cargo)
    const atual = demanda.get(k) ?? { grafias: new Map(), posicoes: 0 }
    atual.posicoes += v.quantidade
    contarGrafia(atual.grafias, v.cargo, v.quantidade)
    demanda.set(k, atual)
  }

  // ── Quantidade por cargo: todos os candidatos de frontline ─────────────────
  const quantidade = new Map<string, { grafias: Map<string, number>; candidatos: number }>()
  for (const c of doFrontline) {
    if (!c.cargo) continue
    const k = chave(c.cargo)
    const atual = quantidade.get(k) ?? { grafias: new Map(), candidatos: 0 }
    atual.candidatos += 1
    contarGrafia(atual.grafias, c.cargo)
    quantidade.set(k, atual)
  }

  const porCargo = Array.from(quantidade.entries())
    .map(([k, v]) => ({ cargo: nomeDoGrupo(v.grafias, oficial.get(k)), candidatos: v.candidatos }))
    .sort((a, b) => b.candidatos - a.candidatos || a.cargo.localeCompare(b.cargo, 'pt-BR'))

  /*
    Para o alerta "sem candidato", so conta quem ainda esta no processo:
    contratado ou descartado ja saiu do funil e nao cobre uma vaga reaberta.
  */
  const disputa = new Map<string, { grafias: Map<string, number>; candidatos: number }>()
  for (const c of doFrontline) {
    if (!c.cargo) continue
    if (!EM_DISPUTA.includes(c.situacao)) continue

    const k = chave(c.cargo)
    const atual = disputa.get(k) ?? { grafias: new Map(), candidatos: 0 }
    atual.candidatos += 1
    contarGrafia(atual.grafias, c.cargo)
    disputa.set(k, atual)
  }

  // ── Cargo com vaga aberta e ninguém disputando ─────────────────────────────
  const comCandidato = new Set(Array.from(disputa.keys()))
  const semCandidato = Array.from(demanda.entries())
    .filter(([k]) => !comCandidato.has(k))
    .map(([k, v]) => ({ cargo: nomeDoGrupo(v.grafias, oficial.get(k)), posicoesAbertas: v.posicoes }))
    .sort((a, b) => b.posicoesAbertas - a.posicoesAbertas)

  return {
    cargosMarcados,
    totalCandidatos: candidatos.length,
    candidatosFrontline: doFrontline.length,
    posicoesAbertas: vagasFrontline.reduce((s, v) => s + v.quantidade, 0),
    porOperacao: Array.from(porOp, ([operacaoId, v]) => ({ operacaoId, ...v })).sort(
      (a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR')
    ),
    porCargo,
    semCandidato,
  }
}
