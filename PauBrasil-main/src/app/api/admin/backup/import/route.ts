import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin } from '@/lib/auth-helpers'
import { decompressAndParse, runImport } from '@/lib/backup-import'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isSysAdmin(session.user as any)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let compressedBuffer: Buffer

  const contentType = req.headers.get('content-type') ?? ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })
    if (!file.name.endsWith('.json.gz')) {
      return NextResponse.json({ error: 'Arquivo deve ser .json.gz' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    compressedBuffer = Buffer.from(arrayBuffer)

    const dryRun = formData.get('dryRun') === 'true'

    let data
    try {
      data = decompressAndParse(compressedBuffer)
    } catch (err: any) {
      return NextResponse.json({ error: err?.message ?? 'Arquivo inválido' }, { status: 422 })
    }

    const result = await runImport(data, { dryRun })

    if (!dryRun) {
      const job = await prisma.backupJob.create({
        data: {
          type: 'IMPORT',
          status: 'DONE',
          trigger: 'manual',
          triggeredBy: session.user.id,
          rowCounts: result.rowCounts,
          finishedAt: new Date(),
        },
      })

      void audit({
        actorId: session.user.id,
        actorName: session.user.name ?? '',
        action: 'BACKUP_IMPORTED',
        targetType: 'BackupJob',
        targetId: job.id,
        meta: { rowCounts: result.rowCounts, errors: result.errors, exportedAt: data.exportedAt },
      })
    }

    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Content-Type deve ser multipart/form-data' }, { status: 400 })
}
