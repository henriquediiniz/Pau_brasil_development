/** Conteúdo editorial inicial. Fontes e pendências em docs/hub-institucional.md. */
export type HubCompany = {
  slug: string
  name: string
  segment: string
  partner?: string
  description: string
  activities: string[]
  units: { name: string; state: string }[]
}

export const HUB_COMPANIES: HubCompany[] = [
  {
    slug: 'bebidas',
    name: 'Pau Brasil Bebidas',
    segment: 'Distribuição',
    partner: 'Ambev',
    description:
      'Da distribuição ao ponto de venda, conectamos marcas e negócios por meio da nossa operação de bebidas.',
    activities: [
      'Distribuição de bebidas',
      'Logística e armazenagem',
      'Vendas e relacionamento',
    ],
    units: [
      { name: 'Patos', state: 'PB' },
      { name: 'Sumé', state: 'PB' },
      { name: 'Sousa', state: 'PB' },
      { name: 'Itaporanga', state: 'PB' },
      { name: 'Guarabira', state: 'PB' },
      { name: 'Brumado', state: 'BA' },
      { name: 'Barra da Estiva', state: 'BA' },
      { name: 'Caculé', state: 'BA' },
    ],
  },
  {
    slug: 'motos',
    name: 'Pau Brasil Motos',
    segment: 'Mobilidade',
    partner: 'Honda',
    description:
      'Uma rede de concessionárias Honda que acompanha cada jornada, da escolha da moto ao cuidado com ela.',
    activities: [
      'Venda de motocicletas',
      'Peças e acessórios',
      'Assistência técnica',
    ],
    units: [],
  },
  {
    slug: 'unida',
    name: 'Unida Construtora',
    segment: 'Construção',
    description:
      'Desenvolvimento de empreendimentos imobiliários e projetos de construção civil.',
    activities: ['Empreendimentos imobiliários', 'Construção civil'],
    units: [],
  },
  {
    slug: 'instituto-yso',
    name: 'Instituto YSO',
    segment: 'Impacto social',
    description:
      'Projetos sociais e educacionais voltados ao desenvolvimento da comunidade.',
    activities: ['Projetos sociais', 'Educação e comunidade'],
    units: [],
  },
  {
    slug: 'original-start',
    name: 'Original Start',
    segment: 'Inovação',
    description:
      'Iniciativas de inovação, empreendedorismo e desenvolvimento de novos negócios.',
    activities: ['Empreendedorismo', 'Novos negócios'],
    units: [],
  },
  {
    slug: 'hora-10',
    name: 'Hora 10',
    segment: 'Serviços',
    description:
      'Soluções em gestão de pessoas e processos para o grupo e parceiros.',
    activities: ['Gestão de pessoas', 'Gestão de processos'],
    units: [],
  },
  {
    slug: 'locadora',
    name: 'Locadora Pau Brasil',
    segment: 'Mobilidade',
    description:
      'Locação de veículos e gestão de frotas para a mobilidade empresarial.',
    activities: ['Locação de veículos', 'Gestão de frotas'],
    units: [],
  },
  {
    slug: 'fazenda-divina',
    name: 'Fazenda Divina',
    segment: 'Agro',
    description:
      'Produção agropecuária com foco em pecuária e desenvolvimento genético.',
    activities: ['Pecuária', 'Desenvolvimento genético'],
    units: [],
  },
]

// As fases são editoriais: não estabelecem datas nem uma ordem histórica não confirmada.
export const HUB_STORY = [
  {
    label: 'Nossas raízes',
    title: 'Uma história feita de pessoas.',
    text: 'O Grupo Pau Brasil reúne negócios de diferentes segmentos com raízes no Nordeste. Este espaço vai preservar as pessoas, as memórias e os acontecimentos que construíram essa trajetória.',
    note: 'Acervo histórico em preparação · datas e fotografias serão incorporadas após validação.',
  },
  {
    label: 'Nossos negócios',
    title: 'Diferentes caminhos. O mesmo grupo.',
    text: 'Bebidas, mobilidade, construção, agro, serviços, inovação e impacto social. Conheça as empresas que compõem o Grupo Pau Brasil e descubra suas áreas de atuação.',
    note: 'Explore as empresas e as unidades disponíveis nesta primeira versão.',
  },
  {
    label: 'Nossa gente',
    title: 'Crescer também é compartilhar.',
    text: 'A Universidade Pau Brasil conecta colaboradores ao conhecimento produzido dentro do grupo. Carreiras e banco de talentos abrem caminhos para quem deseja fazer parte dessa história.',
    note: 'Acesse os cursos e o portal de carreiras pelos links abaixo.',
  },
  {
    label: 'Nova identidade · 2026',
    title: 'As mesmas raízes. Um novo capítulo.',
    text: 'A nova identidade visual traz a árvore como símbolo de origem, crescimento e pertencimento. A marca acompanha este novo espaço de encontro entre as empresas e as pessoas do grupo.',
    note: 'Identidade visual fornecida pelo Grupo Pau Brasil.',
  },
]

export const HUB_INTERESTS = [
  {
    id: 'logistica',
    label: 'Logística e distribuição',
    companies: ['bebidas', 'locadora'],
    reason:
      'Atividades ligadas à distribuição de produtos e à gestão de frotas.',
  },
  {
    id: 'comercial',
    label: 'Vendas e atendimento',
    companies: ['bebidas', 'motos', 'locadora'],
    reason: 'Negócios com atuação comercial e relacionamento com clientes.',
  },
  {
    id: 'mecanica',
    label: 'Mecânica e manutenção',
    companies: ['motos', 'locadora'],
    reason: 'Negócios ligados a veículos, peças e assistência técnica.',
  },
  {
    id: 'construcao',
    label: 'Engenharia e construção',
    companies: ['unida'],
    reason: 'Atuação em construção civil e empreendimentos imobiliários.',
  },
  {
    id: 'pessoas',
    label: 'Pessoas e educação',
    companies: ['hora-10', 'instituto-yso'],
    reason: 'Atuação em gestão de pessoas, educação e projetos sociais.',
  },
  {
    id: 'inovacao',
    label: 'Inovação e negócios',
    companies: ['original-start'],
    reason: 'Iniciativas de empreendedorismo e novos negócios.',
  },
  {
    id: 'agro',
    label: 'Agropecuária',
    companies: ['fazenda-divina'],
    reason: 'Atuação em pecuária e desenvolvimento genético.',
  },
] as const

/** Orientação editorial por interesse declarado; não classifica nem rejeita candidatos. */
export function suggestHubCompanies(interestId: string): HubCompany[] {
  const interest = HUB_INTERESTS.find((item) => item.id === interestId)
  if (!interest) return []
  return HUB_COMPANIES.filter((company) =>
    (interest.companies as readonly string[]).includes(company.slug),
  )
}
