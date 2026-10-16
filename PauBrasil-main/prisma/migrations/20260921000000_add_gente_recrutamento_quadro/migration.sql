-- CreateEnum
CREATE TYPE "SetorOperacional" AS ENUM ('DPO', 'SPO');

-- CreateEnum
CREATE TYPE "RecVagaStatus" AS ENUM ('ABERTA', 'FECHADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "RecStatusFechamento" AS ENUM ('ABERTA_NO_PRAZO', 'ABERTA_VENCIDA', 'FECHADA_NO_PRAZO', 'FECHADA_FORA_PRAZO');

-- CreateEnum
CREATE TYPE "RecResultadoEtapa" AS ENUM ('OK', 'NAO', 'NA');

-- CreateEnum
CREATE TYPE "RecSituacaoCandidato" AS ENUM ('EM_STAND_BY', 'EM_ANDAMENTO', 'CONTRATADO', 'INDISPONIVEL', 'NAO_CONTRATADO');

-- CreateEnum
CREATE TYPE "RecOrigemCurriculo" AS ENUM ('PORTAL_CARREIRAS', 'APLICATIVO', 'WHATSAPP', 'EMAIL', 'INDICACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "RecSituacaoInterno" AS ENUM ('AGUARDANDO', 'PROMOVIDO', 'NAO_ATENDE', 'DESLIGADO', 'OUTRA');

-- CreateEnum
CREATE TYPE "QuadroAprendizSituacao" AS ENUM ('VIGENTE', 'ENCERRADO', 'DESLIGADO');

-- CreateTable
CREATE TABLE "RecVaga" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "operacaoId" TEXT,
    "unidadeTexto" TEXT,
    "departamento" "SetorOperacional",
    "cargo" TEXT NOT NULL,
    "cargoId" TEXT,
    "area" TEXT,
    "salario" DECIMAL(12,2),
    "localTrabalho" TEXT,
    "horario" TEXT,
    "quantidadeVagas" INTEGER NOT NULL DEFAULT 1,
    "informacoesComplementares" TEXT,
    "requisitosMinimos" TEXT,
    "formacao" TEXT,
    "motivoSolicitacao" TEXT,
    "codigo" TEXT,
    "frontline" TEXT,
    "colaboradorAnterior" TEXT,
    "colaboradorAnteriorId" TEXT,
    "dataDesligamento" TIMESTAMP(3),
    "dataAbertura" TIMESTAMP(3) NOT NULL,
    "dataPrevistaFechamento" TIMESTAMP(3),
    "dataContratacao" TIMESTAMP(3),
    "encerradaEm" TIMESTAMP(3),
    "responsavelVaga" TEXT,
    "responsavelId" TEXT,
    "solicitanteVaga" TEXT,
    "solicitanteId" TEXT,
    "nomeContratado" TEXT,
    "contratadoId" TEXT,
    "status" "RecVagaStatus" NOT NULL DEFAULT 'ABERTA',
    "statusFechamentoManual" "RecStatusFechamento",
    "andamentoProcesso" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecVaga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecCargo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "tipoVaga" TEXT,
    "descricaoAtividades" TEXT,
    "competenciasSugeridas" TEXT,
    "experienciaSugerida" TEXT,
    "formacao" TEXT,
    "statusCurso" TEXT,
    "exigencias" TEXT,
    "observacoes" TEXT,
    "etapasProcesso" TEXT,
    "testes" TEXT,
    "precisaAderenciaRaio" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecCargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecCandidato" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "operacaoId" TEXT,
    "candidaturaId" TEXT,
    "vagaId" TEXT,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "mesProcesso" TEXT,
    "setor" "SetorOperacional",
    "escolaridade" TEXT,
    "habilidades" TEXT,
    "residencia" TEXT,
    "observacao" TEXT,
    "origemCurriculo" "RecOrigemCurriculo" NOT NULL DEFAULT 'OUTRO',
    "quemIndicou" TEXT,
    "cvUrl" TEXT,
    "cvPublicId" TEXT,
    "cvOriginalFilename" TEXT,
    "cvMimeType" TEXT,
    "cvSizeBytes" INTEGER,
    "cvHash" TEXT,
    "situacao" "RecSituacaoCandidato" NOT NULL DEFAULT 'EM_STAND_BY',
    "situacaoFinal" "RecSituacaoCandidato",
    "dataSituacaoFinal" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecCandidato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecCandidatoEtapa" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "resultado" "RecResultadoEtapa" NOT NULL DEFAULT 'NA',
    "observacao" TEXT,
    "avaliadoPor" TEXT,
    "avaliadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecCandidatoEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecCandidatoInterno" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "operacaoId" TEXT,
    "userId" TEXT,
    "nome" TEXT NOT NULL,
    "cargoAtual" TEXT,
    "setorAtual" TEXT,
    "tempoFuncao" TEXT,
    "cargoPretendido" TEXT,
    "avaliacaoCiclo" TEXT,
    "possuiRequisitos" BOOLEAN NOT NULL DEFAULT false,
    "matrizOuFilial" TEXT,
    "observacoes" TEXT,
    "futurosCargos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "situacao" "RecSituacaoInterno" NOT NULL DEFAULT 'AGUARDANDO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecCandidatoInterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecSucessao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "operacaoId" TEXT,
    "cargoSucessao" TEXT NOT NULL,
    "areaCargoSucessao" TEXT,
    "functionId" TEXT,
    "nomeSucessor" TEXT NOT NULL,
    "sucessorId" TEXT,
    "cargoAtualSucessor" TEXT,
    "prontoAgora" BOOLEAN NOT NULL DEFAULT false,
    "pronto1Ano" BOOLEAN NOT NULL DEFAULT false,
    "pronto2Anos" BOOLEAN NOT NULL DEFAULT false,
    "habilidadeTecnica" TEXT,
    "habilidadeComportamental" TEXT,
    "planoDesenvolvimento" TEXT,
    "inicioMapeamento" TIMESTAMP(3),
    "houveMovimentacao" BOOLEAN,
    "observacao" TEXT,
    "mesAno" TEXT,
    "cicloGente" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecSucessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuadroColaborador" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "operacaoId" TEXT,
    "userId" TEXT,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "area" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuadroColaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuadroDesligamento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "operacaoId" TEXT,
    "userId" TEXT,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "area" TEXT,
    "setor" "SetorOperacional",
    "dataDesligamento" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuadroDesligamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuadroPcd" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "operacaoId" TEXT,
    "userId" TEXT,
    "nome" TEXT NOT NULL,
    "admissao" TIMESTAMP(3),
    "funcao" TEXT,
    "tipo" TEXT,
    "deficiencia" TEXT,
    "sexo" TEXT,
    "cor" TEXT,
    "laudoBlobKey" TEXT,
    "laudoOriginalFilename" TEXT,
    "laudoMimeType" TEXT,
    "laudoSizeBytes" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuadroPcd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuadroPcdMeta" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "operacaoId" TEXT,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "meta" INTEGER NOT NULL DEFAULT 0,
    "real" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuadroPcdMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuadroAprendiz" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "operacaoId" TEXT,
    "userId" TEXT,
    "nome" TEXT NOT NULL,
    "admissao" TIMESTAMP(3),
    "funcao" TEXT,
    "centroCusto" TEXT,
    "departamento" TEXT,
    "setor" "SetorOperacional",
    "sexo" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "gestorNome" TEXT,
    "gestorId" TEXT,
    "fundacao" TEXT,
    "horario" TEXT,
    "inicioContrato" TIMESTAMP(3),
    "terminoContrato" TIMESTAMP(3),
    "situacao" "QuadroAprendizSituacao" NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuadroAprendiz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecVaga_empresaId_idx" ON "RecVaga"("empresaId");

-- CreateIndex
CREATE INDEX "RecVaga_operacaoId_idx" ON "RecVaga"("operacaoId");

-- CreateIndex
CREATE INDEX "RecVaga_status_idx" ON "RecVaga"("status");

-- CreateIndex
CREATE INDEX "RecVaga_dataAbertura_idx" ON "RecVaga"("dataAbertura");

-- CreateIndex
CREATE INDEX "RecVaga_empresaId_status_idx" ON "RecVaga"("empresaId", "status");

-- CreateIndex
CREATE INDEX "RecVaga_operacaoId_status_idx" ON "RecVaga"("operacaoId", "status");

-- CreateIndex
CREATE INDEX "RecCargo_empresaId_ativo_idx" ON "RecCargo"("empresaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "RecCargo_empresaId_cargo_area_key" ON "RecCargo"("empresaId", "cargo", "area");

-- CreateIndex
CREATE UNIQUE INDEX "RecCandidato_candidaturaId_key" ON "RecCandidato"("candidaturaId");

-- CreateIndex
CREATE INDEX "RecCandidato_empresaId_idx" ON "RecCandidato"("empresaId");

-- CreateIndex
CREATE INDEX "RecCandidato_operacaoId_idx" ON "RecCandidato"("operacaoId");

-- CreateIndex
CREATE INDEX "RecCandidato_situacao_idx" ON "RecCandidato"("situacao");

-- CreateIndex
CREATE INDEX "RecCandidato_vagaId_idx" ON "RecCandidato"("vagaId");

-- CreateIndex
CREATE INDEX "RecCandidato_empresaId_situacao_idx" ON "RecCandidato"("empresaId", "situacao");

-- CreateIndex
CREATE INDEX "RecCandidatoEtapa_candidatoId_idx" ON "RecCandidatoEtapa"("candidatoId");

-- CreateIndex
CREATE UNIQUE INDEX "RecCandidatoEtapa_candidatoId_chave_key" ON "RecCandidatoEtapa"("candidatoId", "chave");

-- CreateIndex
CREATE INDEX "RecCandidatoInterno_empresaId_idx" ON "RecCandidatoInterno"("empresaId");

-- CreateIndex
CREATE INDEX "RecCandidatoInterno_operacaoId_idx" ON "RecCandidatoInterno"("operacaoId");

-- CreateIndex
CREATE INDEX "RecCandidatoInterno_situacao_idx" ON "RecCandidatoInterno"("situacao");

-- CreateIndex
CREATE INDEX "RecCandidatoInterno_userId_idx" ON "RecCandidatoInterno"("userId");

-- CreateIndex
CREATE INDEX "RecSucessao_empresaId_idx" ON "RecSucessao"("empresaId");

-- CreateIndex
CREATE INDEX "RecSucessao_operacaoId_idx" ON "RecSucessao"("operacaoId");

-- CreateIndex
CREATE INDEX "RecSucessao_ativo_idx" ON "RecSucessao"("ativo");

-- CreateIndex
CREATE INDEX "RecSucessao_sucessorId_idx" ON "RecSucessao"("sucessorId");

-- CreateIndex
CREATE INDEX "QuadroColaborador_empresaId_idx" ON "QuadroColaborador"("empresaId");

-- CreateIndex
CREATE INDEX "QuadroColaborador_operacaoId_idx" ON "QuadroColaborador"("operacaoId");

-- CreateIndex
CREATE INDEX "QuadroColaborador_userId_idx" ON "QuadroColaborador"("userId");

-- CreateIndex
CREATE INDEX "QuadroColaborador_empresaId_ativo_idx" ON "QuadroColaborador"("empresaId", "ativo");

-- CreateIndex
CREATE INDEX "QuadroDesligamento_empresaId_idx" ON "QuadroDesligamento"("empresaId");

-- CreateIndex
CREATE INDEX "QuadroDesligamento_operacaoId_idx" ON "QuadroDesligamento"("operacaoId");

-- CreateIndex
CREATE INDEX "QuadroDesligamento_dataDesligamento_idx" ON "QuadroDesligamento"("dataDesligamento");

-- CreateIndex
CREATE INDEX "QuadroDesligamento_userId_idx" ON "QuadroDesligamento"("userId");

-- CreateIndex
CREATE INDEX "QuadroPcd_empresaId_idx" ON "QuadroPcd"("empresaId");

-- CreateIndex
CREATE INDEX "QuadroPcd_operacaoId_idx" ON "QuadroPcd"("operacaoId");

-- CreateIndex
CREATE INDEX "QuadroPcd_empresaId_ativo_idx" ON "QuadroPcd"("empresaId", "ativo");

-- CreateIndex
CREATE INDEX "QuadroPcdMeta_empresaId_ano_idx" ON "QuadroPcdMeta"("empresaId", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "QuadroPcdMeta_empresaId_operacaoId_ano_mes_key" ON "QuadroPcdMeta"("empresaId", "operacaoId", "ano", "mes");

-- CreateIndex
CREATE INDEX "QuadroAprendiz_empresaId_idx" ON "QuadroAprendiz"("empresaId");

-- CreateIndex
CREATE INDEX "QuadroAprendiz_operacaoId_idx" ON "QuadroAprendiz"("operacaoId");

-- CreateIndex
CREATE INDEX "QuadroAprendiz_situacao_idx" ON "QuadroAprendiz"("situacao");

-- CreateIndex
CREATE INDEX "QuadroAprendiz_terminoContrato_idx" ON "QuadroAprendiz"("terminoContrato");

-- AddForeignKey
ALTER TABLE "RecVaga" ADD CONSTRAINT "RecVaga_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecVaga" ADD CONSTRAINT "RecVaga_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecVaga" ADD CONSTRAINT "RecVaga_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "RecCargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecVaga" ADD CONSTRAINT "RecVaga_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecVaga" ADD CONSTRAINT "RecVaga_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecVaga" ADD CONSTRAINT "RecVaga_contratadoId_fkey" FOREIGN KEY ("contratadoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecCargo" ADD CONSTRAINT "RecCargo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecCandidato" ADD CONSTRAINT "RecCandidato_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecCandidato" ADD CONSTRAINT "RecCandidato_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecCandidato" ADD CONSTRAINT "RecCandidato_candidaturaId_fkey" FOREIGN KEY ("candidaturaId") REFERENCES "Candidatura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecCandidato" ADD CONSTRAINT "RecCandidato_vagaId_fkey" FOREIGN KEY ("vagaId") REFERENCES "RecVaga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecCandidatoEtapa" ADD CONSTRAINT "RecCandidatoEtapa_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "RecCandidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecCandidatoEtapa" ADD CONSTRAINT "RecCandidatoEtapa_avaliadoPor_fkey" FOREIGN KEY ("avaliadoPor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecCandidatoInterno" ADD CONSTRAINT "RecCandidatoInterno_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecCandidatoInterno" ADD CONSTRAINT "RecCandidatoInterno_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecCandidatoInterno" ADD CONSTRAINT "RecCandidatoInterno_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecSucessao" ADD CONSTRAINT "RecSucessao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecSucessao" ADD CONSTRAINT "RecSucessao_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecSucessao" ADD CONSTRAINT "RecSucessao_sucessorId_fkey" FOREIGN KEY ("sucessorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecSucessao" ADD CONSTRAINT "RecSucessao_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "Function"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroColaborador" ADD CONSTRAINT "QuadroColaborador_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroColaborador" ADD CONSTRAINT "QuadroColaborador_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroColaborador" ADD CONSTRAINT "QuadroColaborador_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroDesligamento" ADD CONSTRAINT "QuadroDesligamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroDesligamento" ADD CONSTRAINT "QuadroDesligamento_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroDesligamento" ADD CONSTRAINT "QuadroDesligamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroPcd" ADD CONSTRAINT "QuadroPcd_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroPcd" ADD CONSTRAINT "QuadroPcd_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroPcd" ADD CONSTRAINT "QuadroPcd_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroPcdMeta" ADD CONSTRAINT "QuadroPcdMeta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroPcdMeta" ADD CONSTRAINT "QuadroPcdMeta_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroAprendiz" ADD CONSTRAINT "QuadroAprendiz_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroAprendiz" ADD CONSTRAINT "QuadroAprendiz_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroAprendiz" ADD CONSTRAINT "QuadroAprendiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuadroAprendiz" ADD CONSTRAINT "QuadroAprendiz_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

