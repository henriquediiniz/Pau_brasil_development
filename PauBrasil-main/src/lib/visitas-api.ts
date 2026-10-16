import { haversineMeters } from './geo'

// ── Types ────────────────────────────────────────────────────────────────────

export interface VisitasSession {
  user?: { id: string; isSysAdmin?: boolean } | null
}

export interface Operation {
  slug: string
  name: string
  latitude: number
  longitude: number
  radiusMeters: number
}

export interface LeaderVisit {
  id: string
  userId: string
  operationSlug: string
  operationName: string
  checkedInAt: Date
  photoUrl?: string | null
  latitude: number
  longitude: number
  gpsValid: boolean
  faceValid: boolean
  status: string
}

export interface CheckinDeps {
  findOperation: (slug: string) => Promise<Operation | null>
  createVisit: (data: Omit<LeaderVisit, 'id' | 'checkedInAt'>) => Promise<{ id: string }>
  uploadPhoto: (base64: string) => Promise<string>
}

export interface DashboardDeps {
  findVisits: (filters: {
    userId?: string
    operationSlug?: string
    status?: string
    from?: Date
    to?: Date
  }) => Promise<(LeaderVisit & { user: { id: string; name: string; leaderTitle: string | null; photoUrl: string | null } })[]>
}

export interface LiderDeps {
  findVisits: (userId: string) => Promise<LeaderVisit[]>
}

export interface CadastrarFaceDeps {
  uploadPhoto: (base64: string) => Promise<string>
  updateUser: (userId: string, faceReferenceUrl: string) => Promise<void>
}

// ── Check-in ─────────────────────────────────────────────────────────────────

export async function processCheckin(
  session: VisitasSession | null,
  body: {
    operationSlug?: string
    latitude?: number
    longitude?: number
    photoBase64?: string
    faceValid?: boolean
  },
  deps: CheckinDeps,
) {
  if (!session?.user) return { status: 401, body: { error: 'Unauthorized' } }

  const { operationSlug, latitude, longitude, photoBase64, faceValid } = body

  if (!operationSlug || latitude == null || longitude == null) {
    return { status: 400, body: { error: 'Dados incompletos' } }
  }

  const operation = await deps.findOperation(operationSlug)
  if (!operation) return { status: 404, body: { error: 'Operação não encontrada' } }

  const distance = Math.round(haversineMeters(latitude, longitude, operation.latitude, operation.longitude))
  const gpsValid = distance <= operation.radiusMeters

  if (!gpsValid) {
    await deps.createVisit({
      userId: session.user.id,
      operationSlug,
      operationName: operation.name,
      latitude, longitude,
      gpsValid: false,
      faceValid: false,
      status: 'blocked_gps',
    })
    return {
      status: 422,
      body: {
        error: `Você está a ${distance}m da filial ${operation.name}. Raio permitido: ${operation.radiusMeters}m.`,
        distanceMeters: distance,
      },
    }
  }

  if (!faceValid) {
    await deps.createVisit({
      userId: session.user.id,
      operationSlug,
      operationName: operation.name,
      latitude, longitude,
      gpsValid: true,
      faceValid: false,
      status: 'blocked_face',
    })
    return { status: 422, body: { error: 'Rosto não reconhecido.' } }
  }

  let photoUrl: string | undefined
  if (photoBase64) {
    try { photoUrl = await deps.uploadPhoto(photoBase64) } catch { /* não bloqueia */ }
  }

  const visit = await deps.createVisit({
    userId: session.user.id,
    operationSlug,
    operationName: operation.name,
    latitude, longitude,
    gpsValid: true,
    faceValid: true,
    status: 'valid',
    photoUrl,
  })

  return { status: 200, body: { ok: true, visitId: visit.id } }
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardPayload(
  session: VisitasSession | null,
  filters: { userId?: string; operationSlug?: string; month?: string; status?: string },
  deps: DashboardDeps,
) {
  if (!session?.user) return { status: 401, body: { error: 'Unauthorized' } }
  if (!session.user.isSysAdmin) return { status: 403, body: { error: 'Forbidden' } }

  let from: Date | undefined
  let to: Date | undefined
  if (filters.month) {
    const [year, m] = filters.month.split('-').map(Number)
    from = new Date(year, m - 1, 1)
    to   = new Date(year, m, 1)
  }

  const visits = await deps.findVisits({
    userId: filters.userId,
    operationSlug: filters.operationSlug,
    status: filters.status,
    from, to,
  })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonth = visits.filter(v => v.checkedInAt >= startOfMonth).length

  const byOperation = Object.entries(
    visits.reduce((acc: Record<string, number>, v) => {
      acc[v.operationName] = (acc[v.operationName] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)

  const byLeader = Object.entries(
    visits.reduce((acc: Record<string, { name: string; leaderTitle: string | null; count: number }>, v) => {
      if (!acc[v.userId]) acc[v.userId] = { name: v.user.name, leaderTitle: v.user.leaderTitle, count: 0 }
      acc[v.userId].count++
      return acc
    }, {}),
  ).map(([id, data]) => ({ id, ...data }))

  return {
    status: 200,
    body: { visits, summary: { total: visits.length, thisMonth, byOperation, byLeader } },
  }
}

// ── Histórico do líder ───────────────────────────────────────────────────────

export async function getLiderHistory(
  session: VisitasSession | null,
  targetUserId: string,
  deps: LiderDeps,
) {
  if (!session?.user) return { status: 401, body: { error: 'Unauthorized' } }
  if (!session.user.isSysAdmin && session.user.id !== targetUserId) {
    return { status: 403, body: { error: 'Forbidden' } }
  }

  const visits = await deps.findVisits(targetUserId)

  const byOperation: Record<string, { slug: string; name: string; count: number }> = {}
  for (const v of visits) {
    if (!byOperation[v.operationSlug]) {
      byOperation[v.operationSlug] = { slug: v.operationSlug, name: v.operationName, count: 0 }
    }
    byOperation[v.operationSlug].count++
  }

  return {
    status: 200,
    body: {
      visits,
      totals: { byOperation: Object.values(byOperation).sort((a, b) => b.count - a.count) },
    },
  }
}

// ── Cadastrar face ───────────────────────────────────────────────────────────

export async function cadastrarFace(
  session: VisitasSession | null,
  photoBase64: string | undefined,
  deps: CadastrarFaceDeps,
) {
  if (!session?.user) return { status: 401, body: { error: 'Unauthorized' } }
  if (!photoBase64) return { status: 400, body: { error: 'Foto não fornecida' } }

  let faceReferenceUrl: string
  try {
    faceReferenceUrl = await deps.uploadPhoto(photoBase64)
  } catch (e: any) {
    return { status: 400, body: { error: e.message ?? 'Upload falhou' } }
  }

  await deps.updateUser(session.user.id, faceReferenceUrl)
  return { status: 200, body: { ok: true, faceReferenceUrl } }
}
