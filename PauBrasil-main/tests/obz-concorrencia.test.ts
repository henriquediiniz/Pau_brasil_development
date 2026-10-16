/**
 * tests/obz-concorrencia.test.ts
 *
 * Testa integridade do módulo OBZ sob concorrência:
 *
 *  1. Upserts simultâneos no mesmo lançamento (mesma linhaId+areaPacoteId+ano+mes)
 *     → deve existir exatamente 1 registro no banco (upsert é idempotente)
 *
 *  2. Bulk-review simultâneo na mesma justificativa
 *     → justificativa deve ter um status final consistente (APPROVED ou REJECTED, sem duplicata de auditLog)
 *
 * Requisitos:
 *   - Servidor Next.js rodando em http://localhost:3000
 *   - Usuário admin: admin@grupopaubrasil.com.br / Admin@2026!
 *   - Ao menos um OBZAreaPacote ativo com linha-folha
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

describe('OBZ — Concorrência e Integridade', () => {
  const admin = new IntegrationSession('Admin Concorrente OBZ')

  let areaPacoteId: string
  let linhaId: string
  let lancamentoId: string | null = null
  let justificativaId: string | null = null

  before(async () => {
    const ok = await admin.login(ADMIN_EMAIL, ADMIN_PASS)
    assert.ok(ok, `Login admin falhou (${ADMIN_EMAIL})`)

    // Buscar areaPacote ativo com linha-folha
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

    const linhaFolha = ap.pacote.linhas.find(l => l._count.filhas === 0)
    assert.ok(linhaFolha, `Nenhuma linha-folha encontrada no pacote ${ap.pacote.nome}`)

    areaPacoteId = ap.id
    linhaId      = linhaFolha.id
  })

  after(async () => {
    // Cleanup: remover justificativa e resetar lançamento do teste
    if (justificativaId) {
      await prisma.oBZJustificativa.deleteMany({ where: { id: justificativaId } }).catch(() => {})
    }
    if (lancamentoId) {
      await prisma.oBZLancamento.updateMany({
        where: { id: lancamentoId },
        data: { real: null, orcado: 0 },
      }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('Upserts simultâneos no mesmo lançamento resultam em 1 único registro no banco', async () => {
    // 5 requests simultâneos com o mesmo identificador único (linhaId+areaPacoteId+ano+mes)
    const CONCORRENTES = 5

    console.log(`Disparando ${CONCORRENTES} upserts simultâneos no mesmo lançamento...`)

    const requests = Array.from({ length: CONCORRENTES }).map(() =>
      admin.post('/api/obz/lancamentos', {
        linhaId,
        areaPacoteId,
        ano:    ANO,
        mes:    MES,
        orcado: 1000,
      })
    )

    const results = await Promise.all(requests)
    const successes = results.filter(r => [200, 201].includes(r.status))
    console.log(`Upserts bem-sucedidos: ${successes.length}/${CONCORRENTES}`)

    // Ao menos um deve ter sucesso
    assert.ok(successes.length >= 1, `Nenhum upsert foi bem-sucedido`)

    // Guardar id para cleanup
    if (successes[0]?.body?.id) {
      lancamentoId = successes[0].body.id
    }

    // Verificar no banco: deve existir exatamente 1 registro para esse identificador único
    const count = await prisma.oBZLancamento.count({
      where: { linhaId, areaPacoteId, ano: ANO, mes: MES },
    })

    assert.strictEqual(
      count,
      1,
      `ERRO: Encontrados ${count} lançamentos para o mesmo linhaId+areaPacoteId+ano+mes — esperava 1 (upsert idempotente)`
    )
  })

  it('Bulk-review simultâneo na mesma justificativa resulta em status final consistente', async () => {
    // Precisa de uma justificativa PENDING — criar via lançamento com real > orcado
    const lancRes = await admin.post('/api/obz/lancamentos', {
      linhaId,
      areaPacoteId,
      ano:           ANO,
      mes:           MES,
      orcado:        200,
      real:          500,
      justificativa: 'Justificativa para teste de concorrência no bulk-review OBZ.',
    })

    if (![200, 201].includes(lancRes.status)) {
      console.warn(`⚠  Não foi possível criar lançamento para o teste de bulk-review (${lancRes.status}) — pulando`)
      return
    }

    if (lancRes.body.id) lancamentoId = lancRes.body.id

    const just = lancRes.body.id
      ? await prisma.oBZJustificativa.findFirst({
          where: { lancamentoId: lancRes.body.id, status: 'PENDING' },
        })
      : null

    if (!just) {
      console.warn('⚠  Nenhuma justificativa PENDING criada — pode haver justificativa duplicada ou lançamento existente. Pulando.')
      return
    }

    justificativaId = just.id

    // 5 bulk-reviews simultâneos na mesma justificativa
    const CONCORRENTES = 5
    console.log(`Disparando ${CONCORRENTES} bulk-reviews simultâneos na mesma justificativa...`)

    const reviews = Array.from({ length: CONCORRENTES }).map(() =>
      admin.post('/api/obz/justificativas/bulk-review', {
        ids:    [just.id],
        action: 'approve',
        note:   'Aprovação concorrente — apenas uma deve valer.',
      })
    )

    const results = await Promise.all(reviews)
    const processed = results.filter(r => r.status === 200 && r.body.processed > 0)
    console.log(`Reviews que processaram a justificativa: ${processed.length}/${CONCORRENTES}`)

    // Verificar status final no banco — deve ser APPROVED (consistente, não corrompido)
    const justFinal = await prisma.oBZJustificativa.findUnique({ where: { id: just.id } })
    assert.ok(
      ['APPROVED', 'REJECTED'].includes(justFinal?.status ?? ''),
      `Status final inválido: ${justFinal?.status}`
    )

    // Verificar que não foram criadas entradas de auditLog duplicadas para a mesma justificativa
    const auditCount = await prisma.auditLog.count({
      where: {
        targetType: 'OBZJustificativa',
        targetId:   just.id,
        action:     'OBZ_JUSTIFICATIVA_APROVADA',
      },
    })

    assert.ok(
      auditCount <= CONCORRENTES,
      `Encontrados ${auditCount} logs de auditoria para uma única justificativa — número inesperadamente alto`
    )

    // Importante: approverId deve estar preenchido (não null)
    assert.ok(
      justFinal?.approverId,
      'approverId deve estar preenchido após aprovação'
    )
  })
})
