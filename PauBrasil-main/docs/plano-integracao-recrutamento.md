# Plano — Módulo de Recrutamento e Quadro (Gente) no Portal Pau Brasil

**Autor:** Claude (gerente de projeto / arquitetura)
**Data:** 2026-09-21
**Status:** aprovado na direção — decisões 1 e 2 tomadas pelo PO
**Público:** time de desenvolvimento sênior (Claude, Codex, Gemini) + PO

---

## 0. Direção definida pelo PO (2026-09-21)

Duas decisões foram tomadas e mudam a natureza deste trabalho:

1. **O módulo alvo é o Banco de Talentos** (`/talentos`). Não existe banco de horas neste repositório.
2. **Não vamos integrar com o sistema que o RH já tem.** Construímos o módulo **dentro do portal, com os nossos recursos e no nosso padrão.**

Consequências diretas, que valem para todo o restante deste documento:

- **O app em Firebase não é um sistema a conectar — é uma especificação.** Ele nos diz quais campos, regras e fluxos o RH precisa. Nada do código dele entra no portal, e o portal nunca fala com o Firestore.
- **Nenhuma dependência de Firebase no caminho crítico.** Sem `firebase-admin`, sem service account, sem sincronização, sem período de dupla escrita.
- **Paridade é funcional, não visual.** Preservamos campos, regras de cálculo e fluxos de trabalho. As telas são reconstruídas no design system do portal (Radix/Tailwind 3, SWR, optimistic UI, skeletons), não copiadas do app do RH.
- **Os dados entram por importação única**, a partir de um export que o RH gera do app atual — não por leitura direta da base deles.
- **A exposição de dados descrita em §1.2 continua real**, mas deixa de ser problema nosso de engenharia e passa a ser motivo para **desligar o app atual assim que houver substituto**. A comunicação ao jurídico/DPO segue necessária.

---

## 1. Diagnóstico

### 1.1 O que o RH entregou

`gestao de recrutamento/gestão-de-recrutamento.zip` — aplicação gerada no Google AI Studio.

| Item | Valor |
| --- | --- |
| Stack | Vite 6 + React 19 + Tailwind 4 + Firebase Firestore + Express (dev server) |
| Tamanho | ~20.700 linhas de TS/TSX |
| Telas | 14 views + 2 modais |
| Backend | **Não existe.** O Express serve apenas 2 endpoints de IA (Gemini) |
| Persistência | Blobs JSON inteiros em `app_data/{scopedKey}` no Firestore |
| Autenticação | Própria, usuário/senha em texto puro no mesmo documento público |
| Multi-unidade | `getScopedKey()` prefixa a chave com a operação do usuário (`patos`, `sume`…) |

**Views:** Dashboard, Controle de Vagas, Vagas Frontline, Candidatos Stand-By, Candidatos Internos, Pipeline de Sucessão, QLP (quadro de lotação), Desligados, Gestão PCD, Jovens Aprendizes, Cargos (descritivos), Verificador IA, Controle de Logins, Recovery Center.

### 1.2 Achados críticos de segurança e LGPD

Estes achados são anteriores à integração e precisam de ação **independente** de aprovarmos o plano.

| # | Achado | Evidência | Gravidade |
| --- | --- | --- | --- |
| S1 | Base de dados mundialmente legível e gravável | `firestore.rules`: `allow read, write: if true` em `app_data/{document}` | **Crítica** |
| S2 | Dado sensível de saúde exposto | Laudos de PCD (`conteudoLaudo`, base64) gravados nessa coleção — art. 11 da LGPD | **Crítica** |
| S3 | Currículos e PII expostos | CVs em base64, nomes, telefones, salários, motivos de desligamento | **Crítica** |
| S4 | Senhas em texto puro | `UserAccount.password` persistido sem hash no mesmo doc público | **Crítica** |
| S5 | Senha mestre hardcoded | `dpb2026`, com `isMaster: true`, dentro do bundle entregue ao navegador | **Alta** |
| S6 | Recuperação de senha vaza a credencial | `LoginScreen.tsx` monta mensagem de WhatsApp com a senha em texto | **Alta** |
| S7 | Credenciais do projeto versionadas | `firebase-applet-config.json` com `apiKey`/`projectId` dentro do zip | **Média** (config Firebase é pública por design, mas somada a S1 vira a chave do cofre) |
| S8 | Resolução de conflito "o maior vence" | `isRicher()` em `src/lib/firebase.ts` decide pelo lado com mais itens — descarta edições legítimas | **Alta** (integridade) |
| S9 | Sem trilha de auditoria | Nenhum registro de quem alterou o quê | **Alta** (compliance) |

