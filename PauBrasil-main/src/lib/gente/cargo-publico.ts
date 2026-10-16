/**
 * O que do descritivo de cargo pode aparecer na página pública de carreiras.
 *
 * O descritivo é documento **interno**. Publicá-lo inteiro transformaria um
 * documento de RH em gabarito de processo seletivo. O que fica de fora, e por
 * quê:
 *
 * | Campo                  | Por que não sai                                  |
 * |------------------------|--------------------------------------------------|
 * | `testes`               | "Lógica, Excel, Matemática" entrega a prova       |
 * | `etapasProcesso`       | mapa do processo para quem quiser se preparar     |
 * | `observacoes`          | tem critério de triagem ("distância < 1h")        |
 * | `precisaAderenciaRaio` | filtro interno de elegibilidade                   |
 * | `competenciasSugeridas`| roteiro do perfil buscado; o candidato se molda   |
 *
 * A lista de permitidos é explícita, e não uma lista de proibidos: campo novo
 * no descritivo nasce privado e só aparece aqui se alguém decidir que deve.
 */

import { CARREIRAS_GRUPOS } from '@/lib/carreiras-areas'

/** Os campos do `RecCargo` que a projeção pública lê. */
export interface CargoInterno {
  id: string
  cargo: string
  area: string
  tipoVaga: string | null
  descricaoAtividades: string | null
  experienciaSugerida: string | null
  formacao: string | null
  statusCurso: string | null
  curso: string | null
  exigencias: string | null
  publicarNoSite: boolean
  grupoPublico: string | null
  turnos: string[]
}

export interface CargoPublico {
  id: string
  /** O nome como o candidato escolhe, já com o turno quando houver. */
  cargo: string
  grupo: string
  grupoSlug: string
  turno: string | null
  tipoVaga: string | null
  atividades: string | null
  experiencia: string | null
  formacao: string | null
  /** "Ensino Superior · Formado · Administração", já montado. */
  formacaoCompleta: string | null
  exigencias: string | null
}

/** Grupo público pelo slug; `null` quando o slug não existe mais. */
export function grupoPorSlug(slug: string | null | undefined) {
  if (!slug) return null
  return CARREIRAS_GRUPOS.find((g) => g.slug === slug) ?? null
}

/**
 * Área interna → grupo da página, **só onde a correspondência é um para um**.
 *
 * Existe para o cargo publicado sem grupo escolhido não sumir da página. Com a
 * publicação passando a ser o padrão, exigir que alguém escolha o grupo antes
 * transformaria "publicado" em "publicado e invisível".
 *
 * O mapa é curto de propósito. `Logística` fica **de fora**: na página ela se
 * divide em Armazém, Distribuição e Frota, e escolher por conta própria
 * colocaria um motorista dentro de Armazém. Área ambígua continua sem grupo, e
 * a tela do RH marca o cargo como "não listado" até alguém decidir.
 */
const GRUPO_POR_AREA: Record<string, string> = {
  financeiro: 'financeiro',
  vendas: 'vendas',
  marketing: 'vendas',
  'gente e gestao': 'rh',
  seguranca: 'seguranca',
  'servicos gerais': 'servicos-gerais',
  // Grupos criados em 2026-09-23 para estas duas áreas terem onde entrar.
  ti: 'tecnologia',
  todas: 'programas',
  administrativo: 'programas',
}

