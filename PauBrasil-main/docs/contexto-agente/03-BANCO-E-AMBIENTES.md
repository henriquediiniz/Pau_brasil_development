# Banco de dados, ambientes e integrações

## Separação entre local e produção

| Ambiente | Estado confirmado |
| --- | --- |
| Desenvolvimento local | PostgreSQL 16 em `127.0.0.1:55432`, banco `paub_portal_dev`; arquivo `.env.development.local` ignorado |
| Teste de migrações desta sessão | Schema local isolado `deployment_check_20261019`, usado para aplicar o histórico antes de produção |
| Produção | Neon PostgreSQL, banco `neondb`, conexão TLS; integrado à Vercel |
| Preview/Development Vercel | A integração adicionou variáveis nesses alvos também; isolamento efetivo de branches/bancos não foi auditado |

Não apontar desenvolvimento ou testes destrutivos para produção. Antes de executar Prisma, verificar host, banco, schema e ambiente sem imprimir senha/token.

## Provisionamento de produção realizado

- Integração Neon instalada após o usuário aceitar os termos do Marketplace.
- O recurso conectado ao projeto é **`neon-rose-compass`**.
- A região observada da conexão é AWS US East 1, próxima da região `iad1` do deploy.
- Durante a retomada, a CLI criou um recurso adicional chamado `paubrasil-production`; a conexão foi recusada porque o projeto já tinha variáveis do Neon conectado pelo usuário. O recurso adicional, vazio e sem projetos, foi removido. Não tentar recuperar/reconectar esse recurso descartado.
- Foram aplicadas 23 migrações com conexão direta (`DATABASE_URL_UNPOOLED` como `DATABASE_URL` apenas no processo de migração).
- A aplicação usa a conexão normal fornecida pela integração em `DATABASE_URL`.
- A string de conexão não está registrada nos documentos.

## Histórico de migrações e diferença para o schema

O repositório tinha 22 migrações. O teste em um schema local novo mostrou que o schema Prisma atual esperava estruturas que não estavam no histórico:

- Enum `RegistrationStatus`.
- Tabela `PendingRegistration`, seus índices e FKs para Empresa/Function.
- Campos `ip`, `requestId`, `userAgent` em `AuditLog`.
- Índices de FeedEvent, PointsLedger, RedemptionOrder e TaskInstance.

Foi criada a migração **`20261019000000_complete_portal_schema`** e aplicada localmente e em produção. Ela é aditiva; não remove tabelas legadas de OBZ/Score nem colunas antigas.

A comparação automática do banco histórico com o schema também sugeria DROP de estruturas antigas e alterações de índices. Essa saída não foi aplicada integralmente. Preservar dados legados foi deliberado. Portanto:

- 23 migrações aplicadas não significam que o schema físico não tenha tabelas extras.
- Um `prisma migrate diff` pode continuar reportando legado físico que não aparece no Prisma atual.
- Não aplicar automaticamente um diff destrutivo só para “zerar drift”.
- Não usar `prisma db push --accept-data-loss` como procedimento normal de produção.

## Validação do banco

Depois das migrações, todos os 48 delegates/modelos Prisma foram consultados com `findFirst()` e não houve erro de tabela/coluna inexistente. Também foram verificadas as consultas de usuário, auditoria, cadastro pendente e Universidade.

Isso valida compatibilidade básica entre client e schema. Não comprova todas as regras de escrita, concorrência, importação ou restauração.

## Dados iniciais e contas

- Conta ativa de produção: **`henriquediniz.dev@grupopaubrasil.com.br`**.
- Nome: Henrique Diniz; `role: SYS_ADMIN`; `nivel: COLABORADOR`; `isActive: true`.
- O nível COLABORADOR não remove a permissão global de SYS_ADMIN; papel e nível são dimensões distintas.
- O hash bcrypt da conta local correta foi usado para criar a conta de produção; não houve transferência da senha em texto para arquivos versionados.
- A senha é a definida pelo usuário nesta conversa e não está documentada. Solicitar ao responsável por canal adequado se for necessário acesso humano; não descobrir nem exportar o hash como substituto de senha.
- Conta Gmail foi criada localmente no início da conversa, mas o login atual exige domínio corporativo. Ela não foi usada como conta de produção nesta configuração.
- Houve um cadastro local com `.com` que foi corrigido para `.com.br` ao validar o login real.
- Não foi executado o seed completo em produção. Não foram criadas deliberadamente contas demo de gestor/usuário.
- Não houve cópia de empresas, vagas, candidatos, fotos, laudos ou currículos locais para o Neon.
- As oito empresas do hub são conteúdo editorial estático; não inferir que estejam cadastradas em `Empresa` no banco.