> **Leitura de negócio:** qualquer pessoa que descubra o `projectId` — que está no JavaScript entregue ao navegador — lê, altera e apaga toda a base de RH das duas operações, incluindo laudos médicos. Isso configura incidente potencialmente reportável. Ver §3, Fase 0.

### 1.3 O que o portal já tem

| Capacidade | Onde |
| --- | --- |
| Auth + RBAC + sessão | `src/lib/auth.ts`, `src/lib/auth-helpers.ts` (`isRhAdmin`, `isSysAdmin`, escopo por empresa/operação) |
| Auditoria | `src/lib/audit.ts` |
| Banco de Talentos (funil inbound) | `/talentos`, models `Candidatura` + `NotaCandidatura`, Kanban em `src/components/rh/KanbanBoard.tsx` |
| Página pública de vagas | `/carreiras`, `/carreiras/candidatar` |
| Parser de currículo | `src/lib/cv-parser.ts`, `/api/admin/rh/importar-cv` |
| Upload privado de arquivo | Cloudinary (CVs) + Vercel Blob privado (backup) |
| Zonas de influência por operação | `src/lib/operacoes-rh.ts` |
| Backup/restore, rate-limit, e-mail, erasure LGPD | `backup-export.ts`, `rate-limit.ts`, `email.ts`, `api/admin/rh/candidaturas/[id]/erasure` |

**Ou seja: 70% da infraestrutura que falta no app do RH o portal já tem pronta e em produção.**

### 1.4 Módulo alvo — confirmado

Confirmado pelo PO: o módulo de RH existente é o **Banco de Talentos** (`/talentos`). Não há banco de horas neste repositório. O novo módulo nasce ao lado dele, na mesma seção de navegação.

---

## 2. Decisão de arquitetura

### 2.1 Construção nativa: o app do RH é especificação, não código-fonte

| Opção | Descrição | Veredito |
| --- | --- | --- |
| A — Iframe / subdomínio | Hospedar o app Vite como está e linkar do portal | **Rejeitada.** Mantém S1–S9, dois logins, duas fontes de verdade, zero auditoria |
| B — Portar 1:1 para Next | Copiar componentes, trocar só o Firestore por API | **Rejeitada.** React 19→18 e Tailwind 4→3 já exigem adaptação; e copiar o modelo de blob JSON traria S8 para dentro do portal |
| C — Reescrita de camada com reuso das telas | Modelo novo, telas herdadas do app do RH | **Rejeitada pelo PO.** Misturaria dois padrões visuais dentro do portal |
| D — **Construção nativa** | Domínio extraído do app como especificação; modelo, APIs e telas escritos do zero no padrão do portal | **Decidida** |

O que aproveitamos do trabalho do RH: **o domínio.** Quais campos eles controlam, como calculam SLA de vaga e status de fechamento, como acompanham cota de PCD e vigência de contrato de aprendiz, como classificam prontidão no pipeline de sucessão, quais etapas um candidato percorre. Isso é conhecimento de negócio real e entra inteiro.

O que não aproveitamos: **o código.** Nenhum componente, nenhuma dependência, nenhuma conexão. O portal já tem design system, RBAC, auditoria, upload privado, rate-limit e backup — o módulo usa tudo isso desde a primeira linha.

