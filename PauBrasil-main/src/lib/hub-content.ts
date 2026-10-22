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
  /** Fundo da placa da marca; hoje todas usam HUB_PLATE para a grade ficar harmônica. */
  plate: string
  /** Iniciais usadas quando ainda não há logo aprovado. */
  monogram: string
  /** Site próprio da empresa; quando definido, os links do hub levam direto para ele. */
  externalUrl?: string
}

/** Fundo único das placas de marca: o areia da identidade, sobre o qual todas as logos funcionam. */
const HUB_PLATE = '#f1ebe3'

export const HUB_COMPANIES: HubCompany[] = [
  {
    slug: 'bebidas',
    logo: { src: '/logos/hub/bebidas.png', shape: 'wide' },
    plate: HUB_PLATE,
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
    logo: { src: '/logos/hub/motos-2026.png', shape: 'wide' },
    plate: HUB_PLATE,
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
    logo: { src: '/logos/hub/unida-2026.png', shape: 'wide' },
    plate: HUB_PLATE,
    monogram: 'UC',
    name: 'Unida Construtora',
    segment: 'Construção',
    description:
      'Desenvolvimento de empreendimentos imobiliários e projetos de construção civil.',
    activities: ['Empreendimentos imobiliários', 'Construção civil'],
    units: [{ name: 'João Pessoa', state: 'PB' }],
  },
  {
    slug: 'instituto-yso',
    logo: { src: '/logos/hub/instituto-yso-2026.png', shape: 'wide' },
    plate: HUB_PLATE,
    monogram: 'IY',
    name: 'Instituto YSO',
    segment: 'Saúde e estética',
    description:
      'Um dos grandes nomes da estética na Paraíba: cuidado, harmonia e saúde em um só lugar.',
    activities: ['Estética', 'Saúde e bem-estar'],
    units: [{ name: 'Sousa', state: 'PB' }],
  },
  {
    slug: 'original-start',
    // A logo oficial (Drive de logos do grupo) identifica a empresa como "Moto Peças".
    logo: { src: '/logos/hub/original-start.png', shape: 'wide' },
    plate: HUB_PLATE,
    monogram: 'OS',
    name: 'Original Start',
    segment: 'Mobilidade',
    description: 'Motopeças em Petrolina (PE), ao lado de quem vive sobre duas rodas.',
    activities: ['Peças para motocicletas'],
    units: [{ name: 'Petrolina', state: 'PE' }],
  },
  {
    slug: 'hora-10',
    logo: { src: '/logos/hub/hora-10.png', shape: 'wide' },
    plate: HUB_PLATE,
    monogram: 'H10',
    name: 'Hora 10',
    segment: 'Varejo',
    description:
      'Rede de lojas e supermercado que leva o varejo do grupo a cidades do interior da Paraíba.',
    activities: ['Lojas de varejo', 'Supermercado'],
    units: [],
  },
  {
    slug: 'locadora',
    logo: { src: '/logos/hub/locadora.png', shape: 'wide' },
    plate: HUB_PLATE,
    monogram: 'LP',
    name: 'Locadora Pau Brasil',
    segment: 'Mobilidade',
    description:
      'Locação de veículos e gestão de frotas para a mobilidade empresarial.',
    activities: ['Locação de veículos', 'Gestão de frotas'],
    units: [{ name: 'Sousa', state: 'PB' }],
  },
  {
    slug: 'fazenda-divina',
    logo: { src: '/logos/hub/fazenda-divina-2026.png', shape: 'wide' },
    plate: HUB_PLATE,
    monogram: 'FD',
    name: 'Fazenda Divina',
    segment: 'Agro',
    description:
      'Produção agropecuária com foco em pecuária e desenvolvimento genético.',
    activities: ['Pecuária', 'Desenvolvimento genético'],
    units: [{ name: 'Sousa', state: 'PB' }],
  },
]

/**
 * História do grupo em eras. Fontes: apresentação "01 Integração 1ª parte Pau Brasil e Ambev"
 * (origem em 1994, prêmios PEX), a linha do tempo oficial 2003–2025 e o material "Nossa
 * História" da diretoria (1994–2002), enviados pelo usuário.
 */
export type HubTimelineYear = {
  year: string
  /** Eventos que começam com "*" são reconhecimentos e títulos (exibidos com estrela). */
  events: string[]
  /** Empresas do grupo citadas no ano; exibidas como selos. */
  companies?: string[]
}

