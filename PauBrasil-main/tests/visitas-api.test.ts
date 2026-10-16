import assert from 'node:assert/strict'
import test from 'node:test'
import { haversineMeters } from '../src/lib/geo'
import {
  processCheckin,
  getDashboardPayload,
  getLiderHistory,
  cadastrarFace,
} from '../src/lib/visitas-api'
import type { Operation, LeaderVisit, CheckinDeps } from '../src/lib/visitas-api'

// ── Helpers ──────────────────────────────────────────────────────────────────

const PATOS_OP: Operation = {
  slug: 'patos',
  name: 'Patos',
  latitude: -7.0153,
  longitude: -37.2816,
  radiusMeters: 200,
}

function makeVisit(overrides: Partial<LeaderVisit> = {}): LeaderVisit & {
  user: { id: string; name: string; leaderTitle: string | null; photoUrl: string | null }
} {
  return {
    id: 'v1',
    userId: 'user1',
    operationSlug: 'patos',
    operationName: 'Patos',
    checkedInAt: new Date(),
    latitude: -7.0153,
    longitude: -37.2816,
    gpsValid: true,
    faceValid: true,
    status: 'valid',
    photoUrl: null,
    user: { id: 'user1', name: 'João', leaderTitle: 'CFO', photoUrl: null },
    ...overrides,
  }
}

function makeCheckinDeps(overrides: Partial<CheckinDeps> = {}): CheckinDeps {
  return {
    findOperation: async () => PATOS_OP,
    createVisit: async () => ({ id: 'visit-new' }),
    uploadPhoto: async () => 'https://cdn.example.com/photo.jpg',
    ...overrides,
  }
}

// ── haversineMeters ───────────────────────────────────────────────────────────

test('haversine — mesma coordenada retorna 0', () => {
  assert.equal(haversineMeters(-7.0153, -37.2816, -7.0153, -37.2816), 0)
})

test('haversine — 1 grau de latitude ≈ 111km', () => {
  const dist = haversineMeters(0, 0, 1, 0)
  assert.ok(dist > 110_000 && dist < 112_000, `Esperado ~111km, obtido ${dist}m`)
})

test('haversine — distância é simétrica', () => {
  const ab = haversineMeters(-7.0, -37.0, -7.1, -37.1)
  const ba = haversineMeters(-7.1, -37.1, -7.0, -37.0)
  assert.ok(Math.abs(ab - ba) < 1, 'Distância deve ser simétrica')
})

test('haversine — coordenadas dentro de 200m produz valor menor que 200', () => {
  // ~100m ao norte de Patos
  const dist = haversineMeters(-7.0153, -37.2816, -7.0144, -37.2816)
  assert.ok(dist < 200, `Esperado < 200m, obtido ${Math.round(dist)}m`)
})

test('haversine — coordenadas a 1km produz valor maior que 200', () => {
  // ~1km ao norte de Patos
  const dist = haversineMeters(-7.0153, -37.2816, -7.0063, -37.2816)
  assert.ok(dist > 200, `Esperado > 200m, obtido ${Math.round(dist)}m`)
})

// ── processCheckin — autenticação ────────────────────────────────────────────

test('checkin — 401 sem sessão', async () => {
  const result = await processCheckin(null, {}, makeCheckinDeps())
  assert.equal(result.status, 401)
})

test('checkin — 401 com sessão sem user', async () => {
  const result = await processCheckin({ user: null }, {}, makeCheckinDeps())
  assert.equal(result.status, 401)
})

// ── processCheckin — validação de body ───────────────────────────────────────

test('checkin — 400 sem operationSlug', async () => {
  const result = await processCheckin(
    { user: { id: 'u1' } },
    { latitude: -7.0153, longitude: -37.2816, faceValid: true },
    makeCheckinDeps(),
  )
  assert.equal(result.status, 400)
  assert.match((result.body as any).error, /incompletos/)
})