**Princípio de aceitação:** o RH não pode perder nenhum campo nem nenhuma regra que use hoje. Paridade **funcional** é critério de saída da Fase 2. Paridade visual não é meta — as telas seguem o padrão do portal.

### 2.2 Onde o módulo mora

Novo grupo de rotas **`/gente`**, dentro da seção "Gente & Cultura" que já existe na navegação (`src/app/app/layout.tsx:226`), ao lado do Banco de Talentos:

```
/gente                       → Dashboard de Gente
/gente/vagas                 → Controle de Vagas (Frontline vira filtro)
/gente/candidatos            → Stand-By (funil externo)
/gente/candidatos/internos   → Candidatos Internos
/gente/sucessao              → Pipeline de Sucessão
/gente/quadro                → QLP (quadro de lotação)
/gente/desligamentos         → Desligados
/gente/pcd                   → Gestão PCD (metas + colaboradores)
/gente/aprendizes            → Jovens Aprendizes
/gente/cargos                → Descritivos de cargo + Verificador IA
/talentos                    → Banco de Talentos (existente, passa a alimentar /gente/candidatos)
```

APIs espelhadas em `src/app/api/gente/**`. Regras de negócio puras em `src/lib/gente/*.ts`, testáveis sem banco — mesmo padrão de `TaskService`/`StoreService` já adotado no projeto.

### 2.3 Modelo de dados

Novos models com prefixo `Rec*` (recrutamento) e `Quadro*` (quadro de pessoal), para não colidir com os models existentes. Todos com `empresaId` + `operacaoId`: **o escopo por operação sai do nome da chave no cliente e vira coluna indexada com filtro de permissão no servidor.**

```prisma
// ── Recrutamento ──
model RecVaga             // Controle de Vagas: campos do Excel + SLA derivado
model RecCargo            // Descritivo de cargo padrão (fonte do Verificador IA)
model RecCandidato        // Stand-By. FK opcional candidaturaId → Candidatura (ponte com o funil inbound)
model RecCandidatoEtapa   // Entrevista GG, aprovação do gestor, teste prático, direção, teórico
model RecCandidatoInterno // Recrutamento e movimentação interna
model RecSucessao         // Pipeline de sucessão. FK opcional userId → User

// ── Quadro de pessoal ──
model QuadroColaborador   // QLP. FK opcional userId → User
model QuadroDesligamento  // Desligados. FK opcional userId
model QuadroPcd           // PCD. Laudo em blob privado, nunca em coluna de texto
model QuadroPcdMeta       // Meta x real por mês
model QuadroAprendiz      // Jovens Aprendizes, com vigência de contrato

enum RecVagaStatus       { ABERTA, FECHADA, CANCELADA }
enum RecStatusFechamento { ABERTA_NO_PRAZO, ABERTA_VENCIDA, FECHADA_NO_PRAZO, FECHADA_FORA_PRAZO }
enum RecResultadoEtapa   { OK, NAO, NA }
```

Decisões de modelagem que valem registro:

1. **Datas viram `DateTime`.** Hoje são strings `DD/MM/AAAA` comparadas com `new Date()` — origem silenciosa de erro de SLA.
2. **`diasEmAberto` e `statusFechamento` deixam de ser colunas gravadas** e passam a ser derivados em `src/lib/gente/vaga-sla.ts`, exceto quando `statusFechamentoManual = true` (o app do RH já prevê override manual; preservamos).
3. **Laudo e currículo nunca em coluna.** Vão para blob privado, com URL assinada de curta duração e `audit()` a cada leitura — mesmo padrão já usado em `candidaturas/[id]/cv-url`.
4. **FK opcional para `User`** em toda entidade que representa pessoa do grupo (QLP, desligados, PCD, aprendiz, sucessão). A Fase 1 grava `null`; a Fase 3 faz o casamento assistido. É isso que torna a integração real em vez de cosmética.
5. **Ponte do funil:** `RecCandidato.candidaturaId` liga o candidato do processo seletivo à candidatura vinda de `/carreiras`. Sem isso, continuaríamos com dois funis dentro do mesmo portal.

