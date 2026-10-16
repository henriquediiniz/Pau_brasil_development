-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'GESTOR', 'RH_ADMIN', 'SYS_ADMIN');

-- CreateEnum
CREATE TYPE "Nivel" AS ENUM ('COLABORADOR', 'COORDENADOR', 'GERENTE', 'DIRETOR', 'PRESIDENTE', 'SUPERVISOR', 'DIRETO');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'BLOCKED', 'DONE', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LedgerKind" AS ENUM ('EARN', 'REDEEM', 'ADJUST', 'REVERSAL');

-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('CONFIRMED', 'PENDING');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('REQUESTED', 'APPROVED', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OBZJustStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OBZJustTipo" AS ENUM ('REAL', 'TENDENCIA');

-- CreateEnum
CREATE TYPE "UPBMatriculaStatus" AS ENUM ('PENDENTE', 'APROVADO', 'NEGADO');

-- CreateEnum
CREATE TYPE "EtapaCandidatura" AS ENUM ('RECEBIDO', 'TRIAGEM', 'ENTREVISTA', 'APROVADO', 'REJEITADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TipoNotaCandidatura" AS ENUM ('NOTA', 'MUDANCA_ETAPA', 'SISTEMA');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeAbrev" TEXT,
    "empresaId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "nivel" "Nivel" NOT NULL DEFAULT 'COLABORADOR',
    "isObzAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isUPBAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isScoreAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isEmpresaAdmin" BOOLEAN NOT NULL DEFAULT false,
    "managedAreaIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "functionId" TEXT,
    "units" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "company" TEXT,
    "empresaId" TEXT,
    "managerId" TEXT,
    "photoUrl" TEXT,
    "targetRewardId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Function" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "empresaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Function_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDefinition" (
    "id" TEXT NOT NULL,
    "functionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "Frequency" NOT NULL DEFAULT 'DAILY',
    "daysOfWeek" INTEGER[],
    "points" INTEGER NOT NULL DEFAULT 10,
    "requireEvidence" BOOLEAN NOT NULL DEFAULT false,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "dailyLimit" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextTaskDefinitionId" TEXT,

    CONSTRAINT "TaskDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskInstance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskDefinitionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "evidenceUrl" TEXT,
    "note" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isAdHoc" BOOLEAN NOT NULL DEFAULT false,
    "adHocTitle" TEXT,
    "adHocDesc" TEXT,
    "requestedPoints" INTEGER,
    "horario" TEXT,
    "triggeredByInstanceId" TEXT,
    "conviteDeId" TEXT,
    "conviteStatus" TEXT,

    CONSTRAINT "TaskInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "LedgerKind" NOT NULL,
    "status" "LedgerStatus" NOT NULL DEFAULT 'CONFIRMED',
    "points" INTEGER NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardProduct" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pointsCost" INTEGER NOT NULL,
    "stock" INTEGER,
    "emoji" TEXT DEFAULT '🎁',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedemptionOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedemptionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalGoal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DECIMAL(15,2) NOT NULL,
    "currentValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "rewardPoints" INTEGER NOT NULL,
    "units" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBZEstado" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OBZEstado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBZOperacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "estadoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OBZOperacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBZArea" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "operacaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OBZArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBZPacote" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OBZPacote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBZAreaPacote" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "pacoteId" TEXT NOT NULL,
    "linhaId" TEXT NOT NULL,
    "donoId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OBZAreaPacote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBZLinhaCusto" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "pacoteId" TEXT NOT NULL,
    "parentId" TEXT,
    "codigoContabil" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OBZLinhaCusto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBZLancamento" (
    "id" TEXT NOT NULL,
    "linhaId" TEXT NOT NULL,
    "areaPacoteId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "orcado" DECIMAL(15,2) NOT NULL,
    "real" DECIMAL(15,2),
    "tendencia" DECIMAL(15,2),
    "tendenciaJust" TEXT,
    "parcial" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OBZLancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBZJustificativa" (
    "id" TEXT NOT NULL,
    "lancamentoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "tipo" "OBZJustTipo",
    "status" "OBZJustStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "approverNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OBZJustificativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBZPeriodo" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "aberto" BOOLEAN NOT NULL DEFAULT false,
    "abreEm" TIMESTAMP(3),
    "fechaEm" TIMESTAMP(3),
    "reaberturaNota" TEXT,
    "tendenciaAbertaForca" BOOLEAN NOT NULL DEFAULT false,
    "tendenciaOverrideMotivo" TEXT,
    "tendenciaDeadlineDia" INTEGER NOT NULL DEFAULT 5,
    "parcialInicioDia" INTEGER NOT NULL DEFAULT 18,
    "parcialFimDia" INTEGER NOT NULL DEFAULT 20,
    "parcialAbertaForca" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OBZPeriodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBZPeriodoAnual" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "aberto" BOOLEAN NOT NULL DEFAULT true,
    "travado" BOOLEAN NOT NULL DEFAULT false,
    "travadoEm" TIMESTAMP(3),
    "travadoPor" TEXT,
    "travadoNota" TEXT,
    "abreEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OBZPeriodoAnual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBZSubmissaoAnual" (
    "id" TEXT NOT NULL,
    "periodoAnualId" TEXT NOT NULL,
    "areaPacoteId" TEXT NOT NULL,
    "submetidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submetidoPor" TEXT NOT NULL,

    CONSTRAINT "OBZSubmissaoAnual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OBZImportacaoContabil" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "operacaoId" TEXT NOT NULL,
    "arquivo" TEXT NOT NULL,
    "importadoPor" TEXT NOT NULL,
    "importadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itens" JSONB NOT NULL,
    "totalItens" INTEGER NOT NULL,
    "totalMatches" INTEGER NOT NULL,
    "totalDivergencias" INTEGER NOT NULL,
    "totalSemMatchObz" INTEGER NOT NULL,
    "totalObzSemDado" INTEGER NOT NULL,

    CONSTRAINT "OBZImportacaoContabil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPBTemporada" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "capa" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "restricaoAcesso" BOOLEAN NOT NULL DEFAULT false,
    "pontosNoCertificado" INTEGER NOT NULL DEFAULT 0,
    "empresas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unidades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "funcoesComAcesso" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UPBTemporada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPBObrigatorio" (
    "id" TEXT NOT NULL,
    "temporadaId" TEXT NOT NULL,
    "empresas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unidades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "funcoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prazo" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UPBObrigatorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPBQuestao" (
    "id" TEXT NOT NULL,
    "temporadaId" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UPBQuestao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPBQuestaoOpcao" (
    "id" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UPBQuestaoOpcao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPBQuizTentativa" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "temporadaId" TEXT NOT NULL,
    "acertos" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "aprovado" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UPBQuizTentativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPBMatricula" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "temporadaId" TEXT NOT NULL,
    "status" "UPBMatriculaStatus" NOT NULL DEFAULT 'PENDENTE',
    "aprovadoPor" TEXT,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UPBMatricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPBEpisodio" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "videoUrl" TEXT NOT NULL,
    "duracaoMin" INTEGER NOT NULL DEFAULT 0,
    "temporadaId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UPBEpisodio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPBProgresso" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "episodioId" TEXT NOT NULL,
    "concluidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UPBProgresso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPBCertificado" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "temporadaId" TEXT NOT NULL,
    "emitidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UPBCertificado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaPontuacao" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "meta" INTEGER NOT NULL,
    "periodo" TEXT NOT NULL,
    "mes" INTEGER,
    "trimestre" INTEGER,
    "ano" INTEGER NOT NULL,
    "funcaoId" TEXT,
    "units" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "funcoesMeta" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaPontuacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreCliente" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "filial" INTEGER NOT NULL,
    "codPDV" INTEGER NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "cidade" TEXT,
    "tipoPessoa" TEXT,
    "statusPDV" TEXT NOT NULL,
    "setorVDE" TEXT,
    "diaVisita" TEXT,
    "prazoAtual" INTEGER,
    "limiteCredito" DECIMAL(15,2),
    "limiteCreditoUsado" DECIMAL(15,2),
    "dataCadastro" TIMESTAMP(3),
    "dataUltimaCompra" TIMESTAMP(3),
    "score" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "scoreVolume" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "scorePontualidade" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "scoreRecencia" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "scoreFrequencia" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "scoreTendencia" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "scoreCredito" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "volumeMes" DECIMAL(15,2),
    "frequenciaMes" INTEGER,
    "totalPendente" DECIMAL(15,2),
    "maiorAtraso" INTEGER,
    "refAno" INTEGER,
    "refMes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreHistorico" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "score" DECIMAL(3,2) NOT NULL,
    "scoreVolume" DECIMAL(3,2) NOT NULL,
    "scorePontualidade" DECIMAL(3,2) NOT NULL,
    "scoreRecencia" DECIMAL(3,2) NOT NULL,
    "scoreFrequencia" DECIMAL(3,2) NOT NULL,
    "scoreTendencia" DECIMAL(3,2) NOT NULL,
    "scoreCredito" DECIMAL(3,2) NOT NULL,
    "volumeMes" DECIMAL(15,2),
    "refAno" INTEGER NOT NULL,
    "refMes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreImportacao" (
    "id" TEXT NOT NULL,
    "refAno" INTEGER NOT NULL,
    "refMes" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "totalLinhas" INTEGER NOT NULL DEFAULT 0,
    "totalProcessados" INTEGER NOT NULL DEFAULT 0,
    "totalErros" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROCESSANDO',
    "erros" JSONB,
    "processadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operadorId" TEXT NOT NULL,

    CONSTRAINT "ScoreImportacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidatura" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "empresa" TEXT NOT NULL DEFAULT 'Pau Brasil Bebidas',
    "gruposInteresse" TEXT[],
    "cargosInteresse" TEXT[],
    "cvUrl" TEXT,
    "cvPublicId" TEXT,
    "cvOriginalFilename" TEXT,
    "cvMimeType" TEXT,
    "cvSizeBytes" INTEGER,
    "cvHash" TEXT,
    "mensagem" TEXT,
    "etapa" "EtapaCandidatura" NOT NULL DEFAULT 'RECEBIDO',
    "consentimentoLgpd" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaCandidatura" (
    "id" TEXT NOT NULL,
    "candidaturaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "tipo" "TipoNotaCandidatura" NOT NULL DEFAULT 'NOTA',
    "etapaAnterior" "EtapaCandidatura",
    "etapaNova" "EtapaCandidatura",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaCandidatura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nome_key" ON "Empresa"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_slug_key" ON "Empresa"("slug");

-- CreateIndex
CREATE INDEX "Empresa_ativo_idx" ON "Empresa"("ativo");

-- CreateIndex
CREATE INDEX "Operacao_empresaId_idx" ON "Operacao"("empresaId");

-- CreateIndex
CREATE INDEX "Operacao_empresaId_ativo_idx" ON "Operacao"("empresaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Operacao_nome_empresaId_key" ON "Operacao"("nome", "empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_functionId_idx" ON "User"("functionId");

-- CreateIndex
CREATE INDEX "User_managerId_idx" ON "User"("managerId");

-- CreateIndex
CREATE INDEX "User_empresaId_idx" ON "User"("empresaId");

-- CreateIndex
CREATE INDEX "User_isEmpresaAdmin_idx" ON "User"("isEmpresaAdmin");

-- CreateIndex
CREATE INDEX "Function_empresaId_idx" ON "Function"("empresaId");

-- CreateIndex
CREATE INDEX "TaskDefinition_functionId_idx" ON "TaskDefinition"("functionId");

-- CreateIndex
CREATE INDEX "TaskDefinition_nextTaskDefinitionId_idx" ON "TaskDefinition"("nextTaskDefinitionId");

-- CreateIndex
CREATE INDEX "TaskInstance_userId_date_idx" ON "TaskInstance"("userId", "date");

-- CreateIndex
CREATE INDEX "TaskInstance_userId_date_status_idx" ON "TaskInstance"("userId", "date", "status");

-- CreateIndex
CREATE INDEX "TaskInstance_taskDefinitionId_idx" ON "TaskInstance"("taskDefinitionId");

-- CreateIndex
CREATE INDEX "TaskInstance_status_idx" ON "TaskInstance"("status");

-- CreateIndex
CREATE INDEX "TaskInstance_isAdHoc_idx" ON "TaskInstance"("isAdHoc");

-- CreateIndex
CREATE UNIQUE INDEX "TaskInstance_userId_taskDefinitionId_date_key" ON "TaskInstance"("userId", "taskDefinitionId", "date");

-- CreateIndex
CREATE INDEX "PointsLedger_userId_idx" ON "PointsLedger"("userId");

-- CreateIndex
CREATE INDEX "PointsLedger_userId_status_idx" ON "PointsLedger"("userId", "status");

-- CreateIndex
CREATE INDEX "PointsLedger_userId_kind_idx" ON "PointsLedger"("userId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "PointsLedger_refType_refId_kind_key" ON "PointsLedger"("refType", "refId", "kind");

-- CreateIndex
CREATE INDEX "RedemptionOrder_userId_idx" ON "RedemptionOrder"("userId");

-- CreateIndex
CREATE INDEX "RedemptionOrder_status_idx" ON "RedemptionOrder"("status");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GlobalGoal_active_idx" ON "GlobalGoal"("active");

-- CreateIndex
CREATE INDEX "FeedEvent_createdAt_idx" ON "FeedEvent"("createdAt");

-- CreateIndex
CREATE INDEX "FeedEvent_type_idx" ON "FeedEvent"("type");

-- CreateIndex
CREATE INDEX "FeedEvent_userId_idx" ON "FeedEvent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OBZEstado_nome_key" ON "OBZEstado"("nome");

-- CreateIndex
CREATE INDEX "OBZOperacao_estadoId_idx" ON "OBZOperacao"("estadoId");

-- CreateIndex
CREATE INDEX "OBZArea_operacaoId_idx" ON "OBZArea"("operacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "OBZPacote_nome_key" ON "OBZPacote"("nome");

-- CreateIndex
CREATE INDEX "OBZAreaPacote_areaId_idx" ON "OBZAreaPacote"("areaId");

-- CreateIndex
CREATE INDEX "OBZAreaPacote_pacoteId_idx" ON "OBZAreaPacote"("pacoteId");

-- CreateIndex
CREATE INDEX "OBZAreaPacote_linhaId_idx" ON "OBZAreaPacote"("linhaId");

-- CreateIndex
CREATE INDEX "OBZAreaPacote_donoId_idx" ON "OBZAreaPacote"("donoId");

-- CreateIndex
CREATE UNIQUE INDEX "OBZAreaPacote_areaId_pacoteId_linhaId_key" ON "OBZAreaPacote"("areaId", "pacoteId", "linhaId");

-- CreateIndex
CREATE INDEX "OBZLinhaCusto_pacoteId_idx" ON "OBZLinhaCusto"("pacoteId");

-- CreateIndex
CREATE INDEX "OBZLinhaCusto_parentId_idx" ON "OBZLinhaCusto"("parentId");

-- CreateIndex
CREATE INDEX "OBZLancamento_linhaId_idx" ON "OBZLancamento"("linhaId");

-- CreateIndex
CREATE INDEX "OBZLancamento_areaPacoteId_idx" ON "OBZLancamento"("areaPacoteId");

-- CreateIndex
CREATE INDEX "OBZLancamento_ano_mes_idx" ON "OBZLancamento"("ano", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "OBZLancamento_linhaId_areaPacoteId_ano_mes_key" ON "OBZLancamento"("linhaId", "areaPacoteId", "ano", "mes");

-- CreateIndex
CREATE INDEX "OBZJustificativa_lancamentoId_idx" ON "OBZJustificativa"("lancamentoId");

-- CreateIndex
CREATE INDEX "OBZJustificativa_status_idx" ON "OBZJustificativa"("status");

-- CreateIndex
CREATE INDEX "OBZJustificativa_tipo_idx" ON "OBZJustificativa"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "OBZPeriodo_ano_mes_key" ON "OBZPeriodo"("ano", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "OBZPeriodoAnual_ano_key" ON "OBZPeriodoAnual"("ano");

-- CreateIndex
CREATE INDEX "OBZPeriodoAnual_ano_idx" ON "OBZPeriodoAnual"("ano");

-- CreateIndex
CREATE INDEX "OBZSubmissaoAnual_periodoAnualId_idx" ON "OBZSubmissaoAnual"("periodoAnualId");

-- CreateIndex
CREATE UNIQUE INDEX "OBZSubmissaoAnual_periodoAnualId_areaPacoteId_key" ON "OBZSubmissaoAnual"("periodoAnualId", "areaPacoteId");

-- CreateIndex
CREATE INDEX "OBZImportacaoContabil_ano_operacaoId_idx" ON "OBZImportacaoContabil"("ano", "operacaoId");

-- CreateIndex
CREATE INDEX "UPBObrigatorio_temporadaId_idx" ON "UPBObrigatorio"("temporadaId");

-- CreateIndex
CREATE INDEX "UPBQuestao_temporadaId_idx" ON "UPBQuestao"("temporadaId");

-- CreateIndex
CREATE INDEX "UPBQuestaoOpcao_questaoId_idx" ON "UPBQuestaoOpcao"("questaoId");

-- CreateIndex
CREATE INDEX "UPBQuizTentativa_userId_temporadaId_idx" ON "UPBQuizTentativa"("userId", "temporadaId");

-- CreateIndex
CREATE INDEX "UPBMatricula_temporadaId_idx" ON "UPBMatricula"("temporadaId");

-- CreateIndex
CREATE INDEX "UPBMatricula_status_idx" ON "UPBMatricula"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UPBMatricula_userId_temporadaId_key" ON "UPBMatricula"("userId", "temporadaId");

-- CreateIndex
CREATE INDEX "UPBEpisodio_temporadaId_idx" ON "UPBEpisodio"("temporadaId");

-- CreateIndex
CREATE INDEX "UPBProgresso_userId_idx" ON "UPBProgresso"("userId");

-- CreateIndex
CREATE INDEX "UPBProgresso_episodioId_idx" ON "UPBProgresso"("episodioId");

-- CreateIndex
CREATE UNIQUE INDEX "UPBProgresso_userId_episodioId_key" ON "UPBProgresso"("userId", "episodioId");

-- CreateIndex
CREATE INDEX "UPBCertificado_userId_idx" ON "UPBCertificado"("userId");

-- CreateIndex
CREATE INDEX "UPBCertificado_temporadaId_idx" ON "UPBCertificado"("temporadaId");

-- CreateIndex
CREATE UNIQUE INDEX "UPBCertificado_userId_temporadaId_key" ON "UPBCertificado"("userId", "temporadaId");

-- CreateIndex
CREATE INDEX "MetaPontuacao_ano_periodo_idx" ON "MetaPontuacao"("ano", "periodo");

-- CreateIndex
CREATE INDEX "MetaPontuacao_funcaoId_idx" ON "MetaPontuacao"("funcaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreCliente_chave_key" ON "ScoreCliente"("chave");

-- CreateIndex
CREATE INDEX "ScoreCliente_filial_idx" ON "ScoreCliente"("filial");

-- CreateIndex
CREATE INDEX "ScoreCliente_filial_score_idx" ON "ScoreCliente"("filial", "score");

-- CreateIndex
CREATE INDEX "ScoreCliente_score_idx" ON "ScoreCliente"("score");

-- CreateIndex
CREATE INDEX "ScoreCliente_statusPDV_idx" ON "ScoreCliente"("statusPDV");

-- CreateIndex
CREATE INDEX "ScoreCliente_setorVDE_idx" ON "ScoreCliente"("setorVDE");

-- CreateIndex
CREATE INDEX "ScoreCliente_cidade_idx" ON "ScoreCliente"("cidade");

-- CreateIndex
CREATE INDEX "ScoreHistorico_clienteId_idx" ON "ScoreHistorico"("clienteId");

-- CreateIndex
CREATE INDEX "ScoreHistorico_refAno_refMes_idx" ON "ScoreHistorico"("refAno", "refMes");

-- CreateIndex
CREATE INDEX "ScoreImportacao_refAno_refMes_idx" ON "ScoreImportacao"("refAno", "refMes");

-- CreateIndex
CREATE INDEX "ScoreImportacao_tipo_idx" ON "ScoreImportacao"("tipo");

-- CreateIndex
CREATE INDEX "ScoreImportacao_operadorId_idx" ON "ScoreImportacao"("operadorId");

-- CreateIndex
CREATE INDEX "Candidatura_etapa_idx" ON "Candidatura"("etapa");

-- CreateIndex
CREATE INDEX "Candidatura_createdAt_idx" ON "Candidatura"("createdAt");

-- CreateIndex
CREATE INDEX "Candidatura_email_idx" ON "Candidatura"("email");

-- CreateIndex
CREATE INDEX "NotaCandidatura_candidaturaId_idx" ON "NotaCandidatura"("candidaturaId");

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "Function"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_targetRewardId_fkey" FOREIGN KEY ("targetRewardId") REFERENCES "RewardProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Function" ADD CONSTRAINT "Function_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDefinition" ADD CONSTRAINT "TaskDefinition_nextTaskDefinitionId_fkey" FOREIGN KEY ("nextTaskDefinitionId") REFERENCES "TaskDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDefinition" ADD CONSTRAINT "TaskDefinition_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "Function"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_triggeredByInstanceId_fkey" FOREIGN KEY ("triggeredByInstanceId") REFERENCES "TaskInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_conviteDeId_fkey" FOREIGN KEY ("conviteDeId") REFERENCES "TaskInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_taskDefinitionId_fkey" FOREIGN KEY ("taskDefinitionId") REFERENCES "TaskDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLedger" ADD CONSTRAINT "PointsLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedemptionOrder" ADD CONSTRAINT "RedemptionOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedemptionOrder" ADD CONSTRAINT "RedemptionOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "RewardProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedEvent" ADD CONSTRAINT "FeedEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZOperacao" ADD CONSTRAINT "OBZOperacao_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "OBZEstado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZArea" ADD CONSTRAINT "OBZArea_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "OBZOperacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZAreaPacote" ADD CONSTRAINT "OBZAreaPacote_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "OBZArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZAreaPacote" ADD CONSTRAINT "OBZAreaPacote_pacoteId_fkey" FOREIGN KEY ("pacoteId") REFERENCES "OBZPacote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZAreaPacote" ADD CONSTRAINT "OBZAreaPacote_linhaId_fkey" FOREIGN KEY ("linhaId") REFERENCES "OBZLinhaCusto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZAreaPacote" ADD CONSTRAINT "OBZAreaPacote_donoId_fkey" FOREIGN KEY ("donoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZLinhaCusto" ADD CONSTRAINT "OBZLinhaCusto_pacoteId_fkey" FOREIGN KEY ("pacoteId") REFERENCES "OBZPacote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZLinhaCusto" ADD CONSTRAINT "OBZLinhaCusto_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OBZLinhaCusto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZLancamento" ADD CONSTRAINT "OBZLancamento_linhaId_fkey" FOREIGN KEY ("linhaId") REFERENCES "OBZLinhaCusto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZLancamento" ADD CONSTRAINT "OBZLancamento_areaPacoteId_fkey" FOREIGN KEY ("areaPacoteId") REFERENCES "OBZAreaPacote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZJustificativa" ADD CONSTRAINT "OBZJustificativa_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "OBZLancamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZJustificativa" ADD CONSTRAINT "OBZJustificativa_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZSubmissaoAnual" ADD CONSTRAINT "OBZSubmissaoAnual_periodoAnualId_fkey" FOREIGN KEY ("periodoAnualId") REFERENCES "OBZPeriodoAnual"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OBZSubmissaoAnual" ADD CONSTRAINT "OBZSubmissaoAnual_areaPacoteId_fkey" FOREIGN KEY ("areaPacoteId") REFERENCES "OBZAreaPacote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBObrigatorio" ADD CONSTRAINT "UPBObrigatorio_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "UPBTemporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBQuestao" ADD CONSTRAINT "UPBQuestao_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "UPBTemporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBQuestaoOpcao" ADD CONSTRAINT "UPBQuestaoOpcao_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "UPBQuestao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBQuizTentativa" ADD CONSTRAINT "UPBQuizTentativa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBQuizTentativa" ADD CONSTRAINT "UPBQuizTentativa_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "UPBTemporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBMatricula" ADD CONSTRAINT "UPBMatricula_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBMatricula" ADD CONSTRAINT "UPBMatricula_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "UPBTemporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBMatricula" ADD CONSTRAINT "UPBMatricula_aprovadoPor_fkey" FOREIGN KEY ("aprovadoPor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBEpisodio" ADD CONSTRAINT "UPBEpisodio_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "UPBTemporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBProgresso" ADD CONSTRAINT "UPBProgresso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBProgresso" ADD CONSTRAINT "UPBProgresso_episodioId_fkey" FOREIGN KEY ("episodioId") REFERENCES "UPBEpisodio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBCertificado" ADD CONSTRAINT "UPBCertificado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPBCertificado" ADD CONSTRAINT "UPBCertificado_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "UPBTemporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaPontuacao" ADD CONSTRAINT "MetaPontuacao_funcaoId_fkey" FOREIGN KEY ("funcaoId") REFERENCES "Function"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreHistorico" ADD CONSTRAINT "ScoreHistorico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ScoreCliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreImportacao" ADD CONSTRAINT "ScoreImportacao_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCandidatura" ADD CONSTRAINT "NotaCandidatura_candidaturaId_fkey" FOREIGN KEY ("candidaturaId") REFERENCES "Candidatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaCandidatura" ADD CONSTRAINT "NotaCandidatura_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

