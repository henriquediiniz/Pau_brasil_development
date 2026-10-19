# Mapa do Sistema

> **Atualização de contexto — 19/10/2026:** Mapa histórico: módulos e contagens abaixo não representam integralmente a versão atual. Leia o [contexto atual](contexto-agente/00-LEIA-PRIMEIRO.md) e o [inventário técnico](contexto-agente/06-INVENTARIO-TECNICO.md) antes de desenvolver.

## Visão Geral

Este projeto é um portal corporativo monolítico em Next.js com foco em operação interna, engajamento, gestão, universidade corporativa, financeiro/OBZ e score de clientes.

Base técnica principal:

- Next.js 14 com App Router
- React 18 + TypeScript
- Prisma + PostgreSQL
- NextAuth com credenciais
- Tailwind CSS
- PWA com `next-pwa`
- Upload de imagens via Cloudinary

Indicadores estruturais observados:

- Cerca de 190 arquivos TypeScript
- 53 páginas `page.tsx`
- 102 rotas `route.ts`
- 38 modelos no Prisma

## Fluxo de Entrada da Aplicação

Os principais pontos de entrada e composição são:

- `src/app/layout.tsx`
  - layout raiz, metadata global, carregamento de providers
- `src/app/providers.tsx`
  - `SessionProvider` do NextAuth e toaster global
- `src/app/login/page.tsx`
  - tela de autenticação
- `src/app/app/layout.tsx`
  - shell principal da aplicação autenticada, navegação, notificações e regras de exibição por perfil
- `src/middleware.ts`
  - proteção de rotas e redirecionamentos por perfil, nível e empresa
- `src/lib/auth.ts`
  - autenticação, sessão JWT e enriquecimento do usuário logado

## Camadas Principais

### 1. Interface Web

Fica em `src/app` e usa o App Router como estrutura principal.

Áreas de interface por domínio:

- `src/app/app`
  - área autenticada principal do colaborador
- `src/app/gestor`
  - gestão de equipe
- `src/app/coord`
  - coordenação e aprovações
- `src/app/empresa`
  - painel administrativo por empresa
- `src/app/universidade`
  - universidade corporativa
- `src/app/obz`
  - visão operacional do orçamento
- `src/app/financeiro`
  - visão gerencial do orçamento
- `src/app/score`
  - score de clientes
- `src/app/admin`
  - administração global

### 2. APIs Internas

Ficam em `src/app/api` e concentram integrações, validações e parte importante das regras de negócio.

Grupos principais:

- `admin`
  - empresas, usuários, funções, metas, produtos, aprovações, universidade
- `tasks`, `checklist`, `agenda`, `atividades`
  - fluxo operacional de tarefas diárias e avulsas
- `pontos`, `ranking`, `conquistas`, `resgates`, `loja`
  - gamificação
- `gestor`, `coord`, `relatorio`
  - gestão e aprovação
- `empresa`
  - operação e colaboradores por empresa
- `universidade`
  - temporadas, acesso, progresso, quiz, certificados
- `obz`, `financeiro`
  - estrutura orçamentária, lançamentos, consolidação e reconciliação
- `score`
  - ingestão, consulta e ranking de score de clientes
- `notifications`, `feed`, `cron`
  - comunicação, eventos e rotinas agendadas

### 3. Regras de Negócio Compartilhadas

Ficam em `src/lib`.

Arquivos centrais:

- `auth.ts`
  - sessão, autenticação e dados do usuário
- `auth-helpers.ts`
  - helpers de permissão e papel
- `checklist.ts`
  - geração de checklist e tarefas do dia
- `points.ts`
  - saldo e evolução de pontuação
- `badges.ts`
  - cálculo de conquistas
- `audit.ts`
  - trilha de auditoria
- `notify.ts`
  - notificações persistidas
- `prisma.ts`
  - cliente Prisma singleton
- `format.ts`
  - utilitários de formatação

### 4. Dados e Persistência

Ficam em `prisma`.

Arquivos principais:

- `prisma/schema.prisma`
  - modelo de dados principal
- `prisma/seed.ts`
  - seed legado do portal original
- `prisma/seed-empresas.ts`
  - seed voltado para empresas e operações

## Mapa de Domínio

### Colaborador e Gamificação

Objetivo:

- executar tarefas do dia
- acumular pontos
- acompanhar ranking
- resgatar recompensas
- visualizar histórico, perfil e conquistas

Páginas principais:

