import assert from 'node:assert/strict'
import test from 'node:test'

import {
  analisarPlanilhaInternos,
  analisarPlanilhaSucessao,
  consolidarCobertura,
  converterSimNao,
  converterSituacaoInterno,
  horizonteProntidao,
} from '../src/lib/gente/sucessao'
import type { LinhaPlanilha, OperacaoRef } from '../src/lib/gente/vaga-importador'

const OPERACOES: OperacaoRef[] = [
  { id: 'op-patos', nome: 'Pau Brasil Patos', nomeAbrev: 'Patos' },
  { id: 'op-sume', nome: 'Pau Brasil Sumé', nomeAbrev: 'Sumé' },
]

const linha = (dados: Record<string, unknown>, n = 2): LinhaPlanilha => ({ linha: n, dados })

// ─── Prontidão ────────────────────────────────────────────────────────────────

test('horizonte toma sempre o prazo mais proximo', () => {
  // No app do RH os três eram sim/não independentes, o que permitia
  // "pronto agora = não" junto com "pronto em 1 ano = sim" e vice-versa.
  assert.equal(
    horizonteProntidao({ prontoAgora: true, pronto1Ano: false, pronto2Anos: false }),
    'agora'
  )
  assert.equal(
    horizonteProntidao({ prontoAgora: false, pronto1Ano: true, pronto2Anos: true }),
    '1_ano'
  )
  assert.equal(
    horizonteProntidao({ prontoAgora: false, pronto1Ano: false, pronto2Anos: true }),
    '2_anos'
  )
  assert.equal(
    horizonteProntidao({ prontoAgora: false, pronto1Ano: false, pronto2Anos: false }),
    'nao_mapeado'
  )
})

test('cargo sem ninguem pronto agora nem em 1 ano fica em risco', () => {
  const cobertura = consolidarCobertura([
    { cargoSucessao: 'Gerente', prontoAgora: true, pronto1Ano: false, pronto2Anos: false },
    { cargoSucessao: 'Gerente', prontoAgora: false, pronto1Ano: false, pronto2Anos: true },
    { cargoSucessao: 'Supervisor', prontoAgora: false, pronto1Ano: false, pronto2Anos: true },
  ])

  const gerente = cobertura.find((c) => c.cargo === 'Gerente')!
  assert.equal(gerente.sucessores, 2)
  assert.equal(gerente.prontosAgora, 1)
  assert.equal(gerente.emRisco, false)

  const supervisor = cobertura.find((c) => c.cargo === 'Supervisor')!
  assert.equal(supervisor.emRisco, true, 'só tem sucessor para daqui a 2 anos')
})

test('cargo com sucessor pronto em 1 ano nao esta em risco', () => {
  const [linha0] = consolidarCobertura([
    { cargoSucessao: 'Coordenador', prontoAgora: false, pronto1Ano: true, pronto2Anos: false },
  ])

  assert.equal(linha0.emRisco, false)
})

test('cobertura agrupa ignorando acento e caixa, e poe os em risco primeiro', () => {
  const cobertura = consolidarCobertura([
    { cargoSucessao: 'GERENTE DE DISTRIBUIÇÃO', prontoAgora: true, pronto1Ano: false, pronto2Anos: false },
    { cargoSucessao: 'Gerente de Distribuicao', prontoAgora: false, pronto1Ano: false, pronto2Anos: true },
    { cargoSucessao: 'Supervisor', prontoAgora: false, pronto1Ano: false, pronto2Anos: false },
  ])

  assert.equal(cobertura.length, 2, 'as duas grafias do gerente viram um cargo só')
  assert.equal(cobertura[0].cargo, 'Supervisor', 'o cargo em risco vem primeiro')
})

test('lista vazia nao quebra a cobertura', () => {
  assert.deepEqual(consolidarCobertura([]), [])
})

// ─── Conversores ──────────────────────────────────────────────────────────────

test('converterSimNao aceita as marcacoes que o RH usa', () => {
  assert.equal(converterSimNao('SIM'), true)
  assert.equal(converterSimNao('s'), true)
  assert.equal(converterSimNao('X'), true)
  assert.equal(converterSimNao('NÃO'), false)
  assert.equal(converterSimNao(''), false)
  assert.equal(converterSimNao(null), false)
})

test('converterSituacaoInterno aceita as variacoes da planilha', () => {
  assert.equal(converterSituacaoInterno('AGUARDANDO'), 'AGUARDANDO')
  assert.equal(converterSituacaoInterno('Promovida'), 'PROMOVIDO')
  assert.equal(converterSituacaoInterno('NÃO ATENDE'), 'NAO_ATENDE')
  assert.equal(converterSituacaoInterno(''), null)
  assert.equal(converterSituacaoInterno('talvez'), 'invalida')
})

// ─── Candidatos internos ──────────────────────────────────────────────────────

