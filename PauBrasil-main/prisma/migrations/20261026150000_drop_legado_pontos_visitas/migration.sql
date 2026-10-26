-- Remove o que sobrou dos módulos retirados: pontos/loja/metas/atividades (out/2026)
-- e visitas de líderes (19/10/2026). Nenhuma tela usa mais estas tabelas e colunas.
-- O backup diário de antes desta migration ainda contém todos estes dados.

-- Chaves estrangeiras
ALTER TABLE "FeedEvent" DROP CONSTRAINT IF EXISTS "FeedEvent_userId_fkey";
ALTER TABLE "LeaderVisit" DROP CONSTRAINT IF EXISTS "LeaderVisit_userId_fkey";
ALTER TABLE "MetaPontuacao" DROP CONSTRAINT IF EXISTS "MetaPontuacao_funcaoId_fkey";
ALTER TABLE "PointsLedger" DROP CONSTRAINT IF EXISTS "PointsLedger_userId_fkey";
ALTER TABLE "RedemptionOrder" DROP CONSTRAINT IF EXISTS "RedemptionOrder_productId_fkey";
ALTER TABLE "RedemptionOrder" DROP CONSTRAINT IF EXISTS "RedemptionOrder_userId_fkey";
ALTER TABLE "TaskDefinition" DROP CONSTRAINT IF EXISTS "TaskDefinition_functionId_fkey";
ALTER TABLE "TaskDefinition" DROP CONSTRAINT IF EXISTS "TaskDefinition_nextTaskDefinitionId_fkey";
ALTER TABLE "TaskInstance" DROP CONSTRAINT IF EXISTS "TaskInstance_approvedBy_fkey";
ALTER TABLE "TaskInstance" DROP CONSTRAINT IF EXISTS "TaskInstance_conviteDeId_fkey";
ALTER TABLE "TaskInstance" DROP CONSTRAINT IF EXISTS "TaskInstance_taskDefinitionId_fkey";
ALTER TABLE "TaskInstance" DROP CONSTRAINT IF EXISTS "TaskInstance_triggeredByInstanceId_fkey";
ALTER TABLE "TaskInstance" DROP CONSTRAINT IF EXISTS "TaskInstance_userId_fkey";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_targetRewardId_fkey";
ALTER TABLE "VisitaObrigatoria" DROP CONSTRAINT IF EXISTS "VisitaObrigatoria_criadoPor_fkey";
ALTER TABLE "VisitaObrigatoria" DROP CONSTRAINT IF EXISTS "VisitaObrigatoria_userId_fkey";

-- Colunas
ALTER TABLE "UPBTemporada" DROP COLUMN IF EXISTS "pontosNoCertificado";
ALTER TABLE "User"
  DROP COLUMN IF EXISTS "isItinerantLeader",
  DROP COLUMN IF EXISTS "isVisitasAdmin",
  DROP COLUMN IF EXISTS "leaderTitle",
  DROP COLUMN IF EXISTS "managedAreaIds",
  DROP COLUMN IF EXISTS "targetRewardId";

-- Tabelas
DROP TABLE IF EXISTS "FeedEvent";
DROP TABLE IF EXISTS "GlobalGoal";
DROP TABLE IF EXISTS "LeaderVisit";
DROP TABLE IF EXISTS "MetaPontuacao";
DROP TABLE IF EXISTS "Operation";
DROP TABLE IF EXISTS "PointsLedger";
DROP TABLE IF EXISTS "RedemptionOrder";
DROP TABLE IF EXISTS "RewardProduct";
DROP TABLE IF EXISTS "TaskDefinition";
DROP TABLE IF EXISTS "TaskInstance";
DROP TABLE IF EXISTS "VisitaObrigatoria";

-- Tipos
DROP TYPE IF EXISTS "Frequency";
DROP TYPE IF EXISTS "LeaderVisitStatus";
DROP TYPE IF EXISTS "LedgerKind";
DROP TYPE IF EXISTS "LedgerStatus";
DROP TYPE IF EXISTS "OrderStatus";
DROP TYPE IF EXISTS "TaskStatus";
