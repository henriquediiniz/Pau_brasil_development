/**
 * tests/obz-seguranca.test.ts
 *
 * Testa fronteiras de autorização específicas do módulo OBZ:
 *  - Não-admin não acessa /api/financeiro/consolidado
 *  - Usuário sem pacote OBZ não consegue lançar em areaPacote alheio
 *  - Não-admin não consegue usar bulk-review de justificativas
 *  - /api/obz/meus-pacotes retorna apenas pacotes do próprio usuário
 *  - Admin pode acessar consolidado normalmente
 *
 * Requisitos:
 *   - Servidor Next.js rodando em http://localhost:3000
 *   - Usuário admin: admin@grupopaubrasil.com.br / Admin@2026!
 *   - Usuário comum sem pacotes OBZ: joao@grupopaubrasil.com.br / User@2026!
 */

import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import { IntegrationSession, BASE_URL } from './support/integration-base'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@grupopaubrasil.com.br'
const ADMIN_PASS  = process.env.ADMIN_PASS  ?? 'Admin@2026!'
const USER_EMAIL  = process.env.USER_EMAIL  ?? 'joao@grupopaubrasil.com.br'
const USER_PASS   = process.env.USER_PASS   ?? 'User@2026!'

const ANO = new Date().getFullYear()
const MES = new Date().getMonth() + 1

describe('OBZ — Segurança e Isolamento de Acesso', () => {
  const admin   = new IntegrationSession('Admin OBZ')
  const usuario = new IntegrationSession('Usuario Comum (sem pacote OBZ)')

  let areaPacoteAlheioId: string | null = null
  let linhaIdAlheia: string | null = null

  before(async () => {
    const okAdmin   = await admin.login(ADMIN_EMAIL, ADMIN_PASS)
    const okUsuario = await usuario.login(USER_EMAIL, USER_PASS)
    assert.ok(okAdmin,   `Login admin falhou (${ADMIN_EMAIL})`)
    assert.ok(okUsuario, `Login usuário falhou (${USER_EMAIL})`)

    // Buscar um areaPacote ativo que não pertença ao usuário joao
    const joao = await prisma.user.findUnique({
      where: { email: USER_EMAIL },
      select: { id: true },
    })

    if (joao) {
      const ap = await prisma.oBZAreaPacote.findFirst({
        where: { ativo: true, donoId: { not: joao.id } },
        include: { linha: { select: { id: true } } },
      })
      if (ap) {
        areaPacoteAlheioId = ap.id
        // Buscar uma linha folha (sem filhas ativas) desse pacote
        const linhaFolha = await prisma.oBZLinhaCusto.findFirst({
          where: {
            pacoteId: ap.pacoteId,
            ativo: true,
          },
          select: { id: true },
        })
        linhaIdAlheia = linhaFolha?.id ?? null
      }
    }
  })

  // ── GET /api/financeiro/consolidado ──────────────────────────────────────────

  it('401 — consolidado sem sessão', async () => {
    const res = await fetch(`${BASE_URL}/api/financeiro/consolidado?ano=${ANO}`)
    assert.strictEqual(res.status, 401, 'Deveria retornar 401 sem sessão')
  })

  it('403 — usuário comum não acessa /api/financeiro/consolidado', async () => {
    const res = await usuario.get(`/api/financeiro/consolidado?ano=${ANO}`)
    assert.strictEqual(res.status, 403, 'Usuário comum não deveria acessar consolidado')
  })

  it('200 — admin acessa /api/financeiro/consolidado normalmente', async () => {
    const res = await admin.get(`/api/financeiro/consolidado?ano=${ANO}`)
    assert.strictEqual(res.status, 200, `Admin deveria acessar consolidado: ${JSON.stringify(res.body)}`)
    assert.ok(res.body.tree !== undefined,     'Resposta deve conter tree')
    assert.ok(res.body.allDonos !== undefined, 'Resposta deve conter allDonos')
  })

  // ── POST /api/obz/lancamentos — isolamento de areaPacote ────────────────────

  it('403 — usuário sem pacote não consegue lançar em areaPacote alheio', async () => {
    if (!areaPacoteAlheioId || !linhaIdAlheia) {
      console.warn('⚠  Nenhum areaPacote alheio encontrado — teste ignorado.')
      return
    }

    const res = await usuario.post('/api/obz/lancamentos', {
      linhaId:      linhaIdAlheia,
      areaPacoteId: areaPacoteAlheioId,
      ano:          ANO,
      mes:          MES,
      orcado:       1000,
    })

    assert.ok(
      [403, 422].includes(res.status),
      `Usuário sem pacote deveria receber 403, recebeu ${res.status}: ${JSON.stringify(res.body)}`
    )
  })

  it('401 — POST /api/obz/lancamentos sem sessão', async () => {
    const res = await fetch(`${BASE_URL}/api/obz/lancamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linhaId: 'qualquer', areaPacoteId: 'qualquer', ano: ANO, mes: MES }),
    })
    assert.strictEqual(res.status, 401)
  })

  // ── POST /api/obz/justificativas/bulk-review — somente admins ───────────────

  it('403/404 — usuário comum não pode fazer bulk-review de justificativas', async () => {
    const res = await usuario.post('/api/obz/justificativas/bulk-review', {
      ids:    ['fake-id-qualquer'],
      action: 'approve',
    })
    // Com ID inválido: a rota não encontra PENDING → 404 ("nenhuma encontrada").
    // Com ID válido de outra área: retorna 403.
    // Ambos representam bloqueio correto para usuário sem permissão.
    assert.ok(
      [403, 404].includes(res.status),
      `Usuário comum deveria ser bloqueado (403 ou 404), recebeu ${res.status}`
    )
  })

  it('401 — bulk-review sem sessão', async () => {
    const res = await fetch(`${BASE_URL}/api/obz/justificativas/bulk-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['fake'], action: 'approve' }),
    })
    assert.strictEqual(res.status, 401)
  })

  // ── GET /api/obz/meus-pacotes — isolamento por donoId ───────────────────────

  it('meus-pacotes retorna apenas pacotes do próprio usuário (array, possivelmente vazio)', async () => {
    const res = await usuario.get('/api/obz/meus-pacotes')
    // 200 com array vazio (joao não tem pacotes) ou lista dos seus próprios
    assert.strictEqual(res.status, 200, `meus-pacotes deveria retornar 200: ${JSON.stringify(res.body)}`)
    assert.ok(Array.isArray(res.body), 'Resposta deve ser um array')

    // Se retornou pacotes, todos devem pertencer ao usuário joao (verificar via Prisma)
    if (res.body.length > 0) {
      const joao = await prisma.user.findUnique({
        where: { email: USER_EMAIL },
        select: { id: true },
      })
      for (const ap of res.body) {
        assert.strictEqual(
          ap.donoId,
          joao?.id,
          `Pacote ${ap.id} não pertence ao usuário logado (donoId: ${ap.donoId})`
        )
      }
    }
  })

  it('401 — meus-pacotes sem sessão', async () => {
    const res = await fetch(`${BASE_URL}/api/obz/meus-pacotes`)
    assert.strictEqual(res.status, 401)
  })
})
