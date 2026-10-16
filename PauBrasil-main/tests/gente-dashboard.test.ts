import assert from 'node:assert/strict'
import test from 'node:test'

import {
  agregarCandidatos,
  agregarVagas,
  ehPeriodoValido,
  resolverIntervalo,
  descreverIntervalo,
  filtroDeData,
  lerDataIso,
  escreverDataIso,
  type CandidatoParaPainel,
  type VagaParaPainel,
} from '../src/lib/gente/dashboard'

const HOJE = new Date('2026-09-21T12:00:00Z')
const d = (iso: string) => new Date(iso)

function vaga(over: Partial<VagaParaPainel> = {}): VagaParaPainel {
  return {
    status: 'ABERTA',
    dataAbertura: d('2026-09-01'),
    dataPrevistaFechamento: d('2026-10-15'),
    dataContratacao: null,
    encerradaEm: null,
    statusFechamentoManual: null,
    quantidadeVagas: 1,
    operacaoId: 'op-patos',
    operacao: { nome: 'Patos' },
    ...over,
  }
}

// ─── Vagas ────────────────────────────────────────────────────────────────────

test('conta vagas por status', () => {
  const p = agregarVagas(
    [
      vaga(),
      vaga(),
      vaga({ status: 'FECHADA', dataContratacao: d('2026-09-10') }),
      vaga({ status: 'CANCELADA', encerradaEm: d('2026-09-05') }),
    ],
    HOJE
  )

  assert.equal(p.total, 4)
  assert.equal(p.abertas, 2)
  assert.equal(p.fechadas, 1)
  assert.equal(p.canceladas, 1)
})

test('separa requisicoes de postos de trabalho em aberto', () => {
  const p = agregarVagas([vaga({ quantidadeVagas: 3 }), vaga({ quantidadeVagas: 2 })], HOJE)

  assert.equal(p.abertas, 2, 'duas requisições')
  assert.equal(p.posicoesAbertas, 5, 'cinco postos a preencher')
})

test('conta como atrasada so a vaga aberta que passou do prazo', () => {
  const p = agregarVagas(
    [
      vaga({ dataPrevistaFechamento: d('2026-08-01') }), // vencida
      vaga({ dataPrevistaFechamento: d('2026-12-01') }), // no prazo
      // Fechada fora do prazo não entra em "abertasAtrasadas".
      vaga({
        status: 'FECHADA',
        dataPrevistaFechamento: d('2026-08-01'),
        dataContratacao: d('2026-09-10'),
      }),
    ],
    HOJE
  )

  assert.equal(p.abertas, 2)
  assert.equal(p.abertasAtrasadas, 1)
})

test('tempo medio e percentual no prazo usam so as fechadas', () => {
  const p = agregarVagas(
    [
      vaga({ status: 'FECHADA', dataAbertura: d('2026-09-01'), dataContratacao: d('2026-09-11') }), // 10d, no prazo
      vaga({
        status: 'FECHADA',
        dataAbertura: d('2026-09-01'),
        dataPrevistaFechamento: d('2026-09-05'),
        dataContratacao: d('2026-09-21'),
      }), // 20d, fora do prazo
      vaga(), // aberta, não entra na média
    ],
    HOJE
  )

  assert.equal(p.tempoMedioFechamento, 15)
  assert.equal(p.percentualNoPrazo, 50)
})

test('sem vagas fechadas, media e percentual ficam nulos em vez de zero', () => {
  const p = agregarVagas([vaga(), vaga()], HOJE)

  assert.equal(p.tempoMedioFechamento, null)
  assert.equal(p.percentualNoPrazo, null)
})

test('agrupa por operacao e ordena por abertas', () => {
  const p = agregarVagas(
    [
      vaga({ operacaoId: 'op-sume', operacao: { nome: 'Sumé' } }),
      vaga({ operacaoId: 'op-patos', operacao: { nome: 'Patos' } }),
      vaga({ operacaoId: 'op-patos', operacao: { nome: 'Patos' } }),
      vaga({
        operacaoId: 'op-patos',
        operacao: { nome: 'Patos' },
        dataPrevistaFechamento: d('2026-01-01'),
      }),
    ],
    HOJE
  )

  assert.equal(p.porOperacao[0].nome, 'Patos')
  assert.equal(p.porOperacao[0].abertas, 3)
  assert.equal(p.porOperacao[0].atrasadas, 1)
  assert.equal(p.porOperacao[1].nome, 'Sumé')
})

test('vaga sem operacao aparece agrupada em vez de sumir', () => {
  const p = agregarVagas([vaga({ operacaoId: null, operacao: null })], HOJE)

  assert.equal(p.porOperacao.length, 1)
  assert.equal(p.porOperacao[0].nome, 'Sem operação')
})

test('lista vazia nao quebra', () => {
  const p = agregarVagas([], HOJE)

  assert.equal(p.total, 0)
  assert.equal(p.tempoMedioFechamento, null)
  assert.deepEqual(p.porOperacao, [])
})

