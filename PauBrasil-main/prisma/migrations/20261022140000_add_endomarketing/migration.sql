-- Endomarketing (/nossa-gente): mural de reconhecimento, calendário de campanhas e números do mês.
-- Migração escrita à mão, puramente aditiva (o gerador também propunha mexer em índices antigos).

-- CreateTable
CREATE TABLE "EndoReconhecimento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "mes" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EndoReconhecimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EndoCampanha" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "cor" TEXT NOT NULL DEFAULT 'vinho',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EndoCampanha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EndoNumero" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "sufixo" TEXT,
    "mes" TIMESTAMP(3) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EndoNumero_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EndoReconhecimento_published_mes_idx" ON "EndoReconhecimento"("published", "mes");

-- CreateIndex
CREATE INDEX "EndoCampanha_published_inicio_idx" ON "EndoCampanha"("published", "inicio");

-- CreateIndex
CREATE INDEX "EndoNumero_mes_ordem_idx" ON "EndoNumero"("mes", "ordem");
