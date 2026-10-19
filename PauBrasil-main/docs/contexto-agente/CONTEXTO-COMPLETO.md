# Pau Brasil — contexto completo para transferência

Snapshot de 19/10/2026. Base funcional publicada: `f77afba`. Este arquivo reúne os documentos numerados da pasta `docs/contexto-agente`. Senhas, tokens, hashes e dados pessoais exportados foram excluídos. Os links entre documentos funcionam no repositório; em um anexo isolado, use os títulos das seções.

---

<!-- Fonte: 00-LEIA-PRIMEIRO.md -->

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

---

<!-- Fonte: 01-PRODUTO-E-DECISOES.md -->

# Produto, decisões e experiência atual

## Direção de produto

O Pau Brasil combina um hub institucional público e um portal corporativo autenticado. O objetivo é permitir que pessoas conheçam o grupo, encontrem oportunidades e acessem serviços internos, aprendizagem e gestão de pessoas. O usuário pediu continuar polindo o código existente e simplificar o portal, retirando a área de gamificação.

Não há autorização implícita para reconstruir tudo em outro framework, substituir o banco por Firebase ou reintroduzir módulos retirados. O histórico de Gente registra a decisão de construir os fluxos nativamente no portal: um aplicativo externo de RH foi usado como especificação funcional, não como base a ser incorporada.

## Superfícies atuais

| Área | Rotas de referência | Papel no produto |
| --- | --- | --- |
| Hub institucional | `/`, `/empresas/[slug]` | Empresas, narrativa editorial e orientação por interesse |
| Carreiras públicas | `/carreiras`, `/carreiras/candidatar` | Cargos, oportunidades e candidatura |
| Universidade pública | `/universidade-pb` | Amostra pública do catálogo, sem expor vídeos restritos |
| Entrada e conta | `/login`, `/registro`, `/app/perfil`, `/app/alterar-senha` | Autenticação, cadastro e gestão da própria conta |
| Início do colaborador | `/app/inicio` | Acesso a Universidade, perfil, ajuda e áreas permitidas |
| Universidade interna | `/universidade`, `/universidade/certificados` | Cursos, episódios, progresso, quizzes e certificados |
| Empresa | `/empresa`, `/empresa/usuarios`, `/empresa/funcoes` | Pessoas e funções dentro do escopo empresarial |
| Gente | `/gente` e subrotas | Recrutamento, quadro, cotas, carreira, sucessão e Frontline |
| Banco de Talentos | `/talentos` | Tratamento das candidaturas públicas e seus currículos |
| Visitas | `/app/visitas/*`, `/admin/visitas/obrigatorias` | Check-in, face, geolocalização, obrigações e acompanhamento |
| Administração | `/admin`, `/admin/usuarios`, `/admin/empresas`, `/admin/upb` | Administração global e catálogo |
| Auditoria e backup | `/admin/auditoria`, `/admin/backup` | Rastreabilidade e ferramentas de exportação/restauração |

Existir uma rota não comprova integração externa configurada nem fluxo validado ponta a ponta. Leia os limites em 05-QUALIDADE-E-PENDENCIAS.md.

## Início e navegação entregues

- `/app` direciona para `/app/inicio`.
- O início é renderizado no servidor, obtém a sessão e exige troca de senha quando aplicável.
- Cards básicos: Universidade, Meu perfil e Ajuda.
- Cards condicionais: Minha empresa, Gente & Cultura e Administração, conforme os helpers de acesso.
- Barra lateral e busca compartilham destinos; a busca não mantém um segundo catálogo independente.
- Navegação inferior móvel: Início, Universidade, Ajuda e Perfil.
- Visitas e administração continuam condicionadas ao papel/flags do usuário.
- Diretoria mantém o atalho de auditoria de gestão.
- Não há mais desvio do início para Universidade apenas porque a empresa não usava gamificação.
- Perfil mantém dados pessoais da conta, foto, rede hierárquica, senha, notificações e recursos de 2FA existentes.
- A aba antiga de evolução cai em uma aba válida do perfil; não deve produzir uma tela vazia.
- Gestão de funções de Empresa e Admin usa o componente compartilhado `src/components/functions/FunctionsPage.tsx`.

## Identidade visual

Conforme documentação histórica da marca e arquivos atuais:

- Paleta: vinho `#7A1520`, grafite/preto `#1A1A1A`, areia `#DCC8B1` e acentos de dourado.
- Tipografia: Montserrat, carregada por `next/font/google` em `src/lib/portal-font.ts` para o portal.
- Tokens e escopo: `src/app/portal-brand.css`; estilos globais em `src/app/globals.css`; Tailwind em `tailwind.config.ts`.
- Logos e acervo de identidade em `public/brand/`; não substituir por desenhos genéricos sem requisito.
- O hub usa CSS Modules e componentes próprios. Não aplicar mudanças globais de cor sem verificar módulos internos.
- Temas claro e escuro; o provider atual começa em dark e suporta o sistema.
- Estados de erro, sucesso, vazio e carregamento devem continuar distinguíveis.
- A fotografia de fachada do hub é uma aplicação ilustrativa de manual, não uma sede real validada.

## Conteúdo institucional

Fonte editorial central: `src/lib/hub-content.ts`.

As oito empresas cadastradas editorialmente são Pau Brasil Bebidas, Pau Brasil Motos, Unida Construtora, Instituto YSO, Original Start, Hora 10, Locadora Pau Brasil e Fazenda Divina. As associações Ambev/Honda constam do contexto histórico do usuário.

Bebidas possui relação editorial inicial de oito unidades: Patos, Sumé, Sousa, Itaporanga, Guarabira, Brumado, Barra da Estiva e Caculé. Essa lista estática **não cria registros no banco** e não deve ser confundida com cadastro operacional atualizado.

Os capítulos da história são editoriais, sem datas históricas inventadas. A orientação por interesse sugere negócios para conhecer; não interpreta currículos, não classifica candidatos e não encaminha automaticamente para RH.

Pendências de conteúdo já registradas: acervo real, créditos de fotos, datas aprovadas, contatos/endereço por empresa, catálogo de filiais e regras de encaminhamento de candidatos entre empresas.

## Regras de domínio a preservar

### Gente e Talentos

- `SYS_ADMIN` e `RH_ADMIN` acessam Gente; não conceder esse acesso só porque alguém é gestor.
- O escopo de RH é por `operationIds`; lista vazia significa nenhuma operação, não todas.
- O módulo trata informações sensíveis como salário e laudos. Os helpers de acesso e auditoria precisam permanecer no servidor.
- `Candidatura` do portal público e `RecCandidato` do recrutamento interno são entidades distintas. Verificar o vínculo antes de fundir fluxos.
- Histórico registra vínculo entre cargos públicos/descritivos e vagas, publicação de cargos, normalização de nomes e tratamentos específicos de Frontline.
- Importações XLSX/CSV usam regras por entidade; não assumir que um `createMany` genérico mantém identidade ou evita duplicação.
- Na retenção de CV, o prazo atual é 10 dias após sair do funil para Rejeitado/Arquivado. Trocar entre essas duas etapas não reinicia o prazo.
- A política de retenção não autoriza executar limpezas ou exclusões em produção durante testes.

### Universidade

- Acesso combina empresa, unidade, função, matrícula e permissões administrativas; ler `src/lib/upb-access.ts`.
- O catálogo público exclui `videoUrl` explicitamente do `select`.
- Não liberar os vídeos restritos ao tentar corrigir pré-renderização ou cache.
- A página pública agora consulta o banco em runtime. A escolha aleatória de até dez cursos ocorre a cada acesso, em vez da antiga revalidação da página a cada hora.

### Visitas

- Flags `isItinerantLeader` e `isVisitasAdmin` não são equivalentes ao nível hierárquico.
- As rotas envolvem GPS, foto/face, upload e autorização por usuário/operação.
- A existência da interface não significa que os testes reais de câmera, GPS e upload foram feitos no novo domínio.

## Funcionalidades retiradas — somente contexto de manutenção

Em `834fdda`, atividades, carteira/pontos, conquistas, ranking e navegação de gamificação foram retirados do portal, do início e do perfil. O cliente antigo do dashboard foi removido; links antigos são redirecionados por `isRetiredPortalPath()` e pelo middleware. A loja já estava suspensa e continua assim. Não houve limpeza destrutiva de saldos, tabelas ou histórico. Parte do backend e de páginas legadas permanece; presença no código não é requisito para reativação.

OBZ/financeiro/Score também aparecem nos documentos antigos e em estruturas legadas, mas não devem ser tratados como módulos ativos apenas por esses textos. Há inclusive referências residuais a revisar. Não detalhar nem reconstruir esses módulos nesta retomada sem pedido novo.

## Como trabalhar com o usuário

O usuário quer execução completa e comunicação direta. Nesta conversa ficou frustrado quando recebeu apenas diagnóstico ou quando a resposta não diferenciou código local, push e deploy. Sempre informar separadamente:

- o que foi alterado;
- o que foi validado;
- se foi commitado/enviado;
- se o deploy terminou;
- se o fluxo real foi testado;
- qual dependência externa ainda falta.

Prosseguir nas ações autorizadas sem repetir confirmações rotineiras. Se houver uma etapa realmente pessoal, como aceitar termos de um serviço, apresentar o link exato e continuar o trabalho independente. Não afirmar “tudo pronto” quando só a build passou.

---

<!-- Fonte: 02-ARQUITETURA-E-DESENVOLVIMENTO.md -->

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

---

