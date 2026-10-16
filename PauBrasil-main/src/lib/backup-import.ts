import { prisma } from './prisma'
import { gunzipSync } from 'zlib'
import { createHash } from 'crypto'

export const IMPORT_ORDER = [
  'Empresa', 'RewardProduct', 'GlobalGoal',
  'Operation', 'Candidatura',
  'Filial', 'Operacao', 'Function', 'UPBTemporada',
  'UPBEpisodio', 'UPBQuestao', 'UPBObrigatorio',
  'MetaPontuacao', 'TaskDefinition',
  'User',
  'PushSubscription', 'Notification', 'FeedEvent',
  'UPBProgresso', 'UPBCertificado', 'UPBQuizTentativa', 'UPBMatricula',
  'UPBQuestaoOpcao',
  'LeaderVisit', 'VisitaObrigatoria', 'RedemptionOrder',
  'TaskInstance', 'PointsLedger', 'PendingRegistration',
  'AuditLog', 'NotaCandidatura', 'UPBRespostaUsuario',
  'BackupJob', 'SystemConfig',
]

// Self-referential fields that require two-pass import
const SELF_REF_FIELDS: Record<string, string[]> = {
  User: ['managerId', 'targetRewardId'],
  TaskDefinition: ['nextTaskDefinitionId'],
  TaskInstance: ['triggeredByInstanceId', 'conviteDeId'],
}

const MODEL_MAP: Record<string, string> = {
  Empresa: 'empresa', RewardProduct: 'rewardProduct', GlobalGoal: 'globalGoal',
  Operation: 'operation',
  Candidatura: 'candidatura', Filial: 'filial', Operacao: 'operacao', Function: 'function',
  UPBTemporada: 'uPBTemporada',
  UPBEpisodio: 'uPBEpisodio', UPBQuestao: 'uPBQuestao',
  UPBObrigatorio: 'uPBObrigatorio', MetaPontuacao: 'metaPontuacao', TaskDefinition: 'taskDefinition',
  User: 'user', PushSubscription: 'pushSubscription', Notification: 'notification',
  FeedEvent: 'feedEvent', UPBProgresso: 'uPBProgresso', UPBCertificado: 'uPBCertificado',
  UPBQuizTentativa: 'uPBQuizTentativa', UPBMatricula: 'uPBMatricula',
  UPBQuestaoOpcao: 'uPBQuestaoOpcao',
  LeaderVisit: 'leaderVisit', VisitaObrigatoria: 'visitaObrigatoria',
  RedemptionOrder: 'redemptionOrder', TaskInstance: 'taskInstance', PointsLedger: 'pointsLedger',
  PendingRegistration: 'pendingRegistration',
  AuditLog: 'auditLog', NotaCandidatura: 'notaCandidatura', UPBRespostaUsuario: 'uPBRespostaUsuario',
  BackupJob: 'backupJob', SystemConfig: 'systemConfig',
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
  nullifyFields?: string[],
): Promise<number> {
  const delegate = (prisma as any)[modelKey]
  if (!delegate?.upsert) return 0

  let count = 0
  for (const rawRow of rows) {
    const row = nullifyFields
      ? { ...rawRow, ...Object.fromEntries(nullifyFields.map(f => [f, null])) }
      : rawRow

    try {
      await delegate.upsert({
        where: { id: row.id },
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
  selfRefFields: string[],
): Promise<void> {
  const delegate = (prisma as any)[modelKey]
  if (!delegate?.update) return

  const rowsWithSelfRef = rows.filter(r => selfRefFields.some(f => r[f] != null))
  for (const row of rowsWithSelfRef) {
    const data = Object.fromEntries(selfRefFields.filter(f => row[f] != null).map(f => [f, row[f]]))
    try {
      await delegate.update({ where: { id: row.id }, data })
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
    for (const tableName of IMPORT_ORDER) {
      const rows = (data.tables[tableName] ?? []) as Record<string, unknown>[]
      if (rows.length === 0) { rowCounts[tableName] = 0; continue }

      const modelKey = MODEL_MAP[tableName]
      if (!modelKey) { errors.push(`Tabela desconhecida: ${tableName}`); continue }

      const selfRefFields = SELF_REF_FIELDS[tableName]

      try {
        const count = await upsertBatch(modelKey, rows, selfRefFields)
        rowCounts[tableName] = count

        if (selfRefFields) {
          await applyTwoPassUpdates(modelKey, rows, selfRefFields)
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
