/** Conteúdo editorial inicial. Fontes e pendências em docs/hub-institucional.md. */
export type HubCompany = {
  slug: string
  name: string
  segment: string
  partner?: string
  description: string
  activities: string[]
  units: { name: string; state: string }[]
  /** Marca da empresa. `shape` define como a placa do card enquadra o arquivo. */
  logo?: { src: string; shape: 'circle' | 'wide' }
  /** Cor de fundo da placa da marca no card (harmoniza com o arquivo do logo). */
  plate: string
  /** Iniciais usadas quando ainda não há logo aprovado. */
  monogram: string
  /** Site próprio da empresa; quando definido, os links do hub levam direto para ele. */
  externalUrl?: string
}

export const HUB_COMPANIES: HubCompany[] = [
  {
    slug: 'bebidas',
    logo: { src: '/logos/hub/bebidas.png', shape: 'wide' },
    plate: '#000000',
    monogram: 'PB',
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
    logo: { src: '/logos/hub/motos.png', shape: 'circle' },
    plate: '#2a1214',
    monogram: 'PM',
    name: 'Pau Brasil Motos',
    externalUrl: 'https://www.paubrasilmotos.com.br/valedosaofrancisco/',
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
    logo: { src: '/logos/hub/unida.png', shape: 'circle' },
    plate: '#e9e4dd',
    monogram: 'UC',
    name: 'Unida Construtora',
    segment: 'Construção',
    description:
      'Desenvolvimento de empreendimentos imobiliários e projetos de construção civil.',
    activities: ['Empreendimentos imobiliários', 'Construção civil'],
    units: [],
  },
  {
    slug: 'instituto-yso',
    logo: { src: '/logos/hub/instituto-yso.png', shape: 'circle' },
    plate: '#1c1a17',
    monogram: 'IY',
    name: 'Instituto YSO',
    segment: 'Impacto social',
    description:
      'Projetos sociais e educacionais voltados ao desenvolvimento da comunidade.',
    activities: ['Projetos sociais', 'Educação e comunidade'],
    units: [],
  },
  {
    slug: 'original-start',
    // A logo oficial (Drive de logos do grupo) identifica a empresa como "Moto Peças".
    logo: { src: '/logos/hub/original-start.png', shape: 'wide' },
    plate: '#f4f0ea',
    monogram: 'OS',
    name: 'Original Start',
    segment: 'Mobilidade',
    description: 'Loja de peças para motocicletas, ao lado de quem vive sobre duas rodas.',
    activities: ['Peças para motocicletas'],
    units: [],
  },
  {
    slug: 'hora-10',
    logo: { src: '/logos/hub/hora-10.png', shape: 'wide' },
    plate: '#000000',
    monogram: 'H10',
    name: 'Hora 10',
    segment: 'Serviços',
    description:
      'Soluções em gestão de pessoas e processos para o grupo e parceiros.',
    activities: ['Gestão de pessoas', 'Gestão de processos'],
    units: [],
  },
  {
    slug: 'locadora',
    logo: { src: '/logos/hub/locadora.png', shape: 'wide' },
    plate: '#f4f0ea',
    monogram: 'LP',
    name: 'Locadora Pau Brasil',
    segment: 'Mobilidade',
    description:
      'Locação de veículos e gestão de frotas para a mobilidade empresarial.',
    activities: ['Locação de veículos', 'Gestão de frotas'],
    units: [],
  },
  {
    slug: 'fazenda-divina',
    logo: { src: '/logos/hub/fazenda-divina.png', shape: 'circle' },
    plate: '#f4f0ea',
    monogram: 'FD',
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
    text: 'Bebidas, mobilidade, construção, agro, serviços e impacto social. Conheça as empresas que compõem o Grupo Pau Brasil e descubra suas áreas de atuação.',
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

/** Empresas em destaque no topo da grade (maiores operações e parceiros de marca). */
export const HUB_FEATURED = ['bebidas', 'motos'] as const

export const HUB_SEGMENT_COUNT = new Set(HUB_COMPANIES.map((c) => c.segment)).size

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
    companies: ['bebidas', 'motos', 'original-start', 'locadora'],
    reason: 'Negócios com atuação comercial e relacionamento com clientes.',
  },
  {
    id: 'mecanica',
    label: 'Mecânica e manutenção',
    companies: ['motos', 'original-start', 'locadora'],
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

/** Destino do link de uma empresa no hub: site próprio ou página interna. */
export function hubCompanyHref(company: HubCompany): string {
  return company.externalUrl ?? `/empresas/${company.slug}`
}
