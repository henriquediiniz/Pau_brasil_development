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

  const contentType = req.headers.get('content-type') ?? ''

  // Restaurar um backup já guardado: o servidor lê o arquivo no Blob.
  // Necessário porque a Vercel corta uploads acima de 4,5 MB, e o backup completo
  // (com as fotos da newsletter) passa disso.
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => null) as { jobId?: string; dryRun?: boolean } | null
    if (!body?.jobId) return NextResponse.json({ error: 'jobId obrigatório' }, { status: 400 })
    const job = await prisma.backupJob.findUnique({ where: { id: body.jobId } })
    if (!job?.blobUrl) return NextResponse.json({ error: 'Backup não encontrado' }, { status: 404 })
    const resposta = await fetch(job.blobUrl, { headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` } })
    if (!resposta.ok) return NextResponse.json({ error: 'Arquivo do backup indisponível' }, { status: 502 })
    return importar(Buffer.from(await resposta.arrayBuffer()), body.dryRun !== false, session.user, `backup ${job.id}`)
  }

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })
    if (!file.name.endsWith('.json.gz')) {
      return NextResponse.json({ error: 'Arquivo deve ser .json.gz' }, { status: 400 })
    }

    return importar(Buffer.from(await file.arrayBuffer()), formData.get('dryRun') === 'true', session.user, file.name)
  }

  return NextResponse.json({ error: 'Envie o arquivo (multipart) ou o jobId (JSON)' }, { status: 400 })
}

async function importar(
  compressedBuffer: Buffer,
  dryRun: boolean,
  user: { id: string; name?: string | null },
  origem: string,
) {
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
        triggeredBy: user.id,
        rowCounts: result.rowCounts,
        finishedAt: new Date(),
      },
    })

    void audit({
      actorId: user.id,
      actorName: user.name ?? '',
      action: 'BACKUP_IMPORTED',
      targetType: 'BackupJob',
      targetId: job.id,
      meta: { rowCounts: result.rowCounts, errors: result.errors, exportedAt: data.exportedAt, origem },
    })
  }

  return NextResponse.json(result)
}
