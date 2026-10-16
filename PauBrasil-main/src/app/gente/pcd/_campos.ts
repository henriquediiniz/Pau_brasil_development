import type { SecaoCampos } from '../_components/FormularioSimples'

export const SECOES_PCD: SecaoCampos[] = [
  {
    titulo: 'Pessoa',
    campos: [
      { nome: 'operacaoId', label: 'Operação', obrigatorio: true, meio: true },
      { nome: 'nome', label: 'Nome', obrigatorio: true, meio: true },
      { nome: 'funcao', label: 'Função', meio: true },
      { nome: 'admissao', label: 'Admissão', tipo: 'data', meio: true },
      { nome: 'sexo', label: 'Sexo', meio: true },
      { nome: 'cor', label: 'Cor/raça', meio: true },
    ],
  },
  {
    titulo: 'Deficiência',
    campos: [
      {
        nome: 'deficiencia',
        label: 'Tipo de deficiência',
        meio: true,
        dica: 'Dado de saúde — fica restrito ao RH',
      },
      { nome: 'tipo', label: 'Classificação', meio: true },
    ],
  },
]

export const VALORES_PCD: Record<string, string> = {
  operacaoId: '',
  nome: '',
  funcao: '',
  admissao: '',
  sexo: '',
  cor: '',
  deficiencia: '',
  tipo: '',
}

export const SECOES_APRENDIZ: SecaoCampos[] = [
  {
    titulo: 'Pessoa',
    campos: [
      { nome: 'operacaoId', label: 'Operação', obrigatorio: true, meio: true },
      { nome: 'nome', label: 'Nome', obrigatorio: true, meio: true },
      { nome: 'dataNascimento', label: 'Data de nascimento', tipo: 'data', meio: true },
      { nome: 'sexo', label: 'Sexo', meio: true },
    ],
  },
  {
    titulo: 'Contrato',
    campos: [
      { nome: 'admissao', label: 'Admissão', tipo: 'data', meio: true },
      {
        nome: 'inicioContrato',
        label: 'Início do contrato',
        tipo: 'data',
        meio: true,
      },
      {
        nome: 'terminoContrato',
        label: 'Término do contrato',
        tipo: 'data',
        meio: true,
        dica: 'Sem esta data, o contrato não entra no alerta de vencimento',
      },
      {
        nome: 'situacao',
        label: 'Situação',
        tipo: 'select',
        meio: true,
        opcoes: [
          { valor: 'VIGENTE', label: 'Vigente' },
          { valor: 'ENCERRADO', label: 'Encerrado' },
          { valor: 'DESLIGADO', label: 'Desligado' },
        ],
      },
      { nome: 'fundacao', label: 'Fundação / instituição', meio: true, placeholder: 'Ex.: CIEE' },
      { nome: 'horario', label: 'Horário', meio: true, placeholder: 'Ex.: 08:00 às 12:00' },
    ],
  },
  {
    titulo: 'Lotação',
    campos: [
      { nome: 'funcao', label: 'Função', meio: true },
      { nome: 'departamento', label: 'Departamento', meio: true },
      { nome: 'centroCusto', label: 'Centro de custo', meio: true },
      {
        nome: 'setor',
        label: 'Setor',
        tipo: 'select',
        meio: true,
        opcoes: [
          { valor: 'DPO', label: 'DPO' },
          { valor: 'SPO', label: 'SPO' },
        ],
      },
      { nome: 'gestorNome', label: 'Gestor', meio: true },
    ],
  },
]

export const VALORES_APRENDIZ: Record<string, string> = {
  operacaoId: '',
  nome: '',
  dataNascimento: '',
  sexo: '',
  admissao: '',
  inicioContrato: '',
  terminoContrato: '',
  situacao: 'VIGENTE',
  fundacao: '',
  horario: '',
  funcao: '',
  departamento: '',
  centroCusto: '',
  setor: '',
  gestorNome: '',
}

/** Coerência que o RH costuma errar: término antes do início. */
export function validarAprendiz(v: Record<string, string>): Record<string, string> {
  const erros: Record<string, string> = {}
  if (v.terminoContrato && v.inicioContrato && v.terminoContrato < v.inicioContrato) {
    erros.terminoContrato = 'Término não pode ser antes do início'
  }
  return erros
}
