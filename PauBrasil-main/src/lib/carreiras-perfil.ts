/**
 * Perfil de triagem do candidato: gênero, idade e escolaridade.
 *
 * Pedido do RH (2026-09-30): triar o Banco de Talentos sem abrir o currículo de
 * cada pessoa. Até aqui o único recorte era "vaga exclusiva PCD / Mulheres",
 * gravado como prefixo dentro da mensagem livre.
 *
 * Os valores são texto validado contra as listas abaixo, e não enum do banco:
 * a lista de escolaridade, por exemplo, pode ganhar uma faixa sem migration.
 * Quem garante que só entra valor conhecido é o Zod das rotas.
 *
 * Idade não é gravada — vira errada no aniversário. Grava-se a data de
 * nascimento, e a idade é calculada na hora de mostrar e de filtrar.
 */

// ─── Gênero ───────────────────────────────────────────────────────────────────

/**
 * "Prefiro não informar" é opção de primeira classe, não ausência de resposta:
 * a pergunta é obrigatória no formulário, e ninguém deve ser forçado a declarar
 * o próprio gênero para se candidatar.
 */
export const GENEROS = [
  { valor: 'FEMININO', rotulo: 'Feminino' },
  { valor: 'MASCULINO', rotulo: 'Masculino' },
  { valor: 'OUTRO', rotulo: 'Outro' },
  { valor: 'NAO_INFORMADO', rotulo: 'Prefiro não informar' },
] as const

export type Genero = (typeof GENEROS)[number]['valor']
export const VALORES_GENERO = GENEROS.map((g) => g.valor) as [Genero, ...Genero[]]

// ─── Escolaridade ─────────────────────────────────────────────────────────────

/** Em ordem crescente — a ordem é usada nos selects. */
export const ESCOLARIDADES = [
  { valor: 'FUNDAMENTAL_INCOMPLETO', rotulo: 'Fundamental incompleto' },
  { valor: 'FUNDAMENTAL_COMPLETO', rotulo: 'Fundamental completo' },
  { valor: 'MEDIO_INCOMPLETO', rotulo: 'Médio incompleto' },
  { valor: 'MEDIO_COMPLETO', rotulo: 'Médio completo' },
  { valor: 'TECNICO', rotulo: 'Técnico' },
  { valor: 'SUPERIOR_INCOMPLETO', rotulo: 'Superior incompleto' },
  { valor: 'SUPERIOR_COMPLETO', rotulo: 'Superior completo' },
  { valor: 'POS_GRADUACAO', rotulo: 'Pós-graduação' },
] as const

export type Escolaridade = (typeof ESCOLARIDADES)[number]['valor']
export const VALORES_ESCOLARIDADE = ESCOLARIDADES.map((e) => e.valor) as [
  Escolaridade,
  ...Escolaridade[],
]

export function rotuloGenero(valor: string | null | undefined): string | null {
  return GENEROS.find((g) => g.valor === valor)?.rotulo ?? null
}

export function rotuloEscolaridade(valor: string | null | undefined): string | null {
  return ESCOLARIDADES.find((e) => e.valor === valor)?.rotulo ?? null
}

// ─── Idade ────────────────────────────────────────────────────────────────────

/**
 * Menor idade aceita. Aos 14 começa a aprendizagem (Lei 10.097/2000), e a
 * empresa contrata jovem aprendiz — abaixo disso não há vaga possível.
 */
export const IDADE_MINIMA = 14
/** Acima disso é quase certamente erro de digitação do ano. */
export const IDADE_MAXIMA = 90

/**
 * Idade completa em anos numa data.
 *
 * Compara ano, mês e dia em UTC: a data de nascimento é gravada como data
 * pura (`@db.Date`, meia-noite UTC), e ler em fuso local a jogaria para o dia
 * anterior no Brasil — a pessoa faria aniversário um dia antes na tela.
 */
export function calcularIdade(nascimento: Date, hoje: Date = new Date()): number {
  let idade = hoje.getUTCFullYear() - nascimento.getUTCFullYear()
  const mes = hoje.getUTCMonth() - nascimento.getUTCMonth()
  if (mes < 0 || (mes === 0 && hoje.getUTCDate() < nascimento.getUTCDate())) idade--
  return idade
}

/**
 * Lê "AAAA-MM-DD" (o que o `<input type="date">` entrega) como data pura em
 * UTC. Devolve `null` para formato inválido ou data que não existe (31/02).
 */
export function lerDataNascimento(texto: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto)
  if (!m) return null
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  // Date.UTC "conserta" 31/02 para 03/03 em silêncio; aqui isso é recusado.
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
    return null
  }
  return data
}

export function idadeAceita(nascimento: Date, hoje: Date = new Date()): boolean {
  const idade = calcularIdade(nascimento, hoje)
  return idade >= IDADE_MINIMA && idade <= IDADE_MAXIMA
}

// ─── Faixas etárias (filtro do RH) ────────────────────────────────────────────

export const FAIXAS_ETARIAS = [
  { valor: 'ATE_17', rotulo: '14 a 17 anos', de: IDADE_MINIMA, ate: 17 },
  { valor: '18_24', rotulo: '18 a 24 anos', de: 18, ate: 24 },
  { valor: '25_34', rotulo: '25 a 34 anos', de: 25, ate: 34 },
  { valor: '35_44', rotulo: '35 a 44 anos', de: 35, ate: 44 },
  { valor: '45_MAIS', rotulo: '45 anos ou mais', de: 45, ate: IDADE_MAXIMA },
] as const


/**
 * Faixa etária → intervalo de datas de nascimento, para filtrar no banco.
 *
 * Quem tem entre `de` e `ate` anos hoje nasceu depois de (hoje − ate − 1 anos)
 * e até (hoje − de anos), inclusive. Filtrar pela data no banco, e não pela
 * idade calculada em memória, mantém a paginação correta.
 */
export function intervaloDeNascimento(
  faixa: string,
  hoje: Date = new Date()
): { gt: Date; lte: Date } | null {
  const f = FAIXAS_ETARIAS.find((x) => x.valor === faixa)
  if (!f) return null

  const menosAnos = (anos: number) =>
    new Date(Date.UTC(hoje.getUTCFullYear() - anos, hoje.getUTCMonth(), hoje.getUTCDate()))

  return { gt: menosAnos(f.ate + 1), lte: menosAnos(f.de) }
}

/**
 * Tamanho máximo do currículo em PDF. A Vercel corta requisições acima de 4,5 MB,
 * então 4 MB é o teto real; a tela e as duas rotas (ler e enviar) usam este valor.
 */
export const CV_MAX_BYTES = 4 * 1024 * 1024
export const CV_MAX_TEXTO = '4 MB'
