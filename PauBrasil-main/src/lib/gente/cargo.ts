/**
 * Contrato do descritivo de cargo: o que a API aceita e o que ela devolve.
 *
 * Estava duplicado dentro de `api/gente/cargos/route.ts` e
 * `api/gente/cargos/[id]/route.ts`, e as duas cópias divergiram: o campo
 * `frontline` entrou no formulário e no POST, e ficou de fora do PATCH.
 * Resultado — marcar a caixa não salvava nada, em silêncio.
 *
 * Com o schema num lugar só, `tests/gente-cargo-contrato.test.ts` confere que
 * **todo campo do formulário tem lugar aqui**. Campo novo no cadastro que
 * ninguém declarou na API quebra o teste, e não o uso.
 */

import { z } from '@/lib/zod'
import { listaDeTexto } from './lista-campo'

/** Os campos que o formulário de descritivo envia. */
export const cargoSchema = z.object({
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  area: z.string().min(1, 'Área é obrigatória'),
  tipoVaga: z.string().nullish(),
  descricaoAtividades: z.string().nullish(),
  competenciasSugeridas: z.string().nullish(),
  experienciaSugerida: z.string().nullish(),
  formacao: z.string().nullish(),
  statusCurso: z.string().nullish(),
  curso: z.string().nullish(),
  exigencias: z.string().nullish(),
  observacoes: z.string().nullish(),
  etapasProcesso: z.string().nullish(),
  testes: z.string().nullish(),
  precisaAderenciaRaio: z.boolean().default(false),
  frontline: z.boolean().default(false),

  // ── Publicação na página de carreiras ──
  publicarNoSite: z.boolean().default(true),
  grupoPublico: z.string().nullish(),
  turnos: listaDeTexto(),

  ativo: z.boolean().default(true),
})

/**
 * Edição: os mesmos campos, todos opcionais.
 *
 * `cargo` e `area` seguem exigindo conteúdo **quando enviados** — o formulário
 * manda `null` para campo vazio, e um descritivo sem nome ou sem área não
 * existe. Os dois são a identidade do registro.
 */
export const cargoPatchSchema = cargoSchema.partial()

/** O que a API devolve. Não inclui `empresaId`: escopo é decidido no servidor. */
export const SELECT_CARGO = {
  id: true,
  cargo: true,
  area: true,
  tipoVaga: true,
  descricaoAtividades: true,
  competenciasSugeridas: true,
  experienciaSugerida: true,
  formacao: true,
  statusCurso: true,
  curso: true,
  exigencias: true,
  observacoes: true,
  etapasProcesso: true,
  testes: true,
  precisaAderenciaRaio: true,
  frontline: true,
  publicarNoSite: true,
  grupoPublico: true,
  turnos: true,
  ativo: true,
  createdAt: true,
  updatedAt: true,
} as const

/** Os nomes que o schema aceita, para o teste de coerência com o formulário. */
export const CAMPOS_DO_CARGO = Object.keys(cargoSchema.shape)
