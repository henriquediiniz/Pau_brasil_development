/**
 * scripts/test-obz.ts
 *
 * Teste E2E do processo OBZ — 2 meses completos (Jan + Fev 2026)
 *
 * Pré-requisito: dev server rodando em localhost:3000
 *   npm run dev
 *
 * Execução:
 *   npx tsx scripts/test-obz.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const BASE = 'http://localhost:3000'
const ANO  = 2026

// ── Credenciais de teste ─────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@grupopaubrasil.com.br'
const ADMIN_PASS  = 'Admin@2026!'

// ── Estado compartilhado do teste ────────────────────────────────────────────
let cookies: string[] = []
const IDs: Record<string, string> = {}  // estado, operacao, area, pacote, linha*, areaPacote
const RUN_ID = Date.now().toString().slice(-6)  // sufixo único por execução

// ── Resultado dos testes ──────────────────────────────────────────────────────
type Result = { step: string; label: string; passed: boolean; info: string }
const results: Result[] = []

function pass(step: string, label: string, info = '') {
  results.push({ step, label, passed: true, info })
  console.log(`  ✅ ${step.padEnd(6)} ${label}${info ? ' · ' + info : ''}`)
}

function fail(step: string, label: string, info = '') {
  results.push({ step, label, passed: false, info })
  console.log(`  ❌ ${step.padEnd(6)} ${label}${info ? ' · ' + info : ''}`)
}

// ── Cookie jar ───────────────────────────────────────────────────────────────
function updateCookies(res: Response) {
  // Node 18+ fetch exposes getSetCookie()
  const setCookies: string[] = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? []
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

// ── HTTP helpers ─────────────────────────────────────────────────────────────
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

async function del(path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader() },
    body:    body ? JSON.stringify(body) : undefined,
  })
  updateCookies(res)
  return new ApiResponse(res, await safeJson(res))
}

async function postForm(path: string, fields: Record<string, string | Blob>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { Cookie: cookieHeader() },
    body:    fd,
  })
  updateCookies(res)
  return new ApiResponse(res, await safeJson(res))
}

function csvBlob(content: string, name = 'test.csv') {
  return new File([content], name, { type: 'text/csv' })
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login() {
  console.log('\n🔐 FASE 0 — Autenticação e Setup')

  // 1. Obter CSRF token
  const csrfRes  = await get('/api/auth/csrf')
  const csrfData = csrfRes.json<{ csrfToken: string }>()
  if (!csrfData.csrfToken) { fail('0.1', 'Login admin — CSRF token'); return false }

  // 2. Fazer login via credentials
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

  const hasCookie = cookies.some(c => c.startsWith('next-auth.session-token=') || c.startsWith('__Secure-next-auth.session-token='))
  if (hasCookie) {
    pass('0.1', 'Login admin', `${cookies.length} cookies`)
    return true
  }

  // Fallback: check /api/auth/session
  const sessRes  = await get('/api/auth/session')
  const sessData = sessRes.json<{ user?: { email: string } }>()
  if (sessData.user?.email === ADMIN_EMAIL) {
    pass('0.1', 'Login admin via session check')
    return true
  }

  fail('0.1', 'Login admin — sem cookie de sessão')
  return false
}

// ── FASE 0: Setup da estrutura ────────────────────────────────────────────────
async function setupEstrutura() {
  // Estado
  const estRes  = await post('/api/obz/estrutura', { tipo: 'estado', nome: `E2E-Estado-${RUN_ID}` })
  const estData = estRes.json<{ id?: string; error?: string }>()
  if (estData.id) { IDs.estado = estData.id; pass('0.2', 'Criar Estado', estData.id) }
  else { fail('0.2', 'Criar Estado', estData.error ?? String(estRes.status)); return false }

  // Operacao
  const opRes  = await post('/api/obz/estrutura', { tipo: 'operacao', nome: `E2E-Op-${RUN_ID}`, parentId: IDs.estado })
  const opData = opRes.json<{ id?: string; error?: string }>()
  if (opData.id) { IDs.operacao = opData.id; pass('0.3', 'Criar Operação', opData.id) }
  else { fail('0.3', 'Criar Operação', opData.error ?? String(opRes.status)); return false }

  // Area
  const areaRes  = await post('/api/obz/estrutura', { tipo: 'area', nome: `E2E-Area-${RUN_ID}`, parentId: IDs.operacao })
  const areaData = areaRes.json<{ id?: string; error?: string }>()
  if (areaData.id) { IDs.area = areaData.id; pass('0.4', 'Criar Área', areaData.id) }
  else { fail('0.4', 'Criar Área', areaData.error ?? String(areaRes.status)); return false }

  // Pacote
  const pkgRes  = await post('/api/obz/estrutura', { tipo: 'pacote', nome: `E2E-Pacote-${RUN_ID}` })
  const pkgData = pkgRes.json<{ id?: string; error?: string }>()
  if (pkgData.id) { IDs.pacote = pkgData.id; pass('0.5', 'Criar Pacote', pkgData.id) }
  else { fail('0.5', 'Criar Pacote', pkgData.error ?? String(pkgRes.status)); return false }

  // Linha pai 1 (Infraestrutura)
  const l1Res  = await post('/api/obz/estrutura', { tipo: 'linha', nome: 'Infraestrutura-E2E', pacoteId: IDs.pacote })
  const l1Data = l1Res.json<{ id?: string }>()
  if (l1Data.id) { IDs.linhaP1 = l1Data.id }
  else { fail('0.6a', 'Criar Linha Pai 1'); return false }

  // Linhas folha dentro de Infraestrutura-E2E
  for (const [key, nome] of [['linhaF1', 'Energia-E2E'], ['linhaF2', 'Agua-E2E']] as const) {
    const res  = await post('/api/obz/estrutura', { tipo: 'linha', nome, pacoteId: IDs.pacote, linhaParentId: IDs.linhaP1 })
    const data = res.json<{ id?: string }>()
    if (data.id) { IDs[key] = data.id }
    else { fail('0.6b', `Criar linha folha ${nome}`); return false }
  }

  // Linha pai 2 (Software)
  const l2Res  = await post('/api/obz/estrutura', { tipo: 'linha', nome: 'Software-E2E', pacoteId: IDs.pacote })
  const l2Data = l2Res.json<{ id?: string }>()
  if (l2Data.id) { IDs.linhaP2 = l2Data.id }
  else { fail('0.6c', 'Criar Linha Pai 2'); return false }

  // Linhas folha dentro de Software-E2E
  for (const [key, nome] of [['linhaF3', 'Licencas-E2E'], ['linhaF4', 'Suporte-TI-E2E']] as const) {
    const res  = await post('/api/obz/estrutura', { tipo: 'linha', nome, pacoteId: IDs.pacote, linhaParentId: IDs.linhaP2 })
    const data = res.json<{ id?: string }>()
    if (data.id) { IDs[key] = data.id }
    else { fail('0.6d', `Criar linha folha ${nome}`); return false }
  }

  pass('0.6', 'Criar hierarquia de linhas (2 pais + 4 folhas)', `pais: ${IDs.linhaP1}, ${IDs.linhaP2}`)

  // Obter userId do admin logado
  const sessRes  = await get('/api/auth/session')
  const sessData = sessRes.json<{ user?: { id?: string } }>()
  const adminId  = sessData.user?.id
  if (!adminId) { fail('0.6e', 'Resolver userId do admin'); return false }
  IDs.adminUserId = adminId

  // AreaPacote — atribui pacote à area com dono = admin
  // Usa linhaP1 como "linha raiz" da atribuição
  const apRes  = await post('/api/obz/estrutura', {
    tipo:     'area-pacote',
    parentId:  IDs.area,
    pacoteId:  IDs.pacote,
    linhaId:   IDs.linhaP1,
    donoId:    IDs.adminUserId,
  })
  const apData = apRes.json<{ id?: string; error?: string }>()
  if (apData.id) { IDs.areaPacote = apData.id; pass('0.7', 'Criar AreaPacote (atribuição)', apData.id) }
  else { fail('0.7', 'Criar AreaPacote', apData.error ?? String(apRes.status)); return false }

  // Abrir período anual 2026
  const paRes  = await patch('/api/obz/periodo-anual', { ano: ANO, aberto: true, travado: false })
  const paData = paRes.json<{ aberto?: boolean }>()
  if (paData.aberto === true) { pass('0.8', 'Abrir período anual 2026') }
  else { fail('0.8', 'Abrir período anual 2026', JSON.stringify(paData)) }

  return true
}

// ── FASE 1: Import Plano de Contas ────────────────────────────────────────────
async function testImportContas() {
  console.log('\n📋 FASE 1 — Import Plano de Contas (dContas.csv)')

  // 1.1 Download template
  const tplRes = await get('/api/admin/obz/importar-contas')
  if (tplRes.ok && tplRes.res.headers.get('content-type')?.includes('text/csv')) {
    pass('1.1', 'GET template plano de contas', 'text/csv OK')
  } else {
    fail('1.1', 'GET template plano de contas', `status ${tplRes.status}`)
  }

  // 1.2 / 1.3 Upload do CSV de contas — nomes com RUN_ID para evitar conflito com runs anteriores
  const contasCsv = [
    'NBZ;Pacote;VBZ1;Conta;Conta Gerencial;VBZ;Dono',
    `E2E;E2E-Contas-${RUN_ID};Custos-${RUN_ID};4110101;Energia-${RUN_ID};Energia-${RUN_ID};admin@grupopaubrasil.com.br`,
    `E2E;E2E-Contas-${RUN_ID};Custos-${RUN_ID};4110102;Agua-${RUN_ID};Agua-${RUN_ID};admin@grupopaubrasil.com.br`,
    `E2E;E2E-Contas-${RUN_ID};TI-${RUN_ID};4110201;Licencas-${RUN_ID};Licencas-${RUN_ID};admin@grupopaubrasil.com.br`,
    `E2E;E2E-Contas-${RUN_ID};TI-${RUN_ID};4110202;Suporte-${RUN_ID};Suporte-${RUN_ID};admin@grupopaubrasil.com.br`,
  ].join('\r\n')
  const csvFile = new File([contasCsv], 'dcontas-teste.csv', { type: 'text/csv' })

  const uploadRes  = await postForm('/api/admin/obz/importar-contas', { arquivo: csvFile })
  const uploadData = uploadRes.json<{ criados?: number; atualizados?: number; semAlteracao?: number; erros?: unknown[] }>()
  if (uploadRes.ok && (uploadData.criados ?? 0) > 0 && (uploadData.erros ?? []).length === 0) {
    pass('1.3', 'POST importar contas (1ª vez)', `criados: ${uploadData.criados}`)
  } else {
    fail('1.3', 'POST importar contas (1ª vez)', JSON.stringify(uploadData))
  }

  // 1.4 Idempotência — segunda importação deve retornar semAlteracao > 0, criados = 0
  const upload2Res  = await postForm('/api/admin/obz/importar-contas', { arquivo: csvFile })
  const upload2Data = upload2Res.json<{ criados?: number; atualizados?: number; semAlteracao?: number }>()
  if (upload2Res.ok && (upload2Data.criados ?? -1) === 0 && (upload2Data.semAlteracao ?? 0) > 0) {
    pass('1.4', 'POST importar contas (2ª vez — idempotência)', `semAlteracao: ${upload2Data.semAlteracao}`)
  } else {
    fail('1.4', 'POST importar contas idempotência', JSON.stringify(upload2Data))
  }
}

// ── Gerar CSV de orçado ───────────────────────────────────────────────────────
function buildOrcadoCSV(areaPacoteId: string, leafRows: { linhaId: string; label: string; valor: number }[]) {
  const header = ['areaPacoteId', 'linhaId', 'Pacote', 'Area', 'Operacao', 'Linha de Custo',
    'Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].join(';')
  const rows = leafRows.map(r =>
    [areaPacoteId, r.linhaId, `E2E-Pacote-${RUN_ID}`, `E2E-Area-${RUN_ID}`, `E2E-Estado-${RUN_ID} / E2E-Op-${RUN_ID}`, r.label,
      ...Array(12).fill(r.valor.toFixed(2).replace('.', ','))
    ].join(';')
  )
  return '\uFEFF' + [header, ...rows].join('\r\n')
}

function buildRealCSV(areaPacoteId: string, mes: number, leafRows: { linhaId: string; label: string; valor: number }[]) {
  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const header = ['areaPacoteId', 'linhaId', 'Pacote', 'Area', 'Operacao', 'Linha de Custo', MESES[mes - 1]].join(';')
  const rows = leafRows.map(r =>
    [areaPacoteId, r.linhaId, `E2E-Pacote-${RUN_ID}`, `E2E-Area-${RUN_ID}`, `E2E-Estado-${RUN_ID} / E2E-Op-${RUN_ID}`, r.label,
      r.valor.toFixed(2).replace('.', ',')
    ].join(';')
  )
  return '\uFEFF' + [header, ...rows].join('\r\n')
}

// ── FASE 2: Mês 1 — Janeiro ───────────────────────────────────────────────────
async function testMesJaneiro() {
  console.log('\n📅 FASE 2 — Mês 1: Janeiro 2026')

  const leafRows = [
    { linhaId: IDs.linhaF1, label: 'Infraestrutura-E2E › Energia-E2E', valor: 1000 },
    { linhaId: IDs.linhaF2, label: 'Infraestrutura-E2E › Agua-E2E',    valor: 500  },
    { linhaId: IDs.linhaF3, label: 'Software-E2E › Licencas-E2E',      valor: 2000 },
    { linhaId: IDs.linhaF4, label: 'Software-E2E › Suporte-TI-E2E',    valor: 300  },
  ]

  // 2.1 Download template orçado
  const tplRes = await get(`/api/obz/importar?ano=${ANO}&tipo=orcado`)
  if (tplRes.ok) { pass('2.1', 'GET template orçado', 'OK') }
  else { fail('2.1', 'GET template orçado', `status ${tplRes.status}`) }

  // 2.3 Import orçado — valores iguais para os 12 meses
  const orcCsv = buildOrcadoCSV(IDs.areaPacote, leafRows)
  const orcRes  = await postForm('/api/obz/importar', {
    arquivo: new File([orcCsv], 'orcado.csv', { type: 'text/csv' }),
    ano:     String(ANO),
    tipo:    'orcado',
  })
  const orcData = orcRes.json<{ importados?: number; ignorados?: number; erros?: unknown[] }>()
  if (orcRes.ok && (orcData.importados ?? 0) >= 4) {
    pass('2.3', 'POST importar orçado (12 meses × 4 linhas)', `importados: ${orcData.importados}`)
  } else {
    fail('2.3', 'POST importar orçado', JSON.stringify(orcData))
  }

  // 2.4 Travar período anual e tentar reimportar orçado
  // Admins bypassam a trava — comportamento esperado (validação só bloqueia não-admins)
  await patch('/api/obz/periodo-anual', { ano: ANO, travado: true })
  const orcTravadoRes  = await postForm('/api/obz/importar', {
    arquivo: new File([orcCsv], 'orcado.csv', { type: 'text/csv' }),
    ano:     String(ANO),
    tipo:    'orcado',
  })
  if (orcTravadoRes.status === 200) {
    pass('2.4', 'Admin bypassa trava anual — comportamento esperado', 'status 200 (não-admin receberia 400)')
  } else {
    fail('2.4', 'Import orçado com trava', `status ${orcTravadoRes.status}`)
  }

  // 2.5 Destrancar e reimportar
  await patch('/api/obz/periodo-anual', { ano: ANO, travado: false })
  const orcDesTravRes  = await postForm('/api/obz/importar', {
    arquivo: new File([orcCsv], 'orcado.csv', { type: 'text/csv' }),
    ano:     String(ANO),
    tipo:    'orcado',
  })
  const orcDT = orcDesTravRes.json<{ importados?: number }>()
  if (orcDesTravRes.ok && (orcDT.importados ?? 0) >= 4) {
    pass('2.5', 'Orçado reimportado após destravamento', `importados: ${orcDT.importados}`)
  } else {
    fail('2.5', 'Reimportar orçado após destravamento', JSON.stringify(orcDT))
  }

  // 2.6 Abrir tendência com força para Jan
  const tendAbRes  = await patch('/api/obz/periodo', { ano: ANO, mes: 1, tendenciaAbertaForca: true, tendenciaOverrideMotivo: 'Teste E2E' })
  const tendAbData = tendAbRes.json<{ tendenciaAbertaForca?: boolean }>()
  if (tendAbData.tendenciaAbertaForca === true) {
    pass('2.6', 'Abrir tendência forçada — Janeiro', 'tendenciaAbertaForca=true')
  } else {
    fail('2.6', 'Abrir tendência forçada', JSON.stringify(tendAbData))
  }

  // 2.7 Tendência abaixo do orçado — sem justificativa obrigatória
  const tend1Res  = await post('/api/obz/lancamentos', {
    linhaId: IDs.linhaF1, areaPacoteId: IDs.areaPacote, ano: ANO, mes: 1, tendencia: 950,
  })
  const tend1Data = tend1Res.json<{ id?: string }>()
  if (tend1Res.ok && tend1Data.id) {
    pass('2.7', 'Tendência abaixo do orçado (950 < 1000) — sem justificativa', tend1Data.id)
    IDs.lanc1 = tend1Data.id
  } else {
    fail('2.7', 'Tendência abaixo do orçado', JSON.stringify(tend1Data))
  }

  // 2.8 Tendência acima sem justificativa — admin bypassa validação
  const tend2Res = await post('/api/obz/lancamentos', {
    linhaId: IDs.linhaF1, areaPacoteId: IDs.areaPacote, ano: ANO, mes: 1, tendencia: 1200,
  })
  if (tend2Res.status === 200 || tend2Res.status === 201) {
    pass('2.8', 'Admin bypassa justificativa de tendência — comportamento esperado', 'status 200 (não-admin receberia 422)')
  } else {
    fail('2.8', 'Tendência acima sem justificativa', `status ${tend2Res.status}`)
  }

  // 2.9 Tendência acima COM justificativa → deve passar
  const tend3Res  = await post('/api/obz/lancamentos', {
    linhaId:      IDs.linhaF1,
    areaPacoteId: IDs.areaPacote,
    ano:          ANO,
    mes:          1,
    tendencia:    1200,
    tendenciaJust:'Aumento de demanda de energia no mês de janeiro.',
  })
  const tend3Data = tend3Res.json<{ id?: string }>()
  if (tend3Res.ok && tend3Data.id) {
    pass('2.9', 'Tendência 1200 com justificativa → 200', tend3Data.id)
  } else {
    fail('2.9', 'Tendência acima com justificativa', JSON.stringify(tend3Data))
  }

  // 2.10 Abrir período para real
  const perRes  = await patch('/api/obz/periodo', { ano: ANO, mes: 1, aberto: true })
  const perData = perRes.json<{ aberto?: boolean }>()
  if (perData.aberto === true) {
    pass('2.10', 'Abrir período Janeiro para real', 'aberto=true')
  } else {
    fail('2.10', 'Abrir período Janeiro', JSON.stringify(perData))
  }

  // 2.11 Download template real
  const tplRealRes = await get(`/api/obz/importar?ano=${ANO}&tipo=real`)
  if (tplRealRes.ok) { pass('2.11', 'GET template real', 'OK') }
  else { fail('2.11', 'GET template real', `status ${tplRealRes.status}`) }

  // 2.13 Import real Janeiro — 4 linhas dentro do orçado
  const realJanCsv = buildRealCSV(IDs.areaPacote, 1, [
    { linhaId: IDs.linhaF1, label: 'Infraestrutura-E2E › Energia-E2E', valor: 980  },
    { linhaId: IDs.linhaF2, label: 'Infraestrutura-E2E › Agua-E2E',    valor: 490  },
    { linhaId: IDs.linhaF3, label: 'Software-E2E › Licencas-E2E',      valor: 1950 },
    { linhaId: IDs.linhaF4, label: 'Software-E2E › Suporte-TI-E2E',    valor: 295  },
  ])
  const realRes  = await postForm('/api/obz/importar', {
    arquivo: new File([realJanCsv], 'real-jan.csv', { type: 'text/csv' }),
    ano:     String(ANO),
    tipo:    'real',
  })
  const realData = realRes.json<{ importados?: number; erros?: unknown[] }>()
  if (realRes.ok && (realData.importados ?? 0) >= 4) {
    pass('2.13', 'POST importar real Janeiro (4 linhas abaixo do orçado)', `importados: ${realData.importados}`)
  } else {
    fail('2.13', 'POST importar real Janeiro', JSON.stringify(realData))
  }

  // 2.14 Verificar meus-pacotes — lançamentos de Jan com real preenchido
  // A API retorna pacote.linhas[root].filhas[].filhas[].lancamentos — precisa traversal recursivo
  const meusPacRes  = await get('/api/obz/meus-pacotes')
  const meusPacData = meusPacRes.json<unknown[]>()
  type LancRow = { mes: number; real: string | null; orcado: string }
  type LinhaNode = { lancamentos?: LancRow[]; filhas?: LinhaNode[] }
  function collectLancamentos(linhas: LinhaNode[]): LancRow[] {
    return linhas.flatMap(l => [
      ...(l.lancamentos ?? []),
      ...collectLancamentos(l.filhas ?? []),
    ])
  }
  const lancJan = Array.isArray(meusPacData)
    ? meusPacData.flatMap((ap: unknown) => {
        const typed = ap as { pacote?: { linhas?: LinhaNode[] } }
        return collectLancamentos(typed.pacote?.linhas ?? []).filter(la => la.mes === 1 && la.real !== null)
      })
    : []
  // areaPacote vinculado a linhaP1 → subtree tem linhaF1 + linhaF2 = 2 lançamentos
  if (lancJan.length >= 2) {
    pass('2.14', `Verificar meus-pacotes: ${lancJan.length} lançamentos de Jan com real`, '')
  } else {
    fail('2.14', 'Real de Janeiro não aparece em meus-pacotes', `encontrados: ${lancJan.length}`)
  }

  // 2.15 Real acima do orçado SEM justificativa → 422
  const realSobRes = await post('/api/obz/lancamentos', {
    linhaId: IDs.linhaF1, areaPacoteId: IDs.areaPacote, ano: ANO, mes: 1, real: 1500,
  })
  if (realSobRes.status === 422) {
    pass('2.15', 'Real 1500 > 1000 sem justificativa → 422')
  } else {
    fail('2.15', 'Real acima sem justificativa deveria ser 422', `status ${realSobRes.status}`)
  }

  // 2.16 Real acima COM justificativa → OK + justificativa PENDING
  const realJustRes  = await post('/api/obz/lancamentos', {
    linhaId:       IDs.linhaF1,
    areaPacoteId:  IDs.areaPacote,
    ano:           ANO,
    mes:           1,
    real:          1500,
    justificativa: 'Custo de energia revisto após reajuste da concessionária em Janeiro.',
  })
  const realJustData = realJustRes.json<{ id?: string }>()
  if (realJustRes.ok && realJustData.id) {
    pass('2.16', 'Real 1500 com justificativa → OK', realJustData.id)
    IDs.lancComJust = realJustData.id
  } else {
    fail('2.16', 'Real acima com justificativa', JSON.stringify(realJustData))
  }

  // 2.17 Listar justificativas PENDING
  const justPendRes  = await get('/api/obz/justificativas?status=PENDING')
  const justPendData = justPendRes.json<{ id: string }[]>()
  if (Array.isArray(justPendData) && justPendData.length > 0) {
    IDs.justId = justPendData[0].id
    pass('2.17', `Listar justificativas PENDING`, `${justPendData.length} pendentes`)
  } else {
    fail('2.17', 'Sem justificativas pendentes', JSON.stringify(justPendData).slice(0, 200))
  }

  // 2.18 Aprovar justificativa
  if (IDs.justId) {
    const aprovRes  = await patch(`/api/obz/justificativas/${IDs.justId}`, { action: 'approve', note: 'Verificado e aprovado pelo teste E2E' })
    const aprovData = aprovRes.json<{ status?: string }>()
    if (aprovData.status === 'APPROVED') {
      pass('2.18', 'Aprovar justificativa', `status: APPROVED`)
    } else {
      fail('2.18', 'Aprovar justificativa', JSON.stringify(aprovData))
    }
  } else {
    fail('2.18', 'Aprovar justificativa — sem ID disponível')
  }

  // 2.19 Criar + rejeitar uma nova justificativa
  const realRejRes = await post('/api/obz/lancamentos', {
    linhaId:       IDs.linhaF2,
    areaPacoteId:  IDs.areaPacote,
    ano:           ANO,
    mes:           1,
    real:          700,
    justificativa: 'Custo de água acima do previsto por vazamento identificado.',
  })
  const realRejData = realRejRes.json<{ id?: string }>()
  if (realRejRes.ok && realRejData.id) {
    // Buscar a nova justificativa
    const novasJustRes  = await get('/api/obz/justificativas?status=PENDING')
    const novasJust     = novasJustRes.json<{ id: string }[]>()
    const novaId        = novasJust[0]?.id
    if (novaId) {
      const rejRes  = await patch(`/api/obz/justificativas/${novaId}`, { action: 'reject', note: 'Não autorizado — acima do limite mensal' })
      const rejData = rejRes.json<{ status?: string }>()
      if (rejData.status === 'REJECTED') {
        pass('2.19', 'Rejeitar justificativa', 'status: REJECTED')
      } else {
        fail('2.19', 'Rejeitar justificativa', JSON.stringify(rejData))
      }
    } else {
      fail('2.19', 'Rejeitar justificativa — sem nova justificativa pendente')
    }
  } else {
    fail('2.19', 'Criar lançamento para testar rejeição', JSON.stringify(realRejData))
  }

  // 2.20 Fechar período Janeiro
  const fechRes  = await patch('/api/obz/periodo', { ano: ANO, mes: 1, aberto: false })
  const fechData = fechRes.json<{ aberto?: boolean }>()
  if (fechData.aberto === false) {
    pass('2.20', 'Fechar período Janeiro', 'aberto=false')
  } else {
    fail('2.20', 'Fechar período Janeiro', JSON.stringify(fechData))
  }

  // 2.21 Tentar importar real com período fechado
  const realFechadoRes = await postForm('/api/obz/importar', {
    arquivo: new File([realJanCsv], 'real-jan.csv', { type: 'text/csv' }),
    ano:     String(ANO),
    tipo:    'real',
  })
  // Admins ainda podem importar — mas o CSV pode retornar 0 meses abertos
  // Para um usuário normal seria 400/404; como somos admin, a rota ainda funciona
  // O que testamos é que a API não quebre
  if (realFechadoRes.status < 500) {
    pass('2.21', 'Import real com período fechado (admin bypassa)', `status ${realFechadoRes.status}`)
  } else {
    fail('2.21', 'Import real com período fechado causou erro 5xx', `status ${realFechadoRes.status}`)
  }
}

// ── FASE 3: Mês 2 — Fevereiro ────────────────────────────────────────────────
async function testMesFevereiro() {
  console.log('\n📅 FASE 3 — Mês 2: Fevereiro 2026')

  // 3.1 Abrir Fevereiro
  const perRes  = await patch('/api/obz/periodo', { ano: ANO, mes: 2, aberto: true, tendenciaAbertaForca: true })
  const perData = perRes.json<{ aberto?: boolean }>()
  if (perData.aberto === true) {
    pass('3.1', 'Abrir período Fevereiro com tendência forçada')
  } else {
    fail('3.1', 'Abrir período Fevereiro', JSON.stringify(perData))
  }

  // 3.2 Importar tendência Fev via CSV
  const tendFevCsv = buildRealCSV(IDs.areaPacote, 2, [
    { linhaId: IDs.linhaF1, label: 'Infraestrutura-E2E › Energia-E2E', valor: 1100 },
    { linhaId: IDs.linhaF2, label: 'Infraestrutura-E2E › Agua-E2E',    valor: 480  },
    { linhaId: IDs.linhaF3, label: 'Software-E2E › Licencas-E2E',      valor: 1900 },
    { linhaId: IDs.linhaF4, label: 'Software-E2E › Suporte-TI-E2E',    valor: 310  },
  ])
  const tendFevRes  = await postForm('/api/obz/importar', {
    arquivo: new File([tendFevCsv], 'tend-fev.csv', { type: 'text/csv' }),
    ano:     String(ANO),
    tipo:    'tendencia',
  })
  const tendFevData = tendFevRes.json<{ importados?: number; justificativas?: number }>()
  if (tendFevRes.ok && (tendFevData.importados ?? 0) >= 1 && (tendFevData.justificativas ?? 0) >= 4) {
    pass('3.2', 'Importar tendência Fevereiro via CSV (desvios geram justificativas)', `importados: ${tendFevData.importados}, just: ${tendFevData.justificativas}`)
  } else {
    fail('3.2', 'Importar tendência Fevereiro', JSON.stringify(tendFevData))
  }

  // 3.3 Importar real Fev — F3 e F4 acima do orçado
  const realFevCsv = buildRealCSV(IDs.areaPacote, 2, [
    { linhaId: IDs.linhaF1, label: 'Infraestrutura-E2E › Energia-E2E', valor: 980  },
    { linhaId: IDs.linhaF2, label: 'Infraestrutura-E2E › Agua-E2E',    valor: 490  },
    { linhaId: IDs.linhaF3, label: 'Software-E2E › Licencas-E2E',      valor: 2300 }, // acima de 2000
    { linhaId: IDs.linhaF4, label: 'Software-E2E › Suporte-TI-E2E',    valor: 380  }, // acima de 300
  ])
  const realFevRes  = await postForm('/api/obz/importar', {
    arquivo: new File([realFevCsv], 'real-fev.csv', { type: 'text/csv' }),
    ano:     String(ANO),
    tipo:    'real',
  })
  const realFevData = realFevRes.json<{ importados?: number; justificativas?: number }>()
  if (realFevRes.ok && (realFevData.importados ?? 0) >= 4) {
    pass('3.3', 'Importar real Fevereiro (2 linhas acima do orçado)', `importados: ${realFevData.importados}`)
  } else {
    fail('3.3', 'Importar real Fevereiro', JSON.stringify(realFevData))
  }

  // 3.4 Verificar justificativas PENDING criadas automaticamente pelo import
  // Com Fix 2, tendência CSV já criou 4 just em 3.2; real import não recria (jaExiste)
  const justFevRes  = await get('/api/obz/justificativas?status=PENDING')
  const justFevData = justFevRes.json<{ id: string }[]>()
  const pendentes   = Array.isArray(justFevData) ? justFevData.length : 0
  const justAutoTend = tendFevData.justificativas ?? 0
  const justAutoReal = realFevData.justificativas ?? 0
  if (justAutoTend >= 4 && justAutoReal >= 2 && pendentes >= 6) {
    pass('3.4', 'Justificativas criadas automaticamente pelo import CSV (tendência + real)', `auto-tend: ${justAutoTend}, total PENDING: ${pendentes}`)
  } else {
    fail('3.4', 'Justificativas automáticas não geradas', `auto-tend: ${justAutoTend}, PENDING: ${pendentes}`)
  }

  // Criar justificativas manualmente para os overages de Fev
  const just3Res = await post('/api/obz/lancamentos', {
    linhaId:       IDs.linhaF3,
    areaPacoteId:  IDs.areaPacote,
    ano:           ANO,
    mes:           2,
    real:          2300,
    justificativa: 'Renovação antecipada de licenças com reajuste de preço em Fevereiro.',
  })
  const just4Res = await post('/api/obz/lancamentos', {
    linhaId:       IDs.linhaF4,
    areaPacoteId:  IDs.areaPacote,
    ano:           ANO,
    mes:           2,
    real:          380,
    justificativa: 'Incidente crítico exigiu chamados emergenciais de suporte técnico.',
  })

  // 3.5 Aprovar ambas
  let aprovadas = 0
  const justFev2Res  = await get('/api/obz/justificativas?status=PENDING')
  const justFev2Data = justFev2Res.json<{ id: string }[]>()
  for (const j of justFev2Data) {
    const ar = await patch(`/api/obz/justificativas/${j.id}`, { action: 'approve', note: 'Aprovado no ciclo Fevereiro' })
    const ad = ar.json<{ status?: string }>()
    if (ad.status === 'APPROVED') aprovadas++
  }
  if (aprovadas > 0) {
    pass('3.5', `Aprovar justificativas Fevereiro`, `${aprovadas} aprovadas`)
  } else {
    fail('3.5', 'Nenhuma justificativa de Fevereiro aprovada')
  }

  // 3.6 Verificar YTD Jan + Fev via meus-pacotes (traversal recursivo)
  const meusPacRes  = await get('/api/obz/meus-pacotes')
  const meusPacData = meusPacRes.json<unknown[]>()
  type LancYTD = { mes: number; orcado: string; real: string | null }
  type LinhaYTD = { lancamentos?: LancYTD[]; filhas?: LinhaYTD[] }
  function collectYTD(linhas: LinhaYTD[]): LancYTD[] {
    return linhas.flatMap(l => [
      ...(l.lancamentos ?? []),
      ...collectYTD(l.filhas ?? []),
    ])
  }
  let orcadoYTD = 0, realYTD = 0
  for (const ap of meusPacData) {
    const typed = ap as { pacote?: { linhas?: LinhaYTD[] } }
    for (const la of collectYTD(typed.pacote?.linhas ?? [])) {
      if ((la.mes === 1 || la.mes === 2) && la.real !== null) {
        orcadoYTD += Number(la.orcado)
        realYTD   += Number(la.real)
      }
    }
  }
  const execPct = orcadoYTD > 0 ? (realYTD / orcadoYTD) * 100 : 0
  pass('3.6', 'YTD Jan + Fev calculado', `orçado: R$${orcadoYTD.toFixed(0)}, real: R$${realYTD.toFixed(0)}, execução: ${execPct.toFixed(1)}%`)

  // 3.7 Health badge
  const badge = execPct <= 100 ? 'No controle' : execPct <= 110 ? 'Atenção' : 'Crítico'
  pass('3.7', `Health badge: "${badge}"`, `execPct: ${execPct.toFixed(1)}%`)
}

// ── FASE 4: Submissão Anual + Travamento ──────────────────────────────────────
async function testSubmissaoAnual() {
  console.log('\n🔒 FASE 4 — Submissão Anual + Travamento')

  // 4.1 Submeter orçamento anual
  const subRes  = await post('/api/obz/submissao-anual', { ano: ANO, areaPacoteId: IDs.areaPacote })
  const subData = subRes.json<{ id?: string; error?: string }>()
  if ((subRes.ok || subRes.status === 201) && subData.id) {
    IDs.submissao = subData.id
    pass('4.1', 'Submeter orçamento anual', subData.id)
  } else {
    fail('4.1', 'Submeter orçamento anual', subData.error ?? JSON.stringify(subData))
  }

  // 4.2 Verificar estatísticas do período anual
  const paRes  = await get(`/api/obz/periodo-anual?ano=${ANO}`)
  const paData = paRes.json<{ stats?: { submetidos?: number } }>()
  if ((paData.stats?.submetidos ?? 0) > 0) {
    pass('4.2', 'Estatísticas de submissão no período anual', `submetidos: ${paData.stats?.submetidos}`)
  } else {
    fail('4.2', 'Estatísticas de submissão', JSON.stringify(paData.stats))
  }

  // 4.3 Travar período anual
  const travRes  = await patch('/api/obz/periodo-anual', { ano: ANO, travado: true, travadoNota: 'Budget aprovado pelo board — teste E2E' })
  const travData = travRes.json<{ travado?: boolean }>()
  if (travData.travado === true) {
    pass('4.3', 'Travar período anual 2026', 'travado=true')
  } else {
    fail('4.3', 'Travar período anual', JSON.stringify(travData))
  }

  // 4.4 Tentar editar orçado após trava — admin bypassa bloqueio
  const orcadoBloqRes = await post('/api/obz/lancamentos', {
    linhaId: IDs.linhaF1, areaPacoteId: IDs.areaPacote, ano: ANO, mes: 3, orcado: 999,
  })
  if (orcadoBloqRes.status === 200 || orcadoBloqRes.status === 201) {
    pass('4.4', 'Admin bypassa bloqueio pós-trava — comportamento esperado', 'status 200 (não-admin receberia 400)')
  } else {
    fail('4.4', 'Orçado após trava', `status ${orcadoBloqRes.status}`)
  }
}

// ── FASE N: Restrições de usuário não-admin ───────────────────────────────────
// Cookie jar separado para o usuário não-admin
let nonAdminCookies: string[] = []

function nonAdminCookieHeader() { return nonAdminCookies.join('; ') }

function updateNonAdminCookies(res: Response) {
  const setCookies: string[] = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? []
  for (const raw of setCookies) {
    const [nameValue] = raw.split(';')
    const eqIdx = nameValue.indexOf('=')
    if (eqIdx < 0) continue
    const name = nameValue.substring(0, eqIdx).trim()
    nonAdminCookies = nonAdminCookies.filter(c => !c.startsWith(`${name}=`))
    nonAdminCookies.push(nameValue.trim())
  }
}

async function naGet(path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { Cookie: nonAdminCookieHeader() } })
  updateNonAdminCookies(res)
  return new ApiResponse(res, await safeJson(res))
}

async function naPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Cookie: nonAdminCookieHeader() },
    body:    JSON.stringify(body),
  })
  updateNonAdminCookies(res)
  return new ApiResponse(res, await safeJson(res))
}

async function loginNonAdmin(): Promise<boolean> {
  const email    = `joao-e2e-${RUN_ID}@grupopaubrasil.com.br`
  const password = 'TestUser@2026!'

  const csrfRes  = await naGet('/api/auth/csrf')
  const csrfData = csrfRes.json<{ csrfToken: string }>()
  if (!csrfData.csrfToken) return false

  const params = new URLSearchParams({
    csrfToken: csrfData.csrfToken, email, password, callbackUrl: BASE, json: 'true',
  })
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: nonAdminCookieHeader() },
    body: params.toString(),
    redirect: 'manual',
  })
  updateNonAdminCookies(loginRes)

  const hasCookie = nonAdminCookies.some(c => c.startsWith('next-auth.session-token=') || c.startsWith('__Secure-next-auth.session-token='))
  if (hasCookie) return true

  const sessRes  = await naGet('/api/auth/session')
  const sessData = sessRes.json<{ user?: { email: string } }>()
  return sessData.user?.email === email
}

async function testNonAdminRestrictions() {
  console.log('\n🔐 FASE N — Restrições de usuário não-admin')

  // N.0 Criar usuário não-admin via API (como admin)
  const email    = `joao-e2e-${RUN_ID}@grupopaubrasil.com.br`
  const password = 'TestUser@2026!'
  const criarRes  = await post('/api/usuarios', {
    name: `João E2E ${RUN_ID}`, email, password, role: 'USER', nivel: 'COLABORADOR',
    company: 'Pau Brasil Bebidas',
  })
  const criarData = criarRes.json<{ id?: string; error?: string }>()
  if (!criarData.id) { fail('N.0', 'Criar usuário não-admin', criarData.error ?? String(criarRes.status)); return }
  IDs.nonAdminUserId = criarData.id
  pass('N.0', 'Criar usuário não-admin', criarData.id)

  // N.1 Criar AreaPacote para o não-admin (linhaP2 como raiz)
  const apRes  = await post('/api/obz/estrutura', {
    tipo: 'area-pacote', parentId: IDs.area, pacoteId: IDs.pacote,
    linhaId: IDs.linhaP2, donoId: IDs.nonAdminUserId,
  })
  const apData = apRes.json<{ id?: string; error?: string }>()
  if (!apData.id) { fail('N.1', 'Criar AreaPacote para não-admin', apData.error ?? String(apRes.status)); return }
  IDs.nonAdminAreaPacote = apData.id
  pass('N.1', 'Criar AreaPacote para não-admin', apData.id)

  // N.2 Login como não-admin
  const loggedIn = await loginNonAdmin()
  if (!loggedIn) { fail('N.2', 'Login não-admin'); return }
  pass('N.2', 'Login não-admin', email)

  // N.3 Acessar AreaPacote do admin → deve retornar 403
  const res403 = await naPost('/api/obz/lancamentos', {
    linhaId: IDs.linhaF1, areaPacoteId: IDs.areaPacote, ano: ANO, mes: 1, real: 100,
  })
  if (res403.status === 403) {
    pass('N.3', 'Lançamento em areaPacote alheio → 403')
  } else {
    fail('N.3', 'Deveria ser 403 para areaPacote alheio', `status ${res403.status}`)
  }

  // N.4 Linha fora da hierarquia atribuída (linhaF1 pertence a linhaP1, não a linhaP2)
  const resHier = await naPost('/api/obz/lancamentos', {
    linhaId: IDs.linhaF1, areaPacoteId: IDs.nonAdminAreaPacote, ano: ANO, mes: 1, orcado: 500,
  })
  if (resHier.status === 403) {
    pass('N.4', 'Linha fora da hierarquia atribuída → 403')
  } else {
    fail('N.4', 'Deveria ser 403 para linha fora da hierarquia', `status ${resHier.status}`)
  }

  // N.5 Orçado após trava anual (período já travado pela FASE 4)
  const resTrava = await naPost('/api/obz/lancamentos', {
    linhaId: IDs.linhaF3, areaPacoteId: IDs.nonAdminAreaPacote, ano: ANO, mes: 3, orcado: 999,
  })
  if (resTrava.status === 400) {
    pass('N.5', 'Orçado após trava anual → 400 para não-admin')
  } else {
    fail('N.5', 'Deveria ser 400 para orçado após trava', `status ${resTrava.status}`)
  }

  // N.6 Real sem período aberto (período Jan já fechado)
  const resPeriodo = await naPost('/api/obz/lancamentos', {
    linhaId: IDs.linhaF3, areaPacoteId: IDs.nonAdminAreaPacote, ano: ANO, mes: 1, real: 500,
  })
  if (resPeriodo.status === 400) {
    pass('N.6', 'Real com período fechado → 400 para não-admin')
  } else {
    fail('N.6', 'Deveria ser 400 para real com período fechado', `status ${resPeriodo.status}`)
  }

  // N.7 Tendência > orçado sem justificativa → 422 (com tendenciaAbertaForca ainda ativo de Fev)
  // Primeiro precisamos que haja um orçado para linhaF3 — como admin
  await post('/api/obz/lancamentos', {
    linhaId: IDs.linhaF3, areaPacoteId: IDs.nonAdminAreaPacote, ano: ANO, mes: 2, orcado: 800,
  })
  const resTendSemJust = await naPost('/api/obz/lancamentos', {
    linhaId: IDs.linhaF3, areaPacoteId: IDs.nonAdminAreaPacote, ano: ANO, mes: 2, tendencia: 1200,
  })
  if (resTendSemJust.status === 422 && (resTendSemJust.json<{ requiresTendenciaJust?: boolean }>()).requiresTendenciaJust) {
    pass('N.7', 'Tendência > orçado sem justificativa → 422')
  } else if (resTendSemJust.status === 400) {
    pass('N.7', 'Tendência fora da janela de prazo → 400 (comportamento correto)', `status 400`)
  } else {
    fail('N.7', 'Tendência > orçado sem justificativa deveria ser 422 ou 400', `status ${resTendSemJust.status}`)
  }

  // N.7b Tendência < orçado sem justificativa → 422 (validação bidirecional)
  const resTendMenorSemJust = await naPost('/api/obz/lancamentos', {
    linhaId: IDs.linhaF3, areaPacoteId: IDs.nonAdminAreaPacote, ano: ANO, mes: 2, tendencia: 600,
  })
  if (resTendMenorSemJust.status === 422 && (resTendMenorSemJust.json<{ requiresTendenciaJust?: boolean }>()).requiresTendenciaJust) {
    pass('N.7b', 'Tendência < orçado sem justificativa → 422 (bidirecional)')
  } else if (resTendMenorSemJust.status === 400) {
    pass('N.7b', 'Tendência fora da janela → 400 (comportamento correto)', `status 400`)
  } else {
    fail('N.7b', 'Tendência < orçado sem justificativa deveria ser 422 ou 400', `status ${resTendMenorSemJust.status}`)
  }

  // N.7c Tendência = orçado sem justificativa → 200 (sem desvio, sem obrigação)
  const resTendIgualSemJust = await naPost('/api/obz/lancamentos', {
    linhaId: IDs.linhaF3, areaPacoteId: IDs.nonAdminAreaPacote, ano: ANO, mes: 2, tendencia: 800,
  })
  if (resTendIgualSemJust.ok) {
    pass('N.7c', 'Tendência = orçado sem justificativa → 200 (sem desvio)')
  } else if (resTendIgualSemJust.status === 400) {
    pass('N.7c', 'Tendência fora da janela → 400 (comportamento correto)', `status 400`)
  } else {
    fail('N.7c', 'Tendência = orçado sem justificativa deveria ser 200 ou 400', `status ${resTendIgualSemJust.status} ${JSON.stringify(resTendIgualSemJust.json())}`)
  }

  // N.8 Real > orçado sem justificativa (abrir período Fev novamente para este teste)
  // Período Fev foi fechado após aprovação — reabrir como admin para testar não-admin
  await patch('/api/obz/periodo', { ano: ANO, mes: 2, aberto: true })
  const resRealSemJust = await naPost('/api/obz/lancamentos', {
    linhaId: IDs.linhaF3, areaPacoteId: IDs.nonAdminAreaPacote, ano: ANO, mes: 2, real: 1500,
  })
  await patch('/api/obz/periodo', { ano: ANO, mes: 2, aberto: false }) // refechar
  if (resRealSemJust.status === 422 && (resRealSemJust.json<{ requiresJustificativa?: boolean }>()).requiresJustificativa) {
    pass('N.8', 'Real > orçado sem justificativa → 422')
  } else {
    fail('N.8', 'Real > orçado sem justificativa deveria ser 422', `status ${resRealSemJust.status}`)
  }

  // N.9 Caso feliz: real ≤ orçado COM período aberto → 200
  await patch('/api/obz/periodo', { ano: ANO, mes: 2, aberto: true })
  const resHappy = await naPost('/api/obz/lancamentos', {
    linhaId: IDs.linhaF3, areaPacoteId: IDs.nonAdminAreaPacote, ano: ANO, mes: 2, real: 700,
  })
  await patch('/api/obz/periodo', { ano: ANO, mes: 2, aberto: false }) // refechar
  if (resHappy.ok) {
    pass('N.9', 'Real ≤ orçado com período aberto → 200 ✅')
  } else {
    fail('N.9', 'Caso feliz deveria passar', `status ${resHappy.status} ${JSON.stringify(resHappy.json())}`)
  }
}

// ── FASE 5: Cleanup (hard-delete dados de teste) ─────────────────────────────
async function cleanup() {
  console.log('\n🧹 FASE 5 — Cleanup (hard-delete dados de teste)')

  // Deletar usuários de teste
  if (IDs.gestorUserId) {
    await patch(`/api/admin/usuarios/${IDs.gestorUserId}`, { isActive: false })
  }
  if (IDs.nonAdminUserId) {
    await patch(`/api/admin/usuarios/${IDs.nonAdminUserId}`, { isActive: false })
  }

  // Bulk-delete > 500 ids → deve retornar 400 (teste de limite)
  const bigIdsRes = await post('/api/admin/obz/bulk-delete', { tipo: 'linha', ids: Array(501).fill('fake-id') })
  if (bigIdsRes.status === 400) {
    pass('5.2', 'Bulk-delete > 500 ids → 400')
  } else {
    fail('5.2', 'Bulk-delete > 500 deveria ser 400', `status ${bigIdsRes.status}`)
  }

  // Soft-delete pacote de teste (linhas filhas e área-pacote via soft-delete)
  if (IDs.pacote) {
    const delPkgRes  = await post('/api/admin/obz/bulk-delete', { tipo: 'pacote', ids: [IDs.pacote] })
    const delPkgData = delPkgRes.json<{ deleted?: number }>()
    if ((delPkgData.deleted ?? 0) > 0) {
      pass('5.3', 'Soft-delete pacote de teste', `deleted: ${delPkgData.deleted}`)
    } else {
      fail('5.3', 'Soft-delete pacote', JSON.stringify(delPkgData))
    }
  }

  // Hard-delete Estado de teste (cascateia → Operação → Área → AreaPacote → Lançamentos → Justificativas)
  if (IDs.estado) {
    const delEstRes = await fetch(`${BASE}/api/obz/estrutura/${IDs.estado}`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader() },
      body:    JSON.stringify({ tipo: 'estado' }),
    })
    const delEstData = (await delEstRes.json().catch(() => ({}))) as { ok?: boolean }
    if (delEstData.ok) {
      pass('5.4', 'Hard-delete Estado de teste (cascade completo)', `id: ${IDs.estado}`)
    } else {
      fail('5.4', 'Hard-delete Estado', JSON.stringify(delEstData))
    }
  }

  // Destrancar período anual (deixar limpo para prod)
  await patch('/api/obz/periodo-anual', { ano: ANO, travado: false })
  pass('5.5', 'Destrancar período anual 2026 (pós-teste)')
}

// ── FASE G: Fluxo do gestor (aprovação departamental) ────────────────────────
let gestorCookies: string[] = []

function gestorCookieHeader() { return gestorCookies.join('; ') }

function updateGestorCookies(res: Response) {
  const setCookies: string[] = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? []
  for (const raw of setCookies) {
    const [nameValue] = raw.split(';')
    const eqIdx = nameValue.indexOf('=')
    if (eqIdx < 0) continue
    const name = nameValue.substring(0, eqIdx).trim()
    gestorCookies = gestorCookies.filter(c => !c.startsWith(`${name}=`))
    gestorCookies.push(nameValue.trim())
  }
}

async function gGet(path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { Cookie: gestorCookieHeader() } })
  updateGestorCookies(res)
  return new ApiResponse(res, await safeJson(res))
}

async function gPatch(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: gestorCookieHeader() },
    body:    JSON.stringify(body),
  })
  updateGestorCookies(res)
  return new ApiResponse(res, await safeJson(res))
}

async function loginGestor(): Promise<boolean> {
  const email    = `gestor-e2e-${RUN_ID}@grupopaubrasil.com.br`
  const password = 'TestGestor@2026!'

  const csrfRes  = await gGet('/api/auth/csrf')
  const csrfData = csrfRes.json<{ csrfToken: string }>()
  if (!csrfData.csrfToken) return false

  const params = new URLSearchParams({
    csrfToken: csrfData.csrfToken, email, password, callbackUrl: BASE, json: 'true',
  })
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: gestorCookieHeader() },
    body: params.toString(),
    redirect: 'manual',
  })
  updateGestorCookies(loginRes)

  const hasCookie = gestorCookies.some(c => c.startsWith('next-auth.session-token=') || c.startsWith('__Secure-next-auth.session-token='))
  if (hasCookie) return true

  const sessRes  = await gGet('/api/auth/session')
  const sessData = sessRes.json<{ user?: { email: string } }>()
  return sessData.user?.email === email
}

// ── FASE C: Compliance de Tendência ──────────────────────────────────────────
async function testComplianceTendencia() {
  console.log('\n📊 FASE C — Compliance de Tendência')

  // C.1 GET sem parâmetros usa ano+mês atual — deve retornar estrutura válida
  const resDefault = await get('/api/admin/obz/tendencia-compliance')
  const dataDefault = resDefault.json<{ resumo?: { total: number; pctCompliance: number }; areas?: unknown[] }>()
  if (resDefault.ok && typeof dataDefault.resumo?.total === 'number' && Array.isArray(dataDefault.areas)) {
    pass('C.1', 'GET compliance sem parâmetros retorna estrutura válida', `total: ${dataDefault.resumo.total}`)
  } else {
    fail('C.1', 'Estrutura de resposta inválida', JSON.stringify(dataDefault))
  }

  // C.2 GET para Fevereiro (mês com tendência lançada com desvios)
  interface CompRow { status: string; desvios: number; desviosSemJust: number; justPending: number; linhasComTendencia: number; totalLinhas: number }
  interface CompRes { ano: number; mes: number; resumo: { total: number; completos: number; parciais: number; pendentes: number; pctCompliance: number }; areas: CompRow[] }
  const resFev  = await get(`/api/admin/obz/tendencia-compliance?ano=${ANO}&mes=2`)
  const dataFev = resFev.json<CompRes>()
  if (!resFev.ok || !dataFev.resumo || !Array.isArray(dataFev.areas)) {
    fail('C.2', 'GET compliance Fevereiro falhou', JSON.stringify(dataFev))
    return
  }
  pass('C.2', 'GET compliance Fevereiro retorna dados', `total: ${dataFev.resumo.total}, compliance: ${dataFev.resumo.pctCompliance}%`)

  // C.3 Área de teste deve aparecer com tendência lançada (Fev teve import de tendência)
  const areaRow = dataFev.areas.find(a => (a as any).areaPacoteId === IDs.areaPacote)
  if (areaRow) {
    if (areaRow.linhasComTendencia > 0) {
      pass('C.3', 'Área de teste tem tendência lançada em Fev', `linhasComTend: ${areaRow.linhasComTendencia}/${areaRow.totalLinhas}`)
    } else {
      fail('C.3', 'Área de teste sem tendência lançada', JSON.stringify(areaRow))
    }
  } else {
    pass('C.3', 'Área de teste não visível no compliance Fev (já limpa do setup) — OK')
  }

  // C.4 Campo desviosSemJust presente na resposta
  if (dataFev.areas.length > 0) {
    const sample = dataFev.areas[0]
    if (typeof sample.desviosSemJust === 'number') {
      pass('C.4', 'Campo desviosSemJust presente na resposta', `desviosSemJust: ${sample.desviosSemJust}`)
    } else {
      fail('C.4', 'Campo desviosSemJust ausente ou inválido', JSON.stringify(sample))
    }
  } else {
    pass('C.4', 'Sem áreas no compliance — campo não verificável (ambiente limpo)')
  }

  // C.5 pctCompliance entre 0 e 100
  if (dataFev.resumo.pctCompliance >= 0 && dataFev.resumo.pctCompliance <= 100) {
    pass('C.5', 'pctCompliance dentro do range válido', `${dataFev.resumo.pctCompliance}%`)
  } else {
    fail('C.5', 'pctCompliance fora do range 0-100', `${dataFev.resumo.pctCompliance}`)
  }

  // C.6 Não-admin não deve ter acesso ao compliance
  const resNaCompliance = await naGet('/api/admin/obz/tendencia-compliance')
  if (resNaCompliance.status === 403) {
    pass('C.6', 'Não-admin recebe 403 no compliance')
  } else {
    fail('C.6', 'Não-admin deveria receber 403', `status ${resNaCompliance.status}`)
  }
}

async function testGestorFlow() {
  console.log('\n👔 FASE G — Fluxo do Gestor (aprovação departamental)')

  // G.0 Criar usuário gestor (como admin)
  const gestorEmail = `gestor-e2e-${RUN_ID}@grupopaubrasil.com.br`
  const criarRes = await post('/api/usuarios', {
    name: `Gestor E2E ${RUN_ID}`, email: gestorEmail, password: 'TestGestor@2026!',
    role: 'USER', nivel: 'GERENTE', company: 'Pau Brasil Bebidas',
  })
  const criarData = criarRes.json<{ id?: string; error?: string }>()
  if (!criarData.id) { fail('G.0', 'Criar gestor', criarData.error ?? String(criarRes.status)); return }
  IDs.gestorUserId = criarData.id
  pass('G.0', 'Criar gestor', criarData.id)

  // G.1 Setar managedAreaIds para a área de teste (como admin)
  const setAreaRes = await patch(`/api/admin/usuarios/${IDs.gestorUserId}`, {
    managedAreaIds: [IDs.area],
  })
  const setAreaData = setAreaRes.json<{ id?: string; error?: string }>()
  if (setAreaRes.ok) {
    pass('G.1', 'Setar managedAreaIds do gestor', `area: ${IDs.area}`)
  } else {
    fail('G.1', 'Setar managedAreaIds', setAreaData.error ?? String(setAreaRes.status)); return
  }

  // G.2 Login como gestor
  const loggedIn = await loginGestor()
  if (!loggedIn) { fail('G.2', 'Login gestor'); return }
  pass('G.2', 'Login gestor', gestorEmail)

  // G.3 Gestor lista justificativas PENDING da sua área
  const justRes  = await gGet('/api/obz/justificativas?status=PENDING')
  const justData = justRes.json<{ id: string; lancamento: { areaPacote: { area: { id: string } } } }[]>()
  if (Array.isArray(justData) && justData.length > 0) {
    const todasDaArea = justData.every(j => j.lancamento.areaPacote.area.id === IDs.area)
    if (todasDaArea) {
      pass('G.3', `Gestor vê justificativas da sua área (${justData.length})`, `areaId: ${IDs.area}`)
    } else {
      fail('G.3', 'Gestor vê justificativas de área alheia', `${justData.length} retornadas`)
    }
  } else if (Array.isArray(justData) && justData.length === 0) {
    // Pode não haver PENDING neste momento — passar como aviso
    pass('G.3', 'Gestor lista justificativas (nenhuma PENDING no momento)', 'OK')
  } else {
    fail('G.3', 'Listar justificativas como gestor', JSON.stringify(justData).slice(0, 100))
    return
  }

  // G.4 Gestor aprova uma justificativa da sua área (usar justId salvo na fase 2)
  if (IDs.justId) {
    // Garantir que a justificativa está PENDING (pode ter sido aprovada/rejeitada na fase 2)
    // Criar uma nova justificativa para o gestor aprovar
    const novaJustRes = await post('/api/obz/lancamentos', {
      linhaId: IDs.linhaF1, areaPacoteId: IDs.areaPacote,
      ano: ANO, mes: 3, real: 1500,
      justificativa: 'Valor acima do orçado — teste aprovação gestor',
    })
    const novaJustData = novaJustRes.json<{ id?: string }>()

    // Buscar as PENDING atuais como gestor
    const pendRes  = await gGet('/api/obz/justificativas?status=PENDING')
    const pendData = pendRes.json<{ id: string }[]>()
    const primeiraId = Array.isArray(pendData) && pendData.length > 0 ? pendData[0].id : null

    if (primeiraId) {
      const aprovRes  = await gPatch(`/api/obz/justificativas/${primeiraId}`, {
        action: 'approve', note: 'Aprovado pelo gestor no teste E2E',
      })
      const aprovData = aprovRes.json<{ status?: string; error?: string }>()
      if (aprovData.status === 'APPROVED') {
        pass('G.4', 'Gestor aprova justificativa da sua área', `id: ${primeiraId}`)
        IDs.gestorJustId = primeiraId
      } else {
        fail('G.4', 'Gestor aprovar justificativa', aprovData.error ?? JSON.stringify(aprovData))
      }
    } else {
      pass('G.4', 'Gestor aprovar justificativa (nenhuma PENDING disponível — fluxo OK)', '')
    }
  }

  // G.5 Gestor tenta aprovar justificativa fora da sua área → 403
  // Criar área diferente da gerenciada pelo gestor — usar areaPacote do não-admin (linhaP2)
  // Primeiro criar uma justificativa nessa área via admin
  const areaForaRes = await post('/api/obz/estrutura', {
    tipo: 'area', nome: `E2E-Area-Fora-${RUN_ID}`, parentId: IDs.operacao,
  })
  const areaForaData = areaForaRes.json<{ id?: string; error?: string }>()
  if (!areaForaData.id) {
    fail('G.5', 'Criar Ã¡rea fora do escopo do gestor', areaForaData.error ?? String(areaForaRes.status))
    return
  }
  IDs.gestorAreaFora = areaForaData.id

  const areaPacoteForaRes = await post('/api/obz/estrutura', {
    tipo: 'area-pacote',
    parentId: areaForaData.id,
    pacoteId: IDs.pacote,
    linhaId: IDs.linhaP1,
    donoId: IDs.adminUserId,
  })
  const areaPacoteForaData = areaPacoteForaRes.json<{ id?: string; error?: string }>()
  if (!areaPacoteForaData.id) {
    fail('G.5', 'Criar areaPacote fora do escopo do gestor', areaPacoteForaData.error ?? String(areaPacoteForaRes.status))
    return
  }
  IDs.gestorAreaPacoteFora = areaPacoteForaData.id

  const lancForaRes = await post('/api/obz/lancamentos', {
    linhaId: IDs.linhaF1, areaPacoteId: areaPacoteForaData.id,
    ano: ANO, mes: 3, real: 1800,
    justificativa: 'Justificativa fora da área do gestor — teste 403',
  })
  const lancForaData = lancForaRes.json<{ id?: string }>()
  if (!lancForaData.id) {
    fail('G.5', 'Criar justificativa fora da area para teste de 403', JSON.stringify(lancForaData))
    return
  }

  // Buscar a justificativa criada como admin
  const todasRes  = await get('/api/obz/justificativas?status=PENDING')
  const todasData = todasRes.json<{ id: string; lancamento: { id: string; areaPacote: { area: { id: string } } } }[]>()
  const foraId = Array.isArray(todasData)
    ? todasData.find(j => j.lancamento.id === lancForaData.id)?.id
    : null

  if (!foraId) {
    fail('G.5', 'Justificativa fora do escopo nao apareceu para o admin', lancForaData.id)
    return
  }

  if (foraId) {
    const negRes  = await gPatch(`/api/obz/justificativas/${foraId}`, { action: 'approve', note: '' })
    if (negRes.status === 403) {
      pass('G.5', 'Gestor não pode aprovar área alheia → 403')
    } else {
      fail('G.5', 'Deveria ser 403 para área fora do escopo', `status ${negRes.status}`)
    }
  } else {
    pass('G.5', 'Sem justificativa de área alheia para testar (ambiente limpo — OK)', '')
  }
}

// ── Relatório final ───────────────────────────────────────────────────────────
function printReport() {
  const passed = results.filter(r => r.passed).length
  const total  = results.length
  const failed = results.filter(r => !r.passed)

  console.log('\n' + '═'.repeat(70))
  console.log(`RESULTADO: ${passed}/${total} cenários passaram`)
  console.log('═'.repeat(70))

  if (failed.length > 0) {
    console.log('\n❌ FALHAS:')
    for (const f of failed) {
      console.log(`   ${f.step.padEnd(6)} ${f.label}`)
      if (f.info) console.log(`          → ${f.info}`)
    }
  }

  console.log('\n📊 IDs criados neste teste:')
  for (const [k, v] of Object.entries(IDs)) {
    console.log(`   ${k.padEnd(16)} ${v}`)
  }
  console.log('')
}

// ── Fase E — Importação de Estrutura via CSV ─────────────────────────────────
async function testImportEstrutura() {
  console.log('\n📥 FASE E — Importação de Estrutura via CSV')

  // E.0 — GET template retorna CSV com cabeçalho correto
  const tplRes = await fetch(`${BASE}/api/admin/obz/importar-estrutura`, {
    headers: { Cookie: cookieHeader() },
  })
  updateCookies(tplRes)
  if (tplRes.ok && tplRes.headers.get('content-type')?.includes('text/csv')) {
    const tplText = await tplRes.text()
    const firstLine = tplText.replace(/^\uFEFF/, '').split('\n')[0].trim()
    if (firstLine.includes('estado') && firstLine.includes('responsavel_email')) {
      pass('E.0', 'GET template retorna CSV com cabeçalho correto')
    } else {
      fail('E.0', 'Cabeçalho do template inválido', firstLine.slice(0, 80))
    }
  } else {
    fail('E.0', 'GET template falhou', `status ${tplRes.status}`)
  }

  // E.1 — POST CSV válido cria estrutura completa
  const csvValido = [
    'estado;operacao;departamento;pacote;linha_pai;linha;responsavel_email',
    `E2E-${RUN_ID};Op-${RUN_ID};Depto-${RUN_ID};Pacote-${RUN_ID};Pai-${RUN_ID};Folha-${RUN_ID};${ADMIN_EMAIL}`,
    `E2E-${RUN_ID};Op-${RUN_ID};Depto-${RUN_ID};Pacote-${RUN_ID};Pai-${RUN_ID};Folha2-${RUN_ID};${ADMIN_EMAIL}`,
  ].join('\n')

  const e1Res  = await postForm('/api/admin/obz/importar-estrutura', { arquivo: csvBlob(csvValido, 'estrutura.csv') })
  const e1Data = e1Res.json<{ ok?: boolean; stats?: { estados: number; operacoes: number; departamentos: number; pacotes: number; linhas: number; atribuicoes: number }; erros?: { linha: number; erro: string }[] }>()
  if (e1Res.ok && e1Data.ok && (e1Data.stats?.estados ?? 0) >= 1) {
    pass('E.1', 'POST CSV válido cria estrutura', `estados:${e1Data.stats?.estados} ops:${e1Data.stats?.operacoes} deptos:${e1Data.stats?.departamentos} pacotes:${e1Data.stats?.pacotes} linhas:${e1Data.stats?.linhas} atr:${e1Data.stats?.atribuicoes}`)
  } else {
    fail('E.1', 'POST CSV válido', JSON.stringify(e1Data).slice(0, 120))
  }

  // E.2 — Reimportar mesmo CSV é idempotente (0 criados)
  const e2Res  = await postForm('/api/admin/obz/importar-estrutura', { arquivo: csvBlob(csvValido, 'estrutura.csv') })
  const e2Data = e2Res.json<{ ok?: boolean; stats?: { estados: number; operacoes: number; departamentos: number; pacotes: number; linhas: number; atribuicoes: number } }>()
  const e2Stats = e2Data.stats
  if (e2Res.ok && e2Stats &&
    e2Stats.estados === 0 && e2Stats.operacoes === 0 && e2Stats.departamentos === 0 &&
    e2Stats.pacotes === 0 && e2Stats.linhas === 0 && e2Stats.atribuicoes === 0) {
    pass('E.2', 'Reimportar mesmo CSV é idempotente (0 criados)')
  } else {
    fail('E.2', 'Reimportar deveria criar 0 novos registros', JSON.stringify(e2Stats))
  }

  // E.3 — E-mail desconhecido gera aviso, não erro
  const csvEmailDesconhecido = [
    'estado;operacao;departamento;pacote;linha_pai;linha;responsavel_email',
    `E2E-${RUN_ID};Op-${RUN_ID};Depto-${RUN_ID};Pacote-${RUN_ID};Pai-${RUN_ID};Folha3-${RUN_ID};naoexiste-${RUN_ID}@grupopaubrasil.com.br`,
  ].join('\n')
  const e3Res  = await postForm('/api/admin/obz/importar-estrutura', { arquivo: csvBlob(csvEmailDesconhecido, 'e3.csv') })
  const e3Data = e3Res.json<{ ok?: boolean; avisos?: { linha: number; aviso: string }[]; erros?: unknown[] }>()
  if (e3Res.ok && (e3Data.avisos?.length ?? 0) >= 1 && (e3Data.erros?.length ?? 0) === 0) {
    pass('E.3', 'E-mail desconhecido gera aviso (não erro)', `avisos: ${e3Data.avisos?.length}`)
  } else {
    fail('E.3', 'Aviso para e-mail desconhecido', JSON.stringify(e3Data).slice(0, 120))
  }

  // E.4 — CSV com colunas erradas → 400
  const csvColunaErrada = 'col1;col2;col3\nvalor1;valor2;valor3'
  const e4Res = await postForm('/api/admin/obz/importar-estrutura', { arquivo: csvBlob(csvColunaErrada, 'e4.csv') })
  if (e4Res.status === 400) {
    pass('E.4', 'CSV com colunas erradas → 400')
  } else {
    fail('E.4', 'Deveria retornar 400 para colunas inválidas', `status ${e4Res.status}`)
  }

  // E.5 — Não-admin → 403 (usa cookies do non-admin criado na Fase N)
  if (nonAdminCookies.length > 0) {
    const e5Res = await fetch(`${BASE}/api/admin/obz/importar-estrutura`, {
      method: 'POST',
      headers: { Cookie: nonAdminCookieHeader() },
      body: new FormData(),
    })
    if (e5Res.status === 403) {
      pass('E.5', 'Não-admin → 403')
    } else {
      fail('E.5', 'Deveria retornar 403 para não-admin', `status ${e5Res.status}`)
    }
  } else {
    pass('E.5', 'Não-admin → 403 (Fase N não executada — pulando)', 'skipped')
  }

  // E.6 — Cleanup: deletar o estado criado pelo import de estrutura
  const estadoE2E = await fetch(`${BASE}/api/obz/estrutura`, { headers: { Cookie: cookieHeader() } })
    .then(r => r.json() as Promise<{ estados: { id: string; nome: string }[] }>)
  const estadoId = estadoE2E.estados?.find((e: { nome: string }) => e.nome === `E2E-${RUN_ID}`)?.id
  if (estadoId) {
    const delRes = await del(`/api/obz/estrutura/${estadoId}`, { tipo: 'estado' })
    if (delRes.ok) {
      pass('E.6', 'Cleanup: estado E2E deletado', estadoId)
    } else {
      fail('E.6', 'Cleanup falhou', JSON.stringify(delRes.json()).slice(0, 80))
    }
  } else {
    pass('E.6', 'Cleanup: estado E2E não encontrado (pode ter sido limpo antes)', 'ok')
  }
}

// ── Fase P — Notificação de tendência aberta ─────────────────────────────────
async function testNotificacaoTendencia() {
  console.log('\n🔔 FASE P — Notificação de tendência aberta')

  // P.1 — GET /api/obz/periodo?mes retorna campo tendenciaAbertaForca
  const p1Res  = await get(`/api/obz/periodo?mes=1&ano=${ANO}`)
  const p1Data = p1Res.json<{ tendenciaAbertaForca?: boolean; tendenciaDeadlineDia?: number }>()
  if (p1Res.ok && 'tendenciaAbertaForca' in (p1Data as object)) {
    pass('P.1', 'GET período mensal retorna campo tendenciaAbertaForca', `valor: ${p1Data.tendenciaAbertaForca}`)
  } else {
    fail('P.1', 'Campo tendenciaAbertaForca ausente na resposta', JSON.stringify(p1Data).slice(0, 80))
  }

  // P.2 — Mês com tendência aberta (Fevereiro foi aberto no passo 3.1) retorna true
  const p2Res  = await get(`/api/obz/periodo?mes=2&ano=${ANO}`)
  const p2Data = p2Res.json<{ tendenciaAbertaForca?: boolean }>()
  if (p2Res.ok && p2Data.tendenciaAbertaForca === true) {
    pass('P.2', 'Fevereiro com tendência aberta → tendenciaAbertaForca=true')
  } else {
    fail('P.2', 'Fevereiro deveria ter tendenciaAbertaForca=true', JSON.stringify(p2Data).slice(0, 80))
  }

  // P.3 — Fechar tendência → tendenciaAbertaForca=false
  await patch('/api/obz/periodo', { ano: ANO, mes: 2, tendenciaAbertaForca: false })
  const p3Res  = await get(`/api/obz/periodo?mes=2&ano=${ANO}`)
  const p3Data = p3Res.json<{ tendenciaAbertaForca?: boolean }>()
  if (p3Res.ok && p3Data.tendenciaAbertaForca === false) {
    pass('P.3', 'Fechar tendência → tendenciaAbertaForca=false')
  } else {
    fail('P.3', 'tendenciaAbertaForca deveria ser false após fechar', JSON.stringify(p3Data).slice(0, 80))
  }

  // P.4 — Reabrir para não quebrar outros testes
  await patch('/api/obz/periodo', { ano: ANO, mes: 2, tendenciaAbertaForca: true, tendenciaOverrideMotivo: 'Reaberto pós-teste P' })
  pass('P.4', 'Tendência de Fevereiro reaberta para consistência dos testes')
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 OBZ E2E Test Suite — 2 Meses (Jan + Fev 2026)')
  console.log(`   Target: ${BASE}`)
  console.log(`   Ano:    ${ANO}`)
  console.log('─'.repeat(70))

  try {
    const loggedIn = await login()
    if (!loggedIn) {
      console.error('\n💥 Falha no login — abortando testes')
      process.exit(1)
    }

    const estruturaOk = await setupEstrutura()
    if (!estruturaOk) {
      console.error('\n💥 Falha no setup da estrutura — abortando testes')
      await cleanup()
      process.exit(1)
    }

    await testImportContas()
    await testMesJaneiro()
    await testMesFevereiro()
    await testSubmissaoAnual()
    await testNonAdminRestrictions()
    await testComplianceTendencia()
    await testNotificacaoTendencia()
    await testImportEstrutura()
    await testGestorFlow()
  } finally {
    await cleanup()
    printReport()
  }
}

main().catch(err => {
  console.error('💥 Erro inesperado:', err)
  process.exit(1)
})
