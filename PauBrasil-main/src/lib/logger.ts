/**
 * Logger estruturado centralizado — console-based, zero dependencies.
 *
 * Em produção: JSON puro para ingestão por Datadog / Axiom / Logtail.
 * Em desenvolvimento: colorido no terminal.
 *
 * Uso básico:
 *   import { log } from '@/lib/logger'
 *   log.info({ userId, action }, 'usuário fez login')
 *   log.error({ err, requestId }, 'falha ao salvar lançamento')
 *
 * Com correlation ID (para API routes):
 *   import { createRequestLogger } from '@/lib/logger'
 *   const log = createRequestLogger(req.headers.get('x-request-id') ?? undefined)
 *   log.info({ userId }, 'lançamento salvo')
 */

const isDev = process.env.NODE_ENV !== 'production'
const logLevel = process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info')

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const
type Level = keyof typeof LEVELS

function shouldLog(level: Level): boolean {
  const min = LEVELS[logLevel as Level] ?? LEVELS.info
  return LEVELS[level] >= min
}

function write(level: Level, bindings: Record<string, unknown>, msg: string) {
  if (!shouldLog(level)) return
  const entry = {
    level,
    time: new Date().toISOString(),
    service: 'pau-brasil-portal',
    ...bindings,
    msg,
  }
  const out = JSON.stringify(entry)
  if (level === 'error') console.error(out)
  else if (level === 'warn') console.warn(out)
  else console.log(out)
}

function makeLogger(bindings: Record<string, unknown> = {}) {
  return {
    debug: (ctx: Record<string, unknown>, msg: string) => write('debug', { ...bindings, ...ctx }, msg),
    info:  (ctx: Record<string, unknown>, msg: string) => write('info',  { ...bindings, ...ctx }, msg),
    warn:  (ctx: Record<string, unknown>, msg: string) => write('warn',  { ...bindings, ...ctx }, msg),
    error: (ctx: Record<string, unknown>, msg: string) => write('error', { ...bindings, ...ctx }, msg),
    child: (extra: Record<string, unknown>) => makeLogger({ ...bindings, ...extra }),
  }
}

export const log = makeLogger()

export function createRequestLogger(requestId?: string) {
  return log.child({ requestId: requestId ?? 'no-id' })
}

export function logError(
  err: unknown,
  context: Record<string, unknown> = {},
  message = 'Erro inesperado'
) {
  const error = err instanceof Error
    ? { message: err.message, stack: err.stack, name: err.name }
    : { message: String(err) }
  log.error({ err: error, ...context }, message)
}
