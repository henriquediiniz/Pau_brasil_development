import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

type Handler<C = unknown> = (req: NextRequest, ctx: C) => Promise<NextResponse>

/**
 * Wrapper para handlers de API routes que garante:
 * - P2025 (record not found) → 404
 * - P2002 (unique constraint) → 409
 * - Qualquer outro erro → 500 com mensagem estruturada
 *
 * Uso:
 *   export const GET = withHandler(async (req, { params }) => { ... })
 */
export function withHandler<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
        }
        if (err.code === 'P2002') {
          return NextResponse.json({ error: 'Registro duplicado' }, { status: 409 })
        }
        console.error('[api] Prisma error', err.code, err.message)
        return NextResponse.json({ error: 'Erro de banco de dados' }, { status: 500 })
      }
      console.error('[api] Unhandled error', err)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  }
}
