/**
 * Importador de planilha de vagas.
 *
 * Função pura: recebe linhas já lidas da planilha e devolve o que entraria no
 * banco, o que está errado e o que merece atenção. Não toca em Prisma nem em
 * XLSX — é aqui que mora a regra, e é por isso que dá para testar sem banco.
 *
 * A planilha do RH tem data em três formatos, cabeçalho com acento variável e
 * nenhum identificador estável. Todo o trabalho sujo é tratado aqui, e nada
 * entra sem operação reconhecida.
 */

import type { RecVagaStatusValue } from './vaga-sla'

export interface OperacaoRef {
  id: string
  nome: string
  nomeAbrev?: string | null
}

export interface LinhaPlanilha {
  /** Número da linha na planilha, como o usuário vê (cabeçalho = 1). */
  linha: number
  dados: Record<string, unknown>
}

export interface ProblemaImportacao {
  linha: number
  campo?: string
  mensagem: string
  valor?: string
}

export interface VagaImportada {
  linha: number
  operacaoId: string
  unidadeTexto: string
  departamento: 'DPO' | 'SPO' | null
  cargo: string
  /**
   * Descritivo vinculado, quando o nome da planilha bate com um cadastrado.
   * Sem isso a vaga importada nasceria solta e o vínculo com o descritivo
   * voltaria a depender do nome digitado, que é o que estamos deixando de
   * lado.
   */
  cargoId: string | null
  area: string | null
  salario: number | null
  localTrabalho: string | null
  horario: string | null
  quantidadeVagas: number
  informacoesComplementares: string | null
  requisitosMinimos: string | null
  formacao: string | null
  motivoSolicitacao: string | null
  codigo: string | null
  frontline: string | null
  colaboradorAnterior: string | null
  dataDesligamento: Date | null
  dataAbertura: Date
  dataPrevistaFechamento: Date | null
  dataContratacao: Date | null
  responsavelVaga: string | null
  solicitanteVaga: string | null
  nomeContratado: string | null
  status: RecVagaStatusValue
  andamentoProcesso: string | null
  /** Chave usada para detectar repetição dentro do próprio arquivo. */
  chaveDedupe: string
}

export interface RelatorioImportacaoVagas {
  total: number
  validas: VagaImportada[]
  erros: ProblemaImportacao[]
  avisos: ProblemaImportacao[]
  /** Linhas descartadas por repetirem outra linha do mesmo arquivo. */
  duplicadas: ProblemaImportacao[]
}

// ─── Normalização de texto ────────────────────────────────────────────────────

/** Minúsculas, sem acento, sem pontuação, espaços colapsados. */
export function normalizar(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  return String(valor)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function texto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null
  const s = String(valor).trim()
  return s === '' ? null : s
}

// ─── Cabeçalhos aceitos ───────────────────────────────────────────────────────
// A planilha do RH varia entre versões, então cada campo aceita vários rótulos.

export const COLUNAS_VAGA: Record<string, string[]> = {
  unidade: ['unidade', 'operacao', 'filial'],
  departamento: ['departamento', 'dpo ou spo', 'dpo spo', 'setor'],
  cargo: ['cargo', 'funcao', 'vaga'],
  area: ['area'],
  salario: ['salario', 'salario r', 'remuneracao'],
  localTrabalho: ['local trabalho', 'local de trabalho', 'local'],
  horario: ['horario', 'jornada'],
  quantidadeVagas: ['quantidade vagas', 'quantidade de vagas', 'qtd vagas', 'quantidade'],
  informacoesComplementares: ['informacoes complementares', 'informacoes', 'complemento'],
  requisitosMinimos: ['requisitos minimos', 'requisitos'],
  formacao: ['formacao', 'escolaridade'],
  motivoSolicitacao: ['motivo solicitacao', 'motivo da solicitacao', 'motivo'],
  codigo: ['cod', 'codigo'],
  frontline: ['frontline', 'front line'],
  colaboradorAnterior: ['colaborador anterior', 'substituido', 'colaborador substituido'],
  dataDesligamento: ['data desligamento', 'data de desligamento'],
  dataAbertura: ['data abertura', 'data de abertura', 'abertura'],
  dataPrevistaFechamento: [
    'data prevista fechamento',
    'data prevista de fechamento',
    'previsao fechamento',
    'prazo',
  ],
  dataContratacao: ['data contratacao', 'data de contratacao', 'contratacao'],
  responsavelVaga: ['responsavel vaga', 'responsavel pela vaga', 'responsavel'],
  solicitanteVaga: ['solicitante vaga', 'solicitante da vaga', 'solicitante'],
  nomeContratado: ['nome contratado', 'contratado'],
  status: ['status', 'situacao'],
  andamentoProcesso: ['andamento processo', 'andamento do processo', 'andamento'],
}