<!-- Fonte: 03-BANCO-E-AMBIENTES.md -->

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
| `/api/cron/daily-reminder` | `0 11 * * *` | 08:00 |
| `/api/cron/backup` | `0 3 * * *` | 00:00 |
| `/api/cron/limpar-cvs` | `0 6 * * *` | 03:00 |

`CRON_SECRET` foi configurado, mas a execução real dos agendamentos não foi acompanhada nesta sessão. O lembrete diário ainda merece alinhamento com a retirada da gamificação; backup depende de configuração/storage e cobertura de modelos; limpeza de CV exige política e integração de arquivos corretas.

## Backup e restauração

O código possui exportação em gzip com checksum SHA-256, paginação e importação em etapas para relações. Porém, a leitura atual de `EXPORT_ORDER` mostrou ausência de 14 modelos de Gente/Quadro. A interface de backup não deve ser tratada como garantia de recuperação integral até fechar essa lacuna e testar restauração em ambiente isolado.

Backups podem conter dados pessoais e hashes de autenticação. Não versionar exports nem usá-los como fixtures públicas. A existência de recuperação/retention gerenciada pelo Neon não foi auditada nesta sessão; verificar diretamente a configuração/limites atuais da conta antes de depender dela.

---

<!-- Fonte: 04-GIT-DEPLOY-E-OPERACAO.md -->

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

---

<!-- Fonte: 05-QUALIDADE-E-PENDENCIAS.md -->

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

---

<!-- Fonte: 06-INVENTARIO-TECNICO.md -->

# Inventário técnico do snapshot

Gerado a partir dos arquivos presentes no commit funcional `f77afba` e das fontes locais em 19/10/2026. É mapa de localização, não resultado de execução de todas as rotas. Caminhos relativos à pasta da aplicação.

## Contagens

- 97 arquivos `page.tsx` (incluem telas legadas).
- 177 route handlers sob `src/app/api`.
- 48 modelos Prisma.
- 23 migrações SQL.

## Páginas e seus arquivos

Caminhos em colchetes são parâmetros do App Router. Telas retiradas da gamificação são omitidas da listagem detalhada; o código de redirecionamento é a referência. Outras telas sem atalhos podem continuar existindo.

| Rota | Arquivo |
| --- | --- |
| `/admin/auditoria` | `src/app/admin/auditoria/page.tsx` |
| `/admin/backup` | `src/app/admin/backup/page.tsx` |
| `/admin/empresas` | `src/app/admin/empresas/page.tsx` |
| `/admin/funcoes` | `src/app/admin/funcoes/page.tsx` |
| `/admin/operacoes` | `src/app/admin/operacoes/page.tsx` |
| `/admin` | `src/app/admin/page.tsx` |
| `/admin/pedidos` | `src/app/admin/pedidos/page.tsx` |
| `/admin/produtos` | `src/app/admin/produtos/page.tsx` |
| `/admin/upb` | `src/app/admin/upb/page.tsx` |
| `/admin/upb/relatorio` | `src/app/admin/upb/relatorio/page.tsx` |
| `/admin/usuarios` | `src/app/admin/usuarios/page.tsx` |
| `/admin/visitas/obrigatorias` | `src/app/admin/visitas/obrigatorias/page.tsx` |
| `/app/ajuda` | `src/app/app/ajuda/page.tsx` |
| `/app/alterar-senha` | `src/app/app/alterar-senha/page.tsx` |
| `/app/inicio` | `src/app/app/inicio/page.tsx` |
| `/app` | `src/app/app/page.tsx` |
| `/app/perfil` | `src/app/app/perfil/page.tsx` |
| `/app/visitas/checkin/[operacao]` | `src/app/app/visitas/checkin/[operacao]/page.tsx` |
| `/app/visitas/checkin` | `src/app/app/visitas/checkin/page.tsx` |
| `/app/visitas/configurar-face` | `src/app/app/visitas/configurar-face/page.tsx` |
| `/app/visitas/dashboard` | `src/app/app/visitas/dashboard/page.tsx` |
| `/app/visitas/lider/[userId]` | `src/app/app/visitas/lider/[userId]/page.tsx` |
| `/carreiras/candidatar` | `src/app/carreiras/candidatar/page.tsx` |
| `/carreiras` | `src/app/carreiras/page.tsx` |
| `/carreiras/preview` | `src/app/carreiras/preview/page.tsx` |
| `/contato` | `src/app/contato/page.tsx` |
| `/empresa/funcoes` | `src/app/empresa/funcoes/page.tsx` |
| `/empresa` | `src/app/empresa/page.tsx` |
| `/empresa/usuarios` | `src/app/empresa/usuarios/page.tsx` |
| `/empresas/[slug]` | `src/app/empresas/[slug]/page.tsx` |
| `/gente/aprendizes/[id]/editar` | `src/app/gente/aprendizes/[id]/editar/page.tsx` |
| `/gente/aprendizes/importar` | `src/app/gente/aprendizes/importar/page.tsx` |
| `/gente/aprendizes/novo` | `src/app/gente/aprendizes/novo/page.tsx` |
| `/gente/aprendizes` | `src/app/gente/aprendizes/page.tsx` |
| `/gente/candidatos/[id]/editar` | `src/app/gente/candidatos/[id]/editar/page.tsx` |
| `/gente/candidatos/do-banco-de-talentos` | `src/app/gente/candidatos/do-banco-de-talentos/page.tsx` |
| `/gente/candidatos/importar` | `src/app/gente/candidatos/importar/page.tsx` |
| `/gente/candidatos/internos/[id]/editar` | `src/app/gente/candidatos/internos/[id]/editar/page.tsx` |
| `/gente/candidatos/internos/importar` | `src/app/gente/candidatos/internos/importar/page.tsx` |
| `/gente/candidatos/internos/novo` | `src/app/gente/candidatos/internos/novo/page.tsx` |
| `/gente/candidatos/internos` | `src/app/gente/candidatos/internos/page.tsx` |
| `/gente/candidatos/novo` | `src/app/gente/candidatos/novo/page.tsx` |
| `/gente/candidatos` | `src/app/gente/candidatos/page.tsx` |
| `/gente/cargos/[id]/editar` | `src/app/gente/cargos/[id]/editar/page.tsx` |
| `/gente/cargos/importar` | `src/app/gente/cargos/importar/page.tsx` |
| `/gente/cargos/novo` | `src/app/gente/cargos/novo/page.tsx` |
| `/gente/cargos` | `src/app/gente/cargos/page.tsx` |
| `/gente/desligamentos/importar` | `src/app/gente/desligamentos/importar/page.tsx` |
| `/gente/desligamentos` | `src/app/gente/desligamentos/page.tsx` |
| `/gente/frontline` | `src/app/gente/frontline/page.tsx` |
| `/gente` | `src/app/gente/page.tsx` |
| `/gente/pcd/[id]/editar` | `src/app/gente/pcd/[id]/editar/page.tsx` |
| `/gente/pcd/importar` | `src/app/gente/pcd/importar/page.tsx` |
| `/gente/pcd/novo` | `src/app/gente/pcd/novo/page.tsx` |
| `/gente/pcd` | `src/app/gente/pcd/page.tsx` |
| `/gente/quadro/[id]/editar` | `src/app/gente/quadro/[id]/editar/page.tsx` |
| `/gente/quadro/importar` | `src/app/gente/quadro/importar/page.tsx` |
| `/gente/quadro/novo` | `src/app/gente/quadro/novo/page.tsx` |
| `/gente/quadro` | `src/app/gente/quadro/page.tsx` |
| `/gente/sucessao/[id]/editar` | `src/app/gente/sucessao/[id]/editar/page.tsx` |
| `/gente/sucessao/importar` | `src/app/gente/sucessao/importar/page.tsx` |
| `/gente/sucessao/lista` | `src/app/gente/sucessao/lista/page.tsx` |
| `/gente/sucessao/novo` | `src/app/gente/sucessao/novo/page.tsx` |
| `/gente/sucessao` | `src/app/gente/sucessao/page.tsx` |
| `/gente/sucessao/pipeline` | `src/app/gente/sucessao/pipeline/page.tsx` |
| `/gente/vagas/[id]/editar` | `src/app/gente/vagas/[id]/editar/page.tsx` |
| `/gente/vagas/importar` | `src/app/gente/vagas/importar/page.tsx` |
| `/gente/vagas/nova` | `src/app/gente/vagas/nova/page.tsx` |
| `/gente/vagas` | `src/app/gente/vagas/page.tsx` |
| `/gestor/auditoria` | `src/app/gestor/auditoria/page.tsx` |
| `/login` | `src/app/login/page.tsx` |
| `/offline` | `src/app/offline/page.tsx` |
| `/` | `src/app/page.tsx` |
| `/produtos` | `src/app/produtos/page.tsx` |
| `/registro` | `src/app/registro/page.tsx` |
| `/talentos/importar` | `src/app/talentos/importar/page.tsx` |
| `/talentos` | `src/app/talentos/page.tsx` |
| `/universidade/[temporadaId]` | `src/app/universidade/[temporadaId]/page.tsx` |
| `/universidade/[temporadaId]/quiz` | `src/app/universidade/[temporadaId]/quiz/page.tsx` |
| `/universidade/certificados` | `src/app/universidade/certificados/page.tsx` |
| `/universidade` | `src/app/universidade/page.tsx` |
| `/universidade-pb` | `src/app/universidade-pb/page.tsx` |

## APIs e métodos exportados

Métodos extraídos estaticamente; exports indiretos podem exigir leitura do arquivo. Não inferir acesso público pela presença nesta tabela. Conferir autenticação em cada handler. APIs estritamente legadas de gamificação são resumidas, não expandidas.

