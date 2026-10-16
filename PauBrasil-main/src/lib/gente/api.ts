/**
 * Porta de entrada das rotas do módulo Gente.
 *
 * Centraliza sessão, permissão e escopo para que nenhuma rota precise repetir
 * (e eventualmente esquecer) a checagem. O usuário é relido do banco a cada
 * requisição: uma permissão revogada vale na hora, não no próximo login.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessGente, canManageGente, type SessionUser } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { whereEscopoGente } from './scope'

export interface ContextoGente {
  user: SessionUser
  /** Cláusula de escopo já pronta. `null` = o usuário não enxerga nada. */
  where: Record<string, unknown> | null
}

type Resultado = { ok: true; ctx: ContextoGente } | { ok: false; resposta: NextResponse }

export async function autenticarGente(opts: { escrita?: boolean } = {}): Promise<Resultado> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { ok: false, resposta: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }

  const user = await getEffectiveSessionUser(session.user)

  if (user.isActive === false) {
    return { ok: false, resposta: NextResponse.json({ error: 'Sessão revogada' }, { status: 401 }) }
  }

  const permitido = opts.escrita ? canManageGente(user) : canAccessGente(user)
  if (!permitido) {
    return { ok: false, resposta: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
  }

  return { ok: true, ctx: { user, where: whereEscopoGente(user) } }
}

/** Identificação do autor para a trilha de auditoria. */
export function autor(user: SessionUser) {
  return {
    actorId: user.id,
    actorName: user.name ?? user.email ?? '',
  }
}
