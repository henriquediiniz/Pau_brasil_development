import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TaskService } from '@/services/TaskService'
import { SessionUser } from '@/lib/auth-helpers'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { action, note, approvedPoints } = await req.json()
    
    // Fetch full user data to ensure role/nivel are accurate for hierarchy check
    const approver = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, role: true, nivel: true, isUPBAdmin: true, isEmpresaAdmin: true, company: true }
    })

    if (!approver) return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })

    const taskService = new TaskService()
    const result = await taskService.reviewTask(
      params.id, 
      approver as unknown as SessionUser, 
      action, 
      { note, approvedPoints }
    )

    return NextResponse.json(result)
  } catch (error: any) {
    const message = error.message || 'Erro ao processar revisão'
    const lower = message.toLowerCase()
    const status = lower.includes('permissão') || lower.includes('hierarquia') ? 403 : (lower.includes('encontrada') ? 404 : (lower.includes('processada') ? 409 : 400))
    return NextResponse.json({ error: message }, { status })
  }
}
