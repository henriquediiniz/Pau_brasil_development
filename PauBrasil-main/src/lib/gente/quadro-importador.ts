/**
 * Importadores do quadro de pessoal: QLP e desligamentos.
 *
 * Mesma filosofia dos outros: função pura, operação não reconhecida é erro
 * bloqueante, e o relatório aponta a linha da planilha para o RH corrigir na
 * origem.
 */

import {
  converterData,
  normalizar,
  resolverOperacao,
  type LinhaPlanilha,
  type OperacaoRef,
  type ProblemaImportacao,
} from './vaga-importador'
import { cpfValido, normalizarCpf } from './cpf'

export interface ColaboradorImportado {
  linha: number
  operacaoId: string
  nome: string
  cargo: string | null
  area: string | null
  matricula: string | null
  /** Só dígitos. A formatação da planilha não sobrevive à importação. */
  cpf: string | null
  dataAdmissao: Date | null
  ativo: boolean
  chaveDedupe: string
}

export interface DesligamentoImportado {
  linha: number
  operacaoId: string
  nome: string
  cargo: string | null
  area: string | null
  setor: 'DPO' | 'SPO' | null
  dataDesligamento: Date
  motivo: string | null
  chaveDedupe: string
}

export interface RelatorioImportacao<T> {
  total: number
  validos: T[]
  erros: ProblemaImportacao[]
  avisos: ProblemaImportacao[]
  duplicados: ProblemaImportacao[]
}

export const COLUNAS_QUADRO: Record<string, string[]> = {
  unidade: ['unidade', 'operacao', 'filial'],
  nome: ['nome', 'colaborador', 'funcionario', 'nome do colaborador'],
  cargo: ['cargo', 'funcao'],
  area: ['area', 'setor de atuacao'],
  matricula: ['matricula', 'matricula do colaborador', 'chapa', 'registro'],
  cpf: ['cpf', 'c p f', 'documento'],
  dataAdmissao: ['data admissao', 'data de admissao', 'admissao', 'data entrada'],
  setor: ['dpo ou spo', 'dpo spo', 'setor', 'departamento'],
  dataDesligamento: ['data desligamento', 'data de desligamento', 'desligamento', 'data saida'],
  motivo: ['motivo', 'motivo desligamento', 'motivo do desligamento'],
}

function campo(dados: Record<string, unknown>, nome: string): unknown {
  const aceitos = COLUNAS_QUADRO[nome] ?? [nome]
  for (const [chave, valor] of Object.entries(dados)) {
    if (aceitos.includes(normalizar(chave))) return valor
  }
  return undefined
}

function texto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null
  const s = String(valor).trim()
  return s === '' ? null : s
}

function converterSetor(valor: unknown): 'DPO' | 'SPO' | null | 'invalida' {
  const s = normalizar(valor)
  if (s === '') return null
  if (s === 'dpo') return 'DPO'
  if (s === 'spo') return 'SPO'
  return 'invalida'
}

/**
 * Identidade do colaborador no quadro.
 *
 * Usada nos dois lados: para detectar repetição dentro da planilha e para
 * reconhecer, no banco, a linha que está chegando. Tem que ser a mesma regra —
 * se divergirem, reimportar volta a duplicar.
 *
 * A matrícula manda quando existe: nome muda (casamento, grafia) e homônimo
 * existe. Sem matrícula, a identidade prática é nome + operação.
 */
export function chaveColaborador(c: {
  operacaoId: string | null
  nome: string
  matricula?: string | null
}): string {
  return c.matricula
    ? `${c.operacaoId ?? ''}|mat:${normalizar(c.matricula)}`
    : `${c.operacaoId ?? ''}|${normalizar(c.nome)}`
}

/**
 * Identidade do desligamento.
 *
 * A data entra na chave porque a mesma pessoa pode ser desligada mais de uma
 * vez ao longo do tempo (recontratação) — são dois registros, não um
 * corrigido.
 */
export function chaveDesligamento(d: {
  operacaoId: string | null
  nome: string
  dataDesligamento: Date
}): string {
  return `${d.operacaoId ?? ''}|${normalizar(d.nome)}|${d.dataDesligamento
    .toISOString()
    .slice(0, 10)}`
}