- `src/app/app/inicio/page.tsx`
- `src/app/app/hoje/page.tsx`
- `src/app/app/agenda/page.tsx`
- `src/app/app/historico/page.tsx`
- `src/app/app/pontos/page.tsx`
- `src/app/app/ranking/page.tsx`
- `src/app/app/loja/page.tsx`
- `src/app/app/resgates/page.tsx`
- `src/app/app/conquistas/page.tsx`
- `src/app/app/perfil/page.tsx`

APIs principais:

- `src/app/api/checklist/route.ts`
- `src/app/api/tasks/adhoc/route.ts`
- `src/app/api/tasks/[id]/complete/route.ts`
- `src/app/api/tasks/[id]/review/route.ts`
- `src/app/api/pontos/route.ts`
- `src/app/api/pontos/evolucao/route.ts`
- `src/app/api/ranking/route.ts`
- `src/app/api/conquistas/route.ts`
- `src/app/api/loja/route.ts`
- `src/app/api/resgates/route.ts`
- `src/app/api/historico/route.ts`

Modelos relacionados:

- `TaskDefinition`
- `TaskInstance`
- `PointsLedger`
- `RewardProduct`
- `RedemptionOrder`
- `FeedEvent`
- `GlobalGoal`
- `Notification`

### Gestão e Coordenação

Objetivo:

- acompanhar equipe
- aprovar tarefas
- controlar metas e relatórios

Páginas principais:

- `src/app/gestor/dashboard/page.tsx`
- `src/app/gestor/aprovacoes/page.tsx`
- `src/app/gestor/relatorio/page.tsx`
- `src/app/gestor/metas/page.tsx`
- `src/app/gestor/auditoria/page.tsx`
- `src/app/coord/aprovacoes/page.tsx`
- `src/app/coord/atividades/page.tsx`

APIs principais:

- `src/app/api/gestor/dashboard/route.ts`
- `src/app/api/gestor/aprovacoes/route.ts`
- `src/app/api/gestor/metas/route.ts`
- `src/app/api/coord/aprovacoes/route.ts`
- `src/app/api/coord/atividades/route.ts`
- `src/app/api/relatorio/[userId]/route.ts`

Modelos relacionados:

- `User`
- `MetaPontuacao`
- `TaskInstance`
- `AuditLog`

### Empresa

Objetivo:

- administrar colaboradores por empresa
- manter funções e operações
- limitar acesso por escopo organizacional

Páginas principais:

- `src/app/empresa/page.tsx`
- `src/app/empresa/usuarios/page.tsx`
- `src/app/empresa/funcoes/page.tsx`

APIs principais:

- `src/app/api/empresa/usuarios/route.ts`
- `src/app/api/empresa/usuarios/[id]/route.ts`
- `src/app/api/empresa/operacoes/route.ts`
- `src/app/api/admin/empresas/route.ts`
- `src/app/api/admin/funcoes/route.ts`

Modelos relacionados:

- `Empresa`
- `Operacao`
- `User`
- `Function`

### Universidade PB

Objetivo:

- disponibilizar treinamentos
- controlar acesso por empresa, unidade e função
- registrar progresso, quiz e certificados

Páginas principais:

- `src/app/universidade/page.tsx`
- `src/app/universidade/[temporadaId]/page.tsx`
- `src/app/universidade/[temporadaId]/quiz/page.tsx`
- `src/app/universidade/certificados/page.tsx`
- `src/app/admin/upb/page.tsx`
- `src/app/admin/upb/relatorio/page.tsx`

APIs principais:

- `src/app/api/universidade/temporadas/route.ts`
- `src/app/api/universidade/acesso/[temporadaId]/route.ts`
- `src/app/api/universidade/progresso/route.ts`
- `src/app/api/universidade/quiz/[temporadaId]/route.ts`
- `src/app/api/universidade/certificados/route.ts`
- `src/app/api/admin/upb/temporadas/route.ts`
- `src/app/api/admin/upb/matriculas/route.ts`
- `src/app/api/admin/upb/obrigatorios/route.ts`
- `src/app/api/admin/upb/episodios/route.ts`
- `src/app/api/admin/upb/questoes/route.ts`
- `src/app/api/admin/upb/relatorio/route.ts`

Modelos relacionados:

- `UPBTemporada`
- `UPBObrigatorio`
- `UPBQuestao`
- `UPBQuestaoOpcao`
- `UPBQuizTentativa`
- `UPBMatricula`
- `UPBEpisodio`
- `UPBProgresso`
- `UPBCertificado`

### OBZ e Financeiro

Objetivo:

- estruturar orçamento base zero
- registrar lançamentos
- justificar desvios
- consolidar visão gerencial
- reconciliar valores contábeis

Páginas principais:

