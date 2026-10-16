import assert from 'node:assert/strict'
import test from 'node:test'

import { MODELOS, TIPOS_MODELO, ehTipoModelo, linhaExemplo } from '../src/lib/gente/modelos'
import { analisarPlanilhaVagas, normalizar, type OperacaoRef } from '../src/lib/gente/vaga-importador'
import { analisarPlanilhaCandidatos } from '../src/lib/gente/candidato-importador'
import {
  analisarPlanilhaDesligamentos,
  analisarPlanilhaQuadro,
} from '../src/lib/gente/quadro-importador'
import { analisarPlanilhaAprendizes, analisarPlanilhaPcd } from '../src/lib/gente/pcd-importador'
import {
  analisarPlanilhaInternos,
  analisarPlanilhaSucessao,
} from '../src/lib/gente/sucessao'
import { analisarPlanilhaCargos } from '../src/lib/gente/cargo-importador'

const OPERACOES: OperacaoRef[] = [
  { id: 'op-patos', nome: 'Pau Brasil Patos', nomeAbrev: 'Patos' },
]

/**
 * Este é o teste que dá sentido ao arquivo de modelos: ele pega a linha de
 * exemplo de cada planilha-modelo e passa pelo importador de verdade. Se um
 * cabeçalho do modelo deixar de ser reconhecido, quebra aqui — e não na mão
 * do RH, depois de baixar o modelo e ver tudo recusado.
 */

test('o modelo de vagas e aceito pelo importador de vagas', () => {
  const rel = analisarPlanilhaVagas(
    [{ linha: 2, dados: linhaExemplo(MODELOS.vagas) }],
    OPERACOES
  )

  assert.deepEqual(rel.erros, [], 'a linha de exemplo não pode gerar erro')
  assert.equal(rel.validas.length, 1)

  // Os campos-chave precisam ter sido realmente lidos, não só "não falhado".
  const v = rel.validas[0]
  assert.equal(v.operacaoId, 'op-patos')
  assert.equal(v.cargo, 'Motorista Caminhão Distribuição')
  assert.equal(v.status, 'FECHADA')
  assert.equal(v.departamento, 'DPO')
  assert.equal(v.area, 'Distribuição Urbana')
  assert.equal(v.salario, 2500)
  assert.equal(v.codigo, 'V-001')
  assert.equal(v.quantidadeVagas, 1)
  assert.equal(v.frontline, '2')
  assert.equal(v.nomeContratado, 'Bruno da Silva Nunes')
  assert.equal(v.responsavelVaga, 'Cinthya Alves')
  assert.equal(v.solicitanteVaga, 'Marcos Augusto')
  assert.ok(v.dataAbertura instanceof Date)
  assert.ok(v.dataContratacao instanceof Date)
  assert.ok(v.dataPrevistaFechamento instanceof Date)
  assert.ok(v.requisitosMinimos, 'requisitos mínimos foram lidos')
  assert.ok(v.motivoSolicitacao, 'motivo foi lido')
  assert.ok(v.andamentoProcesso, 'andamento foi lido')
})

test('o modelo de candidatos e aceito pelo importador de candidatos', () => {
  const rel = analisarPlanilhaCandidatos(
    [{ linha: 2, dados: linhaExemplo(MODELOS.candidatos) }],
    OPERACOES
  )

  assert.deepEqual(rel.erros, [])
  assert.equal(rel.validos.length, 1)

  const c = rel.validos[0]
  assert.equal(c.operacaoId, 'op-patos')
  assert.equal(c.nome, 'Arthur Silva')
  assert.equal(c.cargo, 'Motorista')
  assert.equal(c.telefone, '83999990000')
  assert.equal(c.email, 'arthur@exemplo.com')
  assert.equal(c.situacao, 'EM_STAND_BY')
  assert.equal(c.setor, 'DPO')
  assert.equal(c.mesProcesso, 'Fevereiro')
  assert.equal(c.origemCurriculo, 'WHATSAPP')
  assert.equal(c.escolaridade, 'Ensino Médio Completo')
  assert.equal(c.residencia, 'Patos - PB')

  // As cinco etapas do catálogo precisam ter sido reconhecidas.
  assert.deepEqual(c.etapas, [
    { chave: 'entrevista_gg', resultado: 'OK' },
    { chave: 'aprovacao_gestor', resultado: 'OK' },
    { chave: 'teste_pratico', resultado: 'OK' },
    { chave: 'teste_direcao', resultado: 'NA' },
    { chave: 'direcao_teorico', resultado: 'NA' },
  ])
})

