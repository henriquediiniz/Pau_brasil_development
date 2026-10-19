# Orientação para agentes — Pau Brasil

## Comece pelo contexto atual

Leia `PauBrasil-main/docs/contexto-agente/00-LEIA-PRIMEIRO.md` e os documentos do domínio da tarefa. O pacote completo para transferência está em `PauBrasil-main/docs/contexto-agente/CONTEXTO-COMPLETO.md`.

- A aplicação e o `package.json` estão na subpasta `PauBrasil-main`, não na raiz Git.
- Confira `git status --short --branch` e os diffs antes de editar; preserve alterações de terceiros.
- A base funcional documentada é `f77afba`, publicada em 19/10/2026. Revalide o estado real em sessões futuras.
- Atividades/carteira/conquistas/ranking saíram do portal. Não reativar por causa de arquivos legados ou documentação histórica.
- Local, Preview e Produção são ambientes diferentes. Não executar seeds/testes destrutivos/migrações sem conferir o alvo.
- Use os helpers de autorização e escopo no servidor; esconder menu não protege API.
- Não colocar senhas, tokens, hashes ou exports com dados pessoais em documentação/Git.
- Documentos antigos em `PauBrasil-main/docs/` contêm decisões úteis e também informações superadas. Não tratar antigas posses de arquivo como prova de agentes ativos.
- Atualize o contexto ao concluir mudanças relevantes, diferenciando implementação, testes executados, push e publicação.

Este arquivo orienta o trabalho; não autoriza novas exclusões de dados, concessões de acesso ou publicações fora do pedido do usuário.
