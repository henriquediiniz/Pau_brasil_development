/**
 * scripts/test-usuarios.ts
 *
 * Teste E2E do CRUD de usuários — admin e empresa
 *
 * Pré-requisito: dev server rodando em localhost:3000
 *   npm run dev
 *
 * Execução:
 *   npx tsx scripts/test-usuarios.ts
 *
 * Variáveis opcionais (padrão: credenciais de desenvolvimento):
 *   ADMIN_EMAIL=admin@grupopaubrasil.com.br
 *   ADMIN_PASS=Admin@2026!
 */

const BASE         = 'http://localhost:3000'
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL ?? 'admin@grupopaubrasil.com.br'
const ADMIN_PASS   = process.env.ADMIN_PASS  ?? 'Admin@2026!'
const RUN_ID       = Date.now().toString().slice(-6)

// ── Estado compartilhado ──────────────────────────────────────────────────────
let cookies: string[] = []
const IDs: Record<string, string> = {}

type Result = { step: string; label: string; passed: boolean; info: string }
const results: Result[] = []

function pass(step: string, label: string, info = '') {
  results.push({ step, label, passed: true, info })
  console.log(`  ✅ ${step.padEnd(5)} ${label}${info ? ' · ' + info : ''}`)
}

function fail(step: string, label: string, info = '') {
  results.push({ step, label, passed: false, info })
  console.log(`  ❌ ${step.padEnd(5)} ${label}${info ? ' · ' + info : ''}`)
}

// ── Cookie jar ───────────────────────────────────────────────────────────────
function updateCookies(res: Response) {
  const setCookies: string[] =
    (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? []
  for (const raw of setCookies) {
    const [nameValue] = raw.split(';')
    const eqIdx = nameValue.indexOf('=')
    if (eqIdx < 0) continue
    const name = nameValue.substring(0, eqIdx).trim()
    cookies = cookies.filter(c => !c.startsWith(`${name}=`))
    cookies.push(nameValue.trim())
  }
}

function cookieHeader() {
  return cookies.join('; ')
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text.trim()) return {}
  try { return JSON.parse(text) } catch { return { _raw: text.slice(0, 200) } }
}

class ApiResponse {
  constructor(public res: Response, private _body: unknown) {}
  get ok()     { return this.res.ok }
  get status() { return this.res.status }
  json<T>()    { return this._body as T }
}

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { Cookie: cookieHeader() } })
  updateCookies(res)
  return new ApiResponse(res, await safeJson(res))
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader() },
    body:    JSON.stringify(body),
  })
  updateCookies(res)
  return new ApiResponse(res, await safeJson(res))
}

async function patch(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader() },
    body:    JSON.stringify(body),
  })
  updateCookies(res)
  return new ApiResponse(res, await safeJson(res))
}

async function del(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'DELETE',
    headers: { Cookie: cookieHeader() },
  })
  updateCookies(res)
  return new ApiResponse(res, await safeJson(res))
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login(): Promise<boolean> {
  console.log('\n🔐 FASE 0 — Autenticação')

  const csrfRes  = await get('/api/auth/csrf')
  const csrfData = csrfRes.json<{ csrfToken: string }>()
  if (!csrfData.csrfToken) { fail('0.1', 'Login — CSRF token'); return false }

  const params = new URLSearchParams({
    csrfToken:   csrfData.csrfToken,
    email:       ADMIN_EMAIL,
    password:    ADMIN_PASS,
    callbackUrl: BASE,
    json:        'true',
  })

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method:   'POST',
    headers:  { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieHeader() },
    body:     params.toString(),
    redirect: 'manual',
  })
  updateCookies(loginRes)

  const hasCookie = cookies.some(c =>
    c.startsWith('next-auth.session-token=') ||
    c.startsWith('__Secure-next-auth.session-token=')
  )
  if (hasCookie) { pass('0.1', 'Login SYS_ADMIN', `${cookies.length} cookies`); return true }

  const sess = await get('/api/auth/session')
  const sessData = sess.json<{ user?: { email: string } }>()
  if (sessData.user?.email) { pass('0.1', 'Login SYS_ADMIN', sessData.user.email); return true }

  fail('0.1', 'Login — sem cookie de sessão')
  return false
}