test('o modelo de quadro e aceito pelo importador de QLP', () => {
  const rel = analisarPlanilhaQuadro(
    [{ linha: 2, dados: linhaExemplo(MODELOS.quadro) }],
    OPERACOES
  )

  assert.deepEqual(rel.erros, [])
  assert.equal(rel.validos.length, 1)
  assert.equal(rel.validos[0].nome, 'Maria Souza')
  assert.equal(rel.validos[0].cargo, 'Vendedora')
  assert.equal(rel.validos[0].area, 'Vendas')
})

test('o modelo de desligamentos e aceito pelo importador de desligamentos', () => {
  const rel = analisarPlanilhaDesligamentos(
    [{ linha: 2, dados: linhaExemplo(MODELOS.desligamentos) }],
    OPERACOES,
    new Date('2026-09-21T00:00:00Z')
  )

  assert.deepEqual(rel.erros, [])
  assert.equal(rel.validos.length, 1)

  const d = rel.validos[0]
  assert.equal(d.nome, 'João Lima')
  assert.equal(d.cargo, 'Motorista')
  assert.equal(d.area, 'Distribuição Urbana')
  assert.equal(d.setor, 'DPO')
  assert.equal(d.motivo, 'Pedido de demissão')
  assert.deepEqual(d.dataDesligamento, new Date(Date.UTC(2026, 5, 14)))
})

test('o modelo de PCD e aceito pelo importador de PCD', () => {
  const rel = analisarPlanilhaPcd([{ linha: 2, dados: linhaExemplo(MODELOS.pcd) }], OPERACOES)

  assert.deepEqual(rel.erros, [])
  assert.equal(rel.validos.length, 1)
  assert.equal(rel.validos[0].nome, 'Ana Paula Ferreira')
  assert.equal(rel.validos[0].deficiencia, 'Auditiva')
  assert.ok(rel.validos[0].admissao instanceof Date)
})

test('o modelo de aprendizes e aceito pelo importador de aprendizes', () => {
  const rel = analisarPlanilhaAprendizes(
    [{ linha: 2, dados: linhaExemplo(MODELOS.aprendizes) }],
    OPERACOES
  )

  assert.deepEqual(rel.erros, [])
  assert.equal(rel.validos.length, 1)

  const a = rel.validos[0]
  assert.equal(a.nome, 'Lucas Andrade')
  assert.equal(a.situacao, 'VIGENTE')
  assert.equal(a.fundacao, 'CIEE')
  assert.equal(a.setor, 'SPO')
  assert.equal(a.centroCusto, '401')
  assert.ok(a.terminoContrato instanceof Date, 'término precisa ser lido: alimenta o alerta')
})

test('o modelo de candidatos internos e aceito pelo importador', () => {
  const rel = analisarPlanilhaInternos(
    [{ linha: 2, dados: linhaExemplo(MODELOS.internos) }],
    OPERACOES
  )

  assert.deepEqual(rel.erros, [])
  const i = rel.validos[0]
  assert.equal(i.nome, 'Rafael Nunes')
  assert.equal(i.possuiRequisitos, true)
  assert.equal(i.situacao, 'AGUARDANDO')
  assert.deepEqual(i.futurosCargos, ['Supervisor de Vendas', 'Coordenador Comercial'])
})

