import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'

const TTL_SECONDS = 60 * 60 * 24 // 24 horas
const PREFIX = 'idempotency'

interface CachedResponse {
  status: number
  body: unknown
}

/**
 * Verifica se a requisição já foi processada com esta chave de idempotência.
 *
 * Uso em route handlers:
 *   const cached = await checkIdempotency(userId, req.headers.get('idempotency-key'))
 *   if (cached) return cached
 *   // ... processar requisição ...
 *   return storeIdempotency(userId, key, NextResponse.json(result))
 *
 * A chave deve ser um UUID v4 gerado pelo cliente antes de enviar a requisição.
 * Requisições repetidas com a mesma chave retornam exatamente o mesmo resultado,
 * sem re-processar a operação financeira — essencial para retry seguro.
 */
export async function checkIdempotency(
  userId: string,
  key: string | null | undefined
): Promise<NextResponse | null> {
  if (!key || !redis) return null

  try {
    const cached = await redis.get<CachedResponse>(`${PREFIX}:${userId}:${key}`)
    if (cached) {
      return NextResponse.json(cached.body, {
        status: cached.status,
        headers: { 'Idempotency-Replayed': 'true' },
      })
    }
  } catch {
    // Redis indisponível — prosseguir sem idempotência
  }

  return null
}

export async function storeIdempotency(
  userId: string,
  key: string | null | undefined,
  response: NextResponse
): Promise<NextResponse> {
  if (!key || !redis) return response

  try {
    const body = await response.clone().json()
    await redis.set(
      `${PREFIX}:${userId}:${key}`,
      { status: response.status, body } satisfies CachedResponse,
      { ex: TTL_SECONDS }
    )
  } catch {
    // Falha ao armazenar não bloqueia a resposta
  }

  return response
}
