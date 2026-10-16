/**
 * CPF: normalização e validação.
 *
 * O CPF entra no quadro de pessoal porque o RH precisa dele para conferir a
 * folha. Dois cuidados moram aqui para não dependerem de quem chama lembrar
 * deles:
 *
 * 1. **Guardar só dígitos.** A planilha traz "123.456.789-09", "12345678909" e
 *    até com espaço. Formatos diferentes do mesmo CPF impediriam de reconhecer
 *    a mesma pessoa.
 * 2. **Recusar o inválido na importação**, não depois. Um CPF errado no banco
 *    vira conferência manual meses depois, quando ninguém lembra da linha.
 *
 * Quem vê: por decisão do PO, todo usuário com acesso ao módulo Gente vê o CPF
 * completo — não há máscara. A leitura do cadastro individual é auditada, que
 * é o que resta para saber quem consultou o quê.
 */

/** Só os dígitos. `null` quando não sobra nada. */
export function normalizarCpf(valor: string | null | undefined): string | null {
  if (valor === null || valor === undefined) return null
  const digitos = String(valor).replace(/\D/g, '')
  return digitos === '' ? null : digitos
}

/**
 * Valida pelos dois dígitos verificadores.
 *
 * Rejeita os 11 dígitos repetidos ("111.111.111-11"): passam no cálculo, mas
 * não são CPF de ninguém — costumam ser preenchimento de teste.
 */
export function cpfValido(digitos: string): boolean {
  if (!/^\d{11}$/.test(digitos)) return false
  if (/^(\d)\1{10}$/.test(digitos)) return false

  const numeros = digitos.split('').map(Number)

  for (const [tamanho, posicao] of [
    [9, 9],
    [10, 10],
  ] as const) {
    let soma = 0
    for (let i = 0; i < tamanho; i++) soma += numeros[i] * (tamanho + 1 - i)
    const resto = (soma * 10) % 11
    const esperado = resto === 10 || resto === 11 ? 0 : resto
    if (esperado !== numeros[posicao]) return false
  }

  return true
}

/** "12345678909" → "123.456.789-09". Devolve o que veio se não der. */
export function formatarCpf(digitos: string | null | undefined): string | null {
  if (!digitos) return null
  if (!/^\d{11}$/.test(digitos)) return digitos
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}
