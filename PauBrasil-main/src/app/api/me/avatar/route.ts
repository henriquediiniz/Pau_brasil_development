import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { photoUrl } = body

    if (photoUrl === undefined) {
      return NextResponse.json({ error: 'Missing field: photoUrl' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: token.sub },
      data: { photoUrl },
    })

    return NextResponse.json({ success: true, photoUrl: user.photoUrl })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
