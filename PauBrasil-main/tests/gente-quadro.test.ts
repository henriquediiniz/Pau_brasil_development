import assert from 'node:assert/strict'
import test from 'node:test'

import { calcularTurnover } from '../src/lib/gente/quadro'
import {
  analisarPlanilhaDesligamentos,
  analisarPlanilhaQuadro,
} from '../src/lib/gente/quadro-importador'
import type { LinhaPlanilha, OperacaoRef } from '../src/lib/gente/vaga-importador'

const OPERACOES: OperacaoRef[] = [
  { id: 'op-patos', nome: 'Pau Brasil Patos', nomeAbrev: 'Patos' },
  { id: 'op-sume', nome: 'Pau Brasil Sumé', nomeAbrev: 'Sumé' },
]

const HOJE = new Date('2026-09-21T00:00:00Z')

function linha(dados: Record<string, unknown>, n = 2): LinhaPlanilha {
  return { linha: n, dados }
}

// ─── QLP ──────────────────────────────────────────────────────────────────────

test('importa colaborador do quadro', () => {
  const rel = analisarPlanilhaQuadro(
    [linha({ Unidade: 'PATOS', Nome: 'Maria Souza', Cargo: 'Vendedora', Área: 'Vendas' })],
    OPERACOES
  )

  assert.equal(rel.erros.length, 0)
  assert.equal(rel.validos.length, 1)
  assert.equal(rel.validos[0].operacaoId, 'op-patos')
  assert.equal(rel.validos[0].nome, 'Maria Souza')
  assert.equal(rel.validos[0].cargo, 'Vendedora')
  assert.equal(rel.validos[0].ativo, true)
})

test('nome e unidade sao obrigatorios no quadro', () => {
  const rel = analisarPlanilhaQuadro([linha({ Cargo: 'Vendedora' })], OPERACOES)

  assert.equal(rel.validos.length, 0)
  assert.deepEqual(rel.erros.map((e) => e.campo).sort(), ['nome', 'unidade'])
})

test('quadro: mesma pessoa na mesma operacao e repeticao', () => {
  const rel = analisarPlanilhaQuadro(
    [
      linha({ Unidade: 'Patos', Nome: 'Maria Souza' }, 2),
      linha({ Unidade: 'Patos', Nome: 'MARIA SOUZA' }, 3),
      linha({ Unidade: 'Sumé', Nome: 'Maria Souza' }, 4), // outra operação, entra
    ],
    OPERACOES
  )

  assert.equal(rel.validos.length, 2)
  assert.equal(rel.duplicados.length, 1)
  assert.match(rel.duplicados[0].mensagem, /linha 2/)
})

test('quadro avisa sobre colaborador sem cargo', () => {
  const rel = analisarPlanilhaQuadro([linha({ Unidade: 'Patos', Nome: 'Maria' })], OPERACOES)

  assert.equal(rel.validos.length, 1)
  assert.ok(rel.avisos.some((a) => a.campo === 'cargo'))
})

// ─── Desligamentos ────────────────────────────────────────────────────────────

test('importa desligamento completo', () => {
  const rel = analisarPlanilhaDesligamentos(
    [
      linha({
        Unidade: 'PATOS',
        Nome: 'João Lima',
        Cargo: 'Motorista',
        'DPO ou SPO': 'DPO',
        'Data Desligamento': '14/06/2026',
        Motivo: 'Pedido de demissão',
      }),
    ],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.erros.length, 0)
  assert.equal(rel.validos.length, 1)
  assert.equal(rel.validos[0].setor, 'DPO')
  assert.deepEqual(rel.validos[0].dataDesligamento, new Date(Date.UTC(2026, 5, 14)))
})

test('desligamento sem data e bloqueado — e ela que faz o registro existir', () => {
  const rel = analisarPlanilhaDesligamentos(
    [linha({ Unidade: 'Patos', Nome: 'João Lima' })],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 0)
  assert.equal(rel.erros[0].campo, 'dataDesligamento')
})

test('desligamento com data invalida e bloqueado', () => {
  const rel = analisarPlanilhaDesligamentos(
    [linha({ Unidade: 'Patos', Nome: 'João', 'Data Desligamento': '31/02/2026' })],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 0)
  assert.equal(rel.erros[0].campo, 'dataDesligamento')
})

