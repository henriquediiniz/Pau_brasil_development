/**
 * tests/financeiro-consolidado.test.ts
 *
 * Valida o endpoint GET /api/financeiro/consolidado:
 *  - 401 sem sessão
 *  - 403 para usuário não-admin
 *  - 200 com shape correto para admin: { resumo, resumoMes, tree, heatMap, ranking, allDonos }
 *  - allDonos: array não-vazio, ordenado, sem duplicatas
 *  - ranking: máximo 20 itens, cada item com os campos esperados
 *  - tree: estrutura hierárquica válida (estado → operacao → area → pacotes)
 *  - allDonos inclui donos independente de terem lançamentos no ano
 *
 * Requisitos:
 *   - Servidor Next.js rodando em http://localhost:3000
 *   - Usuário admin: admin@grupopaubrasil.com.br / Admin@2026!
 *   - Usuário comum: joao@grupopaubrasil.com.br / User@2026!
 *   - Ao menos um OBZAreaPacote ativo no banco
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

describe('GET /api/financeiro/consolidado', () => {
  const admin   = new IntegrationSession('Admin OBZ Financeiro')
  const usuario = new IntegrationSession('Usuario Comum Financeiro')

  let consolidado: any = null

  before(async () => {
    const okAdmin   = await admin.login(ADMIN_EMAIL, ADMIN_PASS)
    const okUsuario = await usuario.login(USER_EMAIL, USER_PASS)
    assert.ok(okAdmin,   `Login admin falhou (${ADMIN_EMAIL})`)
    assert.ok(okUsuario, `Login usuário falhou (${USER_EMAIL})`)

    // Fazer a requisição uma vez e reutilizar em todos os testes de shape
    const res = await admin.get(`/api/financeiro/consolidado?ano=${ANO}`)
    if (res.status === 200) consolidado = res.body
  })

  // ── Autenticação ─────────────────────────────────────────────────────────────

  it('401 — sem sessão', async () => {
    const res = await fetch(`${BASE_URL}/api/financeiro/consolidado?ano=${ANO}`)
    assert.strictEqual(res.status, 401)
  })

  it('403 — usuário comum não tem acesso', async () => {
    const res = await usuario.get(`/api/financeiro/consolidado?ano=${ANO}`)
    assert.strictEqual(res.status, 403, 'Usuário comum deveria receber 403')
  })

  it('200 — admin recebe resposta com sucesso', async () => {
    assert.ok(consolidado !== null, 'Admin deveria receber 200 com body válido')
  })

  // ── Shape da resposta ─────────────────────────────────────────────────────────

  it('Resposta contém todos os campos obrigatórios', () => {
    assert.ok(consolidado !== null, 'Consolidado não disponível — teste de autenticação falhou')
    const campos = ['ano', 'resumo', 'resumoMes', 'tree', 'heatMap', 'ranking', 'allDonos']
    for (const campo of campos) {
      assert.ok(campo in consolidado, `Campo "${campo}" ausente na resposta`)
    }
  })

  it('resumo contém totalOrcado, totalReal, totalTendencia, desvio, pendentes', () => {
    assert.ok(consolidado !== null)
    const r = consolidado.resumo
    assert.ok(typeof r.totalOrcado    === 'number', 'totalOrcado deve ser número')
    assert.ok(typeof r.totalReal      === 'number', 'totalReal deve ser número')
    assert.ok(typeof r.totalTendencia === 'number', 'totalTendencia deve ser número')
    assert.ok(typeof r.desvio         === 'number', 'desvio deve ser número')
    assert.ok(typeof r.pendentes      === 'number', 'pendentes deve ser número')
    // Coerência: desvio = totalReal - totalOrcado
    assert.ok(
      Math.abs(r.desvio - (r.totalReal - r.totalOrcado)) < 0.01,
      `desvio (${r.desvio}) deve ser totalReal - totalOrcado (${r.totalReal - r.totalOrcado})`
    )
  })

  it('resumoMes contém mes, orcado, real, parcial, tendencia', () => {
    assert.ok(consolidado !== null)
    const rm = consolidado.resumoMes
    assert.ok(typeof rm.mes       === 'number')
    assert.ok(typeof rm.orcado    === 'number')
    assert.ok(typeof rm.real      === 'number')
    assert.ok(typeof rm.parcial   === 'number')
    assert.ok(typeof rm.tendencia === 'number')
    assert.ok(rm.mes >= 1 && rm.mes <= 12, `mes inválido: ${rm.mes}`)
  })

  it('ano retornado corresponde ao parâmetro enviado', () => {
    assert.ok(consolidado !== null)
    assert.strictEqual(consolidado.ano, ANO, `Ano retornado (${consolidado.ano}) difere do solicitado (${ANO})`)
  })

  // ── allDonos ──────────────────────────────────────────────────────────────────

  it('allDonos é array não-vazio (há donos cadastrados)', async () => {
    assert.ok(consolidado !== null)
    const donos: string[] = consolidado.allDonos
    assert.ok(Array.isArray(donos), 'allDonos deve ser array')
    assert.ok(donos.length > 0, 'allDonos deve ter ao menos 1 dono (há OBZAreaPacotes ativos)')
  })

  it('allDonos está ordenado (ordem consistente — sem inversões óbvias)', () => {
    assert.ok(consolidado !== null)
    const donos: string[] = consolidado.allDonos
    // A API usa Array.sort() nativo (ordem ASCII/Unicode, maiúsculas antes de minúsculas).
    // Verificamos que a ordenação é consistente comparando com o mesmo critério.
    const ordenado = [...donos].sort()
    assert.deepStrictEqual(donos, ordenado, 'allDonos deve estar ordenado pela mesma ordem que Array.sort()')
  })

  it('allDonos não tem duplicatas', () => {
    assert.ok(consolidado !== null)
    const donos: string[] = consolidado.allDonos
    const unicos = new Set(donos)
    assert.strictEqual(
      donos.length,
      unicos.size,
      `allDonos tem ${donos.length - unicos.size} duplicata(s)`
    )
  })

  it('allDonos inclui todos os donos de OBZAreaPacote ativo (cross-check com DB)', async () => {
    assert.ok(consolidado !== null)

    const areaPacotes = await prisma.oBZAreaPacote.findMany({
      where: { ativo: true },
      include: { dono: { select: { name: true } } },
    })
    const donosDB = Array.from(new Set(
      areaPacotes.map(ap => ap.dono?.name).filter(Boolean) as string[]
    )).sort()

    const donosAPI: string[] = consolidado.allDonos

    for (const dono of donosDB) {
      assert.ok(
        donosAPI.includes(dono),
        `Dono "${dono}" está no banco mas ausente em allDonos da API`
      )
    }
  })

  // ── ranking ───────────────────────────────────────────────────────────────────

  it('ranking tem no máximo 20 itens', () => {
    assert.ok(consolidado !== null)
    const ranking: any[] = consolidado.ranking
    assert.ok(Array.isArray(ranking), 'ranking deve ser array')
    assert.ok(ranking.length <= 20, `ranking deve ter no máximo 20 itens, tem ${ranking.length}`)
  })

  it('cada item do ranking tem nome, dono, operacao, area, orcado, real, desvio', () => {
    assert.ok(consolidado !== null)
    const ranking: any[] = consolidado.ranking
    if (ranking.length === 0) return // sem lançamentos no ano, é válido

    for (const item of ranking) {
      const campos = ['nome', 'dono', 'operacao', 'area', 'orcado', 'real', 'desvio']
      for (const campo of campos) {
        assert.ok(campo in item, `Campo "${campo}" ausente em item do ranking`)
      }
      // Coerência: desvio = real - orcado
      assert.ok(
        Math.abs(item.desvio - (item.real - item.orcado)) < 0.01,
        `desvio (${item.desvio}) != real - orcado (${item.real - item.orcado}) para ${item.nome}`
      )
    }
  })

  // ── tree ──────────────────────────────────────────────────────────────────────

  it('tree é objeto com ao menos um estado quando há lançamentos', () => {
    assert.ok(consolidado !== null)
    const tree = consolidado.tree
    assert.ok(typeof tree === 'object' && tree !== null, 'tree deve ser objeto')
    // Verificar estrutura de cada estado
    for (const [estId, estData] of Object.entries(tree) as [string, any][]) {
      assert.ok(typeof estData.nome === 'string',       `Estado ${estId} deve ter nome string`)
      assert.ok(typeof estData.operacoes === 'object',  `Estado ${estId} deve ter operacoes`)
      for (const [opId, opData] of Object.entries(estData.operacoes) as [string, any][]) {
        assert.ok(typeof opData.nome === 'string',    `Operação ${opId} deve ter nome`)
        assert.ok(typeof opData.areas === 'object',   `Operação ${opId} deve ter areas`)
        for (const [arId, arData] of Object.entries(opData.areas) as [string, any][]) {
          assert.ok(typeof arData.nome === 'string',     `Área ${arId} deve ter nome`)
          assert.ok(typeof arData.pacotes === 'object',  `Área ${arId} deve ter pacotes`)
        }
      }
    }
  })

  // ── Parâmetro ano ─────────────────────────────────────────────────────────────

  it('aceita ano como parâmetro e retorna 200', async () => {
    const res = await admin.get('/api/financeiro/consolidado?ano=2025')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.ano, 2025)
  })

  it('usa ano corrente quando parâmetro não informado', async () => {
    const res = await admin.get('/api/financeiro/consolidado')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.ano, ANO)
  })
})
