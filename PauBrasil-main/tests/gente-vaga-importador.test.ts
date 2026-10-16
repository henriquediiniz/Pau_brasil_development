import assert from 'node:assert/strict'
import test from 'node:test'

import {
  analisarPlanilhaVagas,
  converterData,
  converterDecimal,
  converterStatus,
  normalizar,
  resolverOperacao,
  type LinhaPlanilha,
  type OperacaoRef,
} from '../src/lib/gente/vaga-importador'

const OPERACOES: OperacaoRef[] = [
  { id: 'op-patos', nome: 'Pau Brasil Patos', nomeAbrev: 'Patos' },
  { id: 'op-sume', nome: 'Pau Brasil Sumé', nomeAbrev: 'Sumé' },
  { id: 'op-sousa', nome: 'Pau Brasil Sousa', nomeAbrev: null },
]

function linha(dados: Record<string, unknown>, n = 2): LinhaPlanilha {
  return { linha: n, dados }
}

/** Linha mínima que passa em todos os obrigatórios. */
function linhaValida(extra: Record<string, unknown> = {}, n = 2): LinhaPlanilha {
  return linha(
    {
      Unidade: 'PAU BRASIL PATOS',
      Cargo: 'Motorista Caminhão Distribuição',
      'Data Abertura': '12/02/2026',
      'Data Prevista Fechamento': '29/03/2026',
      Status: 'FECHADA',
      'Data Contratação': '26/02/2026',
      ...extra,
    },
    n
  )
}

// ─── Conversores ──────────────────────────────────────────────────────────────

test('normalizar remove acento, caixa e pontuacao', () => {
  assert.equal(normalizar('PAU BRASIL SUMÉ'), 'pau brasil sume')
  assert.equal(normalizar('Data de Contratação'), 'data de contratacao')
  assert.equal(normalizar(null), '')
})

test('converterData aceita os tres formatos que a planilha do RH mistura', () => {
  assert.deepEqual(converterData('12/02/2026'), new Date(Date.UTC(2026, 1, 12)))
  assert.deepEqual(converterData('2026-02-12'), new Date(Date.UTC(2026, 1, 12)))
  assert.deepEqual(converterData('12-02-2026'), new Date(Date.UTC(2026, 1, 12)))
})

test('converterData entende o serial numerico do Excel', () => {
  // 45700 = 2025-02-12 no calendario do Excel.
  assert.deepEqual(converterData(45700), new Date(Date.UTC(2025, 1, 12)))
})

test('converterData rejeita data impossivel em vez de deixar o Date estourar', () => {
  assert.equal(converterData('31/02/2026'), 'invalida')
  assert.equal(converterData('12/13/2026'), 'invalida')
  assert.equal(converterData('banana'), 'invalida')
})

test('converterData trata vazio como ausente, nao como erro', () => {
  assert.equal(converterData(''), null)
  assert.equal(converterData(null), null)
  assert.equal(converterData(undefined), null)
})

test('converterDecimal entende o formato brasileiro de moeda', () => {
  assert.equal(converterDecimal('R$ 1.500,00'), 1500)
  assert.equal(converterDecimal('1.500,50'), 1500.5)
  assert.equal(converterDecimal('1500.50'), 1500.5)
  assert.equal(converterDecimal(1500), 1500)
  assert.equal(converterDecimal(''), null)
  assert.equal(converterDecimal('abc'), 'invalida')
})

test('converterStatus aceita as variacoes que o RH digita', () => {
  assert.equal(converterStatus('ABERTA'), 'ABERTA')
  assert.equal(converterStatus('Em Aberto'), 'ABERTA')
  assert.equal(converterStatus('fechado'), 'FECHADA')
  assert.equal(converterStatus('Cancelada'), 'CANCELADA')
  assert.equal(converterStatus(''), null)
  assert.equal(converterStatus('pendente'), 'invalida')
})

test('resolverOperacao casa nome completo, abreviacao e so a cidade', () => {
  assert.equal(resolverOperacao('PAU BRASIL PATOS', OPERACOES)?.id, 'op-patos')
  assert.equal(resolverOperacao('Patos', OPERACOES)?.id, 'op-patos')
  assert.equal(resolverOperacao('SUMÉ', OPERACOES)?.id, 'op-sume')
  assert.equal(resolverOperacao('Sousa', OPERACOES)?.id, 'op-sousa')
  assert.equal(resolverOperacao('Campina Grande', OPERACOES), null)
  assert.equal(resolverOperacao('', OPERACOES), null)
})

// ─── Análise da planilha ──────────────────────────────────────────────────────

test('importa uma linha completa e calcula os campos derivados', () => {
  const rel = analisarPlanilhaVagas([linhaValida()], OPERACOES)

  assert.equal(rel.erros.length, 0)
  assert.equal(rel.validas.length, 1)

  const v = rel.validas[0]
  assert.equal(v.operacaoId, 'op-patos')
  assert.equal(v.unidadeTexto, 'PAU BRASIL PATOS')
  assert.equal(v.cargo, 'Motorista Caminhão Distribuição')
  assert.equal(v.status, 'FECHADA')
  assert.equal(v.quantidadeVagas, 1)
  assert.deepEqual(v.dataAbertura, new Date(Date.UTC(2026, 1, 12)))
  assert.deepEqual(v.dataContratacao, new Date(Date.UTC(2026, 1, 26)))
})

