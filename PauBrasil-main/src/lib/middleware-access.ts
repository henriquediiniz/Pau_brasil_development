import {
  canAccessGente,
  canManageEmpresa,
  hasGamificationAccess,
  isCoordLevel,
  isGestorLevel,
  isRhAdmin,
  isSysAdmin,
  isUpbAdmin,
  type SessionUser,
} from '@/lib/auth-helpers'

export function resolveMiddlewareRedirect(
  path: string,
  user: SessionUser | null,
  isActive: boolean | null | undefined
) {
  if (isActive === false) {
    return '/login?error=SessionRevoked'
  }

  const hasGamification = user ? hasGamificationAccess(user) : false

  if (!hasGamification && (path === '/app/inicio' || path === '/app/hoje')) {
    return user?.isEmpresaAdmin ? '/empresa' : '/universidade'
  }

  // Redireciona a rota legada /admin/rh para a URL limpa /talentos
  if (path.startsWith('/admin/rh')) {
    return '/talentos'
  }

  if (path.startsWith('/admin')) {
    const allowed = path.startsWith('/admin/upb')
      ? !!user && isUpbAdmin(user)
      : path.startsWith('/admin/usuarios')
      ? !!user && isRhAdmin(user)
      : !!user && isSysAdmin(user)

    if (!allowed) {
      return '/app/hoje'
    }
  }

  if (path.startsWith('/talentos')) {
    if (!user || !isRhAdmin(user)) return '/app/hoje'
  }

  if (path.startsWith('/gente')) {
    if (!user || !canAccessGente(user)) return '/app/hoje'
  }

  if (path.startsWith('/gestor')) {
    const allowed = !!user && isGestorLevel(user)
    if (!allowed) {
      return '/app/hoje'
    }
  }

  if (path.startsWith('/coord')) {
    const allowed = !!user && (isCoordLevel(user) || isSysAdmin(user))
    if (!allowed) {
      return '/app/hoje'
    }
  }

  if (path.startsWith('/empresa')) {
    const allowed = !!user && canManageEmpresa(user)
    if (!allowed) {
      return '/app/hoje'
    }
  }

  return null
}
