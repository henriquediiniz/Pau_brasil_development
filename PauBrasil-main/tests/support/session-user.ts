import type { SessionUser } from '../../src/lib/auth-helpers'

export function buildSessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    nivel: 'COLABORADOR',
    isActive: true,
    isUPBAdmin: false,
    isEmpresaAdmin: false,
    faceReferenceUrl: null,
    functionId: null,
    company: 'Outra Companhia',
    empresaId: 'empresa-1',
    units: ['Matriz'],
    operationIds: [],
    photoUrl: null,
    ...overrides,
  }
}
