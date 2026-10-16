import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin } from '@/lib/auth-helpers'
import { buildBackupBuffer } from '@/lib/backup-export'
import { uploadBackup } from '@/lib/backup-blob'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isSysAdmin(session.user as any)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const job = await prisma.backupJob.create({
    data: {
      type: 'EXPORT',
      status: 'RUNNING',
      trigger: 'manual',
      triggeredBy: session.user.id,
    },
  })

  try {
    const { buffer, rowCounts } = await buildBackupBuffer(session.user.id)
    const blob = await uploadBackup(buffer, `manual_${job.id}`)

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
      actorId: session.user.id,
      actorName: session.user.name ?? '',
      action: 'BACKUP_EXPORTED',
      targetType: 'BackupJob',
      targetId: job.id,
      meta: { trigger: 'manual', sizeBytes: buffer.length, rowCounts },
    })

    return NextResponse.json({ jobId: job.id, blobUrl: blob.url, rowCounts, sizeBytes: buffer.length })
  } catch (err: any) {
    await prisma.backupJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', errorMsg: String(err?.message ?? err), finishedAt: new Date() },
    })
    return NextResponse.json({ error: 'Export falhou', detail: String(err?.message ?? err) }, { status: 500 })
  }
}