// ── Fase 1: CRUD completo como SYS_ADMIN ─────────────────────────────────────
async function testCrudAdmin() {
  console.log('\n👤 FASE 1 — CRUD Admin (/api/admin/usuarios)')

  // 1.1 — GET lista
  const listRes = await get('/api/admin/usuarios')
  if (listRes.ok && Array.isArray(listRes.json())) {
    pass('1.1', 'GET lista de usuários', `${(listRes.json() as unknown[]).length} registros`)
  } else {
    fail('1.1', 'GET lista de usuários', String(listRes.status))
  }

  // 1.2 — POST criar
  const email = `teste-${RUN_ID}@grupopaubrasil.com.br`
  const criarRes = await post('/api/admin/usuarios', {
    name:     `Usuário Teste ${RUN_ID}`,
    email,
    password: 'Senha@12345',
    role:     'USER',
    nivel:    'COLABORADOR',
  })
  const criado = criarRes.json<{ id?: string; error?: string }>()
  if (criado.id) {
    IDs.adminUserId = criado.id
    pass('1.2', 'POST criar usuário', criado.id)
  } else {
    fail('1.2', 'POST criar usuário', JSON.stringify(criado.error))
    return
  }

  // 1.3 — PATCH atualizar nome
  const patchRes = await patch(`/api/admin/usuarios/${IDs.adminUserId}`, {
    name: `Usuário Atualizado ${RUN_ID}`,
  })
  if (patchRes.ok) {
    pass('1.3', 'PATCH atualizar nome')
  } else {
    fail('1.3', 'PATCH atualizar nome', String(patchRes.status))
  }

  // 1.4 — DELETE (soft delete → isActive: false)
  const deleteRes = await del(`/api/admin/usuarios/${IDs.adminUserId}`)
  const deleteData = deleteRes.json<{ ok?: boolean; error?: string }>()
  if (deleteRes.ok && deleteData.ok) {
    pass('1.4', 'DELETE desativar usuário (soft delete)')
  } else {
    fail('1.4', 'DELETE desativar usuário', JSON.stringify(deleteData.error))
  }

  // 1.5 — PATCH reativar
  const reativarRes = await patch(`/api/admin/usuarios/${IDs.adminUserId}`, { isActive: true })
  if (reativarRes.ok) {
    pass('1.5', 'PATCH reativar usuário')
  } else {
    fail('1.5', 'PATCH reativar usuário', String(reativarRes.status))
  }
}

// ── Fase 2: Bulk deactivate ───────────────────────────────────────────────────
async function testBulkDeactivate() {
  console.log('\n🗑️  FASE 2 — Bulk Deactivate')

  // Cria 3 usuários para desativar em massa
  const bulkIds: string[] = []
  for (let i = 1; i <= 3; i++) {
    const res = await post('/api/admin/usuarios', {
      name:     `Bulk User ${RUN_ID}-${i}`,
      email:    `bulk-${RUN_ID}-${i}@grupopaubrasil.com.br`,
      password: 'Senha@12345',
      role:     'USER',
      nivel:    'COLABORADOR',
    })
    const data = res.json<{ id?: string }>()
    if (data.id) bulkIds.push(data.id)
  }

  if (bulkIds.length < 3) {
    fail('2.1', 'Setup — criar 3 usuários para bulk', `Criados: ${bulkIds.length}`)
    return
  }
  pass('2.1', 'Setup — 3 usuários criados', bulkIds.join(', '))
  IDs.bulkIds = bulkIds.join(',')

  // 2.2 — Bulk deactivate dos 3
  const bulkRes = await post('/api/admin/usuarios/bulk-deactivate', { ids: bulkIds })
  const bulkData = bulkRes.json<{ deactivated?: number; skipped?: number; error?: string }>()
  if (bulkRes.ok && bulkData.deactivated === 3) {
    pass('2.2', 'POST bulk-deactivate — desativou 3', `skipped: ${bulkData.skipped}`)
  } else {
    fail('2.2', 'POST bulk-deactivate', JSON.stringify(bulkData))
  }

  // 2.3 — Bulk com ID do próprio admin (deve pular)
  const sessRes  = await get('/api/auth/session')
  const sessData = sessRes.json<{ user?: { id: string } }>()
  const adminId  = sessData.user?.id ?? ''

  if (adminId) {
    const selfRes  = await post('/api/admin/usuarios/bulk-deactivate', { ids: [adminId] })
    if (!selfRes.ok) {
      pass('2.3', 'Bulk com próprio ID retorna erro (protecao auto-desativacao)')
    } else {
      fail('2.3', 'Bulk com próprio ID deveria retornar erro')
    }
  } else {
    fail('2.3', 'Não foi possível obter ID do admin para teste de self-protection')
  }

  // 2.4 — Bulk com lista vazia deve retornar 400
  const emptyRes = await post('/api/admin/usuarios/bulk-deactivate', { ids: [] })
  if (!emptyRes.ok) {
    pass('2.4', 'Bulk com lista vazia retorna 400')
  } else {
    fail('2.4', 'Bulk com lista vazia deveria retornar 400')
  }
}

