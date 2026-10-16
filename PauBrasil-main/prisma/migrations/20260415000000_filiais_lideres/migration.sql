-- Migration: 20260415000000_filiais_lideres
-- Adiciona model Filial e campos de líder público no User

-- ── Filial ────────────────────────────────────────────────────────────────────
CREATE TABLE "Filial" (
  "id"        TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "label"     TEXT NOT NULL,
  "estado"    TEXT NOT NULL,
  "color"     TEXT NOT NULL,
  "ativo"     BOOLEAN NOT NULL DEFAULT true,
  "empresaId" TEXT,
  CONSTRAINT "Filial_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Filial_slug_key"      ON "Filial"("slug");
CREATE INDEX        "Filial_ativo_idx"     ON "Filial"("ativo");
CREATE INDEX        "Filial_empresaId_idx" ON "Filial"("empresaId");

ALTER TABLE "Filial"
  ADD CONSTRAINT "Filial_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── User — campos de líder público ───────────────────────────────────────────
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "isLiderPublico" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "filialId"       TEXT,
  ADD COLUMN IF NOT EXISTS "trajetoria"     JSONB;

ALTER TABLE "User"
  ADD CONSTRAINT "User_filialId_fkey"
  FOREIGN KEY ("filialId") REFERENCES "Filial"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_filialId_isLiderPublico_idx" ON "User"("filialId", "isLiderPublico");

-- ── Seed inicial das filiais ─────────────────────────────────────────────────
-- (dados migrados do hardcode em carreiras/page.tsx)
INSERT INTO "Filial" ("id", "slug", "label", "estado", "color", "ativo")
VALUES
  (gen_random_uuid()::text, 'patos',      'Patos',      'PB', '#ff7d0d', true),
  (gen_random_uuid()::text, 'sousa',      'Sousa',      'PB', '#10b981', true),
  (gen_random_uuid()::text, 'guarabira',  'Guarabira',  'PB', '#06b6d4', true),
  (gen_random_uuid()::text, 'itaporanga', 'Itaporanga', 'PB', '#a855f7', true),
  (gen_random_uuid()::text, 'sume',       'Sumé',       'PB', '#ec4899', true),
  (gen_random_uuid()::text, 'bahia',      'Bahia',      'BA', '#f59e0b', true)
ON CONFLICT ("slug") DO NOTHING;
