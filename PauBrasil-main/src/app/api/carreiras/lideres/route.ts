import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
// Cache de 5 minutos — dados de líderes mudam raramente
export const revalidate = 300

export interface CareerStep {
  role:   string
  period: string
}

export interface LiderPublico {
  id:        string
  name:      string
  role:      string   // function.name ou nivel como fallback
  photoUrl:  string | null
  trajetoria: CareerStep[]
}

export interface FilialPublica {
  id:      string
  slug:    string
  label:   string
  estado:  string
  color:   string
  lideres: LiderPublico[]
}

export async function GET() {
  const filiais = await prisma.filial.findMany({
    where: { ativo: true },
    orderBy: { label: 'asc' },
    include: {
      lideres: {
        where: { isLiderPublico: true, isActive: true },
        select: {
          id:        true,
          name:      true,
          nivel:     true,
          photoUrl:  true,
          trajetoria: true,
          function:  { select: { name: true } },
        },
        orderBy: [
          { nivel: 'desc' },
          { name: 'asc' },
        ],
      },
    },
  })

  const response: FilialPublica[] = filiais.map(f => ({
    id:     f.id,
    slug:   f.slug,
    label:  f.label,
    estado: f.estado,
    color:  f.color,
    lideres: f.lideres.map(u => ({
      id:       u.id,
      name:     u.name,
      role:     u.function?.name ?? u.nivel,
      photoUrl: u.photoUrl,
      trajetoria: Array.isArray(u.trajetoria) ? (u.trajetoria as unknown as CareerStep[]) : [],
    })),
  }))

  return NextResponse.json(response)
}
