import assert from 'node:assert/strict'
import test from 'node:test'

import { idsColididos, parearPorChave } from '../src/lib/gente/sobreposicao'
import { chaveColaborador, chaveDesligamento } from '../src/lib/gente/quadro-importador'
import { chavePorNome } from '../src/lib/gente/pcd-importador'
import { chaveInterno, chaveSucessao } from '../src/lib/gente/sucessao'
import { chaveCandidato } from '../src/lib/gente/candidato-importador'

/**
 * O bug que originou este módulo: reimportar a planilha criava uma cópia de
 * todo mundo. O RH viu a mesma pessoa duas vezes no quadro de 419.
 *
 * A garantia que estes testes guardam é uma só: a chave que identifica
 * repetição **dentro do arquivo** é a mesma que reconhece o registro **no
 * banco**. Se as duas regras divergirem, volta a duplicar — e é por isso que
 * cada caso abaixo calcula a chave do banco com a função que o importador usa.
 */

test('reimportar a mesma planilha nao cria copia', () => {
  const noBanco = [
    { id: 'a', operacaoId: 'op1', nome: 'Maria Souza', matricula: '10432' },
    { id: 'b', operacaoId: 'op1', nome: 'José Silva', matricula: '10987' },
  ]
  // A planilha volta igual: as duas linhas colidem, as duas são substituídas.
  const chegando = new Set(noBanco.map(chaveColaborador))

  assert.deepEqual(idsColididos(chegando, noBanco, chaveColaborador), ['a', 'b'])
})

test('quem nao esta na planilha nao e tocado', () => {
  // A regra que protege quem foi cadastrado pela tela: a importação só mexe
  // em quem ela própria traz.
  const noBanco = [
    { id: 'a', operacaoId: 'op1', nome: 'Maria', matricula: '1' },
    { id: 'b', operacaoId: 'op1', nome: 'Cadastrado na tela', matricula: null },
  ]
  const chegando = new Set([chaveColaborador({ operacaoId: 'op1', nome: 'Maria', matricula: '1' })])

  assert.deepEqual(idsColididos(chegando, noBanco, chaveColaborador), ['a'])
})

test('a matricula reconhece a pessoa mesmo com o nome escrito diferente', () => {
  // O caso real: casamento, abreviação, erro de digitação. Pelo nome seriam
  // duas pessoas; pela matrícula são uma, e a linha antiga é substituída.
  const noBanco = [{ id: 'a', operacaoId: 'op1', nome: 'Maria Souza', matricula: '10432' }]
  const chegando = new Set([
    chaveColaborador({ operacaoId: 'op1', nome: 'Maria S. Lima', matricula: '10432' }),
  ])

  assert.deepEqual(idsColididos(chegando, noBanco, chaveColaborador), ['a'])
})

test('homonimos com matriculas diferentes continuam duas pessoas', () => {
  const noBanco = [{ id: 'a', operacaoId: 'op1', nome: 'José Silva', matricula: '10432' }]
  const chegando = new Set([
    chaveColaborador({ operacaoId: 'op1', nome: 'José Silva', matricula: '10987' }),
  ])

  assert.deepEqual(idsColididos(chegando, noBanco, chaveColaborador), [])
})

test('a mesma pessoa em outra operacao e outro registro', () => {
  const noBanco = [{ id: 'a', operacaoId: 'op1', nome: 'Maria', matricula: null }]
  const chegando = new Set([chaveColaborador({ operacaoId: 'op2', nome: 'Maria' })])

  assert.deepEqual(idsColididos(chegando, noBanco, chaveColaborador), [])
})

test('recontratacao nao sobrepoe o desligamento anterior', () => {
  /*
    A data entra na chave de propósito: a mesma pessoa pode ser desligada mais
    de uma vez. Sem a data, o desligamento de 2024 seria apagado pelo de 2026 e
    o turnover histórico ficaria errado.
  */
  const noBanco = [
    {
      id: 'antigo',
      operacaoId: 'op1',
      nome: 'João Lima',
      dataDesligamento: new Date('2024-06-14T00:00:00Z'),
    },
  ]
  const chegando = new Set([
    chaveDesligamento({
      operacaoId: 'op1',
      nome: 'João Lima',
      dataDesligamento: new Date('2026-06-14T00:00:00Z'),
    }),
  ])

  assert.deepEqual(idsColididos(chegando, noBanco, chaveDesligamento), [])
})

