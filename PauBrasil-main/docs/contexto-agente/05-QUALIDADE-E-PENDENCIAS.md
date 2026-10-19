# Qualidade, evidências e próximos trabalhos

## O que foi realmente validado nesta conversa

| Verificação | Resultado | Limite |
| --- | --- | --- |
| `npm run dev` na pasta correta | Servidor Ready, home HTTP 200 | Não era build de produção |
| Criação do administrador local | Role/ativo/hash verificados | Primeiro e-mail Gmail não atendia ao domínio do login |
| Retirada da gamificação | TypeScript e lint dos arquivos alterados passaram | Não foi remoção física integral do backend |
| Middleware e permissões | 10 testes em `tests/middleware-access.test.ts` passaram | Não equivale à suíte inteira |
| Navegação local | Login admin, início desktop/mobile, perfil e cadastro de funções verificados | Script de smoke foi ad hoc, não está como suíte permanente |
| Migrações | 23 aplicadas no schema local isolado e no Neon | Não houve teste completo de rollback/restauração |
| Compatibilidade Prisma | 48 modelos consultados em produção | Verificação de leitura/schema, não todos os CRUDs |
| Build remoto | Vercel Ready no commit f77afba | Serviços opcionais ainda precisam de configuração |
| Status GitHub | success / Deployment has completed | Referência ao commit validado |
| Smoke público | `/`, `/login`, `/universidade-pb`, `/api/public/empresas`: HTTP 200 | Não enviou candidatura nem upload |
| Login de produção | Sessão com e-mail corporativo e `SYS_ADMIN` confirmada | Não testou todos os papéis ou 2FA real |
| Smoke autenticado | Início, perfil, admin, usuários, Universidade, Gente e notificações: HTTP 200 | Não cobre toda interação cliente ou escrita |
| Compatibilidade de link antigo | `/app/ranking` → 307 para `/app/inicio` | Verificação pontual somada aos testes do helper |

Não afirmar que `npm test`, todas as suítes de integração, todos os E2E ou cobertura completa passaram nesta rodada. Não foram executados integralmente.

## Backlog observado — ainda não corrigido nesta rodada de documentação

### P1 — Recuperação completa de dados

`src/lib/backup-export.ts` não inclui no `EXPORT_ORDER` os 14 modelos de Gente/Quadro:

`RecVaga`, `RecCargo`, `RecCandidato`, `RecCandidatoEtapa`, `RecCandidatoInterno`, `RecSucessao`, `QuadroColaborador`, `QuadroDesligamento`, `QuadroPcd`, `QuadroPcdMeta`, `QuadroFrontlineCargo`, `QuadroFrontlineMes`, `QuadroFrontlineTeto`, `QuadroAprendiz`.

Ações propostas: alinhar export/import e ordem de FKs; testar round-trip em banco isolado; validar storage privado e retenção. Não anunciar backup integral antes disso.

### P1 — Isolamento dos ambientes Vercel

As variáveis da integração Neon apareceram em Development, Preview e Production. Não foi verificado se apontam para bancos/branches distintos. Conferir antes de permitir testes mutantes, imports ou migrações em preview.

### P1 — Revogação de usuário nas APIs

O helper `getEffectiveSessionUser()` relê o banco, mas usa fallback da sessão para alguns campos se o registro não é encontrado. Investigar explicitamente o comportamento de conta removida, sessão revogada e APIs com flags não selecionadas. A leitura do helper não comprova um exploit; é uma hipótese técnica a testar com casos negativos.

### P1 — Visitas no domínio público

`next.config.js` envia `Permissions-Policy: camera=(), microphone=(), geolocation=()` globalmente. Isso pode impedir câmera/GPS necessários para visitas. Verificar em browser/dispositivo real e ajustar a política apenas para o comportamento necessário, mantendo restrições coerentes. O smoke de produção desta sessão não validou câmera, geolocalização ou reconhecimento facial.

### P1 — Configurar integrações usadas de fato

Resend, Cloudinary, Vercel Blob, Upstash e Web Push não foram provisionados/validados nesta entrega. Priorizar conforme o fluxo que o usuário for usar (cadastro/convite, currículo, laudo, foto/check-in, backup). Não supor sucesso de envio de e-mail quando o helper retorna silenciosamente sem chave.

### P2 — Atualizar PWA e referências residuais

