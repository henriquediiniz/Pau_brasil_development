import assert from 'node:assert/strict'
import test from 'node:test'

import { resumirFrontline, type CandidatoResumo, type VagaResumo } from '../src/lib/gente/painel-frontline'

const cand = (o: Partial<CandidatoResumo> = {}): CandidatoResumo => ({
  cargo: 'Ajudante de Armazém',
  situacao: 'EM_ANDAMENTO',
  operacaoId: 'op-patos',
  operacaoNome: 'Pau Brasil Patos',
  frontline: true,
  ...o,
})

const vaga = (o: Partial<VagaResumo> = {}): VagaResumo => ({
  cargo: 'Ajudante de Armazém',
  quantidade: 1,
  frontline: true,
  ...o,
})

const resumir = (candidatos: CandidatoResumo[], vagasAbertas: VagaResumo[] = [], cargosMarcados = 3) =>
  resumirFrontline({ candidatos, vagasAbertas, cargosMarcados })

test('conta so os candidatos de frontline, mas guarda o total', () => {
  const r = resumir([cand(), cand({ frontline: false }), cand({ frontline: false })])

  assert.equal(r.candidatosFrontline, 1)
  assert.equal(r.totalCandidatos, 3, 'o denominador dá a proporção')
})

test('agrupa por operacao, do maior para o menor', () => {
  const r = resumir([
    cand({ operacaoId: 'sume', operacaoNome: 'Sumé' }),
    cand({ operacaoId: 'patos', operacaoNome: 'Patos' }),
    cand({ operacaoId: 'patos', operacaoNome: 'Patos' }),
  ])

  assert.deepEqual(r.porOperacao.map((o) => [o.nome, o.total]), [['Patos', 2], ['Sumé', 1]])
})

test('candidato sem operacao nao inventa um grupo', () => {
  const r = resumir([cand({ operacaoId: null, operacaoNome: null }), cand()])

  assert.equal(r.porOperacao.length, 1)
  assert.equal(r.candidatosFrontline, 2, 'mas continua contando no total')
})

test('quantidade por cargo conta todos, em qualquer situacao', () => {
  // Pedido do PO (2026-10-07): a quantidade simples, e nao so quem esta em
  // processo — a soma tem que bater com o total de frontline.
  const r = resumir([
    cand({ cargo: 'Motorista', situacao: 'EM_ANDAMENTO' }),
    cand({ cargo: 'Motorista', situacao: 'EM_STAND_BY' }),
    cand({ cargo: 'Conferente', situacao: 'CONTRATADO' }),
    cand({ cargo: 'Conferente', situacao: 'NAO_CONTRATADO' }),
    cand({ cargo: 'Conferente', situacao: 'INDISPONIVEL' }),
  ])

  assert.deepEqual(r.porCargo.map((c) => [c.cargo, c.candidatos]), [['Conferente', 3], ['Motorista', 2]])
  assert.equal(r.porCargo.reduce((s, c) => s + c.candidatos, 0), r.candidatosFrontline)
})

test('traz todos os cargos, do maior para o menor', () => {
  const r = resumir(
    ['A', 'B', 'C', 'D'].flatMap((c, i) =>
      Array.from({ length: 4 - i }, () => cand({ cargo: c }))
    )
  )

  assert.deepEqual(r.porCargo.map((c) => c.cargo), ['A', 'B', 'C', 'D'])
})

test('candidato fora do frontline nao entra na quantidade por cargo', () => {
  const r = resumir([cand({ cargo: 'Motorista' }), cand({ cargo: 'Analista', frontline: false })])
  assert.deepEqual(r.porCargo.map((c) => c.cargo), ['Motorista'])
})

test('o mesmo cargo escrito diferente e um cargo so', () => {
  const r = resumir([cand({ cargo: 'Ajudante de Armazém' }), cand({ cargo: 'AJUDANTE DE ARMAZEM' })])

  assert.equal(r.porCargo.length, 1)
  assert.equal(r.porCargo[0].candidatos, 2)
})