test('desligamento com a mesma data e o mesmo registro', () => {
  const data = new Date('2026-06-14T00:00:00Z')
  const noBanco = [{ id: 'x', operacaoId: 'op1', nome: 'João Lima', dataDesligamento: data }]
  const chegando = new Set([chaveDesligamento({ operacaoId: 'op1', nome: 'João Lima', dataDesligamento: data })])

  assert.deepEqual(idsColididos(chegando, noBanco, chaveDesligamento), ['x'])
})

test('duplicatas ja gravadas somem todas, e uma so sobra atualizada', () => {
  /*
    O estado em que o banco ficou antes da correção: a mesma pessoa gravada
    duas vezes. `parearPorChave` casa a primeira para atualizar, e
    `idsColididos` marca as duas — então a rota que apaga limpa o estrago, e a
    que atualiza corrige uma e deixa a outra para a limpeza em massa.
  */
  const noBanco = [
    { id: 'a1', operacaoId: 'op1', nome: 'Abdias Leite da Silva' },
    { id: 'a2', operacaoId: 'op1', nome: 'Abdias Leite da Silva' },
  ]
  const novo = { operacaoId: 'op1', nome: 'Abdias Leite da Silva' }

  const { atualizar, criar } = parearPorChave([novo], chavePorNome, noBanco, chavePorNome)
  assert.equal(atualizar.length, 1)
  assert.equal(atualizar[0].antigo.id, 'a1')
  assert.equal(criar.length, 0)

  assert.deepEqual(idsColididos(new Set([chavePorNome(novo)]), noBanco, chavePorNome), ['a1', 'a2'])
})

test('parearPorChave separa quem atualiza de quem nasce', () => {
  const noBanco = [{ id: 'a', operacaoId: 'op1', nome: 'Maria' }]
  const registros = [
    { operacaoId: 'op1', nome: 'Maria' },
    { operacaoId: 'op1', nome: 'Pedro' },
  ]

  const { atualizar, criar } = parearPorChave(registros, chavePorNome, noBanco, chavePorNome)

  assert.equal(atualizar.length, 1)
  assert.equal(atualizar[0].antigo.id, 'a')
  assert.deepEqual(criar, [{ operacaoId: 'op1', nome: 'Pedro' }])
})

test('o candidato e reconhecido pelo telefone, mesmo mudando de operacao', () => {
  // O telefone atravessa operações: a mesma pessoa se candidatando em duas
  // unidades é uma pessoa só.
  const noBanco = [{ id: 'a', operacaoId: 'op1', nome: 'Ana', telefone: '(83) 99999-1234' }]
  const chegando = new Set([
    chaveCandidato({ operacaoId: 'op2', nome: 'Ana Maria', telefone: '83999991234' }),
  ])

  assert.deepEqual(idsColididos(chegando, noBanco, chaveCandidato), ['a'])
})

test('sem telefone, o candidato cai para nome + operacao', () => {
  const noBanco = [{ id: 'a', operacaoId: 'op1', nome: 'Ana', telefone: null }]

  assert.deepEqual(
    idsColididos(new Set([chaveCandidato({ operacaoId: 'op1', nome: 'ANA' })]), noBanco, chaveCandidato),
    ['a']
  )
  assert.deepEqual(
    idsColididos(new Set([chaveCandidato({ operacaoId: 'op2', nome: 'Ana' })]), noBanco, chaveCandidato),
    []
  )
})

test('a mesma pessoa pode suceder dois cargos diferentes', () => {
  const noBanco = [
    { id: 'a', operacaoId: 'op1', cargoSucessao: 'Gerente Comercial', nomeSucessor: 'Bruno' },
  ]
  const chegando = new Set([
    chaveSucessao({ operacaoId: 'op1', cargoSucessao: 'Gerente de Vendas', nomeSucessor: 'Bruno' }),
  ])

  assert.deepEqual(idsColididos(chegando, noBanco, chaveSucessao), [])
})

test('as chaves ignoram acento e caixa, como a planilha varia', () => {
  const noBanco = [{ id: 'a', operacaoId: 'op1', nome: 'CÍCERO SABINO' }]
  const chegando = new Set([chaveInterno({ operacaoId: 'op1', nome: 'cicero sabino' })])

  assert.deepEqual(idsColididos(chegando, noBanco, chaveInterno), ['a'])
})

test('planilha vazia nao apaga nada', () => {
  // A trava que importa: nenhuma chave chegando significa nenhuma colisão, e
  // não "apague a base".
  const noBanco = [{ id: 'a', operacaoId: 'op1', nome: 'Maria' }]

  assert.deepEqual(idsColididos(new Set(), noBanco, chavePorNome), [])
  assert.deepEqual(parearPorChave([], chavePorNome, noBanco, chavePorNome), {
    atualizar: [],
    criar: [],
  })
})
