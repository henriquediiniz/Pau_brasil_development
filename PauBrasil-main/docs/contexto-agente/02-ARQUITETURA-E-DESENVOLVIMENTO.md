# Arquitetura e desenvolvimento

## Estrutura de diretórios

A raiz Git contém **uma segunda pasta de mesmo nome**. O `package.json` está em `PauBrasil-main/package.json`, não na raiz Git.

```text
PauBrasil-main/                  # raiz Git
├── AGENTS.md                    # orientação de entrada criada nesta rodada
└── PauBrasil-main/              # aplicação; executar npm aqui
    ├── package.json
    ├── package-lock.json
    ├── next.config.js
    ├── vercel.json
    ├── prisma/schema.prisma
    ├── prisma/migrations/
    ├── src/app/                 # páginas, layouts e route handlers
    ├── src/components/          # componentes compartilhados
    ├── src/lib/                 # regras, autenticação e integrações
    ├── src/services/            # serviços de domínio existentes
    ├── src/types/               # tipos compartilhados
    ├── public/                 # marca, imagens, ícones e manifest
    ├── worker/                 # worker customizado do PWA
    ├── tests/
    └── docs/
```

## Stack confirmada

- Next.js 14.2.35 no deploy validado, App Router.
- React 18; TypeScript 5.
- Prisma/Prisma Client 5.22.0 no deploy validado, PostgreSQL.
- NextAuth 4 com CredentialsProvider e sessão JWT.
- Tailwind CSS, Radix UI, lucide-react, Framer Motion, next-themes.
- SWR em partes existentes do front; não está mais no início simplificado removido de `InicioClient.tsx`.
- Zod para validação; bcryptjs para hash/verificação de senha.
- next-pwa/workbox para PWA, Sentry para instrumentação.
- xlsx para planilhas; Cloudinary, Resend, Vercel Blob e Upstash em integrações específicas.
- Playwright para E2E; `node --import tsx --test` para a maior parte das suítes; c8 para cobertura.

Versões declaradas podem ter intervalos no `package.json`; o lockfile e a instalação efetiva são a referência para reproduzir o build. Não fazer atualização major de Next/Prisma como parte incidental de uma correção.

## Camadas e contratos

| Camada | Arquivos de entrada | Responsabilidade |
| --- | --- | --- |
| Composição global | `src/app/layout.tsx`, `src/app/providers.tsx` | Providers, tema, sessão, fontes e toaster |
| Shell autenticado | `src/app/app/layout.tsx` | Navegação, busca, perfil, notificações e responsividade |
| Proteção de páginas | `src/middleware.ts`, `src/lib/middleware-access.ts` | Sessão JWT e destinos permitidos |
| Autenticação | `src/lib/auth.ts`, `src/lib/config.ts` | Credenciais, rate limit, TOTP, sessão e atualização |
| Autorização | `src/lib/auth-helpers.ts`, `src/lib/session-user.ts` | Papel, nível, flags e usuário relido do banco |
| APIs | `src/app/api/**/route.ts` | Entradas HTTP e aplicação das regras no servidor |
| Tratamento de erro | `src/lib/api-handler.ts` | P2025→404, P2002→409, erro estruturado |
| Persistência | `src/lib/prisma.ts`, `prisma/schema.prisma` | Cliente singleton e contrato do banco |
| Gente | `src/lib/gente/api.ts`, `src/lib/gente/scope.ts` | Autenticação e filtro por operação |
| Provisionamento | `src/lib/user-provisioning.ts` | Convites, validações, senha e auditoria de usuários |
| UI reutilizável | `src/components/ui`, `src/components/functions` | Componentes e cadastro compartilhado de funções |

## Autenticação em detalhe

- `ALLOWED_EMAIL_DOMAIN` é uma constante em `src/lib/config.ts`: **`grupopaubrasil.com.br`**.
- Definir uma variável de ambiente com esse mesmo nome não muda automaticamente a constante.
- O e-mail é validado no formulário e no CredentialsProvider. Gmail e `@grupopaubrasil.com` não passam no login atual.
- A senha fica em `User.passwordHash`; não há armazenamento autorizado de senha em texto no Git.
- Login busca o usuário, verifica `isActive`, compara bcrypt e, se configurado, exige TOTP.
- Sessão JWT tem duração de 4 horas no código atual.
- `JWT_REFRESH_INTERVAL_MS`: 30 segundos para revalidação do estado do usuário no servidor.
- O `SessionProvider` do front usa refetch de 5 minutos e não refaz sessão ao focar a janela. São mecanismos distintos.
- Rate limit: 5 tentativas / 15 minutos; Upstash quando configurado, memória local caso contrário.
- `mustChangePassword` tem prioridade sobre o destino normal de navegação.
- Alterações de autorização precisam considerar a sessão antiga e o usuário efetivo relido do banco.
- O helper `getEffectiveSessionUser()` atualmente faz fallback para campos da sessão se não encontra o usuário; isso merece revisão específica, não presumir que toda revogação já é fail-closed.
- A política de provisionamento é mais forte que a validação mínima do login. Não confundir “senha aceita pelo login” com “senha aceita por um novo cadastro”.

