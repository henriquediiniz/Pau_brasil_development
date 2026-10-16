/**
 * Importador da planilha de candidatos stand-by.
 *
 * Mesma filosofia do importador de vagas: função pura, nada de Prisma nem de
 * XLSX, e operação não reconhecida é erro bloqueante — nenhum candidato entra
 * sem dono, porque é o `operacaoId` que sustenta a regra de escopo.
 */

import { converterResultado, ETAPAS_PADRAO, type ResultadoEtapa } from './etapas'
import type { OrigemCurriculo, SituacaoCandidato } from './candidato'
import {
  converterData,
  normalizar,
  resolverOperacao,
  type LinhaPlanilha,
  type OperacaoRef,
  type ProblemaImportacao,
} from './vaga-importador'

/**
 * Identidade do candidato.
 *
 * Sem ID estável na origem: o telefone é o que o RH usa para reconhecer a
 * pessoa, e ele atravessa operações — a mesma pessoa se candidatando em duas
 * unidades é uma pessoa só. Sem telefone, cai para nome + operação.
 *
 * Usada nos dois lados — repetição dentro da planilha e reconhecimento no
 * banco. Se as duas regras divergissem, reimportar voltaria a duplicar.
 */
export function chaveCandidato(c: {
  operacaoId: string | null
  nome: string
  telefone?: string | null
}): string {
  /*
    Só os dígitos. A planilha traz "(83) 99999-1234", "83 99999-1234" e
    "83999991234" para o mesmo número, e comparar o texto cru faria a mesma
    pessoa entrar de novo a cada reimportação com a formatação trocada.
  */
  const digitos = (c.telefone ?? '').replace(/\D/g, '')

  return digitos
    ? `tel:${digitos}`
    : `nome:${c.operacaoId ?? ''}|${normalizar(c.nome)}`
}

export interface CandidatoImportado {
  linha: number
  operacaoId: string
  nome: string
  cargo: string | null
  telefone: string | null
  email: string | null
  mesProcesso: string | null
  setor: 'DPO' | 'SPO' | null
  escolaridade: string | null
  habilidades: string | null
  residencia: string | null
  observacao: string | null
  origemCurriculo: OrigemCurriculo
  quemIndicou: string | null
  situacao: SituacaoCandidato
  situacaoFinal: SituacaoCandidato | null
  dataSituacaoFinal: Date | null
  etapas: { chave: string; resultado: ResultadoEtapa }[]
  chaveDedupe: string
}

export interface RelatorioImportacaoCandidatos {
  total: number
  validos: CandidatoImportado[]
  erros: ProblemaImportacao[]
  avisos: ProblemaImportacao[]
  duplicados: ProblemaImportacao[]
}

// ─── Cabeçalhos aceitos ───────────────────────────────────────────────────────

export const COLUNAS_CANDIDATO: Record<string, string[]> = {
  unidade: ['unidade', 'operacao', 'filial'],
  nome: ['nome', 'candidato', 'nome do candidato'],
  cargo: ['cargo', 'funcao', 'vaga'],
  telefone: ['telefone', 'celular', 'contato', 'whatsapp'],
  email: ['email', 'e mail'],
  mesProcesso: ['mes processo', 'mes do processo', 'mes'],
  setor: ['dpo ou spo', 'dpo spo', 'setor', 'departamento'],
  escolaridade: ['escolaridade', 'formacao'],
  habilidades: ['habilidades', 'competencias'],
  residencia: ['residencia', 'endereco', 'bairro', 'cidade'],
  observacao: ['observacao', 'observacoes', 'obs'],
  origemCurriculo: ['origem curriculo', 'origem do curriculo', 'origem'],
  quemIndicou: ['quem indicou', 'indicado por', 'indicacao'],
  situacao: ['situacao'],
  situacaoFinal: ['situacao final'],
  dataSituacaoFinal: ['data situacao final', 'data da situacao final'],
}

/** Rótulos da planilha para cada etapa do processo. */
export const COLUNAS_ETAPA: Record<string, string[]> = {
  entrevista_gg: ['entrevistado gg', 'entrevista gg', 'entrevistadogg'],
  aprovacao_gestor: ['aprovado gestor', 'aprovacao gestor', 'aprovado pelo gestor'],
  teste_pratico: ['teste pratico'],
  teste_direcao: ['teste direcao', 'teste de direcao'],
  direcao_teorico: ['direcao teorico', 'direcao teorica', 'teorico'],
}