/** Localiza o valor de um campo aceitando qualquer um dos rótulos conhecidos. */
function campo(dados: Record<string, unknown>, nome: string): unknown {
  const aceitos = COLUNAS_VAGA[nome] ?? [nome]
  for (const [chave, valor] of Object.entries(dados)) {
    if (aceitos.includes(normalizar(chave))) return valor
  }
  return undefined
}

// ─── Conversores ──────────────────────────────────────────────────────────────

/** Data-base do serial numérico do Excel (1899-12-30, por causa do bug de 1900). */
const EXCEL_EPOCH = Date.UTC(1899, 11, 30)
const MS_POR_DIA = 24 * 60 * 60 * 1000

/**
 * Aceita `Date`, serial do Excel, `DD/MM/AAAA`, `DD-MM-AAAA` e `AAAA-MM-DD`.
 * Devolve sempre meia-noite UTC, para casar com a comparação por dia de
 * calendário que `vaga-sla.ts` faz.
 */
export function converterData(valor: unknown): Date | null | 'invalida' {
  if (valor === null || valor === undefined || valor === '') return null

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return 'invalida'
    return new Date(Date.UTC(valor.getFullYear(), valor.getMonth(), valor.getDate()))
  }

  if (typeof valor === 'number' && Number.isFinite(valor)) {
    // Serial do Excel. Abaixo de 1 não é data plausível.
    if (valor < 1) return 'invalida'
    return new Date(EXCEL_EPOCH + Math.floor(valor) * MS_POR_DIA)
  }

  const s = String(valor).trim()
  if (s === '') return null

  const brasileiro = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/)
  if (brasileiro) {
    const dia = Number(brasileiro[1])
    const mes = Number(brasileiro[2])
    let ano = Number(brasileiro[3])
    if (ano < 100) ano += ano < 50 ? 2000 : 1900
    return montarData(ano, mes, dia)
  }

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return montarData(Number(iso[1]), Number(iso[2]), Number(iso[3]))

  return 'invalida'
}

