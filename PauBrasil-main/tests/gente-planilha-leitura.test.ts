import assert from 'node:assert/strict'
import test from 'node:test'

import {
  localizarTabela,
  montarLinhas,
  prepararParaEnvio,
  SINONIMOS,
} from '../src/lib/gente/planilha-leitura'
import { analisarPlanilhaSucessao } from '../src/lib/gente/sucessao'
import type { OperacaoRef } from '../src/lib/gente/vaga-importador'

/**
 * A planilha real do RH ("Modelo Pipeline.xlsx") não pode ser versionada — tem
 * nome de colaborador e avaliação de desempenho. O que vai para o teste é uma
 * réplica sintética do **formato** dela: capa, abas extras, cabeçalho fora da
 * primeira linha e colunas vazias à esquerda.
 */

const OPERACOES: OperacaoRef[] = [
  { id: 'op-sousa', nome: 'Pau Brasil Sousa', nomeAbrev: 'Sousa' },
  { id: 'op-patos', nome: 'Pau Brasil Patos', nomeAbrev: 'Patos' },
]

/** Cabeçalhos exatamente como vêm da planilha do ciclo de gente. */
const CABECALHO_RH = [
  null, null, null,
  'CARGO A SUCESSÃO', 'ÁREA DO CARGO A SUCESSÃO', 'NOME SUCESSOR', 'CARGO ATUAL DO SUCESSOR',
  'PRONTO AGORA?', 'PRONTO 1 ANO', 'PRONTO 2 ANOS',
  'HABILIDADE TÉCNICA A POTECIALIZAR OU DESENVOLVER',
  'HABILIDADE COMPORTAMENTAL A POTENCIALIZAR OU DESENVOLVER',
  'PLANO DE DESENVOLVIMENTO', 'ÍNICIO DO MAPEAMENTO', 'STATUS', 'HOUVE MOVIMENTAÇÃO',
  'OBSERVAÇÃO', 'MÊS / ANO', 'CICLO DE GENTE', 'OPERAÇÃO',
]

/**
 * O XLSX cria as datas com **meia-noite local**, não meia-noite UTC.
 * A réplica precisa fazer igual, senão o teste não representa o arquivo real.
 */
const DATA_MAPEAMENTO = new Date(2024, 8, 5)

function linhaRH(over: Partial<Record<number, unknown>> = {}): unknown[] {
  const base: unknown[] = [
    null, null, null,
    'ANALISTA DE CONTROLE', 'APOIO LOGÍSTICO', 'MARIA VITÓRIA', 'AUXILIAR DE CONTROLE',
    'SIM', 'SIM', 'SIM',
    'Power BI', 'Comunicação', 'Plano em andamento',
    DATA_MAPEAMENTO, 'ATIVO', 'SIM',
    'CAPACITAR', 'ABRIL DE 2025', 'PREPARAR', 'SOUSA',
  ]
  for (const [i, v] of Object.entries(over)) base[Number(i)] = v
  return base
}

/** Réplica do arquivo do RH: 4 abas, tabela na terceira, cabeçalho na linha 6. */
function planilhaDoRH() {
  return [
    {
      nome: 'Capa',
      matriz: [
        ['Ciclo de Gente', 'Plano de Sucessão'],
        [],
        ['Como passo essencial para a jornada…'],
      ],
    },
    {
      nome: 'Áreas de interesse - Ficha',
      matriz: [['Pipeline Plano de Sucessão'], [], ['Gerência', 'FULANO DE TAL']],
    },
    {
      nome: 'Plano de Sucessão',
      matriz: [
        [null, null, null, 'Plano de Sucessão'],
        [],
        [null, null, null, 'Pipeline Plano de Sucessão do Grupo'],
        [null, null, null, null, null, null, null, null, null, null, 'Baseado no Mapeamento'],
        CABECALHO_RH,
        linhaRH(),
        linhaRH({ 3: 'ANALISTA DE FROTA', 5: 'FRANCISCO JOSÉ', 14: 'DESLIGADO', 19: 'PATOS' }),
      ],
    },
    { nome: 'RESUMO', matriz: [['RESUMO PIPELINE'], ['Classificação', 'QTD']] },
  ]
}

// ─── Localização da tabela ────────────────────────────────────────────────────

test('acha a tabela na aba certa, mesmo sendo a terceira', () => {
  const tabela = localizarTabela(planilhaDoRH(), 'sucessao')

  assert.ok(tabela, 'deveria localizar a tabela')
  assert.equal(tabela!.aba, 'Plano de Sucessão')
})

test('acha o cabecalho fora da primeira linha', () => {
  const tabela = localizarTabela(planilhaDoRH(), 'sucessao')!

  // Índice 4 = quinta linha da matriz.
  assert.equal(tabela.indiceCabecalho, 4)
  assert.ok(tabela.reconhecidos >= 15, `reconheceu só ${tabela.reconhecidos} colunas`)
})

test('planilha simples, com cabecalho na primeira linha, continua funcionando', () => {
  const tabela = localizarTabela(
    [{ nome: 'Dados', matriz: [['Unidade', 'Nome Sucessor', 'Cargo Sucessão'], ['Patos', 'Ana', 'Gerente']] }],
    'sucessao'
  )

  assert.equal(tabela?.indiceCabecalho, 0)
})

test('arquivo sem tabela reconhecivel devolve null, em vez de chutar', () => {
  const semTabela = localizarTabela(
    [{ nome: 'Capa', matriz: [['Bem-vindo'], ['Instruções de uso']] }],
    'sucessao'
  )

  assert.equal(semTabela, null)
})

test('uma coluna reconhecida so nao basta para afirmar que e a tabela', () => {
  // "Nome" sozinho aparece em muita planilha; não é sinal suficiente.
  const tabela = localizarTabela([{ nome: 'X', matriz: [['Nome', 'Telefone do zelador']] }], 'sucessao')

  assert.equal(tabela, null)
})

