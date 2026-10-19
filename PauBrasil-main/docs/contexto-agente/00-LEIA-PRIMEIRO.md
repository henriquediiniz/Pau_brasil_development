# Contexto do novo agente — Pau Brasil

Data de referência: **19/10/2026**, America/Fortaleza. Base funcional: commit **`f77afba`**, já publicado. Esta documentação foi criada depois desse commit; não confundir o commit-base com o commit futuro dos documentos.

## Objetivo desta passagem

Dar ao próximo agente o contexto de produto, arquitetura, decisões, operação e pendências necessário para continuar desenvolvendo o portal. O usuário pediu contexto máximo e pediu que funcionalidades retiradas fossem apenas resumidas. Por isso, o conteúdo ativo e as condições de produção recebem mais detalhe que o legado.

Este pacote distingue:

- **Confirmado nesta sessão:** alteração, comando ou validação efetivamente realizada em 19/10/2026.
- **Constatado no código:** leitura de implementação; não significa que todo o fluxo foi testado em produção.
- **Histórico:** informação dos documentos antigos, sem reconfirmação integral nesta sessão.
- **Pendente:** trabalho ainda não executado ou recurso ainda não validado.

## Estado que o agente deve entender antes de tocar no código

1. O portal está publicado e o deploy terminou em **Ready**, não está mais bloqueado por `DATABASE_URL`.
2. A URL canônica é **https://pau-brasil-development.vercel.app**.
3. O banco de produção é um PostgreSQL Neon, separado do PostgreSQL local.
4. Foram aplicadas **23 migrações** em produção e consultados **48 modelos Prisma**, sem erro de schema.
5. O login corporativo de Henrique foi validado em produção como `SYS_ADMIN`.
6. O portal do colaborador agora é um ponto de acesso a serviços; a gamificação saiu da experiência de navegação.
7. A retirada da interface não eliminou todas as APIs, serviços, páginas e tabelas legadas. Não restaurar atalhos por encontrar esses arquivos.
8. A base de produção foi criada nesta sessão. Não houve importação integral dos dados locais, de outro sistema ou de uma base histórica da empresa.
9. O agente deve continuar o produto existente em Next.js/Prisma, preservando identidade, autorização e isolamento por empresa/operação.
10. Esta rodada é de documentação: não houve nova mudança funcional nem nova publicação causada por estes documentos.

## Ordem recomendada de leitura

| Documento | Conteúdo |
| --- | --- |
| [01 — Produto e decisões](01-PRODUTO-E-DECISOES.md) | Direção, módulos atuais, marca, regras e resumo das remoções |
| [02 — Arquitetura e desenvolvimento](02-ARQUITETURA-E-DESENVOLVIMENTO.md) | Camadas, autenticação, navegação, bibliotecas e ambiente local |
| [03 — Banco e ambientes](03-BANCO-E-AMBIENTES.md) | Dados, migrações, Neon, contas, variáveis e integrações |
| [04 — Git, deploy e operação](04-GIT-DEPLOY-E-OPERACAO.md) | Histórico desta sessão, Vercel, publicação e troubleshooting |
| [05 — Qualidade e pendências](05-QUALIDADE-E-PENDENCIAS.md) | Evidências, limites da validação e backlog técnico |
| [06 — Inventário técnico](06-INVENTARIO-TECNICO.md) | Páginas, APIs, modelos, enums, scripts e testes presentes |
| [07 — Cronologia e histórico](07-CRONOLOGIA-E-HISTORICO.md) | Tudo o que ocorreu nesta conversa e como usar os documentos antigos |
| [08 — Prompt de transferência](08-PROMPT-PARA-NOVO-AGENTE.md) | Texto pronto para iniciar o próximo agente |

Para enviar um único arquivo ao agente, use [CONTEXTO-COMPLETO.md](CONTEXTO-COMPLETO.md). Ele reúne os documentos numerados desta pasta. Para navegar no repositório, os arquivos separados são mais práticos.

## Identificadores operacionais

| Item | Referência |
| --- | --- |
| Repositório | https://github.com/henriquediiniz/Pau_brasil_development |
| Branch publicada | `main` |
| Raiz Git local | `/home/henrique/Documentos/PauBrasil-main` |
| Raiz real da aplicação | `/home/henrique/Documentos/PauBrasil-main/PauBrasil-main` |
| Vercel team/scope | `henrique-dev2` |
| Projeto Vercel | `pau-brasil-development` |
| Project ID | `prj_xdQq9m4sFuGm5lIbKFwhUm98Ddfn` |
| Deploy validado | https://vercel.com/henrique-dev2/pau-brasil-development/2Q7oWPvUTqAtRus6Gdsb6g14vi7X |
| Commit publicado | `f77afba` |
| Node usado na Vercel | `24.x` |
| Domínio de e-mail aceito | `grupopaubrasil.com.br` |

Os identificadores são referências, não credenciais. As senhas, hashes e tokens não fazem parte destes arquivos.

## Como resolver divergências

- Uma instrução nova do usuário prevalece sobre decisões antigas de produto.
- Para fatos técnicos, confira o código atual, as migrações e o estado real do ambiente.
- Para o estado entregue em 19/10/2026, use este pacote e os commits `834fdda`/`f77afba`.
- `docs/ai-handoff.md` e `docs/mapa-do-sistema.md` contêm histórico importante, mas também descrições superadas de gamificação, OBZ e Score.
- Contagens, registros de candidatos e afirmações antigas de “produção” não devem ser atribuídos ao novo banco Neon sem consulta explícita.
- Status antigos de “em andamento” ou posse de arquivos não comprovam que outro agente ainda está ativo. Verifique `git status`, diffs e a colaboração real.
