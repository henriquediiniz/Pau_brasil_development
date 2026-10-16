export interface OperacaoRH {
  label: string
  uf: 'PB' | 'BA'
  tipo: 'Matriz' | 'Filial'
  cidades: string[]
}

/**
 * Mapeamento de zonas de influência de cada operação do Grupo Pau Brasil.
 * Inclui a sede e municípios num raio de ~80-100 km com maior probabilidade
 * de candidatos aptos a trabalhar naquela unidade.
 */
export const OPERACOES_RH: Record<string, OperacaoRH> = {
  patos: {
    label: 'Patos',
    uf: 'PB',
    tipo: 'Matriz',
    cidades: [
      'Patos', 'São Mamede', 'São José do Bonfim', 'Santa Teresinha',
      'Cacimba de Areia', "Mãe d'Água", 'Catingueira', 'Coremas',
      'Pombal', 'Condado', 'Vista Serrana', 'Jericó', 'Quixaba',
      'Passagem', 'Emas', 'Areia de Baraúnas', 'Malta', 'Lagoa',
      'Aguiar', 'Aparecida',
    ],
  },

  sume: {
    label: 'Sumé',
    uf: 'PB',
    tipo: 'Filial',
    cidades: [
      'Sumé', 'Monteiro', 'Congo', 'Camalaú', 'Serra Branca',
      'São João do Tigre', 'Amparo', 'Ouro Velho', 'Santo André',
      'Coxixola', 'Zabelê', 'Prata', 'São Sebastião do Umbuzeiro',
    ],
  },

  sousa: {
    label: 'Sousa',
    uf: 'PB',
    tipo: 'Matriz',
    cidades: [
      'Sousa', 'Cajazeiras', 'São Gonçalo', 'Marizópolis', 'Lastro',
      'São Francisco', 'Triunfo', 'Paulista', 'Nazarezinho', 'Santa Cruz',
      'Uiraúna', 'Vieirópolis', 'Bernardino Batista', 'Bom Sucesso',
      'Poço Dantas', 'São João do Rio do Peixe', 'Cachoeira dos Índios',
      'Carrapateira',
    ],
  },

  itaporanga: {
    label: 'Itaporanga',
    uf: 'PB',
    tipo: 'Filial',
    cidades: [
      'Itaporanga', 'Desterro', 'Igaracy', 'Boa Ventura', 'Diamante',
      'Serra Grande', 'Santana dos Garrotes', 'Nova Olinda', 'Conceição',
      'Imaculada', 'São José de Caiana', 'Curral Velho',
    ],
  },

  guarabira: {
    label: 'Guarabira',
    uf: 'PB',
    tipo: 'Matriz',
    cidades: [
      'Guarabira', 'Serraria', 'Pilõezinhos', 'Caiçara', 'Araçagi',
      'Belém', 'Sertãozinho', 'Lagoa de Dentro', 'Pirpirituba',
      'Alagoinha', 'Logradouro', 'Dona Inês', 'Serra da Raiz',
      'Duas Estradas', 'Mulungu', 'Alagoa Grande', 'Borborema',
      'Montadas', 'Solânea', 'Bananeiras',
    ],
  },

  brumado: {
    label: 'Brumado',
    uf: 'BA',
    tipo: 'Matriz',
    cidades: [
      'Brumado', 'Livramento de Nossa Senhora', 'Rio de Contas',
      'Aracatu', 'Dom Basílio', 'Tanhaçu', 'Malhada de Pedras',
      'Caetité', 'Dom Rodrigues', 'Belo Campo', 'Guanambi',
      'Ibitiara', 'Paramirim',
    ],
  },

  barra_da_estiva: {
    label: 'Barra da Estiva',
    uf: 'BA',
    tipo: 'Filial',
    cidades: [
      'Barra da Estiva', 'Mucugê', 'Ibicoara', 'Ituaçu', 'Jussiape',
      'Iramaia', 'Rio de Contas', 'Contendas do Sincorá', 'Andaraí',
      'Almadina',
    ],
  },

  cacule: {
    label: 'Caculé',
    uf: 'BA',
    tipo: 'Filial',
    cidades: [
      'Caculé', 'Candiba', 'Guajeru', 'Ibiassucê', 'Licínio de Almeida',
      'Sebastião Laranjeiras', 'Anagé', 'Caetité', 'Pindaí', 'Igaporã',
      'Presidente Jânio Quadros',
    ],
  },
}
