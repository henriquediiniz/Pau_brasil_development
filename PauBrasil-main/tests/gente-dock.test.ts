import assert from 'node:assert/strict'
import test from 'node:test'

import { itemAtivo } from '../src/app/gente/_components/DockGente'

test('a visao geral so acende na propria pagina', () => {
  assert.equal(itemAtivo('/gente'), '/gente')
  assert.equal(itemAtivo('/gente/vagas'), '/gente/vagas')
})

test('subpaginas acendem o item do modulo', () => {
  assert.equal(itemAtivo('/gente/vagas/importar'), '/gente/vagas')
  assert.equal(itemAtivo('/gente/vagas/nova'), '/gente/vagas')
  assert.equal(itemAtivo('/gente/vagas/abc123/editar'), '/gente/vagas')
  assert.equal(itemAtivo('/gente/sucessao/importar'), '/gente/sucessao')
})

test('candidatos internos nao acende junto com candidatos', () => {
  // `/gente/candidatos/internos` começa com `/gente/candidatos`; sem escolher
  // o href mais específico, os dois itens acenderiam ao mesmo tempo.
  assert.equal(itemAtivo('/gente/candidatos'), '/gente/candidatos')
  assert.equal(itemAtivo('/gente/candidatos/internos'), '/gente/candidatos/internos')
  assert.equal(itemAtivo('/gente/candidatos/internos/importar'), '/gente/candidatos/internos')
  assert.equal(itemAtivo('/gente/candidatos/internos/abc/editar'), '/gente/candidatos/internos')
})

test('subpaginas de candidatos que nao sao internos acendem candidatos', () => {
  assert.equal(itemAtivo('/gente/candidatos/importar'), '/gente/candidatos')
  assert.equal(itemAtivo('/gente/candidatos/do-banco-de-talentos'), '/gente/candidatos')
})

test('rota de fora do modulo nao acende nada', () => {
  assert.equal(itemAtivo('/talentos'), null)
  assert.equal(itemAtivo('/app/hoje'), null)
})

test('prefixo parecido nao acende por engano', () => {
  // `/gente/vagas-antigas` não é subpágina de `/gente/vagas`.
  assert.equal(itemAtivo('/gente/vagas-antigas'), null)
})
