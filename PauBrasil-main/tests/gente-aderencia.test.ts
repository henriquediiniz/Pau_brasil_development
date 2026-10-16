import assert from 'node:assert/strict'
import test from 'node:test'

import {
  analisarAderencia,
  encontrarDescritivo,
  type CargoParaAderencia,
  type VagaParaAderencia,
} from '../src/lib/gente/aderencia'

const CARGO: CargoParaAderencia = {
  cargo: 'Motorista Caminhão Distribuição',
  area: 'Distribuição Urbana',
  formacao: 'Ensino Fundamental Completo',
  exigencias: 'CNH categoria D definitiva',
  experienciaSugerida: 'Seis meses em distribuição urbana',
  competenciasSugeridas: 'Direção defensiva e atendimento ao cliente',
  testes: 'Teste prático de direção',
  precisaAderenciaRaio: true,
}

function vaga(over: Partial<VagaParaAderencia> = {}): VagaParaAderencia {
  return {
    cargo: 'Motorista Caminhão Distribuição',
    area: 'Distribuição Urbana',
    formacao: 'Ensino Fundamental Completo',
    requisitosMinimos:
      'CNH categoria D definitiva, seis meses de experiência em distribuição urbana, direção defensiva e bom atendimento ao cliente. Teste prático de direção. Residência próxima ao raio da unidade.',
    ...over,
  }
}

test('sem descritivo o resultado e "nao da para avaliar", nao 0% de aderencia', () => {
  const r = analisarAderencia(vaga(), null)

  assert.equal(r.temDescritivo, false)
  assert.equal(r.itensAvaliados, 0)
  assert.deepEqual(r.divergencias, [])
})

test('vaga alinhada ao descritivo nao gera divergencia', () => {
  const r = analisarAderencia(vaga(), CARGO)

  assert.deepEqual(r.divergencias, [], JSON.stringify(r.divergencias))
  assert.equal(r.pontuacao, 100)
  assert.ok(r.itensAvaliados > 0)
})

test('area divergente e apontada com o esperado e o encontrado', () => {
  const r = analisarAderencia(vaga({ area: 'Vendas' }), CARGO)

  const d = r.divergencias.find((x) => x.campo === 'area')
  assert.ok(d, 'deveria apontar a área')
  assert.equal(d!.esperado, 'Distribuição Urbana')
  assert.equal(d!.encontrado, 'Vendas')
  assert.equal(d!.severidade, 'media')
})

test('formacao ausente na vaga e divergencia alta', () => {
  const r = analisarAderencia(vaga({ formacao: null }), CARGO)

  const d = r.divergencias.find((x) => x.campo === 'formacao')
  assert.ok(d)
  assert.equal(d!.severidade, 'alta')
  assert.equal(r.pontuacao, 80, 'desconta 20 por divergência alta')
})

test('formacao diferente do padrao tambem e apontada', () => {
  const r = analisarAderencia(vaga({ formacao: 'Ensino Superior em Engenharia' }), CARGO)

  assert.ok(r.divergencias.some((d) => d.campo === 'formacao'))
})

test('vaga sem nenhum requisito acumula divergencias', () => {
  const r = analisarAderencia(
    vaga({ requisitosMinimos: null, informacoesComplementares: null }),
    CARGO
  )

  const campos = r.divergencias.map((d) => d.campo)
  assert.ok(campos.includes('exigencias'))
  assert.ok(campos.includes('experienciaSugerida'))
  assert.ok(campos.includes('testes'))
  assert.ok(campos.includes('aderenciaRaio'))
  assert.ok(r.pontuacao < 50, `pontuação deveria ser baixa, foi ${r.pontuacao}`)
})

test('cobertura parcial vira aviso; cobertura minima vira lacuna seria', () => {
  // "CNH categoria D" cobre 2 de 3 termos do padrão ("cnh categoria definitiva"):
  // falta dizer que a CNH é definitiva.
  const parcial = analisarAderencia(
    vaga({
      requisitosMinimos:
        'CNH categoria D, seis meses de experiência em distribuição urbana, direção defensiva e atendimento ao cliente. Teste prático de direção. Residência próxima.',
    }),
    CARGO
  )
  const avisoExigencias = parcial.divergencias.find((d) => d.campo === 'exigencias')
  assert.ok(avisoExigencias, 'cobertura parcial deveria gerar aviso')
  assert.equal(avisoExigencias!.severidade, 'baixa')

  // Só "CNH" cobre 1 de 3 — a vaga não diz categoria nem se é definitiva.
  const minima = analisarAderencia(
    vaga({
      requisitosMinimos:
        'CNH e experiência em distribuição urbana, direção defensiva, atendimento ao cliente, teste prático de direção, residência próxima',
    }),
    CARGO
  )
  const lacuna = minima.divergencias.find((d) => d.campo === 'exigencias')
  assert.ok(lacuna)
  assert.equal(lacuna!.severidade, 'alta')
})