test('unidade que nao existe como operacao bloqueia a linha', () => {
  const rel = analisarPlanilhaVagas([linhaValida({ Unidade: 'PAU BRASIL CAMPINA' })], OPERACOES)

  assert.equal(rel.validas.length, 0)
  assert.equal(rel.erros.length, 1)
  assert.equal(rel.erros[0].campo, 'unidade')
  assert.match(rel.erros[0].mensagem, /operação cadastrada/i)
  assert.equal(rel.erros[0].valor, 'PAU BRASIL CAMPINA')
})

test('cargo e data de abertura sao obrigatorios', () => {
  const rel = analisarPlanilhaVagas(
    [linha({ Unidade: 'Patos', Status: 'ABERTA' })],
    OPERACOES
  )

  assert.equal(rel.validas.length, 0)
  const campos = rel.erros.map((e) => e.campo).sort()
  assert.deepEqual(campos, ['cargo', 'dataAbertura'])
})

test('uma linha com erro nao derruba as outras', () => {
  const rel = analisarPlanilhaVagas(
    [
      linhaValida({}, 2),
      linha({ Unidade: 'Patos', Cargo: 'Ajudante' }, 3), // sem data de abertura
      linhaValida({ Cargo: 'Vendedor', 'Cod': 'V-99' }, 4),
    ],
    OPERACOES
  )

  assert.equal(rel.total, 3)
  assert.equal(rel.validas.length, 2)
  assert.equal(rel.erros.length, 1)
  assert.equal(rel.erros[0].linha, 3)
})

test('aceita cabecalhos com acento, caixa e nomes alternativos', () => {
  const rel = analisarPlanilhaVagas(
    [
      linha({
        OPERAÇÃO: 'Patos',
        FUNÇÃO: 'Ajudante Distribuição',
        'DATA DE ABERTURA': '04/02/2026',
        SITUAÇÃO: 'Aberta',
        'QTD VAGAS': '2',
      }),
    ],
    OPERACOES
  )

  assert.equal(rel.erros.length, 0)
  assert.equal(rel.validas[0].cargo, 'Ajudante Distribuição')
  assert.equal(rel.validas[0].quantidadeVagas, 2)
})

test('linha identica vira aviso, e as duas sao importadas', () => {
  /*
    A planilha do RH não tem identificador de requisição, e abrir várias
    posições do mesmo cargo no mesmo dia é rotina (aumento de QLP). O sistema
    não consegue distinguir "digitou duas vezes" de "são duas vagas mesmo".

    Entre errar descartando e errar duplicando, duplicar é o erro barato: a
    linha repetida o RH vê e apaga; a que some ele não tem como perceber.
  */
  const rel = analisarPlanilhaVagas([linhaValida({}, 2), linhaValida({}, 3)], OPERACOES)

  assert.equal(rel.validas.length, 2, 'nenhuma é descartada')
  assert.equal(rel.duplicadas.length, 0)

  const aviso = rel.avisos.find((a) => a.linha === 3)
  assert.ok(aviso, 'mas o RH é avisado')
  assert.match(aviso!.mensagem, /linha 2/)
})

test('mesmo codigo em cargos diferentes NAO e repeticao', () => {
  /*
    O bug que o RH reportou: importou a planilha e 27 linhas foram descartadas
    como repetidas — "MOTORISTA DE CARRETA" acusada de repetir "AJUDANTE
    DISTRIBUIÇÃO". A regra antiga era `codigo ? cod:X : resto`, e o código na
    planilha deles não identifica a requisição.

    Este teste tinha o comportamento antigo escrito como esperado. Ele
    documentava o defeito.
  */
  const rel = analisarPlanilhaVagas(
    [
      linhaValida({ Cod: 'V-10' }, 2),
      linhaValida({ Cod: 'V-10', Cargo: 'Outro cargo qualquer' }, 3),
      linhaValida({ Cod: 'V-11', Cargo: 'Outro cargo qualquer' }, 4),
    ],
    OPERACOES
  )

  assert.equal(rel.validas.length, 3, 'nenhuma é descartada')
  assert.equal(rel.duplicadas.length, 0)
})

test('duas vagas do mesmo cargo no mesmo dia, com contratados diferentes, sao duas', () => {
  /*
    O caso real da planilha: três linhas de "AJUDANTE DISTRIBUIÇÃO" abertas em
    03/08 na mesma unidade, cada uma com uma pessoa contratada. Eram três
    posições de aumento de QLP, e o sistema descartava duas.
  */
  const rel = analisarPlanilhaVagas(
    [
      linhaValida({ 'Nome Contratado': 'João Paulo Martins' }, 2),
      linhaValida({ 'Nome Contratado': 'Ederson Alexandre' }, 3),
      linhaValida({ 'Nome Contratado': 'José Nilton Gomes' }, 4),
    ],
    OPERACOES
  )

  assert.equal(rel.validas.length, 3)
  assert.equal(rel.avisos.filter((a) => /Idêntica/.test(a.mensagem)).length, 0, 'nem aviso')
})

