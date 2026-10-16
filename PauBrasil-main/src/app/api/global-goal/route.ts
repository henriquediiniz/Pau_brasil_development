import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isGestorLevel } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goal = await prisma.globalGoal.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error fetching global goal:', error)
    return NextResponse.json({ error: 'Erro ao buscar meta global' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, nivel: true },
    })

    const effectiveUser = {
      ...session.user,
      role: me?.role ?? session.user.role,
      nivel: me?.nivel ?? session.user.nivel,
    }

    if (!isGestorLevel(effectiveUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, currentValue } = body

    const goal = await prisma.globalGoal.update({
      where: { id },
      data: { currentValue: parseFloat(currentValue) }
    })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error updating global goal:', error)
    return NextResponse.json({ error: 'Erro ao atualizar meta' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, nivel: true },
    })

    const effectiveUser = {
      ...session.user,
      role: me?.role ?? session.user.role,
      nivel: me?.nivel ?? session.user.nivel,
    }

    if (!isGestorLevel(effectiveUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...fields } = body

    const goal = await prisma.globalGoal.update({
      where: { id },
      data: {
        title: fields.title,
        description: fields.description,
        targetValue: parseFloat(fields.targetValue),
        currentValue: parseFloat(fields.currentValue ?? 0),
        deadline: fields.deadline ? new Date(fields.deadline) : null,
        rewardPoints: parseInt(fields.rewardPoints ?? 0),
        units: Array.isArray(fields.units) ? fields.units : [],
      }
    })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error updating global goal:', error)
    return NextResponse.json({ error: 'Erro ao editar meta global' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, nivel: true },
    })

    const effectiveUser = {
      ...session.user,
      role: me?.role ?? session.user.role,
      nivel: me?.nivel ?? session.user.nivel,
    }

    if (!isGestorLevel(effectiveUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    await prisma.globalGoal.update({ where: { id }, data: { active: false } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting global goal:', error)
    return NextResponse.json({ error: 'Erro ao remover meta global' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, nivel: true },
    })

    const effectiveUser = {
      ...session.user,
      role: me?.role ?? session.user.role,
      nivel: me?.nivel ?? session.user.nivel,
    }

    if (!isGestorLevel(effectiveUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    // Deactivate existing active goals
    await prisma.globalGoal.updateMany({ where: { active: true }, data: { active: false } })

    const goal = await prisma.globalGoal.create({
      data: {
        title: body.title,
        description: body.description,
        targetValue: parseFloat(body.targetValue),
        currentValue: parseFloat(body.currentValue ?? 0),
        deadline: body.deadline ? new Date(body.deadline) : null,
        rewardPoints: parseInt(body.rewardPoints ?? 0),
        units: Array.isArray(body.units) ? body.units : [],
        active: true
      }
    })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error creating global goal:', error)
    return NextResponse.json({ error: 'Erro ao criar meta global' }, { status: 500 })
  }
}