test('desligamento no futuro passa, mas com aviso', () => {
  const rel = analisarPlanilhaDesligamentos(
    [linha({ Unidade: 'Patos', Nome: 'João', 'Data Desligamento': '14/06/2027', Motivo: 'x' })],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 1)
  assert.ok(rel.avisos.some((a) => /futuro/i.test(a.mensagem)))
})

test('desligamento sem motivo avisa, porque atrapalha o turnover', () => {
  const rel = analisarPlanilhaDesligamentos(
    [linha({ Unidade: 'Patos', Nome: 'João', 'Data Desligamento': '14/06/2026' })],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 1)
  assert.ok(rel.avisos.some((a) => a.campo === 'motivo'))
})

test('recontratacao: mesma pessoa com datas diferentes entra duas vezes', () => {
  const rel = analisarPlanilhaDesligamentos(
    [
      linha({ Unidade: 'Patos', Nome: 'João', 'Data Desligamento': '14/06/2025', Motivo: 'a' }, 2),
      linha({ Unidade: 'Patos', Nome: 'João', 'Data Desligamento': '14/06/2026', Motivo: 'b' }, 3),
      linha({ Unidade: 'Patos', Nome: 'João', 'Data Desligamento': '14/06/2026', Motivo: 'c' }, 4),
    ],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 2, 'duas saídas reais')
  assert.equal(rel.duplicados.length, 1, 'a terceira repete a segunda')
  assert.equal(rel.duplicados[0].linha, 4)
})

test('setor invalido bloqueia o desligamento', () => {
  const rel = analisarPlanilhaDesligamentos(
    [linha({ Unidade: 'Patos', Nome: 'João', 'Data Desligamento': '14/06/2026', Setor: 'XPO' })],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 0)
  assert.equal(rel.erros[0].campo, 'setor')
})

test('uma linha com erro nao derruba as outras', () => {
  const rel = analisarPlanilhaDesligamentos(
    [
      linha({ Unidade: 'Patos', Nome: 'A', 'Data Desligamento': '01/06/2026', Motivo: 'x' }, 2),
      linha({ Unidade: 'Patos', Nome: 'B' }, 3),
      linha({ Unidade: 'Patos', Nome: 'C', 'Data Desligamento': '02/06/2026', Motivo: 'x' }, 4),
    ],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 2)
  assert.equal(rel.erros.length, 1)
  assert.equal(rel.erros[0].linha, 3)
})

// ─── Turnover ─────────────────────────────────────────────────────────────────

test('turnover e percentual com uma casa decimal', () => {
  assert.equal(calcularTurnover(5, 100), 5)
  assert.equal(calcularTurnover(1, 3), 33.3)
})

test('turnover sem quadro ativo e nulo, nao infinito', () => {
  assert.equal(calcularTurnover(5, 0), null)
  assert.equal(calcularTurnover(0, 0), null)
})


// ─── QLP: matrícula, CPF e admissão ───────────────────────────────────────────

test('importa matricula, CPF e data de admissao', () => {
  const rel = analisarPlanilhaQuadro(
    [
      linha({
        Unidade: 'Pau Brasil Patos',
        Nome: 'Maria Souza',
        Cargo: 'Vendedora',
        'Matrícula': '10432',
        CPF: '123.456.789-09',
        'Data Admissão': '03/02/2025',
      }),
    ],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.erros.length, 0)
  assert.equal(rel.validos.length, 1)
  assert.equal(rel.validos[0].matricula, '10432')
  // Guarda só dígitos: formatos diferentes do mesmo CPF impediriam de
  // reconhecer a mesma pessoa.
  assert.equal(rel.validos[0].cpf, '12345678909')
  assert.equal(rel.validos[0].dataAdmissao?.toISOString().slice(0, 10), '2025-02-03')
})