function montarData(ano: number, mes: number, dia: number): Date | 'invalida' {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return 'invalida'
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  // Rejeita overflow silencioso do Date (ex.: 31/02 virar 03/03).
  if (data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return 'invalida'
  return data
}

/** Aceita `1.500,00`, `1500.00`, `R$ 1.500,00` e número puro. */
export function converterDecimal(valor: unknown): number | null | 'invalida' {
  if (valor === null || valor === undefined || valor === '') return null
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 'invalida'

  let s = String(valor).trim().replace(/r\$/i, '').replace(/\s/g, '')
  if (s === '') return null

  // Formato brasileiro: ponto é milhar, vírgula é decimal.
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')

  const n = Number(s)
  return Number.isFinite(n) ? n : 'invalida'
}

export function converterInteiro(valor: unknown): number | null | 'invalida' {
  const n = converterDecimal(valor)
  if (n === null || n === 'invalida') return n
  if (!Number.isInteger(n)) return Math.round(n)
  return n
}

const STATUS_ACEITOS: Record<string, RecVagaStatusValue> = {
  aberta: 'ABERTA',
  aberto: 'ABERTA',
  'em aberto': 'ABERTA',
  'vaga aberta': 'ABERTA',
  fechada: 'FECHADA',
  fechado: 'FECHADA',
  concluida: 'FECHADA',
  encerrada: 'FECHADA',
  cancelada: 'CANCELADA',
  cancelado: 'CANCELADA',
}

export function converterStatus(valor: unknown): RecVagaStatusValue | null | 'invalida' {
  const s = normalizar(valor)
  if (s === '') return null
  return STATUS_ACEITOS[s] ?? 'invalida'
}

function converterDepartamento(valor: unknown): 'DPO' | 'SPO' | null | 'invalida' {
  const s = normalizar(valor)
  if (s === '') return null
  if (s === 'dpo') return 'DPO'
  if (s === 'spo') return 'SPO'
  return 'invalida'
}

/** Casa o nome da unidade da planilha com uma operação cadastrada. */
export function resolverOperacao(valor: unknown, operacoes: OperacaoRef[]): OperacaoRef | null {
  const alvo = normalizar(valor)
  if (alvo === '') return null

  const exata = operacoes.find(
    (o) => normalizar(o.nome) === alvo || (o.nomeAbrev && normalizar(o.nomeAbrev) === alvo)
  )
  if (exata) return exata

  // "PAU BRASIL PATOS" x operação "Pau Brasil Patos" já casa acima.
  // Aqui tratamos o caso de a planilha trazer só a cidade ("PATOS", "SUMÉ").
  const porSufixo = operacoes.filter((o) => {
    const nome = normalizar(o.nome)
    return nome === alvo || nome.endsWith(` ${alvo}`) || alvo.endsWith(` ${nome}`)
  })

  return porSufixo.length === 1 ? porSufixo[0] : null
}

// ─── Análise ──────────────────────────────────────────────────────────────────

/** Descritivo cadastrado, para o importador vincular pelo nome. */
export interface DescritivoRef {
  id: string
  cargo: string
}

export function analisarPlanilhaVagas(
  linhas: LinhaPlanilha[],
  operacoes: OperacaoRef[],
  descritivos: DescritivoRef[] = []
): RelatorioImportacaoVagas {
  /*
    Índice pelo nome normalizado. A planilha do RH escreve "MOTORISTA CAMINHAO
    DISTRIBUIÇÃO" e o descritivo, "Motorista Caminhão Distribuição" — casar sem
    normalizar não pegaria nenhum.

    Não casar não é erro: a vaga entra sem vínculo, como entrava antes.
  */
  const descritivoPorNome = new Map(descritivos.map((d) => [normalizar(d.cargo), d.id]))
  const validas: VagaImportada[] = []
  const erros: ProblemaImportacao[] = []
  const avisos: ProblemaImportacao[] = []
  const duplicadas: ProblemaImportacao[] = []
  const chavesVistas = new Map<string, number>()

  for (const { linha, dados } of linhas) {
    const errosDaLinha: ProblemaImportacao[] = []
    const avisosDaLinha: ProblemaImportacao[] = []

    const erro = (campoNome: string, mensagem: string, valor?: unknown) =>
      errosDaLinha.push({
        linha,
        campo: campoNome,
        mensagem,
        ...(valor === undefined || valor === null ? {} : { valor: String(valor) }),
      })

    // ── Cargo (obrigatório) ──
    const cargo = texto(campo(dados, 'cargo'))
    if (!cargo) erro('cargo', 'Cargo é obrigatório')

    // ── Operação (obrigatória: nada entra sem dono) ──
    const unidadeBruta = texto(campo(dados, 'unidade'))
    const operacao = resolverOperacao(unidadeBruta, operacoes)
    if (!unidadeBruta) {
      erro('unidade', 'Unidade é obrigatória')
    } else if (!operacao) {
      erro(
        'unidade',
        'Unidade não corresponde a nenhuma operação cadastrada. Corrija na planilha ou cadastre a operação.',
        unidadeBruta
      )
    }

    // ── Data de abertura (obrigatória: é a base do SLA) ──
    const dataAbertura = converterData(campo(dados, 'dataAbertura'))
    if (dataAbertura === 'invalida') {
      erro('dataAbertura', 'Data de abertura inválida', campo(dados, 'dataAbertura'))
    } else if (dataAbertura === null) {
      erro('dataAbertura', 'Data de abertura é obrigatória')
    }

    // ── Demais datas ──
    const datas: Record<string, Date | null> = {}
    for (const nome of ['dataDesligamento', 'dataPrevistaFechamento', 'dataContratacao']) {
      const valor = converterData(campo(dados, nome))
      if (valor === 'invalida') {
        erro(nome, 'Data inválida', campo(dados, nome))
        datas[nome] = null
      } else {
        datas[nome] = valor
      }
    }

    // ── Status ──
    let status = converterStatus(campo(dados, 'status'))
    if (status === 'invalida') {
      erro('status', 'Status deve ser ABERTA, FECHADA ou CANCELADA', campo(dados, 'status'))
      status = null
    }

    // ── Números ──
    const salario = converterDecimal(campo(dados, 'salario'))
    if (salario === 'invalida') erro('salario', 'Salário inválido', campo(dados, 'salario'))

    const qtdBruta = converterInteiro(campo(dados, 'quantidadeVagas'))
    if (qtdBruta === 'invalida') {
      erro('quantidadeVagas', 'Quantidade de vagas inválida', campo(dados, 'quantidadeVagas'))
    } else if (typeof qtdBruta === 'number' && qtdBruta < 1) {
      erro('quantidadeVagas', 'Quantidade de vagas deve ser pelo menos 1', qtdBruta)
    }

    const departamento = converterDepartamento(campo(dados, 'departamento'))
    if (departamento === 'invalida') {
      erro('departamento', 'Departamento deve ser DPO ou SPO', campo(dados, 'departamento'))
    }

    if (errosDaLinha.length > 0) {
      erros.push(...errosDaLinha)
      continue
    }

    // A partir daqui nenhum conversor devolveu 'invalida' — quem devolvesse já
    // teria empurrado a linha para `erros` acima. Estreitamos os tipos aqui
    // numa vez só, em vez de espalhar casts pelo objeto final.
    const abertura = dataAbertura as Date
    const salarioOk = salario === 'invalida' ? null : salario
    const departamentoOk = departamento === 'invalida' ? null : departamento
    const quantidade = typeof qtdBruta === 'number' ? qtdBruta : 1
    const contratacao = datas.dataContratacao
    const prevista = datas.dataPrevistaFechamento

    // ── Avisos: não bloqueiam, mas o RH precisa ver antes de confirmar ──
    const statusFinal: RecVagaStatusValue = status ?? (contratacao ? 'FECHADA' : 'ABERTA')

    if (!status) {
      avisosDaLinha.push({
        linha,
        campo: 'status',
        mensagem: `Status vazio — assumido ${statusFinal} a partir da data de contratação`,
      })
    }
    if (statusFinal === 'FECHADA' && !contratacao) {
      avisosDaLinha.push({
        linha,
        campo: 'dataContratacao',
        mensagem: 'Vaga fechada sem data de contratação — o SLA será contado como 0 dia',
      })
    }
    if (statusFinal === 'ABERTA' && contratacao) {
      avisosDaLinha.push({
        linha,
        campo: 'status',
        mensagem: 'Vaga aberta com data de contratação preenchida — confira se não deveria estar fechada',
      })
    }
    if (contratacao && contratacao < abertura) {
      avisosDaLinha.push({
        linha,
        campo: 'dataContratacao',
        mensagem: 'Data de contratação anterior à abertura',
      })
    }
    if (prevista && prevista < abertura) {
      avisosDaLinha.push({
        linha,
        campo: 'dataPrevistaFechamento',
        mensagem: 'Previsão de fechamento anterior à abertura',
      })
    }
    if (!prevista) {
      avisosDaLinha.push({
        linha,
        campo: 'dataPrevistaFechamento',
        mensagem: 'Sem previsão de fechamento — o SLA usará o prazo padrão de 30 dias',
      })
    }

    const codigo = texto(campo(dados, 'codigo'))
    const colaboradorAnterior = texto(campo(dados, 'colaboradorAnterior'))
    const nomeContratado = texto(campo(dados, 'nomeContratado'))

    /*
      Duas vagas só são a mesma quando **tudo** que as identifica bate.

      Até 2026-09-24 o código mandava sozinho: `codigo ? cod:X : resto`. O RH
      importou uma planilha com o mesmo código em vagas de cargos diferentes e
      27 linhas foram descartadas como repetidas — inclusive "MOTORISTA DE
      CARRETA" acusada de repetir "AJUDANTE DISTRIBUIÇÃO". O código na planilha
      deles não é o identificador da requisição.

      A regra virou conservadora de propósito: **na dúvida, importa**. Uma vaga
      duplicada o RH vê na lista e apaga; uma vaga descartada em silêncio ele
      não tem como perceber que faltou.
    */
    const chaveDedupe = [
      operacao!.id,
      normalizar(cargo),
      abertura.toISOString().slice(0, 10),
      normalizar(colaboradorAnterior),
      normalizar(codigo),
      // Quem foi contratado separa duas requisições do mesmo cargo abertas no
      // mesmo dia. Sem isto, três vagas de "Ajudante Distribuição" de 03/08
      // — uma para cada pessoa — viravam uma só.
      normalizar(nomeContratado),
    ].join('|')

    const linhaAnterior = chavesVistas.get(chaveDedupe)
    if (linhaAnterior !== undefined) {
      /*
        Linha idêntica **não é descartada**.

        A planilha do RH não tem identificador de requisição, e abrir várias
        posições do mesmo cargo no mesmo dia é rotina (aumento de QLP). Não há
        como o sistema distinguir "digitou duas vezes" de "são duas vagas
        mesmo" — só quem fez a planilha sabe.

        Entre errar descartando e errar duplicando, duplicar é o erro barato:
        o RH vê a linha repetida e apaga. A linha que some ele não tem como
        perceber que faltou. Vira aviso, e as duas entram.
      */
      avisos.push({
        linha,
        mensagem:
          `Idêntica à linha ${linhaAnterior} em tudo que o sistema compara. ` +
          'As duas serão importadas — confira se não foi digitação repetida.',
        valor: cargo ?? undefined,
      })
    }
    chavesVistas.set(chaveDedupe, linha)

    avisos.push(...avisosDaLinha)

    validas.push({
      linha,
      operacaoId: operacao!.id,
      unidadeTexto: unidadeBruta!,
      departamento: departamentoOk,
      cargo: cargo!,
      cargoId: descritivoPorNome.get(normalizar(cargo)) ?? null,
      area: texto(campo(dados, 'area')),
      salario: salarioOk,
      localTrabalho: texto(campo(dados, 'localTrabalho')),
      horario: texto(campo(dados, 'horario')),
      quantidadeVagas: quantidade,
      informacoesComplementares: texto(campo(dados, 'informacoesComplementares')),
      requisitosMinimos: texto(campo(dados, 'requisitosMinimos')),
      formacao: texto(campo(dados, 'formacao')),
      motivoSolicitacao: texto(campo(dados, 'motivoSolicitacao')),
      codigo,
      frontline: texto(campo(dados, 'frontline')),
      colaboradorAnterior,
      dataDesligamento: datas.dataDesligamento,
      dataAbertura: abertura,
      dataPrevistaFechamento: prevista,
      dataContratacao: contratacao,
      responsavelVaga: texto(campo(dados, 'responsavelVaga')),
      solicitanteVaga: texto(campo(dados, 'solicitanteVaga')),
      nomeContratado,
      status: statusFinal,
      andamentoProcesso: texto(campo(dados, 'andamentoProcesso')),
      chaveDedupe,
    })
  }

  return { total: linhas.length, validas, erros, avisos, duplicadas }
}
