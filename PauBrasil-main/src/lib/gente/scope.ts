/**
 * Escopo de leitura e escrita do módulo Gente.
 *
 * No app do RH o isolamento entre operações era o prefixo da chave montado no
 * navegador. Aqui ele é uma cláusula `where` aplicada no servidor em TODA
 * query — nenhuma tela decide sozinha o que pode ver.
 */

import {
  canAccessGente,
  escopoOperacoesGente,
  isSysAdmin,
  type SessionUser,
} from '@/lib/auth-helpers'

export type EscopoGente =
  /** Vê tudo, em todas as empresas e operações (SYS_ADMIN). */
  | { tipo: 'todas' }
  /** Vê apenas as operações listadas, dentro da própria empresa. */
  | { tipo: 'operacoes'; operacaoIds: string[]; empresaId: string | null }
  /** Não vê nada — cadastro sem operação atribuída. */
  | { tipo: 'nenhuma' }

export function resolverEscopoGente(u: SessionUser): EscopoGente {
  const operacaoIds = escopoOperacoesGente(u)
  if (operacaoIds === null) return { tipo: 'todas' }
  if (operacaoIds.length === 0) return { tipo: 'nenhuma' }
  return { tipo: 'operacoes', operacaoIds, empresaId: u.empresaId ?? null }
}

/**
 * Cláusula `where` do escopo, para combinar com os filtros da tela.
 * Retorna `null` quando o usuário não enxerga nada — o chamador deve responder
 * lista vazia (na leitura) ou 403 (na escrita) em vez de consultar o banco.
 *
 * Registros com `operacaoId` nulo só aparecem para SYS_ADMIN. É por isso que o
 * importador trata operação não reconhecida como erro bloqueante: nada deve
 * entrar sem dono.
 */
export function whereEscopoGente(u: SessionUser): Record<string, unknown> | null {
  const escopo = resolverEscopoGente(u)

  if (escopo.tipo === 'todas') return {}
  if (escopo.tipo === 'nenhuma') return null

  const where: Record<string, unknown> = { operacaoId: { in: escopo.operacaoIds } }
  if (escopo.empresaId) where.empresaId = escopo.empresaId
  return where
}

/**
 * Escopo de **leitura do plano de sucessão** — a exceção do módulo.
 *
 * Sucessão é assunto do grupo, não da unidade: quem é de Patos precisa
 * enxergar quem está sendo preparado em Sumé, Sousa ou Brumado, senão o mapa
 * de quem cobre cada cargo crítico fica pela metade em toda revenda. Decisão
 * do PO em 2026-09-22.
 *
 * Duas fronteiras continuam de pé, de propósito:
 * - **A empresa.** O corte por `empresaId` permanece; "o grupo" é a empresa,
 *   e uma segunda empresa no futuro não deve enxergar a primeira.
 * - **A escrita.** Isto libera só a leitura. Editar, excluir e importar
 *   continuam presos às operações do usuário (`podeEscreverNaOperacao`).
 */
export function whereGrupoGente(u: SessionUser): Record<string, unknown> | null {
  if (isSysAdmin(u)) return {}
  if (!canAccessGente(u)) return null

  // Sem empresa no cadastro não dá para delimitar o grupo — fail-closed.
  return u.empresaId ? { empresaId: u.empresaId } : null
}

/** O usuário pode gravar nesta operação? */
export function podeEscreverNaOperacao(u: SessionUser, operacaoId: string | null | undefined): boolean {
  if (isSysAdmin(u)) return true
  if (!operacaoId) return false // só SYS_ADMIN cria registro sem operação

  const escopo = resolverEscopoGente(u)
  return escopo.tipo === 'operacoes' && escopo.operacaoIds.includes(operacaoId)
}

/** Empresa em que o usuário grava. SYS_ADMIN precisa informar explicitamente. */
export function empresaPadraoGente(u: SessionUser): string | null {
  return u.empresaId ?? null
}