test('importa candidato interno com lista de futuros cargos', () => {
  const rel = analisarPlanilhaInternos(
    [
      linha({
        Unidade: 'Patos',
        Nome: 'Rafael Nunes',
        'Cargo Atual': 'Vendedor',
        'Cargo Pretendido': 'Supervisor de Vendas',
        'Possui Requisitos': 'SIM',
        'Futuros Cargos': 'Supervisor de Vendas; Coordenador Comercial',
        Situação: 'AGUARDANDO',
      }),
    ],
    OPERACOES
  )

  assert.deepEqual(rel.erros, [])
  assert.equal(rel.validos[0].possuiRequisitos, true)
  assert.deepEqual(rel.validos[0].futurosCargos, ['Supervisor de Vendas', 'Coordenador Comercial'])
})

test('futuros cargos aceita virgula como separador', () => {
  const rel = analisarPlanilhaInternos(
    [linha({ Unidade: 'Patos', Nome: 'Ana', 'Futuros Cargos': 'Analista, Coordenadora' })],
    OPERACOES
  )

  assert.deepEqual(rel.validos[0].futurosCargos, ['Analista', 'Coordenadora'])
})

test('interno sem cargo pretendido entra com aviso', () => {
  const rel = analisarPlanilhaInternos([linha({ Unidade: 'Patos', Nome: 'Ana' })], OPERACOES)

  assert.equal(rel.validos.length, 1)
  assert.ok(rel.avisos.some((a) => a.campo === 'cargoPretendido'))
})

test('situacao invalida bloqueia o interno', () => {
  const rel = analisarPlanilhaInternos(
    [linha({ Unidade: 'Patos', Nome: 'Ana', Situação: 'quem sabe' })],
    OPERACOES
  )

  assert.equal(rel.validos.length, 0)
  assert.equal(rel.erros[0].campo, 'situacao')
})

// ─── Pipeline de sucessão ─────────────────────────────────────────────────────

test('importa linha de sucessao completa', () => {
  const rel = analisarPlanilhaSucessao(
    [
      linha({
        Unidade: 'Patos',
        'Cargo Sucessão': 'Gerente de Distribuição',
        'Nome Sucessor': 'Carla Menezes',
        'Cargo Atual Sucessor': 'Supervisora de Logística',
        'Pronto Agora': 'NÃO',
        'Pronto 1 Ano': 'SIM',
        'Plano Desenvolvimento': 'Formação em gestão',
        'Início Mapeamento': '01/02/2026',
      }),
    ],
    OPERACOES
  )

  assert.deepEqual(rel.erros, [])
  const s = rel.validos[0]
  assert.equal(s.cargoSucessao, 'Gerente de Distribuição')
  assert.equal(s.prontoAgora, false)
  assert.equal(s.pronto1Ano, true)
  assert.deepEqual(s.inicioMapeamento, new Date(Date.UTC(2026, 1, 1)))
})

test('cargo de sucessao e sucessor sao obrigatorios', () => {
  const rel = analisarPlanilhaSucessao([linha({ Unidade: 'Patos' })], OPERACOES)

  assert.equal(rel.validos.length, 0)
  assert.deepEqual(rel.erros.map((e) => e.campo).sort(), ['cargoSucessao', 'nomeSucessor'])
})

test('avisa quando nenhum horizonte de prontidao foi marcado', () => {
  const rel = analisarPlanilhaSucessao(
    [linha({ Unidade: 'Patos', 'Cargo Sucessão': 'Gerente', 'Nome Sucessor': 'Ana' })],
    OPERACOES
  )

  assert.equal(rel.validos.length, 1)
  assert.ok(rel.avisos.some((a) => /sem horizonte/i.test(a.mensagem)))
})

test('avisa quando sucessor nao pronto nao tem plano de desenvolvimento', () => {
  const rel = analisarPlanilhaSucessao(
    [
      linha({
        Unidade: 'Patos',
        'Cargo Sucessão': 'Gerente',
        'Nome Sucessor': 'Ana',
        'Pronto 2 Anos': 'SIM',
      }),
    ],
    OPERACOES
  )

  assert.ok(rel.avisos.some((a) => a.campo === 'planoDesenvolvimento'))
})

test('mesmo sucessor no mesmo cargo e repeticao; em cargo diferente nao', () => {
  const base = { Unidade: 'Patos', 'Nome Sucessor': 'Ana', 'Pronto Agora': 'SIM' }
  const rel = analisarPlanilhaSucessao(
    [
      linha({ ...base, 'Cargo Sucessão': 'Gerente' }, 2),
      linha({ ...base, 'Cargo Sucessão': 'Gerente' }, 3),
      linha({ ...base, 'Cargo Sucessão': 'Coordenador' }, 4),
    ],
    OPERACOES
  )

  assert.equal(rel.validos.length, 2)
  assert.equal(rel.duplicados.length, 1)
  assert.equal(rel.duplicados[0].linha, 3)
})
