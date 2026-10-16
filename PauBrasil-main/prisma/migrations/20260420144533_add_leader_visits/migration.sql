/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `OBZJustificativa` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `OBZLancamento` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AuditLog_actorId_createdAt_idx";

-- DropIndex
DROP INDEX "OBZLancamento_areaPacoteId_ano_mes_idx";

-- DropIndex
DROP INDEX "User_filialId_isLiderPublico_idx";

-- AlterTable
ALTER TABLE "OBZJustificativa" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "OBZLancamento" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "faceReferenceUrl" TEXT,
ADD COLUMN     "isItinerantLeader" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "leaderTitle" TEXT;

-- CreateTable
CREATE TABLE "LeaderVisit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operationSlug" TEXT NOT NULL,
    "operationName" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photoUrl" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "gpsValid" BOOLEAN NOT NULL,
    "faceValid" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "LeaderVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL DEFAULT 200,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaderVisit_userId_idx" ON "LeaderVisit"("userId");

-- CreateIndex
CREATE INDEX "LeaderVisit_operationSlug_idx" ON "LeaderVisit"("operationSlug");

-- CreateIndex
CREATE INDEX "LeaderVisit_checkedInAt_idx" ON "LeaderVisit"("checkedInAt");

-- CreateIndex
CREATE UNIQUE INDEX "Operation_slug_key" ON "Operation"("slug");

-- AddForeignKey
ALTER TABLE "LeaderVisit" ADD CONSTRAINT "LeaderVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
