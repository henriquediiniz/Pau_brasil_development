/**
 * Importador dos descritivos de cargo.
 *
 * Difere dos outros importadores do módulo em duas coisas, e as duas vêm da
 * natureza do dado:
 *
 * 1. **Não tem unidade.** O descritivo é da empresa, não da operação: o padrão
 *    de "Analista de Controle" não muda entre Patos e Sumé. Por isso não há
 *    coluna de operação aqui e o analisador não recebe `OperacaoRef[]`.
 *
 * 2. **Atualiza, não só cria.** A planilha do RH é revisada e reenviada — a
 *    versão que originou este código chama-se "Cargos e Ajustes". Importar de
 *    novo tem que corrigir o descritivo existente, senão o segundo envio
 *    esbarraria no `@@unique([empresaId, cargo, area])` e o RH teria que
 *    apagar tudo antes. A chave de identidade é (cargo, área), a mesma do
 *    banco.
 *
 * O cabeçalho real da planilha vem na **segunda** linha: a primeira é uma
 * faixa de agrupamento ("Sobre a Vaga", "Requisitos e Qualificações"). Isso
 * não precisa de tratamento aqui — `localizarTabela` procura a linha com mais
 * cabeçalhos reconhecidos, e a faixa não tem nenhum.
 */

import { normalizar, type LinhaPlanilha, type ProblemaImportacao } from './vaga-importador'
import { converterSimNao } from './sucessao'

export interface CargoImportado {
  linha: number
  cargo: string
  area: string
  tipoVaga: string | null
  descricaoAtividades: string | null
  competenciasSugeridas: string | null
  experienciaSugerida: string | null
  formacao: string | null
  statusCurso: string | null
  curso: string | null
  exigencias: string | null
  observacoes: string | null
  etapasProcesso: string | null
  testes: string | null
  precisaAderenciaRaio: boolean
  chaveDedupe: string
}

export interface RelatorioCargos {
  total: number
  validos: CargoImportado[]
  erros: ProblemaImportacao[]
  avisos: ProblemaImportacao[]
  duplicados: ProblemaImportacao[]
}

/**
 * Os rótulos aceitos. O primeiro de cada lista é o que a planilha do RH usa
 * hoje; os demais são variações que já apareceram ou que são previsíveis.
 *
 * Os títulos da planilha original vêm com espaço sobrando ("Formação ",
 * "Status ", "Exigências "). Não precisam entrar aqui: `normalizar` corta
 * espaços nas pontas e acentos.
 */
export const COLUNAS_CARGO: Record<string, string[]> = {
  cargo: ['cargo', 'nome do cargo', 'funcao', 'posicao'],
  area: ['area', 'area do cargo', 'setor', 'departamento'],
  tipoVaga: ['tipo vaga', 'tipo de vaga', 'tipo', 'natureza do cargo'],
  descricaoAtividades: [
    'descricao atividades',
    'descricao das atividades',
    'descricao de atividades',
    'atividades',
    'responsabilidades',
    'descricao',
  ],
  competenciasSugeridas: [
    'competencias sugeridas',
    'competencias',
    'competencias desejadas',
    'perfil comportamental',
  ],
  experienciaSugerida: [
    'experiencia sugerida',
    'experiencia',
    'experiencia desejada',
    'experiencia anterior',
  ],
  formacao: ['formacao', 'escolaridade', 'formacao academica', 'nivel de formacao'],
  statusCurso: ['status', 'status curso', 'status do curso', 'situacao do curso'],
  curso: ['curso', 'cursos', 'curso exigido', 'curso desejado'],
  exigencias: ['exigencias', 'exigencia', 'requisitos', 'requisitos obrigatorios', 'pre requisitos'],
  observacoes: ['observacoes', 'observacao', 'obs', 'informacoes adicionais'],
  precisaAderenciaRaio: [
    'precisa ter aderencia ao raio',
    'aderencia ao raio',
    'aderencia raio',
    'raio',
  ],
  etapasProcesso: [
    'etapas do processo',
    'etapas',
    'etapas processo',
    'definicao de etapas',
    'processo seletivo',
  ],
  testes: ['testes', 'teste', 'testes aplicados', 'provas'],
}

