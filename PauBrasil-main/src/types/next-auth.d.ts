import 'next-auth'
import 'next-auth/jwt'

type AppRole  = 'USER' | 'GESTOR' | 'RH_ADMIN' | 'SYS_ADMIN'
type AppNivel = 'COLABORADOR' | 'SUPERVISOR' | 'COORDENADOR' | 'GERENTE' | 'DIRETOR' | 'DIRETO' | 'PRESIDENTE'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: AppRole
      nivel: AppNivel
      isActive: boolean
      isUPBAdmin: boolean
      isEmpresaAdmin: boolean
      faceReferenceUrl: string | null
      functionId: string | null
      company: string | null
      empresaId: string | null
      units: string[]
      operationIds: string[]
      photoUrl: string | null
      mustChangePassword: boolean
    }
  }

  interface User {
    id: string
    role: AppRole
    nivel: AppNivel
    isActive: boolean
    isUPBAdmin: boolean
    isEmpresaAdmin: boolean
    faceReferenceUrl: string | null
    functionId: string | null
    company: string | null
    empresaId: string | null
    units: string[]
    operationIds: string[]
    photoUrl: string | null
    mustChangePassword: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: AppRole
    nivel: AppNivel
    isActive: boolean
    isUPBAdmin: boolean
    isEmpresaAdmin: boolean
    faceReferenceUrl: string | null
    functionId: string | null
    company: string | null
    empresaId: string | null
    units: string[]
    operationIds: string[]
    photoUrl: string | null
    mustChangePassword: boolean
    lastValidatedAt?: number
  }
}
