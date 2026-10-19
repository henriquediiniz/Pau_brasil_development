import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// O banco é consultado em runtime; a build não depende de uma conexão ativa.
export const dynamic = 'force-dynamic'

export async function GET() {
  const empresas = await prisma.empresa.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  })
  return NextResponse.json(empresas, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
