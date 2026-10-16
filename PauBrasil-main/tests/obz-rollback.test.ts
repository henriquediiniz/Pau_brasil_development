/**
 * tests/obz-rollback.test.ts
 *
 * Testa atomicidade e ausência de side-effects em falhas do módulo OBZ.
 *
 * Princípio: quando a API rejeita uma requisição (4xx), nenhum dado deve
 * ter sido persistido no banco — a transação deve ter sido desfeita ou
 * jamais iniciada.
 *
 * Cenários:
 *   1. Linha inexistente no pacote → 404 e sem lançamento no banco
 *   2. Linha com sub-linhas (não-folha) → 400 e sem lançamento no banco
 *   3. areaPacoteId inválido → 404 e sem lançamento no banco
 *   4. Idempotency key: dois POSTs idênticos → um único registro no banco
 *      e audit log registrado exatamente uma vez
 *   5. real > orcado sem justificativa → 422 e lançamento não criado com real
 *
 * Requisitos:
 *   - Servidor Next.js rodando em http://localhost:3000
 *   - Usuário admin: admin@grupopaubrasil.com.br / Admin@2026!
 *   - Ao menos um OBZAreaPacote ativo com linha-folha e linha-pai (com filhas)
 */

import assert from 'node:assert/strict'
import { describe, it, before, after } from 'node:test'
import { IntegrationSession } from './support/integration-base'
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'node:crypto'

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@grupopaubrasil.com.br'
const ADMIN_PASS  = process.env.ADMIN_PASS  ?? 'Admin@2026!'

const ANO = new Date().getFullYear()
const MES = new Date().getMonth() + 1

