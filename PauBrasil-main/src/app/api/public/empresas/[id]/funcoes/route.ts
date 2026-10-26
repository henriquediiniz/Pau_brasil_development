import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const funcoes = await prisma.function.findMany({
    where: { empresaId: params.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(funcoes, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
