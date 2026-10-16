-- CreateTable
CREATE TABLE "SystemConfig" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "BackupJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "trigger" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "blobUrl" TEXT,
    "blobKey" TEXT,
    "sizeBytes" BIGINT,
    "rowCounts" JSONB,
    "errorMsg" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "BackupJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackupJob_type_status_idx" ON "BackupJob"("type", "status");

-- CreateIndex
CREATE INDEX "BackupJob_startedAt_idx" ON "BackupJob"("startedAt");

-- Seed default config values
INSERT INTO "SystemConfig" ("key", "value", "updatedAt") VALUES
  ('backup_enabled',        'true', NOW()),
  ('backup_hour_utc',       '3',    NOW()),
  ('backup_retention_days', '30',   NOW());