test('CPF invalido bloqueia a linha', () => {
  // É erro, não aviso: um CPF errado no banco só aparece meses depois, quando
  // alguém confere a folha e não sabe mais de qual linha veio.
  const rel = analisarPlanilhaQuadro(
    [linha({ Unidade: 'Pau Brasil Patos', Nome: 'Maria', CPF: '111.111.111-11' })],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 0)
  assert.equal(rel.erros.length, 1)
  assert.equal(rel.erros[0].campo, 'cpf')
})

test('linha sem CPF continua valida', () => {
  // O CPF não é obrigatório: exigir travaria a importação do quadro inteiro.
  const rel = analisarPlanilhaQuadro(
    [linha({ Unidade: 'Pau Brasil Patos', Nome: 'Maria' })],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 1)
  assert.equal(rel.validos[0].cpf, null)
  assert.equal(rel.validos[0].matricula, null)
  assert.equal(rel.validos[0].dataAdmissao, null)
})

test('data de admissao invalida bloqueia a linha', () => {
  const rel = analisarPlanilhaQuadro(
    [linha({ Unidade: 'Pau Brasil Patos', Nome: 'Maria', 'Data Admissão': '31/02/2025' })],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 0)
  assert.equal(rel.erros[0].campo, 'dataAdmissao')
})

test('admissao no futuro passa, mas avisa', () => {
  const rel = analisarPlanilhaQuadro(
    [linha({ Unidade: 'Pau Brasil Patos', Nome: 'Maria', 'Data Admissão': '01/01/2030' })],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 1, 'admissão futura é contratação agendada, não erro')
  assert.equal(rel.avisos.some((a) => a.campo === 'dataAdmissao'), true)
})

test('a matricula manda sobre o nome ao detectar repeticao', () => {
  /*
    O caso real: a mesma pessoa aparece duas vezes com o nome escrito diferente
    (casamento, abreviação, erro de digitação). Pelo nome seriam duas pessoas;
    pela matrícula são uma.
  */
  const rel = analisarPlanilhaQuadro(
    [
      linha({ Unidade: 'Pau Brasil Patos', Nome: 'Maria Souza', 'Matrícula': '10432' }, 2),
      linha({ Unidade: 'Pau Brasil Patos', Nome: 'Maria S. Lima', 'Matrícula': '10432' }, 3),
    ],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 1)
  assert.equal(rel.duplicados.length, 1)
  assert.match(rel.duplicados[0].mensagem, /mesma matrícula 10432/)
})

test('homonimos com matriculas diferentes sao duas pessoas', () => {
  // O outro lado da mesma moeda, e o que o nome sozinho errava: dois
  // colaboradores podem se chamar igual.
  const rel = analisarPlanilhaQuadro(
    [
      linha({ Unidade: 'Pau Brasil Patos', Nome: 'José Silva', 'Matrícula': '10432' }, 2),
      linha({ Unidade: 'Pau Brasil Patos', Nome: 'José Silva', 'Matrícula': '10987' }, 3),
    ],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 2)
  assert.equal(rel.duplicados.length, 0)
})

test('sem matricula, a identidade continua sendo nome + operacao', () => {
  const rel = analisarPlanilhaQuadro(
    [
      linha({ Unidade: 'Pau Brasil Patos', Nome: 'Maria Souza' }, 2),
      linha({ Unidade: 'Pau Brasil Patos', Nome: 'maria souza' }, 3),
      // Mesma pessoa, outra unidade: é outro registro de quadro.
      linha({ Unidade: 'Pau Brasil Sumé', Nome: 'Maria Souza' }, 4),
    ],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 2)
  assert.equal(rel.duplicados.length, 1)
})

test('aceita os sinonimos de cabecalho das colunas novas', () => {
  const rel = analisarPlanilhaQuadro(
    [
      linha({
        Unidade: 'Pau Brasil Patos',
        Nome: 'Maria',
        Chapa: '777',
        Documento: '12345678909',
        'Data de Admissão': '2025-02-03',
      }),
    ],
    OPERACOES,
    HOJE
  )

  assert.equal(rel.validos.length, 1)
  assert.equal(rel.validos[0].matricula, '777')
  assert.equal(rel.validos[0].cpf, '12345678909')
  assert.equal(rel.validos[0].dataAdmissao?.toISOString().slice(0, 10), '2025-02-03')
})
