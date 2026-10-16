# Instruções para Claude

## Protocolo obrigatório antes de qualquer ação

Este projeto opera com trabalho paralelo entre agentes (Claude e Codex).

**Antes de implementar, refatorar ou analisar qualquer coisa**, execute este ciclo:

1. Leia `docs/ai-handoff.md` inteiro — especialmente a Tabela Diaria de Controle e a seção "Em andamento"
2. Leia `docs/mapa-do-sistema.md`
3. Rode `git status --short` e `git diff --name-only`
4. Atualize a Tabela Diaria de Controle e a seção "Em andamento" com seu nome, objetivo e arquivos em posse
5. Verifique se algum arquivo que você pretende editar já está em posse de outro agente

**Ao finalizar qualquer rodada**, atualize `docs/ai-handoff.md`:
- Registre a rodada em "Registro de Rodadas"
- Atualize a Tabela Diaria de Controle
- Marque pareceres pendentes

Não reverter mudanças feitas por outro agente sem ler o diff e registrar a decisão no handoff.