test('checkin — 400 sem latitude', async () => {
  const result = await processCheckin(
    { user: { id: 'u1' } },
    { operationSlug: 'patos', longitude: -37.2816, faceValid: true },
    makeCheckinDeps(),
  )
  assert.equal(result.status, 400)
})

// ── processCheckin — operação não encontrada ─────────────────────────────────

test('checkin — 404 quando operação não existe', async () => {
  const result = await processCheckin(
    { user: { id: 'u1' } },
    { operationSlug: 'inexistente', latitude: -7.0153, longitude: -37.2816 },
    makeCheckinDeps({ findOperation: async () => null }),
  )
  assert.equal(result.status, 404)
  assert.match((result.body as any).error, /Operação não encontrada/)
})

// ── processCheckin — GPS inválido ────────────────────────────────────────────

test('checkin — 422 quando GPS fora do raio', async () => {
  let created: any = null
  const result = await processCheckin(
    { user: { id: 'u1' } },
    { operationSlug: 'patos', latitude: -7.1000, longitude: -37.2816, faceValid: true },
    makeCheckinDeps({
      createVisit: async data => { created = data; return { id: 'v-blocked' } },
    }),
  )
  assert.equal(result.status, 422)
  assert.match((result.body as any).error, /Patos/)
  assert.ok((result.body as any).distanceMeters > 200)
  assert.equal(created?.status, 'blocked_gps')
  assert.equal(created?.gpsValid, false)
})

// ── processCheckin — face inválida ───────────────────────────────────────────

test('checkin — 422 quando GPS ok mas face inválida', async () => {
  let created: any = null
  const result = await processCheckin(
    { user: { id: 'u1' } },
    { operationSlug: 'patos', latitude: -7.0153, longitude: -37.2816, faceValid: false },
    makeCheckinDeps({
      createVisit: async data => { created = data; return { id: 'v-face' } },
    }),
  )
  assert.equal(result.status, 422)
  assert.match((result.body as any).error, /Rosto/)
  assert.equal(created?.status, 'blocked_face')
  assert.equal(created?.gpsValid, true)
  assert.equal(created?.faceValid, false)
})

// ── processCheckin — sucesso ─────────────────────────────────────────────────

test('checkin — 200 com GPS e face válidos', async () => {
  const result = await processCheckin(
    { user: { id: 'u1' } },
    { operationSlug: 'patos', latitude: -7.0153, longitude: -37.2816, faceValid: true },
    makeCheckinDeps(),
  )
  assert.equal(result.status, 200)
  assert.equal((result.body as any).ok, true)
  assert.ok((result.body as any).visitId)
})

test('checkin — salva visita com status valid', async () => {
  let created: any = null
  await processCheckin(
    { user: { id: 'u1' } },
    { operationSlug: 'patos', latitude: -7.0153, longitude: -37.2816, faceValid: true },
    makeCheckinDeps({
      createVisit: async data => { created = data; return { id: 'v1' } },
    }),
  )
  assert.equal(created?.status, 'valid')
  assert.equal(created?.gpsValid, true)
  assert.equal(created?.faceValid, true)
  assert.equal(created?.userId, 'u1')
  assert.equal(created?.operationName, 'Patos')
})

test('checkin — faz upload da foto quando presente', async () => {
  let uploadCalled = false
  let created: any = null
  await processCheckin(
    { user: { id: 'u1' } },
    { operationSlug: 'patos', latitude: -7.0153, longitude: -37.2816, faceValid: true, photoBase64: 'data:image/jpeg;base64,abc' },
    makeCheckinDeps({
      uploadPhoto: async () => { uploadCalled = true; return 'https://cdn.example.com/ok.jpg' },
      createVisit: async data => { created = data; return { id: 'v1' } },
    }),
  )
  assert.equal(uploadCalled, true)
  assert.equal(created?.photoUrl, 'https://cdn.example.com/ok.jpg')
})

