import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Limite de tentativas guardado no Postgres, com janela fixa.
 *
 * Até out/2026 cada rota tinha o seu `Map` em memória (e duas usavam Upstash,
 * que nunca foi configurado em produção). Em serverless cada instância tem a
 * própria memória e ela some a cada reciclagem, então o limite praticamente
 * não existia. Aqui a contagem é atômica (`INSERT ... ON CONFLICT`) e vale
 * para todas as instâncias. As linhas vencidas são apagadas pelo cron diário.
 *
 * Se o banco falhar, a tentativa passa: travar o login de todo mundo por causa
 * do contador seria pior do que deixar passar algumas tentativas a mais.
 */
export const LIMITES = {
  login: { max: 5, janelaMs: 15 * 60_000 },
  registro: { max: 5, janelaMs: 15 * 60_000 },
  totp: { max: 6, janelaMs: 15 * 60_000 },
  definirSenha: { max: 10, janelaMs: 15 * 60_000 },
  uploadCv: { max: 10, janelaMs: 60 * 60_000 },
  lerCv: { max: 5, janelaMs: 10 * 60_000 },
  candidaturaIp: { max: 3, janelaMs: 60 * 60_000 },
  candidaturaEmail: { max: 3, janelaMs: 24 * 60 * 60_000 },
  contato: { max: 5, janelaMs: 60 * 60_000 },
} as const

export type TipoLimite = keyof typeof LIMITES

export interface ResultadoLimite {
  ok: boolean
  /** Quanto falta para a janela atual acabar, em ms (para a mensagem "tente em N minutos"). */
  restanteMs: number
}

export async function consumirTentativa(tipo: TipoLimite, identificador: string): Promise<ResultadoLimite> {
  const { max, janelaMs } = LIMITES[tipo]
  const agora = Date.now()
  const inicio = Math.floor(agora / janelaMs) * janelaMs
  const restanteMs = inicio + janelaMs - agora
  try {
    const [linha] = await prisma.$queryRaw<{ contagem: number }[]>`
      INSERT INTO "LimiteTentativa" ("chave", "janela", "contagem", "expiraEm")
      VALUES (${`${tipo}:${identificador.toLowerCase()}`}, ${new Date(inicio)}, 1, ${new Date(inicio + janelaMs)})
      ON CONFLICT ("chave", "janela")
      DO UPDATE SET "contagem" = "LimiteTentativa"."contagem" + 1
      RETURNING "contagem"`
    return { ok: Number(linha?.contagem ?? 1) <= max, restanteMs }
  } catch (error) {
    console.error('[limite-tentativas] falha ao contar, liberando a tentativa', error)
    return { ok: true, restanteMs }
  }
}

/** Zera o contador da janela atual (ex.: login bem-sucedido). */
export async function liberarTentativas(tipo: TipoLimite, identificador: string) {
  await prisma.limiteTentativa
    .deleteMany({ where: { chave: `${tipo}:${identificador.toLowerCase()}` } })
    .catch(() => undefined)
}

/** "Tente novamente em N minutos", com plural certo. */
export function mensagemLimite({ restanteMs }: ResultadoLimite) {
  const minutos = Math.max(1, Math.ceil(restanteMs / 60_000))
  return `Muitas tentativas. Tente novamente em ${minutos} minuto${minutos !== 1 ? 's' : ''}.`
}

/** IP do visitante: na Vercel `x-real-ip` vem do proxy; fora dela, o primeiro do `x-forwarded-for`. */
export function ipDe(req: Pick<NextRequest, 'headers'>) {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'desconhecido'
  )
}

/** Remove contadores vencidos (chamado pelo cron diário). */
export function limparTentativasVencidas() {
  return prisma.limiteTentativa.deleteMany({ where: { expiraEm: { lt: new Date() } } })
}