| Endpoint | Métodos detectados |
| --- | --- |
| `/api/admin/auditoria` | GET |
| `/api/admin/backup/[jobId]/download` | GET |
| `/api/admin/backup/[jobId]` | DELETE, GET |
| `/api/admin/backup/config` | GET, PATCH |
| `/api/admin/backup/export` | POST |
| `/api/admin/backup/import` | POST |
| `/api/admin/backup` | GET |
| `/api/admin/cockpit` | GET |
| `/api/admin/empresas/[id]/operacoes/[opId]` | DELETE, PATCH |
| `/api/admin/empresas/[id]/operacoes` | GET, POST |
| `/api/admin/empresas/[id]` | DELETE, GET, PATCH |
| `/api/admin/empresas/[id]/ti` | PATCH, POST |
| `/api/admin/empresas` | GET, POST |
| `/api/admin/funcoes/[id]` | DELETE, PATCH |
| `/api/admin/funcoes` | GET, POST |
| `/api/admin/operacoes/[id]` | DELETE, PATCH |
| `/api/admin/operacoes` | GET, POST |
| `/api/admin/registros-pendentes/[id]/aprovar` | POST |
| `/api/admin/registros-pendentes/[id]/rejeitar` | POST |
| `/api/admin/registros-pendentes` | GET |
| `/api/admin/rh/candidaturas/[id]/cv-url` | GET |
| `/api/admin/rh/candidaturas/[id]/erasure` | DELETE |
| `/api/admin/rh/candidaturas/[id]/perfil` | PUT |
| `/api/admin/rh/candidaturas/[id]` | GET, PATCH |
| `/api/admin/rh/candidaturas/bulk` | POST |
| `/api/admin/rh/candidaturas` | GET |
| `/api/admin/rh/cleanup-cvs` | POST |
| `/api/admin/rh/importar-cv` | POST |
| `/api/admin/unidades` | GET |
| `/api/admin/upb/episodios/[id]` | PATCH |
| `/api/admin/upb/episodios` | POST |
| `/api/admin/upb/matriculas/[id]` | PATCH |
| `/api/admin/upb/matriculas` | GET |
| `/api/admin/upb/obrigatorios/[id]` | DELETE, PATCH |
| `/api/admin/upb/obrigatorios` | GET, POST |
| `/api/admin/upb/questoes/[id]` | DELETE, PATCH |
| `/api/admin/upb/questoes` | GET, POST |
| `/api/admin/upb/relatorio` | GET |
| `/api/admin/upb/temporadas/[id]/alunos/[userId]/zerar` | DELETE |
| `/api/admin/upb/temporadas/[id]/alunos` | GET |
| `/api/admin/upb/temporadas/[id]` | DELETE, PATCH |
| `/api/admin/upb/temporadas` | GET, POST |
| `/api/admin/usuarios/[id]/purge` | DELETE |
| `/api/admin/usuarios/[id]/reenviar-convite` | POST |
| `/api/admin/usuarios/[id]` | DELETE, PATCH |
| `/api/admin/usuarios/bulk-deactivate` | POST |
| `/api/admin/usuarios` | GET, POST |
| `/api/admin/visitas/obrigatorias/[id]` | DELETE, PATCH |
| `/api/admin/visitas/obrigatorias/lideres` | GET |
| `/api/admin/visitas/obrigatorias` | GET, POST |
| `/api/auth/[...nextauth]` | GET, POST |
| `/api/auth/registro` | POST |
| `/api/auth/setup-password` | POST |
| `/api/auth/totp/disable` | POST |
| `/api/auth/totp/setup` | GET, POST |
| `/api/auth/totp/verify` | POST |
| `/api/carreiras/candidaturas` | POST |
| `/api/carreiras/cargos` | GET |
| `/api/carreiras/lideres` | GET |
| `/api/carreiras/parse-cv` | POST |
| `/api/carreiras/upload-cv` | POST |
| `/api/contato` | POST |
| `/api/cron/backup` | GET, POST |
| `/api/cron/daily-reminder` | GET, POST |
| `/api/cron/limpar-cvs` | GET |
| `/api/empresa/operacoes` | GET |
| `/api/empresa/registros-pendentes/[id]/aprovar` | POST |
| `/api/empresa/registros-pendentes/[id]/rejeitar` | POST |
| `/api/empresa/registros-pendentes` | GET |
| `/api/empresa/usuarios/[id]/reenviar-convite` | POST |
| `/api/empresa/usuarios/[id]` | DELETE, PATCH |
| `/api/empresa/usuarios/bulk-deactivate` | POST |
| `/api/empresa/usuarios` | GET, POST |
| `/api/feed` | GET |
| `/api/gente/aprendizes/[id]` | DELETE, GET, PATCH |
| `/api/gente/aprendizes/importar` | POST |
| `/api/gente/aprendizes` | GET, POST |
| `/api/gente/candidatos/[id]/cv` | GET |
| `/api/gente/candidatos/[id]/etapas` | PATCH |
| `/api/gente/candidatos/[id]` | DELETE, GET, PATCH |
| `/api/gente/candidatos/disponiveis` | GET |
| `/api/gente/candidatos/importar` | POST |
| `/api/gente/candidatos/promover` | POST |
| `/api/gente/candidatos/resumo-frontline` | GET |
| `/api/gente/candidatos` | GET, PATCH, POST |
| `/api/gente/cargos/[id]` | DELETE, GET, PATCH |
| `/api/gente/cargos/importar` | POST |
| `/api/gente/cargos` | GET, POST |
| `/api/gente/dashboard` | GET |
| `/api/gente/desligamentos/[id]` | DELETE, PATCH |
| `/api/gente/desligamentos/importar` | POST |
| `/api/gente/desligamentos` | GET, POST |
| `/api/gente/frontline/[id]` | DELETE, PATCH |
| `/api/gente/frontline/meses` | PUT |
| `/api/gente/frontline` | GET, POST, PUT |
| `/api/gente/internos/[id]` | DELETE, GET, PATCH |
| `/api/gente/internos/importar` | POST |
| `/api/gente/internos` | GET, POST |
| `/api/gente/modelo` | GET |
| `/api/gente/operacoes` | GET |
| `/api/gente/pcd/[id]/laudo` | DELETE, GET, POST |
| `/api/gente/pcd/[id]` | DELETE, GET, PATCH |
| `/api/gente/pcd/importar` | POST |
| `/api/gente/pcd/metas` | GET, PUT |
| `/api/gente/pcd` | GET, POST |
| `/api/gente/quadro/[id]/desligar` | POST |
| `/api/gente/quadro/[id]` | DELETE, GET, PATCH |
| `/api/gente/quadro/importar` | POST |
| `/api/gente/quadro` | DELETE, GET, POST |
| `/api/gente/sucessao/[id]` | DELETE, GET, PATCH |
| `/api/gente/sucessao/importar` | POST |
| `/api/gente/sucessao/pipeline` | GET |
| `/api/gente/sucessao` | GET, POST |
| `/api/gente/vagas/[id]/aderencia` | GET |
| `/api/gente/vagas/[id]` | DELETE, GET, PATCH |
| `/api/gente/vagas/importacoes` | DELETE, GET |
| `/api/gente/vagas/importar` | POST |
| `/api/gente/vagas` | DELETE, GET, POST |
| `/api/me/alterar-senha` | PATCH |
| `/api/me/avatar` | POST |
| `/api/me/network` | GET |
| `/api/me/password` | POST |
| `/api/me/photo` | PATCH |
| `/api/me/target` | GET, POST |
| `/api/notifications` | GET, PATCH |
| `/api/notifications/stream` | GET |
| `/api/public/empresas/[id]/funcoes` | GET |
| `/api/public/empresas` | GET |
| `/api/push/subscribe` | DELETE, POST |
| `/api/relatorio/[userId]` | GET |
| `/api/universidade/acesso/[temporadaId]` | GET, POST |
| `/api/universidade/certificados` | GET |
| `/api/universidade/progresso` | POST |
| `/api/universidade/quiz/[temporadaId]` | GET, POST |
| `/api/universidade/temporadas/[id]` | GET |
| `/api/universidade/temporadas` | GET |
| `/api/upload` | POST |
| `/api/usuarios/[id]` | PATCH |
| `/api/usuarios/buscar` | GET |
| `/api/usuarios` | GET, POST |
| `/api/visitas/cadastrar-face` | POST |
| `/api/visitas/checkin` | POST |
| `/api/visitas/compliance` | GET |
| `/api/visitas/dashboard` | GET |
| `/api/visitas/lider/[userId]` | GET |
| `/api/visitas/matriz` | GET |
| `/api/visitas/obrigatorias` | GET |
| `/api/visitas/operacoes` | GET |

29 handlers legados foram omitidos do detalhamento. Eles não foram todos apagados/desabilitados pelo trabalho de retirada da navegação.

### Route handlers fora de `/api`

- `src/app/admin/funcoes/[id]/route.ts` → `/admin/funcoes/[id]`. Revisar duplicidade/legado antes de alterar.

## Modelos Prisma atuais

Lista de campos escalares e relacionamentos extraída do schema, sem registros reais. `?` indica opcional; `[]`, lista. A definição completa de defaults, onDelete e constraints é `prisma/schema.prisma`.

### Empresa