test('checkin — falha no upload não bloqueia check-in', async () => {
  const result = await processCheckin(
    { user: { id: 'u1' } },
    { operationSlug: 'patos', latitude: -7.0153, longitude: -37.2816, faceValid: true, photoBase64: 'data:image/jpeg;base64,abc' },
    makeCheckinDeps({
      uploadPhoto: async () => { throw new Error('Upload falhou') },
    }),
  )
  assert.equal(result.status, 200)
})

// ── getDashboardPayload ───────────────────────────────────────────────────────

test('dashboard — 401 sem sessão', async () => {
  const result = await getDashboardPayload(null, {}, { findVisits: async () => [] })
  assert.equal(result.status, 401)
})

test('dashboard — 403 sem isSysAdmin', async () => {
  const result = await getDashboardPayload(
    { user: { id: 'u1', isSysAdmin: false } },
    {},
    { findVisits: async () => [] },
  )
  assert.equal(result.status, 403)
})

test('dashboard — 200 retorna visitas e summary', async () => {
  const visits = [makeVisit(), makeVisit({ id: 'v2', operationSlug: 'sousa', operationName: 'Sousa' })]
  const result = await getDashboardPayload(
    { user: { id: 'admin', isSysAdmin: true } },
    {},
    { findVisits: async () => visits },
  )
  assert.equal(result.status, 200)
  const body = result.body as any
  assert.equal(body.summary.total, 2)
  assert.equal(Array.isArray(body.visits), true)
  assert.equal(body.visits.length, 2)
})

test('dashboard — summary.thisMonth conta só visitas do mês atual', async () => {
  const thisMonth = makeVisit({ checkedInAt: new Date() })
  const lastYear = makeVisit({ id: 'v2', checkedInAt: new Date('2020-01-01') })
  const result = await getDashboardPayload(
    { user: { id: 'admin', isSysAdmin: true } },
    {},
    { findVisits: async () => [thisMonth, lastYear] },
  )
  assert.equal((result.body as any).summary.thisMonth, 1)
})

test('dashboard — byOperation agrupa corretamente', async () => {
  const visits = [
    makeVisit({ operationName: 'Patos' }),
    makeVisit({ id: 'v2', operationName: 'Patos' }),
    makeVisit({ id: 'v3', operationName: 'Sousa' }),
  ]
  const result = await getDashboardPayload(
    { user: { id: 'admin', isSysAdmin: true } },
    {},
    { findVisits: async () => visits },
  )
  const byOp = (result.body as any).summary.byOperation
  assert.equal(byOp[0].name, 'Patos')
  assert.equal(byOp[0].count, 2)
  assert.equal(byOp[1].name, 'Sousa')
  assert.equal(byOp[1].count, 1)
})

test('dashboard — passa filtros para deps.findVisits', async () => {
  let capturedFilters: any = null
  await getDashboardPayload(
    { user: { id: 'admin', isSysAdmin: true } },
    { userId: 'u1', operationSlug: 'patos', status: 'valid', month: '2026-04' },
    { findVisits: async filters => { capturedFilters = filters; return [] } },
  )
  assert.equal(capturedFilters.userId, 'u1')
  assert.equal(capturedFilters.operationSlug, 'patos')
  assert.equal(capturedFilters.status, 'valid')
  assert.ok(capturedFilters.from instanceof Date)
  assert.equal(capturedFilters.from.getMonth(), 3) // abril = índice 3
  assert.ok(capturedFilters.to instanceof Date)
})

// ── getLiderHistory ───────────────────────────────────────────────────────────

test('lider — 401 sem sessão', async () => {
  const result = await getLiderHistory(null, 'u1', { findVisits: async () => [] })
  assert.equal(result.status, 401)
})

test('lider — 403 quando outro usuário sem admin', async () => {
  const result = await getLiderHistory(
    { user: { id: 'u2', isSysAdmin: false } },
    'u1',
    { findVisits: async () => [] },
  )
  assert.equal(result.status, 403)
})