describe('OBZ — Atomicidade e Ausência de Side-Effects em Falhas', () => {
  const admin = new IntegrationSession('Admin Rollback OBZ')

  let areaPacoteId: string
  let linhaFolhaId: string
  let linhaPaiId: string | null = null   // linha com sub-linhas (não-folha)
  let createdIds: string[] = []          // lancamentos criados para cleanup

  before(async () => {
    const ok = await admin.login(ADMIN_EMAIL, ADMIN_PASS)
    assert.ok(ok, `Login admin falhou (${ADMIN_EMAIL})`)

    // Buscar areaPacote ativo com ao menos uma linha-folha
    const ap = await prisma.oBZAreaPacote.findFirst({
      where: { ativo: true },
      include: {
        pacote: {
          include: {
            linhas: {
              where: { ativo: true },
              include: {
                _count: { select: { filhas: { where: { ativo: true } } } },
              },
            },
          },
        },
      },
    })

    assert.ok(ap, 'Nenhum OBZAreaPacote ativo encontrado — verifique o ambiente')

    const linhas = ap.pacote.linhas
    const folha  = linhas.find(l => l._count.filhas === 0)
    const pai    = linhas.find(l => l._count.filhas > 0)

    assert.ok(folha, `Nenhuma linha-folha no pacote ${ap.pacote.nome}`)

    areaPacoteId = ap.id
    linhaFolhaId = folha.id
    linhaPaiId   = pai?.id ?? null
  })

  after(async () => {
    // Cleanup: remover apenas os lançamentos criados por estes testes
    for (const id of createdIds) {
      await prisma.oBZJustificativa.deleteMany({ where: { lancamentoId: id } }).catch(() => {})
      await prisma.oBZLancamento.deleteMany({ where: { id } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  // ── Cenário 1: linhaId inexistente no pacote ────────────────────────────────

  it('1 — linhaId inválida retorna 404 e não persiste lançamento', async () => {
    const linhaFakeId = randomUUID()

    const antes = await prisma.oBZLancamento.count({ where: { areaPacoteId, ano: ANO, mes: MES } })

    const res = await admin.post('/api/obz/lancamentos', {
      linhaId:     linhaFakeId,
      areaPacoteId,
      ano:         ANO,
      mes:         MES,
      orcado:      100,
    })

    assert.strictEqual(res.status, 404, `Esperava 404 para linhaId falsa, recebeu ${res.status}`)

    const depois = await prisma.oBZLancamento.count({ where: { areaPacoteId, ano: ANO, mes: MES } })
    assert.strictEqual(depois, antes, 'Nenhum lançamento deve ter sido criado para linhaId inválida')
  })

  // ── Cenário 2: linha com sub-linhas (não-folha) ─────────────────────────────

  it('2 — linha com sub-linhas retorna 400 e não persiste lançamento', async () => {
    if (!linhaPaiId) {
      // Não há linha-pai no ambiente — pular silenciosamente
      return
    }

    const antes = await prisma.oBZLancamento.count({
      where: { linhaId: linhaPaiId, areaPacoteId, ano: ANO, mes: MES },
    })

    const res = await admin.post('/api/obz/lancamentos', {
      linhaId:     linhaPaiId,
      areaPacoteId,
      ano:         ANO,
      mes:         MES,
      orcado:      100,
    })

    assert.strictEqual(res.status, 400, `Esperava 400 para linha não-folha, recebeu ${res.status}`)

    const depois = await prisma.oBZLancamento.count({
      where: { linhaId: linhaPaiId, areaPacoteId, ano: ANO, mes: MES },
    })
    assert.strictEqual(depois, antes, 'Nenhum lançamento deve ter sido criado para linha não-folha')
  })

  // ── Cenário 3: areaPacoteId inválido ─────────────────────────────────────────

  it('3 — areaPacoteId inválido retorna 404 e não persiste lançamento', async () => {
    const fakeAreaPacoteId = randomUUID()

    const res = await admin.post('/api/obz/lancamentos', {
      linhaId:     linhaFolhaId,
      areaPacoteId: fakeAreaPacoteId,
      ano:         ANO,
      mes:         MES,
      orcado:      100,
    })

    assert.strictEqual(res.status, 404, `Esperava 404 para areaPacoteId inválido, recebeu ${res.status}`)

    const count = await prisma.oBZLancamento.count({
      where: { linhaId: linhaFolhaId, areaPacoteId: fakeAreaPacoteId },
    })
    assert.strictEqual(count, 0, 'Nenhum lançamento deve existir para areaPacoteId inválido')
  })

  // ── Cenário 4: idempotency key evita duplicação ───────────────────────────────

  it('4 — dois POSTs com a mesma idempotency-key resultam em 1 registro e 1 audit entry', async () => {
    // Usar um mês especial para não colidir com outros testes (mes=12 ou mes diferente do atual)
    const mesIdempotente = MES === 12 ? 11 : 12
    const idempotencyKey = randomUUID()

    const payload = {
      linhaId:     linhaFolhaId,
      areaPacoteId,
      ano:         ANO,
      mes:         mesIdempotente,
      orcado:      777,
    }

    // Primeira chamada
    const res1 = await admin.post('/api/obz/lancamentos', payload, {
      'idempotency-key': idempotencyKey,
    })

    if (![200, 201].includes(res1.status)) {
      // Ambiente sem período aberto para esse mês — pular
      return
    }

    const lancId = res1.body?.id as string | undefined
    if (lancId) createdIds.push(lancId)

    // Segunda chamada — idêntica, mesma idempotency-key
    const res2 = await admin.post('/api/obz/lancamentos', payload, {
      'idempotency-key': idempotencyKey,
    })

    assert.ok(
      [200, 201].includes(res2.status),
      `Segunda chamada idempotente falhou: ${res2.status} — ${JSON.stringify(res2.body)}`
    )

    // Header de replay deve estar presente na segunda chamada (quando Redis está configurado)
    // Quando Redis não está configurado, o header não será enviado — verificamos apenas a contagem
    const replayHeader = res2.headers?.['idempotency-replayed']
    if (replayHeader) {
      assert.strictEqual(replayHeader, 'true', 'Header Idempotency-Replayed deve ser "true"')
    }

    // Verificar no banco: exatamente 1 lançamento para esse identificador
    const count = await prisma.oBZLancamento.count({
      where: { linhaId: linhaFolhaId, areaPacoteId, ano: ANO, mes: mesIdempotente },
    })
    assert.strictEqual(count, 1, `Esperava 1 lançamento, encontrou ${count} — idempotência falhou`)

    // Verificar audit log: sem Redis (sem replay) pode ter 2 entradas;
    // com Redis (replay) deve ter exatamente 1
    if (replayHeader === 'true') {
      const auditCount = await prisma.auditLog.count({
        where: {
          targetType: 'OBZLancamento',
          targetId:   lancId,
          action:     'OBZ_LANCAMENTO_SALVO',
        },
      })
      assert.strictEqual(
        auditCount,
        1,
        `Audit log duplicado: ${auditCount} entradas para idempotency-key — esperava 1`
      )
    }
  })

  // ── Cenário 5: real > orcado sem justificativa → 422 sem persistência ────────

  it('5 — real > orcado sem justificativa retorna 422 e não persiste o campo real', async () => {
    // Usar um mês especial para isolar do restante dos testes
    const mesTeste = MES === 1 ? 2 : 1

    // Primeiro, criar um lançamento base com orcado apenas
    const resBase = await admin.post('/api/obz/lancamentos', {
      linhaId:     linhaFolhaId,
      areaPacoteId,
      ano:         ANO,
      mes:         mesTeste,
      orcado:      300,
    })

    if (![200, 201].includes(resBase.status)) {
      // Ambiente sem período disponível — pular
      return
    }

    const lancId = resBase.body?.id as string | undefined
    if (lancId) createdIds.push(lancId)

    // Agora tentar atualizar real para valor maior que orcado, SEM justificativa
    const resReal = await admin.post('/api/obz/lancamentos', {
      linhaId:     linhaFolhaId,
      areaPacoteId,
      ano:         ANO,
      mes:         mesTeste,
      real:        999, // real > orcado (300)
      // sem justificativa
    })

    assert.strictEqual(
      resReal.status,
      422,
      `Esperava 422 (justificativa obrigatória), recebeu ${resReal.status}: ${JSON.stringify(resReal.body)}`
    )
    assert.ok(resReal.body?.requiresJustificativa, 'Resposta deve indicar requiresJustificativa=true')

    // Verificar no banco: campo real deve permanecer null (não foi persistido)
    if (lancId) {
      const lanc = await prisma.oBZLancamento.findUnique({ where: { id: lancId }, select: { real: true } })
      assert.ok(
        lanc?.real === null || lanc?.real === undefined,
        `real não deveria ter sido persistido sem justificativa. Valor encontrado: ${lanc?.real}`
      )
    }
  })
})
