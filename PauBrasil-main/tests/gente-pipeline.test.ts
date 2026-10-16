import assert from 'node:assert/strict'
import test from 'node:test'

import {
  areaDoCargo,
  montarPipeline,
  nivelDoCargo,
  rotuloProntidao,
  trilhaDoCargo,
  type ItemPipeline,
} from '../src/lib/gente/pipeline'

function item(over: Partial<ItemPipeline> = {}): ItemPipeline {
  return {
    id: Math.random().toString(36).slice(2),
    cargoSucessao: 'GERENTE DE VENDAS',
    areaCargoSucessao: 'VENDAS',
    nomeSucessor: 'FULANO',
    cargoAtualSucessor: 'SUPERVISOR DE VENDAS',
    prontoAgora: false,
    pronto1Ano: false,
    pronto2Anos: false,
    houveMovimentacao: false,
    cicloGente: 'MUITO BOM',
    ativo: true,
    operacao: { nome: 'Pau Brasil Patos' },
    ...over,
  }
}

// ─── Trilha de carreira ───────────────────────────────────────────────────────

test('classifica as trilhas pelo cargo de destino', () => {
  assert.equal(trilhaDoCargo('DIRETOR DE VENDAS'), 'comercial_diretor')
  assert.equal(trilhaDoCargo('GERENTE DE DISTRIBUIÇÃO URBANA'), 'gerentes')
  assert.equal(trilhaDoCargo('COORDENADOR DE ARMAZÉM'), 'coordenadores')
  assert.equal(trilhaDoCargo('SUPERVISOR DE VENDAS'), 'supervisores')
  assert.equal(trilhaDoCargo('ANALISTA DE CONTROLE'), 'analistas')
})

test('a ordem das regras impede que "Gerente Comercial" vire comercial', () => {
  // O cargo tem as duas palavras; o que manda é a hierarquia.
  assert.equal(trilhaDoCargo('GERENTE COMERCIAL'), 'gerentes')
  assert.equal(trilhaDoCargo('DIRETOR COMERCIAL'), 'comercial_diretor')
  assert.equal(trilhaDoCargo('COORDENADOR COMERCIAL'), 'coordenadores')
})

test('cargos operacionais caem em analistas', () => {
  for (const cargo of ['ASSISTENTE DE FROTA', 'AUXILIAR DE CONTROLE', 'MOTORISTA', 'CONFERENTE']) {
    assert.equal(trilhaDoCargo(cargo), 'analistas', cargo)
  }
})

test('sem cargo de sucessao, usa o cargo atual', () => {
  assert.equal(trilhaDoCargo(null, 'GERENTE DE VENDAS'), 'gerentes')
  assert.equal(trilhaDoCargo('', 'SUPERVISOR'), 'supervisores')
})

test('cargo comercial sem hierarquia vai para comercial e diretor', () => {
  assert.equal(trilhaDoCargo('VENDEDOR'), 'comercial_diretor')
  assert.equal(trilhaDoCargo('CONSULTOR'), 'comercial_diretor')
})

test('aceita acento e caixa de qualquer jeito', () => {
  assert.equal(trilhaDoCargo('gerência de vendas'), 'gerentes')
  assert.equal(trilhaDoCargo('Coordenação de Armazém'), 'coordenadores')
})

// ─── Nível e área da matriz ───────────────────────────────────────────────────

test('nivel sai do cargo de sucessao', () => {
  assert.equal(nivelDoCargo('DIRETOR DE VENDAS'), 'diretor')
  assert.equal(nivelDoCargo('GERENTE OPERACIONAL DISTRIBUIÇÃO'), 'gerencia')
  assert.equal(nivelDoCargo('COORDENADOR DE SEGURANÇA'), 'coordenacao')
  assert.equal(nivelDoCargo('SUPERVISORA DE VENDAS'), 'supervisao')
  assert.equal(nivelDoCargo('ANALISTA DE FROTA'), 'analista')
})

test('cargo desconhecido cai em analista, o nivel mais baixo', () => {
  assert.equal(nivelDoCargo('ENCARREGADO'), 'analista')
  assert.equal(nivelDoCargo(null), 'analista')
})

test('area sai da area declarada, com o cargo como desempate', () => {
  assert.equal(areaDoCargo('VENDAS'), 'vendas')
  assert.equal(areaDoCargo('FINANCEIRO'), 'financeiro')
  assert.equal(areaDoCargo('GENTE'), 'gente')
  assert.equal(areaDoCargo('DISTRIBUIÇÃO URBANA'), 'distribuicao')
  assert.equal(areaDoCargo('APOIO LOGÍSTICO'), 'armazem')
  assert.equal(areaDoCargo('FROTA'), 'frota')
  assert.equal(areaDoCargo('PUXADA'), 'puxada')
})

test('quando a area nao diz, o cargo decide', () => {
  assert.equal(areaDoCargo(null, 'ANALISTA DE FROTA'), 'frota')
  assert.equal(areaDoCargo('', 'ANALISTA FINANCEIRO'), 'financeiro')
  assert.equal(areaDoCargo('', 'COORDENADOR DE SEGURANÇA DO TRABALHO'), 'gente')
})

test('area desconhecida vai para "outras", nao e escondida em armazem', () => {
  // O app do RH jogava o que não casava em Armazém, misturando gente de outras
  // áreas naquela coluna sem ninguém notar.
  assert.equal(areaDoCargo('MARKETING', 'ANALISTA DE MARKETING'), 'outros')
  assert.equal(areaDoCargo(null, null), 'outros')
})

// ─── Consolidação ─────────────────────────────────────────────────────────────