export type HubEra = {
  label: string
  range: string
  title: string
  summary: string
  years: HubTimelineYear[]
}

export const HUB_FOUNDING = {
  date: '14 de janeiro de 1994',
  city: 'Sousa, sertão da Paraíba',
  founders: 'Zenildo Rodrigues de Oliveira e Fábio Tyrone Braga de Oliveira',
}

export const HUB_ERAS: HubEra[] = [
  {
    label: 'As raízes',
    range: '1994 — 2002',
    title: 'Um sonho, dois jovens e uma rifa.',
    summary:
      'Sem capital e ainda menores de idade, os fundadores foram emancipados pelos pais para registrar a empresa. O dinheiro para começar veio de uma rifa de um bode.',
    years: [
      {
        year: '1994',
        events: [
          'Zenildo Rodrigues de Oliveira e Fábio Tyrone Braga de Oliveira fundam em Sousa (PB), em 14 de janeiro, a Comercial Industrial de Alimentos Pau Brasil Ltda, distribuidora de alimentos.',
        ],
      },
      {
        year: '1995',
        events: [
          'Distribuição da Técnica Brasileira de Alimentos (Bonamezza) na Paraíba e no Rio Grande do Norte.',
        ],
      },
      {
        year: '1997',
        events: ['Abertura da distribuição Bonamezza em Pernambuco, com sede em Recife (PE).'],
      },
      {
        year: '1999',
        events: ['Início da comercialização das usinas de açúcar e álcool de PE, AL, PB, SP e GO.'],
      },
      {
        year: '2001',
        events: ['Início das negociações para levar a marca Skol a todo o interior da Paraíba.'],
      },
      {
        year: '2002',
        events: [
          'Zenildo Oliveira assume, com a família, todas as cotas da Pau Brasil Ltda.',
          'Início das operações com Skol no sertão paraibano.',
          'Incorporação da 1ª revenda da marca Brahma, em Sousa (PB): nasce a Pau Brasil Bebidas.',
        ],
        companies: ['bebidas'],
      },
    ],
  },
  {
    label: 'Expansão no sertão',
    range: '2003 — 2009',
    title: 'De revenda local a referência no Nordeste.',
    summary:
      'Novas revendas incorporadas pela Paraíba, os primeiros prêmios da Ambev e o nascimento da Hora 10.',
    years: [
      {
        year: '2003',
        events: [
          '2ª revenda Antarctica, em Sousa (PB): a primeira revenda tri-marca do Nordeste.',
        ],
      },
      { year: '2004', events: ['3ª revenda: Antarctica de Pombal (PB).'] },
      {
        year: '2005',
        events: [
          'Seminário Pepsico/Ambev em Nova York e o plano de ser o 1º embaixador Ambev do Nordeste.',
        ],
      },
      {
        year: '2006',
        events: ['4ª revenda: Antarctica de Itaporanga (PB).', '*Leão de Bronze no PEX Ambev.'],
      },
      {
        year: '2007',
        events: ['5ª e 6ª revendas: Catolé do Rocha e São Bento (PB).', '*Leão de Ouro no PEX Ambev.'],
      },
      {
        year: '2008',
        events: ['Conveniência Pau Brasil em Sousa (PB).', '*Leão de Ouro no PEX Ambev.'],
      },
      {
        year: '2009',
        events: [
          'Nasce a Hora 10, marca de lojas para o varejo.',
          '*Embaixador no PEX Ambev; Zenildo integra o ciclo de embaixadores da InBev/Anheuser-Busch (EUA).',
        ],
      },
    ],
  },
  {
    label: 'Novos negócios',
    range: '2011 — 2016',
    title: 'O grupo ganha novos caminhos.',
    summary:
      'Chegam as motos Honda, a nova marca do Grupo Pau Brasil, o programa de sócios e a construção civil.',
    years: [
      {
        year: '2011',
        events: [
          'Abertura da loja Hora 10 em Cajazeiras (PB).',
          '7ª revenda incorporada: tri-marca Espinharas, de Patos (PB).',
        ],
        companies: ['hora-10'],
      },
      {
        year: '2012',
        events: [
          'Aquisição da Fórmula H Motos Honda, de Sousa (PB): nasce a Pau Brasil Motos.',
          'Criação da nova logo do Grupo Pau Brasil.',
        ],
        companies: ['motos'],
      },
      {
        year: '2014',
        events: [
          'Abertura da Hora 10 em Patos (PB) e criação da revenda Pau Brasil Patos.',
          '8ª incorporação: CDD Ambev do Cariri, Curimataú e Vale do Sabugi (PB).',
          'Criado o Programa Donos Pau Brasil, com Francisco Alisson Aragão como primeiro sócio.',
        ],
        companies: ['hora-10', 'bebidas'],
      },
      {
        year: '2015',
        events: ['Homologação do DAP, Departamento de Peças da Pau Brasil Motos.'],
        companies: ['motos'],
      },
      {
        year: '2016',
        events: [
          'Hora 10 abre lojas em Monteiro e Soledade (PB).',
          'Nasce a Unida Construtora e Incorporadora, em João Pessoa (PB).',
        ],
        companies: ['hora-10', 'unida'],
      },
    ],
  },
  {
    label: 'Novas fronteiras',
    range: '2017 — 2025',
    title: 'Além da Paraíba, sem perder a raiz.',
    summary:
      'Pernambuco e Bahia, novos empreendimentos, os maiores reconhecimentos da Ambev e novas empresas no grupo.',
    years: [
      {
        year: '2017',
        events: ['Pau Brasil Motos chega a Petrolina (PE) e Juazeiro (BA).'],
        companies: ['motos'],
      },
      { year: '2019', events: ['Abertura da Hora 10 em Pombal (PB).'], companies: ['hora-10'] },
      {
        year: '2020',
        events: [
          'Entrega do Edifício Unimare, em João Pessoa (PB).',
          'Pau Brasil Motos abre em Campina Grande (PB).',
          'Lançamento do projeto Pit Stop Hora 10.',
        ],
        companies: ['unida', 'motos', 'hora-10'],
      },
      {
        year: '2021',
        events: ['Hora 10 abre lojas em Princesa Isabel e Tavares (PB).'],
        companies: ['hora-10'],
      },
      {
        year: '2022',
        events: ['*Título no Programa de Excelência Ambev de Operação: DPO Sustentável.'],
        companies: ['bebidas'],
      },
      {
        year: '2023',
        events: [
          '*Leão de Prata: 2ª melhor revenda do Brasil, em Sousa (PB).',
          'Lançamento do Domus Jardins, em João Pessoa (PB).',
          '*Grupo Pau Brasil em 1º lugar em arrecadação de ICMS na Paraíba.',
        ],
        companies: ['bebidas', 'unida'],
      },
      {
        year: '2024',
        events: [
          'Inauguração da operação da revenda em Guarabira (PB).',
          '*Título de Embaixador Revenda Pau Brasil Ambev.',
          'Nascem a Fazenda Divina e a Pau Brasil Locadora, em Sousa (PB).',
          'Nova sede da Pau Brasil Motos em Petrolina (PE) e nasce a Original Start Motopeças.',
        ],
        companies: ['bebidas', 'fazenda-divina', 'locadora', 'motos', 'original-start'],
      },
      {
        year: '2025',
        events: [
          'Revenda em Brumado (BA), com filiais em Barra da Estiva e Caculé.',
          'Nasce o Instituto YSO, em Sousa (PB).',
          'Supermercado Hora 10 em Soledade (PB) e entrega do Unigreen, em João Pessoa (PB).',
        ],
        companies: ['bebidas', 'instituto-yso', 'hora-10', 'unida'],
      },
    ],
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
    companies: ['bebidas', 'motos', 'original-start', 'locadora', 'hora-10'],
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
    id: 'estetica',
    label: 'Saúde e estética',
    companies: ['instituto-yso'],
    reason: 'Atendimento em estética, harmonia e saúde.',
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

/**
 * Formato de uma campanha da newsletter no site. As campanhas são cadastradas no módulo
 * Gente (/gente/newsletter) e lidas do banco por src/lib/newsletter.ts.
 */
export type HubNewsPhoto = { src: string; blur: string; width: number; height: number; alt: string }

export type HubNews = {
  slug: string
  title: string
  /** Rótulo curto de data exibido no seletor (ex.: "25 set"). */
  date: string
  company: string
  unit: string
  summary: string
  tagline?: string
  photos: HubNewsPhoto[]
}