`public/manifest.json` ainda contém start_url/id `/app/hoje`, atalhos de checklist/ranking e a cor antiga verde. A navegação instalada continua dependente de redirects. Atualizar manifest e avaliar o efeito de mudar o `id` sobre instalações existentes; revisar worker/cache e demais links residuais. Não reativar recursos para satisfazer atalhos antigos.

### P2 — Atualizar suítes E2E

`tests/e2e/portal-colaborador.spec.ts` mantém expectativas anteriores da área de atividades/pontos. `login-flow.spec.ts` depende de conta de seed e espera conteúdo antigo em alguns pontos. Revisar para a experiência atual antes de usar a suíte inteira como gate. Manter bloqueio de fixtures ao banco local.

### P2 — CI na raiz correta

O workflow está em `PauBrasil-main/.github/workflows/tests.yml`, mas a raiz Git é um nível acima. GitHub Actions descobre workflows em `.github/workflows` na raiz do repositório; portanto esse arquivo interno não é, por si só, evidência de CI ativo. Se for ativar CI, mover/adaptar workflow e configurar working-directory/cache paths para a aplicação interna. Não afirmar que os checks do GitHub já cobrem os testes do projeto.

### P2 — Cron e código legado

O daily-reminder e referências remanescentes de ajuda/admin/cache precisam ser revistos contra os módulos retirados. Existem referências antigas a OBZ em documentação e links; constatar o destino antes de expor atalhos. A retirada de UI não desabilitou globalmente todos os endpoints legados. Decidir descomissionamento com análise de consumidores, dados e autorização.

### P2 — Documentos e estado histórico

Tabelas antigas de posse/estado mencionam trabalho de vários agentes e dados de outras rodadas. Foram adicionados avisos de atualização, não apagado o histórico. Revisar o pacote atual ao finalizar cada tarefa; não deixar novos resultados apenas no chat.

### P2 — Migrações e schema físico

Há estruturas legadas no banco resultantes do baseline e fora do schema atual. Isso foi preservado deliberadamente. Planejar eventual limpeza em tarefa separada com backup e avaliação de dependências. Não executar o diff destrutivo automaticamente.

### P3 — Conteúdo e operação de negócio

- Cadastrar dados reais aprovados de empresas, operações, funções e cursos na base nova.
- Completar acervo, datas, fotos e contatos institucionais.
- Definir candidatura/encaminhamento entre empresas antes de prometer automação.
- Validar fluxos reais de RH com usuários e permissões representativas.
- Reavaliar warnings de dependências, Sentry e uso de `<img>` em tarefas próprias; warnings não foram a causa do deploy original.

## Como validar mudanças novas

### Mudança em UI

TypeScript + lint dos arquivos alterados, navegação no tamanho relevante, foco/teclado, estados vazios/erro/loading e ausência de links para recursos retirados. Validar pelo menos desktop e mobile quando muda o shell.

### Mudança em autorização

Casos positivos e negativos por role/nivel/flag, usuário inativo, sessão antiga, usuário removido, escopo vazio e acesso direto à API. Não testar somente a visibilidade do menu.

### Mudança de dados

Migração em banco isolado, esquema inicial e upgrade quando relevante, constraints/FKs/índices, transações, duplicação/importação e reversibilidade operacional. Confirmar ambiente antes do comando.

### Mudança em deploy

Build remoto, estado Ready, domínio canônico, consultas reais ao banco e login. HTTP 200 sozinho não é evidência de um formulário, upload ou fluxo financeiro funcional.

## Comandos úteis

Executar dentro da aplicação:

```bash
npx tsc --noEmit
npm run lint
node --import tsx --test tests/middleware-access.test.ts
node --import tsx --test tests/auth-helpers.test.ts
npx playwright test tests/e2e/hub.spec.ts
```

O teste E2E de portal com banco exige opt-in `PORTAL_E2E_DB=1` e verifica explicitamente `127.0.0.1:55432/paub_portal_dev`. Atualizar suas expectativas antes de tratá-lo como teste da versão sem gamificação. Não trocar a trava para aceitar produção.

## Definição prática de pronto

Uma tarefa só está pronta quando o comportamento solicitado está implementado, validado no nível apropriado e os limites são explicitados. Se o pedido inclui publicação, commit/push/build/publicação/login são etapas distintas. Registrar o commit e a URL de deploy quando existirem. Não confundir um relatório de causa com correção aplicada.