function campo(dados: Record<string, unknown>, nome: string): unknown {
  const aceitos = COLUNAS_CARGO[nome] ?? [nome]
  for (const [chave, valor] of Object.entries(dados)) {
    if (aceitos.includes(normalizar(chave))) return valor
  }
  return undefined
}

/**
 * "n/a", "na" e afins são preenchimento, não conteúdo — a planilha os usa para
 * dizer "não se aplica". Guardar a string faria a tela de descritivo exibir
 * "N/A" como se fosse a exigência do cargo.
 */
const VAZIOS = new Set(['', 'n a', 'na', 'nao se aplica', 'nao ha', 'nenhum', 'nenhuma', '-', '--'])

function texto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null

  // As células vêm do Excel com \r\n e o texto é multilinha de propósito
  // (uma competência por linha). Só as pontas são aparadas.
  const s = String(valor).replace(/\r\n/g, '\n').trim()
  if (VAZIOS.has(normalizar(s))) return null
  return s === '' ? null : s
}

export function analisarPlanilhaCargos(linhas: LinhaPlanilha[]): RelatorioCargos {
  const validos: CargoImportado[] = []
  const erros: ProblemaImportacao[] = []
  const avisos: ProblemaImportacao[] = []
  const duplicados: ProblemaImportacao[] = []
  const chavesVistas = new Map<string, number>()

  for (const { linha, dados } of linhas) {
    const errosDaLinha: ProblemaImportacao[] = []

    const cargo = texto(campo(dados, 'cargo'))
    if (!cargo) {
      errosDaLinha.push({ linha, campo: 'cargo', mensagem: 'Cargo é obrigatório' })
    }

    // Área é obrigatória porque entra na identidade do descritivo: dois cargos
    // de mesmo nome em áreas diferentes são dois descritivos, não um.
    const area = texto(campo(dados, 'area'))
    if (!area) {
      errosDaLinha.push({
        linha,
        campo: 'area',
        mensagem: 'Área é obrigatória — ela faz parte da identidade do descritivo',
      })
    }

    if (errosDaLinha.length > 0) {
      erros.push(...errosDaLinha)
      continue
    }

    const chaveDedupe = `${normalizar(cargo)}|${normalizar(area)}`
    const linhaAnterior = chavesVistas.get(chaveDedupe)
    if (linhaAnterior !== undefined) {
      duplicados.push({
        linha,
        mensagem: `Repete a linha ${linhaAnterior} (mesmo cargo na mesma área). Só a primeira será importada.`,
        valor: cargo ?? undefined,
      })
      continue
    }
    chavesVistas.set(chaveDedupe, linha)

    const descricaoAtividades = texto(campo(dados, 'descricaoAtividades'))
    if (!descricaoAtividades) {
      avisos.push({
        linha,
        campo: 'descricaoAtividades',
        mensagem: 'Sem descrição de atividades — é o campo que a comparação de aderência usa',
        valor: cargo ?? undefined,
      })
    }

    const etapasProcesso = texto(campo(dados, 'etapasProcesso'))
    if (!etapasProcesso) {
      avisos.push({
        linha,
        campo: 'etapasProcesso',
        mensagem: 'Sem etapas do processo — o recrutador não saberá o rito deste cargo',
        valor: cargo ?? undefined,
      })
    }

    validos.push({
      linha,
      cargo: cargo!,
      area: area!,
      tipoVaga: texto(campo(dados, 'tipoVaga')),
      descricaoAtividades,
      competenciasSugeridas: texto(campo(dados, 'competenciasSugeridas')),
      experienciaSugerida: texto(campo(dados, 'experienciaSugerida')),
      formacao: texto(campo(dados, 'formacao')),
      statusCurso: texto(campo(dados, 'statusCurso')),
      curso: texto(campo(dados, 'curso')),
      exigencias: texto(campo(dados, 'exigencias')),
      observacoes: texto(campo(dados, 'observacoes')),
      etapasProcesso,
      testes: texto(campo(dados, 'testes')),
      precisaAderenciaRaio: converterSimNao(campo(dados, 'precisaAderenciaRaio')),
      chaveDedupe,
    })
  }

  return { total: linhas.length, validos, erros, avisos, duplicados }
}
