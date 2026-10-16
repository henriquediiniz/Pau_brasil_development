/**
 * tests/obz-template-tendencia.test.ts
 *
 * Verifica que o template de tendência gerado pela rota GET /api/obz/importar
 * inclui apenas os meses abertos corretos, tanto para admin quanto para não-admin.
 *
 * Bug original: non-admins recebiam meses 1-3 (Jan-Mar) porque o código usava
 * `deadlineDia = 5` hardcoded. Com dia atual = 8, `8 > 5` → `ultimoMes = mesAtual - 1`.
 * Resultado: Abril ficava fora e os meses fechados (Jan-Mar) ficavam dentro.
 *
 * Requisitos para rodar:
 *   - Servidor Next.js rodando em http://localhost:3000
 *   - Usuário admin:   admin@grupopaubrasil.com.br / Admin@2026!
 *   - Usuário dono de pacote ativo (env vars abaixo)
 *     DONOPACOTE_EMAIL e DONOPACOTE_PASS devem ser definidos para os testes
 *     de não-admin rodarem. Sem eles, os testes aparecem como SKIPPED (não como PASS).
 */

import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import { IntegrationSession } from './support/integration-base'

const ANO  = new Date().getFullYear()
const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const ADMIN_EMAIL      = process.env.ADMIN_EMAIL      ?? 'admin@grupopaubrasil.com.br'
const ADMIN_PASS       = process.env.ADMIN_PASS       ?? 'Admin@2026!'
const DONOPACOTE_EMAIL = process.env.DONOPACOTE_EMAIL ?? 'frota.patos@grupopaubrasil.com.br'
const DONOPACOTE_PASS  = process.env.DONOPACOTE_PASS  ?? ''

/** Lê o CSV de resposta e retorna os meses presentes no cabeçalho (colunas ≥ 6) */
function parseMesesFromCsvHeader(csvText: string): string[] {
  const firstLine = csvText.replace(/^\uFEFF/, '').split('\r\n')[0] ?? csvText.split('\n')[0]
  const cols = firstLine.split(';')
  // Colunas 0-5: areaPacoteId, linhaId, Pacote, Area, Operacao, Linha de Custo
  return cols.slice(6).filter(c => MESES_ABREV.includes(c))
}

// ── Suite: Admin ──────────────────────────────────────────────────────────────
describe('Template OBZ tendência — Admin', () => {
  const admin = new IntegrationSession('Admin')

  before(async () => {
    const ok = await admin.login(ADMIN_EMAIL, ADMIN_PASS)
    assert.ok(ok, `Login admin falhou (${ADMIN_EMAIL})`)
  })

  it('admin recebe todos os 12 meses no template de tendência (sem scope=meus)', async () => {
    const res = await admin.get(`/api/obz/importar?ano=${ANO}&tipo=tendencia`)
    assert.strictEqual(res.status, 200, `Esperava 200, recebeu ${res.status}`)
    const csv: string = res.body._raw ?? ''
    assert.ok(csv.length > 0, 'CSV vazio')
    const meses = parseMesesFromCsvHeader(csv)
    assert.strictEqual(meses.length, 12, `Admin deve ver 12 meses, viu: ${meses.join(', ')}`)
  })

  it('admin com scope=meus recebe 12 meses quando tem pacotes, ou 404 se não tem', async () => {
    const res = await admin.get(`/api/obz/importar?ano=${ANO}&tipo=tendencia&scope=meus`)
    // 404 é válido quando o admin não tem pacotes atribuídos a si mesmo
    if (res.status === 404) return
    assert.strictEqual(res.status, 200, `Esperava 200 ou 404, recebeu ${res.status}`)
    const csv: string = res.body._raw ?? ''
    const meses = parseMesesFromCsvHeader(csv)
    assert.strictEqual(meses.length, 12, `Admin+scope=meus deve ver 12 meses, viu: ${meses.join(', ')}`)
  })
})

