import type { SecaoCampos } from '../_components/FormularioSimples'

export const SECOES_SUCESSAO: SecaoCampos[] = [
  {
    titulo: 'Cargo a cobrir',
    campos: [
      { nome: 'operacaoId', label: 'Operação', obrigatorio: true, meio: true },
      { nome: 'cargoSucessao', label: 'Cargo de sucessão', obrigatorio: true, meio: true },
      { nome: 'areaCargoSucessao', label: 'Área do cargo', meio: true },
      { nome: 'cicloGente', label: 'Ciclo de gente', meio: true, placeholder: 'Ex.: 2026' },
    ],
  },
  {
    titulo: 'Sucessor',
    campos: [
      { nome: 'nomeSucessor', label: 'Nome do sucessor', obrigatorio: true, meio: true },
      { nome: 'cargoAtualSucessor', label: 'Cargo atual', meio: true },
      {
        nome: 'prontoAgora',
        label: 'Pronto agora',
        tipo: 'checkbox',
        meio: true,
        dica: 'Marcando aqui, o horizonte passa a ser "agora"',
      },
      { nome: 'pronto1Ano', label: 'Pronto em 1 ano', tipo: 'checkbox', meio: true },
      { nome: 'pronto2Anos', label: 'Pronto em 2 anos', tipo: 'checkbox', meio: true },
      { nome: 'inicioMapeamento', label: 'Início do mapeamento', tipo: 'data', meio: true },
    ],
  },
  {
    titulo: 'Desenvolvimento',
    campos: [
      { nome: 'habilidadeTecnica', label: 'Habilidade técnica', tipo: 'textarea' },
      { nome: 'habilidadeComportamental', label: 'Habilidade comportamental', tipo: 'textarea' },
      {
        nome: 'planoDesenvolvimento',
        label: 'Plano de desenvolvimento',
        tipo: 'textarea',
        dica: 'Sucessor que não está pronto sem plano é mapeamento sem consequência',
      },
      { nome: 'observacao', label: 'Observação', tipo: 'textarea' },
    ],
  },
]

export const VALORES_SUCESSAO: Record<string, string> = {
  operacaoId: '',
  cargoSucessao: '',
  areaCargoSucessao: '',
  cicloGente: '',
  nomeSucessor: '',
  cargoAtualSucessor: '',
  prontoAgora: 'false',
  pronto1Ano: 'false',
  pronto2Anos: 'false',
  inicioMapeamento: '',
  habilidadeTecnica: '',
  habilidadeComportamental: '',
  planoDesenvolvimento: '',
  observacao: '',
}

export const SECOES_INTERNO: SecaoCampos[] = [
  {
    titulo: 'Pessoa',
    campos: [
      { nome: 'operacaoId', label: 'Operação', obrigatorio: true, meio: true },
      { nome: 'nome', label: 'Nome', obrigatorio: true, meio: true },
      { nome: 'cargoAtual', label: 'Cargo atual', meio: true },
      { nome: 'setorAtual', label: 'Setor atual', meio: true },
      { nome: 'tempoFuncao', label: 'Tempo na função', meio: true, placeholder: 'Ex.: 2 anos' },
      { nome: 'matrizOuFilial', label: 'Matriz ou filial', meio: true },
    ],
  },
  {
    titulo: 'Movimentação pretendida',
    campos: [
      { nome: 'cargoPretendido', label: 'Cargo pretendido', meio: true },
      { nome: 'avaliacaoCiclo', label: 'Avaliação do ciclo', meio: true, placeholder: 'Ex.: MUITO BOM' },
      {
        nome: 'possuiRequisitos',
        label: 'Já possui os requisitos',
        tipo: 'checkbox',
        meio: true,
      },
      {
        nome: 'situacao',
        label: 'Situação',
        tipo: 'select',
        meio: true,
        opcoes: [
          { valor: 'AGUARDANDO', label: 'Aguardando' },
          { valor: 'PROMOVIDO', label: 'Promovido' },
          { valor: 'NAO_ATENDE', label: 'Não atende' },
          { valor: 'DESLIGADO', label: 'Desligado' },
          { valor: 'OUTRA', label: 'Outra' },
        ],
      },
      {
        nome: 'futurosCargos',
        label: 'Futuros cargos',
        // Sem `tipo: 'lista'` o campo era enviado como texto e a API, que
        // espera array, recusava o cadastro inteiro com "Dados invalidos".
        // Mesmo bug que travou o descritivo de cargo em `turnos`.
        tipo: 'lista',
        dica: 'Separe por ponto e vírgula. Cada cargo vira um passo do plano de carreira.',
        placeholder: 'Supervisor de Vendas; Coordenador Comercial',
      },
      { nome: 'observacoes', label: 'Observações', tipo: 'textarea' },
    ],
  },
]

export const VALORES_INTERNO: Record<string, string> = {
  operacaoId: '',
  nome: '',
  cargoAtual: '',
  setorAtual: '',
  tempoFuncao: '',
  matrizOuFilial: '',
  cargoPretendido: '',
  avaliacaoCiclo: '',
  possuiRequisitos: 'false',
  situacao: 'AGUARDANDO',
  futurosCargos: '',
  observacoes: '',
}
