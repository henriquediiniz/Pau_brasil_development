import assert from 'node:assert/strict'
import test from 'node:test'

import { classificarLotacao, ehLotacao, whereLotacao } from '../src/lib/gente/matriz-filial'

test('reconhece o termo em qualquer caixa e com acento', () => {
  for (const valor of ['MATRIZ', 'Matriz', 'matriz', ' Matriz ']) {
    assert.equal(classificarLotacao(valor), 'MATRIZ', `"${valor}"`)
  }
  for (const valor of ['FILIAL', 'Filial', 'filial']) {
    assert.equal(classificarLotacao(valor), 'FILIAL', `"${valor}"`)
  }
})

test('reconhece o termo dentro de um texto maior', () => {
  // O campo é livre, e o RH costuma qualificar: "Filial Sousa".
  assert.equal(classificarLotacao('Filial Sousa'), 'FILIAL')
  assert.equal(classificarLotacao('Matriz - Patos'), 'MATRIZ')
})

test('"Matriz/Filial" conta como matriz', () => {
  // Quem escreve assim está na matriz e usou a barra para nomear o campo, não
  // para dizer que é os dois.
  assert.equal(classificarLotacao('Matriz/Filial'), 'MATRIZ')
})

test('o que não dá para classificar fica sem informação', () => {
  // Não pode ser empurrado para um dos lados: some da lista de quem procura.
  for (const valor of ['', '   ', '—', 'Patos', 'CD', null, undefined]) {
    assert.equal(
      classificarLotacao(valor),
      'SEM_INFORMACAO',
      `${JSON.stringify(valor)} não deveria ser classificado`
    )
  }
})

test('ehLotacao aceita só os três valores conhecidos', () => {
  assert.equal(ehLotacao('MATRIZ'), true)
  assert.equal(ehLotacao('FILIAL'), true)
  assert.equal(ehLotacao('SEM_INFORMACAO'), true)
  assert.equal(ehLotacao('matriz'), false)
  assert.equal(ehLotacao('QUALQUER'), false)
})

test('o filtro de filial exclui quem também casa com matriz', () => {
  /*
    Sem o `NOT`, "Matriz/Filial" apareceria nos dois filtros e o RH veria a
    mesma pessoa contada duas vezes. A classificação e o filtro precisam
    concordar.
  */
  const filial = whereLotacao('FILIAL') as { AND: unknown[] }
  assert.equal(filial.AND.length, 2)
  assert.deepEqual(filial.AND[1], {
    NOT: { matrizOuFilial: { contains: 'matriz', mode: 'insensitive' } },
  })
})

test('sem informação é o complemento dos outros dois, não apenas null', () => {
  // Um campo preenchido com "Patos" também não diz a lotação, e o RH precisa
  // achá-lo para corrigir.
  assert.deepEqual(whereLotacao('SEM_INFORMACAO'), {
    NOT: {
      OR: [
        { matrizOuFilial: { contains: 'matriz', mode: 'insensitive' } },
        { matrizOuFilial: { contains: 'filial', mode: 'insensitive' } },
      ],
    },
  })
})

test('os três filtros cobrem tudo sem se sobrepor', () => {
  /*
    A garantia que importa para o RH: somar os três filtros dá a base inteira,
    e ninguém aparece em dois. O teste confere pela classificação, que é a
    mesma regra que o filtro traduz.
  */
  const exemplos = ['MATRIZ', 'Filial Sousa', 'Matriz/Filial', 'Patos', '', null]
  const contagem = { MATRIZ: 0, FILIAL: 0, SEM_INFORMACAO: 0 }

  for (const valor of exemplos) contagem[classificarLotacao(valor)]++

  assert.equal(contagem.MATRIZ + contagem.FILIAL + contagem.SEM_INFORMACAO, exemplos.length)
  assert.deepEqual(contagem, { MATRIZ: 2, FILIAL: 1, SEM_INFORMACAO: 3 })
})