test('posicoes abertas somam a quantidade, nao as requisicoes', () => {
  // Uma requisição de 3 motoristas descobre 3 posições.
  const r = resumir([], [vaga({ quantidade: 3 }), vaga({ quantidade: 2 })])

  assert.equal(r.posicoesAbertas, 5)
})

test('vaga de cargo nao frontline fica de fora da conta', () => {
  const r = resumir([], [vaga({ quantidade: 3, frontline: false })])

  assert.equal(r.posicoesAbertas, 0)
})

test('cargo com vaga aberta e sem ninguem disputando e sinalizado', () => {
  // É o número que pede ação: posição descoberta sem ninguém no funil não se
  // resolve sozinha.
  const r = resumir(
    [cand({ cargo: 'Motorista' })],
    [vaga({ cargo: 'Motorista' }), vaga({ cargo: 'Conferente', quantidade: 2 })]
  )

  assert.deepEqual(r.semCandidato, [{ cargo: 'Conferente', posicoesAbertas: 2 }])
})

test('candidato com desfecho nao conta como cobertura da vaga', () => {
  /*
    Contratado ja saiu do funil; se ele contasse, a vaga reaberta apareceria
    como coberta e ninguem seria avisado.
  */
  const r = resumir([cand({ cargo: 'Motorista', situacao: 'CONTRATADO' })], [vaga({ cargo: 'Motorista' })])

  assert.deepEqual(r.semCandidato, [{ cargo: 'Motorista', posicoesAbertas: 1 }])
})

test('sem cargo marcado, o resumo diz isso em vez de mostrar zeros', () => {
  const r = resumirFrontline({ candidatos: [cand({ frontline: false })], vagasAbertas: [], cargosMarcados: 0 })

  assert.equal(r.cargosMarcados, 0, 'a tela usa isso para explicar o painel vazio')
  assert.equal(r.candidatosFrontline, 0)
})

test('nada cadastrado nao quebra', () => {
  const r = resumir([], [], 0)

  assert.deepEqual(r.porOperacao, [])
  assert.deepEqual(r.porCargo, [])
  assert.deepEqual(r.semCandidato, [])
  assert.equal(r.posicoesAbertas, 0)
})

test('preposicao nao separa cargo: as quatro grafias reais de Ajudante de Distribuicao', () => {
  // O painel mostrava "AJUDANTE DISTRIBUIÇÃO" (15) e "Ajudante da Distribuição"
  // (4) como dois cargos nos "Mais disputados" (PO, 2026-10-07).
  const r = resumir([
    cand({ cargo: 'AJUDANTE DISTRIBUIÇÃO' }),
    cand({ cargo: 'AJUDANTE DISTRIBUIÇÃO' }),
    cand({ cargo: 'Ajudante da Distribuição' }),
    cand({ cargo: 'Ajudante de Distribuição' }),
    cand({ cargo: 'AJUDANTE DE DISTRIBUIÇÃO' }),
  ])

  assert.equal(r.porCargo.length, 1)
  assert.equal(r.porCargo[0].candidatos, 5)
})

test('o grupo aparece com o nome do descritivo, quando existe', () => {
  const r = resumirFrontline({
    candidatos: [cand({ cargo: 'AJUDANTE DISTRIBUIÇÃO' }), cand({ cargo: 'Ajudante da Distribuição' })],
    vagasAbertas: [vaga({ cargo: 'AJUDANTE DE DISTRIBUICAO', quantidade: 2 })],
    cargosMarcados: 1,
    nomesOficiais: ['Ajudante de Distribuição'],
  })

  assert.deepEqual(r.porCargo, [{ cargo: 'Ajudante de Distribuição', candidatos: 2 }])
})

test('sem descritivo, o grupo aparece com a grafia mais usada', () => {
  const r = resumir([cand({ cargo: 'PROMOTOR' }), cand({ cargo: 'PROMOTOR' }), cand({ cargo: 'Promotor' })])
  assert.equal(r.porCargo[0].cargo, 'PROMOTOR')
})
