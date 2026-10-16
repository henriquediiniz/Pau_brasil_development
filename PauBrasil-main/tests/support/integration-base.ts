/**
 * tests/support/integration-base.ts
 * 
 * Base para testes de integração que realizam requisições HTTP ao servidor local.
 * Inspirado em scripts/test-obz.ts
 */

export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

export class IntegrationSession {
  public cookies: string[] = []

  constructor(public label: string = 'Session') {}

  private updateCookies(res: Response) {
    const setCookies: string[] = (res.headers as any).getSetCookie?.() ?? []
    for (const raw of setCookies) {
      const [nameValue] = raw.split(';')
      const eqIdx = nameValue.indexOf('=')
      if (eqIdx < 0) continue
      const name = nameValue.substring(0, eqIdx).trim()
      this.cookies = this.cookies.filter(c => !c.startsWith(`${name}=`))
      this.cookies.push(nameValue.trim())
    }
  }

  private cookieHeader() {
    return this.cookies.join('; ')
  }

  async request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Cookie: this.cookieHeader(),
      },
    })
    this.updateCookies(res)
    
    const text = await res.text()
    let body: any = {}
    if (text.trim()) {
      try {
        body = JSON.parse(text)
      } catch {
        body = { _raw: text.slice(0, 500) }
      }
    }

    if (!res.ok) {
      // Silently return status for assertion-based testing
    }

    return {
      ok: res.ok,
      status: res.status,
      body,
      headers: res.headers,
    }
  }

  async get(path: string) {
    return this.request(path, { method: 'GET' })
  }

  async post(path: string, body: any) {
    return this.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async patch(path: string, body: any) {
    return this.request(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async delete(path: string, body?: any) {
    return this.request(path, {
      method: 'DELETE',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async postForm(path: string, fields: Record<string, string | Blob>) {
    const fd = new FormData()
    for (const [k, v] of Object.entries(fields)) {
      fd.append(k, v)
    }
    return this.request(path, {
      method: 'POST',
      body: fd,
    })
  }

  async login(email: string, pass: string): Promise<boolean> {
    // 1. Obter CSRF token
    const csrf = await this.get('/api/auth/csrf')
    if (!csrf.body.csrfToken) {
      console.error(`[${this.label}] Erro: CSRF token não encontrado`)
      return false
    }

    // 2. Fazer login via credentials
    const params = new URLSearchParams({
      csrfToken: csrf.body.csrfToken,
      email: email,
      password: pass,
      callbackUrl: BASE_URL,
      json: 'true',
    })

    const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: this.cookieHeader(),
      },
      body: params.toString(),
      redirect: 'manual',
    })
    this.updateCookies(res)

    if (!res.ok) {
      // Silently return for assertion-based testing
    }

    const session = await this.get('/api/auth/session')
    return !!session.body?.user?.email
  }
}
