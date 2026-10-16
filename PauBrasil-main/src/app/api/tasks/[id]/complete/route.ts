import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TaskService } from '@/services/TaskService'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const userName = session.user.name ?? 'Colaborador'
  const { note, evidenceUrl } = await req.json().catch(() => ({}))

  try {
    const taskService = new TaskService()
    const result = await taskService.completeTask(params.id, userId, userName, { note, evidenceUrl })
    return NextResponse.json(result)
  } catch (error: any) {
    const message = error.message || 'Erro ao processar tarefa'
    const status = message.includes('encontrada') ? 404 : (message.includes('processada') ? 409 : 400)
    return NextResponse.json({ error: message }, { status })
  }
}