### 2.4 Autenticação e permissões

Os logins próprios do app (`ambev_recrutamento_users_list`) são descontinuados. Cada pessoa do RH vira `User` do portal:

- quem já tem conta recebe a flag de acesso;
- quem não tem é provisionado via `src/lib/user-provisioning.ts`, com senha temporária e `mustChangePassword = true`.

Novos helpers em `src/lib/auth-helpers.ts`:

```ts
canAccessGente(u)        // lê o módulo, restrito às operationIds do usuário
canManageGente(u)        // cria e edita
canViewDadoSensivel(u)   // laudo PCD, salário — sempre com audit()
```

| Perfil | Alcance |
| --- | --- |
| `SYS_ADMIN` / RH corporativo | todas as operações |
| RH da operação | apenas as `operationIds` do usuário |
| Gestor solicitante | apenas as vagas da sua área (Fase 3) |
| Demais | sem acesso |

O escopo é aplicado **no servidor, em toda query**, não no filtro da tela. Isso fecha o isolamento entre Patos e Sumé, que hoje depende apenas do prefixo da chave montado no cliente.

### 2.5 IA

O app do RH tem duas funcionalidades de IA, ambas reconstruídas aqui:

| Funcionalidade no app do RH | Como fica no portal |
| --- | --- |
| Aderência da vaga ao descritivo de cargo | Rota nova `POST /api/gente/cargos/analisar` |
| Extração de dados de currículo | **Já existe no portal:** `src/lib/cv-parser.ts` + `/api/admin/rh/importar-cv`, em produção. Nada a construir |

Requisitos da rota nova: chave apenas no servidor, `rate-limit.ts` aplicado, `audit()` por chamada e **nenhum dado pessoal identificável no prompt** — a análise compara vaga × descritivo de cargo e não precisa do nome de candidato.

**Decisão aberta (baixa urgência, só na Fase 2, bloco 6):** o portal hoje não tem nenhum provedor de LLM configurado. Definir qual usar quando chegarmos lá.

---

## 3. Fases de execução

### Fase 0 — Especificação e coleta (paralela à Fase 1, não bloqueia)

Como não vamos conectar no sistema deles, o que precisamos do RH é **informação, não acesso**:

1. **Export dos dados pelo próprio RH**, a partir do app atual: uma planilha por tela (Vagas, Stand-By, QLP, Desligados, PCD, Aprendizes, Aprendizes, Cargos, Internos, Sucessão). O app já exporta XLSX em pelo menos uma tela; para as demais, o RH exporta como conseguir — CSV ou XLSX serve. **Nós não tocamos no Firebase.**
2. **Validação das regras com quem opera.** Uma sessão curta por bloco para confirmar o que extraímos do código: prazo padrão de fechamento de vaga, o que conta como "fora do prazo", como a meta de PCD é definida, quais etapas do processo são obrigatórias.
3. **Lista de usuários do RH** e quais já têm conta no portal.
4. **Comunicar jurídico/DPO** sobre a exposição descrita em §1.2 e sobre a janela em que ela existiu. É decisão deles, não nossa.
5. **Combinar a data de desligamento do app atual** com o RH, atrelada ao fim da Fase 2.

**Saída:** especificação confirmada por quem usa, dados em mãos em formato de planilha, e uma data de desligamento acordada.

### Fase 1 — Fundação (sprint 1)

- Schema Prisma + migration dos 11 models.
- Helpers de permissão com testes unitários.
- `src/lib/gente/vaga-sla.ts` (SLA e status de fechamento) com testes cobrindo as regras extraídas do app atual.
- `src/lib/gente/importador.ts` + rota de importação XLSX/CSV, no mesmo padrão já usado em `/talentos/importar`: **dry-run obrigatório**, normalização de datas `DD/MM/AAAA` → `DateTime`, deduplicação e relatório de divergências antes de gravar.
- Shell do módulo: layout, navegação, guardas de rota, middleware.

