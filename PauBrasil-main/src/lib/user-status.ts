export type InviteStatus = 'ACTIVE' | 'INVITED' | 'EXPIRED'

export function getInviteStatus(user: {
  isActive: boolean
  mustChangePassword: boolean
  passwordResetExpiresAt: Date | string | null
}): InviteStatus {
  if (!user.isActive) return 'ACTIVE'
  if (!user.mustChangePassword) return 'ACTIVE'
  const exp = user.passwordResetExpiresAt ? new Date(user.passwordResetExpiresAt) : null
  if (!exp || exp < new Date()) return 'EXPIRED'
  return 'INVITED'
}
