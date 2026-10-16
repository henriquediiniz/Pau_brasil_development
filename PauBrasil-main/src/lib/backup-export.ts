import { prisma } from './prisma'
import { gzipSync } from 'zlib'
import { createHash } from 'crypto'

// Tables in FK dependency order (Tier 0 → Tier 6)
export const EXPORT_ORDER = [
  // Tier 0 — no outbound FKs
  'Empresa', 'RewardProduct', 'GlobalGoal',
  'Operation', 'Candidatura',
  // Tier 1
  'Filial', 'Operacao', 'Function', 'UPBTemporada',
  // Tier 2
  'UPBEpisodio', 'UPBQuestao', 'UPBObrigatorio',
  'MetaPontuacao', 'TaskDefinition',
  // Tier 3 — self-referential User (two-pass on import)
  'User',
  // Tier 4
  'PushSubscription', 'Notification', 'FeedEvent',
  'UPBProgresso', 'UPBCertificado', 'UPBQuizTentativa', 'UPBMatricula',
  'UPBQuestaoOpcao',
  'LeaderVisit', 'VisitaObrigatoria', 'RedemptionOrder',
  'TaskInstance', 'PointsLedger', 'PendingRegistration',
  // Tier 5
  'AuditLog', 'NotaCandidatura', 'UPBRespostaUsuario',
  'BackupJob', 'SystemConfig',
]

// Prisma model accessor map (camelCase)
const MODEL_MAP: Record<string, keyof typeof prisma> = {
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

export function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) {
      result[k] = v
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

// Tables whose PK is not 'id' — cursor pagination doesn't apply; they're small so a single findMany is fine
const PLAIN_EXPORT_TABLES = new Set(['SystemConfig'])

async function exportTable(tableName: string): Promise<unknown[]> {
  const model = MODEL_MAP[tableName]
  if (!model) return []
  const delegate = (prisma as any)[model]
  if (!delegate?.findMany) return []

  if (PLAIN_EXPORT_TABLES.has(tableName)) {
    const rows: Record<string, unknown>[] = await delegate.findMany()
    return rows.map(serializeRow)
  }

  const rows: unknown[] = []
  let cursor: string | undefined

  while (true) {
    const batch: Record<string, unknown>[] = await delegate.findMany({
      take: 500,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    })
    if (batch.length === 0) break
    rows.push(...batch.map(serializeRow))
    if (batch.length < 500) break
    cursor = batch[batch.length - 1].id as string
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
