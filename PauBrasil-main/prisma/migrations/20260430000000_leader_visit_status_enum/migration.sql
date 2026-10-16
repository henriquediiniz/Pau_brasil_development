-- CreateEnum
CREATE TYPE "LeaderVisitStatus" AS ENUM ('valid', 'blocked_gps', 'blocked_face');

-- AlterTable: converte coluna status de String para enum com cast
ALTER TABLE "LeaderVisit" ALTER COLUMN "status" TYPE "LeaderVisitStatus" USING "status"::"LeaderVisitStatus";