**Campos:** `id: String`, `nome: String`, `slug: String`, `ativo: Boolean`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `operacoes: Operacao[]`, `usuarios: User[]`, `funcoes: Function[]`, `filiais: Filial[]`, `registrosPendentes: PendingRegistration[]`, `recVagas: RecVaga[]`, `recCargos: RecCargo[]`, `recCandidatos: RecCandidato[]`, `recCandidatosInterno: RecCandidatoInterno[]`, `recSucessoes: RecSucessao[]`, `quadroColaboradores: QuadroColaborador[]`, `quadroDesligamentos: QuadroDesligamento[]`, `quadroPcd: QuadroPcd[]`, `quadroPcdMetas: QuadroPcdMeta[]`, `quadroAprendizes: QuadroAprendiz[]`, `quadroFrontlineCargos: QuadroFrontlineCargo[]`, `quadroFrontlineMeses: QuadroFrontlineMes[]`, `quadroFrontlineTetos: QuadroFrontlineTeto[]`.

**Constraints/índices declarados:**

```prisma
@@index([ativo])
```

### Filial

**Campos:** `id: String`, `slug: String`, `label: String`, `estado: String`, `color: String`, `ativo: Boolean`, `empresaId: String?`.

**Relações:** `empresa: Empresa?`, `lideres: User[]`.

**Constraints/índices declarados:**

```prisma
@@index([ativo])
@@index([empresaId])
```

### Operacao

**Campos:** `id: String`, `nome: String`, `nomeAbrev: String?`, `empresaId: String`, `ativo: Boolean`, `ordem: Int`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `recVagas: RecVaga[]`, `recCandidatos: RecCandidato[]`, `recCandidatosInterno: RecCandidatoInterno[]`, `recSucessoes: RecSucessao[]`, `quadroColaboradores: QuadroColaborador[]`, `quadroDesligamentos: QuadroDesligamento[]`, `quadroPcd: QuadroPcd[]`, `quadroPcdMetas: QuadroPcdMeta[]`, `quadroAprendizes: QuadroAprendiz[]`, `quadroFrontlineCargos: QuadroFrontlineCargo[]`, `quadroFrontlineMeses: QuadroFrontlineMes[]`.

**Constraints/índices declarados:**

```prisma
@@unique([nome, empresaId])
@@index([empresaId])
@@index([empresaId, ativo])
```

### User

**Campos:** `id: String`, `name: String`, `email: String`, `passwordHash: String`, `role: Role`, `nivel: Nivel`, `isUPBAdmin: Boolean`, `isEmpresaAdmin: Boolean`, `isItinerantLeader: Boolean`, `isVisitasAdmin: Boolean`, `leaderTitle: String?`, `faceReferenceUrl: String?`, `managedAreaIds: String[]`, `functionId: String?`, `units: String[]`, `operationIds: String[]`, `company: String?`, `empresaId: String?`, `managerId: String?`, `photoUrl: String?`, `targetRewardId: String?`, `isActive: Boolean`, `mustChangePassword: Boolean`, `passwordResetTokenHash: String?`, `passwordResetExpiresAt: DateTime?`, `totpSecret: String?`, `totpEnabled: Boolean`, `isLiderPublico: Boolean`, `filialId: String?`, `trajetoria: Json?`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `function: Function?`, `empresa: Empresa?`, `filial: Filial?`, `manager: User?`, `subordinates: User[]`, `taskInstances: TaskInstance[]`, `ledger: PointsLedger[]`, `orders: RedemptionOrder[]`, `targetReward: RewardProduct?`, `feedEvents: FeedEvent[]`, `approvals: TaskInstance[]`, `notifications: Notification[]`, `upbProgressos: UPBProgresso[]`, `upbCertificados: UPBCertificado[]`, `upbTentativas: UPBQuizTentativa[]`, `upbMatriculas: UPBMatricula[]`, `upbMatriculasAprov: UPBMatricula[]`, `notasCandidatura: NotaCandidatura[]`, `leaderVisits: LeaderVisit[]`, `visitasObrigatorias: VisitaObrigatoria[]`, `visitasObrigatoriasCreadas: VisitaObrigatoria[]`, `pushSubscriptions: PushSubscription[]`, `recVagasResponsavel: RecVaga[]`, `recVagasSolicitante: RecVaga[]`, `recVagasContratado: RecVaga[]`, `recEtapasAvaliadas: RecCandidatoEtapa[]`, `recCandidatosInternos: RecCandidatoInterno[]`, `recSucessoes: RecSucessao[]`, `quadroColaborador: QuadroColaborador[]`, `quadroDesligamentos: QuadroDesligamento[]`, `quadroPcd: QuadroPcd[]`, `quadroAprendiz: QuadroAprendiz[]`, `quadroAprendizGeridos: QuadroAprendiz[]`.

**Constraints/índices declarados:**

```prisma
@@index([functionId])
@@index([managerId])
@@index([empresaId])
@@index([isEmpresaAdmin])
@@index([isActive])
```

### LeaderVisit

**Campos:** `id: String`, `userId: String`, `operationSlug: String`, `operationName: String`, `checkedInAt: DateTime`, `photoUrl: String?`, `latitude: Float`, `longitude: Float`, `gpsValid: Boolean`, `faceValid: Boolean`, `status: LeaderVisitStatus`.

**Relações:** `user: User`.

**Constraints/índices declarados:**

```prisma
@@index([userId])
@@index([operationSlug])
@@index([checkedInAt])
@@index([userId, operationSlug, checkedInAt])
```

### Operation

**Campos:** `id: String`, `slug: String`, `name: String`, `latitude: Float`, `longitude: Float`, `radiusMeters: Int`.

### VisitaObrigatoria

**Campos:** `id: String`, `userId: String`, `operationSlug: String`, `quantidadeMinima: Int`, `ativo: Boolean`, `criadoPor: String`, `criadoEm: DateTime`, `atualizadoEm: DateTime`.

**Relações:** `user: User`, `criador: User`.

**Constraints/índices declarados:**

```prisma
@@unique([userId, operationSlug])
@@index([userId])
@@index([operationSlug])
```

### Function

**Campos:** `id: String`, `name: String`, `description: String?`, `empresaId: String?`, `createdAt: DateTime`.

**Relações:** `empresa: Empresa?`, `users: User[]`, `tasks: TaskDefinition[]`, `metas: MetaPontuacao[]`, `registrosPendentes: PendingRegistration[]`, `recSucessoes: RecSucessao[]`.

**Constraints/índices declarados:**

```prisma
@@index([empresaId])
```

### AuditLog

**Campos:** `id: String`, `actorId: String`, `actorName: String`, `action: String`, `targetType: String`, `targetId: String?`, `meta: Json?`, `ip: String?`, `userAgent: String?`, `requestId: String?`, `createdAt: DateTime`.

**Constraints/índices declarados:**

```prisma
@@index([actorId])
@@index([targetType, targetId])
@@index([createdAt])
@@index([action, createdAt])
@@index([targetType, createdAt])
```

### PendingRegistration

**Campos:** `id: String`, `name: String`, `email: String`, `passwordHash: String`, `empresaId: String`, `functionId: String?`, `note: String?`, `status: RegistrationStatus`, `rejectedReason: String?`, `reviewedById: String?`, `reviewedAt: DateTime?`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `function: Function?`.

**Constraints/índices declarados:**

```prisma
@@index([empresaId])
@@index([status])
@@index([email])
```

### PushSubscription

**Campos:** `id: String`, `userId: String`, `endpoint: String`, `p256dh: String`, `auth: String`, `createdAt: DateTime`.

**Relações:** `user: User`.

**Constraints/índices declarados:**

```prisma
@@unique([userId, endpoint])
@@index([userId])
```

### Notification

**Campos:** `id: String`, `userId: String`, `title: String`, `description: String?`, `read: Boolean`, `createdAt: DateTime`.

**Relações:** `user: User`.

**Constraints/índices declarados:**

```prisma
@@index([userId, read])
@@index([userId, createdAt])
@@index([userId, read, createdAt])
```

### FeedEvent

**Campos:** `id: String`, `userId: String`, `type: String`, `message: String`, `createdAt: DateTime`.

**Relações:** `user: User`.

**Constraints/índices declarados:**

```prisma
@@index([userId, createdAt])
@@index([createdAt])
@@index([type])
@@index([userId])
```

### UPBTemporada

**Campos:** `id: String`, `titulo: String`, `descricao: String?`, `capa: String?`, `ordem: Int`, `ativo: Boolean`, `restricaoAcesso: Boolean`, `pontosNoCertificado: Int`, `empresas: String[]`, `unidades: String[]`, `funcoesComAcesso: String[]`, `preRequisitos: String[]`, `validadeDias: Int?`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `episodios: UPBEpisodio[]`, `certificados: UPBCertificado[]`, `questoes: UPBQuestao[]`, `tentativas: UPBQuizTentativa[]`, `matriculas: UPBMatricula[]`, `obrigatorios: UPBObrigatorio[]`.

### UPBObrigatorio

**Campos:** `id: String`, `temporadaId: String`, `empresas: String[]`, `unidades: String[]`, `funcoes: String[]`, `prazo: DateTime`, `ativo: Boolean`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `temporada: UPBTemporada`.

**Constraints/índices declarados:**

```prisma
@@index([temporadaId])
```

### UPBQuestao

**Campos:** `id: String`, `temporadaId: String`, `enunciado: String`, `ordem: Int`, `versao: Int`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `temporada: UPBTemporada`, `opcoes: UPBQuestaoOpcao[]`, `respostas: UPBRespostaUsuario[]`.

**Constraints/índices declarados:**

```prisma
@@index([temporadaId])
```

### UPBQuestaoOpcao

**Campos:** `id: String`, `questaoId: String`, `texto: String`, `correta: Boolean`, `ordem: Int`.

**Relações:** `questao: UPBQuestao`.