test('o modelo de sucessao e aceito pelo importador de sucessao', () => {
  const rel = analisarPlanilhaSucessao(
    [{ linha: 2, dados: linhaExemplo(MODELOS.sucessao) }],
    OPERACOES
  )

  assert.deepEqual(rel.erros, [])
  const s = rel.validos[0]
  assert.equal(s.cargoSucessao, 'GERENTE DE DISTRIBUIÇÃO')
  assert.equal(s.nomeSucessor, 'CARLA MENEZES')
  assert.equal(s.areaCargoSucessao, 'DISTRIBUIÇÃO URBANA')
  assert.equal(s.cargoAtualSucessor, 'SUPERVISORA DE LOGÍSTICA')
  assert.equal(s.prontoAgora, false)
  assert.equal(s.pronto1Ano, true)
  assert.equal(s.houveMovimentacao, false)
  assert.equal(s.ativo, true, 'STATUS=ATIVO')
  assert.equal(s.mesAno, 'ABRIL DE 2025')
  assert.equal(s.cicloGente, 'MUITO BOM')
  assert.ok(s.inicioMapeamento instanceof Date)
  assert.ok(s.habilidadeTecnica, 'habilidade técnica com o cabeçalho longo foi lida')
  assert.ok(s.habilidadeComportamental, 'habilidade comportamental foi lida')
})

test('o modelo de cargos e aceito pelo importador de descritivos', () => {
  const rel = analisarPlanilhaCargos([{ linha: 2, dados: linhaExemplo(MODELOS.cargos) }])

  assert.deepEqual(rel.erros, [], 'a linha de exemplo não pode gerar erro')
  assert.equal(rel.validos.length, 1)

  const c = rel.validos[0]
  assert.equal(c.cargo, 'Analista de Controle')
  assert.equal(c.area, 'Logística')
  assert.equal(c.tipoVaga, 'Demais cargos')
  assert.equal(c.formacao, 'Ensino Superior')
  assert.equal(c.statusCurso, 'Formado')
  assert.equal(c.precisaAderenciaRaio, true)
  assert.ok(c.curso, 'curso foi lido — é coluna própria, não parte de formação')
  assert.ok(c.descricaoAtividades, 'descrição foi lida')
  assert.ok(c.competenciasSugeridas, 'competências foram lidas')
  assert.ok(c.etapasProcesso, 'etapas foram lidas')
  assert.ok(c.testes, 'testes foram lidos')

  // O exemplo é multilinha de propósito: é assim que a planilha do RH escreve.
  assert.ok(c.etapasProcesso!.includes('\n'), 'o exemplo de etapas continua multilinha')
})

test('todo modelo tem a coluna de unidade como obrigatoria e cabecalhos unicos', () => {
  // O rótulo varia entre modelos ("Unidade", "OPERAÇÃO"), então o teste checa
  // o que importa: existe uma coluna que o importador lê como unidade, e ela
  // é obrigatória. Amarrar no texto literal tornaria o teste frágil.
  const rotulosDeUnidade = ['unidade', 'operacao', 'filial']

  // Exceção consciente: o descritivo de cargo é da empresa, não da operação —
  // o padrão de "Analista de Controle" não muda entre Patos e Sumé. Pedir
  // unidade ali seria pedir um dado que não existe no assunto.
  const SEM_UNIDADE: readonly string[] = ['cargos']

  for (const tipo of TIPOS_MODELO) {
    const modelo = MODELOS[tipo]

    const unidade = modelo.colunas.find((c) => rotulosDeUnidade.includes(normalizar(c.titulo)))

    if (SEM_UNIDADE.includes(tipo)) {
      assert.equal(unidade, undefined, `${tipo}: não deve pedir unidade — o escopo é a empresa`)
    } else {
      assert.ok(unidade, `${tipo}: modelo precisa ter a coluna de unidade`)
      assert.equal(unidade!.obrigatoria, true, `${tipo}: a unidade é obrigatória`)
    }

    const titulos = modelo.colunas.map((c) => c.titulo)
    assert.equal(
      new Set(titulos).size,
      titulos.length,
      `${tipo}: há cabeçalho repetido no modelo`
    )

    assert.ok(modelo.nomeArquivo.length > 0, `${tipo}: falta nome de arquivo`)
    assert.ok(modelo.titulo.length > 0, `${tipo}: falta título`)
  }
})

test('valida o tipo vindo da querystring', () => {
  assert.equal(ehTipoModelo('vagas'), true)
  assert.equal(ehTipoModelo('desligamentos'), true)
  assert.equal(ehTipoModelo('folha'), false)
  assert.equal(ehTipoModelo(null), false)
})
