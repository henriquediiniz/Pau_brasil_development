-- Matricula, CPF e data de admissao no quadro de pessoal (QLP).
--
-- Pedido do RH: a planilha modelo precisa levar esses tres campos.
--
-- A matricula e o unico identificador estavel que a planilha tem. Ate aqui a
-- importacao reconhecia a pessoa por nome + operacao, o que erra nos dois
-- sentidos: o nome muda (casamento, grafia) e homonimo existe. Com a matricula
-- preenchida, e ela que diz se duas linhas sao a mesma pessoa.
--
-- O CPF e dado pessoal. Guardado so com digitos, nao sai inteiro em listagem
-- para quem nao tem permissao de dado sensivel, e a leitura do cadastro
-- individual e auditada.
--
-- As tres colunas sao anulaveis: nenhum registro existente e alterado, e o
-- quadro ja importado continua valido sem elas.
ALTER TABLE "QuadroColaborador" ADD COLUMN "matricula" TEXT;
ALTER TABLE "QuadroColaborador" ADD COLUMN "cpf" TEXT;
ALTER TABLE "QuadroColaborador" ADD COLUMN "dataAdmissao" TIMESTAMP(3);

-- Busca por matricula dentro da empresa, que e como o RH procura.
CREATE INDEX "QuadroColaborador_empresaId_matricula_idx" ON "QuadroColaborador"("empresaId", "matricula");
