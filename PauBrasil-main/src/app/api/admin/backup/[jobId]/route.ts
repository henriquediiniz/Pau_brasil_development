import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin } from '@/lib/auth-helpers'
import { deleteBackup } from '@/lib/backup-blob'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isSysAdmin(session.user as any)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const job = await prisma.backupJob.findUnique({ where: { id: params.jobId } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ...job, sizeBytes: job.sizeBytes?.toString() ?? null })
}

export async function DELETE(req: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isSysAdmin(session.user as any)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const job = await prisma.backupJob.findUnique({ where: { id: params.jobId } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (job.blobKey) {
    await deleteBackup(job.blobKey).catch(() => {})
  }

  await prisma.backupJob.delete({ where: { id: params.jobId } })

  void audit({
    actorId: session.user.id,
    actorName: session.user.name ?? '',
    action: 'BACKUP_DELETED',
    targetType: 'BackupJob',
    targetId: params.jobId,
    meta: { blobKey: job.blobKey },
  })

  return NextResponse.json({ ok: true })
}
