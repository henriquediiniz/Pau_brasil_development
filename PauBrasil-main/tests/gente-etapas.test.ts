import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ETAPAS_PADRAO,
  converterResultado,
  definicaoEtapa,
  ordenarEtapas,
  resumirEtapas,
  type EtapaRegistrada,
} from '../src/lib/gente/etapas'

const TODAS = ETAPAS_PADRAO.map((e) => e.chave)

function etapas(mapa: Record<string, 'OK' | 'NAO' | 'NA'>): EtapaRegistrada[] {
  return Object.entries(mapa).map(([chave, resultado]) => ({ chave, resultado }))
}

test('candidato sem nenhuma etapa registrada tem tudo pendente', () => {
  const r = resumirEtapas([])

  assert.equal(r.aplicaveis, TODAS.length)
  assert.equal(r.pendentes, TODAS.length)
  assert.equal(r.aprovadas, 0)
  assert.equal(r.percentual, 0)
  assert.equal(r.bloqueada, false)
  assert.equal(r.concluida, false)
  assert.equal(r.proxima?.chave, 'entrevista_gg')
})

test('etapas marcadas como NA saem da conta', () => {
  // Cargo que não dirige: os dois testes de direção não se aplicam.
  const r = resumirEtapas(
    etapas({
      entrevista_gg: 'OK',
      aprovacao_gestor: 'OK',
      teste_pratico: 'OK',
      teste_direcao: 'NA',
      direcao_teorico: 'NA',
    })
  )

  assert.equal(r.aplicaveis, 3)
  assert.equal(r.aprovadas, 3)
  assert.equal(r.percentual, 100)
  assert.equal(r.concluida, true)
  assert.equal(r.proxima, null)
})

test('uma reprovacao bloqueia o processo mesmo com etapa pendente', () => {
  const r = resumirEtapas(etapas({ entrevista_gg: 'OK', aprovacao_gestor: 'NAO' }))

  assert.equal(r.reprovadas, 1)
  assert.equal(r.bloqueada, true)
  assert.equal(r.concluida, false)
  assert.ok(r.pendentes > 0, 'ainda restam etapas sem resultado')
})

test('proxima etapa respeita a ordem do catalogo, nao a ordem de registro', () => {
  const r = resumirEtapas(etapas({ teste_pratico: 'OK', entrevista_gg: 'OK' }))

  assert.equal(r.proxima?.chave, 'aprovacao_gestor')
})

test('percentual e calculado sobre as aplicaveis', () => {
  const r = resumirEtapas(
    etapas({ entrevista_gg: 'OK', aprovacao_gestor: 'OK', teste_direcao: 'NA', direcao_teorico: 'NA' })
  )

  // 2 aprovadas de 3 aplicáveis (teste_pratico segue pendente).
  assert.equal(r.aplicaveis, 3)
  assert.equal(r.percentual, 67)
})

test('etapa fora do catalogo e contabilizada em vez de ignorada', () => {
  const r = resumirEtapas([
    ...etapas({ entrevista_gg: 'OK' }),
    { chave: 'dinamica_de_grupo', resultado: 'OK' },
  ])

  assert.equal(r.aplicaveis, TODAS.length + 1)
  assert.equal(r.aprovadas, 2)
})

test('todas NA resulta em zero aplicaveis, sem dividir por zero', () => {
  const r = resumirEtapas(etapas(Object.fromEntries(TODAS.map((c) => [c, 'NA' as const]))))

  assert.equal(r.aplicaveis, 0)
  assert.equal(r.percentual, 0)
  assert.equal(r.concluida, false)
  assert.equal(r.proxima, null)
})

test('definicaoEtapa devolve fallback legivel para chave desconhecida', () => {
  assert.equal(definicaoEtapa('entrevista_gg').label, 'Entrevista G&G')
  assert.equal(definicaoEtapa('coisa_nova').label, 'coisa_nova')
  assert.equal(definicaoEtapa('coisa_nova').ordem, 99)
})

test('ordenarEtapas segue o catalogo e joga desconhecidas para o fim', () => {
  const ordenadas = ordenarEtapas([
    { chave: 'zzz_desconhecida' },
    { chave: 'teste_pratico' },
    { chave: 'entrevista_gg' },
  ])

  assert.deepEqual(
    ordenadas.map((e) => e.chave),
    ['entrevista_gg', 'teste_pratico', 'zzz_desconhecida']
  )
})

test('converterResultado aceita o que o RH digita na planilha', () => {
  assert.equal(converterResultado('OK'), 'OK')
  assert.equal(converterResultado('Sim'), 'OK')
  assert.equal(converterResultado('APROVADO'), 'OK')
  assert.equal(converterResultado('NÃO'), 'NAO')
  assert.equal(converterResultado('nao'), 'NAO')
  assert.equal(converterResultado('N/A'), 'NA')
  assert.equal(converterResultado('Não se aplica'), 'NA')
  assert.equal(converterResultado(''), null)
  assert.equal(converterResultado(null), null)
  assert.equal(converterResultado('talvez'), 'invalida')
})
