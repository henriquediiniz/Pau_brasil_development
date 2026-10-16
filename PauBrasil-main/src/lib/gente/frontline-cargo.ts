/**
 * Descobre se o cargo de um candidato é de frontline.
 *
 * A marca mora no **descritivo** (`RecCargo.frontline`), e não na vaga: a
 * natureza é do cargo. "Ajudante de Armazém" é frontline sempre, não só numa
 * requisição específica.
 *
 * O candidato, porém, pode chegar por dois caminhos, e eles têm confiabilidade
 * diferente:
 *
 * 1. **Pela vaga** — `candidato.vagaId` → `vaga.cargoId` → descritivo. É um id,
 *    não erra.
 * 2. **Pelo nome** — o candidato guarda `cargo` como texto, vindo da
 *    candidatura do site ou digitado. Casa pela chave normalizada, que ignora
 *    acento, caixa, turno e preposição.
 *
 * O caminho 1 ganha quando existe. O 2 é o que atende a maioria hoje, porque a
 * maior parte dos candidatos veio do Banco de Talentos e não está presa a uma
 * vaga.
 */

import { chaveDeCargo } from './cargo-publico'

export interface DescritivoFrontline {
  id: string
  cargo: string
  frontline: boolean
}

export interface CandidatoParaMarcar {
  cargo: string | null
  /** O `cargoId` da vaga do candidato, quando ele está ligado a uma. */
  vagaCargoId?: string | null
}

/**
 * Índice dos descritivos de frontline, pelas duas chaves de busca.
 *
 * Só os marcados entram: um índice de todos obrigaria a checar o campo depois,
 * e a pergunta que o chamador faz é "é frontline?", não "qual é o descritivo".
 */
export function indexarFrontline(descritivos: DescritivoFrontline[]) {
  const porId = new Set<string>()
  const porNome = new Set<string>()

  for (const d of descritivos) {
    if (!d.frontline) continue
    porId.add(d.id)
    porNome.add(chaveDeCargo(d.cargo))
  }

  return { porId, porNome }
}

export function ehFrontline(
  candidato: CandidatoParaMarcar,
  indice: ReturnType<typeof indexarFrontline>
): boolean {
  // O vínculo pela vaga é exato; quando existe, ele decide sozinho.
  if (candidato.vagaCargoId) return indice.porId.has(candidato.vagaCargoId)

  if (!candidato.cargo) return false
  return indice.porNome.has(chaveDeCargo(candidato.cargo))
}

/**
 * Condição Prisma para "o candidato disputa um cargo de frontline".
 *
 * Precisa existir como `where` — e não como filtro em memória — porque a lista
 * é paginada: filtrar depois de buscar 50 devolveria páginas de tamanhos
 * aleatórios e uma contagem errada.
 *
 * Duas pontas, pelo mesmo motivo de sempre: a vaga liga por id, e o candidato
 * solto liga pelo nome. `equals` com `mode: 'insensitive'` resolve a caixa; o
 * acento não, mas o nome do candidato vem escolhido da lista do site, então na
 * prática bate.
 *
 * Devolve `null` quando nenhum cargo está marcado — o chamador precisa
 * distinguir "nenhum resultado" de "não filtrar", e um `OR: []` no Prisma
 * devolveria tudo.
 */
export function whereFrontline(
  descritivos: DescritivoFrontline[],
  /**
   * As grafias de cargo que existem nos candidatos.
   *
   * Ate 2026-10-07 o filtro comparava o nome do descritivo com `equals`, que
   * so ignora caixa: "AJUDANTE DISTRIBUICAO" nao casava com "Ajudante de
   * Distribuicao", e "Ver so frontline" deixava gente de fora que o painel
   * contava. Agora casa pela mesma chave do painel (`chaveDeCargo`) e consulta
   * com as grafias reais.
   */
  grafiasDosCandidatos: (string | null)[]
): Record<string, unknown> | null {
  const marcados = descritivos.filter((d) => d.frontline)
  if (marcados.length === 0) return null

  const chaves = new Set(marcados.map((d) => chaveDeCargo(d.cargo)))
  const grafias = grafiasDosCandidatos.filter((g): g is string => !!g && chaves.has(chaveDeCargo(g)))

  return {
    OR: [
      { vaga: { cargoId: { in: marcados.map((d) => d.id) } } },
      ...(grafias.length > 0 ? [{ cargo: { in: grafias } }] : []),
    ],
  }
}
