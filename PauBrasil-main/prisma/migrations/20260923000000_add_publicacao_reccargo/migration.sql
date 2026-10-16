-- Descritivo de cargo passa a alimentar a pagina publica de carreiras.
--
-- Ate aqui havia duas fontes de verdade para "quais cargos existem": a lista
-- chumbada em src/lib/carreiras-areas.ts (40 cargos) e a tabela RecCargo (57).
-- Elas ja tinham divergido: so 4 dos 40 casavam pelo nome.
--
-- `publicarNoSite` nasce FALSE de proposito. Ligar por padrao publicaria os 57
-- descritivos no site no momento do deploy, incluindo cargo em estudo. Quem
-- decide o que aparece e o RH, um a um.
--
-- Tres colunas novas, nenhuma alteracao em dado existente.

ALTER TABLE "RecCargo" ADD COLUMN "publicarNoSite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RecCargo" ADD COLUMN "grupoPublico" TEXT;
ALTER TABLE "RecCargo" ADD COLUMN "turnos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- A pagina publica filtra por estes dois campos e nada mais; sem indice a
-- consulta varreria a tabela a cada visita de candidato.
CREATE INDEX "RecCargo_publicarNoSite_idx" ON "RecCargo"("publicarNoSite");