// ── Fase 3: Controle de permissões ───────────────────────────────────────────
async function testPermissoes() {
  console.log('\n🔒 FASE 3 — Permissões')

  // 3.1 — Sem sessão: deve retornar 401
  const savedCookies = [...cookies]
  cookies = []

  const semSessaoRes = await get('/api/admin/usuarios')
  if (semSessaoRes.status === 401) {
    pass('3.1', 'GET sem sessão retorna 401')
  } else {
    fail('3.1', 'GET sem sessão deveria retornar 401', String(semSessaoRes.status))
  }

  const semSessaoBulk = await post('/api/admin/usuarios/bulk-deactivate', { ids: ['qualquer'] })
  if (semSessaoBulk.status === 401) {
    pass('3.2', 'POST bulk sem sessão retorna 401')
  } else {
    fail('3.2', 'POST bulk sem sessão deveria retornar 401', String(semSessaoBulk.status))
  }

  // Restaura sessão
  cookies = savedCookies

  // 3.3 — Restaura e verifica que voltou a funcionar
  const comSessaoRes = await get('/api/admin/usuarios')
  if (comSessaoRes.ok) {
    pass('3.3', 'GET com sessão restaurada retorna 200')
  } else {
    fail('3.3', 'GET com sessão deveria retornar 200', String(comSessaoRes.status))
  }
}

// ── Fase 4: Validações de campos ─────────────────────────────────────────────
async function testValidacoes() {
  console.log('\n🧪 FASE 4 — Validações de campos')

  // 4.1 — Email de domínio errado
  const emailErradoRes = await post('/api/admin/usuarios', {
    name:     'Teste Domínio',
    email:    'teste@gmail.com',
    password: 'Senha@12345',
  })
  if (!emailErradoRes.ok) {
    pass('4.1', 'Email de domínio inválido retorna erro')
  } else {
    fail('4.1', 'Email de domínio inválido deveria retornar erro')
  }

  // 4.2 — Senha muito curta
  const senhaCurtaRes = await post('/api/admin/usuarios', {
    name:     'Teste Senha',
    email:    `senha-curta-${RUN_ID}@grupopaubrasil.com.br`,
    password: '123',
  })
  if (!senhaCurtaRes.ok) {
    pass('4.2', 'Senha curta retorna erro')
  } else {
    fail('4.2', 'Senha curta deveria retornar erro')
  }

  // 4.3 — Nome muito curto (< 2 chars)
  const nomeCurtoRes = await post('/api/admin/usuarios', {
    name:     'A',
    email:    `nome-curto-${RUN_ID}@grupopaubrasil.com.br`,
    password: 'Senha@12345',
  })
  if (!nomeCurtoRes.ok) {
    pass('4.3', 'Nome muito curto retorna erro')
  } else {
    fail('4.3', 'Nome muito curto deveria retornar erro')
  }

  // 4.4 — Email duplicado (usa o usuário criado na fase 1)
  if (IDs.adminUserId) {
    const listRes = await get('/api/admin/usuarios')
    const lista   = listRes.json<{ id: string; email: string }[]>()
    const existente = lista.find(u => u.id === IDs.adminUserId)
    if (existente?.email) {
      const dupRes = await post('/api/admin/usuarios', {
        name:     'Duplicado',
        email:    existente.email,
        password: 'Senha@12345',
      })
      if (!dupRes.ok) {
        pass('4.4', 'Email duplicado retorna erro')
      } else {
        fail('4.4', 'Email duplicado deveria retornar erro')
      }
    } else {
      fail('4.4', 'Não encontrou email do usuário de teste para checar duplicata')
    }
  }
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
async function cleanup() {
  console.log('\n🧹 Cleanup — desativando usuários de teste')

  const allTestIds = [
    IDs.adminUserId,
    ...(IDs.bulkIds ? IDs.bulkIds.split(',') : []),
  ].filter(Boolean)

  for (const id of allTestIds) {
    await patch(`/api/admin/usuarios/${id}`, { isActive: false }).catch(() => {})
  }

  console.log(`  🗑️  ${allTestIds.length} usuário(s) desativado(s)`)
}

// ── Relatório final ───────────────────────────────────────────────────────────
function printReport() {
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total  = results.length

  console.log('\n' + '─'.repeat(60))
  console.log(`📋 Resultado: ${passed}/${total} cenários passando`)

  if (failed > 0) {
    console.log('\nFalhas:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ [${r.step}] ${r.label}${r.info ? ' — ' + r.info : ''}`)
    })
  }

  console.log('─'.repeat(60))

  if (failed > 0) process.exit(1)
}

// ── Entry point ───────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 test-usuarios.ts — iniciando')
  console.log(`   RUN_ID: ${RUN_ID}  |  BASE: ${BASE}`)

  try {
    const loggedIn = await login()
    if (!loggedIn) {
      console.error('\n💥 Falha no login — abortando')
      process.exit(1)
    }

    await testCrudAdmin()
    await testBulkDeactivate()
    await testPermissoes()
    await testValidacoes()
  } finally {
    await cleanup()
    printReport()
  }
}

main().catch(err => {
  console.error('💥 Erro inesperado:', err)
  process.exit(1)
})
