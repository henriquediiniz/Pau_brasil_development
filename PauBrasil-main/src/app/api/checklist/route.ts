import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateDailyChecklist } from '@/lib/checklist'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const dateParam = req.nextUrl.searchParams.get('date')
  const date = dateParam ? new Date(dateParam) : new Date()

  const tasks = await generateDailyChecklist(userId, date)
  return NextResponse.json(tasks)
}
