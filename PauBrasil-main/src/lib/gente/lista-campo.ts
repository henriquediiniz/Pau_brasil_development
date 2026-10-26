import { z } from '@/lib/zod'

/**
 * Campo de lista que também aceita o texto digitado no formulário.
 *
 * O bug que originou isto: `futurosCargos` é array no banco, mas o campo da
 * tela mandava a string "Gerente de Vendas;". O POST recusava o cadastro
 * inteiro com "Dados inválidos: Futuros cargos", enquanto o PATCH funcionava
 * — porque a rota de edição tinha um `split` improvisado que a de criação não
 * tinha. O mesmo já havia acontecido com `turnos` no descritivo de cargo.
 *
 * A lição das duas vezes é a mesma: enquanto o formato depender de a tela e a
 * rota combinarem, uma hora elas desencontram. Aceitar as duas formas aqui
 * fecha o assunto para toda rota que use o schema, inclusive as futuras.
 *
 * Vírgula e ponto e vírgula separam igual — quem digita não decora qual o
 * campo aceita.
 */
export function listaDeTexto() {
  return z.preprocess((v) => {
    if (typeof v === 'string') {
      return v
        .split(/[;,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    }
    // Campo vazio chega como `null` quando a tela não o declara como lista.
    // Vira lista vazia: array é sempre array, e o Prisma recusa null aqui.
    if (v === null || v === undefined) return undefined
    return v
  }, z.array(z.string()).default([]))
}