**Constraints/índices declarados:**

```prisma
@@index([questaoId])
```

### UPBQuizTentativa

**Campos:** `id: String`, `userId: String`, `temporadaId: String`, `acertos: Int`, `total: Int`, `aprovado: Boolean`, `createdAt: DateTime`.

**Relações:** `user: User`, `temporada: UPBTemporada`, `respostas: UPBRespostaUsuario[]`.

**Constraints/índices declarados:**

```prisma
@@index([userId, temporadaId])
```

### UPBRespostaUsuario

**Campos:** `id: String`, `tentativaId: String`, `questaoId: String`, `questaoVersao: Int`, `opcaoEscolhidaId: String`, `correta: Boolean`, `createdAt: DateTime`.

**Relações:** `tentativa: UPBQuizTentativa`, `questao: UPBQuestao`.

**Constraints/índices declarados:**

```prisma
@@index([tentativaId])
@@index([questaoId, questaoVersao]) // consultas analíticas: "erros por questão na versão atual"
```

### UPBMatricula

**Campos:** `id: String`, `userId: String`, `temporadaId: String`, `status: UPBMatriculaStatus`, `aprovadoPor: String?`, `nota: String?`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `user: User`, `temporada: UPBTemporada`, `aprovador: User?`.

**Constraints/índices declarados:**

```prisma
@@unique([userId, temporadaId])
@@index([temporadaId])
@@index([status])
```

### UPBEpisodio

**Campos:** `id: String`, `titulo: String`, `descricao: String?`, `videoUrl: String`, `duracaoMin: Int`, `temporadaId: String`, `ordem: Int`, `publicado: Boolean`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `temporada: UPBTemporada`, `progressos: UPBProgresso[]`.

**Constraints/índices declarados:**

```prisma
@@index([temporadaId])
```

### UPBProgresso

**Campos:** `id: String`, `userId: String`, `episodioId: String`, `concluidoEm: DateTime?`, `createdAt: DateTime`.

**Relações:** `user: User`, `episodio: UPBEpisodio`.

**Constraints/índices declarados:**

```prisma
@@unique([userId, episodioId])
@@index([userId])
@@index([episodioId])
```

### UPBCertificado

**Campos:** `id: String`, `userId: String`, `temporadaId: String`, `emitidoEm: DateTime`, `validoAte: DateTime?`, `createdAt: DateTime`.

**Relações:** `user: User`, `temporada: UPBTemporada`.

**Constraints/índices declarados:**

```prisma
@@unique([userId, temporadaId])
@@index([userId])
@@index([temporadaId])
@@index([validoAte]) // varredura eficiente para expirados
```

### Candidatura

**Campos:** `id: String`, `nome: String`, `email: String`, `telefone: String?`, `cidade: String`, `estado: String`, `empresa: String`, `gruposInteresse: String[]`, `cargosInteresse: String[]`, `cvUrl: String?`, `cvPublicId: String?`, `cvOriginalFilename: String?`, `cvMimeType: String?`, `cvSizeBytes: Int?`, `cvHash: String?`, `mensagem: String?`, `genero: String?`, `dataNascimento: DateTime?`, `escolaridade: String?`, `etapa: EtapaCandidatura`, `consentimentoLgpd: Boolean`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `notas: NotaCandidatura[]`, `recCandidato: RecCandidato?`.

**Constraints/índices declarados:**

```prisma
@@index([etapa])
@@index([createdAt])
@@index([email])
```

### NotaCandidatura

**Campos:** `id: String`, `candidaturaId: String`, `autorId: String`, `texto: String`, `tipo: TipoNotaCandidatura`, `etapaAnterior: EtapaCandidatura?`, `etapaNova: EtapaCandidatura?`, `createdAt: DateTime`.

**Relações:** `candidatura: Candidatura`, `autor: User`.

**Constraints/índices declarados:**

```prisma
@@index([candidaturaId])
```

### SystemConfig

**Campos:** `key: String`, `value: String`, `updatedAt: DateTime`, `updatedBy: String?`.

### BackupJob

**Campos:** `id: String`, `type: String`, `status: String`, `trigger: String`, `triggeredBy: String?`, `blobUrl: String?`, `blobKey: String?`, `sizeBytes: BigInt?`, `rowCounts: Json?`, `errorMsg: String?`, `startedAt: DateTime`, `finishedAt: DateTime?`.

**Constraints/índices declarados:**

```prisma
@@index([type, status])
@@index([startedAt])
```

### RecVaga

**Campos:** `id: String`, `empresaId: String`, `operacaoId: String?`, `unidadeTexto: String?`, `departamento: SetorOperacional?`, `cargo: String`, `cargoId: String?`, `area: String?`, `salario: Decimal?`, `localTrabalho: String?`, `horario: String?`, `quantidadeVagas: Int`, `informacoesComplementares: String?`, `requisitosMinimos: String?`, `formacao: String?`, `motivoSolicitacao: String?`, `codigo: String?`, `frontline: String?`, `colaboradorAnterior: String?`, `colaboradorAnteriorId: String?`, `dataDesligamento: DateTime?`, `dataAbertura: DateTime`, `dataPrevistaFechamento: DateTime?`, `dataContratacao: DateTime?`, `encerradaEm: DateTime?`, `responsavelVaga: String?`, `responsavelId: String?`, `solicitanteVaga: String?`, `solicitanteId: String?`, `nomeContratado: String?`, `contratadoId: String?`, `status: RecVagaStatus`, `statusFechamentoManual: RecStatusFechamento?`, `andamentoProcesso: String?`, `importacaoId: String?`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `operacao: Operacao?`, `cargoRef: RecCargo?`, `responsavel: User?`, `solicitante: User?`, `contratado: User?`, `candidatos: RecCandidato[]`.

**Constraints/índices declarados:**

```prisma
@@index([empresaId])
@@index([operacaoId])
@@index([status])
@@index([dataAbertura])
@@index([empresaId, status])
@@index([operacaoId, status])
@@index([importacaoId])
```

### RecCargo

**Campos:** `id: String`, `empresaId: String`, `cargo: String`, `area: String`, `tipoVaga: String?`, `descricaoAtividades: String?`, `competenciasSugeridas: String?`, `experienciaSugerida: String?`, `formacao: String?`, `statusCurso: String?`, `curso: String?`, `exigencias: String?`, `observacoes: String?`, `etapasProcesso: String?`, `testes: String?`, `precisaAderenciaRaio: Boolean`, `frontline: Boolean`, `publicarNoSite: Boolean`, `grupoPublico: String?`, `turnos: String[]`, `ativo: Boolean`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `vagas: RecVaga[]`.

**Constraints/índices declarados:**

```prisma
@@unique([empresaId, cargo, area])
@@index([empresaId, ativo])
```

### RecCandidato

**Campos:** `id: String`, `empresaId: String`, `operacaoId: String?`, `candidaturaId: String?`, `vagaId: String?`, `nome: String`, `cargo: String?`, `telefone: String?`, `email: String?`, `mesProcesso: String?`, `setor: SetorOperacional?`, `escolaridade: String?`, `habilidades: String?`, `residencia: String?`, `observacao: String?`, `origemCurriculo: RecOrigemCurriculo`, `quemIndicou: String?`, `cvUrl: String?`, `cvPublicId: String?`, `cvOriginalFilename: String?`, `cvMimeType: String?`, `cvSizeBytes: Int?`, `cvHash: String?`, `situacao: RecSituacaoCandidato`, `situacaoFinal: RecSituacaoCandidato?`, `dataSituacaoFinal: DateTime?`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `operacao: Operacao?`, `candidatura: Candidatura?`, `vaga: RecVaga?`, `etapas: RecCandidatoEtapa[]`.

**Constraints/índices declarados:**

```prisma
@@index([empresaId])
@@index([operacaoId])
@@index([situacao])
@@index([vagaId])
@@index([empresaId, situacao])
```

### RecCandidatoEtapa

**Campos:** `id: String`, `candidatoId: String`, `chave: String`, `ordem: Int`, `resultado: RecResultadoEtapa`, `observacao: String?`, `avaliadoPor: String?`, `avaliadoEm: DateTime?`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `candidato: RecCandidato`, `avaliador: User?`.

**Constraints/índices declarados:**

```prisma
@@unique([candidatoId, chave])
@@index([candidatoId])
```

### RecCandidatoInterno

**Campos:** `id: String`, `empresaId: String`, `operacaoId: String?`, `userId: String?`, `nome: String`, `cargoAtual: String?`, `setorAtual: String?`, `tempoFuncao: String?`, `cargoPretendido: String?`, `avaliacaoCiclo: String?`, `possuiRequisitos: Boolean`, `matrizOuFilial: String?`, `observacoes: String?`, `futurosCargos: String[]`, `situacao: RecSituacaoInterno`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `operacao: Operacao?`, `user: User?`.

**Constraints/índices declarados:**

```prisma
@@index([empresaId])
@@index([operacaoId])
@@index([situacao])
@@index([userId])
```

### RecSucessao

**Campos:** `id: String`, `empresaId: String`, `operacaoId: String?`, `cargoSucessao: String`, `areaCargoSucessao: String?`, `functionId: String?`, `nomeSucessor: String`, `sucessorId: String?`, `cargoAtualSucessor: String?`, `prontoAgora: Boolean`, `pronto1Ano: Boolean`, `pronto2Anos: Boolean`, `habilidadeTecnica: String?`, `habilidadeComportamental: String?`, `planoDesenvolvimento: String?`, `inicioMapeamento: DateTime?`, `houveMovimentacao: Boolean?`, `observacao: String?`, `mesAno: String?`, `cicloGente: String?`, `ativo: Boolean`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `operacao: Operacao?`, `sucessor: User?`, `funcao: Function?`.