## Variáveis de ambiente

### Obrigatórias para o portal publicado

| Nome | Uso | Estado em 19/10/2026 |
| --- | --- | --- |
| `DATABASE_URL` | Prisma/app runtime | Configurada pela integração Neon |
| `DATABASE_URL_UNPOOLED` | Conexão direta para administração/migração | Disponível pela integração; usada no bootstrap |
| `NEXTAUTH_SECRET` | Assinatura de sessão e uso relacionado à autenticação | Gerado aleatoriamente, salvo como Secret na Vercel |
| `NEXTAUTH_URL` | URL canônica de autenticação | `https://pau-brasil-development.vercel.app`, salva como Config |
| `CRON_SECRET` | Autorização das rotinas agendadas | Gerado aleatoriamente, salvo como Secret na Vercel |

A integração adicionou nomes auxiliares com prefixo `DATABASE_`, como configurações de host/usuário/banco e URLs PostgreSQL. Também apareceram variáveis de Neon Auth. A autenticação do aplicativo continua sendo NextAuth; não foi feita migração para Neon Auth.

### Serviços opcionais ou dependentes de módulo

| Serviço | Variáveis/arquivos de referência | Limite atual |
| --- | --- | --- |
| Resend | `RESEND_API_KEY`, `EMAIL_FROM`, `src/lib/email.ts` | Não configurado/validado nesta rodada; helper retorna sem enviar se não há chave |
| Cloudinary | `CLOUDINARY_*`, `NEXT_PUBLIC_CLOUDINARY_*`, `CLOUDINARY_CV_PRESET` | Uploads não validados em produção nesta rodada |
| Vercel Blob | `BLOB_READ_WRITE_TOKEN`, `src/lib/backup-blob.ts`, helpers de laudo | Backup/arquivos privados dependem da integração; não foi provisionada nesta rodada |
| Upstash Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limit distribuído não foi configurado; existe fallback local |
| Sentry | Arquivos `sentry.*.config.ts`, `SENTRY_AUTH_TOKEN` no build | Código existente; entrega de eventos/source maps não validada |
| Web Push | `src/lib/push.ts`, variáveis VAPID presentes no inventário | Recebimento real de push não validado |

A lista completa de nomes referenciados no código está no inventário. Não considerar todos obrigatórios para gerar a build, nem declarar todos os módulos operacionais apenas porque o deploy está Ready.

## Recuperação segura de ambiente para manutenção

Usar CLI autenticada na conta do usuário. Exemplo operacional, sem credenciais embutidas:

```bash
npx vercel env ls production --project pau-brasil-development --scope henrique-dev2
```

`vercel env pull` requer projeto vinculado/contexto correto e pode gravar valores sensíveis em disco. Usar arquivo privado fora do Git, permissões restritas e removê-lo ao terminar. Variáveis salvas como Secret podem aparecer como `[SENSITIVE]` no pull; esse marcador não é uma credencial funcional.

Nunca copiar o `NEXTAUTH_SECRET` local para produção apenas por conveniência. Não rotacionar segredos existentes incidentalmente: isso pode invalidar sessões e recursos relacionados.

## Rotinas agendadas

Definidas em `vercel.json`, em UTC:

| Rota | Cron | Fortaleza (UTC−3) |
| --- | --- | --- |
| `/api/cron/backup` | `0 3 * * *` | 00:00 |
| `/api/cron/limpar-cvs` | `0 6 * * *` | 03:00 |

`CRON_SECRET` foi configurado, mas a execução real dos agendamentos não foi acompanhada nesta sessão. O lembrete diário ainda merece alinhamento com a retirada da gamificação; backup depende de configuração/storage e cobertura de modelos; limpeza de CV exige política e integração de arquivos corretas.

## Backup e restauração

O código possui exportação em gzip com checksum SHA-256, paginação e importação em etapas para relações. Porém, a leitura atual de `EXPORT_ORDER` mostrou ausência de 14 modelos de Gente/Quadro. A interface de backup não deve ser tratada como garantia de recuperação integral até fechar essa lacuna e testar restauração em ambiente isolado.

Backups podem conter dados pessoais e hashes de autenticação. Não versionar exports nem usá-los como fixtures públicas. A existência de recuperação/retention gerenciada pelo Neon não foi auditada nesta sessão; verificar diretamente a configuração/limites atuais da conta antes de depender dela.
