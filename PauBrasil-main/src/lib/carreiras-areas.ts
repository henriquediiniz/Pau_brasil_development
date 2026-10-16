/**
 * src/lib/carreiras-areas.ts
 *
 * Grupos da página de carreiras, e a lista de cargos que a alimentava.
 *
 * **Os cargos aqui não são mais o catálogo público.** Desde 2026-09-23 a
 * página de carreiras é montada a partir dos descritivos de cargo cadastrados
 * (`RecCargo` com `publicarNoSite`), em `src/lib/gente/cargo-publico.ts`.
 *
 * O array `cargos` continua existindo porque as candidaturas **já recebidas**
 * guardam o nome do cargo como texto, com a grafia desta lista. As telas do
 * Banco de Talentos filtram por esses nomes, e esvaziar o array deixaria o
 * filtro do histórico sem opções.
 *
 * Os **grupos** seguem canônicos: são a arquitetura da página, curada, e não
 * acompanham a área interna do RH.
 * Todos os cargos pertencem à Pau Brasil Bebidas.
 *
 * Para adicionar novos cargos: inclua no array do grupo correspondente.
 * TODOS_CARGOS e a validação Zod são derivados automaticamente.
 */

export interface CargoGrupo {
  grupo: string
  slug: string
  cargos: string[]
}

export const CARREIRAS_GRUPOS: CargoGrupo[] = [
  {
    grupo: 'Armazém',
    slug: 'armazem',
    cargos: [
      'Estagiário - Logística',
      'Auxiliar de Logística',
      'Analista Controle de Armazém',
      'Ajudante de Armazém - Diurno',
      'Ajudante de Armazém - Noturno',
      'Conferente de Armazém - Diurno',
      'Conferente de Armazém - Noturno',
      'Operador de Empilhadeira - Diurno',
      'Operador de Empilhadeira - Noturno',
      'Coordenador de Armazém',
      'Gerente de Logística',
    ],
  },
  {
    grupo: 'Distribuição',
    slug: 'distribuicao',
    cargos: [
      'Motorista da Distribuição',
      'Ajudante da Distribuição',
      'Motorista de Carreta',
      'Coordenador da Distribuição',
    ],
  },
  {
    grupo: 'Frota',
    slug: 'frota',
    cargos: [
      'Auxiliar de Frota',
      'Coordenador de Frotas',
    ],
  },
  {
    grupo: 'Vendas & Marketing',
    slug: 'vendas',
    cargos: [
      'Estagiário - Promotor',
      'Auxiliar de Marketing',
      'Promotor',
      'Representante de Negócio',
      'Analista de Preço',
      'Coordenador de Preços',
      'Gerente de Vendas',
      'Supervisor de Nível de Serviço',
    ],
  },
  {
    grupo: 'Financeiro',
    slug: 'financeiro',
    cargos: [
      'Estagiário - Financeiro',
      'Auxiliar Financeiro',
      'Analista Financeiro',
      'Faturista',
      'Coordenador Financeiro',
      'Gerente Financeiro',
    ],
  },
  {
    grupo: 'Recursos Humanos',
    slug: 'rh',
    cargos: [
      'Jovem Aprendiz',
      'Estagiário - Recursos Humanos',
      'Auxiliar de RH',
      'Analista de RH',
      'Coordenador de RH',
      'Gerente de RH',
    ],
  },
  {
    grupo: 'Segurança',
    slug: 'seguranca',
    cargos: [
      'Auxiliar de Segurança',
      'Técnico em Segurança',
    ],
  },
  {
    grupo: 'Tecnologia',
    slug: 'tecnologia',
    // Grupo criado em 2026-09-23: os descritivos de TI não tinham onde entrar
    // na página e ficavam invisíveis mesmo publicados.
    cargos: [],
  },
  {
    grupo: 'Programas',
    slug: 'programas',
    // Aprendiz, Estagiário e Trainee são programas de entrada, não cargos de
    // uma área. Antes ficavam nas áreas internas "Todas" e "Administrativo",
    // que não existem na página.
    cargos: [],
  },
  {
    grupo: 'Serviços Gerais',
    slug: 'servicos-gerais',
    cargos: [
      'Serviços Gerais',
    ],
  },
]

/** Lista flat de todos os cargos válidos — usada para validação no backend */
export const TODOS_CARGOS = CARREIRAS_GRUPOS.flatMap(g => g.cargos) as [string, ...string[]]

/**
 * Dado um array de cargos, retorna os slugs dos grupos correspondentes (sem duplicatas).
 * Usado para derivar `gruposInteresse` a partir de `cargosInteresse`.
 */
export function getCargosGrupos(cargos: string[]): string[] {
  const slugs = cargos.flatMap(cargo =>
    CARREIRAS_GRUPOS
      .filter(g => g.cargos.includes(cargo))
      .map(g => g.slug)
  )
  return Array.from(new Set(slugs))
}

/** State machine — transições permitidas entre etapas de candidatura */
export const TRANSICOES_VALIDAS: Record<string, string[]> = {
  /*
    Rejeitar direto de "Novos Recebidos" e legitimo: o RH abre o curriculo que
    acabou de chegar e ja ve que nao serve. Ate 2026-09-23 so `TRIAGEM` era
    permitido, entao o botao "Rejeitar Candidato" na primeira coluna chamava a
    API, tomava "Transicao invalida" e o cartao ficava onde estava — o RH
    reabria o mesmo curriculo varias vezes sem entender por que.
  */
  RECEBIDO:   ['TRIAGEM', 'REJEITADO', 'ARQUIVADO'],
  TRIAGEM:    ['ENTREVISTA', 'REJEITADO', 'ARQUIVADO'],
  ENTREVISTA: ['APROVADO', 'REJEITADO', 'ARQUIVADO'],
  APROVADO:   ['ARQUIVADO'],
  /*
    Rejeitado e Arquivado deixaram de ser beco sem saida (pedido do PO em
    2026-10-01). O RH rejeita por engano, ou arquiva alguem que meses depois
    serve para outra vaga — e o candidato ficava preso, sem poder ir para
    canto nenhum.

    A volta e para o funil (Recebido, Triagem, Entrevista), nunca direto para
    Aprovado: quem volta precisa passar de novo pela entrevista, e aprovar sem
    ela esconderia a entrevista que nao houve.
  */
  REJEITADO:  ['RECEBIDO', 'TRIAGEM', 'ENTREVISTA', 'ARQUIVADO'],
  ARQUIVADO:  ['RECEBIDO', 'TRIAGEM', 'ENTREVISTA', 'REJEITADO'],
}
