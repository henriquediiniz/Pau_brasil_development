import assert from 'node:assert/strict'
import test from 'node:test'

import { analisarPlanilhaCargos, COLUNAS_CARGO } from '../src/lib/gente/cargo-importador'
import { normalizar, type LinhaPlanilha } from '../src/lib/gente/vaga-importador'
import { localizarTabela, montarLinhas } from '../src/lib/gente/planilha-leitura'

/**
 * Os cabeçalhos aqui são os da planilha real do RH ("Cargos e Perfil"),
 * incluindo os espaços sobrando que ela tem em "Formação ", "Status " e
 * "Exigências ". Se o importador voltar a depender de string exata, quebra.
 */
const CABECALHO_REAL = [
  'Cargo',
  'Área',
  'Tipo vaga',
  'Descrição Atividades',
  'Competências Sugeridas',
  'Experiência Sugerida',
  'Formação ',
  'Status ',
  'Curso',
  'Exigências ',
  'Observações',
  'Precisa ter aderência ao Raio?',
  'Etapas do Processo',
  'Testes',
]

const LINHA_REAL = [
  'Analista de Controle',
  'Logística',
  'Demais cargos',
  'Controle de informações sobre faturamento; emissão de notas.',
  'Capacidade analítica\r\nOrganização\r\nSenso de urgência',
  'Desejavel 6 meses de experiência na área. ',
  'Ensino Superior',
  'Formado',
  'N/A',
  'Obrigatório: Conhecimento Pacote Office',
  null,
  'Sim',
  'Triagem\r\nTestes\r\nEntrevista  (1 e 2) \r\nASO',
  'Lógica\r\nExcel\r\nMatemática Intermediário',
]

function comCabecalho(valores: (string | null)[][]): LinhaPlanilha[] {
  return valores.map((v, i) => ({
    linha: i + 2,
    dados: Object.fromEntries(CABECALHO_REAL.map((h, j) => [h, v[j] ?? null])),
  }))
}

test('le a linha real do RH sem erro e sem perder campo', () => {
  const rel = analisarPlanilhaCargos(comCabecalho([LINHA_REAL]))

  assert.deepEqual(rel.erros, [])
  assert.equal(rel.validos.length, 1)

  const c = rel.validos[0]
  assert.equal(c.cargo, 'Analista de Controle')
  assert.equal(c.area, 'Logística')
  assert.equal(c.tipoVaga, 'Demais cargos')
  assert.equal(c.formacao, 'Ensino Superior')
  assert.equal(c.statusCurso, 'Formado')
  assert.equal(c.exigencias, 'Obrigatório: Conhecimento Pacote Office')
  assert.equal(c.precisaAderenciaRaio, true)
  assert.ok(c.descricaoAtividades)
  assert.ok(c.competenciasSugeridas)
  assert.ok(c.testes)
})

test('cabecalho com espaco sobrando ainda e reconhecido', () => {
  // "Formação " e "Status " vêm assim na planilha do RH desde sempre.
  const rel = analisarPlanilhaCargos(comCabecalho([LINHA_REAL]))

  assert.equal(rel.validos[0].formacao, 'Ensino Superior', '"Formação " foi lida')
  assert.equal(rel.validos[0].statusCurso, 'Formado', '"Status " foi lida')
})

test('N/A e NA viram vazio, nao texto', () => {
  // Se guardasse a string, a tela mostraria "N/A" como se fosse a exigência.
  const linhas = comCabecalho([
    [...LINHA_REAL.slice(0, 8), 'N/A', 'NA', 'n/a', 'Sim', '-', '  '],
  ])
  const c = analisarPlanilhaCargos(linhas).validos[0]

  assert.equal(c.curso, null)
  assert.equal(c.exigencias, null)
  assert.equal(c.observacoes, null)
  assert.equal(c.etapasProcesso, null)
  assert.equal(c.testes, null)
})

test('curso de verdade e preservado — nao e so N/A', () => {
  const exigencia = 'Obrigatório técnico em Segurança do Trabalho, desejável Superior cursando'
  const linha = [...LINHA_REAL]
  linha[8] = exigencia

  assert.equal(analisarPlanilhaCargos(comCabecalho([linha])).validos[0].curso, exigencia)
})

test('curso, formacao e status sao tres campos distintos', () => {
  // O schema antes colapsava "Status" e "Curso" num campo só; a planilha do RH
  // trata nível, situação e curso como três perguntas diferentes.
  const linha = [...LINHA_REAL]
  linha[6] = 'Ensino Superior'
  linha[7] = 'Cursando'
  linha[8] = 'Administração'

  const c = analisarPlanilhaCargos(comCabecalho([linha])).validos[0]
  assert.equal(c.formacao, 'Ensino Superior')
  assert.equal(c.statusCurso, 'Cursando')
  assert.equal(c.curso, 'Administração')
})

test('texto multilinha e preservado linha a linha', () => {
  const c = analisarPlanilhaCargos(comCabecalho([LINHA_REAL])).validos[0]

  assert.deepEqual(
    c.competenciasSugeridas?.split('\n'),
    ['Capacidade analítica', 'Organização', 'Senso de urgência'],
    'uma competência por linha, sem \\r sobrando'
  )
  assert.ok(!c.etapasProcesso?.includes('\r'), 'o \\r do Excel não vai para o banco')
})

