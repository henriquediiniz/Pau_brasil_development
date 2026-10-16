ALTER TABLE "User" ADD COLUMN "operationIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "passwordResetTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3);

UPDATE "User" u
SET "operationIds" = COALESCE((
  SELECT array_agg(o."id" ORDER BY o."ordem", o."nome")
  FROM "Operacao" o
  WHERE o."empresaId" = u."empresaId"
    AND o."nome" = ANY(u."units")
), ARRAY[]::TEXT[])
WHERE cardinality(u."units") > 0;
