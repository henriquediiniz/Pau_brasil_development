/**
 * Forma como um candidato do processo seletivo é lido e validado nas rotas.
 * Fora do arquivo de rota porque é compartilhado entre lista, detalhe,
 * importação e a promoção vinda do Banco de Talentos.
 */

import { z } from '@/lib/zod'
import { resumirEtapas, type EtapaRegistrada } from './etapas'

export const SITUACOES = [
  'EM_STAND_BY',
  'EM_ANDAMENTO',
  'CONTRATADO',
  'INDISPONIVEL',
  'NAO_CONTRATADO',
] as const

export type SituacaoCandidato = (typeof SITUACOES)[number]

export const SITUACAO_LABEL: Record<SituacaoCandidato, string> = {
  EM_STAND_BY: 'Em stand-by',
  EM_ANDAMENTO: 'Em andamento',
  CONTRATADO: 'Contratado',
  INDISPONIVEL: 'Indisponível',
  NAO_CONTRATADO: 'Não contratado',
}

export const ORIGENS = [
  'PORTAL_CARREIRAS',
  'APLICATIVO',
  'WHATSAPP',
  'EMAIL',
  'INDICACAO',
  'OUTRO',
] as const

export type OrigemCurriculo = (typeof ORIGENS)[number]

export const ORIGEM_LABEL: Record<OrigemCurriculo, string> = {
  PORTAL_CARREIRAS: 'Portal de carreiras',
  APLICATIVO: 'Aplicativo',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  INDICACAO: 'Indicação',
  OUTRO: 'Outro',
}

/** Situações que encerram o processo — exigem data para o histórico fechar. */
export const SITUACOES_FINAIS: readonly SituacaoCandidato[] = [
  'CONTRATADO',
  'NAO_CONTRATADO',
  'INDISPONIVEL',
]

export const candidatoSchema = z.object({
  operacaoId: z.string().min(1, 'Operação é obrigatória'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  cargo: z.string().nullish(),
  telefone: z.string().nullish(),
  email: z.string().email('E-mail inválido').nullish().or(z.literal('')),
  mesProcesso: z.string().nullish(),
  setor: z.enum(['DPO', 'SPO']).nullish(),
  escolaridade: z.string().nullish(),
  habilidades: z.string().nullish(),
  residencia: z.string().nullish(),
  observacao: z.string().nullish(),
  origemCurriculo: z.enum(ORIGENS).default('OUTRO'),
  quemIndicou: z.string().nullish(),
  situacao: z.enum(SITUACOES).default('EM_STAND_BY'),
  situacaoFinal: z.enum(SITUACOES).nullish(),
  dataSituacaoFinal: z.coerce.date().nullish(),
  vagaId: z.string().nullish(),
})

export const candidatoPatchSchema = candidatoSchema.partial()

export const etapaSchema = z.object({
  chave: z.string().min(1).max(60),
  resultado: z.enum(['OK', 'NAO', 'NA']),
  observacao: z.string().max(2000).nullish(),
})

export const SELECT_CANDIDATO = {
  id: true,
  empresaId: true,
  operacaoId: true,
  candidaturaId: true,
  vagaId: true,
  nome: true,
  cargo: true,
  telefone: true,
  email: true,
  mesProcesso: true,
  setor: true,
  escolaridade: true,
  habilidades: true,
  residencia: true,
  observacao: true,
  origemCurriculo: true,
  quemIndicou: true,
  cvUrl: true,
  cvPublicId: true,
  cvOriginalFilename: true,
  cvMimeType: true,
  cvSizeBytes: true,
  situacao: true,
  situacaoFinal: true,
  dataSituacaoFinal: true,
  createdAt: true,
  updatedAt: true,
  operacao: { select: { id: true, nome: true } },
  vaga: { select: { id: true, cargo: true, cargoId: true, status: true } },
  etapas: {
    select: {
      chave: true,
      resultado: true,
      observacao: true,
      avaliadoEm: true,
      avaliador: { select: { id: true, name: true } },
    },
  },
} as const

export interface CandidatoDoBanco {
  cvUrl: unknown
  cvPublicId: unknown
  etapas: { chave: string; resultado: string; observacao: string | null; avaliadoEm: Date | null }[]
  [k: string]: unknown
}

/**
 * Acrescenta o resumo das etapas e **nunca devolve a URL crua do currículo**.
 *
 * O CV é dado pessoal: a URL sai só pela rota dedicada, que assina o acesso e
 * registra em auditoria. Aqui a tela recebe apenas a informação de que existe
 * currículo, para decidir se mostra o botão.
 */
export function serializarCandidato(candidato: CandidatoDoBanco) {
  const { cvUrl, cvPublicId, ...resto } = candidato

  return {
    ...resto,
    temCurriculo: !!cvUrl || !!cvPublicId,
    resumoEtapas: resumirEtapas(candidato.etapas as unknown as EtapaRegistrada[]),
  }
}
