-- Fase 2 — Banco de Dados: índices críticos + soft delete em registros financeiros
-- Gerado em: 2026-04-13
-- Aplicar via: npx prisma migrate deploy (Vercel) ou npx prisma migrate dev (local)

-- ─── Índices compostos críticos ─────────────────────────────────────────────

-- OBZLancamento: consultas por departamento+ano+mês (painel admin, importação contábil)
CREATE INDEX IF NOT EXISTS "OBZLancamento_areaPacoteId_ano_mes_idx"
  ON "OBZLancamento"("areaPacoteId", "ano", "mes");

-- AuditLog: linha do tempo de ações por ator (relatório de auditoria por usuário)
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_createdAt_idx"
  ON "AuditLog"("actorId", "createdAt");

-- ─── Soft delete em registros financeiros ───────────────────────────────────
-- Nunca deletar fisicamente lançamentos ou justificativas OBZ.
-- Registros deletados ficam com deletedAt preenchido e devem ser filtrados
-- nas consultas (WHERE "deletedAt" IS NULL).

ALTER TABLE "OBZLancamento"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "OBZJustificativa"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
