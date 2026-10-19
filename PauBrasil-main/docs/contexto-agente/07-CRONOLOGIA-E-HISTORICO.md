# Cronologia completa desta conversa e leitura do histórico

## 1. Falha ao executar o projeto

O usuário informou erro em `npm run dev`. A raiz aberta era `/home/henrique/Documentos/PauBrasil-main`, enquanto o `package.json` estava na pasta interna homônima. O erro reproduzido era ENOENT. O comando foi executado na pasta correta, o Next iniciou em `localhost:3000` e GET `/` retornou 200. Não foi preciso corrigir código para esse problema.

## 2. Primeiro administrador local

O usuário forneceu e-mail Gmail e senha e pediu administrador. A implementação usa `User`, `passwordHash` bcrypt e papel `SYS_ADMIN`. O PostgreSQL local estava parado; foi iniciado por `.local-dev/postgres.sh start`. A conta foi gravada e a comparação do hash passou. Essa validação inicial não demonstrava que o domínio Gmail era aceito pelo formulário/servidor.

## 3. Conta corporativa e correção do domínio

O usuário pediu também acesso de colaborador e administrador com domínio do grupo. Foi inicialmente interpretado como `.com`, mas o código exige `.com.br`. Ao testar o fluxo real durante a limpeza do portal, a conta corporativa local foi corrigida para `henriquediniz.dev@grupopaubrasil.com.br`. A senha foi mantida. O perfil é `SYS_ADMIN` com nível `COLABORADOR`; os dois campos não são mutuamente exclusivos.

Não documentar nem reproduzir a senha fornecida. O primeiro cadastro Gmail ficou como histórico local e não é o login corporativo validado em produção.

## 4. Simplificação do portal

Pedido: retirar atividades, carteira, conquistas, ranking e recursos relacionados. Foi alterado o início, shell desktop/mobile, perfil, ajuda, rótulo do login e cadastro de funções; referências antigas passaram a redirecionar. A função-only UI foi compartilhada entre Empresa/Admin. Dados e backend legado foram preservados. Detalhes das funcionalidades retiradas não são repetidos neste pacote por pedido do usuário.

Validações: TypeScript, lint, 10 testes de middleware e smoke local com login, desktop/mobile, perfil, redirecionamento e funções. Durante a remoção do cliente antigo, o dev precisou reiniciar por referência de cache a arquivo apagado. A correção do domínio do login também ocorreu nessa etapa.

## 5. Falha no push

O usuário perguntou pelo erro e informou o repositório. `git push --dry-run` reproduziu ausência de credenciais HTTPS. Não havia GitHub CLI nem chave SSH disponível. Foi instalada a CLI oficial do GitHub, preparado o commit e iniciado login por dispositivo. O usuário autorizou; depois `gh auth setup-git` e `git push origin main` concluíram.

Commit **`834fdda`**: `refactor: remove gamification from collaborator portal`.

## 6. Investigação da falha de deploy

O usuário trouxe o deploy da Vercel. O status no GitHub confirmava falha, sem causa. A página não pôde ser lida pela ferramenta web e não havia browser conectado acessível pela ferramenta de UI. O usuário forneceu os logs e a Vercel CLI posteriormente conseguiu acesso autenticado.

Causa confirmada: `DATABASE_URL` ausente durante pré-renderização de `/universidade-pb` e `/api/public/empresas`. A inspeção mostrou Root Directory correto e nenhuma variável configurada naquele momento. O usuário confirmou que ainda não tinha banco de produção.

Uma build local isolada também encontrou erro de font loader, independente do erro real da Vercel. Isso não foi apresentado como causa do deploy remoto.

## 7. Correção local ainda incompleta

As duas rotas foram alteradas para runtime (`force-dynamic`) e TypeScript/lint passaram. A resposta esclareceu que ainda faltavam banco, variáveis, envio e nova publicação. O usuário questionou se havia só relatório; foi informado explicitamente que a entrega era parcial.

Esse episódio é importante para o próximo agente: não encerrar como resolvido quando a tarefa operacional ainda depende de passos que o usuário já autorizou executar.

## 8. Autorização para concluir Vercel e banco

