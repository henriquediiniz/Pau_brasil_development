/**
 * tests/obz-lancamento-flow.test.ts
 *
 * Fluxo completo de lançamento OBZ pelo admin:
 *   1. Admin faz upsert de lançamento com real > orcado + justificativa
 *   2. Verifica que OBZJustificativa PENDING foi criada automaticamente no banco
 *   3. Admin aprova via bulk-review
 *   4. Verifica que status mudou para APPROVED e approverId está preenchido
 *   5. Cleanup: remove justificativa e reseta lançamento
 *
 * Requisitos:
 *   - Servidor Next.js rodando em http://localhost:3000
 *   - Usuário admin: admin@grupopaubrasil.com.br / Admin@2026!
 *   - Ao menos um OBZAreaPacote ativo com uma linha-folha (sem sub-linhas)
 */

import assert from 'node:assert/strict'
import { describe, it, before, after } from 'node:test'
import { IntegrationSession } from './support/integration-base'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@grupopaubrasil.com.br'
const ADMIN_PASS  = process.env.ADMIN_PASS  ?? 'Admin@2026!'

const ANO = new Date().getFullYear()
const MES = new Date().getMonth() + 1

describe('OBZ — Fluxo Completo: Lançamento → Justificativa → Aprovação', () => {
  const admin = new IntegrationSession('Admin OBZ')

  let areaPacoteId: string
  let linhaId: string
  let lancamentoId: string
  let justificativaId: string

  before(async () => {
    const ok = await admin.login(ADMIN_EMAIL, ADMIN_PASS)
    assert.ok(ok, `Login admin falhou (${ADMIN_EMAIL})`)

    // Buscar um areaPacote ativo com linha-folha (sem filhas ativas)
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

    assert.ok(ap, 'Nenhum OBZAreaPacote ativo encontrado — verifique o ambiente de teste')

    // Encontrar uma linha-folha (sem filhas ativas) desse pacote
    const linhaFolha = ap.pacote.linhas.find(l => l._count.filhas === 0)
    assert.ok(
      linhaFolha,
      `Nenhuma linha-folha encontrada no pacote ${ap.pacote.nome} — todas têm sub-linhas`
    )

    areaPacoteId = ap.id
    linhaId      = linhaFolha.id
  })

  after(async () => {
    // Cleanup: remover justificativa e resetar lançamento criados pelo teste
    if (justificativaId) {
      await prisma.oBZJustificativa.deleteMany({ where: { id: justificativaId } }).catch(() => {})
    }
    if (lancamentoId) {
      // Resetar real para null para não poluir o ambiente
      await prisma.oBZLancamento.updateMany({
        where: { id: lancamentoId },
        data: { real: null },
      }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('1 — admin cria lançamento com real > orcado e justificativa (upsert)', async () => {
    const res = await admin.post('/api/obz/lancamentos', {
      linhaId,
      areaPacoteId,
      ano:         ANO,
      mes:         MES,
      orcado:      500,
      real:        750,
      justificativa: 'Aumento de custo justificado por reajuste contratual no período.',
    })

    assert.ok(
      [200, 201].includes(res.status),
      `Esperava 200/201, recebeu ${res.status}: ${JSON.stringify(res.body)}`
    )
    assert.ok(res.body.id, 'Lançamento deve retornar id')
    lancamentoId = res.body.id
  })

  it('2 — OBZJustificativa PENDING foi criada automaticamente no banco', async () => {
    assert.ok(lancamentoId, 'lancamentoId não definido — teste anterior falhou')

    const just = await prisma.oBZJustificativa.findFirst({
      where: { lancamentoId, status: 'PENDING' },
    })

    assert.ok(just, `Justificativa PENDING não encontrada para lancamentoId ${lancamentoId}`)
    justificativaId = just.id
    assert.strictEqual(just.tipo, 'REAL', 'Tipo da justificativa deve ser REAL')
    assert.ok(just.texto.length >= 10, 'Texto da justificativa deve ter ao menos 10 chars')
  })

  it('3 — admin aprova justificativa via bulk-review', async () => {
    assert.ok(justificativaId, 'justificativaId não definido — teste anterior falhou')

    const res = await admin.post('/api/obz/justificativas/bulk-review', {
      ids:    [justificativaId],
      action: 'approve',
      note:   'Aprovado após verificação do contrato revisado.',
    })

    assert.strictEqual(res.status, 200, `bulk-review falhou: ${JSON.stringify(res.body)}`)
    assert.strictEqual(res.body.processed, 1, 'Deve ter processado exatamente 1 justificativa')
    assert.strictEqual(res.body.skipped, 0,   'Não deve ter pulado nenhuma')
  })

  it('4 — OBZJustificativa está APPROVED no banco com approverId preenchido', async () => {
    assert.ok(justificativaId, 'justificativaId não definido — teste anterior falhou')

    const just = await prisma.oBZJustificativa.findUnique({
      where: { id: justificativaId },
    })

    assert.ok(just, 'Justificativa não encontrada no banco após aprovação')
    assert.strictEqual(just.status, 'APPROVED', `Status esperado APPROVED, encontrado: ${just.status}`)
    assert.ok(just.approverId, 'approverId deve estar preenchido após aprovação')
    assert.strictEqual(
      just.approverNote,
      'Aprovado após verificação do contrato revisado.',
      'approverNote deve ter sido salvo corretamente'
    )
  })

  it('5 — bulk-review em justificativa já aprovada retorna processed: 0 (não encontra PENDING)', async () => {
    assert.ok(justificativaId, 'justificativaId não definido — teste anterior falhou')

    // Tentar aprovar de novo uma justificativa já APPROVED — deve retornar 404 ou { processed: 0 }
    const res = await admin.post('/api/obz/justificativas/bulk-review', {
      ids:    [justificativaId],
      action: 'approve',
      note:   'Segunda tentativa de aprovação.',
    })

    // A rota filtra por status: 'PENDING' — se já aprovada, retorna 404
    assert.ok(
      [200, 404].includes(res.status),
      `Esperava 200 ou 404, recebeu ${res.status}: ${JSON.stringify(res.body)}`
    )
    if (res.status === 200) {
      assert.strictEqual(res.body.processed, 0, 'Justificativa já aprovada não deve ser reprocessada')
    }
  })
})