// ── Suite: Dono de pacote (não-admin) ─────────────────────────────────────────
describe('Template OBZ tendência — Dono de pacote (não-admin)', () => {
  const dono = new IntegrationSession('DonoPacote')

  const SKIP_MSG = 'DONOPACOTE_PASS não definida — configure a env var para rodar os testes de não-admin'

  before(async () => {
    if (!DONOPACOTE_PASS) return // login adiado — cada teste fará skip individualmente
    const ok = await dono.login(DONOPACOTE_EMAIL, DONOPACOTE_PASS)
    assert.ok(ok, `Login dono-pacote falhou (${DONOPACOTE_EMAIL})`)
  })

  it('não-admin recebe apenas meses com período aberto (NÃO meses fechados)', { skip: !DONOPACOTE_PASS ? SKIP_MSG : false }, async (t) => {
    const res = await dono.get(`/api/obz/importar?ano=${ANO}&tipo=tendencia&scope=meus`)

    if (res.status === 404) {
      assert.fail('Usuário dono-pacote não tem pacotes atribuídos — verifique o seed/setup')
    }

    assert.strictEqual(res.status, 200, `Esperava 200, recebeu ${res.status}: ${JSON.stringify(res.body)}`)

    const csv: string = res.body._raw ?? ''
    assert.ok(csv.length > 0, 'CSV vazio para não-admin')

    const meses = parseMesesFromCsvHeader(csv)
    assert.ok(meses.length > 0, 'Template não contém nenhum mês — período pode estar todo fechado')

    // Verificar que meses FECHADOS não aparecem (a data de teste é Abril/2026)
    // Meses cujo período já foi fechado não devem aparecer para não-admin
    const mesAtual = new Date().getMonth() + 1 // 1-indexed
    const mesesPassados = MESES_ABREV.slice(0, mesAtual - 2) // meses antes do anterior ao atual

    for (const m of mesesPassados) {
      assert.ok(
        !meses.includes(m),
        `Mês passado fechado ${m} não deveria aparecer no template (não-admin). Meses: ${meses.join(', ')}`
      )
    }
  })

  it('não-admin NÃO recebe meses futuros no template de tendência', { skip: !DONOPACOTE_PASS ? SKIP_MSG : false }, async () => {
    const res = await dono.get(`/api/obz/importar?ano=${ANO}&tipo=tendencia&scope=meus`)
    if (res.status !== 200) return

    const csv: string = res.body._raw ?? ''
    const meses = parseMesesFromCsvHeader(csv)

    const mesAtual = new Date().getMonth() + 1
    const mesesFuturos = MESES_ABREV.slice(mesAtual) // meses após o atual
    for (const m of mesesFuturos) {
      assert.ok(
        !meses.includes(m),
        `Mês futuro ${m} não deveria estar no template de tendência (não-admin). Meses: ${meses.join(', ')}`
      )
    }
  })

  it('não-admin recebe template de real apenas com meses abertos (smoke test)', { skip: !DONOPACOTE_PASS ? SKIP_MSG : false }, async () => {
    const res = await dono.get(`/api/obz/importar?ano=${ANO}&tipo=real&scope=meus`)
    if (res.status === 404) return // sem pacotes

    assert.strictEqual(res.status, 200)
    const csv: string = res.body._raw ?? ''
    const meses = parseMesesFromCsvHeader(csv)

    const mesAtual = new Date().getMonth() + 1
    const mesesPassados = MESES_ABREV.slice(0, mesAtual - 2)
    for (const m of mesesPassados) {
      assert.ok(!meses.includes(m), `${m} não deveria estar no template real (não-admin). Meses: ${meses.join(', ')}`)
    }
  })

  it('não-admin recebe 401 sem sessão no endpoint de importar', async () => {
    // Este teste não depende de DONOPACOTE_PASS — verifica autenticação
    const { BASE_URL } = await import('./support/integration-base')
    const res = await fetch(`${BASE_URL}/api/obz/importar?ano=${ANO}&tipo=tendencia`)
    assert.strictEqual(res.status, 401, 'Endpoint de importar deve exigir autenticação')
  })
})
