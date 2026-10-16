import assert from 'node:assert/strict'
import test from 'node:test'

import { internoPatchSchema, internoSchema } from '../src/lib/gente/sucessao'
import { SECOES_INTERNO, VALORES_INTERNO } from '../src/app/gente/sucessao/_campos'

/**
 * Contrato entre o formulário de candidato interno e a API.
 *
 * O bug que o originou: `futurosCargos` é array no banco, mas o campo da tela
 * não estava declarado como lista e mandava a string "Gerente de Vendas;".
 * Criar um candidato morria com "Dados inválidos: Futuros cargos", enquanto
 * editar funcionava — porque a rota de PATCH tinha um `split` improvisado que
 * a de POST não tinha.
 *
 * É o segundo caso do mesmo tipo (o primeiro foi `turnos`, no descritivo de
 * cargo), então o teste fecha os dois lados: o formulário declara o campo do
 * jeito certo, e o schema aceita texto de qualquer forma.
 */

const camposDoFormulario = SECOES_INTERNO.flatMap((s) => s.campos)

/** Reproduz a conversão de `FormularioSimples` antes do envio. */
function payloadDoFormulario(valores: Record<string, string>) {
  const corpo: Record<string, unknown> = {}
  for (const campo of camposDoFormulario) {
    const bruto = valores[campo.nome] ?? ''
    if (campo.tipo === 'checkbox') corpo[campo.nome] = bruto === 'true'
    else if (campo.tipo === 'lista')
      corpo[campo.nome] = bruto.split(/[;,]/).map((v) => v.trim()).filter(Boolean)
    else corpo[campo.nome] = bruto.trim() === '' ? null : bruto.trim()
  }
  return corpo
}

test('todo campo do formulario existe no schema da API', () => {
  const noSchema = new Set(Object.keys(internoSchema.shape))

  for (const campo of camposDoFormulario) {
    assert.ok(
      noSchema.has(campo.nome),
      `"${campo.nome}" está no formulário e não no schema: seria enviado e descartado em silêncio`
    )
  }
})

test('todo campo do formulario tem valor inicial', () => {
  for (const campo of camposDoFormulario) {
    assert.ok(
      campo.nome in VALORES_INTERNO,
      `"${campo.nome}" não tem valor inicial em VALORES_INTERNO`
    )
  }
})

test('o payload do formulario vazio e aceito na criacao', () => {
  const corpo = payloadDoFormulario(VALORES_INTERNO)
  // Os obrigatórios, que a tela exige antes de enviar.
  corpo.operacaoId = 'op-1'
  corpo.nome = 'Maria Souza'

  const r = internoSchema.safeParse(corpo)
  assert.ok(
    r.success,
    `criação recusou: ${JSON.stringify(r.success ? {} : r.error.flatten().fieldErrors)}`
  )
})

test('o mesmo payload e aceito na edicao', () => {
  const corpo = payloadDoFormulario(VALORES_INTERNO)
  corpo.operacaoId = 'op-1'
  corpo.nome = 'Maria Souza'

  const r = internoPatchSchema.safeParse(corpo)
  assert.ok(
    r.success,
    `edição recusou: ${JSON.stringify(r.success ? {} : r.error.flatten().fieldErrors)}`
  )
})

test('o cadastro com futuros cargos preenchidos passa — era o bug', () => {
  // Exatamente o que o RH digitou na tela quando o erro apareceu.
  const corpo = payloadDoFormulario({
    ...VALORES_INTERNO,
    cargoPretendido: 'REPRESENTANTE DE NEGOCIOS',
    possuiRequisitos: 'true',
    futurosCargos: 'Gerente de Vendas;',
  })
  corpo.operacaoId = 'op-1'
  corpo.nome = 'Maria Souza'

  const r = internoSchema.safeParse(corpo)
  assert.ok(
    r.success,
    `criação recusou: ${JSON.stringify(r.success ? {} : r.error.flatten().fieldErrors)}`
  )
  assert.deepEqual(r.success && r.data.futurosCargos, ['Gerente de Vendas'])
})

test('futuros cargos aceita texto cru, nao so array', () => {
  /*
    A tela manda array, mas o schema não depende disso: foi a rota de POST
    confiar no formato da tela que derrubou o cadastro. Agora as duas formas
    entram, e nenhuma rota precisa converter nada antes.
  */
  const comPontoEVirgula = internoSchema.safeParse({
    operacaoId: 'op-1',
    nome: 'Maria',
    futurosCargos: 'Supervisor de Vendas; Coordenador Comercial',
  })
  assert.ok(comPontoEVirgula.success)
  assert.deepEqual(comPontoEVirgula.data.futurosCargos, [
    'Supervisor de Vendas',
    'Coordenador Comercial',
  ])

  // Vírgula separa igual: quem digita não decora qual o campo aceita.
  const comVirgula = internoSchema.safeParse({
    operacaoId: 'op-1',
    nome: 'Maria',
    futurosCargos: 'Supervisor, Coordenador',
  })
  assert.ok(comVirgula.success)
  assert.deepEqual(comVirgula.data.futurosCargos, ['Supervisor', 'Coordenador'])
})

test('futuros cargos vazio vira lista vazia, nunca null', () => {
  // O Prisma recusa null num campo de lista, então nenhuma dessas formas pode
  // chegar ao banco como null.
  for (const valor of ['', '   ', ';', null, undefined, []]) {
    const r = internoSchema.safeParse({ operacaoId: 'op-1', nome: 'Maria', futurosCargos: valor })
    assert.ok(r.success, `recusou ${JSON.stringify(valor)}`)
    assert.deepEqual(r.data.futurosCargos, [], `${JSON.stringify(valor)} não virou lista vazia`)
  }

  // E não enviar o campo também vale.
  const semCampo = internoSchema.safeParse({ operacaoId: 'op-1', nome: 'Maria' })
  assert.ok(semCampo.success)
  assert.deepEqual(semCampo.data.futurosCargos, [])
})

test('futuros cargos sobrevive a edicao parcial', () => {
  const r = internoPatchSchema.safeParse({ futurosCargos: 'Gerente' })

  assert.ok(r.success)
  assert.deepEqual(r.data.futurosCargos, ['Gerente'])
})