**Saída:** o portal representa o domínio, a importação está validada em dry-run e nada existente quebrou.

> Nota: a importação é **um recurso do produto**, não um script descartável. O RH vai continuar recebendo planilha de fora (fundação de aprendiz, consultoria, ex-Excel), então a tela de importar fica.

### Fase 2 — Paridade (sprints 2 e 3)

Telas em ordem de valor operacional. Cada tela = rota de API + página + import/export XLSX onde já existe + teste.

| Ordem | Tela | Por que nesta posição |
| --- | --- | --- |
| 1 | Controle de Vagas + Frontline — **entregue em 2026-09-21** | Coração do processo e maior massa de dados |
| 2 | Candidatos Stand-By — **entregue em 2026-09-21**, com a ponte funcionando | Maior componente do app (2.573 linhas) e onde entra a ponte com o Banco de Talentos |
| 3 | Dashboard — **entregue em 2026-09-21** | Só faz sentido depois que 1 e 2 têm dados reais |
| 4 | QLP + Desligados — **entregue em 2026-09-21** | Base do quadro; alimenta os indicadores de 3 |
| 5 | Gestão PCD + Jovens Aprendizes — **entregue em 2026-09-21** | Compliance; exige o fluxo de anexo privado |
| 6 | Cargos + Verificador de aderência — **entregue em 2026-09-21** (análise determinística, sem IA) | Depende de 1 para comparar |
| 7 | Candidatos Internos + Pipeline de Sucessão — **entregue em 2026-09-21** | Maior valor estratégico, menor urgência operacional |

**Critério de saída:** o RH opera um mês inteiro no portal sem abrir o app antigo. Validação com quem usa hoje, não apenas com QA.

> **As 9 telas foram entregues em 2026-09-21.** Falta o que nenhum código resolve: os dados reais do RH e o mês de operação em paralelo.

**Cutover por bloco, não big-bang:** cada bloco entregue acima é importado, conferido pelo RH e passa a ser a fonte de verdade daquele assunto. O app antigo continua existindo até o fim da Fase 2, mas o combinado é que o bloco já migrado não recebe mais lançamento lá. Nenhuma sincronização entre os dois — a disciplina é de processo, não de código.

### Fase 3 — Integração de verdade (sprint 4)

É aqui que a fusão deixa de ser "duas coisas no mesmo menu":

- **Funil único:** `/carreiras` → `Candidatura` → `RecCandidato` → `RecVaga` → contratação → `User` provisionado. Hoje são quatro pontos de anotação manual.
- **Casamento assistido** de `QuadroColaborador`, `QuadroDesligamento` e `RecSucessao` com `User` — sugestão por nome com confirmação humana, nunca automático.
- **Sucessão ligada a `Function`:** o portal já tem catálogo de funções; o pipeline deixa de usar cargo em texto livre.
- **Desligamento dispara** desativação do `User`, revisão de acessos e abertura da vaga de reposição.
- **Dashboard de Gente unificado:** funil inbound + vagas + SLA + cotas PCD/aprendiz + sucessão, com os filtros de operação que o RBAC já garante.
- **LGPD:** estender o fluxo de erasure existente às novas entidades e definir retenção de currículo e laudo.

### Fase 4 — Desligamento do app antigo

Conferência final com o RH → app do RH sai do ar → dados apagados e projeto Firebase removido **pelo RH / por quem tem a conta** → baixa registrada no handoff e no inventário de sistemas. Nossa parte aqui é confirmar que nada ficou só lá.

---

