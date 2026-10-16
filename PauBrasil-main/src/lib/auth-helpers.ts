/**
 * Centralized permission helpers — use these instead of inline role/nivel checks.
 * Import from here everywhere instead of repeating string arrays.
 */

import type { Session } from 'next-auth'

export type SessionUser = Session['user']
export const COORD_NIVELS = ['SUPERVISOR', 'COORDENADOR'] as const
export const GESTOR_NIVELS = ['GERENTE', 'DIRETOR', 'DIRETO', 'PRESIDENTE'] as const
export const DIRETORIA_NIVELS = ['DIRETOR', 'PRESIDENTE'] as const
export const SYSTEM_ADMIN_ROLES = ['SYS_ADMIN'] as const
export const GAMIFICATION_COMPANY = 'Distribuidora Pau Brasil' as const

type CoordNivel = (typeof COORD_NIVELS)[number]
type GestorNivel = (typeof GESTOR_NIVELS)[number]
type DiretoriaNivel = (typeof DIRETORIA_NIVELS)[number]
type SystemAdminRole = (typeof SYSTEM_ADMIN_ROLES)[number]

export function isCoordNivelValue(nivel: SessionUser['nivel'] | string | null | undefined) {
  return COORD_NIVELS.includes(nivel as CoordNivel)
}

export function isGestorNivelValue(nivel: SessionUser['nivel'] | string | null | undefined) {
  return GESTOR_NIVELS.includes(nivel as GestorNivel)
}

export function isDiretoriaNivelValue(nivel: SessionUser['nivel'] | string | null | undefined) {
  return DIRETORIA_NIVELS.includes(nivel as DiretoriaNivel)
}

export function canManageTeamByNivel(nivel: SessionUser['nivel'] | string | null | undefined) {
  return isCoordNivelValue(nivel) || isGestorNivelValue(nivel)
}

export function isSystemAdminRole(role: SessionUser['role'] | string | null | undefined) {
  return SYSTEM_ADMIN_ROLES.includes(role as SystemAdminRole)
}

/** Legacy global role kept for backward compatibility */
export function isLegacyGestorRole(u: SessionUser) {
  return u.role === 'GESTOR'
}

/** Full platform administrator. RH_ADMIN is handled separately by isRhAdmin. */
export function isSysAdmin(u: SessionUser) {
  return isSystemAdminRole(u.role)
}

/** Gestor-level hierarchy (can manage a team, approve tasks) */
export function isGestorLevel(u: SessionUser) {
  return isSysAdmin(u) || isLegacyGestorRole(u) || isGestorNivelValue(u.nivel)
}

/** Coordinator/supervisor level */
export function isCoordLevel(u: SessionUser) {
  return isCoordNivelValue(u.nivel)
}

/** Diretoria level */
export function isDiretoriaLevel(u: SessionUser) {
  return isDiretoriaNivelValue(u.nivel)
}

/** Can manage a team (gestor or coord) */
export function canManageTeam(u: SessionUser) {
  return isGestorLevel(u) || isCoordLevel(u)
}

/** Can manage task definitions in legacy gestor flows */
export function canManageActivityDefinitions(u: SessionUser) {
  return isGestorLevel(u)
}

/** Can manage Universidade content */
export function isUpbAdmin(u: SessionUser) {
  return isSysAdmin(u) || u.isUPBAdmin === true
}

/** Can manage empresa/tenant data */
export function canManageEmpresa(u: SessionUser) {
  return isSysAdmin(u) || u.isEmpresaAdmin === true
}

/** Can access resources scoped by allowed company names */
export function canAccessCompanyScope(u: SessionUser, companies: readonly string[] | null | undefined) {
  return isSysAdmin(u) || (!!u.company && !!companies?.includes(u.company))
}

/** Can access the full gamification shell */
export function hasGamificationAccess(u: SessionUser) {
  return isSysAdmin(u) || isRhAdmin(u) || u.company === GAMIFICATION_COMPANY
}

/** Can view audit data */
export function canViewAudit(u: SessionUser) {
  return isSysAdmin(u) || isDiretoriaLevel(u)
}

/** Can manage people/RH surfaces — RH_ADMIN or SYS_ADMIN */
export function isRhAdmin(u: SessionUser) {
  return u.role === 'RH_ADMIN' || isSysAdmin(u)
}

// ─── Gente: recrutamento e quadro ─────────────────────────────────────────────
// O módulo guarda dado sensível (laudo de PCD, salário), então o padrão aqui é
// fail-closed: quem não foi explicitamente habilitado não vê nada.

/** Pode abrir o módulo Gente (`/gente`). */
export function canAccessGente(u: SessionUser) {
  return isRhAdmin(u)
}

/** Pode criar, editar e importar dados do módulo Gente. */
export function canManageGente(u: SessionUser) {
  return isRhAdmin(u)
}

/**
 * Pode ver dado sensível: laudo de PCD (art. 11 LGPD) e salário de vaga.
 * Toda leitura protegida por este helper deve passar por `audit()`.
 *
 * Hoje coincide com `canAccessGente`. A separação existe porque na Fase 3 o
 * acesso ao módulo abre para gestores solicitantes, e eles não podem herdar
 * o acesso ao dado sensível junto.
 */
export function canViewDadoSensivel(u: SessionUser) {
  return isRhAdmin(u)
}

/**
 * Operações que o usuário enxerga no módulo Gente.
 * Retorna `null` quando não há restrição (SYS_ADMIN vê todas).
 *
 * Para RH_ADMIN a lista é a de `operationIds`, e uma lista vazia significa
 * **nenhuma operação**, não "todas". Isso é deliberado: um usuário de RH
 * recém-criado não deve enxergar a base inteira por omissão de cadastro.
 */
export function escopoOperacoesGente(u: SessionUser): string[] | null {
  if (isSysAdmin(u)) return null
  return u.operationIds ?? []
}
