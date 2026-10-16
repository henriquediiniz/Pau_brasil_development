/**
 * Importadores de PCD e de jovens aprendizes.
 *
 * O laudo nunca vem pela planilha: ele é anexado registro a registro, pela
 * rota dedicada. Planilha carrega o cadastro; documento de saúde não trafega
 * junto com dado tabular.
 */

import {
  converterData,
  normalizar,
  resolverOperacao,
  type LinhaPlanilha,
  type OperacaoRef,
  type ProblemaImportacao,
} from './vaga-importador'
import type { RelatorioImportacao } from './quadro-importador'

/**
 * Identidade da pessoa na lista, em PCD e em aprendizes: operação + nome.
 *
 * Usada nos dois lados — para detectar repetição dentro da planilha e para
 * reconhecer no banco a linha que está chegando. Tem que ser a mesma regra:
 * se divergirem, reimportar volta a duplicar.
 *
 * Não há matrícula nessas planilhas; o nome é o que o RH tem.
 */
export function chavePorNome(p: { operacaoId: string | null; nome: string }): string {
  return `${p.operacaoId ?? ''}|${normalizar(p.nome)}`
}

export interface PcdImportado {
  linha: number
  operacaoId: string
  nome: string
  admissao: Date | null
  funcao: string | null
  tipo: string | null
  deficiencia: string | null
  sexo: string | null
  cor: string | null
  ativo: boolean
  chaveDedupe: string
}

export interface AprendizImportado {
  linha: number
  operacaoId: string
  nome: string
  admissao: Date | null
  funcao: string | null
  centroCusto: string | null
  departamento: string | null
  setor: 'DPO' | 'SPO' | null
  sexo: string | null
  dataNascimento: Date | null
  gestorNome: string | null
  fundacao: string | null
  horario: string | null
  inicioContrato: Date | null
  terminoContrato: Date | null
  situacao: 'VIGENTE' | 'ENCERRADO' | 'DESLIGADO'
  chaveDedupe: string
}

export const COLUNAS_PCD: Record<string, string[]> = {
  unidade: ['unidade', 'operacao', 'filial'],
  nome: ['nome', 'colaborador', 'funcionario'],
  admissao: ['admissao', 'data admissao', 'data de admissao'],
  funcao: ['funcao', 'cargo'],
  tipo: ['tipo'],
  deficiencia: ['deficiencia', 'tipo de deficiencia'],
  sexo: ['sexo', 'genero'],
  cor: ['cor', 'raca', 'cor raca'],
  centroCusto: ['centro custo', 'centro de custo', 'cc'],
  departamento: ['departamento', 'area'],
  setor: ['dpo ou spo', 'dpo spo', 'setor'],
  dataNascimento: ['data nascimento', 'data de nascimento', 'nascimento'],
  gestorNome: ['gestor', 'nome do gestor'],
  fundacao: ['fundacao', 'instituicao', 'entidade'],
  horario: ['horario', 'jornada'],
  inicioContrato: ['inicio contrato', 'inicio do contrato', 'data inicio contrato'],
  terminoContrato: ['termino contrato', 'termino do contrato', 'fim contrato', 'data termino contrato'],
  situacao: ['situacao', 'status'],
}

