import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin } from '@/lib/auth-helpers'
import { listBackups } from '@/lib/backup-blob'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isSysAdmin(session.user as any)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [jobs, configs, blobs] = await Promise.all([
    prisma.backupJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
    }),
    prisma.systemConfig.findMany({
      where: { key: { in: ['backup_enabled', 'backup_hour_utc', 'backup_retention_days'] } },
    }),
    listBackups().catch(() => []),
  ])

  const config: Record<string, string> = {}
  for (const c of configs) config[c.key] = c.value

  // Serialise BigInt for JSON
  const serializedJobs = jobs.map(j => ({ ...j, sizeBytes: j.sizeBytes?.toString() ?? null }))

  return NextResponse.json({ jobs: serializedJobs, config, blobs })
}
