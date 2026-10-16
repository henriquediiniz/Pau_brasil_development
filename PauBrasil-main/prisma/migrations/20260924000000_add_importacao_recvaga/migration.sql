-- Marca cada vaga com o lote da importacao que a criou.
--
-- O RH importou uma planilha com uma coluna errada e pediu para "excluir todos
-- que foram importados, de uma vez". Sem o lote, a unica saida seria apagar por
-- filtro e torcer para nao levar junto vaga cadastrada a mao ou de uma
-- importacao anterior.
--
-- Nulo nas vagas criadas pela tela. Coluna anulavel, nenhum registro alterado.
ALTER TABLE "RecVaga" ADD COLUMN "importacaoId" TEXT;

-- A consulta de desfazer filtra so por esta coluna.
CREATE INDEX "RecVaga_importacaoId_idx" ON "RecVaga"("importacaoId");
