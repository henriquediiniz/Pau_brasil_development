/**
 * Cliente Redis compartilhado (Upstash).
 * Importar daqui em vez de instanciar em cada módulo.
 * Fail-safe: retorna null quando as variáveis de ambiente não estão configuradas.
 */
import { Redis } from '@upstash/redis'

export const hasRedisConfig =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN

export const redis: Redis | null = hasRedisConfig ? Redis.fromEnv() : null
