import type { SecaoCampos } from '../_components/FormularioSimples'
import { CARREIRAS_GRUPOS } from '@/lib/carreiras-areas'

export const SECOES_CARGO: SecaoCampos[] = [
  {
    titulo: 'Identificação',
    campos: [
      { nome: 'cargo', label: 'Cargo', obrigatorio: true, meio: true },
      { nome: 'area', label: 'Área', obrigatorio: true, meio: true },
      { nome: 'tipoVaga', label: 'Tipo de vaga', meio: true, placeholder: 'Ex.: Operacional' },
      { nome: 'formacao', label: 'Formação exigida', meio: true, dica: 'O nível: Ensino Superior, Ensino Médio…' },
      { nome: 'statusCurso', label: 'Status do curso', meio: true, placeholder: 'Ex.: Formado, Cursando' },
      {
        nome: 'curso',
        label: 'Curso exigido',
        meio: true,
        dica: 'Qual curso, quando o cargo pede um específico',
      },
    ],
  },
  {
    titulo: 'Perfil esperado',
    campos: [
      { nome: 'descricaoAtividades', label: 'Descrição das atividades', tipo: 'textarea' },
      { nome: 'competenciasSugeridas', label: 'Competências sugeridas', tipo: 'textarea' },
      { nome: 'experienciaSugerida', label: 'Experiência sugerida', tipo: 'textarea' },
      {
        nome: 'exigencias',
        label: 'Exigências',
        tipo: 'textarea',
        dica: 'É o campo de maior peso na conferência de aderência das vagas',
      },
    ],
  },
  {
    titulo: 'Processo seletivo',
    campos: [
      { nome: 'etapasProcesso', label: 'Etapas do processo', tipo: 'textarea' },
      { nome: 'testes', label: 'Testes previstos', tipo: 'textarea' },
      {
        nome: 'frontline',
        label: 'É cargo de frontline',
        tipo: 'checkbox',
        meio: true,
        dica: 'A linha de frente da operação. Marca o candidato no painel e entra na conta de comprometimento de QLP.',
      },
      {
        nome: 'precisaAderenciaRaio',
        label: 'Exige residência dentro do raio',
        tipo: 'checkbox',
        meio: true,
        dica: 'Quando marcado, vagas que não citarem residência são apontadas',
      },
    ],
  },
  {
    titulo: 'Publicação na página de carreiras',
    campos: [
      {
        nome: 'publicarNoSite',
        label: 'Publicar este cargo no site',
        tipo: 'checkbox',
        meio: true,
        dica: 'Fora do site o descritivo continua valendo internamente. Só o candidato deixa de ver.',
      },
      {
        nome: 'grupoPublico',
        label: 'Grupo no site',
        tipo: 'select',
        meio: true,
        opcoes: [
          { valor: '', label: 'Não publicar' },
          ...CARREIRAS_GRUPOS.map((g) => ({ valor: g.slug, label: g.grupo })),
        ],
        dica: 'O site agrupa por área de interesse do candidato, que não é a mesma classificação interna.',
      },
      {
        nome: 'turnos',
        label: 'Turnos oferecidos',
        // Sem `tipo: 'lista'` o campo vazio vira `null` e a API, que espera
        // array, recusa o formulario inteiro com "Dados invalidos" — foi o bug
        // que travou a edicao de descritivo.
        tipo: 'lista',
        placeholder: 'Diurno, Noturno',
        dica: 'Separe por vírgula. Cada turno vira uma opção no site, apontando para este mesmo descritivo. Deixe vazio se o cargo não tem turno.',
      },
    ],
  },
  {
    titulo: 'Outros',
    campos: [{ nome: 'observacoes', label: 'Observações', tipo: 'textarea' }],
  },
]

export const VALORES_CARGO: Record<string, string> = {
  cargo: '',
  area: '',
  tipoVaga: '',
  formacao: '',
  statusCurso: '',
  curso: '',
  descricaoAtividades: '',
  competenciasSugeridas: '',
  experienciaSugerida: '',
  exigencias: '',
  etapasProcesso: '',
  testes: '',
  frontline: 'false',
  precisaAderenciaRaio: 'false',
  observacoes: '',
  publicarNoSite: 'false',
  grupoPublico: '',
  turnos: '',
}
