-- Notícias gerais (avisos fixos do site). Migração aditiva, escrita à mão.

-- CreateTable
CREATE TABLE "EndoAviso" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "link" TEXT,
    "linkLabel" TEXT,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EndoAviso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EndoAviso_published_ordem_idx" ON "EndoAviso"("published", "ordem");
