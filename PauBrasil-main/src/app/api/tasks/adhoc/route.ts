import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  adHocTitle:      z.string().min(3).max(200),
  adHocDesc:       z.string().max(1000).optional(),
  requestedPoints: z.number().int().min(0).max(10000).optional(),
  // Agendamento — data ISO (YYYY-MM-DD) e hora ("HH:MM"). Se omitido, usa hoje.
  dataAgendada:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  horario:         z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const body   = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { adHocTitle, adHocDesc, requestedPoints, dataAgendada, horario } = parsed.data

  // Monta a data de referência (meia-noite local) para o checklist
  let date: Date
  if (dataAgendada) {
    const [y, m, d] = dataAgendada.split('-').map(Number)
    date = new Date(y, m - 1, d, 0, 0, 0, 0)
  } else {
    date = new Date()
    date.setHours(0, 0, 0, 0)
  }

  const instance = await prisma.taskInstance.create({
    data: {
      userId,
      taskDefinitionId: null,
      date,
      status:          'PENDING',
      isAdHoc:         true,
      adHocTitle,
      adHocDesc:       adHocDesc ?? null,
      requestedPoints: requestedPoints ?? null,
      horario:         horario ?? null,
    },
  })

  return NextResponse.json(instance, { status: 201 })
}
