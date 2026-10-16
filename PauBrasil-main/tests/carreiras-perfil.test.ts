import assert from 'node:assert/strict'
import test from 'node:test'

import {
  FAIXAS_ETARIAS,
  calcularIdade,
  idadeAceita,
  intervaloDeNascimento,
  lerDataNascimento,
  rotuloEscolaridade,
  rotuloGenero,
} from '../src/lib/carreiras-perfil'

const HOJE = new Date('2026-09-30T15:00:00Z')

// ─── Idade ────────────────────────────────────────────────────────────────────

test('idade so vira no dia do aniversario', () => {
  assert.equal(calcularIdade(lerDataNascimento('2000-09-30')!, HOJE), 26)
  assert.equal(calcularIdade(lerDataNascimento('2000-10-01')!, HOJE), 25)
  assert.equal(calcularIdade(lerDataNascimento('2000-09-29')!, HOJE), 26)
})

test('idade nao escorrega um dia por causa do fuso do Brasil', () => {
  // 30/09 as 23h em Brasilia ja e 01/10 em UTC; o aniversario de 01/10 ainda
  // nao chegou para quem esta no Brasil, mas a conta e em data pura UTC e o
  // "hoje" do servidor tambem. O que nao pode acontecer e a data de nascimento
  // gravada a meia-noite UTC ser lida como 30/09 no fuso local.
  const nasc = lerDataNascimento('2000-10-01')!
  assert.equal(nasc.toISOString(), '2000-10-01T00:00:00.000Z')
  assert.equal(calcularIdade(nasc, new Date('2026-09-30T12:00:00Z')), 25)
})

test('data de nascimento recusa formato errado e data inexistente', () => {
  assert.equal(lerDataNascimento('30/09/2000'), null)
  assert.equal(lerDataNascimento('2000-02-31'), null)
  assert.equal(lerDataNascimento('2000-13-01'), null)
  assert.equal(lerDataNascimento(''), null)
  assert.ok(lerDataNascimento('2000-02-29')) // bissexto existe
  assert.equal(lerDataNascimento('2001-02-29'), null)
})

test('aceita de 14 a 90 anos', () => {
  assert.equal(idadeAceita(lerDataNascimento('2012-09-30')!, HOJE), true) // 14 hoje
  assert.equal(idadeAceita(lerDataNascimento('2012-10-01')!, HOJE), false) // 13
  assert.equal(idadeAceita(lerDataNascimento('1936-10-01')!, HOJE), true) // 89
  assert.equal(idadeAceita(lerDataNascimento('1900-01-01')!, HOJE), false)
  assert.equal(idadeAceita(lerDataNascimento('2026-01-01')!, HOJE), false)
})

// ─── Faixa etaria ─────────────────────────────────────────────────────────────

test('faixa etaria vira intervalo de nascimento com as bordas certas', () => {
  const faixa = intervaloDeNascimento('18_24', HOJE)!
  const dentro = (iso: string) => {
    const d = lerDataNascimento(iso)!
    return d > faixa.gt && d <= faixa.lte
  }

  assert.equal(dentro('2008-09-30'), true) // faz 18 hoje
  assert.equal(dentro('2008-10-01'), false) // ainda 17
  assert.equal(dentro('2001-10-01'), true) // 24, faz 25 amanha
  assert.equal(dentro('2001-09-30'), false) // fez 25 hoje
})

test('as faixas cobrem toda idade aceita, sem buraco e sem sobreposicao', () => {
  for (let idade = 14; idade <= 90; idade++) {
    const nasc = new Date(Date.UTC(2026 - idade, 2, 1)) // aniversario ja passou
    assert.equal(calcularIdade(nasc, HOJE), idade)
    const casam = FAIXAS_ETARIAS.filter((f) => {
      const i = intervaloDeNascimento(f.valor, HOJE)!
      return nasc > i.gt && nasc <= i.lte
    })
    assert.equal(casam.length, 1, `idade ${idade} caiu em ${casam.length} faixas`)
  }
})

test('faixa desconhecida nao vira filtro', () => {
  assert.equal(intervaloDeNascimento('99_100', HOJE), null)
})

// ─── Rotulos ──────────────────────────────────────────────────────────────────

test('rotulos para exibir, e null para valor desconhecido ou ausente', () => {
  assert.equal(rotuloGenero('NAO_INFORMADO'), 'Prefiro não informar')
  assert.equal(rotuloEscolaridade('MEDIO_COMPLETO'), 'Médio completo')
  assert.equal(rotuloGenero(null), null)
  assert.equal(rotuloEscolaridade('DOUTORADO'), null)
})
