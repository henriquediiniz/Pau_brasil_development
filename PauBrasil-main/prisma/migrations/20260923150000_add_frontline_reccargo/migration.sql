-- Marca no descritivo se o cargo e de frontline.
--
-- A informacao e do CARGO, nao da vaga: "Ajudante de Armazem" e frontline
-- sempre, nao so numa requisicao especifica. Por isso mora no descritivo, que
-- e onde a natureza do cargo ja esta descrita.
--
-- Nasce false: marcar 57 cargos como frontline de uma vez seria inventar uma
-- classificacao que so o RH sabe fazer.
ALTER TABLE "RecCargo" ADD COLUMN "frontline" BOOLEAN NOT NULL DEFAULT false;