// ─── Candidatos ───────────────────────────────────────────────────────────────

function candidato(over: Partial<CandidatoParaPainel> = {}): CandidatoParaPainel {
  return {
    situacao: 'EM_STAND_BY',
    origemCurriculo: 'WHATSAPP',
    candidaturaId: null,
    etapas: [],
    ...over,
  }
}

test('classifica candidatos em pronto, bloqueado e em andamento', () => {
  const p = agregarCandidatos([
    candidato({
      etapas: [
        { chave: 'entrevista_gg', resultado: 'OK' },
        { chave: 'aprovacao_gestor', resultado: 'OK' },
        { chave: 'teste_pratico', resultado: 'OK' },
        { chave: 'teste_direcao', resultado: 'NA' },
        { chave: 'direcao_teorico', resultado: 'NA' },
      ],
    }),
    candidato({ etapas: [{ chave: 'aprovacao_gestor', resultado: 'NAO' }] }),
    candidato({ etapas: [{ chave: 'entrevista_gg', resultado: 'OK' }] }),
  ])

  assert.equal(p.prontos, 1)
  assert.equal(p.bloqueados, 1)
  assert.equal(p.emAndamento, 1)
})

test('gargalo mostra em qual etapa as pessoas estao paradas', () => {
  const p = agregarCandidatos([
    candidato({ etapas: [{ chave: 'entrevista_gg', resultado: 'OK' }] }),
    candidato({ etapas: [{ chave: 'entrevista_gg', resultado: 'OK' }] }),
    candidato({ etapas: [] }),
  ])

  assert.equal(p.gargalos[0].chave, 'aprovacao_gestor')
  assert.equal(p.gargalos[0].total, 2)
  assert.equal(p.gargalos[1].chave, 'entrevista_gg')
  assert.equal(p.gargalos[1].total, 1)
})

test('quem foi reprovado nao conta como parado numa etapa', () => {
  const p = agregarCandidatos([
    candidato({ etapas: [{ chave: 'entrevista_gg', resultado: 'NAO' }] }),
  ])

  assert.equal(p.bloqueados, 1)
  assert.deepEqual(p.gargalos, [])
})

test('conta quantos vieram do Banco de Talentos', () => {
  const p = agregarCandidatos([
    candidato({ candidaturaId: 'cand-1', origemCurriculo: 'PORTAL_CARREIRAS' }),
    candidato(),
    candidato(),
  ])

  assert.equal(p.vindosDoSite, 1)
  assert.equal(p.porOrigem[0].origem, 'WHATSAPP')
  assert.equal(p.porOrigem[0].total, 2)
})

test('porSituacao traz todas as situacoes, inclusive as zeradas', () => {
  const p = agregarCandidatos([candidato({ situacao: 'CONTRATADO' })])

  assert.equal(p.porSituacao.CONTRATADO, 1)
  assert.equal(p.porSituacao.EM_STAND_BY, 0)
  assert.equal(p.porSituacao.NAO_CONTRATADO, 0)
})

// ─── Período ──────────────────────────────────────────────────────────────────

test('"ultimos N dias" conta N dias de calendario, incluindo hoje', () => {
  // HOJE = 21/09/2026. "2 dias" é ontem e hoje — não anteontem também.
  // A versão anterior subtraía N da meia-noite de hoje e filtrava por `gte`,
  // o que dava N+1 dias. Em 30 ninguém percebe; em 2 a diferença é de 50%.
  assert.deepEqual(resolverIntervalo('2d', HOJE).inicio, new Date(Date.UTC(2026, 8, 20)))
  assert.deepEqual(resolverIntervalo('7d', HOJE).inicio, new Date(Date.UTC(2026, 8, 15)))
  assert.deepEqual(resolverIntervalo('30d', HOJE).inicio, new Date(Date.UTC(2026, 7, 23)))
  assert.deepEqual(resolverIntervalo('90d', HOJE).inicio, new Date(Date.UTC(2026, 5, 24)))
})

test('atalho em dias nao fecha o fim — vai ate agora', () => {
  assert.equal(resolverIntervalo('7d', HOJE).fim, null)
})

test('12 meses e tudo seguem como antes', () => {
  assert.deepEqual(resolverIntervalo('12m', HOJE).inicio, new Date(Date.UTC(2025, 8, 21)))
  assert.deepEqual(resolverIntervalo('tudo', HOJE), { inicio: null, fim: null })
})

test('o fim do intervalo personalizado e EXCLUSIVO, para incluir o dia inteiro', () => {
  // Escolher 22/09 como fim precisa pegar o que entrou às 14h do dia 22.
  // Por isso o corte vai para a meia-noite do dia 23 e a consulta usa `lt`.
  const i = resolverIntervalo('personalizado', HOJE, { de: '2026-09-01', ate: '2026-09-22' })

  assert.deepEqual(i.inicio, new Date(Date.UTC(2026, 8, 1)))
  assert.deepEqual(i.fim, new Date(Date.UTC(2026, 8, 23)), 'meia-noite do dia seguinte')
})

