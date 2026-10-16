import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DIAS_ALERTA_VENCIMENTO,
  calcularCotaAprendiz,
  calcularCotaPcd,
  calcularVigencia,
  ehAprendizOuEstagiario,
} from '../src/lib/gente/cotas'

const HOJE = new Date('2026-09-21T12:00:00Z')

// ─── Cota de PCD ──────────────────────────────────────────────────────────────

test('abaixo de 100 colaboradores a cota de PCD nao se aplica', () => {
  const c = calcularCotaPcd(99, 0)

  assert.equal(c.aplicavel, false)
  assert.equal(c.exigido, 0)
  assert.equal(c.emDia, true)
})

test('aplica o percentual de cada faixa da lei', () => {
  assert.equal(calcularCotaPcd(100, 0).percentual, 2)
  assert.equal(calcularCotaPcd(200, 0).percentual, 2)
  assert.equal(calcularCotaPcd(201, 0).percentual, 3)
  assert.equal(calcularCotaPcd(500, 0).percentual, 3)
  assert.equal(calcularCotaPcd(501, 0).percentual, 4)
  assert.equal(calcularCotaPcd(1000, 0).percentual, 4)
  assert.equal(calcularCotaPcd(1001, 0).percentual, 5)
  assert.equal(calcularCotaPcd(5000, 0).percentual, 5)
})

test('arredonda a cota para cima, nunca para baixo', () => {
  // 2% de 101 = 2,02. Arredondar para baixo daria 2 e deixaria a empresa
  // irregular achando que está em dia.
  assert.equal(calcularCotaPcd(101, 0).exigido, 3)
  assert.equal(calcularCotaPcd(150, 0).exigido, 3)
  assert.equal(calcularCotaPcd(100, 0).exigido, 2)
})

test('calcula quanto falta e se esta em dia', () => {
  const atrasada = calcularCotaPcd(300, 5) // exige 9
  assert.equal(atrasada.exigido, 9)
  assert.equal(atrasada.faltam, 4)
  assert.equal(atrasada.emDia, false)

  const emDia = calcularCotaPcd(300, 9)
  assert.equal(emDia.faltam, 0)
  assert.equal(emDia.emDia, true)

  const acima = calcularCotaPcd(300, 12)
  assert.equal(acima.faltam, 0)
  assert.equal(acima.emDia, true)
})

test('quadro zerado nao quebra o calculo de PCD', () => {
  const c = calcularCotaPcd(0, 0)

  assert.equal(c.aplicavel, false)
  assert.equal(c.exigido, 0)
})

// ─── Cota de aprendizes ───────────────────────────────────────────────────────

test('faixa de aprendizes vai de 5% a 15% da base', () => {
  const c = calcularCotaAprendiz(200, 0)

  assert.equal(c.minimo, 10)
  assert.equal(c.maximo, 30)
  assert.equal(c.faltam, 10)
  assert.equal(c.emDia, false)
})

test('minimo arredonda para cima e maximo para baixo', () => {
  // 5% de 101 = 5,05 -> 6 exigidos; 15% de 101 = 15,15 -> teto de 15.
  const c = calcularCotaAprendiz(101, 0)

  assert.equal(c.minimo, 6)
  assert.equal(c.maximo, 15)
})

test('acima do teto legal tambem e irregular', () => {
  const c = calcularCotaAprendiz(100, 20) // teto é 15

  assert.equal(c.acimaDoTeto, true)
  assert.equal(c.emDia, false)
  assert.equal(c.faltam, 0, 'não falta ninguém — sobra')
})

test('dentro da faixa esta em dia', () => {
  const c = calcularCotaAprendiz(100, 10)

  assert.equal(c.emDia, true)
  assert.equal(c.acimaDoTeto, false)
})

// ─── Vigência de contrato ─────────────────────────────────────────────────────

test('contrato sem data de termino nao e tratado como vencido', () => {
  const v = calcularVigencia(null, HOJE)

  assert.equal(v.situacao, 'sem_contrato')
  assert.equal(v.diasRestantes, null)
})

test('classifica vigente, vencendo e vencido', () => {
  assert.equal(calcularVigencia(new Date('2026-12-31'), HOJE).situacao, 'vigente')
  assert.equal(calcularVigencia(new Date('2026-10-10'), HOJE).situacao, 'vencendo')
  assert.equal(calcularVigencia(new Date('2026-09-01'), HOJE).situacao, 'vencido')
})

test('a janela de alerta tem a borda no dia exato', () => {
  const limite = new Date(HOJE)
  limite.setUTCDate(limite.getUTCDate() + DIAS_ALERTA_VENCIMENTO)

  const umDiaDepois = new Date(limite)
  umDiaDepois.setUTCDate(umDiaDepois.getUTCDate() + 1)

  assert.equal(calcularVigencia(limite, HOJE).situacao, 'vencendo')
  assert.equal(calcularVigencia(umDiaDepois, HOJE).situacao, 'vigente')
})

test('contrato que vence hoje ainda esta vencendo, nao vencido', () => {
  const v = calcularVigencia(new Date('2026-09-21'), HOJE)

  assert.equal(v.situacao, 'vencendo')
  assert.equal(v.diasRestantes, 0)
})

test('dias restantes fica negativo depois do vencimento', () => {
  const v = calcularVigencia(new Date('2026-09-11'), HOJE)

  assert.equal(v.situacao, 'vencido')
  assert.equal(v.diasRestantes, -10)
})

test('data invalida e tratada como ausente', () => {
  const v = calcularVigencia(new Date('nao-e-data'), HOJE)

  assert.equal(v.situacao, 'sem_contrato')
})

// ─── Base da cota de PCD ──────────────────────────────────────────────────────

test('aprendizes e estagiarios ficam fora da base das cotas', () => {
  // Cargos como vieram no QLP da Pau Brasil em 2026-09-28.
  for (const cargo of [
    'JOVEM APRENDIZ',
    'JOVEM APRENDIZ LOGISTICA',
    'JOVEM APRENDIZ (DR FORMIGA)',
    'JOVEM APRENDIZ TI',
    'ESTAGIARIA DISTRIBUIÇÃO',
    'ESTAGIARIO FATURAMENTO',
    'Estagiário de RH',
  ]) {
    assert.equal(ehAprendizOuEstagiario(cargo), true, cargo)
  }
})

test('empregados e cargo vazio continuam na base das cotas', () => {
  for (const cargo of [
    'AJUDANTE DISTRIBUIÇÃO',
    'MOTORISTA CARRETA PUXADA',
    'ANALISTA DE VENDAS/APR',
    'GERENTE DE GENTE & GESTÃO',
    null,
    '',
  ]) {
    assert.equal(ehAprendizOuEstagiario(cargo), false, String(cargo))
  }
})

test('tirar aprendizes e estagiarios muda a faixa: 209 no QLP, 198 na base, cota 4', () => {
  // O caso que o PO reportou: a tela dizia 7 porque contava os 11.
  assert.equal(calcularCotaPcd(209, 5).exigido, 7)

  const c = calcularCotaPcd(209 - 11, 5)
  assert.equal(c.percentual, 2)
  assert.equal(c.exigido, 4)
  assert.equal(c.emDia, true)
})

test('cota de aprendiz tambem sai da base sem aprendizes e estagiarios: 209 no QLP, 198 na base', () => {
  // Com os proprios aprendizes na base, o piso subia de 10 para 11.
  assert.equal(calcularCotaAprendiz(209, 0).minimo, 11)

  const c = calcularCotaAprendiz(209 - 11, 0)
  assert.equal(c.minimo, 10)
  assert.equal(c.maximo, 29)
})
