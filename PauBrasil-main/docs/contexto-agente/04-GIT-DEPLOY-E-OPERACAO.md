# Git, deploy e operação

## Referências da publicação validada

- Repositório: https://github.com/henriquediiniz/Pau_brasil_development
- Branch: `main`.
- Commit de retirada da gamificação: `834fdda`.
- Commit de preparo de produção: `f77afba`.
- Team Vercel: `henrique-dev2`.
- Projeto: `pau-brasil-development`.
- Project ID: `prj_xdQq9m4sFuGm5lIbKFwhUm98Ddfn`.
- Root Directory: **`PauBrasil-main`**.
- Framework: Next.js; build: `npm run build`; Node: 24.x; região observada: iad1.
- Domínio canônico: https://pau-brasil-development.vercel.app
- Aliases observados: `pau-brasil-development-henrique-dev2.vercel.app` e `pau-brasil-development-git-main-henrique-dev2.vercel.app`.
- URL imutável da versão validada: https://pau-brasil-development-m1pqc32ft-henrique-dev2.vercel.app
- Dashboard do deploy validado: https://vercel.com/henrique-dev2/pau-brasil-development/2Q7oWPvUTqAtRus6Gdsb6g14vi7X

## Problema de push e solução

O remoto já apontava para o repositório correto. O erro reproduzido foi `could not read Username for https://github.com`: o ambiente não tinha credenciais HTTPS disponíveis. Também havia alterações sem commit.

Foi instalada a CLI oficial do GitHub em `/home/henrique/.local/bin/gh`, o usuário completou login por dispositivo e `gh auth setup-git` configurou o helper. A conta autenticada era `henriquediiniz`. O commit `834fdda` foi enviado e, depois, `f77afba` também.

A autenticação é estado da máquina/conta, não parte do repositório. Num ambiente novo, verificar `gh auth status`; não copiar tokens dos arquivos de configuração para os documentos.

## Causa exata do deploy quebrado

Deploy original informado pelo usuário:
https://vercel.com/henrique-dev2/pau-brasil-development/GYoKqzRdWQaKWoGY6HkJomPFxD6n

A instalação e compilação avançavam, mas a pré-renderização executava consultas Prisma sem `DATABASE_URL`. Os caminhos bloqueantes eram:

- `/api/public/empresas`
- `/universidade-pb`

A mensagem final `Command npm run build exited with 1` era apenas o resultado; o erro causal era `Environment variable not found: DATABASE_URL`.

O Root Directory estava correto. Não era necessário mover a aplicação, alterar o framework ou reinstalar o projeto da Vercel.

## Correção efetivamente publicada

1. `src/app/universidade-pb/page.tsx`: substituiu `revalidate = 3600` por `dynamic = 'force-dynamic'`; banco consultado em runtime; comentário da amostragem atualizado.
2. `src/app/api/public/empresas/route.ts`: também force-dynamic; cabeçalho HTTP de cache público existente foi mantido.
3. Migração aditiva `20261019000000_complete_portal_schema` completa estruturas ausentes no histórico.
4. README documenta configuração de produção e procedimento de migração.
5. Neon conectado e 23 migrações aplicadas.
6. Segredos de autenticação/cron e URL canônica configurados.
7. Administrador de produção criado sem rodar seed completo.
8. Commit/push `f77afba` disparou o deploy Git da Vercel.
9. Vercel retornou Ready e o status do commit no GitHub retornou success/Deployment has completed.
10. Fluxos HTTP autenticados foram testados na URL pública.

## Procedimento para uma próxima publicação

### Antes de enviar

```bash
# na raiz Git
git status --short --branch
git diff --check

# na aplicação
cd PauBrasil-main
npx tsc --noEmit
# executar lint e testes relevantes ao domínio alterado
```

Se houver mudança de schema, criar/revisar migração e validar em banco isolado. Aplicar a migração ao ambiente correto antes de publicar código que dependa dos novos campos. Não adicionar migração automática indiscriminada a toda build de preview apontando para produção.

### Envio e acompanhamento

```bash
# na raiz Git: adicionar apenas arquivos da tarefa, revisar diff e criar commit
git push origin main

npx vercel ls pau-brasil-development --scope henrique-dev2
npx vercel inspect URL_DO_DEPLOY --logs --scope henrique-dev2
npx vercel inspect URL_DO_DEPLOY --wait --timeout 10m --scope henrique-dev2
```

O último comando pode demorar; se estiver interagindo com o usuário, iniciar como processo acompanhável e dar atualizações breves. Não afirmar sucesso durante Building.

### Validação depois de Ready

- GET `/`, `/login`, `/universidade-pb`, `/api/public/empresas`: esperar HTTP 200 e conteúdo coerente.
- Login por formulário/NextAuth com conta autorizada; verificar sessão e papel.
- GET autenticado `/app/inicio`, `/app/perfil`, `/admin`, `/admin/usuarios`, `/universidade`, `/gente`, `/api/notifications` conforme o papel testado.
- Link retirado, por exemplo `/app/ranking`, redireciona para `/app/inicio`.
- Verificar falhas de API e estado vazio; HTTP 200 de uma página não prova que todos os fetches do cliente funcionam.
- Fluxos de escrita, upload e dados sensíveis exigem validação específica e controle das fixtures.

## Diagnóstico rápido

| Sintoma | O que conferir |
| --- | --- |
| npm ENOENT/package.json | Diretório interno da aplicação |
| Prisma não conecta local | Script PostgreSQL, host 127.0.0.1, porta 55432, ambiente carregado |
| Git não lê Username | `gh auth status`, helper HTTPS e remoto |
| Build exited with 1 | Primeira causa nos logs, não só a última linha |
| DATABASE_URL ausente | Variável no target correto da Vercel e novo deploy após salvar |
| P2021/P2022 ou tabela/coluna ausente | Histórico de migrações aplicado ao banco realmente usado |
| Login rejeita e-mail | Domínio literal `grupopaubrasil.com.br`, conta ativa e hash |
| Login local funciona, produção não | Banco distinto, conta existe no Neon, NEXTAUTH_SECRET/URL e cookies HTTPS |
| Secrets aparecem `[SENSITIVE]` | Pull não revela valor; não usar marcador como segredo |
| Curso/catálogo vazio | Novo banco sem conteúdo; não inventar cursos para mascarar ausência |
| Menu antigo no app instalado | Manifest/service worker/cache; há pendência conhecida de atalhos PWA |
| Visita sem câmera/GPS | Permissões do browser e `Permissions-Policy` global; pendência conhecida |

## Observação sobre build local

Uma tentativa de build de produção isolada na máquina encontrou erro no loader de `next/font/google` (`Cannot read properties of null (reading '1')`). Esse erro local não foi a causa do deploy original e não impediu o build real validado na Vercel. Não marcar o build local completo como aprovado nesta sessão; TypeScript/lint e o build remoto tiveram evidência separada.

## Credenciais e ferramentas da sessão

- Vercel CLI foi utilizada via `npx`, versão observada 64.5.0.
- A autenticação Vercel foi concluída e reutilizada para inspeção, variáveis, integração e deploy.
- Diretório temporário vinculado: `/tmp/paub-vercel-ops`; não é parte do projeto nem requisito portátil.
- Arquivos temporários `.env.local`/`.env.production.local` desse diretório foram removidos ao final.
- Códigos de login por dispositivo são temporários e não estão documentados.
- Não depender de processos, paths em `/tmp` ou sessões de ferramenta de uma conversa anterior.
