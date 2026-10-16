/**
 * Forma como uma vaga é lida e validada nas rotas.
 *
 * Fica fora do arquivo de rota de propósito: route handlers do App Router só
 * podem exportar métodos HTTP e configuração, e esta parte é compartilhada
 * entre a listagem, o detalhe e a importação.
 */

import { z } from 'zod'
import { calcularSlaVaga, type RecVagaStatusValue } from './vaga-sla'

export const STATUS_VAGA = ['ABERTA', 'FECHADA', 'CANCELADA'] as const

export const STATUS_FECHAMENTO = [
  'ABERTA_NO_PRAZO',
  'ABERTA_VENCIDA',
  'FECHADA_NO_PRAZO',
  'FECHADA_FORA_PRAZO',
] as const

export const vagaSchema = z.object({
  operacaoId: z.string().min(1, 'Operação é obrigatória'),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  /*
    Vínculo com o descritivo. Opcional porque nem todo cargo tem descritivo
    ainda, e uma vaga urgente não pode esperar o RH escrever um.

    Quando vem preenchido, é ele que liga vaga e descritivo — e não o nome
    digitado, que é como o verificador de aderência, o Frontline e o destaque
    da página de carreiras se viravam até aqui. Nome digitado erra por acento,
    abreviação e turno; id não erra.
  */
  cargoId: z.string().nullish(),
  area: z.string().nullish(),
  departamento: z.enum(['DPO', 'SPO']).nullish(),
  salario: z.number().nonnegative().nullish(),
  localTrabalho: z.string().nullish(),
  horario: z.string().nullish(),
  quantidadeVagas: z.number().int().min(1).default(1),
  informacoesComplementares: z.string().nullish(),
  requisitosMinimos: z.string().nullish(),
  formacao: z.string().nullish(),
  motivoSolicitacao: z.string().nullish(),
  codigo: z.string().nullish(),
  frontline: z.string().nullish(),
  colaboradorAnterior: z.string().nullish(),
  dataDesligamento: z.coerce.date().nullish(),
  dataAbertura: z.coerce.date(),
  dataPrevistaFechamento: z.coerce.date().nullish(),
  dataContratacao: z.coerce.date().nullish(),
  encerradaEm: z.coerce.date().nullish(),
  responsavelVaga: z.string().nullish(),
  solicitanteVaga: z.string().nullish(),
  nomeContratado: z.string().nullish(),
  status: z.enum(STATUS_VAGA).default('ABERTA'),
  statusFechamentoManual: z.enum(STATUS_FECHAMENTO).nullish(),
  andamentoProcesso: z.string().nullish(),
})

/** Edição: todo campo é opcional, mas `operacaoId` continua validado se vier. */
export const vagaPatchSchema = vagaSchema.partial()

export const SELECT_VAGA = {
  id: true,
  empresaId: true,
  operacaoId: true,
  unidadeTexto: true,
  departamento: true,
  cargo: true,
  cargoId: true,
  area: true,
  salario: true,
  localTrabalho: true,
  horario: true,
  quantidadeVagas: true,
  informacoesComplementares: true,
  requisitosMinimos: true,
  formacao: true,
  motivoSolicitacao: true,
  codigo: true,
  frontline: true,
  colaboradorAnterior: true,
  dataDesligamento: true,
  dataAbertura: true,
  dataPrevistaFechamento: true,
  dataContratacao: true,
  encerradaEm: true,
  responsavelVaga: true,
  solicitanteVaga: true,
  nomeContratado: true,
  status: true,
  statusFechamentoManual: true,
  andamentoProcesso: true,
  createdAt: true,
  updatedAt: true,
  operacao: { select: { id: true, nome: true } },
} as const

export interface VagaDoBanco {
  salario: unknown
  status: string
  dataAbertura: Date
  dataPrevistaFechamento: Date | null
  dataContratacao: Date | null
  encerradaEm: Date | null
  statusFechamentoManual: string | null
  [k: string]: unknown
}

/**
 * Acrescenta o SLA derivado e omite o salário de quem não pode vê-lo.
 *
 * O salário é removido aqui, na serialização, e não na cláusula `select`, para
 * que exista um único lugar responsável por decidir isso.
 */
export function serializarVaga(vaga: VagaDoBanco, podeVerSalario: boolean) {
  const { salario, ...resto } = vaga

  const sla = calcularSlaVaga({
    status: vaga.status as RecVagaStatusValue,
    dataAbertura: vaga.dataAbertura,
    dataPrevistaFechamento: vaga.dataPrevistaFechamento,
    dataContratacao: vaga.dataContratacao,
    encerradaEm: vaga.encerradaEm,
    statusFechamentoManual: vaga.statusFechamentoManual as never,
  })

  return {
    ...resto,
    ...(podeVerSalario ? { salario: salario === null ? null : Number(salario) } : {}),
    sla,
  }
}
