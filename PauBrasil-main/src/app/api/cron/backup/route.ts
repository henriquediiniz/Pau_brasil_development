import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildBackupBuffer } from '@/lib/backup-export'
import { uploadBackup, listBackups, deleteBackup } from '@/lib/backup-blob'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const configs = await prisma.systemConfig.findMany({
    where: { key: { in: ['backup_enabled', 'backup_retention_days'] } },
  })
  const configMap = Object.fromEntries(configs.map(c => [c.key, c.value]))

  if (configMap['backup_enabled'] === 'false') {
    return NextResponse.json({ skipped: true, reason: 'backup_enabled=false' })
  }

  const retentionDays = parseInt(configMap['backup_retention_days'] ?? '30', 10)

  // Run export
  const job = await prisma.backupJob.create({
    data: { type: 'EXPORT', status: 'RUNNING', trigger: 'cron', triggeredBy: 'cron' },
  })

  try {
    const { buffer, rowCounts } = await buildBackupBuffer('cron')
    const blob = await uploadBackup(buffer, 'auto')

    await prisma.backupJob.update({
      where: { id: job.id },
      data: {
        status: 'DONE',
        blobUrl: blob.url,
        blobKey: blob.pathname,
        sizeBytes: BigInt(buffer.length),
        rowCounts,
        finishedAt: new Date(),
      },
    })

    void audit({
      actorId: 'cron',
      actorName: 'Cron',
      action: 'BACKUP_EXPORTED',
      targetType: 'BackupJob',
      targetId: job.id,
      meta: { trigger: 'cron', sizeBytes: buffer.length, rowCounts },
    })

    // Retention cleanup
    let pruned = 0
    try {
      const blobs = await listBackups()
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
      const toDelete = blobs.filter(b => b.uploadedAt < cutoff)
      for (const b of toDelete) {
        await deleteBackup(b.pathname).catch(() => {})
        pruned++
      }
    } catch {
      // Pruning failure is non-fatal
    }

    return NextResponse.json({ exported: true, jobId: job.id, rowCounts, pruned })
  } catch (err: any) {
    await prisma.backupJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', errorMsg: String(err?.message ?? err), finishedAt: new Date() },
    })
    return NextResponse.json({ error: 'Export falhou', detail: String(err?.message ?? err) }, { status: 500 })
  }
}

export { GET as POST }
