/**
 * Gestão de PCD e de jovens aprendizes.
 *
 * O laudo de PCD é dado de saúde (art. 11 da LGPD) — exatamente o que estava
 * publicamente exposto no Firestore do app antigo. Aqui ele nunca aparece numa
 * listagem: vai para blob privado e só sai por rota dedicada, atrás de
 * `canViewDadoSensivel` e com auditoria gravada antes de servir.
 */

import { z } from 'zod'
import { calcularVigencia } from './cotas'

export const pcdSchema = z.object({
  operacaoId: z.string().min(1, 'Operação é obrigatória'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  admissao: z.coerce.date().nullish(),
  funcao: z.string().nullish(),
  tipo: z.string().nullish(),
  deficiencia: z.string().nullish(),
  sexo: z.string().nullish(),
  cor: z.string().nullish(),
  ativo: z.boolean().default(true),
  userId: z.string().nullish(),
})

export const pcdPatchSchema = pcdSchema.partial()

export const pcdMetaSchema = z.object({
  operacaoId: z.string().min(1, 'Operação é obrigatória'),
  ano: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
  meta: z.number().int().min(0).default(0),
  real: z.number().int().min(0).default(0),
})

export const aprendizSchema = z.object({
  operacaoId: z.string().min(1, 'Operação é obrigatória'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  admissao: z.coerce.date().nullish(),
  funcao: z.string().nullish(),
  centroCusto: z.string().nullish(),
  departamento: z.string().nullish(),
  setor: z.enum(['DPO', 'SPO']).nullish(),
  sexo: z.string().nullish(),
  dataNascimento: z.coerce.date().nullish(),
  gestorNome: z.string().nullish(),
  gestorId: z.string().nullish(),
  fundacao: z.string().nullish(),
  horario: z.string().nullish(),
  inicioContrato: z.coerce.date().nullish(),
  terminoContrato: z.coerce.date().nullish(),
  situacao: z.enum(['VIGENTE', 'ENCERRADO', 'DESLIGADO']).default('VIGENTE'),
  userId: z.string().nullish(),
})

export const aprendizPatchSchema = aprendizSchema.partial()

/** O laudo NUNCA entra neste select — ver `serializarPcd`. */
export const SELECT_PCD = {
  id: true,
  empresaId: true,
  operacaoId: true,
  userId: true,
  nome: true,
  admissao: true,
  funcao: true,
  tipo: true,
  deficiencia: true,
  sexo: true,
  cor: true,
  ativo: true,
  laudoBlobKey: true,
  laudoOriginalFilename: true,
  laudoMimeType: true,
  laudoSizeBytes: true,
  createdAt: true,
  updatedAt: true,
  operacao: { select: { id: true, nome: true } },
} as const

export const SELECT_APRENDIZ = {
  id: true,
  empresaId: true,
  operacaoId: true,
  userId: true,
  nome: true,
  admissao: true,
  funcao: true,
  centroCusto: true,
  departamento: true,
  setor: true,
  sexo: true,
  dataNascimento: true,
  gestorNome: true,
  gestorId: true,
  fundacao: true,
  horario: true,
  inicioContrato: true,
  terminoContrato: true,
  situacao: true,
  createdAt: true,
  updatedAt: true,
  operacao: { select: { id: true, nome: true } },
} as const

export interface PcdDoBanco {
  laudoBlobKey: unknown
  [k: string]: unknown
}

/**
 * Remove a chave do laudo antes de qualquer resposta.
 *
 * A tela só precisa saber se existe laudo, para decidir se mostra o botão.
 * A chave do blob é o endereço do dado de saúde — não sai daqui.
 */
export function serializarPcd(pcd: PcdDoBanco) {
  const { laudoBlobKey, ...resto } = pcd
  return { ...resto, temLaudo: !!laudoBlobKey }
}

export interface AprendizDoBanco {
  terminoContrato: Date | null
  [k: string]: unknown
}

export function serializarAprendiz(aprendiz: AprendizDoBanco, hoje: Date = new Date()) {
  return { ...aprendiz, vigencia: calcularVigencia(aprendiz.terminoContrato, hoje) }
}

/** Extensões aceitas para o laudo. PDF e imagem cobrem o que o RH recebe. */
export const LAUDO_MIME_ACEITOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const LAUDO_TAMANHO_MAXIMO = 10 * 1024 * 1024 // 10 MB