test('cargo sem nome e recusado', () => {
  const linha = [...LINHA_REAL]
  linha[0] = null

  const rel = analisarPlanilhaCargos(comCabecalho([linha]))
  assert.equal(rel.validos.length, 0)
  assert.equal(rel.erros[0].campo, 'cargo')
})

test('cargo sem area e recusado, porque area entra na identidade', () => {
  const linha = [...LINHA_REAL]
  linha[1] = null

  const rel = analisarPlanilhaCargos(comCabecalho([linha]))
  assert.equal(rel.validos.length, 0)
  assert.equal(rel.erros[0].campo, 'area')
})

test('mesmo cargo em areas diferentes sao dois descritivos', () => {
  const outro = [...LINHA_REAL]
  outro[1] = 'Vendas'

  const rel = analisarPlanilhaCargos(comCabecalho([LINHA_REAL, outro]))
  assert.equal(rel.validos.length, 2)
  assert.equal(rel.duplicados.length, 0)
})

test('cargo repetido na mesma area e duplicado — so o primeiro entra', () => {
  const rel = analisarPlanilhaCargos(comCabecalho([LINHA_REAL, [...LINHA_REAL]]))

  assert.equal(rel.validos.length, 1)
  assert.equal(rel.duplicados.length, 1)
  assert.match(rel.duplicados[0].mensagem, /linha 2/)
})

test('duplicidade ignora caixa e acento', () => {
  const variante = [...LINHA_REAL]
  variante[0] = 'ANALISTA DE CONTROLE'
  variante[1] = 'LOGISTICA'

  const rel = analisarPlanilhaCargos(comCabecalho([LINHA_REAL, variante]))
  assert.equal(rel.duplicados.length, 1, 'é o mesmo cargo escrito de outro jeito')
})

test('aderencia ao raio aceita Sim, X e vazio', () => {
  const com = (v: string | null) => {
    const l = [...LINHA_REAL]
    l[11] = v
    return analisarPlanilhaCargos(comCabecalho([l])).validos[0].precisaAderenciaRaio
  }

  assert.equal(com('Sim'), true)
  assert.equal(com('X'), true)
  assert.equal(com('Não'), false)
  assert.equal(com(null), false, 'vazio é "não", não erro')
})

test('sem descricao de atividades importa, mas avisa', () => {
  // É o campo que a conferência de aderência lê. Vale importar assim mesmo,
  // mas o RH precisa saber que aquele cargo ficou sem base de comparação.
  const linha = [...LINHA_REAL]
  linha[3] = null

  const rel = analisarPlanilhaCargos(comCabecalho([linha]))
  assert.equal(rel.validos.length, 1, 'não bloqueia')
  assert.ok(rel.avisos.some((a) => a.campo === 'descricaoAtividades'))
})

test('sem etapas do processo importa, mas avisa', () => {
  const linha = [...LINHA_REAL]
  linha[12] = null

  const rel = analisarPlanilhaCargos(comCabecalho([linha]))
  assert.equal(rel.validos.length, 1)
  assert.ok(rel.avisos.some((a) => a.campo === 'etapasProcesso'))
})

test('acha o cabecalho na segunda linha, abaixo da faixa de agrupamento', () => {
  // A planilha do RH tem uma faixa mesclada na linha 1 ("Sobre a Vaga",
  // "Requisitos e Qualificações"). O cabeçalho de verdade é o da linha 2.
  const faixa = [
    'Sobre a Vaga', null, null,
    'Responsabilidades e Atribuições',
    'Requisitos e Qualificações', null, null, null, null, null,
    'Informações Adicionais', null,
    'Definição de Etapas', null,
  ]

  const tabela = localizarTabela(
    [{ nome: 'Cargos e Perfil', matriz: [faixa, CABECALHO_REAL, LINHA_REAL] }],
    'cargos'
  )

  assert.ok(tabela, 'a tabela foi localizada')
  assert.equal(tabela!.indiceCabecalho, 1, 'o cabeçalho é a segunda linha')
  assert.equal(tabela!.aba, 'Cargos e Perfil')

  const linhas = montarLinhas([faixa, CABECALHO_REAL, LINHA_REAL], tabela!.indiceCabecalho)
  const rel = analisarPlanilhaCargos(linhas)

  assert.deepEqual(rel.erros, [])
  assert.equal(rel.validos.length, 1)
  assert.equal(rel.validos[0].linha, 3, 'aponta a linha como o RH vê na planilha')
})

test('todo sinonimo declarado esta normalizado — senao nunca casa', () => {
  // `campo()` compara com `normalizar(cabeçalho)`. Um sinônimo escrito com
  // acento ou maiúscula aqui seria letra morta.
  for (const [chave, aceitos] of Object.entries(COLUNAS_CARGO)) {
    for (const a of aceitos) {
      assert.equal(a, normalizar(a), `"${a}" (${chave}) precisa estar normalizado`)
    }
  }
})