test('cada tipo de importacao tem sinonimos proprios', () => {
  assert.ok(SINONIMOS.vagas.includes('data abertura'))
  assert.ok(SINONIMOS.candidatos.includes('entrevistado gg'))
  assert.ok(SINONIMOS.sucessao.includes('cargo a sucessao'))
  assert.ok(SINONIMOS.pcd.includes('deficiencia'))
})

// ─── Montagem das linhas ──────────────────────────────────────────────────────

test('o numero da linha e o da planilha, nao o do array', () => {
  const tabela = localizarTabela(planilhaDoRH(), 'sucessao')!
  const aba = planilhaDoRH().find((a) => a.nome === 'Plano de Sucessão')!

  const linhas = montarLinhas(aba.matriz, tabela.indiceCabecalho, 1)

  // Cabeçalho na linha 5 da planilha, então os dados começam na 6.
  assert.equal(linhas[0].linha, 6)
  assert.equal(linhas[1].linha, 7)
})

test('a linha da planilha considera o deslocamento do inicio da aba', () => {
  const aba = planilhaDoRH().find((a) => a.nome === 'Plano de Sucessão')!

  // Quando o `!ref` da aba começa na linha 2, tudo desloca em 1.
  const linhas = montarLinhas(aba.matriz, 4, 2)
  assert.equal(linhas[0].linha, 7)
})

test('colunas sem cabecalho sao ignoradas e linhas vazias descartadas', () => {
  const linhas = montarLinhas(
    [
      ['Unidade', '', 'Nome Sucessor'],
      ['Patos', 'lixo', 'Ana'],
      [null, null, null],
      ['', '', ''],
      ['Sousa', 'lixo', 'Bia'],
    ],
    0
  )

  assert.equal(linhas.length, 2, 'as duas linhas vazias foram descartadas')
  assert.deepEqual(Object.keys(linhas[0].dados), ['Unidade', 'Nome Sucessor'])
  assert.equal(linhas[1].linha, 5)
})

// ─── Ponta a ponta com o formato do RH ────────────────────────────────────────

test('a planilha no formato do RH importa sem erro', () => {
  const abas = planilhaDoRH()
  const tabela = localizarTabela(abas, 'sucessao')!
  const aba = abas.find((a) => a.nome === tabela.aba)!

  const rel = analisarPlanilhaSucessao(montarLinhas(aba.matriz, tabela.indiceCabecalho, 1), OPERACOES)

  assert.deepEqual(rel.erros, [], JSON.stringify(rel.erros))
  assert.equal(rel.validos.length, 2)

  const primeiro = rel.validos[0]
  assert.equal(primeiro.cargoSucessao, 'ANALISTA DE CONTROLE')
  assert.equal(primeiro.areaCargoSucessao, 'APOIO LOGÍSTICO')
  assert.equal(primeiro.cargoAtualSucessor, 'AUXILIAR DE CONTROLE')
  assert.equal(primeiro.operacaoId, 'op-sousa')
  assert.equal(primeiro.prontoAgora, true)
  assert.equal(primeiro.habilidadeTecnica, 'Power BI')
  assert.equal(primeiro.habilidadeComportamental, 'Comunicação')
  assert.equal(primeiro.mesAno, 'ABRIL DE 2025')
  assert.equal(primeiro.cicloGente, 'PREPARAR')
  assert.equal(primeiro.houveMovimentacao, true)
})

test('a data chega intacta ate o registro importado', () => {
  // A planilha do RH formata a data como mês/dia/ano ("9/5/24"). Lendo a célula
  // como Date não há o que interpretar — se fosse lida como texto, viraria
  // 9 de maio em vez de 5 de setembro.
  const abas = planilhaDoRH()
  const tabela = localizarTabela(abas, 'sucessao')!
  const aba = abas.find((a) => a.nome === tabela.aba)!

  const linhas = prepararParaEnvio(montarLinhas(aba.matriz, tabela.indiceCabecalho, 1))
  const rel = analisarPlanilhaSucessao(linhas, OPERACOES)

  assert.deepEqual(rel.validos[0].inicioMapeamento, new Date(Date.UTC(2024, 8, 5)))
})

test('data e serializada como aaaa-mm-dd, para nenhum fuso desloca-la', () => {
  // Um `Date` vira ISO com o deslocamento do fuso ao ser serializado em JSON.
  // Meia-noite de 5 de setembro em UTC+2 é "2024-09-04T22:00:00Z": o servidor
  // leria o dia 4. Enviando "2024-09-05" não há como deslocar.
  const [linha] = prepararParaEnvio([
    { linha: 7, dados: { Data: new Date(2024, 8, 5), Nome: 'Ana' } },
  ])

  assert.equal(linha.dados.Data, '2024-09-05')
  assert.equal(linha.dados.Nome, 'Ana', 'o resto passa intacto')
})

test('data invalida vira nulo na serializacao, em vez de "Invalid Date"', () => {
  const [linha] = prepararParaEnvio([{ linha: 2, dados: { Data: new Date('xxx') } }])

  assert.equal(linha.dados.Data, null)
})

test('STATUS da planilha vira o booleano ativo', () => {
  const abas = planilhaDoRH()
  const tabela = localizarTabela(abas, 'sucessao')!
  const aba = abas.find((a) => a.nome === tabela.aba)!

  const rel = analisarPlanilhaSucessao(montarLinhas(aba.matriz, tabela.indiceCabecalho, 1), OPERACOES)

  assert.equal(rel.validos[0].ativo, true, 'ATIVO')
  assert.equal(rel.validos[1].ativo, false, 'DESLIGADO sai do pipeline')
})