## Matriz de acesso essencial

| Regra | Implementação atual |
| --- | --- |
| Administrador global | `isSysAdmin`: `role === SYS_ADMIN` |
| RH | `isRhAdmin`: `RH_ADMIN` ou `SYS_ADMIN` |
| Gestão empresarial | `canManageEmpresa`: SYS_ADMIN ou `isEmpresaAdmin` |
| Administração da Universidade | `isUpbAdmin`: SYS_ADMIN ou `isUPBAdmin` |
| Níveis de coordenação | SUPERVISOR, COORDENADOR |
| Níveis de gestão | GERENTE, DIRETOR, DIRETO, PRESIDENTE; também papel legado GESTOR/SYS_ADMIN nos helpers correspondentes |
| Auditoria | SYS_ADMIN ou nível DIRETOR/PRESIDENTE |
| Gente | RH_ADMIN/SYS_ADMIN; RH limitado por `operationIds` |
| Escopo Gente | `null` = global para SYS_ADMIN; `[]` = nenhum acesso operacional para RH |

Menu oculto não é controle de segurança de API. O middleware protege páginas e **não inclui `/api/*` no matcher**; cada API precisa validar sessão, papel e escopo.

## Fluxo de uma requisição protegida

1. Middleware exige token e verifica `isActive`.
2. `resolveMiddlewareRedirect` prioriza sessão revogada/troca de senha, redireciona caminhos retirados e aplica os limites de página.
3. A página server obtém sessão quando necessário; a UI monta destinos pelas permissões.
4. APIs devem reler o usuário/validar o contexto apropriado, aplicar escopo e validar entrada.
5. Prisma consulta/grava; operações relevantes são auditadas e podem emitir notificação.
6. A UI trata falha, carregamento e sucesso sem presumir que a gravação funcionou.

## Rodar localmente

```bash
cd /home/henrique/Documentos/PauBrasil-main/PauBrasil-main
bash .local-dev/postgres.sh start
npm run dev
```

O script `.local-dev/postgres.sh` e o banco local são artefatos da máquina atual, ignorados no Git. Um clone novo não terá esses arquivos. Nesse caso, configurar PostgreSQL local e criar um arquivo de ambiente próprio com base em `.env.example`; o `docker-compose.yml` oferece uma alternativa distinta.

- Node observado na máquina: 24.21.0; npm: 11.19.0.
- PostgreSQL local desta sessão: 16, `127.0.0.1:55432`, banco `paub_portal_dev`.
- O Next em desenvolvimento carrega `.env.development.local`.
- Prisma CLI não deve ser presumido como leitor automático desse arquivo específico do Next. Nesta sessão foi usado `@next/env.loadEnvConfig(cwd, true)` para passar o ambiente ao processo Prisma.
- Docker Compose do repositório usa porta 5432 e outro nome de banco. Não misturar as duas configurações.
- Credenciais de desenvolvimento presentes em seeds/exemplos não são credenciais de produção.

## Diagnóstico local já resolvido

O `npm run dev` executado na raiz Git falhava com `ENOENT` porque não encontrava `package.json`. Entrar na pasta interna resolveu. O servidor respondeu HTTP 200 na porta 3000.

O PostgreSQL local estava parado durante a criação do primeiro usuário. Foi iniciado pelo script local. Em mudanças que removem arquivos, o cache do Next dev pode manter referências antigas; nesta sessão um reinício resolveu uma referência ao cliente antigo do início.

## Disciplina para a próxima implementação

- Ler o domínio relevante antes de alterar tipos ou schema.
- Consultar `git status --short`, diff e commits antes de supor que o workspace está limpo.
- Preservar mudanças do usuário e de outros agentes; não resetar o repositório.
- Preferir evolução incremental do código atual.
- Reusar autorização e escopo existentes, em vez de criar listas de papéis divergentes em cada componente.
- Manter migrações aditivas quando possível; revisar destruição de dados separadamente.
- Evitar executar `next build` na mesma `.next` usada pelo dev ativo. Usar um checkout/cópia isolada ou parar o dev de forma controlada.
- Não executar seed completo ou testes que limpam tabelas apontando para Neon de produção.
- Não reativar funcionalidades retiradas como efeito colateral de reorganizar menus.
