import assert from 'node:assert/strict'
import test from 'node:test'

import { casarArquivo, casarArquivos, nomeDoArquivo } from '../src/lib/gente/laudo-arquivo'

// Os nomes exatos dos arquivos que o RH entregou, e nomes de cadastro no
// formato em que a planilha de PCD grava.
const PESSOAS = [
  { id: 'helio', nome: 'HELIO NASCIMENTO DA SILVA' },
  { id: 'josildo', nome: 'JOSILDO VIEIRA DE SOUSA' },
  { id: 'charllen', nome: 'CHARLLEN PLELLIS' },
  { id: 'moises', nome: 'MOISES RODRIGUES' },
  { id: 'paulo', nome: 'PAULO SERGIO DE OLIVEIRA' },
]

test('tira o ruido do nome do arquivo', () => {
  assert.deepEqual(nomeDoArquivo('HELIO NASCIMENTO LAUDO.pdf'), ['helio', 'nascimento'])
  assert.deepEqual(nomeDoArquivo('JOSILDO VIEIRA DE SOUSA_DOC_PCD.pdf'), [
    'josildo',
    'vieira',
    'sousa',
  ])
  assert.deepEqual(nomeDoArquivo('LAUDO CHARLLEN PLELLIS.pdf'), ['charllen', 'plellis'])
})

test('casa os cinco arquivos reais com as pessoas certas', () => {
  const arquivos = [
    'HELIO NASCIMENTO LAUDO.pdf',
    'JOSILDO VIEIRA DE SOUSA_DOC_PCD.pdf',
    'LAUDO CHARLLEN PLELLIS.pdf',
    'MOISES RODRIGUES_DOC_PCD.pdf',
    'PAULO SERGIO_DOC_PCD.pdf',
  ]

  const casados = casarArquivos(arquivos, PESSOAS)

  assert.deepEqual(
    casados.map((c) => c.candidatos[0]?.id ?? null),
    ['helio', 'josildo', 'charllen', 'moises', 'paulo']
  )
  // Nenhum ficou sem par.
  assert.equal(casados.every((c) => c.confianca === 'exata' || c.confianca === 'provavel'), true)
})

test('nome completo igual e correspondencia exata', () => {
  const r = casarArquivo('CHARLLEN PLELLIS.pdf', PESSOAS)
  assert.equal(r.confianca, 'exata')
  assert.equal(r.candidatos[0].id, 'charllen')
})

test('nome parcial do cadastro longo e provavel, nao exata', () => {
  // "PAULO SERGIO" contra "PAULO SERGIO DE OLIVEIRA": dá para anexar, mas o RH
  // confere antes.
  const r = casarArquivo('PAULO SERGIO_DOC_PCD.pdf', PESSOAS)
  assert.equal(r.confianca, 'provavel')
  assert.equal(r.candidatos[0].id, 'paulo')
})

test('a preposicao pode faltar ou sobrar', () => {
  // "JOSILDO VIEIRA SOUSA" (sem o "DE") tem que achar o mesmo cadastro.
  const r = casarArquivo('JOSILDO VIEIRA SOUSA.pdf', PESSOAS)
  assert.equal(r.candidatos[0].id, 'josildo')
})

test('primeiro nome sozinho nao casa com ninguem', () => {
  /*
    A trava que importa. "PAULO.pdf" casaria por sorte, e um palpite que acerta
    às vezes convida o RH a aceitar sem olhar — anexar laudo na pessoa errada é
    vazar dado de saúde de alguém para o prontuário de outro.
  */
  const r = casarArquivo('PAULO.pdf', PESSOAS)
  assert.equal(r.confianca, 'nenhuma')
  assert.deepEqual(r.candidatos, [])
})

test('homonimos ficam ambiguos, nunca escolhidos no chute', () => {
  const comHomonimo = [
    { id: 'a', nome: 'JOSE SILVA' },
    { id: 'b', nome: 'JOSE SILVA' },
  ]
  const r = casarArquivo('JOSE SILVA LAUDO.pdf', comHomonimo)

  assert.equal(r.confianca, 'ambigua')
  assert.equal(r.candidatos.length, 2)
})

test('nome parcial que serve a dois cadastros fica ambiguo', () => {
  const doisParecidos = [
    { id: 'a', nome: 'MARIA SOUZA LIMA' },
    { id: 'b', nome: 'MARIA SOUZA COSTA' },
  ]
  const r = casarArquivo('MARIA SOUZA.pdf', doisParecidos)

  assert.equal(r.confianca, 'ambigua')
  assert.equal(r.candidatos.length, 2)
})

test('dois arquivos para a mesma pessoa param os dois', () => {
  /*
    Sem esta regra o segundo sobrescreveria o primeiro em silêncio, e o RH só
    descobriria abrindo o laudo de alguém e achando o de outro.
  */
  const casados = casarArquivos(
    ['MOISES RODRIGUES_DOC_PCD.pdf', 'LAUDO MOISES RODRIGUES.pdf'],
    PESSOAS
  )

  assert.deepEqual(
    casados.map((c) => c.confianca),
    ['ambigua', 'ambigua']
  )
})

test('arquivo que nao tem nome nenhum nao casa', () => {
  for (const nome of ['LAUDO.pdf', 'DOC_PCD.pdf', '12345.pdf', '.pdf']) {
    const r = casarArquivo(nome, PESSOAS)
    assert.equal(r.confianca, 'nenhuma', nome)
  }
})

test('acento e caixa nao atrapalham', () => {
  const pessoas = [{ id: 'x', nome: 'CÍCERO SABINO DE SOUSA JÚNIOR' }]
  const r = casarArquivo('cicero sabino sousa junior.pdf', pessoas)

  assert.equal(r.confianca, 'exata')
  assert.equal(r.candidatos[0].id, 'x')
})

test('lista vazia de pessoas nao quebra', () => {
  assert.deepEqual(casarArquivos(['QUALQUER.pdf'], []), [
    { arquivo: 'QUALQUER.pdf', nomeNoArquivo: 'qualquer', confianca: 'nenhuma', candidatos: [] },
  ])
})
