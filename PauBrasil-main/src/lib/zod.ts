import { z } from 'zod'

// Mensagens padrão de validação em português ("Too small: expected string..." aparecia para o usuário).
// Importe `z` daqui, e não de 'zod', para a configuração valer em todo lugar.
z.config(z.locales.pt())

export { z }
export type { ZodError, ZodIssue, ZodType } from 'zod'

/**
 * Resumo legível de um erro de validação, para o campo `error` das respostas.
 * As telas exibem `error` como texto; os erros por campo vão em `detalhes`.
 */
export function mensagemDeValidacao(error: { issues: { message: string }[] }) {
  const mensagens = Array.from(new Set(error.issues.map((issue) => issue.message)))
  return mensagens.slice(0, 3).join(' · ') || 'Dados inválidos'
}