test('indicadores separam pronto agora de pronto em ate um ano', () => {
  const p = montarPipeline([
    item({ prontoAgora: true, pronto1Ano: true }),
    item({ pronto1Ano: true }),
    item({ pronto2Anos: true }),
  ])

  assert.equal(p.indicadores.prontosAgora, 1)
  assert.equal(p.indicadores.prontosAte1Ano, 2, 'inclui quem já está pronto')
  assert.equal(p.indicadores.emPreparacao, 2)
})

test('desligado nao conta como pronto nem como em preparacao', () => {
  const p = montarPipeline([
    item({ prontoAgora: true }),
    item({ prontoAgora: true, ativo: false }),
    item({ ativo: false }),
  ])

  assert.equal(p.indicadores.prontosAgora, 1)
  assert.equal(p.indicadores.emPreparacao, 0)
  assert.equal(p.indicadores.desligados, 2)
  assert.equal(p.indicadores.totalMapeamentos, 3)
})

test('cargos sem sucessor pronto conta cargos distintos, nao pessoas', () => {
  const p = montarPipeline([
    item({ cargoSucessao: 'GERENTE DE VENDAS' }),
    item({ cargoSucessao: 'Gerente de Vendas' }), // mesma posição, outra grafia
    item({ cargoSucessao: 'COORDENADOR DE ARMAZÉM' }),
  ])

  assert.equal(p.indicadores.emPreparacao, 3, 'três pessoas em preparação')
  assert.equal(p.indicadores.cargosSemSucessorPronto, 2, 'para dois cargos')
})

test('promovidos conta quem teve movimentacao, inclusive desligado depois', () => {
  const p = montarPipeline([
    item({ houveMovimentacao: true }),
    item({ houveMovimentacao: true, ativo: false }),
    item({ houveMovimentacao: null }),
  ])

  assert.equal(p.indicadores.promovidos, 2)
})

test('resumo por trilha separa no projeto, promovidos, disponiveis e desligados', () => {
  const p = montarPipeline([
    item({ cargoSucessao: 'GERENTE DE VENDAS', prontoAgora: true, houveMovimentacao: true }),
    item({ cargoSucessao: 'GERENTE DE VENDAS' }),
    item({ cargoSucessao: 'GERENTE DE VENDAS', ativo: false }),
    item({ cargoSucessao: 'ANALISTA DE CONTROLE', prontoAgora: true }),
  ])

  const gerentes = p.trilhas.find((t) => t.trilha === 'gerentes')!
  assert.equal(gerentes.noProjeto, 2, 'o desligado não conta no projeto')
  assert.equal(gerentes.promovidos, 1)
  assert.equal(gerentes.disponiveis, 1)
  assert.equal(gerentes.desligados, 1)

  const analistas = p.trilhas.find((t) => t.trilha === 'analistas')!
  assert.equal(analistas.noProjeto, 1)
})

test('as cinco trilhas aparecem sempre, mesmo zeradas', () => {
  const p = montarPipeline([item()])

  assert.equal(p.trilhas.length, 5)
  assert.ok(p.trilhas.every((t) => typeof t.noProjeto === 'number'))
})

test('a matriz posiciona pelo nivel e pela area do cargo de sucessao', () => {
  const p = montarPipeline([
    item({ cargoSucessao: 'DIRETOR DE VENDAS', areaCargoSucessao: 'VENDAS' }),
    item({ cargoSucessao: 'GERENTE DE DISTRIBUIÇÃO', areaCargoSucessao: 'DISTRIBUIÇÃO URBANA' }),
  ])

  assert.equal(p.matriz.diretor.vendas.length, 1)
  assert.equal(p.matriz.gerencia.distribuicao.length, 1)
  assert.equal(p.matriz.gerencia.vendas.length, 0)
})

test('dentro da celula, pronto vem antes e desligado por ultimo', () => {
  const p = montarPipeline([
    item({ nomeSucessor: 'ZÉ', ativo: false }),
    item({ nomeSucessor: 'BIA' }),
    item({ nomeSucessor: 'ANA', prontoAgora: true }),
  ])

  assert.deepEqual(
    p.matriz.gerencia.vendas.map((i) => i.nomeSucessor),
    ['ANA', 'BIA', 'ZÉ']
  )
})

test('so as areas e niveis com gente entram na tela', () => {
  const p = montarPipeline([item({ cargoSucessao: 'GERENTE DE VENDAS', areaCargoSucessao: 'VENDAS' })])

  assert.deepEqual(p.areasComConteudo, ['vendas'])
  assert.deepEqual(p.niveisComConteudo, ['gerencia'])
})

test('pipeline vazio nao quebra', () => {
  const p = montarPipeline([])

  assert.equal(p.indicadores.totalMapeamentos, 0)
  assert.equal(p.indicadores.cargosSemSucessorPronto, 0)
  assert.deepEqual(p.areasComConteudo, [])
  assert.equal(p.trilhas.length, 5)
})

// ─── Rótulo de prontidão ──────────────────────────────────────────────────────

test('rotulo de prontidao mostra o prazo mais proximo', () => {
  assert.equal(rotuloProntidao({ prontoAgora: true, pronto1Ano: false, pronto2Anos: false }), 'Pronto já')
  assert.equal(rotuloProntidao({ prontoAgora: false, pronto1Ano: true, pronto2Anos: true }), '1 ano')
  assert.equal(rotuloProntidao({ prontoAgora: false, pronto1Ano: false, pronto2Anos: true }), '2 anos')
  assert.equal(
    rotuloProntidao({ prontoAgora: false, pronto1Ano: false, pronto2Anos: false }),
    'Sem horizonte'
  )
})