function normalizarArea(area: string | null | undefined): string {
  return (area ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** O grupo escolhido pelo RH; na falta dele, o que a área interna permite deduzir. */
export function grupoDoCargo(c: Pick<CargoInterno, 'grupoPublico' | 'area'>) {
  return grupoPorSlug(c.grupoPublico ?? GRUPO_POR_AREA[normalizarArea(c.area)])
}

/**
 * Nível, situação e curso numa linha só.
 *
 * São três campos distintos no cadastro — "Ensino Superior", "Cursando",
 * "Administração" — e três linhas soltas na tela não dizem que são a mesma
 * exigência.
 */
export function montarFormacao(c: Pick<CargoInterno, 'formacao' | 'statusCurso' | 'curso'>): string | null {
  const partes = [c.formacao, c.statusCurso, c.curso].map((p) => p?.trim()).filter(Boolean)
  return partes.length > 0 ? partes.join(' · ') : null
}

/**
 * Projeta um descritivo interno em uma ou mais entradas públicas.
 *
 * Devolve **lista** porque um descritivo com turnos vira várias opções: o
 * candidato escolhe "Ajudante de Armazém - Noturno", mas o descritivo por trás
 * é o mesmo. Foi a decisão do PO — um descritivo serve os dois turnos.
 *
 * Devolve vazio quando o cargo não deve aparecer: não publicado, ou sem grupo
 * público definido. Sem grupo não há onde encaixá-lo na página, e inventar um
 * lugar é pior do que omitir.
 */
export function projetarCargoPublico(c: CargoInterno): CargoPublico[] {
  if (!c.publicarNoSite) return []

  const grupo = grupoDoCargo(c)
  if (!grupo) return []

  const base = {
    id: c.id,
    grupo: grupo.grupo,
    grupoSlug: grupo.slug,
    tipoVaga: c.tipoVaga,
    atividades: c.descricaoAtividades,
    experiencia: c.experienciaSugerida,
    formacao: c.formacao,
    formacaoCompleta: montarFormacao(c),
    exigencias: c.exigencias,
  }

  const turnos = c.turnos.map((t) => t.trim()).filter(Boolean)
  if (turnos.length === 0) return [{ ...base, cargo: c.cargo, turno: null }]

  return turnos.map((turno) => ({ ...base, cargo: `${c.cargo} - ${turno}`, turno }))
}

export interface GrupoPublico {
  grupo: string
  slug: string
  cargos: CargoPublico[]
}

/**
 * Agrupa os cargos públicos na ordem curada de `CARREIRAS_GRUPOS`.
 *
 * A ordem é da página, não do banco: "Armazém" vem primeiro porque é onde
 * entra a maior parte das candidaturas, não porque começa com A. Grupo sem
 * cargo publicado não aparece — acordeão vazio é ruído.
 */
export function agruparParaSite(cargos: CargoInterno[]): GrupoPublico[] {
  const publicos = cargos.flatMap(projetarCargoPublico)

  return CARREIRAS_GRUPOS.map((g) => ({
    grupo: g.grupo,
    slug: g.slug,
    cargos: publicos
      .filter((c) => c.grupoSlug === g.slug)
      .sort((a, b) => a.cargo.localeCompare(b.cargo, 'pt-BR')),
  })).filter((g) => g.cargos.length > 0)
}

/** Todos os nomes publicados, para validar o que o candidato enviou. */
export function nomesPublicados(cargos: CargoInterno[]): string[] {
  return cargos.flatMap(projetarCargoPublico).map((c) => c.cargo)
}

// ─── Casamento com a lista pública ────────────────────────────────────────────

/**
 * Chave de comparação entre o nome do cargo na página e o nome do descritivo.
 *
 * O sufixo de turno some de propósito: a página oferece "Ajudante de Armazém -
 * Diurno" e "- Noturno", e o descritivo é um só, "Ajudante de Armazém". Foi a
 * decisão do PO — um descritivo serve os dois turnos.
 *
 * Sem isso o casamento é por nome exato e o primeiro cargo publicado não
 * aparece, que foi exatamente o que aconteceu.
 */
/**
 * Palavras de ligacao que nao distinguem um cargo de outro.
 *
 * Caso real: o RH publicou "Ajudante DE Distribuicao" e a lista da pagina
 * tinha "Ajudante DA Distribuicao". Uma preposicao fez o cargo entrar como
 * opcao nova em vez de ligar na que ja existia — o grupo Distribuicao passou
 * de 4 para 5 cargos, com a mesma funcao aparecendo duas vezes.
 *
 * Nao existe par de cargos realmente diferentes que so se distinga por "de"
 * ou "da". Por isso somem da chave.
 */
const LIGACOES = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

export function chaveDeCargo(nome: string): string {
  const base = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s*-?\s*(diurno|noturno)$/, '')
    .trim()

  return base
    .split(' ')
    .filter((t) => t && !LIGACOES.has(t))
    .join(' ')
}

/**
 * Índice dos descritivos publicados para consulta pela lista da página.
 *
 * A chave sem turno pode receber mais de um descritivo (dois cargos que só
 * diferem no turno). O primeiro vence, e é o comportamento certo: se existem
 * dois, qualquer um serve de descrição para ambos os turnos.
 */
export function indexarPorCargo(cargos: CargoPublico[]): Map<string, CargoPublico> {
  const indice = new Map<string, CargoPublico>()

  for (const c of cargos) {
    const chave = chaveDeCargo(c.cargo)
    if (!indice.has(chave)) indice.set(chave, c)
  }

  return indice
}

/** O descritivo de um cargo da lista pública, ou `null` se não houver. */
export function acharDescritivo(
  nomeNaPagina: string,
  indice: Map<string, CargoPublico>
): CargoPublico | null {
  return indice.get(chaveDeCargo(nomeNaPagina)) ?? null
}

// ─── Catálogo da página ───────────────────────────────────────────────────────

/** Uma opção como o candidato vê na lista. */
export interface CargoNaPagina {
  cargo: string
  grupoSlug: string
  /** Descritivo, quando o RH já publicou um para este cargo. */
  descritivo: CargoPublico | null
  /** Tem vaga aberta agora, vinda do Controle de Vagas. */
  vagaAberta: boolean
}

export interface GrupoNaPagina {
  grupo: string
  slug: string
  cargos: CargoNaPagina[]
}

/**
 * O catálogo que a página de carreiras oferece.
 *
 * **Só descritivos.** Até 2026-09-23 esta função unia a lista curada de
 * `carreiras-areas.ts` com os descritivos publicados, porque quase nenhum
 * cargo tinha descritivo e tirar a lista deixaria a página vazia. Com os 57
 * descritivos cadastrados e publicados, a união deixou de fazer sentido: ela
 * mantinha no ar cargos sem descrição nenhuma, que o candidato escolhia sem
 * saber o que eram.
 *
 * Consequência assumida com o PO: cargo sem descritivo **não aparece**. Quem
 * decide o que existe na página é quem escreve o descritivo.
 */
export function montarCatalogo(
  publicados: CargoInterno[],
  cargosComVagaAberta: string[] = []
): GrupoNaPagina[] {
  const comVaga = new Set(cargosComVagaAberta.map(chaveDeCargo))

  const grupos = CARREIRAS_GRUPOS.map((g) => ({ grupo: g.grupo, slug: g.slug, cargos: [] as CargoNaPagina[] }))
  const jaNaLista = new Set<string>()

  for (const p of publicados.flatMap(projetarCargoPublico)) {
    const chave = chaveDeCargo(p.cargo)
    if (jaNaLista.has(chave)) continue

    const grupo = grupos.find((g) => g.slug === p.grupoSlug)
    if (!grupo) continue

    grupo.cargos.push({
      cargo: p.cargo,
      grupoSlug: p.grupoSlug,
      descritivo: p,
      vagaAberta: comVaga.has(chave),
    })
    jaNaLista.add(chave)
  }

  /*
    Cargo com vaga aberta sobe dentro do grupo: é o que o candidato tem mais
    chance de conseguir agora, e enterrá-lo no meio da lista desperdiça a
    informação. O resto segue em ordem alfabética.
  */
  for (const g of grupos) {
    g.cargos.sort((a, b) => {
      if (a.vagaAberta !== b.vagaAberta) return a.vagaAberta ? -1 : 1
      return a.cargo.localeCompare(b.cargo, 'pt-BR')
    })
  }

  return grupos.filter((g) => g.cargos.length > 0)
}


/**
 * Todos os nomes que o catálogo aceita.
 *
 * É a lista de permitidos da validação de envio: com o catálogo crescendo a
 * partir dos descritivos, um `enum` fixo recusaria justamente o cargo que o
 * RH acabou de publicar — o candidato veria a opção e não conseguiria enviar.
 */
export function nomesDoCatalogo(catalogo: GrupoNaPagina[]): string[] {
  return catalogo.flatMap((g) => g.cargos.map((c) => c.cargo))
}

/** Os grupos de um conjunto de cargos escolhidos, para gravar na candidatura. */
export function gruposDosCargos(catalogo: GrupoNaPagina[], cargos: string[]): string[] {
  const porCargo = new Map(
    catalogo.flatMap((g) => g.cargos.map((c) => [chaveDeCargo(c.cargo), g.slug] as const))
  )

  return Array.from(
    new Set(cargos.map((c) => porCargo.get(chaveDeCargo(c))).filter((s): s is string => Boolean(s)))
  )
}
