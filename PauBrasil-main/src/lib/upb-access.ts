import type { SessionUser } from '@/lib/auth-helpers'

type UpbAudienceScope = {
  empresas?: readonly string[] | null
  unidades?: readonly string[] | null
}

type UpbEnrollmentScope = UpbAudienceScope & {
  funcoesComAcesso?: readonly string[] | null
  restricaoAcesso?: boolean
}

export function canAccessUpbAudience(user: SessionUser, scope: UpbAudienceScope) {
  const empresas = scope.empresas ?? []
  const unidades = scope.unidades ?? []
  const userUnits = user.units ?? []

  const empresaOk = empresas.length === 0 || (!!user.company && empresas.includes(user.company))
  const unidadeOk = unidades.length === 0 || userUnits.some((unit) => unidades.includes(unit))

  return empresaOk && unidadeOk
}

export function hasUpbFunctionAccess(user: SessionUser, scope: UpbEnrollmentScope) {
  return !!user.functionId && !!scope.funcoesComAcesso?.includes(user.functionId)
}

export function getUpbEnrollmentStatus(
  user: SessionUser,
  scope: UpbEnrollmentScope,
  matriculaStatus: string | null | undefined
) {
  if (hasUpbFunctionAccess(user, scope)) {
    return 'APROVADO'
  }

  return matriculaStatus ?? null
}

export function canAccessUpbSeason(
  user: SessionUser,
  scope: UpbEnrollmentScope,
  matriculaStatus: string | null | undefined
) {
  if (!canAccessUpbAudience(user, scope)) {
    return false
  }

  if (!scope.restricaoAcesso) {
    return true
  }

  return getUpbEnrollmentStatus(user, scope, matriculaStatus) === 'APROVADO'
}