function campo(dados: Record<string, unknown>, nome: string): unknown {
  const aceitos = COLUNAS_CANDIDATO[nome] ?? [nome]
  for (const [chave, valor] of Object.entries(dados)) {
    if (aceitos.includes(normalizar(chave))) return valor
  }
  return undefined
}

function campoEtapa(dados: Record<string, unknown>, chaveEtapa: string): unknown {
  const aceitos = COLUNAS_ETAPA[chaveEtapa] ?? []
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

// ─── Conversores específicos ──────────────────────────────────────────────────

const SITUACOES_ACEITAS: Record<string, SituacaoCandidato> = {
  'em stand by': 'EM_STAND_BY',
  standby: 'EM_STAND_BY',
  'stand by': 'EM_STAND_BY',
  'em andamento': 'EM_ANDAMENTO',
  andamento: 'EM_ANDAMENTO',
  contratado: 'CONTRATADO',
  contratada: 'CONTRATADO',
  indisponivel: 'INDISPONIVEL',
  'nao contratado': 'NAO_CONTRATADO',
  'nao contratada': 'NAO_CONTRATADO',
  recusado: 'NAO_CONTRATADO',
}

export function converterSituacao(valor: unknown): SituacaoCandidato | null | 'invalida' {
  const s = normalizar(valor)
  if (s === '') return null
  return SITUACOES_ACEITAS[s] ?? 'invalida'
}

const ORIGENS_ACEITAS: Record<string, OrigemCurriculo> = {
  aplicativo: 'APLICATIVO',
  app: 'APLICATIVO',
  whatsapp: 'WHATSAPP',
  zap: 'WHATSAPP',
  email: 'EMAIL',
  'e mail': 'EMAIL',
  'indique um amigo': 'INDICACAO',
  indicacao: 'INDICACAO',
  indicado: 'INDICACAO',
  portal: 'PORTAL_CARREIRAS',
  'portal de carreiras': 'PORTAL_CARREIRAS',
  site: 'PORTAL_CARREIRAS',
  outro: 'OUTRO',
}

export function converterOrigem(valor: unknown): OrigemCurriculo | null | 'invalida' {
  const s = normalizar(valor)
  if (s === '') return null
  return ORIGENS_ACEITAS[s] ?? 'invalida'
}

function converterSetor(valor: unknown): 'DPO' | 'SPO' | null | 'invalida' {
  const s = normalizar(valor)
  if (s === '') return null
  if (s === 'dpo') return 'DPO'
  if (s === 'spo') return 'SPO'
  return 'invalida'
}

// ─── Análise ──────────────────────────────────────────────────────────────────

export function analisarPlanilhaCandidatos(
  linhas: LinhaPlanilha[],
  operacoes: OperacaoRef[]
): RelatorioImportacaoCandidatos {
  const validos: CandidatoImportado[] = []
  const erros: ProblemaImportacao[] = []
  const avisos: ProblemaImportacao[] = []
  const duplicados: ProblemaImportacao[] = []
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

    // ── Obrigatórios ──
    const nome = texto(campo(dados, 'nome'))
    if (!nome) erro('nome', 'Nome é obrigatório')

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

    // ── Enums ──
    let situacao = converterSituacao(campo(dados, 'situacao'))
    if (situacao === 'invalida') {
      erro('situacao', 'Situação não reconhecida', campo(dados, 'situacao'))
      situacao = null
    }

    let situacaoFinal = converterSituacao(campo(dados, 'situacaoFinal'))
    if (situacaoFinal === 'invalida') {
      erro('situacaoFinal', 'Situação final não reconhecida', campo(dados, 'situacaoFinal'))
      situacaoFinal = null
    }

    let origem = converterOrigem(campo(dados, 'origemCurriculo'))
    if (origem === 'invalida') {
      // Origem desconhecida não trava a importação: vira OUTRO com aviso.
      avisosDaLinha.push({
        linha,
        campo: 'origemCurriculo',
        mensagem: 'Origem não reconhecida — registrada como "Outro"',
        valor: String(campo(dados, 'origemCurriculo')),
      })
      origem = null
    }

    const setor = converterSetor(campo(dados, 'setor'))
    if (setor === 'invalida') {
      erro('setor', 'Setor deve ser DPO ou SPO', campo(dados, 'setor'))
    }

    const dataFinal = converterData(campo(dados, 'dataSituacaoFinal'))
    if (dataFinal === 'invalida') {
      erro('dataSituacaoFinal', 'Data inválida', campo(dados, 'dataSituacaoFinal'))
    }

    // ── Etapas ──
    const etapasLidas: { chave: string; resultado: ResultadoEtapa }[] = []
    for (const def of ETAPAS_PADRAO) {
      const bruto = campoEtapa(dados, def.chave)
      if (bruto === undefined) continue

      const resultado = converterResultado(bruto)
      if (resultado === 'invalida') {
        erro(def.chave, `Resultado de "${def.label}" deve ser OK, NÃO ou N/A`, bruto)
      } else if (resultado !== null) {
        etapasLidas.push({ chave: def.chave, resultado })
      }
    }

    if (errosDaLinha.length > 0) {
      erros.push(...errosDaLinha)
      continue
    }

    const situacaoOk: SituacaoCandidato = (situacao as SituacaoCandidato | null) ?? 'EM_STAND_BY'
    const situacaoFinalOk = (situacaoFinal as SituacaoCandidato | null) ?? null
    const dataFinalOk = dataFinal === 'invalida' ? null : dataFinal
    const setorOk = setor === 'invalida' ? null : setor

    // ── Avisos de coerência ──
    if (situacaoFinalOk && !dataFinalOk) {
      avisosDaLinha.push({
        linha,
        campo: 'dataSituacaoFinal',
        mensagem: 'Situação final preenchida sem data — o histórico fica sem quando aconteceu',
      })
    }
    if (situacaoOk === 'CONTRATADO' && etapasLidas.some((e) => e.resultado === 'NAO')) {
      avisosDaLinha.push({
        linha,
        campo: 'situacao',
        mensagem: 'Candidato marcado como contratado, mas há etapa reprovada — confira',
      })
    }
    if (etapasLidas.length === 0) {
      avisosDaLinha.push({
        linha,
        mensagem: 'Nenhuma etapa preenchida — o candidato entra com o processo todo pendente',
      })
    }

    const telefone = texto(campo(dados, 'telefone'))

    // Sem ID estável na origem: telefone é o que o RH usa para reconhecer a
    // pessoa; sem telefone, cai para nome + operação.
    const chaveDedupe = chaveCandidato({ operacaoId: operacao!.id, nome: nome!, telefone })

    const linhaAnterior = chavesVistas.get(chaveDedupe)
    if (linhaAnterior !== undefined) {
      duplicados.push({
        linha,
        mensagem: `Repete a linha ${linhaAnterior} (mesma pessoa). Só a primeira será importada.`,
        valor: nome ?? undefined,
      })
      continue
    }
    chavesVistas.set(chaveDedupe, linha)

    avisos.push(...avisosDaLinha)

    const emailBruto = texto(campo(dados, 'email'))

    validos.push({
      linha,
      operacaoId: operacao!.id,
      nome: nome!,
      cargo: texto(campo(dados, 'cargo')),
      telefone,
      // E-mail malformado não bloqueia a pessoa de entrar: só não é gravado.
      email: emailBruto && emailBruto.includes('@') ? emailBruto : null,
      mesProcesso: texto(campo(dados, 'mesProcesso')),
      setor: setorOk,
      escolaridade: texto(campo(dados, 'escolaridade')),
      habilidades: texto(campo(dados, 'habilidades')),
      residencia: texto(campo(dados, 'residencia')),
      observacao: texto(campo(dados, 'observacao')),
      origemCurriculo: (origem as OrigemCurriculo | null) ?? 'OUTRO',
      quemIndicou: texto(campo(dados, 'quemIndicou')),
      situacao: situacaoOk,
      situacaoFinal: situacaoFinalOk,
      dataSituacaoFinal: dataFinalOk,
      etapas: etapasLidas,
      chaveDedupe,
    })

    if (emailBruto && !emailBruto.includes('@')) {
      avisos.push({
        linha,
        campo: 'email',
        mensagem: 'E-mail em formato inválido — não foi gravado',
        valor: emailBruto,
      })
    }
  }

  return { total: linhas.length, validos, erros, avisos, duplicados }
}
