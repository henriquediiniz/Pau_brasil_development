import assert from 'node:assert/strict'
import test from 'node:test'

import { CAMPOS_DO_CARGO, cargoPatchSchema, cargoSchema } from '../src/lib/gente/cargo'
import { SECOES_CARGO, VALORES_CARGO } from '../src/app/gente/cargos/_campos'

/**
 * O teste que dá sentido a `src/lib/gente/cargo.ts`.
 *
 * O bug que o originou: `frontline` entrou no formulário e no POST, e ficou de
 * fora do PATCH. Marcar a caixa não salvava nada — em silêncio, porque o zod
 * descarta chave desconhecida sem reclamar. O RH marcaria, salvaria, veria
 * "Atualizado", e a marca não estaria lá.
 */

const camposDoFormulario = SECOES_CARGO.flatMap((s) => s.campos)

test('todo campo do formulario existe no schema da API', () => {
  const noSchema = new Set(CAMPOS_DO_CARGO)

  for (const campo of camposDoFormulario) {
    assert.ok(
      noSchema.has(campo.nome),
      `"${campo.nome}" está no formulário e não no schema: seria enviado e descartado em silêncio`
    )
  }
})

test('todo campo do formulario tem valor inicial', () => {
  // Sem valor inicial o input nasce descontrolado e o React reclama na troca.
  for (const campo of camposDoFormulario) {
    assert.ok(campo.nome in VALORES_CARGO, `"${campo.nome}" não tem valor inicial em VALORES_CARGO`)
  }
})

test('o payload do formulario vazio e aceito na criacao', () => {
  // Reproduz a conversão de FormularioSimples: vazio vira null, checkbox vira
  // boolean, lista vira array.
  const corpo: Record<string, unknown> = {}
  for (const campo of camposDoFormulario) {
    const bruto = VALORES_CARGO[campo.nome] ?? ''
    if (campo.tipo === 'checkbox') corpo[campo.nome] = bruto === 'true'
    else if (campo.tipo === 'lista') corpo[campo.nome] = bruto.split(',').map((v) => v.trim()).filter(Boolean)
    else corpo[campo.nome] = bruto.trim() === '' ? null : bruto.trim()
  }
  // Os dois obrigatórios, que a tela exige antes de enviar.
  corpo.cargo = 'Ajudante de Armazém'
  corpo.area = 'Logística'

  const r = cargoSchema.safeParse(corpo)
  assert.ok(r.success, `criação recusou: ${JSON.stringify(r.success ? {} : r.error.flatten().fieldErrors)}`)
})

test('o mesmo payload e aceito na edicao', () => {
  const corpo: Record<string, unknown> = {}
  for (const campo of camposDoFormulario) {
    const bruto = VALORES_CARGO[campo.nome] ?? ''
    if (campo.tipo === 'checkbox') corpo[campo.nome] = bruto === 'true'
    else if (campo.tipo === 'lista') corpo[campo.nome] = bruto.split(',').map((v) => v.trim()).filter(Boolean)
    else corpo[campo.nome] = bruto.trim() === '' ? null : bruto.trim()
  }
  corpo.cargo = 'Ajudante de Armazém'
  corpo.area = 'Logística'

  const r = cargoPatchSchema.safeParse(corpo)
  assert.ok(r.success, `edição recusou: ${JSON.stringify(r.success ? {} : r.error.flatten().fieldErrors)}`)
})

test('frontline sobrevive a edicao — era o bug', () => {
  const r = cargoPatchSchema.safeParse({ frontline: true })

  assert.ok(r.success)
  assert.equal(r.data.frontline, true, 'o campo não pode ser descartado pelo schema')
})

test('a publicacao e os turnos sobrevivem a edicao', () => {
  const r = cargoPatchSchema.safeParse({
    publicarNoSite: true,
    grupoPublico: 'armazem',
    turnos: ['Diurno', 'Noturno'],
  })

  assert.ok(r.success)
  assert.equal(r.data.grupoPublico, 'armazem')
  assert.deepEqual(r.data.turnos, ['Diurno', 'Noturno'])
})

test('cargo e area seguem exigindo conteudo quando enviados', () => {
  // São a identidade do registro; um descritivo sem nome ou sem área não
  // existe. O formulário manda `null` para campo vazio, então o schema recusa.
  assert.equal(cargoPatchSchema.safeParse({ cargo: '' }).success, false)
  assert.equal(cargoPatchSchema.safeParse({ area: '' }).success, false)
  assert.equal(cargoPatchSchema.safeParse({ cargo: null }).success, false)

  // Mas não enviar continua válido: PATCH é parcial.
  assert.equal(cargoPatchSchema.safeParse({}).success, true)
})

test('campo desconhecido nao derruba o pedido — so e ignorado', () => {
  /*
    É o comportamento padrão do zod, e é o que fez o bug do `frontline` passar
    despercebido. Fica registrado aqui para quem investigar o próximo caso
    saber que a API não acusa campo sobrando.
  */
  const r = cargoPatchSchema.safeParse({ cargo: 'X', campoQueNaoExiste: 123 })

  assert.ok(r.success)
  assert.ok(!('campoQueNaoExiste' in r.data))
})
