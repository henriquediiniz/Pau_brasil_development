import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      include: {
        manager: {
          select: { id: true, name: true, photoUrl: true, role: true }
        },
        subordinates: {
          select: { id: true, name: true, photoUrl: true, role: true },
          where: { isActive: true }
        }
      }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ 
      user: {
        id: user.id,
        manager: user.manager,
        subordinates: user.subordinates
      } 
    })
  } catch (error) {
    console.error('Error fetching user network:', error)
    return NextResponse.json({ error: 'Erro ao buscar rede' }, { status: 500 })
  }
}
