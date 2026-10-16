-- Acompanhamento Frontline: QLP meta x real por cargo, e o indice de
-- comprometimento (vagas abertas / QLP meta) contra um teto editavel.
--
-- No app do RH isso vivia em localStorage — as metas existiam so na maquina de
-- quem digitou. Aqui viram tabela, com escopo por operacao como o resto do
-- modulo Gente.
--
-- Tres tabelas novas, nenhuma alteracao em tabela existente.

CREATE TABLE "QuadroFrontlineCargo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "operacaoId" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "atividade" TEXT,
    "departamento" "SetorOperacional" NOT NULL,
    "qlpMeta" INTEGER NOT NULL DEFAULT 0,
    "qlpReal" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuadroFrontlineCargo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuadroFrontlineMes" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "operacaoId" TEXT NOT NULL,
    "departamento" "SetorOperacional" NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "percentual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuadroFrontlineMes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuadroFrontlineTeto" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "percentual" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuadroFrontlineTeto_pkey" PRIMARY KEY ("id")
);

-- Um cargo aparece uma vez por operacao e departamento. O mesmo nome em DPO e
-- SPO sao duas linhas, de proposito: sao dois quadros distintos.
CREATE UNIQUE INDEX "QuadroFrontlineCargo_operacaoId_departamento_cargo_key"
    ON "QuadroFrontlineCargo"("operacaoId", "departamento", "cargo");
CREATE INDEX "QuadroFrontlineCargo_empresaId_ativo_idx"
    ON "QuadroFrontlineCargo"("empresaId", "ativo");
CREATE INDEX "QuadroFrontlineCargo_operacaoId_idx"
    ON "QuadroFrontlineCargo"("operacaoId");

CREATE UNIQUE INDEX "QuadroFrontlineMes_operacaoId_departamento_ano_mes_key"
    ON "QuadroFrontlineMes"("operacaoId", "departamento", "ano", "mes");
CREATE INDEX "QuadroFrontlineMes_empresaId_ano_idx"
    ON "QuadroFrontlineMes"("empresaId", "ano");

CREATE UNIQUE INDEX "QuadroFrontlineTeto_empresaId_ano_key"
    ON "QuadroFrontlineTeto"("empresaId", "ano");

ALTER TABLE "QuadroFrontlineCargo" ADD CONSTRAINT "QuadroFrontlineCargo_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuadroFrontlineCargo" ADD CONSTRAINT "QuadroFrontlineCargo_operacaoId_fkey"
    FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuadroFrontlineMes" ADD CONSTRAINT "QuadroFrontlineMes_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuadroFrontlineMes" ADD CONSTRAINT "QuadroFrontlineMes_operacaoId_fkey"
    FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuadroFrontlineTeto" ADD CONSTRAINT "QuadroFrontlineTeto_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