**Constraints/índices declarados:**

```prisma
@@index([empresaId])
@@index([operacaoId])
@@index([ativo])
@@index([sucessorId])
```

### QuadroColaborador

**Campos:** `id: String`, `empresaId: String`, `operacaoId: String?`, `userId: String?`, `nome: String`, `cargo: String?`, `area: String?`, `ativo: Boolean`, `matricula: String?`, `cpf: String?`, `dataAdmissao: DateTime?`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `operacao: Operacao?`, `user: User?`.

**Constraints/índices declarados:**

```prisma
@@index([empresaId])
@@index([operacaoId])
@@index([userId])
@@index([empresaId, matricula])
@@index([empresaId, ativo])
```

### QuadroDesligamento

**Campos:** `id: String`, `empresaId: String`, `operacaoId: String?`, `userId: String?`, `nome: String`, `cargo: String?`, `area: String?`, `setor: SetorOperacional?`, `dataDesligamento: DateTime`, `motivo: String?`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `operacao: Operacao?`, `user: User?`.

**Constraints/índices declarados:**

```prisma
@@index([empresaId])
@@index([operacaoId])
@@index([dataDesligamento])
@@index([userId])
```

### QuadroPcd

**Campos:** `id: String`, `empresaId: String`, `operacaoId: String?`, `userId: String?`, `nome: String`, `admissao: DateTime?`, `funcao: String?`, `tipo: String?`, `deficiencia: String?`, `sexo: String?`, `cor: String?`, `laudoBlobKey: String?`, `laudoOriginalFilename: String?`, `laudoMimeType: String?`, `laudoSizeBytes: Int?`, `ativo: Boolean`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `operacao: Operacao?`, `user: User?`.

**Constraints/índices declarados:**

```prisma
@@index([empresaId])
@@index([operacaoId])
@@index([empresaId, ativo])
```

### QuadroPcdMeta

**Campos:** `id: String`, `empresaId: String`, `operacaoId: String?`, `ano: Int`, `mes: Int`, `meta: Int`, `real: Int`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `operacao: Operacao?`.

**Constraints/índices declarados:**

```prisma
@@unique([empresaId, operacaoId, ano, mes])
@@index([empresaId, ano])
```

### QuadroFrontlineCargo

**Campos:** `id: String`, `empresaId: String`, `operacaoId: String`, `cargo: String`, `atividade: String?`, `departamento: SetorOperacional`, `qlpMeta: Int`, `qlpReal: Int`, `ativo: Boolean`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `operacao: Operacao`.

**Constraints/índices declarados:**

```prisma
@@unique([operacaoId, departamento, cargo])
@@index([empresaId, ativo])
@@index([operacaoId])
```

### QuadroFrontlineMes

**Campos:** `id: String`, `empresaId: String`, `operacaoId: String`, `departamento: SetorOperacional`, `ano: Int`, `mes: Int`, `percentual: Float`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `operacao: Operacao`.

**Constraints/índices declarados:**

```prisma
@@unique([operacaoId, departamento, ano, mes])
@@index([empresaId, ano])
```

### QuadroFrontlineTeto

