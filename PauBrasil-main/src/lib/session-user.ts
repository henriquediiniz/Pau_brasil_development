import type { SessionUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

const EFFECTIVE_USER_SELECT = {
  role: true,
  nivel: true,
  isActive: true,
  isUPBAdmin: true,
  isEmpresaAdmin: true,
  functionId: true,
  company: true,
  empresaId: true,
  units: true,
  operationIds: true,
  photoUrl: true,
} as const

export async function getEffectiveSessionUser(user: SessionUser) {
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: EFFECTIVE_USER_SELECT,
  })

  return {
    ...user,
    role: fresh?.role ?? user.role,
    nivel: fresh?.nivel ?? user.nivel,
    isActive: fresh?.isActive ?? user.isActive,
    isUPBAdmin: fresh?.isUPBAdmin ?? user.isUPBAdmin,
    isEmpresaAdmin: fresh?.isEmpresaAdmin ?? user.isEmpresaAdmin,
    functionId: fresh ? fresh.functionId : user.functionId,
    company: fresh ? fresh.company : user.company,
    empresaId: fresh ? fresh.empresaId : user.empresaId,
    units: fresh?.units ?? user.units,
    operationIds: fresh?.operationIds ?? user.operationIds,
    photoUrl: fresh ? fresh.photoUrl : user.photoUrl,
  }
}
