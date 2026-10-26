import { prisma } from './prisma'
import { gzipSync } from 'zlib'
import { createHash } from 'crypto'

import { MODELOS_BACKUP } from './backup-modelos'

/** Tabelas na ordem das chaves estrangeiras, derivada do schema (ver backup-modelos.ts). */
export const EXPORT_ORDER = MODELOS_BACKUP.map((m) => m.nome)

export function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) {
      result[k] = v
    } else if (v instanceof Uint8Array) {
      // Bytes (ex.: fotos da newsletter): base64 marcado, para o import reconstruir o binário
      result[k] = { $bytes: Buffer.from(v).toString('base64') }
    } else if (typeof v === 'bigint') {
      result[k] = v.toString()
    } else if (v instanceof Date) {
      result[k] = v.toISOString()
    } else if (typeof v === 'object' && 'toFixed' in v && typeof (v as any).toFixed === 'function') {
      // Prisma Decimal
      result[k] = (v as any).toString()
    } else {
      result[k] = v
    }
  }
  return result
}

async function exportTable(tableName: string): Promise<unknown[]> {
  const modelo = MODELOS_BACKUP.find((m) => m.nome === tableName)
  if (!modelo) return []
  const delegate = (prisma as any)[modelo.delegate]
  if (!delegate?.findMany) return []

  // Lotes menores em tabelas com binário, para não segurar centenas de fotos na memória de uma vez
  const lote = modelo.binarios.length ? 25 : 500
  const rows: unknown[] = []
  let cursor: unknown

  while (true) {
    const batch: Record<string, unknown>[] = await delegate.findMany({
      take: lote,
      ...(cursor !== undefined ? { skip: 1, cursor: { [modelo.chave]: cursor } } : {}),
      orderBy: { [modelo.chave]: 'asc' },
    })
    if (batch.length === 0) break
    rows.push(...batch.map(serializeRow))
    if (batch.length < lote) break
    cursor = batch[batch.length - 1][modelo.chave]
  }

  return rows
}

export async function buildBackupBuffer(triggeredBy: string): Promise<{
  buffer: Buffer
  rowCounts: Record<string, number>
}> {
  const tables: Record<string, unknown[]> = {}
  const rowCounts: Record<string, number> = {}

  for (const tableName of EXPORT_ORDER) {
    const rows = await exportTable(tableName)
    tables[tableName] = rows
    rowCounts[tableName] = rows.length
  }

  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    exportedBy: triggeredBy,
    tables,
    rowCounts,
    checksum: '',
  }

  const jsonStr = JSON.stringify(payload)
  const checksum = 'sha256:' + createHash('sha256').update(jsonStr).digest('hex')
  payload.checksum = checksum

  const finalJson = JSON.stringify(payload)
  const buffer = gzipSync(Buffer.from(finalJson, 'utf-8'))

  return { buffer, rowCounts }
}
