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
| `/admin/operacoes` | `src/app/admin/operacoes/page.tsx` (sem atalho no menu admin desde 19/10/2026; rota e API mantidas para visitas) |
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
| `CRON_SECRET` | `src/app/api/cron/backup/route.ts`, `src/app/api/cron/limpar-cvs/route.ts` |
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
