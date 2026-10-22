-- Universidade: retomar o vídeo de onde parou. Migração aditiva, escrita à mão.

-- AlterTable
ALTER TABLE "UPBProgresso" ADD COLUMN "posicaoSeg" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "duracaoSeg" INTEGER,
ADD COLUMN "vistoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "UPBProgresso_userId_vistoEm_idx" ON "UPBProgresso"("userId", "vistoEm");
