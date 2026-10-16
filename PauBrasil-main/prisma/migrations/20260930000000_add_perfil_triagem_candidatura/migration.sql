-- Perfil de triagem do candidato: genero, data de nascimento e escolaridade.
--
-- Pedido do RH: triar o Banco de Talentos sem abrir o curriculo de cada pessoa.
-- Ate aqui o unico recorte era "vaga exclusiva PCD / Mulheres", gravado como
-- prefixo dentro da mensagem livre.
--
-- As tres colunas sao anulaveis: nenhuma candidatura existente e alterada, e
-- as antigas (e os CVs importados pelo RH) seguem validas sem elas. O RH pode
-- preencher depois pela ficha da candidatura.
--
-- Genero e escolaridade sao texto validado no codigo, nao enum: a lista pode
-- ganhar opcao sem nova migration. A idade nao e gravada — a data de
-- nascimento e, como DATE, e a idade e calculada na hora.
ALTER TABLE "Candidatura" ADD COLUMN "genero" TEXT;
ALTER TABLE "Candidatura" ADD COLUMN "dataNascimento" DATE;
ALTER TABLE "Candidatura" ADD COLUMN "escolaridade" TEXT;
