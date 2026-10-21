-- Newsletter do site institucional: campanhas e fotos.
-- Migração puramente aditiva. Escrita à mão: o `migrate dev` também propunha
-- apagar as tabelas legadas de OBZ e Score (retiradas do schema, mas ainda no
-- banco). Essa remoção NÃO faz parte desta mudança e exige decisão própria.

-- CreateTable
CREATE TABLE "NewsletterPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "company" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tagline" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterPhoto" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "alt" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "blur" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsletterPost_published_eventDate_idx" ON "NewsletterPost"("published", "eventDate");

-- CreateIndex
CREATE INDEX "NewsletterPhoto_postId_position_idx" ON "NewsletterPhoto"("postId", "position");

-- AddForeignKey
ALTER TABLE "NewsletterPhoto" ADD CONSTRAINT "NewsletterPhoto_postId_fkey" FOREIGN KEY ("postId") REFERENCES "NewsletterPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