function campo(dados: Record<string, unknown>, nome: string): unknown {
  const aceitos = COLUNAS_PCD[nome] ?? [nome]
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

const SITUACOES_APRENDIZ: Record<string, 'VIGENTE' | 'ENCERRADO' | 'DESLIGADO'> = {
  vigente: 'VIGENTE',
  ativo: 'VIGENTE',
  encerrado: 'ENCERRADO',
  finalizado: 'ENCERRADO',
  concluido: 'ENCERRADO',
  desligado: 'DESLIGADO',
  demitido: 'DESLIGADO',
}

export function converterSituacaoAprendiz(
  valor: unknown
): 'VIGENTE' | 'ENCERRADO' | 'DESLIGADO' | null | 'invalida' {
  const s = normalizar(valor)
  if (s === '') return null
  return SITUACOES_APRENDIZ[s] ?? 'invalida'
}

/** Fecha a validação comum: nome obrigatório e operação reconhecida. */
function validarBase(
  linha: number,
  dados: Record<string, unknown>,
  operacoes: OperacaoRef[]
): { nome: string; operacao: OperacaoRef } | ProblemaImportacao[] {
  const erros: ProblemaImportacao[] = []

  const nome = texto(campo(dados, 'nome'))
  if (!nome) erros.push({ linha, campo: 'nome', mensagem: 'Nome é obrigatório' })

  const unidadeBruta = texto(campo(dados, 'unidade'))
  const operacao = resolverOperacao(unidadeBruta, operacoes)
  if (!unidadeBruta) {
    erros.push({ linha, campo: 'unidade', mensagem: 'Unidade é obrigatória' })
  } else if (!operacao) {
    erros.push({
      linha,
      campo: 'unidade',
      mensagem:
        'Unidade não corresponde a nenhuma operação cadastrada. Corrija na planilha ou cadastre a operação.',
      valor: unidadeBruta,
    })
  }

  if (erros.length > 0) return erros
  return { nome: nome!, operacao: operacao! }
}

// ─── PCD ──────────────────────────────────────────────────────────────────────

export function analisarPlanilhaPcd(
  linhas: LinhaPlanilha[],
  operacoes: OperacaoRef[]
): RelatorioImportacao<PcdImportado> {
  const validos: PcdImportado[] = []
  const erros: ProblemaImportacao[] = []
  const avisos: ProblemaImportacao[] = []
  const duplicados: ProblemaImportacao[] = []
  const chavesVistas = new Map<string, number>()

  for (const { linha, dados } of linhas) {
    const base = validarBase(linha, dados, operacoes)
    if (Array.isArray(base)) {
      erros.push(...base)
      continue
    }

    const admissao = converterData(campo(dados, 'admissao'))
    if (admissao === 'invalida') {
      erros.push({
        linha,
        campo: 'admissao',
        mensagem: 'Data de admissão inválida',
        valor: String(campo(dados, 'admissao')),
      })
      continue
    }

    const deficiencia = texto(campo(dados, 'deficiencia'))
    if (!deficiencia) {
      avisos.push({
        linha,
        campo: 'deficiencia',
        mensagem: 'Sem o tipo de deficiência — o relatório de cota fica incompleto',
      })
    }

    avisos.push({
      linha,
      mensagem: 'O laudo não vem pela planilha: anexe depois, pelo cadastro da pessoa',
    })

    const chaveDedupe = chavePorNome({ operacaoId: base.operacao.id, nome: base.nome })
    const anterior = chavesVistas.get(chaveDedupe)
    if (anterior !== undefined) {
      duplicados.push({
        linha,
        mensagem: `Repete a linha ${anterior} (mesma pessoa na mesma operação). Só a primeira será importada.`,
        valor: base.nome,
      })
      continue
    }
    chavesVistas.set(chaveDedupe, linha)

    validos.push({
      linha,
      operacaoId: base.operacao.id,
      nome: base.nome,
      admissao,
      funcao: texto(campo(dados, 'funcao')),
      tipo: texto(campo(dados, 'tipo')),
      deficiencia,
      sexo: texto(campo(dados, 'sexo')),
      cor: texto(campo(dados, 'cor')),
      ativo: true,
      chaveDedupe,
    })
  }

  return { total: linhas.length, validos, erros, avisos, duplicados }
}

// ─── Aprendizes ───────────────────────────────────────────────────────────────

export function analisarPlanilhaAprendizes(
  linhas: LinhaPlanilha[],
  operacoes: OperacaoRef[]
): RelatorioImportacao<AprendizImportado> {
  const validos: AprendizImportado[] = []
  const erros: ProblemaImportacao[] = []
  const avisos: ProblemaImportacao[] = []
  const duplicados: ProblemaImportacao[] = []
  const chavesVistas = new Map<string, number>()

  for (const { linha, dados } of linhas) {
    const base = validarBase(linha, dados, operacoes)
    if (Array.isArray(base)) {
      erros.push(...base)
      continue
    }

    const errosDaLinha: ProblemaImportacao[] = []
    const datas: Record<string, Date | null> = {}

    for (const nome of ['admissao', 'dataNascimento', 'inicioContrato', 'terminoContrato']) {
      const valor = converterData(campo(dados, nome))
      if (valor === 'invalida') {
        errosDaLinha.push({
          linha,
          campo: nome,
          mensagem: 'Data inválida',
          valor: String(campo(dados, nome)),
        })
        datas[nome] = null
      } else {
        datas[nome] = valor
      }
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

    let situacao = converterSituacaoAprendiz(campo(dados, 'situacao'))
    if (situacao === 'invalida') {
      errosDaLinha.push({
        linha,
        campo: 'situacao',
        mensagem: 'Situação deve ser Vigente, Encerrado ou Desligado',
        valor: String(campo(dados, 'situacao')),
      })
      situacao = null
    }

    if (errosDaLinha.length > 0) {
      erros.push(...errosDaLinha)
      continue
    }

    // O término é o que o RH precisa ver chegando: contrato de aprendizagem
    // tem prazo determinado e não se renova indefinidamente.
    if (!datas.terminoContrato) {
      avisos.push({
        linha,
        campo: 'terminoContrato',
        mensagem: 'Sem data de término — o alerta de vencimento não vai funcionar para esta pessoa',
      })
    } else if (datas.inicioContrato && datas.terminoContrato < datas.inicioContrato) {
      avisos.push({
        linha,
        campo: 'terminoContrato',
        mensagem: 'Término do contrato anterior ao início',
      })
    }

    const chaveDedupe = chavePorNome({ operacaoId: base.operacao.id, nome: base.nome })
    const anterior = chavesVistas.get(chaveDedupe)
    if (anterior !== undefined) {
      duplicados.push({
        linha,
        mensagem: `Repete a linha ${anterior} (mesma pessoa na mesma operação). Só a primeira será importada.`,
        valor: base.nome,
      })
      continue
    }
    chavesVistas.set(chaveDedupe, linha)

    validos.push({
      linha,
      operacaoId: base.operacao.id,
      nome: base.nome,
      admissao: datas.admissao,
      funcao: texto(campo(dados, 'funcao')),
      centroCusto: texto(campo(dados, 'centroCusto')),
      departamento: texto(campo(dados, 'departamento')),
      setor: setor === 'invalida' ? null : setor,
      sexo: texto(campo(dados, 'sexo')),
      dataNascimento: datas.dataNascimento,
      gestorNome: texto(campo(dados, 'gestorNome')),
      fundacao: texto(campo(dados, 'fundacao')),
      horario: texto(campo(dados, 'horario')),
      inicioContrato: datas.inicioContrato,
      terminoContrato: datas.terminoContrato,
      situacao: (situacao as 'VIGENTE' | 'ENCERRADO' | 'DESLIGADO' | null) ?? 'VIGENTE',
      chaveDedupe,
    })
  }

  return { total: linhas.length, validos, erros, avisos, duplicados }
}