## 4. Riscos e mitigações

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Planilhas de origem sujas (datas em formatos mistos, nomes duplicados, sem ID estável) | Importação gera base inconsistente | Dry-run + relatório de divergências validado pelo RH **antes** de gravar |
| RH depende de export manual e entrega tarde ou incompleto | Atrasa o cutover de um bloco | Fases 0 e 1 correm em paralelo; a fundação não espera pelo dado. Pedir bloco por bloco, na ordem da Fase 2 |
| Os dois sistemas rodando ao mesmo tempo divergem | Retrabalho e dado perdido | Cutover por bloco com regra clara: bloco migrado não recebe mais lançamento no app antigo. Sem sincronização — não existe caminho de volta por código |
| RH perde a sensação de "salva sozinho" | Rejeição do novo módulo | Optimistic UI (padrão já adotado no projeto) + import/export XLSX como recurso permanente |
| Colisão de escopo com Codex/Gemini | Retrabalho e reversão | Posse declarada: `src/app/gente/**`, `src/app/api/gente/**`, `src/lib/gente/**`. `prisma/schema.prisma` apenas com aviso prévio no handoff |
| Escopo inflar para folha e ponto | Sprint 4 vira sprint 8 | Fronteira explícita: este módulo é **recrutamento e quadro**. Ponto e folha ficam fora |
| Volume (14 telas do zero, no nosso padrão) | Prazo | Ordem da Fase 2 é por valor operacional: o RH já ganha com os blocos 1 e 2 antes do módulo estar completo |

---

## 5. Pendências com o PO

Decisões 1 e 2 já tomadas (§0). Restam:

1. **Lista de usuários do RH** e quais já têm conta no portal — dimensiona o provisionamento (Fase 0, item 3).
2. **Reporte de incidente LGPD:** quem conduz — você, jurídico ou DPO? Não é decisão de engenharia.
3. **Escopo da Fase 3** (funil único, casamento com `User`, desligamento disparando revisão de acesso): entra nesta rodada ou vira backlog depois da paridade?
4. **Data alvo de desligamento** do app do RH, para combinar com eles na Fase 0.

---

## 6. Estado da execução

### Fase 1 — entregue em 2026-09-21

| Entrega | Situação |
| --- | --- |
| 11 models + 8 enums no `schema.prisma` | ✅ |
| Migration `20260921000000_add_gente_recrutamento_quadro` | ✅ **Aplicada no banco** em 2026-09-21 |
| Helpers `canAccessGente`, `canManageGente`, `canViewDadoSensivel`, `escopoOperacoesGente` | ✅ com testes |
| `src/lib/gente/vaga-sla.ts` | ✅ 13 testes, 2 deles ancorados em dados reais do app do RH |
| Guarda de rota `/gente` (middleware + verificação na página) | ✅ com testes |
| Shell `/gente` + navegação | ✅ |

Verificação: `tsc --noEmit` sem erros de source, `npm run build` OK, `npm run test:unit` 134 passando.

A migration é **puramente aditiva**: 11 `CREATE TABLE`, 8 `CREATE TYPE`, 41 índices, 35 chaves estrangeiras, e nenhum `DROP`, `ALTER COLUMN` ou `DELETE`. Nenhuma tabela existente é alterada. Conferido depois de aplicar: as 11 tabelas existem e estão zeradas, e os dados existentes seguem intactos (66 usuários, 10 empresas, 8 operações, 213 candidaturas, 2.577 registros de auditoria).

**Acesso hoje:** 3 SYS_ADMIN veem todas as operações e 2 RH_ADMIN têm 2 operações cada — ninguém fica de fora pela regra fail-closed. Qualquer usuário de RH criado daqui em diante precisa receber operações no cadastro, senão não enxerga o módulo.

### Em paralelo, com o RH

Fase 0: export das planilhas, sessão de validação das regras, lista de usuários, data de desligamento do app antigo.

### Próximo

Aplicada a migration, **Fase 2 bloco 1 — Controle de Vagas**: rota de API com escopo por operação, tela no padrão do portal e importação XLSX com dry-run.
