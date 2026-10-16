/**
 * Cargo do candidato agrupado pelas suas grafias.
 *
 * O candidato guarda o cargo como texto livre, e o mesmo cargo chega escrito
 * de vários jeitos: em 2026-10-07 havia "AJUDANTE DISTRIBUIÇÃO", "AJUDANTE DE
 * DISTRIBUIÇÃO", "Ajudante de Distribuição" e "Ajudante da Distribuição" para
 * a mesma função. Um filtro que liste as grafias cruas mostraria quatro opções
 * e acharia só um quarto das pessoas em cada uma.
 *
 * Aqui as grafias viram um grupo por `chaveDeCargo` (ignora acento, caixa,
 * turno e preposição). O filtro escolhe a chave; a consulta volta a ser feita
 * pelas grafias reais, com `in`, porque o banco não conhece a chave.
 */

import { chaveDeCargo } from './cargo-publico'

export interface CargoAgrupado {
  /** O que vai na URL do filtro. */
  chave: string
  /** O nome a mostrar: o do descritivo, ou a grafia mais usada. */
  cargo: string
  total: number
}

export function agruparCargos(
  contagens: { cargo: string | null; total: number }[],
  nomesOficiais: string[] = []
): CargoAgrupado[] {
  const oficial = new Map<string, string>()
  for (const n of nomesOficiais) {
    const k = chaveDeCargo(n)
    if (k && !oficial.has(k)) oficial.set(k, n)
  }

  const grupos = new Map<string, { grafias: Map<string, number>; total: number }>()
  for (const { cargo, total } of contagens) {
    if (!cargo) continue
    const k = chaveDeCargo(cargo)
    if (!k) continue
    const g = grupos.get(k) ?? { grafias: new Map(), total: 0 }
    g.total += total
    g.grafias.set(cargo, (g.grafias.get(cargo) ?? 0) + total)
    grupos.set(k, g)
  }

  return Array.from(grupos, ([chave, g]) => ({
    chave,
    cargo:
      oficial.get(chave) ??
      Array.from(g.grafias).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))[0][0],
    total: g.total,
  })).sort((a, b) => a.cargo.localeCompare(b.cargo, 'pt-BR'))
}

/** As grafias reais que caem em alguma das chaves — para o `cargo: { in }`. */
export function grafiasDasChaves(grafias: (string | null)[], chaves: Iterable<string>): string[] {
  const alvo = new Set(chaves)
  return grafias.filter((g): g is string => !!g && alvo.has(chaveDeCargo(g)))
}
