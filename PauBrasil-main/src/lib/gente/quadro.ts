/**
 * Quadro de pessoal: QLP (quem está) e desligamentos (quem saiu).
 *
 * São duas telas no app do RH, mas um assunto só — e ligadas por um fluxo:
 * desligar alguém do quadro gera o registro de desligamento e tira a pessoa
 * da lotação, numa transação.
 */

import { z } from '@/lib/zod'

import { cpfValido, normalizarCpf } from './cpf'

export const colaboradorSchema = z.object({
  operacaoId: z.string().min(1, 'Operação é obrigatória'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  cargo: z.string().nullish(),
  area: z.string().nullish(),
  matricula: z.string().nullish(),
  /*
    Guarda só dígitos, venha como vier da tela ou da planilha: formatos
    diferentes do mesmo CPF impediriam de reconhecer a mesma pessoa. Vazio
    continua vazio — o CPF não é obrigatório.
  */
  cpf: z
    .preprocess((v) => (typeof v === 'string' ? normalizarCpf(v) : v), z.string().nullish())
    .refine((v) => !v || cpfValido(v), 'CPF inválido'),
  dataAdmissao: z.coerce.date().nullish(),
  ativo: z.boolean().default(true),
  userId: z.string().nullish(),
})

export const colaboradorPatchSchema = colaboradorSchema.partial()

export const desligamentoSchema = z.object({
  operacaoId: z.string().min(1, 'Operação é obrigatória'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  cargo: z.string().nullish(),
  area: z.string().nullish(),
  setor: z.enum(['DPO', 'SPO']).nullish(),
  dataDesligamento: z.coerce.date(),
  motivo: z.string().nullish(),
  userId: z.string().nullish(),
})

export const desligamentoPatchSchema = desligamentoSchema.partial()

/** Corpo do fluxo "desligar do quadro": vira um desligamento e sai da lotação. */
export const registrarDesligamentoSchema = z.object({
  dataDesligamento: z.coerce.date(),
  motivo: z.string().nullish(),
  setor: z.enum(['DPO', 'SPO']).nullish(),
})

export const SELECT_COLABORADOR = {
  id: true,
  empresaId: true,
  operacaoId: true,
  userId: true,
  nome: true,
  cargo: true,
  area: true,
  matricula: true,
  cpf: true,
  dataAdmissao: true,
  ativo: true,
  createdAt: true,
  updatedAt: true,
  operacao: { select: { id: true, nome: true } },
  user: { select: { id: true, name: true, email: true, isActive: true } },
} as const

export const SELECT_DESLIGAMENTO = {
  id: true,
  empresaId: true,
  operacaoId: true,
  userId: true,
  nome: true,
  cargo: true,
  area: true,
  setor: true,
  dataDesligamento: true,
  motivo: true,
  createdAt: true,
  updatedAt: true,
  operacao: { select: { id: true, nome: true } },
} as const

/**
 * Turnover do período: saídas sobre o quadro médio.
 *
 * Usa o quadro ativo atual como aproximação do quadro médio — o modelo não
 * guarda histórico de headcount, então uma média real exigiria fotografias
 * mensais. Fica registrado para não passar por precisão que não temos.
 */
export function calcularTurnover(desligamentos: number, quadroAtivo: number): number | null {
  if (quadroAtivo <= 0) return null
  return Math.round((desligamentos / quadroAtivo) * 1000) / 10
}
