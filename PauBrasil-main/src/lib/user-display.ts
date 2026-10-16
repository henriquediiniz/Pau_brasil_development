export const ROLE_LABELS = {
  USER: 'Colaborador',
  GESTOR: 'Gestor',
  RH_ADMIN: 'RH Admin',
  SYS_ADMIN: 'Administrador',
} as const

export const NIVEL_LABELS = {
  COLABORADOR: 'Colaborador',
  SUPERVISOR: 'Supervisor',
  COORDENADOR: 'Coordenador',
  GERENTE: 'Gerente',
  DIRETOR: 'Diretor',
  DIRETO: 'Direto',
  PRESIDENTE: 'Presidente',
} as const

export const ADMIN_NIVEL_OPTIONS = [
  'COLABORADOR',
  'SUPERVISOR',
  'COORDENADOR',
  'GERENTE',
  'DIRETOR',
  'DIRETO',
  'PRESIDENTE',
] as const

export const EMPRESA_NIVEL_OPTIONS = [
  'COLABORADOR',
  'COORDENADOR',
  'GERENTE',
  'DIRETOR',
  'PRESIDENTE',
] as const

export function getRoleLabel(role: string | null | undefined) {
  return role ? ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role : '—'
}

export function getNivelLabel(nivel: string | null | undefined) {
  return nivel ? NIVEL_LABELS[nivel as keyof typeof NIVEL_LABELS] ?? nivel : '—'
}

export function getUnitsLabel(units: readonly string[] | null | undefined, fallback = 'Não informado') {
  return units && units.length > 0 ? units.join(', ') : fallback
}
