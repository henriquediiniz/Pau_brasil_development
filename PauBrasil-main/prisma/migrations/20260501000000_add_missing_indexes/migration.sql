-- Índices compostos faltantes para queries de alta frequência

-- AuditLog: relatórios filtrados por tipo de ação + período
CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditLog_targetType_createdAt_idx" ON "AuditLog"("targetType", "createdAt" DESC);

-- Notification: timeline de não-lidas por usuário (unread count + feed ordenado)
CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt" DESC);

-- User: filtro de usuários ativos no painel admin
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");

-- OBZLancamento: dashboard de compliance por departamento + período
CREATE INDEX IF NOT EXISTS "OBZLancamento_areaPacoteId_ano_mes_idx" ON "OBZLancamento"("areaPacoteId", "ano", "mes");

-- LeaderVisit: groupBy compliance mensal (userId + operationSlug + checkedInAt)
CREATE INDEX IF NOT EXISTS "LeaderVisit_userId_operationSlug_checkedInAt_idx" ON "LeaderVisit"("userId", "operationSlug", "checkedInAt");