test('mesmo cargo em datas de abertura diferentes sao duas vagas', () => {
  // Reabrir a mesma posição meses depois é uma requisição nova.
  const rel = analisarPlanilhaVagas(
    [
      linhaValida({ 'Data Abertura': '12/02/2026' }, 2),
      linhaValida({ 'Data Abertura': '20/05/2026' }, 3),
    ],
    OPERACOES
  )

  assert.equal(rel.validas.length, 2)
})

test('status vazio e deduzido pela data de contratacao, com aviso', () => {
  const comContratacao = analisarPlanilhaVagas(
    [linhaValida({ Status: '' })],
    OPERACOES
  )
  assert.equal(comContratacao.validas[0].status, 'FECHADA')
  assert.ok(comContratacao.avisos.some((a) => a.campo === 'status'))

  const semContratacao = analisarPlanilhaVagas(
    [linhaValida({ Status: '', 'Data Contratação': '' })],
    OPERACOES
  )
  assert.equal(semContratacao.validas[0].status, 'ABERTA')
})

test('avisa sobre incoerencias sem bloquear a importacao', () => {
  const rel = analisarPlanilhaVagas(
    [linhaValida({ Status: 'ABERTA' })], // aberta, mas com data de contratação
    OPERACOES
  )

  assert.equal(rel.validas.length, 1)
  assert.equal(rel.erros.length, 0)
  assert.ok(rel.avisos.some((a) => /deveria estar fechada/i.test(a.mensagem)))
})

test('avisa quando nao ha previsao de fechamento, porque o SLA muda', () => {
  const rel = analisarPlanilhaVagas(
    [linhaValida({ 'Data Prevista Fechamento': '' })],
    OPERACOES
  )

  assert.equal(rel.validas.length, 1)
  assert.ok(rel.avisos.some((a) => /prazo padrão de 30 dias/i.test(a.mensagem)))
})

test('status invalido bloqueia em vez de virar ABERTA por omissao', () => {
  const rel = analisarPlanilhaVagas([linhaValida({ Status: 'em analise' })], OPERACOES)

  assert.equal(rel.validas.length, 0)
  assert.equal(rel.erros[0].campo, 'status')
})

test('quantidade de vagas zero ou negativa e erro', () => {
  const rel = analisarPlanilhaVagas([linhaValida({ 'Quantidade Vagas': '0' })], OPERACOES)

  assert.equal(rel.validas.length, 0)
  assert.equal(rel.erros[0].campo, 'quantidadeVagas')
})

test('planilha vazia devolve relatorio zerado sem quebrar', () => {
  const rel = analisarPlanilhaVagas([], OPERACOES)

  assert.deepEqual(rel, { total: 0, validas: [], erros: [], avisos: [], duplicadas: [] })
})

// ─── Vínculo com o descritivo na importação ───────────────────────────────────

test('a vaga importada ja nasce vinculada ao descritivo', () => {
  // Sem isso a vaga entraria solta e o vínculo voltaria a depender do nome
  // digitado depois — que é o que estamos deixando de lado.
  const rel = analisarPlanilhaVagas([linhaValida()], OPERACOES, [
    { id: 'desc-1', cargo: 'Motorista Caminhão Distribuição' },
  ])

  assert.equal(rel.validas[0].cargoId, 'desc-1')
})

test('casa ignorando caixa e acento, que e como a planilha do RH escreve', () => {
  const rel = analisarPlanilhaVagas(
    [linhaValida({ Cargo: 'MOTORISTA CAMINHAO DISTRIBUICAO' })],
    OPERACOES,
    [{ id: 'desc-1', cargo: 'Motorista Caminhão Distribuição' }]
  )

  assert.equal(rel.validas[0].cargoId, 'desc-1')
})

test('cargo sem descritivo entra sem vinculo, e nao e erro', () => {
  /*
    Caso real do banco: existe a vaga "MOTORISTA CAMINHAO DISTRIBUIÇÃO" e o
    descritivo mais próximo é "Motorista". São cargos diferentes — casar por
    aproximação ligaria a vaga ao descritivo errado, que é pior que não ligar.
  */
  const rel = analisarPlanilhaVagas([linhaValida()], OPERACOES, [
    { id: 'desc-1', cargo: 'Motorista' },
  ])

  assert.deepEqual(rel.erros, [], 'não bloqueia')
  assert.equal(rel.validas.length, 1)
  assert.equal(rel.validas[0].cargoId, null)
})

test('sem descritivos, o importador segue funcionando como antes', () => {
  const rel = analisarPlanilhaVagas([linhaValida()], OPERACOES)

  assert.equal(rel.validas.length, 1)
  assert.equal(rel.validas[0].cargoId, null)
})