test('exigencia de raio e cobrada quando a vaga nao menciona residencia', () => {
  const r = analisarAderencia(
    vaga({
      requisitosMinimos:
        'CNH categoria D definitiva, seis meses de experiência em distribuição urbana, direção defensiva e atendimento ao cliente. Teste prático de direção.',
    }),
    CARGO
  )

  assert.ok(r.divergencias.some((d) => d.campo === 'aderenciaRaio'))
})

test('nao cobra raio quando o descritivo nao exige', () => {
  const r = analisarAderencia(
    vaga({ requisitosMinimos: 'CNH categoria D definitiva, seis meses distribuição urbana, direção defensiva, atendimento ao cliente, teste prático de direção' }),
    { ...CARGO, precisaAderenciaRaio: false }
  )

  assert.equal(r.divergencias.some((d) => d.campo === 'aderenciaRaio'), false)
})

test('pontuacao nunca fica negativa', () => {
  const r = analisarAderencia(
    { cargo: 'Motorista', area: null, formacao: null, requisitosMinimos: null },
    CARGO
  )

  assert.ok(r.pontuacao >= 0)
})

test('descritivo vazio nao inventa divergencia', () => {
  const r = analisarAderencia(vaga(), { cargo: 'Motorista', area: 'Distribuição Urbana' })

  // Só a área é comparável; o resto do descritivo está vazio.
  assert.equal(r.itensAvaliados, 1)
  assert.deepEqual(r.divergencias, [])
})

// ─── Casamento do descritivo ──────────────────────────────────────────────────

test('encontra o descritivo pelo nome do cargo, ignorando acento e caixa', () => {
  const cargos = [
    { cargo: 'MOTORISTA CAMINHÃO DISTRIBUIÇÃO', area: 'Distribuição Urbana' },
    { cargo: 'Vendedor', area: 'Vendas' },
  ]

  const achado = encontrarDescritivo({ cargo: 'Motorista Caminhao Distribuicao' }, cargos)
  assert.equal(achado?.area, 'Distribuição Urbana')
})

test('quando ha dois descritivos do mesmo cargo, a area desempata', () => {
  const cargos = [
    { cargo: 'Auxiliar', area: 'Vendas' },
    { cargo: 'Auxiliar', area: 'Armazém' },
  ]

  assert.equal(encontrarDescritivo({ cargo: 'Auxiliar', area: 'Armazém' }, cargos)?.area, 'Armazém')
  assert.equal(encontrarDescritivo({ cargo: 'Auxiliar', area: 'Vendas' }, cargos)?.area, 'Vendas')
  // Sem área na vaga, devolve o primeiro em vez de nada.
  assert.ok(encontrarDescritivo({ cargo: 'Auxiliar' }, cargos))
})

test('cargo sem descritivo devolve null', () => {
  assert.equal(encontrarDescritivo({ cargo: 'Astronauta' }, [{ cargo: 'Vendedor', area: 'Vendas' }]), null)
})

// ─── Vínculo explícito com o descritivo ───────────────────────────────────────

test('cargoId ganha do nome ao achar o descritivo', () => {
  /*
    A vaga aberta a partir do descritivo guarda `cargoId`. A partir daí não há
    o que adivinhar — e renomear o descritivo depois não desliga a conferência,
    que era o que acontecia quando tudo dependia do nome digitado.
  */
  const cargos = [
    { id: 'certo', cargo: 'Nome Que Mudou Depois', area: 'Logística' },
    { id: 'outro', cargo: 'Motorista', area: 'Logística' },
  ]

  const achado = encontrarDescritivo({ cargo: 'Motorista', cargoId: 'certo' }, cargos)
  assert.equal(achado!.id, 'certo', 'seguiu o vínculo, não o nome')
})

test('sem cargoId, continua achando pelo nome', () => {
  const cargos = [{ id: 'a', cargo: 'Motorista', area: 'Logística' }]

  assert.equal(encontrarDescritivo({ cargo: 'motorista' }, cargos)!.id, 'a')
  assert.equal(encontrarDescritivo({ cargo: 'Motorista', cargoId: null }, cargos)!.id, 'a')
})

test('cargoId que nao existe mais cai de volta no nome', () => {
  // Descritivo excluído não pode deixar a vaga órfã de conferência.
  const cargos = [{ id: 'a', cargo: 'Motorista', area: 'Logística' }]

  const achado = encontrarDescritivo({ cargo: 'Motorista', cargoId: 'id-apagado' }, cargos)
  assert.equal(achado!.id, 'a')
})