O usuário autorizou avançar. Foi inspecionado o Marketplace da Vercel: Neon oferecia plano gratuito. O usuário recebeu o link de aceitação dos termos e confirmou que aceitou.

Enquanto isso:

- NEXTAUTH_SECRET e CRON_SECRET foram gerados e salvos na Vercel.
- NEXTAUTH_URL foi inicialmente associado a um alias, depois corrigido para o domínio canônico retornado pela API: `https://pau-brasil-development.vercel.app`.
- O histórico de migrações foi aplicado em schema local isolado.
- O diff revelou estruturas esperadas pelo código que faltavam nas migrações.
- Foi criada a migração aditiva `20261019000000_complete_portal_schema`.

Ao retomar a instalação, o Neon que o usuário havia conectado (`neon-rose-compass`) já fornecia DATABASE_URL. Um recurso extra criado pela CLI não pôde ser conectado por conflito de variáveis; foi confirmado sem projetos e removido. O banco já conectado foi usado.

## 9. Banco e administrador de produção

As 23 migrações foram aplicadas ao Neon via conexão direta. Foram consultados os 48 modelos Prisma sem erros de schema. A conta corporativa correta foi criada com o hash já existente localmente e perfil SYS_ADMIN. Não foi rodado seed completo nem importada a base local.

O README ganhou instruções de produção. As duas rotas públicas e a migração foram commitadas e enviadas.

Commit **`f77afba`**: `fix: prepare production database and runtime public routes`.

## 10. Deploy e verificação final

A Vercel compilou o commit novo, passou lint/tipos, gerou as páginas e terminou Ready. O domínio canônico e aliases foram associados. O GitHub registrou success/Deployment has completed.

No domínio público foram testados:

- Home, login, Universidade pública e empresas públicas: HTTP 200.
- CSRF, callback de credenciais e sessão NextAuth: e-mail correto e papel SYS_ADMIN.
- Início, perfil, admin, usuários, Universidade interna, Gente e notificações: HTTP 200 autenticado.
- `/app/ranking`: 307 para `/app/inicio`.

Arquivos temporários com ambiente de produção foram removidos. A branch estava sincronizada com `origin/main`. O usuário recebeu a URL pública e a confirmação do login.

## 11. Pedido atual: transferência de contexto

O usuário pediu arquivos Markdown detalhados com todo o contexto para criar outro agente, dando pouco espaço às partes já retiradas. Esta pasta atende a esse pedido. A documentação inclui inventário real do código, distinção entre estado validado e pendência, operação do ambiente e um prompt inicial.

## Histórico anterior a esta conversa

Os documentos abaixo permanecem no repositório. Eles são fontes históricas, não garantias do estado do novo Neon:

| Documento | Como usar |
| --- | --- |
| `docs/ai-handoff.md` | Registro extenso de rodadas desde março; decisões de RH, permissões, importações, Frontline e UI. Há entradas superadas. |
| `docs/mapa-do-sistema.md` | Mapa antigo; contagens e módulos não refletem integralmente o estado atual. Preferir inventário desta pasta. |
| `docs/hub-institucional.md` | Contexto de marca, empresas editoriais, acervo e encaminhamento entre empresas. Ainda relevante. |
| `docs/portal-colaborador.md` | Versão de 16/10; partes de atividades/pontos foram superadas em 19/10. |
| `docs/plano-integracao-recrutamento.md` | Direção e regras para construir Gente nativamente; não copiar PII/credenciais do projeto externo. |
| `docs/auditoria-2026-09-22.md` | Auditoria de uma base/estado anterior; revalidar cada achado antes de corrigir ou afirmar que persiste. |
| `docs/visitas-lideres-guia.html` | Guia funcional de visitas; conferir API/código atual e integrações reais. |
| Guias HTML de OBZ | Referência histórica de módulo legado, não roteiro de reativação. |

O histórico registra decisões sobre importações com sobreposição por entidade, cargos/descritivos, Frontline, quadro, PCD/aprendiz, sucessão, filtros por polo e retenção de CV. Antes de alterar esses domínios, ler a seção relevante e o código correspondente. Números de candidaturas/colaboradores citados nesses registros são de contextos antigos, não do banco recém-provisionado nesta sessão.