test('datas invertidas sao engano de clique, nao intervalo vazio', () => {
  const trocado = resolverIntervalo('personalizado', HOJE, { de: '2026-09-22', ate: '2026-09-01' })
  const certo = resolverIntervalo('personalizado', HOJE, { de: '2026-09-01', ate: '2026-09-22' })

  assert.deepEqual(trocado, certo)
})

test('personalizado sem as duas pontas nao recorta nada', () => {
  // Mostrar tudo é melhor do que mostrar vazio sem explicar por quê.
  assert.deepEqual(resolverIntervalo('personalizado', HOJE, { de: '2026-09-01' }), { inicio: null, fim: null })
  assert.deepEqual(resolverIntervalo('personalizado', HOJE, {}), { inicio: null, fim: null })
})

test('um unico dia e um intervalo valido de 24h', () => {
  const i = resolverIntervalo('personalizado', HOJE, { de: '2026-09-10', ate: '2026-09-10' })

  assert.deepEqual(i.inicio, new Date(Date.UTC(2026, 8, 10)))
  assert.deepEqual(i.fim, new Date(Date.UTC(2026, 8, 11)))
})

test('lerDataIso recusa data que nao existe', () => {
  assert.deepEqual(lerDataIso('2026-09-10'), new Date(Date.UTC(2026, 8, 10)))
  assert.equal(lerDataIso('2026-02-31'), null, 'fevereiro não tem 31 — o Date rolaria para março')
  assert.equal(lerDataIso('2026-13-01'), null)
  assert.equal(lerDataIso('10/09/2026'), null, 'só aceita aaaa-mm-dd')
  assert.equal(lerDataIso('1999-01-01'), null, 'fora da faixa plausível')
  assert.equal(lerDataIso(null), null)
  assert.equal(lerDataIso(20260910), null)
})

test('escreverDataIso e lerDataIso sao ida e volta', () => {
  const d = new Date(Date.UTC(2026, 0, 5))
  assert.equal(escreverDataIso(d), '2026-01-05')
  assert.deepEqual(lerDataIso(escreverDataIso(d)), d)
})

test('filtroDeData vira gte/lt, e undefined quando nao ha corte', () => {
  // `undefined` importa: com objeto vazio o spread injetaria `{}` no where.
  assert.equal(filtroDeData({ inicio: null, fim: null }), undefined)

  const i = resolverIntervalo('personalizado', HOJE, { de: '2026-09-01', ate: '2026-09-22' })
  assert.deepEqual(filtroDeData(i), { gte: i.inicio, lt: i.fim })

  assert.deepEqual(filtroDeData(resolverIntervalo('7d', HOJE)), {
    gte: new Date(Date.UTC(2026, 8, 15)),
  })
})

test('descreverIntervalo mostra o recorte que a pilula nao mostra', () => {
  assert.equal(descreverIntervalo({ inicio: null, fim: null }), 'Todo o período')

  assert.equal(
    descreverIntervalo(resolverIntervalo('7d', HOJE), HOJE),
    '15 – 21 set 2026',
    'mesmo mês: só o dia de início'
  )

  assert.equal(
    descreverIntervalo(resolverIntervalo('personalizado', HOJE, { de: '2026-07-01', ate: '2026-09-21' }), HOJE),
    '1 jul – 21 set 2026',
    'mesmo ano, meses diferentes: o mês aparece nos dois'
  )

  assert.equal(
    descreverIntervalo(resolverIntervalo('personalizado', HOJE, { de: '2025-12-28', ate: '2026-01-03' }), HOJE),
    '28 dez 2025 – 3 jan 2026',
    'anos diferentes: aparece nos dois'
  )
})

test('descreverIntervalo devolve o fim ao dia inclusivo', () => {
  // O corte guardado é o dia seguinte; quem lê escolheu o dia 22.
  const texto = descreverIntervalo(
    resolverIntervalo('personalizado', HOJE, { de: '2026-09-22', ate: '2026-09-22' }),
    HOJE
  )

  assert.match(texto, /22 set/)
  assert.ok(!texto.includes('23 set'), 'o dia 23 é detalhe de implementação')
})

test('valida o periodo vindo da querystring', () => {
  assert.equal(ehPeriodoValido('30d'), true)
  assert.equal(ehPeriodoValido('2d'), true)
  assert.equal(ehPeriodoValido('7d'), true)
  assert.equal(ehPeriodoValido('personalizado'), true)
  assert.equal(ehPeriodoValido('tudo'), true)
  assert.equal(ehPeriodoValido('ontem'), false)
  assert.equal(ehPeriodoValido(null), false)
})
