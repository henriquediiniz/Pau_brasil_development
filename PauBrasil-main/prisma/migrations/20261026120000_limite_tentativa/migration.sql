-- Contador de tentativas por chave e janela (login, cadastro, upload de CV, contato...).
-- Substitui os limites em memória, que não valem em serverless. Aditiva.
CREATE TABLE "LimiteTentativa" (
    "chave" TEXT NOT NULL,
    "janela" TIMESTAMP(3) NOT NULL,
    "contagem" INTEGER NOT NULL DEFAULT 1,
    "expiraEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LimiteTentativa_pkey" PRIMARY KEY ("chave","janela")
);

CREATE INDEX "LimiteTentativa_expiraEm_idx" ON "LimiteTentativa"("expiraEm");
