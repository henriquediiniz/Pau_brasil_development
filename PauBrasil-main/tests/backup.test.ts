import assert from 'node:assert/strict'
import test from 'node:test'
import { gzipSync } from 'zlib'
import { createHash } from 'crypto'

import { EXPORT_ORDER, serializeRow } from '../src/lib/backup-export'
import { IMPORT_ORDER, validateBackup, decompressAndParse, type BackupPayload } from '../src/lib/backup-import'

// ─── helpers ─────────────────────────────────────────────────────────────────

function makePayload(overrides: Partial<BackupPayload> = {}): BackupPayload {
  const base: BackupPayload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    exportedBy: 'test',
    tables: { User: [] },
    rowCounts: { User: 0 },
    checksum: '',
  }
  const merged = { ...base, ...overrides }
  const { checksum: _c, ...rest } = merged
  merged.checksum = 'sha256:' + createHash('sha256').update(JSON.stringify({ ...rest, checksum: '' })).digest('hex')
  return merged
}

function makeCompressedPayload(overrides: Partial<BackupPayload> = {}): Buffer {
  return gzipSync(Buffer.from(JSON.stringify(makePayload(overrides)), 'utf-8'))
}

// ─── serializeRow ─────────────────────────────────────────────────────────────

test('serializeRow converte Date para ISO string', () => {
  const d = new Date('2026-01-15T12:00:00.000Z')
  const result = serializeRow({ createdAt: d })
  assert.equal(result.createdAt, '2026-01-15T12:00:00.000Z')
})

test('serializeRow converte BigInt para string', () => {
  const result = serializeRow({ sizeBytes: BigInt('9007199254740993') })
  assert.equal(result.sizeBytes, '9007199254740993')
})

test('serializeRow converte Decimal para string preservando precisão', () => {
  const fakeDecimal = { toFixed: () => '', toString: () => '12345.6789', valueOf: () => 12345.6789 }
  const result = serializeRow({ valor: fakeDecimal })
  assert.equal(result.valor, '12345.6789')
})

test('serializeRow preserva null e undefined', () => {
  const result = serializeRow({ a: null, b: undefined, c: 'ok' })
  assert.equal(result.a, null)
  assert.equal(result.b, undefined)
  assert.equal(result.c, 'ok')
})

test('serializeRow preserva strings e números comuns sem alterar', () => {
  const result = serializeRow({ name: 'Alice', age: 30, active: true })
  assert.deepEqual(result, { name: 'Alice', age: 30, active: true })
})

// ─── validateBackup ──────────────────────────────────────────────────────────

test('validateBackup aceita payload versão 2 válido', () => {
  assert.doesNotThrow(() => validateBackup(makePayload()))
})

test('validateBackup rejeita versão diferente de 2', () => {
  assert.throws(() => validateBackup({ version: 1, tables: {}, checksum: 'x' }), /Versão 1/)
})

test('validateBackup rejeita ausência de tables', () => {
  assert.throws(() => validateBackup({ version: 2, checksum: 'x' }), /tables/)
})

test('validateBackup rejeita ausência de checksum', () => {
  assert.throws(() => validateBackup({ version: 2, tables: {} }), /checksum/)
})

test('validateBackup rejeita null', () => {
  assert.throws(() => validateBackup(null), /inválido/)
})

// ─── decompressAndParse ───────────────────────────────────────────────────────

test('decompressAndParse descomprime e valida payload correto', () => {
  const buf = makeCompressedPayload()
  const result = decompressAndParse(buf)
  assert.equal(result.version, 2)
  assert.equal(result.exportedBy, 'test')
})

test('decompressAndParse rejeita checksum adulterado', () => {
  const payload = makePayload()
  payload.checksum = 'sha256:000'
  const buf = gzipSync(Buffer.from(JSON.stringify(payload), 'utf-8'))
  assert.throws(() => decompressAndParse(buf), /Checksum inválido/)
})

test('decompressAndParse rejeita payload não-gzip', () => {
  const buf = Buffer.from('{"version":2}', 'utf-8')
  assert.throws(() => decompressAndParse(buf))
})

// ─── consistência entre listas ────────────────────────────────────────────────

test('EXPORT_ORDER e IMPORT_ORDER contêm as mesmas tabelas', () => {
  assert.deepEqual(
    [...EXPORT_ORDER].sort(),
    [...IMPORT_ORDER].sort(),
    'As listas de export e import devem conter exatamente as mesmas tabelas',
  )
})

test('EXPORT_ORDER não tem duplicatas', () => {
  const seen = new Set<string>()
  for (const t of EXPORT_ORDER) {
    assert.equal(seen.has(t), false, `Tabela duplicada em EXPORT_ORDER: ${t}`)
    seen.add(t)
  }
})

test('SystemConfig está no EXPORT_ORDER (usa key como PK, não id)', () => {
  assert.ok(EXPORT_ORDER.includes('SystemConfig'))
})

test('BackupJob está no EXPORT_ORDER', () => {
  assert.ok(EXPORT_ORDER.includes('BackupJob'))
})

// ─── roundtrip gzip ───────────────────────────────────────────────────────────

test('roundtrip: payload com dados reais serializa e deserializa corretamente', () => {
  const payload = makePayload({
    tables: {
      User: [{ id: 'u1', name: 'Alice', createdAt: '2026-01-01T00:00:00.000Z' }],
      SystemConfig: [{ key: 'backup_enabled', value: 'true', updatedAt: '2026-01-01T00:00:00.000Z' }],
    },
    rowCounts: { User: 1, SystemConfig: 1 },
  })

  const buf = gzipSync(Buffer.from(JSON.stringify(payload), 'utf-8'))
  const result = decompressAndParse(buf)

  assert.equal(result.tables.User[0].name, 'Alice')
  assert.equal(result.tables.SystemConfig[0].key, 'backup_enabled')
  assert.equal(result.rowCounts.User, 1)
})