**Campos:** `id: String`, `empresaId: String`, `ano: Int`, `percentual: Float`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`.

**Constraints/índices declarados:**

```prisma
@@unique([empresaId, ano])
```

### QuadroAprendiz

**Campos:** `id: String`, `empresaId: String`, `operacaoId: String?`, `userId: String?`, `nome: String`, `admissao: DateTime?`, `funcao: String?`, `centroCusto: String?`, `departamento: String?`, `setor: SetorOperacional?`, `sexo: String?`, `dataNascimento: DateTime?`, `gestorNome: String?`, `gestorId: String?`, `fundacao: String?`, `horario: String?`, `inicioContrato: DateTime?`, `terminoContrato: DateTime?`, `situacao: QuadroAprendizSituacao`, `createdAt: DateTime`, `updatedAt: DateTime`.

**Relações:** `empresa: Empresa`, `operacao: Operacao?`, `user: User?`, `gestor: User?`.

**Constraints/índices declarados:**

```prisma
@@index([empresaId])
@@index([operacaoId])
@@index([situacao])
@@index([terminoContrato])
```

### Modelos legados preservados

`GlobalGoal`, `MetaPontuacao`, `PointsLedger`, `RedemptionOrder`, `RewardProduct`, `TaskDefinition`, `TaskInstance`. Estruturas continuam presentes; não são indicação para reativar a experiência retirada.

## Enums

- **Role:** `USER`, `GESTOR`, `RH_ADMIN`, `SYS_ADMIN`.
- **Nivel:** `COLABORADOR`, `COORDENADOR`, `GERENTE`, `DIRETOR`, `PRESIDENTE`, `SUPERVISOR`, `DIRETO`.
- **Frequency:** `DAILY`, `WEEKLY`, `MONTHLY`.
- **TaskStatus:** `PENDING`, `BLOCKED`, `DONE`, `APPROVED`, `REJECTED`.
- **LedgerKind:** `EARN`, `REDEEM`, `ADJUST`, `REVERSAL`.
- **LedgerStatus:** `CONFIRMED`, `PENDING`.
- **OrderStatus:** `REQUESTED`, `APPROVED`, `DELIVERED`, `CANCELED`.
- **LeaderVisitStatus:** `valid`, `blocked_gps`, `blocked_face`.
- **RegistrationStatus:** `PENDING`, `APPROVED`, `REJECTED`.
- **UPBMatriculaStatus:** `PENDENTE`, `APROVADO`, `NEGADO`.
- **EtapaCandidatura:** `RECEBIDO`, `TRIAGEM`, `ENTREVISTA`, `APROVADO`, `REJEITADO`, `ARQUIVADO`.
- **TipoNotaCandidatura:** `NOTA`, `MUDANCA_ETAPA`, `SISTEMA`.
- **SetorOperacional:** `DPO`, `SPO`.
- **RecVagaStatus:** `ABERTA`, `FECHADA`, `CANCELADA`.
- **RecStatusFechamento:** `ABERTA_NO_PRAZO`, `ABERTA_VENCIDA`, `FECHADA_NO_PRAZO`, `FECHADA_FORA_PRAZO`.
- **RecResultadoEtapa:** `OK`, `NAO`, `NA`.
- **RecSituacaoCandidato:** `EM_STAND_BY`, `EM_ANDAMENTO`, `CONTRATADO`, `INDISPONIVEL`, `NAO_CONTRATADO`.
- **RecOrigemCurriculo:** `PORTAL_CARREIRAS`, `APLICATIVO`, `WHATSAPP`, `EMAIL`, `INDICACAO`, `OUTRO`.
- **RecSituacaoInterno:** `AGUARDANDO`, `PROMOVIDO`, `NAO_ATENDE`, `DESLIGADO`, `OUTRA`.
- **QuadroAprendizSituacao:** `VIGENTE`, `ENCERRADO`, `DESLIGADO`.

## Migrações ordenadas

- `20260413000000_baseline`
- `20260413000001_indexes_softdelete`
- `20260415000000_filiais_lideres`
- `20260416000000_upb_world_class`
- `20260420144533_add_leader_visits`
- `20260420183245_add_visitas_admin`
- `20260428000000_user_provisioning_world_class`
- `20260430000000_leader_visit_status_enum`
- `20260430010000_add_visita_obrigatoria`
- `20260501000000_add_missing_indexes`
- `20260501010000_add_push_subscription`
- `20260501020000_add_totp_fields`
- `20260502000000_add_backup_system`
- `20260921000000_add_gente_recrutamento_quadro`
- `20260922000000_add_curso_reccargo`
- `20260922120000_add_quadro_frontline`
- `20260923000000_add_publicacao_reccargo`
- `20260923120000_publicar_cargo_por_padrao`
- `20260923150000_add_frontline_reccargo`
- `20260924000000_add_importacao_recvaga`
- `20260924120000_add_dados_pessoais_quadro`
- `20260930000000_add_perfil_triagem_candidatura`
- `20261019000000_complete_portal_schema`

## Scripts npm

Os comandos abaixo refletem `package.json`. Listagem não significa execução nesta sessão. `db:push`, `db:migrate` e `db:seed` exigem atenção ao banco-alvo; para produção a operação utilizada foi `npx prisma migrate deploy`.

### `npm run dev`

```bash
next dev
```

### `npm run build`

```bash
next build
```

### `npm run postinstall`

```bash
prisma generate
```

### `npm run start`

```bash
next start
```

### `npm run lint`

```bash
next lint
```

### `npm run test:unit`

```bash
node --import tsx --test tests/auth-helpers.test.ts tests/gente-vaga-sla.test.ts tests/gente-scope.test.ts tests/gente-vaga-importador.test.ts tests/gente-etapas.test.ts tests/gente-candidato-importador.test.ts tests/gente-dashboard.test.ts tests/gente-quadro.test.ts tests/gente-cpf.test.ts tests/gente-matriz-filial.test.ts tests/gente-polos.test.ts tests/gente-sobreposicao.test.ts tests/gente-laudo-arquivo.test.ts tests/gente-modelos.test.ts tests/gente-cotas.test.ts tests/gente-aderencia.test.ts tests/gente-sucessao.test.ts tests/gente-exportacao.test.ts tests/gente-dock.test.ts tests/gente-planilha-leitura.test.ts tests/gente-pipeline.test.ts tests/gente-cargo-importador.test.ts tests/gente-frontline.test.ts tests/gente-cargo-publico.test.ts tests/gente-frontline-cargo.test.ts tests/gente-cargo-contrato.test.ts tests/gente-interno-contrato.test.ts tests/gente-painel-frontline.test.ts tests/gente-vaga-lotes.test.ts tests/gente-cargo-agrupado.test.ts tests/talentos-transicoes.test.ts tests/carreiras-perfil.test.ts tests/carreiras-retencao.test.ts tests/feed-api.test.ts tests/middleware-access.test.ts tests/notifications-api.test.ts tests/performance-scalability.test.ts tests/store-service.test.ts tests/task-service.test.ts tests/usuario-permissoes.test.ts tests/validations-edge-cases.test.ts tests/visitas-api.test.ts tests/backup.test.ts tests/services/*.test.ts
```

### `npm run test:integration`

```bash
node --import tsx --test tests/auditoria-deep.test.ts tests/colaborador-flow.test.ts tests/concorrencia.test.ts tests/cross-tenant.test.ts tests/financeiro-consolidado.test.ts tests/gestor-flow.test.ts tests/obz-concorrencia.test.ts tests/obz-lancamento-flow.test.ts tests/obz-notificar-pendentes.test.ts tests/obz-rollback.test.ts tests/obz-seguranca.test.ts tests/obz-template-tendencia.test.ts tests/seguranca-acesso.test.ts tests/universidade-flow.test.ts
```

### `npm run test`

```bash
npm run test:unit
```

### `npm run test:coverage`

```bash
c8 --reporter=lcov --reporter=text node --import tsx --test tests/auth-helpers.test.ts tests/feed-api.test.ts tests/middleware-access.test.ts tests/notifications-api.test.ts tests/performance-scalability.test.ts tests/store-service.test.ts tests/task-service.test.ts tests/usuario-permissoes.test.ts tests/validations-edge-cases.test.ts tests/services/*.test.ts
```

### `npm run test:e2e`

```bash
playwright test
```

### `npm run db:generate`

```bash
prisma generate
```

### `npm run db:push`

```bash
prisma db push
```

### `npm run db:migrate`

```bash
prisma migrate dev
```

### `npm run db:seed`

```bash
tsx prisma/seed.ts
```

### `npm run db:studio`

```bash
prisma studio
```

## Arquivos de testes

Não usar esta lista como declaração de cobertura aprovada. Testes legados podem ter expectativas superadas.

- `tests/auditoria-deep.test.ts`
- `tests/auth-helpers.test.ts`
- `tests/backup.test.ts`
- `tests/carreiras-perfil.test.ts`
- `tests/carreiras-retencao.test.ts`
- `tests/colaborador-flow.test.ts`
- `tests/concorrencia.test.ts`
- `tests/cross-tenant.test.ts`
- `tests/e2e/hub.spec.ts`
- `tests/e2e/login-flow.spec.ts`
- `tests/e2e/portal-colaborador.spec.ts`
- `tests/feed-api.test.ts`
- `tests/financeiro-consolidado.test.ts`
- `tests/gente-aderencia.test.ts`
- `tests/gente-candidato-importador.test.ts`
- `tests/gente-cargo-agrupado.test.ts`
- `tests/gente-cargo-contrato.test.ts`
- `tests/gente-cargo-importador.test.ts`
- `tests/gente-cargo-publico.test.ts`
- `tests/gente-cotas.test.ts`
- `tests/gente-cpf.test.ts`
- `tests/gente-dashboard.test.ts`
- `tests/gente-dock.test.ts`
- `tests/gente-etapas.test.ts`
- `tests/gente-exportacao.test.ts`
- `tests/gente-frontline-cargo.test.ts`
- `tests/gente-frontline.test.ts`
- `tests/gente-interno-contrato.test.ts`
- `tests/gente-laudo-arquivo.test.ts`
- `tests/gente-matriz-filial.test.ts`
- `tests/gente-modelos.test.ts`
- `tests/gente-painel-frontline.test.ts`
- `tests/gente-pipeline.test.ts`
- `tests/gente-planilha-leitura.test.ts`
- `tests/gente-polos.test.ts`
- `tests/gente-quadro.test.ts`
- `tests/gente-scope.test.ts`
- `tests/gente-sobreposicao.test.ts`
- `tests/gente-sucessao.test.ts`
- `tests/gente-vaga-importador.test.ts`
- `tests/gente-vaga-lotes.test.ts`
- `tests/gente-vaga-sla.test.ts`
- `tests/gestor-flow.test.ts`
- `tests/middleware-access.test.ts`
- `tests/notifications-api.test.ts`
- `tests/obz-concorrencia.test.ts`
- `tests/obz-lancamento-flow.test.ts`
- `tests/obz-notificar-pendentes.test.ts`
- `tests/obz-rollback.test.ts`
- `tests/obz-seguranca.test.ts`
- `tests/obz-template-tendencia.test.ts`
- `tests/performance-scalability.test.ts`
- `tests/provisioning-api.test.ts`
- `tests/score-api.test.ts`
- `tests/seguranca-acesso.test.ts`
- `tests/services/StoreService.test.ts`
- `tests/services/TaskService.test.ts`
- `tests/services/UserService.test.ts`
- `tests/store-service.test.ts`
- `tests/support/external-mocks.ts`
- `tests/support/integration-base.ts`
- `tests/support/session-user.ts`
- `tests/talentos-transicoes.test.ts`
- `tests/task-service.test.ts`
- `tests/universidade-flow.test.ts`
- `tests/usuario-permissoes.test.ts`
- `tests/validations-edge-cases.test.ts`
- `tests/visitas-api.test.ts`

## Variáveis referenciadas no código

Somente nomes e locais de referência. Não são valores nem uma lista de obrigatoriedade. Variáveis usadas apenas em testes/scripts podem ter finalidades distintas.

| Nome | Exemplos de referência |
| --- | --- |
| `ADMIN_EMAIL` | `scripts/test-usuarios.ts` |
| `ADMIN_PASS` | `scripts/test-usuarios.ts` |
| `BLOB_READ_WRITE_TOKEN` | `src/app/api/admin/backup/[jobId]/download/route.ts`, `src/app/api/gente/pcd/[id]/laudo/route.ts` |
| `CLOUDINARY_API_KEY` | `src/app/api/admin/rh/candidaturas/[id]/cv-url/route.ts`, `src/lib/carreiras-cv.ts`, `src/lib/cv-signed-url.ts` |
| `CLOUDINARY_API_SECRET` | `src/app/api/admin/rh/candidaturas/[id]/cv-url/route.ts`, `src/lib/carreiras-cv.ts`, `src/lib/cv-signed-url.ts` |
| `CLOUDINARY_CLOUD_NAME` | `src/app/api/admin/rh/candidaturas/[id]/cv-url/route.ts`, `src/app/api/admin/rh/importar-cv/route.ts`, `src/app/api/carreiras/upload-cv/route.ts` (e outras referências) |
| `CLOUDINARY_CV_PRESET` | `src/app/api/admin/rh/importar-cv/route.ts`, `src/app/api/carreiras/upload-cv/route.ts` |
| `CLOUDINARY_UPLOAD_PRESET` | `src/app/api/upload/route.ts`, `src/app/api/visitas/cadastrar-face/route.ts`, `src/app/api/visitas/checkin/route.ts` |
| `CRON_SECRET` | `src/app/api/cron/backup/route.ts`, `src/app/api/cron/daily-reminder/route.ts`, `src/app/api/cron/limpar-cvs/route.ts` |
| `EMAIL_ADMIN` | `scripts/test-email.ts`, `src/app/api/contato/route.ts` |
| `EMAIL_FROM` | `scripts/test-email.ts`, `src/lib/email.ts` |
| `LOG_LEVEL` | `src/lib/logger.ts` |
| `NEXTAUTH_SECRET` | `src/app/api/auth/totp/verify/route.ts`, `src/lib/auth.ts` |
| `NEXTAUTH_URL` | `src/app/app/loja/page.tsx`, `src/lib/auth.ts`, `src/lib/email.ts` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `src/app/app/perfil/page.tsx` |
| `NODE_ENV` | `next.config.js`, `sentry.client.config.ts`, `sentry.edge.config.ts` (e outras referências) |
| `RESEND_API_KEY` | `scripts/test-email.ts`, `src/lib/email.ts` |
| `SENTRY_AUTH_TOKEN` | `next.config.js` |
| `UPSTASH_REDIS_REST_TOKEN` | `src/lib/auth.ts`, `src/lib/rate-limit.ts`, `src/lib/redis.ts` |
| `UPSTASH_REDIS_REST_URL` | `src/lib/auth.ts`, `src/lib/rate-limit.ts`, `src/lib/redis.ts` |

## Bibliotecas de domínio para encontrar regras

- `src/lib/gente/aderencia.ts`
- `src/lib/gente/api.ts`
- `src/lib/gente/candidato-importador.ts`
- `src/lib/gente/candidato.ts`
- `src/lib/gente/cargo-agrupado.ts`
- `src/lib/gente/cargo-importador.ts`
- `src/lib/gente/cargo-publico.ts`
- `src/lib/gente/cargo.ts`
- `src/lib/gente/cotas.ts`
- `src/lib/gente/cpf.ts`
- `src/lib/gente/dashboard.ts`
- `src/lib/gente/etapas.ts`
- `src/lib/gente/exportacao-xlsx.ts`
- `src/lib/gente/exportacao.ts`
- `src/lib/gente/frontline-cargo.ts`
- `src/lib/gente/frontline.ts`
- `src/lib/gente/importar-handler.ts`
- `src/lib/gente/laudo-arquivo.ts`
- `src/lib/gente/lista-campo.ts`
- `src/lib/gente/matriz-filial.ts`
- `src/lib/gente/modelos.ts`
- `src/lib/gente/painel-frontline.ts`
- `src/lib/gente/pcd-importador.ts`
- `src/lib/gente/pcd.ts`
- `src/lib/gente/pipeline.ts`
- `src/lib/gente/planilha-leitura.ts`
- `src/lib/gente/polos.ts`
- `src/lib/gente/quadro-importador.ts`
- `src/lib/gente/quadro.ts`
- `src/lib/gente/responder-exportacao.ts`
- `src/lib/gente/scope.ts`
- `src/lib/gente/sobreposicao.ts`
- `src/lib/gente/sucessao.ts`
- `src/lib/gente/vaga-importador.ts`
- `src/lib/gente/vaga-lotes.ts`
- `src/lib/gente/vaga-sla.ts`
- `src/lib/gente/vaga.ts`

## Dependências declaradas

Faixas abaixo vêm do package.json; consultar package-lock.json para as versões resolvidas.

| Pacote | Faixa | Grupo |
| --- | --- | --- |
| `@auth/prisma-adapter` | `^2.4.2` | dependencies |
| `@dnd-kit/core` | `^6.3.1` | dependencies |
| `@dnd-kit/sortable` | `^10.0.0` | dependencies |
| `@dnd-kit/utilities` | `^3.2.2` | dependencies |
| `@prisma/client` | `^5.17.0` | dependencies |
| `@radix-ui/react-avatar` | `^1.1.0` | dependencies |
| `@radix-ui/react-dialog` | `^1.1.1` | dependencies |
| `@radix-ui/react-dropdown-menu` | `^2.1.1` | dependencies |
| `@radix-ui/react-label` | `^2.1.0` | dependencies |
| `@radix-ui/react-progress` | `^1.1.0` | dependencies |
| `@radix-ui/react-scroll-area` | `^1.1.0` | dependencies |
| `@radix-ui/react-select` | `^2.1.1` | dependencies |
| `@radix-ui/react-separator` | `^1.1.0` | dependencies |
| `@radix-ui/react-slot` | `^1.1.0` | dependencies |
| `@radix-ui/react-tabs` | `^1.1.0` | dependencies |
| `@radix-ui/react-toast` | `^1.2.1` | dependencies |
| `@radix-ui/react-tooltip` | `^1.1.2` | dependencies |
| `@sentry/nextjs` | `^10.48.0` | dependencies |
| `@upstash/ratelimit` | `^2.0.8` | dependencies |
| `@upstash/redis` | `^1.37.0` | dependencies |
| `@vercel/blob` | `^2.3.3` | dependencies |
| `@vercel/functions` | `^3.4.3` | dependencies |
| `@vladmandic/face-api` | `^1.7.15` | dependencies |
| `bcryptjs` | `^2.4.3` | dependencies |
| `canvas-confetti` | `^1.9.4` | dependencies |
| `class-variance-authority` | `^0.7.0` | dependencies |
| `clsx` | `^2.1.1` | dependencies |
| `cmdk` | `^1.1.1` | dependencies |
| `framer-motion` | `^11.3.0` | dependencies |
| `lucide-react` | `^0.441.0` | dependencies |
| `next` | `^14.2.35` | dependencies |
| `next-auth` | `^4.24.7` | dependencies |
| `next-cloudinary` | `^6.17.5` | dependencies |
| `next-pwa` | `^5.6.0` | dependencies |
| `next-themes` | `^0.4.6` | dependencies |
| `nodemailer` | `^7.0.13` | dependencies |
| `otpauth` | `^9.5.1` | dependencies |
| `pdf-parse` | `1.1.1` | dependencies |
| `qrcode` | `^1.5.4` | dependencies |
| `react` | `^18` | dependencies |
| `react-dom` | `^18` | dependencies |
| `recharts` | `^3.8.1` | dependencies |
| `resend` | `^6.10.0` | dependencies |
| `swr` | `^2.4.1` | dependencies |
| `tailwind-merge` | `^2.5.2` | dependencies |
| `tailwindcss-animate` | `^1.0.7` | dependencies |
| `web-push` | `^3.6.7` | dependencies |
| `xlsx` | `^0.18.5` | dependencies |
| `zod` | `^3.23.8` | dependencies |
| `@playwright/test` | `^1.59.1` | devDependencies |
| `@types/bcryptjs` | `^2.4.6` | devDependencies |
| `@types/canvas-confetti` | `^1.9.0` | devDependencies |
| `@types/node` | `^20` | devDependencies |
| `@types/nodemailer` | `^6.4.0` | devDependencies |
| `@types/pdf-parse` | `^1.1.5` | devDependencies |
| `@types/qrcode` | `^1.5.6` | devDependencies |
| `@types/react` | `^18` | devDependencies |
| `@types/react-dom` | `^18` | devDependencies |
| `@types/web-push` | `^3.6.4` | devDependencies |
| `@vitest/ui` | `^4.1.4` | devDependencies |
| `autoprefixer` | `^10.4.20` | devDependencies |
| `c8` | `^11.0.0` | devDependencies |
| `eslint` | `^8.57.1` | devDependencies |
| `eslint-config-next` | `^14.2.35` | devDependencies |
| `postcss` | `^8` | devDependencies |
| `prisma` | `^5.17.0` | devDependencies |
| `tailwindcss` | `^3.4.1` | devDependencies |
| `tsx` | `^4.19.0` | devDependencies |
| `typescript` | `^5` | devDependencies |
| `vitest` | `^4.1.4` | devDependencies |
| `wait-on` | `^9.0.4` | devDependencies |

---

<!-- Fonte: 07-CRONOLOGIA-E-HISTORICO.md -->

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

---

<!-- Fonte: 08-PROMPT-PARA-NOVO-AGENTE.md -->

# Prompt pronto para o próximo agente

Copie o texto abaixo para iniciar o agente no repositório. Se ele receber apenas anexos, envie também `CONTEXTO-COMPLETO.md`; sem acesso ao código e às contas, ele não deve afirmar verificações que não realizou.

```text
Você vai continuar o desenvolvimento do Portal Pau Brasil existente, não reconstruí-lo do zero.

Leia primeiro PauBrasil-main/docs/contexto-agente/00-LEIA-PRIMEIRO.md e os documentos numerados dessa pasta (ou CONTEXTO-COMPLETO.md). Consulte os históricos antigos apenas com a distinção entre registro histórico e estado atual.

Fatos da última entrega validada em 19/10/2026:
- Repositório: henriquediiniz/Pau_brasil_development, branch main.
- O package.json está na subpasta PauBrasil-main, um nível abaixo da raiz Git.
- Produção: https://pau-brasil-development.vercel.app.
- Vercel: scope henrique-dev2, projeto pau-brasil-development, Root Directory PauBrasil-main, Node 24.x.
- Commit-base funcional publicado: f77afba; commit anterior da simplificação do portal: 834fdda.
- Banco Neon conectado; 23 migrações aplicadas; 48 modelos Prisma consultados sem erro.
- Login corporativo validado: henriquediniz.dev@grupopaubrasil.com.br, SYS_ADMIN. Senha/tokens não estão nos documentos.
- O domínio de e-mail aceito é grupopaubrasil.com.br, definido em src/lib/config.ts.
- Gamificação saiu da navegação e experiência do colaborador. Não restaurar recursos porque arquivos legados ainda existem. Não apagar tabelas/histórico sem uma tarefa específica.
- O início atual reúne Universidade, perfil, ajuda e acessos de gestão conforme permissões.
- A nova produção não recebeu uma cópia integral da base local ou histórica.

Antes de editar:
1. Veja git status, diff e commits atuais; não reverta mudanças de terceiros.
2. Confirme qual diretório é a raiz Git e qual é a aplicação.
3. Identifique o domínio da tarefa e os helpers/rotas/tests pertinentes.
4. Verifique as permissões no servidor e o isolamento por empresa/operação, não só no menu.
5. Não execute testes mutantes ou seeds completos no banco de produção.

Prioridades técnicas já observadas, ainda não implementadas:
- Cobertura de backup/export/import dos modelos Gente/Quadro.
- Isolamento real entre Preview/Development/Production no Neon/Vercel.
- Política de câmera/geolocalização para Visitas.
- Configuração dos serviços externos de e-mail, upload, arquivos privados e push conforme o uso.
- Atualização do manifest PWA e das expectativas E2E para o portal simplificado.
- CI na raiz Git correta e revisão dos registros históricos superados.
Essas prioridades são contexto; siga primeiro a tarefa atual do usuário, sem iniciar tudo de uma vez.

Trabalhe de forma incremental, preserve a identidade visual e reforce regras existentes com testes relevantes. O usuário espera execução completa e objetiva, sem repetidas confirmações para passos já autorizados. Informe com precisão se o resultado está local, commitado, enviado, em build ou publicado/validado. Se algo depender de ação pessoal do usuário, explique o bloqueio concreto e continue o que for independente.

Ao terminar, atualize a documentação com mudanças, validações reais, limites, commit e URL de deploy quando houver. Não diga que toda a suíte ou toda a aplicação passou se só testou parte dela.
```

## Primeira resposta esperada do agente

Após ler o contexto e examinar o workspace, apresentar brevemente: entendimento do produto atual; arquivos já alterados; escopo da próxima tarefa; principal risco a validar. Depois executar a tarefa solicitada. Não repetir o pacote inteiro ao usuário nem reabrir a discussão sobre funcionalidades já retiradas.
