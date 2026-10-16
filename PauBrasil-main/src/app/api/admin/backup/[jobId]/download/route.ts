import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isSysAdmin(session.user as any)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const job = await prisma.backupJob.findUnique({ where: { id: params.jobId } })
  if (!job || !job.blobUrl) return new NextResponse('Not found', { status: 404 })

  const response = await fetch(job.blobUrl, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  })

  if (!response.ok) {
    return new NextResponse('Blob not available', { status: 404 })
  }

  const filename = job.blobKey?.split('/').pop() ?? `backup_${params.jobId}.json.gz`

  const headers = new Headers({
    'Content-Type': 'application/gzip',
    'Content-Disposition': `attachment; filename="${filename}"`,
  })

  if (job.sizeBytes) {
    headers.set('Content-Length', job.sizeBytes.toString())
  }

  return new NextResponse(response.body, { headers })
}