// ─── QLP ──────────────────────────────────────────────────────────────────────

export function analisarPlanilhaQuadro(
  linhas: LinhaPlanilha[],
  operacoes: OperacaoRef[],
  hoje: Date = new Date()
): RelatorioImportacao<ColaboradorImportado> {
  const validos: ColaboradorImportado[] = []
  const erros: ProblemaImportacao[] = []
  const avisos: ProblemaImportacao[] = []
  const duplicados: ProblemaImportacao[] = []
  const chavesVistas = new Map<string, number>()

  for (const { linha, dados } of linhas) {
    const errosDaLinha: ProblemaImportacao[] = []

    const nome = texto(campo(dados, 'nome'))
    if (!nome) {
      errosDaLinha.push({ linha, campo: 'nome', mensagem: 'Nome é obrigatório' })
    }

    const unidadeBruta = texto(campo(dados, 'unidade'))
    const operacao = resolverOperacao(unidadeBruta, operacoes)
    if (!unidadeBruta) {
      errosDaLinha.push({ linha, campo: 'unidade', mensagem: 'Unidade é obrigatória' })
    } else if (!operacao) {
      errosDaLinha.push({
        linha,
        campo: 'unidade',
        mensagem:
          'Unidade não corresponde a nenhuma operação cadastrada. Corrija na planilha ou cadastre a operação.',
        valor: unidadeBruta,
      })
    }

    if (errosDaLinha.length > 0) {
      erros.push(...errosDaLinha)
      continue
    }

    const cargo = texto(campo(dados, 'cargo'))
    if (!cargo) {
      avisos.push({
        linha,
        campo: 'cargo',
        mensagem: 'Colaborador sem cargo — o quadro fica incompleto para relatório',
      })
    }

    const matricula = texto(campo(dados, 'matricula'))

    /*
      CPF inválido é erro de linha, não aviso: o RH pede o CPF justamente para
      conferir a folha, e um número errado ali só é descoberto meses depois,
      quando ninguém lembra de qual linha veio.
    */
    const cpf = normalizarCpf(texto(campo(dados, 'cpf')))
    if (cpf && !cpfValido(cpf)) {
      erros.push({
        linha,
        campo: 'cpf',
        mensagem: 'CPF inválido — confira os dígitos na planilha',
        valor: String(campo(dados, 'cpf')),
      })
      continue
    }

    const admissao = converterData(campo(dados, 'dataAdmissao'))
    if (admissao === 'invalida') {
      erros.push({
        linha,
        campo: 'dataAdmissao',
        mensagem: 'Data de admissão inválida',
        valor: String(campo(dados, 'dataAdmissao')),
      })
      continue
    }
    if (admissao && admissao > hoje) {
      avisos.push({
        linha,
        campo: 'dataAdmissao',
        mensagem: 'Data de admissão no futuro — confira se não houve erro de digitação',
      })
    }

    /*
      A matrícula manda quando existe: nome muda (casamento, grafia) e homônimo
      existe, então duas linhas com a mesma matrícula são a mesma pessoa mesmo
      que o nome esteja escrito diferente.

      Sem matrícula, a identidade prática continua sendo nome + operação.
    */
    const chaveDedupe = chaveColaborador({ operacaoId: operacao!.id, nome: nome!, matricula })
    const linhaAnterior = chavesVistas.get(chaveDedupe)
    if (linhaAnterior !== undefined) {
      duplicados.push({
        linha,
        mensagem: matricula
          ? `Repete a linha ${linhaAnterior} (mesma matrícula ${matricula}). Só a primeira será importada.`
          : `Repete a linha ${linhaAnterior} (mesma pessoa na mesma operação). Só a primeira será importada.`,
        valor: nome ?? undefined,
      })
      continue
    }
    chavesVistas.set(chaveDedupe, linha)

    validos.push({
      linha,
      operacaoId: operacao!.id,
      nome: nome!,
      cargo,
      area: texto(campo(dados, 'area')),
      matricula,
      cpf,
      dataAdmissao: admissao,
      ativo: true,
      chaveDedupe,
    })
  }

  return { total: linhas.length, validos, erros, avisos, duplicados }
}

