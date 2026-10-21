-- Remove as tabelas legadas de OBZ e Score e as permissões antigas no usuário.
-- Os modelos saíram do schema na limpeza de 20/10/2026; as tabelas ficaram no banco.
-- Conferido antes de aplicar (21/10/2026): as 15 tabelas estavam vazias em produção
-- e nenhum usuário tinha isObzAdmin/isScoreAdmin marcados. Remoção autorizada pelo usuário.
-- As definições originais continuam nas migrations anteriores, caso precisem voltar.

DROP TABLE IF EXISTS "OBZSubmissaoAnual" CASCADE;
DROP TABLE IF EXISTS "OBZJustificativa" CASCADE;
DROP TABLE IF EXISTS "OBZLancamento" CASCADE;
DROP TABLE IF EXISTS "OBZAreaPacote" CASCADE;
DROP TABLE IF EXISTS "OBZLinhaCusto" CASCADE;
DROP TABLE IF EXISTS "OBZPacote" CASCADE;
DROP TABLE IF EXISTS "OBZArea" CASCADE;
DROP TABLE IF EXISTS "OBZOperacao" CASCADE;
DROP TABLE IF EXISTS "OBZEstado" CASCADE;
DROP TABLE IF EXISTS "OBZPeriodoAnual" CASCADE;
DROP TABLE IF EXISTS "OBZPeriodo" CASCADE;
DROP TABLE IF EXISTS "OBZImportacaoContabil" CASCADE;
DROP TABLE IF EXISTS "ScoreHistorico" CASCADE;
DROP TABLE IF EXISTS "ScoreImportacao" CASCADE;
DROP TABLE IF EXISTS "ScoreCliente" CASCADE;

ALTER TABLE "User" DROP COLUMN IF EXISTS "isObzAdmin",
DROP COLUMN IF EXISTS "isScoreAdmin";

DROP TYPE IF EXISTS "OBZJustStatus";
DROP TYPE IF EXISTS "OBZJustTipo";