- `src/app/obz/page.tsx`
- `src/app/obz/justificativas/page.tsx`
- `src/app/financeiro/page.tsx`
- `src/app/financeiro/orcamento-anual/page.tsx`
- `src/app/financeiro/periodo/page.tsx`
- `src/app/financeiro/reconciliacao/page.tsx`
- `src/app/admin/obz/page.tsx`

APIs principais:

- `src/app/api/obz/estrutura/route.ts`
- `src/app/api/obz/estrutura/bulk-atribuicao/route.ts`
- `src/app/api/obz/importar/route.ts`
- `src/app/api/obz/lancamentos/route.ts`
- `src/app/api/obz/justificativas/route.ts`
- `src/app/api/obz/meus-pacotes/route.ts`
- `src/app/api/obz/periodo/route.ts`
- `src/app/api/obz/periodo-anual/route.ts`
- `src/app/api/obz/submissao-anual/route.ts`
- `src/app/api/financeiro/consolidado/route.ts`
- `src/app/api/financeiro/reconciliacao/route.ts`

Modelos relacionados:

- `OBZEstado`
- `OBZOperacao`
- `OBZArea`
- `OBZPacote`
- `OBZAreaPacote`
- `OBZLinhaCusto`
- `OBZLancamento`
- `OBZJustificativa`
- `OBZPeriodo`
- `OBZPeriodoAnual`
- `OBZSubmissaoAnual`
- `OBZImportacaoContabil`

### Score de Clientes

Objetivo:

- importar dados comerciais e financeiros
- calcular score de clientes
- expor ranking e histórico

Páginas principais:

- `src/app/score/page.tsx`
- `src/app/score/[chave]/page.tsx`

APIs principais:

- `src/app/api/score/upload/route.ts`
- `src/app/api/score/clientes/route.ts`
- `src/app/api/score/clientes/[chave]/route.ts`
- `src/app/api/score/ranking-filial/route.ts`

Modelos relacionados:

- `ScoreCliente`
- `ScoreHistorico`
- `ScoreImportacao`

### Administração Global

Objetivo:

- administrar o catálogo central do sistema
- controlar empresas, usuários, funções, metas, produtos, auditoria e módulos especiais

Páginas principais:

- `src/app/admin/page.tsx`
- `src/app/admin/usuarios/page.tsx`
- `src/app/admin/empresas/page.tsx`
- `src/app/admin/funcoes/page.tsx`
- `src/app/admin/metas/page.tsx`
- `src/app/admin/produtos/page.tsx`
- `src/app/admin/aprovacoes/page.tsx`
- `src/app/admin/auditoria/page.tsx`

APIs principais:

- `src/app/api/admin/usuarios/route.ts`
- `src/app/api/admin/empresas/route.ts`
- `src/app/api/admin/funcoes/route.ts`
- `src/app/api/admin/metas/route.ts`
- `src/app/api/admin/produtos/route.ts`
- `src/app/api/admin/pedidos/route.ts`
- `src/app/api/admin/auditoria/route.ts`

## Navegação e Perfis

O sistema usa uma combinação de:

- `role`
  - papel global
- `nivel`
  - posição hierárquica
- flags adicionais
  - `isObzAdmin`
  - `isUPBAdmin`
  - `isScoreAdmin`
  - `isEmpresaAdmin`
- empresa do usuário
  - define se a pessoa acessa a gamificação completa ou apenas partes do portal

Essa lógica aparece principalmente em:

- `src/lib/auth.ts`
- `src/lib/auth-helpers.ts`
- `src/middleware.ts`
- `src/app/app/layout.tsx`

## Componentes de Infraestrutura

Outros pontos importantes do sistema:

- `public/manifest.json`
  - configura atalhos do PWA para Hoje, OBZ, Universidade e Ranking
- `next.config.js`
  - habilita PWA, cache offline e imagens remotas do Cloudinary
- `docker-compose.yml`
  - sobe PostgreSQL local para desenvolvimento
- `src/components`
  - componentes de UI, autenticação, layout, loja, gestor e admin

## Hotspots Técnicos

Arquivos que concentram muita responsabilidade e merecem atenção especial em refatorações futuras:

- `src/app/app/layout.tsx`
- `src/app/financeiro/page.tsx`
- `src/app/admin/obz/page.tsx`
- `src/app/admin/upb/page.tsx`
- `src/app/api/score/upload/route.ts`

## Resumo Executivo

O sistema está organizado como um monólito por domínio de negócio, com boa cobertura funcional e forte dependência de regras internas. A estrutura geral é coerente, mas parte importante da complexidade está concentrada em páginas grandes e rotas de API extensas. Este mapa serve como base para os próximos passos de estabilização e refatoração.
