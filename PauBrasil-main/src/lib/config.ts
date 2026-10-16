/**
 * Configurações centrais da aplicação.
 * Altere aqui — não duplique constantes em outros arquivos.
 */

export const ALLOWED_EMAIL_DOMAIN = 'grupopaubrasil.com.br'

export const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutos
} as const

export const JWT_REFRESH_INTERVAL_MS = 30 * 1000 // 30 segundos

export const USERS_PAGE_SIZE = 50 // registros por página na listagem admin