// ─── Desligamentos ────────────────────────────────────────────────────────────

export function analisarPlanilhaDesligamentos(
  linhas: LinhaPlanilha[],
  operacoes: OperacaoRef[],
  hoje: Date = new Date()
): RelatorioImportacao<DesligamentoImportado> {
  const validos: DesligamentoImportado[] = []
  const erros: ProblemaImportacao[] = []
  const avisos: ProblemaImportacao[] = []
  const duplicados: ProblemaImportacao[] = []
  const chavesVistas = new Map<string, number>()

  for (const { linha, dados } of linhas) {
    const errosDaLinha: ProblemaImportacao[] = []

    const nome = texto(campo(dados, 'nome'))
    if (!nome) {
      errosDaLinha.push({ linha, campo: 'nome', mensagem: 'Nome é obrigatório' })
    }

    const unidadeBruta = texto(campo(dados, 'unidade'))
    const operacao = resolverOperacao(unidadeBruta, operacoes)
    if (!unidadeBruta) {
      errosDaLinha.push({ linha, campo: 'unidade', mensagem: 'Unidade é obrigatória' })
    } else if (!operacao) {
      errosDaLinha.push({
        linha,
        campo: 'unidade',
        mensagem:
          'Unidade não corresponde a nenhuma operação cadastrada. Corrija na planilha ou cadastre a operação.',
        valor: unidadeBruta,
      })
    }

    // A data é o que faz o registro existir: sem ela não há desligamento.
    const data = converterData(campo(dados, 'dataDesligamento'))
    if (data === 'invalida') {
      errosDaLinha.push({
        linha,
        campo: 'dataDesligamento',
        mensagem: 'Data de desligamento inválida',
        valor: String(campo(dados, 'dataDesligamento')),
      })
    } else if (data === null) {
      errosDaLinha.push({
        linha,
        campo: 'dataDesligamento',
        mensagem: 'Data de desligamento é obrigatória',
      })
    }

    const setor = converterSetor(campo(dados, 'setor'))
    if (setor === 'invalida') {
      errosDaLinha.push({
        linha,
        campo: 'setor',
        mensagem: 'Setor deve ser DPO ou SPO',
        valor: String(campo(dados, 'setor')),
      })
    }

    if (errosDaLinha.length > 0) {
      erros.push(...errosDaLinha)
      continue
    }

    const dataOk = data as Date

    if (dataOk > hoje) {
      avisos.push({
        linha,
        campo: 'dataDesligamento',
        mensagem: 'Data de desligamento no futuro — confira se não houve erro de digitação',
      })
    }
    if (!texto(campo(dados, 'motivo'))) {
      avisos.push({
        linha,
        campo: 'motivo',
        mensagem: 'Sem motivo informado — dificulta a análise de turnover',
      })
    }

    // A mesma pessoa pode ser desligada mais de uma vez ao longo do tempo
    // (recontratação), então a data entra na chave.
    const chaveDedupe = chaveDesligamento({
      operacaoId: operacao!.id,
      nome: nome!,
      dataDesligamento: dataOk,
    })
    const linhaAnterior = chavesVistas.get(chaveDedupe)
    if (linhaAnterior !== undefined) {
      duplicados.push({
        linha,
        mensagem: `Repete a linha ${linhaAnterior} (mesma pessoa, mesma data). Só a primeira será importada.`,
        valor: nome ?? undefined,
      })
      continue
    }
    chavesVistas.set(chaveDedupe, linha)

    validos.push({
      linha,
      operacaoId: operacao!.id,
      nome: nome!,
      cargo: texto(campo(dados, 'cargo')),
      area: texto(campo(dados, 'area')),
      setor: setor === 'invalida' ? null : setor,
      dataDesligamento: dataOk,
      motivo: texto(campo(dados, 'motivo')),
      chaveDedupe,
    })
  }

  return { total: linhas.length, validos, erros, avisos, duplicados }
}
