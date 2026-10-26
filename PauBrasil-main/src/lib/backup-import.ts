import { prisma } from './prisma'
import { gunzipSync } from 'zlib'
import { createHash } from 'crypto'

import { MODELOS_BACKUP, modeloBackup } from './backup-modelos'

/** Mesma ordem do export: pais antes dos filhos (derivada do schema). */
export const IMPORT_ORDER = MODELOS_BACKUP.map((m) => m.nome)

/** Reconstrói os campos binários que o export gravou como `{ $bytes: base64 }`. */
export function desserializarLinha(row: Record<string, unknown>, binarios: string[]) {
  if (!binarios.length) return row
  const copia = { ...row }
  for (const campo of binarios) {
    const valor = copia[campo] as { $bytes?: string } | null | undefined
    if (valor && typeof valor === 'object' && typeof valor.$bytes === 'string') {
      copia[campo] = Buffer.from(valor.$bytes, 'base64')
    }
  }
  return copia
}

export interface BackupPayload {
  version: number
  exportedAt: string
  exportedBy: string
  tables: Record<string, Record<string, unknown>[]>
  rowCounts: Record<string, number>
  checksum: string
}

export interface ImportResult {
  rowCounts: Record<string, number>
  errors: string[]
  dryRun: boolean
}

export function validateBackup(data: unknown): asserts data is BackupPayload {
  if (!data || typeof data !== 'object') throw new Error('Formato inválido')
  const d = data as Record<string, unknown>
  if (d.version !== 2) throw new Error(`Versão ${d.version} não suportada (esperado: 2)`)
  if (!d.tables || typeof d.tables !== 'object') throw new Error('Campo "tables" ausente')
  if (!d.checksum || typeof d.checksum !== 'string') throw new Error('Campo "checksum" ausente')
}

export function decompressAndParse(compressed: Buffer): BackupPayload {
  const jsonStr = gunzipSync(compressed).toString('utf-8')
  const data = JSON.parse(jsonStr)
  validateBackup(data)

  // Verify checksum
  const { checksum, ...rest } = data
  const computedJson = JSON.stringify({ ...rest, checksum: '' })
  const expected = 'sha256:' + createHash('sha256').update(computedJson).digest('hex')
  if (checksum !== expected) throw new Error('Checksum inválido — arquivo corrompido ou adulterado')

  return data
}

async function upsertBatch(
  modelKey: string,
  rows: Record<string, unknown>[],
  chave: string,
  nullifyFields?: string[],
): Promise<number> {
  const delegate = (prisma as any)[modelKey]
  if (!delegate?.upsert) return 0

  let count = 0
  for (const rawRow of rows) {
    const row = nullifyFields?.length
      ? { ...rawRow, ...Object.fromEntries(nullifyFields.map(f => [f, null])) }
      : rawRow

    try {
      await delegate.upsert({
        where: { [chave]: row[chave] },
        update: row,
        create: row,
      })
      count++
    } catch {
      // Skip rows that fail (e.g. FK not yet resolved) — import continues
    }
  }
  return count
}

async function applyTwoPassUpdates(
  modelKey: string,
  rows: Record<string, unknown>[],
  chave: string,
  selfRefFields: string[],
): Promise<void> {
  const delegate = (prisma as any)[modelKey]
  if (!delegate?.update) return

  const rowsWithSelfRef = rows.filter(r => selfRefFields.some(f => r[f] != null))
  for (const row of rowsWithSelfRef) {
    const data = Object.fromEntries(selfRefFields.filter(f => row[f] != null).map(f => [f, row[f]]))
    try {
      await delegate.update({ where: { [chave]: row[chave] }, data })
    } catch {
      // Best-effort
    }
  }
}

export async function runImport(
  data: BackupPayload,
  opts: { dryRun?: boolean } = {},
): Promise<ImportResult> {
  const { dryRun = false } = opts
  const rowCounts: Record<string, number> = {}
  const errors: string[] = []

  async function doImport() {
    // Backup antigo pode trazer tabelas que já saíram do schema (ex.: as legadas removidas em out/2026)
    for (const tableName of Object.keys(data.tables)) {
      if (!modeloBackup(tableName) && (data.tables[tableName]?.length ?? 0) > 0) {
        errors.push(`Tabela ignorada (não existe mais no schema): ${tableName}`)
      }
    }
    for (const tableName of IMPORT_ORDER) {
      const modelo = modeloBackup(tableName)
      if (!modelo) continue
      const rows = ((data.tables[tableName] ?? []) as Record<string, unknown>[])
        .map((row) => desserializarLinha(row, modelo.binarios))
      if (rows.length === 0) { rowCounts[tableName] = 0; continue }

      try {
        const count = await upsertBatch(modelo.delegate, rows, modelo.chave, modelo.segundoPasso)
        rowCounts[tableName] = count

        if (modelo.segundoPasso.length) {
          await applyTwoPassUpdates(modelo.delegate, rows, modelo.chave, modelo.segundoPasso)
        }
      } catch (err: any) {
        errors.push(`${tableName}: ${err?.message ?? String(err)}`)
        rowCounts[tableName] = 0
      }
    }
  }

  if (dryRun) {
    // Run inside a transaction and roll it back to simulate without persisting
    try {
      await (prisma as any).$transaction(async (tx: any) => {
        // For dry-run, count rows without actually importing (transaction will be rolled back)
        for (const tableName of IMPORT_ORDER) {
          const rows = (data.tables[tableName] ?? []) as Record<string, unknown>[]
          rowCounts[tableName] = rows.length
        }
        throw new Error('DRY_RUN_ROLLBACK')
      })
    } catch (err: any) {
      if (err?.message !== 'DRY_RUN_ROLLBACK') {
        errors.push(err?.message ?? String(err))
      }
    }
  } else {
    await doImport()
  }

  return { rowCounts, errors, dryRun }
}
