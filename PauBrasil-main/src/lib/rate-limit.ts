import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Verificamos de forma Fail-Safe para evitar telas de erro se a chave não for colada ainda
const hasRedisConfig = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = hasRedisConfig ? Redis.fromEnv() : ({} as any)

/**
 * Limitador severo para rotas intensas como mineração de PDF (Evita DDoS CPU)
 * Permite apenas 5 tentativas a cada 10 minutos por roteador IP
 */
export const parseCvRatelimit = hasRedisConfig
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/parseCv',
    })
  : null

/**
 * Limitador estrito para blindagem de spam no formulário de envio ao Banco
 * Permite apenas 3 currículos submetidos a cada 1 hora pelo mesmo roteador IP
 */
export const candidatarRatelimit = hasRedisConfig
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
      prefix: '@upstash/ratelimit/candidaturaFinal',
    })
  : null
