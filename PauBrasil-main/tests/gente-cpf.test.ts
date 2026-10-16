import assert from 'node:assert/strict'
import test from 'node:test'

import { cpfValido, formatarCpf, normalizarCpf } from '../src/lib/gente/cpf'

test('normalizarCpf guarda só os dígitos', () => {
  // A planilha do RH traz os três formatos.
  assert.equal(normalizarCpf('123.456.789-09'), '12345678909')
  assert.equal(normalizarCpf('12345678909'), '12345678909')
  assert.equal(normalizarCpf(' 123 456 789 09 '), '12345678909')
})

test('normalizarCpf devolve null quando não sobra dígito', () => {
  for (const vazio of ['', '   ', '---', null, undefined]) {
    assert.equal(normalizarCpf(vazio), null, `${JSON.stringify(vazio)} deveria virar null`)
  }
})

test('cpfValido aceita CPF com dígitos verificadores corretos', () => {
  assert.equal(cpfValido('11144477735'), true)
  assert.equal(cpfValido('12345678909'), true)
})

test('cpfValido recusa dígito verificador errado', () => {
  assert.equal(cpfValido('11144477734'), false)
  assert.equal(cpfValido('12345678900'), false)
})

test('cpfValido recusa os 11 dígitos repetidos', () => {
  // Passam no cálculo, mas não são CPF de ninguém — são preenchimento de teste.
  for (let d = 0; d <= 9; d++) {
    assert.equal(cpfValido(String(d).repeat(11)), false, `${d} repetido passou`)
  }
})

test('cpfValido recusa o que não tem 11 dígitos', () => {
  assert.equal(cpfValido('1234567890'), false)
  assert.equal(cpfValido('123456789099'), false)
  assert.equal(cpfValido(''), false)
  assert.equal(cpfValido('123.456.789-09'), false, 'espera dígitos, não o formatado')
})

test('formatarCpf devolve a pontuação de sempre', () => {
  assert.equal(formatarCpf('12345678909'), '123.456.789-09')
})

test('formatarCpf não inventa formato para o que não é CPF', () => {
  assert.equal(formatarCpf('123'), '123')
  assert.equal(formatarCpf(null), null)
  assert.equal(formatarCpf(''), null)
})