test('lider — 200 quando o próprio usuário acessa', async () => {
  const result = await getLiderHistory(
    { user: { id: 'u1', isSysAdmin: false } },
    'u1',
    { findVisits: async () => [makeVisit()] },
  )
  assert.equal(result.status, 200)
})

test('lider — 200 quando admin acessa histórico de outro', async () => {
  const result = await getLiderHistory(
    { user: { id: 'admin', isSysAdmin: true } },
    'u1',
    { findVisits: async () => [makeVisit()] },
  )
  assert.equal(result.status, 200)
})

test('lider — totals.byOperation agrega por slug', async () => {
  const visits = [
    makeVisit({ operationSlug: 'patos', operationName: 'Patos' }),
    makeVisit({ id: 'v2', operationSlug: 'patos', operationName: 'Patos' }),
    makeVisit({ id: 'v3', operationSlug: 'sousa', operationName: 'Sousa' }),
  ]
  const result = await getLiderHistory(
    { user: { id: 'u1' } },
    'u1',
    { findVisits: async () => visits },
  )
  const { byOperation } = (result.body as any).totals
  assert.equal(byOperation[0].slug, 'patos')
  assert.equal(byOperation[0].count, 2)
  assert.equal(byOperation[1].slug, 'sousa')
  assert.equal(byOperation[1].count, 1)
})

test('lider — retorna lista vazia sem erro quando não há visitas', async () => {
  const result = await getLiderHistory(
    { user: { id: 'u1' } },
    'u1',
    { findVisits: async () => [] },
  )
  assert.equal(result.status, 200)
  assert.deepEqual((result.body as any).visits, [])
  assert.deepEqual((result.body as any).totals.byOperation, [])
})

// ── cadastrarFace ─────────────────────────────────────────────────────────────

test('cadastrarFace — 401 sem sessão', async () => {
  const result = await cadastrarFace(null, 'data:image/jpeg;base64,abc', {
    uploadPhoto: async () => 'url',
    updateUser: async () => {},
  })
  assert.equal(result.status, 401)
})

test('cadastrarFace — 400 sem foto', async () => {
  const result = await cadastrarFace(
    { user: { id: 'u1' } },
    undefined,
    { uploadPhoto: async () => 'url', updateUser: async () => {} },
  )
  assert.equal(result.status, 400)
  assert.match((result.body as any).error, /Foto/)
})

test('cadastrarFace — 200 salva URL no usuário', async () => {
  let updatedId = ''
  let updatedUrl = ''
  const result = await cadastrarFace(
    { user: { id: 'u1' } },
    'data:image/jpeg;base64,abc',
    {
      uploadPhoto: async () => 'https://cdn.example.com/face.jpg',
      updateUser: async (id, url) => { updatedId = id; updatedUrl = url },
    },
  )
  assert.equal(result.status, 200)
  assert.equal((result.body as any).ok, true)
  assert.equal((result.body as any).faceReferenceUrl, 'https://cdn.example.com/face.jpg')
  assert.equal(updatedId, 'u1')
  assert.equal(updatedUrl, 'https://cdn.example.com/face.jpg')
})

test('cadastrarFace — 400 quando upload falha', async () => {
  const result = await cadastrarFace(
    { user: { id: 'u1' } },
    'data:image/jpeg;base64,abc',
    {
      uploadPhoto: async () => { throw new Error('Cloudinary indisponível') },
      updateUser: async () => {},
    },
  )
  assert.equal(result.status, 400)
  assert.match((result.body as any).error, /Cloudinary/)
})

test('cadastrarFace — não chama updateUser se upload falha', async () => {
  let updateCalled = false
  await cadastrarFace(
    { user: { id: 'u1' } },
    'data:image/jpeg;base64,abc',
    {
      uploadPhoto: async () => { throw new Error('Falhou') },
      updateUser: async () => { updateCalled = true },
    },
  )
  assert.equal(updateCalled, false)
})
