-- Migration: 20260416000000_upb_world_class
-- UPB World-Class: Recertificação + Pré-requisitos + Telemetria granular de quiz

-- ── UPBTemporada — recertificação e pré-requisitos ────────────────────────────
ALTER TABLE "UPBTemporada"
  ADD COLUMN IF NOT EXISTS "preRequisitos" TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "validadeDias"  INTEGER;

-- ── UPBCertificado — data de validade ─────────────────────────────────────────
ALTER TABLE "UPBCertificado"
  ADD COLUMN IF NOT EXISTS "validoAte" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "UPBCertificado_validoAte_idx" ON "UPBCertificado"("validoAte");

-- ── UPBQuestao — versionamento ────────────────────────────────────────────────
ALTER TABLE "UPBQuestao"
  ADD COLUMN IF NOT EXISTS "versao" INTEGER NOT NULL DEFAULT 1;

-- ── UPBRespostaUsuario — telemetria granular ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "UPBRespostaUsuario" (
  "id"               TEXT        NOT NULL,
  "tentativaId"      TEXT        NOT NULL,
  "questaoId"        TEXT        NOT NULL,
  "questaoVersao"    INTEGER     NOT NULL,
  "opcaoEscolhidaId" TEXT        NOT NULL,
  "correta"          BOOLEAN     NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UPBRespostaUsuario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UPBRespostaUsuario_tentativaId_idx"
  ON "UPBRespostaUsuario"("tentativaId");

CREATE INDEX IF NOT EXISTS "UPBRespostaUsuario_questaoId_questaoVersao_idx"
  ON "UPBRespostaUsuario"("questaoId", "questaoVersao");

ALTER TABLE "UPBRespostaUsuario"
  ADD CONSTRAINT "UPBRespostaUsuario_tentativaId_fkey"
    FOREIGN KEY ("tentativaId") REFERENCES "UPBQuizTentativa"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "UPBRespostaUsuario_questaoId_fkey"
    FOREIGN KEY ("questaoId") REFERENCES "UPBQuestao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
