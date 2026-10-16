-- CreateTable
CREATE TABLE "VisitaObrigatoria" (
    "id"               TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "operationSlug"    TEXT NOT NULL,
    "quantidadeMinima" INTEGER NOT NULL DEFAULT 1,
    "ativo"            BOOLEAN NOT NULL DEFAULT true,
    "criadoPor"        TEXT NOT NULL,
    "criadoEm"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitaObrigatoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitaObrigatoria_userId_operationSlug_key" ON "VisitaObrigatoria"("userId", "operationSlug");

-- CreateIndex
CREATE INDEX "VisitaObrigatoria_userId_idx" ON "VisitaObrigatoria"("userId");

-- CreateIndex
CREATE INDEX "VisitaObrigatoria_operationSlug_idx" ON "VisitaObrigatoria"("operationSlug");

-- AddForeignKey
ALTER TABLE "VisitaObrigatoria" ADD CONSTRAINT "VisitaObrigatoria_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitaObrigatoria" ADD CONSTRAINT "VisitaObrigatoria_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
