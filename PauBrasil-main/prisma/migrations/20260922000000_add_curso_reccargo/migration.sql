-- Descritivo de cargo: separa "qual curso" de "qual nível" e "qual situação".
--
-- A planilha de descrição de cargo do RH tem três colunas distintas:
--   Formação  -> nível     (Ensino Superior)
--   Status    -> situação  (Formado / Cursando)
--   Curso     -> qual curso (técnico em Segurança do Trabalho, ...)
--
-- O schema tinha `formacao` e `statusCurso`, mas nao tinha onde guardar o
-- terceiro. Coluna nova, anulavel: nenhum registro existente e afetado.
ALTER TABLE "RecCargo" ADD COLUMN "curso" TEXT;
