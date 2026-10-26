# AI Handoff

> **Atualização de contexto — 19/10/2026:** Este arquivo preserva o histórico de várias rodadas. O estado consolidado de 19/10/2026, incluindo portal sem gamificação e produção Neon/Vercel, está em [contexto-agente/00-LEIA-PRIMEIRO.md](contexto-agente/00-LEIA-PRIMEIRO.md). Status antigos, contagens e referências a módulos retirados podem estar superados.

## Objetivo

Este arquivo e a base oficial de coordenacao entre Codex e Claude quando os dois estiverem trabalhando em paralelo neste repositorio.

Ele deve ser lido antes de qualquer nova analise, refatoracao, revisao ou implementacao.

## Regra Oficial de Trabalho Paralelo

- Este arquivo e memoria persistente de contexto, decisoes e handoff.
- Codex e Claude podem editar este arquivo.
- Codex e Claude podem opinar sobre o trabalho um do outro.
- Toda alteracao relevante deve gerar registro aqui.
- Toda rodada relevante deve receber, quando possivel, um parecer do outro agente.
- Documentacao sozinha nao basta: sempre combinar este arquivo com leitura real de `git status` e `git diff`.

## Definicao de Posse de Arquivos

- "Arquivo em posse" significa: arquivo que um agente pretende editar nesta rodada.
- Analise sem alteracao nao precisa bloquear posse exclusiva.
- Se um arquivo ja estiver em posse do outro agente, nao sobrescrever sem antes revisar o estado atual e registrar a decisao aqui.
- Opiniao sobre o trabalho do outro agente e sempre permitida.
- Edicao no mesmo arquivo por ambos so deve acontecer depois de leitura do diff e registro claro no handoff.

## Ciclo Obrigatorio

### Antes de comecar qualquer tarefa

- Ler este arquivo inteiro.
- Ler `docs/mapa-do-sistema.md`.
- Rodar `git status --short`.
- Rodar `git diff --name-only`.
- Atualizar a secao `Em andamento` com:
  - agente
  - data
  - objetivo
  - arquivos em posse
- Verificar se existe arquivo em posse do outro agente.
- Se houver sobreposicao, ajustar o escopo antes de editar.
- Nao reverter mudancas que voce nao fez.

### Durante a execucao

- Preferir escopos de escrita separados.
- Se precisar tocar arquivo ja alterado pelo outro agente, registrar isso no final da rodada.
- Evitar refatoracoes amplas sem antes verificar o estado atual do workspace.
- Se encontrar conflito, registrar em `Bloqueios e alertas` em vez de sobrescrever no escuro.

### Ao finalizar qualquer rodada

- Atualizar `Registro de rodadas`.
- Liberar ou atualizar a posse em `Em andamento`.
- Registrar mesmo quando a rodada for apenas de analise.
- Marcar se existe `Parecer do outro agente`:
  - pendente
  - feito por Codex
  - feito por Claude

## Tabela Diaria de Controle

Esta tabela e a forma mais rapida de ver o estado atual do trabalho paralelo.

Atualize esta tabela no inicio e no fim de cada rodada.

Status sugeridos:

- `em analise`
- `em andamento`
- `em revisao`
- `concluido`
- `bloqueado`
- `alterado no workspace`

| Arquivo ou area | Agente | Status | Ultima acao | Proxima acao |
| --- | --- | --- | --- | --- |
| Hub: linha do tempo ano a ano | Claude | concluido | 2026-10-26: um ano em destaque por vez + caminhaozinho na estrada; deploy | Parecer do Codex |
| Paginas publicas no visual do hub (candidatar, carreiras, contato, registro, erro/offline) | Claude | concluido | 2026-10-23: tema verde antigo removido; deploy | Parecer do Codex |
| Hub: critica de design (contraste, mobile, cabecalho) | Claude | concluido | 2026-10-23: contraste, fonte minima 12px, cabecalho areia + newsletter branca, logos 4x2, cards compactos, pausa/play da newsletter corrigido; deploy | Parecer do Codex |
| Hub: linha do tempo e feedbacks | Claude | concluido | 2026-10-21: linha do tempo 1994-2026 em eras; YSO e Hora 10 corrigidos; rolagem suave; color-scheme claro; filtros e selos mais fortes | Confirmar assinatura no Samsung Internet e cidades-sede adicionadas |
| Hub: logos do Drive do grupo | Claude | concluido | 2026-10-20: logos Original Start e Locadora, assinatura Zenildo Oliveira, programas Capacitar e T&D Lideres, faixa de parceiros; Original Start corrigida para Moto Pecas | Confirmar descricao da Original Start e uso das marcas Ambev/Honda |
| Limpeza de codigo morto | Claude | concluido | 2026-10-20: 21 arquivos, ~20 funcoes e 20 dependencias sem uso removidos; `jose` declarado | Revisar o que foi mantido de proposito (ver registro) |
| Hub: foto do fundador e efeitos | Claude | concluido | 2026-10-20: retrato + frase do fundador, cortina, entrada do hero, logo que cresce, contadores, brilho do cursor, textura de papel, entrada da pagina de empresa, revelacao ao rolar, barra de progresso | Corrigir E2E mobile do hub (faixa de logos transborda) |
| Contexto consolidado e produção 19/10 | Codex | concluído | Documentação completa em `docs/contexto-agente/`; produção validada no commit `f77afba` | Consultar índice atual antes de retomar desenvolvimento |
| Portal do colaborador e identidade 2026 | Codex | concluido | 2026-10-16: paleta, login/navegacao/atividades corrigidos, loja suspensa; 6 E2E + 42 testes aprovados | Aguardar requisitos dos supervisores |
| Hub institucional e marca 2026 | Codex | concluido | 2026-10-16: home e 8 empresas, marca nova, filtros e orientacao editorial; tsc e 3 E2E aprovados | Receber acervo e cadastro oficial; definir encaminhamento real entre empresas |
| PostgreSQL e admin local | Codex | concluido | 2026-10-16: PostgreSQL local, conta SYS_ADMIN e login HTTP validados | Reiniciar banco com `bash .local-dev/postgres.sh start` quando necessario |
| `docs/ai-handoff.md` | Codex | concluido | Estrutura de handoff, posse e revisao cruzada criada | Parecer do Claude registrado |
| `src/app/app/inicio/page.tsx` | Gemini | concluido | Refatorado para usar SWR e cache (2026-04-13) | Expandir SWR |
| `src/app/universidade/certificados/page.tsx` | Gemini | concluido | Skeleton Screen Premium adicionado (2026-04-13) | — |
| `src/app/gestor/aprovacoes/page.tsx` | Gemini | concluido | Optimistic UI unificado com SWR (2026-04-13) | — |
| `tests/task-service.test.ts` | Gemini | concluído | Suíte de testes unitários criada para garantir Service Reliability | Executar testes |
| `src/app/app/loja/page.tsx` | Gemini | concluído | Glow-up com SSR e Optimistic UI aplicados (2026-04-13) | — |
| `docs/mapa-do-sistema.md` | Codex | concluido | Mapa de arquitetura documentado | Parecer do Claude registrado |
| `src/components/ui/skeleton.tsx` | Claude | concluido | SkeletonOBZHero e SkeletonOBZTable adicionados (2026-04-13) | — |
| `src/app/obz/page.tsx` | Claude | concluido | Loading state substituido por SkeletonOBZHero + SkeletonCard (2026-04-13) | — |
| `src/app/obz/pacote/[id]/page.tsx` | Claude | concluido | Skeleton na carga inicial; saveCell refatorado para Optimistic UI com rollback (2026-04-13) | — |
| `src/app/obz/justificativas/page.tsx` | Claude | concluido | Optimistic UI em handleReview, handleBulkReview e handleResubmit com rollback (2026-04-13) | — |
| `src/app/admin/obz/page.tsx` | Claude | concluido | togglePeriodo + handleLancSave refatorados para Optimistic UI com rollback; periodoSaving/lancSaving removidos (2026-04-13) | — |
| `src/app/financeiro/orcamento-anual/page.tsx` | Claude | concluido | SkeletonOrcamento + Optimistic UI em toggleAberto/destravar/cancelarSubmissao + filtro default pendentes (2026-04-13) | — |
| `src/app/obz/pacote/id/page.tsx` | Claude | concluido | Arquivo duplicado (rota estatica conflitante com [id]) removido (2026-04-13) | — |
| `auth/permissoes` | Codex | concluido | Revisao tecnica feita em modo leitura | Parecer do Claude registrado — correcoes pendentes |
| `src/app/admin/obz/page.tsx` | Claude | concluido | Aba Importacao adicionada (2026-03-31) | Aguardar revisao do Codex |
| `src/app/api/obz/importar/route.ts` | Claude | concluido | Suporte a XLSX adicionado (2026-03-31) | Aguardar revisao do Codex |
| `src/app/obz/page.tsx` | Claude | concluido | Accept do input atualizado para XLSX (2026-03-31) | Aguardar revisao do Codex |
| `admin/metas + produtos + unidades + pedidos + auditoria` | Codex | concluido | Permissoes alinhadas a helpers centrais com usuario efetivo do banco | Parecer do Claude registrado |
| `admin/funcoes + atividades + upb admin` | Codex | concluido | Permissoes alinhadas com usuario efetivo, escopo por empresa e dominio UPB fechado | Parecer do Claude registrado |
| `gestao + relatorio + agenda + historico` | Codex | concluido | Permissoes alinhadas e relatorio limitado a propria equipe | Parecer do Claude registrado |
| `financeiro/reconciliacao + consolidado` | Codex | concluido | Permissoes OBZ alinhadas com usuario efetivo e helper central | Parecer do Claude registrado |
| `obz core permissions` | Codex | concluido | Permissoes centrais de OBZ alinhadas com usuario efetivo e regra de dono/departamento | Parecer do Claude registrado |
| `obz importar + lancamentos + dono` | Codex | concluido | Auxiliares de OBZ alinhados com usuario efetivo e helper central | Parecer do Claude registrado |
| `universidade user APIs` | Codex | concluido | APIs de universidade alinhadas com usuario efetivo, escopo por empresa/unidade e acesso automatico por funcao | Parecer do Claude registrado |
| `public/logos/paubrasil.png` | nao identificado | bloqueado | Remocao detectada — origem desconhecida | Nao restaurar sem validar com usuario |
| `prisma/schema.prisma` | Claude | concluido | Campo `codigoContabil String?` adicionado a `OBZLinhaCusto`; `prisma db push` executado em 2026-04-02 | — |
| `src/app/api/admin/obz/importar-contas/route.ts` | Claude | concluido | Nova rota criada — importa plano de contas CSV, upsert pacotes/linhas com codigoContabil (2026-04-02) | — |
| `src/lib/audit.ts` | Claude | concluido | `OBZ_CONTAS_IMPORTADAS` adicionado ao tipo AuditAction (2026-04-02) | — |
| `src/app/api/admin/obz/bulk-delete/route.ts` | Claude | concluido | Nova rota POST bulk-delete (soft delete em massa de pacotes/linhas/area-pacotes) criada (2026-04-02) | — |
| `src/app/app/hoje/page.tsx` | Antigravity (Gemini) | em andamento | Refatoração com TaskService/StoreService e UI Premium Glassmorphism | Não tocar — em posse do Antigravity |
| `módulo visitas de líderes` | Claude | concluido | Bug permissão API lider corrigido; filtro mês na API e UI; skeleton + badges de status; radiusMeters real no checkin; dashboard com operações de rota dedicada; link /checkin/patos corrigido (2026-04-27). Matriz Gerentes × Filiais + coluna Foto com lightbox no dashboard (2026-04-28) | — |
| `visitas world-class (10 melhorias)` | Claude | concluido | (1) LeaderVisitStatus enum + migration. (2) Rate limit 30min + idempotência. (3) Validação coordenadas GPS. (4) Retry upload Cloudinary c/ backoff + audit log falha. (5) Confidence ring SVG (rms→verde). (6) Háptico navigator.vibrate + spring animation. (7) Detecção offline + listener online. (8) Preview antes de salvar na config facial + threshold 0.85. (9) Paginação 20/pág + counter no dashboard. (10) Lightbox com zoom +/- + pinch gesture. — 2026-04-30 | — |
| `gente: importacoes (todas)` | Claude | concluido | Reimportar sobrepoe em vez de duplicar; estrategia por entidade (apaga-e-recria x atualiza) conforme filhos/anexos (2026-09-25) | Limpar duplicatas ja gravadas pela selecao em massa |
| `gente: painel Frontline — cargos repetidos` | Claude | concluido | "Mais disputados" agrupa por `chaveDeCargo` (ignora preposicao e turno) e exibe o nome do descritivo (2026-10-07) | Dados de candidato seguem com 4 grafias de Ajudante de Distribuicao — so a exibicao foi unificada |
| `site: e-mail de curriculo por unidade` | Claude | concluido | `EmailsCurriculo` (Patos agg.patos, Sousa cgg.sousa) no passo da candidatura e na home (2026-10-07) | Confirmar com o PO o e-mail das outras unidades |
| `talentos: retencao de CV (10 dias)` | Claude | concluido | Cron diario `/api/cron/limpar-cvs` (06:00 UTC) apaga o CV de quem esta em Rejeitado/Arquivado ha 10+ dias, contados da saida do funil; ficha mostra quantos dias faltam (2026-10-01) | Conferir o primeiro registro `CANDIDATURA_CVS_LIMPOS` com `automatico: true` na auditoria |
| `talentos: reabrir rejeitado/arquivado` | Claude | concluido | Rejeitado/Arquivado voltam para Recebido/Triagem/Entrevista (nunca direto para Aprovado); rejeitar/arquivar NAO apaga mais o CV — so o botao Limpar CVs ou a remocao LGPD (2026-10-01) | 70 dos 71 ja reabriveis estao sem CV (apagado pela regra antiga, irrecuperavel) |
| `carreiras: Safari do iPhone caindo` | Claude | concluido | `PublicBackground` sem `filter: blur()` nos 4 orbes; medido no WebKit/iPhone 13: 0,7 -> 3,7 quadros/s, pior travada 2,1 s -> 0,35 s (2026-09-30) | Confirmar no iPhone real apos o deploy |
| `talentos: perfil de triagem` | Claude | concluido | Genero, nascimento e escolaridade na candidatura, filtros + coluna Perfil + edicao na ficha; migration aplicada e push feito (2026-09-30) | RH completar o perfil das 299 candidaturas antigas pelo botao Preencher |
| `gente: cotas PCD e aprendiz` | Claude | concluido | Bases das cotas de PCD e de aprendiz excluem aprendizes e estagiarios do QLP, pelo cargo (`APRENDIZ`, `ESTAGI`); telas mostram so a base de 198, sem nota explicativa (pedido do PO) (2026-09-28) | Conferir o aprendiz que esta no QLP e nao no modulo (9 x 8) |
| `gente: laudo PCD` | Claude | concluido | Leitura de blob privado corrigida (`get` do SDK) + upload em lote casando pelo nome do arquivo (2026-09-25) Acoes Trocar e Remover laudo expostas na lista + nome do arquivo anexado visivel na linha e nas confirmacoes (2026-09-25) | — |
| `gente: quadro (QLP)` | Claude | concluido | Matricula, CPF e data de admissao no modelo, importador, form e lista; matricula virou a identidade da importacao (2026-09-24) | Reimportar ainda duplica — avaliar sobreposicao por matricula |
| `gente: candidatos internos` | Claude | concluido | Filtro matriz/filial + filtro por polo regional (Patos+Sume, Sousa+Itaporanga, Guarabira, Brumado+Cacule+Barra) (2026-09-24) | Conferir se os 4 polos aparecem com as operacoes de producao |
| `gente: lista de vagas` | Claude | concluido | Caixa de selecao por vaga + exclusao em massa via `DELETE /api/gente/vagas` (2026-09-24) | — |
| `gente: cadastro de candidato interno` | Claude | concluido | `futurosCargos` recusava o cadastro manual; campo virou `tipo: 'lista'` e o schema passou a aceitar texto via `listaDeTexto()` (2026-09-24) | — |
| `gente: desfazer importacao de vagas` | Claude | concluido | `RecVaga.importacaoId` + rota `/api/gente/vagas/importacoes` + painel de desfazer na tela de importar; lote antigo reconhecido pelo minuto de criacao (2026-09-24) | — |
| `gente: importar internos` | Claude | concluido | Reimportar sobrepoe por operacao + nome normalizado, deixa de duplicar (2026-09-24) | — |
| `fix auditoria SECURITY_ACCESS_DENIED` | Claude | concluido | `void audit(...)` → `await audit(...)` em `src/app/api/admin/auditoria/route.ts` — log era fire-and-forget, teste encontrava DB vazio (2026-04-30) | — |
| `visitas obrigatorias — feature completa` | Claude | concluido | Schema VisitaObrigatoria (@@unique userId+operationSlug), migration manual aplicada, 3 audit actions, 5 novas rotas API (admin CRUD + lideres + leader self-service + compliance), page admin/visitas/obrigatorias, badges no checkin, painel obrigacoes no perfil lider, tab Compliance no dashboard, link sidebar, card admin/page — 2026-04-30 | — |
| `sistema de backup — feature completa` | Claude | concluido | Vercel Blob Private (BLOB_READ_WRITE_TOKEN), modelos SystemConfig+BackupJob, migration 20260502, 7 rotas API (export/import/list/delete/config/download-proxy/cron), backup-export.ts (47 tabelas, cursor pagination, gzip, SHA-256), backup-import.ts (two-pass FK auto-ref), cron daily 03:00 UTC, UI /admin/backup glassmorphism — 2026-05-02 | — |
| `mobile fluidity — 4 melhorias` | Claude | concluido | navigator.vibrate(30) em completeTask; active:scale-95 + prefetch={true} em todos os Links do nav; overscroll-behavior-y:contain global em overflow-y-auto; tabular-nums + min-w em contadores de pontos (2026-04-29) | — |
| `src/app/globals.css` | Claude | concluido | Light mode world-class: bg-white/X mapeados; hover:bg-white/X visíveis; border-white extras; hexes faltantes (#1a1a24 #1c1c24 #0f0f17 etc.); text-white geral + preservações para 14 famílias de cor; ::placeholder suave — 2026-05-03 | — |
| `src/app/login/page.tsx` | Claude | concluido | Bug duplo clique corrigido: setLoading(false) movido para branch de erro; router.push()+router.refresh() substituídos por window.location.href — 2026-05-16 | — |
| `performance — navegação entre módulos` | Claude | concluido | (1) SessionProvider refetchInterval 30s→5min + refetchOnWindowFocus=false. (2) InicioClient SWR revalidateOnFocus false. (3) Layout sections+allNavItems memoizados com useMemo — 2026-05-16 | — |

| `self-service APIs restantes` | Codex | concluido | `session.user as any` removido das rotas restantes de self-service e de uma rota legada de `admin/funcoes/[id]` em 2026-04-01 | Aguardar parecer do Claude sobre o fechamento da varredura |
| `auth drift em middleware + app shell` | Codex | em revisao | `middleware`, shell autenticado e paginas cliente centrais alinhados aos helpers de permissao em 2026-04-04 | **Ajuste pendente:** consolidar `isActive` check dentro do helper em vez de passar como parametro separado para `resolveMiddlewareRedirect` |
| `auth drift em telas de usuarios` | Codex | em revisao | `admin/usuarios` e `empresa/usuarios` passaram a usar helpers compartilhados para `role` e `nivel` em 2026-04-04 | **Ajuste pendente (alta prioridade):** (1) mover `ALLOWED_DOMAIN` para config central em vez de hardcode nas duas rotas; (2) adicionar audit diferenciado quando `isEmpresaAdmin=true` e criado por SYS_ADMIN |
| `labels compartilhados de usuario` | Codex | em revisao | `user-display.ts` criado e aplicado em `perfil`, `gestor/relatorio`, `admin/usuarios` e `empresa/usuarios` em 2026-04-04 | **Ajuste pendente:** revisar label `DIRETO` (semanticamente confuso); adicionar comentario explicando ausencia de `SUPERVISOR` em `EMPRESA_NIVEL_OPTIONS`; considerar teste verificando completude das keys |
| `casts restantes de session.user no front` | Codex | em revisao | Varredura final de `session.user as any` fora de OBZ concluida em 2026-04-04 com TypeScript verde | **Refatorar:** cast residual detectado em `gestor/auditoria/page.tsx` (~linha 239, `log.meta as any`) — remover; considerar hook `useAuthenticatedUser()` que garante session.user nao-null |
| `testes leves de permissao` | Codex | em revisao | Base leve de testes unitarios para `auth-helpers` e decisao de redirect do middleware concluida em 2026-04-04 | **Ajuste pendente:** adicionar teste explícito para `isActive === false` com usuario SYS_ADMIN; adicionar negative tests (ex: `COLABORADOR` nao passa em `isGestorLevel`); estender `buildSessionUser` com `functionId`, `managedAreaIds` |

| `ajustes finais OBZ apos revisao cruzada` | Codex | concluido | Compliance por subarvore corrigido, contexto `real`/`tendencia` exposto nas APIs/telas e G.5 endurecido em 2026-04-04 | Aguardar parecer do Claude sobre o fechamento do lote |
| `OBZJustificativa tipo explicito` | Claude | concluido | Schema atualizado com `OBZJustTipo` enum e `tipo OBZJustTipo?` em `OBZJustificativa`; `prisma db push` + `prisma generate` executados em 2026-04-04; lib `src/lib/obz-justificativas.ts` criada; importar/lancamentos/tendencia-compliance/auditoria-justificativas alinhados; 69/69 testes passando | — |
| `testes de integracao das paginas` | Claude | concluido | Suites de Colaborador, Gestor e Universidade implementadas em 2026-04-06 | — |
| `crud usuarios — bulk deactivate + testes` | Claude | concluido | Rotas bulk-deactivate (admin + empresa), multi-select na UI, 22 testes unitarios, script E2E implementados em 2026-04-06 | — |
| `usuarios — qualidade alto nivel` | Claude | concluido | ALLOWED_DOMAIN centralizado em config.ts, paginacao server-side, USER_REACTIVATED no audit, body:any removido, prisma.$transaction no bulk — 40/40 testes passando em 2026-04-06 | — |
| `obz tendencia-compliance — filtro + exportacao` | Claude | concluido | Filtro clicavel por status (PENDENTE/PARCIAL/COMPLETO) nos cards e pills, email do dono clicavel na tabela, exportacao CSV da visao filtrada adicionados em 2026-04-06 | Aguardar revisao do Codex |

| `testes automatizados + CI (workspace)` | GitHub Copilot | concluido | Commit 06420fc: expandido suite com APIs críticas (score, notifications, feed), validações/edge cases, performance, cobertura c8, CI com codecov, mocks externos preparados | Próximo: implementar testes reais de integração quando DB disponível |

| `APIs críticas sem testes` | GitHub Copilot | concluido | Criados placeholders para score/clientes, notifications, feed APIs com estrutura completa de testes (51 novos testes) | Aguardar implementação real quando DB disponível |
| `ferramentas cobertura + mocks` | GitHub Copilot | concluido | c8 instalado, script test:coverage criado, CI atualizado com codecov, mocks externos preparados (Cloudinary, Resend, QRCode) | — |
| `validações + edge cases` | GitHub Copilot | concluido | Testes para rate limiting, validações entrada, cenários erro, segurança OWASP criados | — |
| `performance + escalabilidade` | GitHub Copilot | concluido | Testes para queries otimizadas, cache, concorrência, monitoramento criados | — |
| `Banco de Talentos — feature completa` | Claude | concluido | Schema Prisma (Candidatura+NotaCandidatura+enums), carreiras-areas.ts, isRhAdmin helper, upload-cv API, candidaturas API, /carreiras/candidatar (form 4 passos), CTA em /carreiras, APIs admin/rh (GET+PATCH+cv-url), /admin/rh page (tabela+drawer), middleware, nav sidebar — 2026-04-09 | TypeScript 100% verde; precisa configurar preset Cloudinary `pau_brasil_cv` (raw) no dashboard |
| `Banco de Talentos — bugs de segurança (Codex audit)` | Claude | concluido | Fix Alta: token in-memory removido — upload-cv retorna URL+publicId direto, candidaturas aceita campos diretos com validação cvPublicId.startsWith('cvs/'). Fix Média: SYSTEM_ADMIN_ROLES=['SYS_ADMIN'] (RH_ADMIN removido), isRhAdmin inclui isSysAdmin. Fix Média: nav sidebar RH_ADMIN corrigido. — 2026-04-10 | TypeScript 100% verde |
| `docs/guia-importacao-obz.html` | Codex | alterado no workspace | Snapshot em 2026-04-09: guia HTML de importacao OBZ detectado como arquivo novo e sem referencias por busca textual no repo | Preservar ao trocar de escopo; depois decidir se vira documentacao oficial do produto ou artefato externo |

| `preview visual carreiras + painel RH` | Codex | concluido | Rota isolada `src/app/carreiras/preview/page.tsx` criada em 2026-04-09 para validar direcao visual sem backend e sem conflitar com a implementacao funcional | Coletar feedback visual do usuario antes de consolidar refinamentos da UI real |
| `src/app/page.tsx — Banner Vagas Exclusivas PCD + Mulheres` | Claude | concluido | 2026-07-15: Seção inserida entre "Por que trabalhar" e "Nossas Empresas"; auditada e corrigida (SVG PCD, violet→purple, copy h2) | — |
| `Banco de Talentos — filtro PCD/Mulheres + fix erro upload CV` | Claude | concluido | 2026-07-16: (1) uploadCv expõe erro específico da API em globalError (visível no step 3). (2) Admin /admin/rh: dropdown "Tipo vaga" (PCD/Mulheres) no grid de filtros, propagado para buildQs/load/exportCsv. (3) API GET /api/admin/rh/candidaturas: filtra mensagem por prefixo [Vaga Exclusiva PCD/Mulheres]. Deploy: grupopaubrasil.com.br — commit 50e16c9 | — |
| `UPB World-Class — Recertificacao + Pre-requisitos + Telemetria` | Claude | concluido | Schema: `UPBTemporada.preRequisitos[]`, `UPBTemporada.validadeDias`, `UPBCertificado.validoAte`, `UPBQuestao.versao`, novo model `UPBRespostaUsuario`. Migration `20260416000000_upb_world_class` aplicada. Quiz route: pre-requisitos bloqueantes, calcula validoAte, persiste respostas granulares em transacao, incremento de versao ao editar questao. Temporada route: expoe preRequisitosStatus com concluido/expirado. Relatorio route: Matriz de Complexidade Pedagogica (top-10 questoes por taxa de erro). Admin UI: campos validadeDias + preRequisitos no form de temporada. Student UI: banner pre-requisitos pendentes, badge certificado expirado com validoAte. TypeScript 0 erros. — 2026-04-14 | — |

###### Atividades Concluidas
- [x] Testes Automatizados (Gamificação, Gestão, Universidade):
    - Implementamos `tests/support/integration-base.ts` para padronizar testes de integração.
    - Suítes de teste: `colaborador-flow.test.ts`, `gestor-flow.test.ts`, `universidade-flow.test.ts`, `seguranca-acesso.test.ts`.
    - **Status Final**: 100% de aprovação (45/45 testes).
    - **Segurança**: Validados cenários de invasão lateral (cross-company/cross-hierarchy).
    - **Concorrência**: Implementado `tests/concorrencia.test.ts` e corrigidos bugs de race condition em pontos.
    - **Auditoria**: Implementado `tests/auditoria-deep.test.ts` para logs de falha de login e acesso negado.
    - **E2E**: Configurado Playwright e implementado `tests/e2e/login-flow.spec.ts`.
    - **Fixes**: Corrigido bug de cookie `__Secure-` em ambiente de desenvolvimento.
    - **Seed**: Atualizado para suportar multi-empresa e garantir reset de senhas/isActive.

## Quadro Operacional

| `email Resend — OBZ` | Claude | concluido | Integracao Resend implementada: `src/lib/email.ts` (templates), `src/lib/notify.ts` estendido com 4o param `email`; callers OBZ atualizados (justificativa aprovada/reprovada/bulk + notificar-pendentes) em 2026-04-06 | Requer `RESEND_API_KEY` + `EMAIL_FROM` no .env para ativar |
| `email — fix transport nodemailer→Resend` | Claude | concluido | `src/lib/email.ts` migrado de nodemailer/SMTP para Resend SDK; contato/route.ts corrigido para `EMAIL_ADMIN` em vez de `SMTP_USER`; `.env` documentado com `EMAIL_ADMIN` — 2026-05-08 | Para ativar: preencher `RESEND_API_KEY` no .env |
| `purge de usuário — feature completa` | Claude | concluido | Rota DELETE `/api/admin/usuarios/[id]/purge` (SYS_ADMIN only); audit `USER_PURGED`; bloqueia se usuário tem pacotes OBZ ativos; null out FKs opcionais (approverId, aprovadoPor, managerId); delete cascata de dados pessoais; modal de confirmação na UI admin/usuarios (visível só para SYS_ADMIN em usuários inativos) — 2026-05-08 | — |
| `importacao de vagas — repeticao falsa` | Claude | em revisao | 2026-09-24: **bug relatado pelo RH.** A chave de dedupe era `codigo ? cod:X : resto` — com "Cod" preenchido, o codigo mandava sozinho. Na planilha do RH o mesmo codigo aparece em cargos diferentes, e 27 de 62 linhas foram descartadas. Agora duas vagas so sao a mesma quando unidade, cargo, data de abertura, colaborador anterior E codigo batem. Mensagem passa a dizer o que colidiu. **O teste que existia codificava o defeito** e foi reescrito. | Conferir com o RH o que o "Cod" significa na planilha deles. Parecer do Codex: pendente |
| `Banco de Talentos — rejeitar nao funcionava` | Claude | em revisao | 2026-09-23: **bug relatado pelo RH no WhatsApp, confirmado.** `TRANSICOES_VALIDAS.RECEBIDO` so permitia `TRIAGEM`, entao rejeitar da primeira coluna tomava "Transicao invalida" e o cartao ficava. Somado a isso: erro engolido (`throw` sem captura), coluna de rejeitados inexistente, motivo do `prompt` descartado e quadro com rolagem lateral. Tudo corrigido; 7 testes novos na maquina de estados, que nao tinha nenhum. | Avaliar trocar os `prompt`/`alert` restantes da tela. Parecer do Codex: pendente |
| `Candidatos — painel e filtro de frontline` | Claude | em revisao | 2026-09-23: filtro "ver so frontline" (no `where`, nao em memoria — a lista e paginada) + painel com volume, por operacao, top 3 mais disputados e **cargo com vaga aberta e nenhum candidato**. `painel-frontline.ts` em funcao pura, 13 testes. Rota `resumo-frontline` separada da listagem. | Sugestoes de novos indicadores passadas ao PO. Parecer do Codex: pendente |
| `modulo Gente — cargo de frontline` | Claude | em revisao | 2026-09-23: `RecCargo.frontline` (migration aditiva, default false) + caixa no descritivo + selo ambar na lista de candidatos. `frontline-cargo.ts` resolve pelo vinculo da vaga (`vaga.cargoId`) e, na falta, pelo nome normalizado. Uma consulta so dos marcados, cruzamento em memoria — evita N+1 na listagem. `test:unit` 436/436, 9 testes novos. | O RH precisa marcar quais dos 58 descritivos sao frontline. Parecer do Codex: pendente |
| `Banco de Talentos — filtro por etapa` | Claude | em revisao | 2026-09-23: "Trazer para o processo" listava as 254 candidaturas juntas. A rota JA aceitava `?etapa=`; a tela nunca expos. Pilulas por etapa do funil com **contagem** (groupBy que ignora o filtro de etapa e respeita a busca), etiqueta de etapa em cada linha, e aviso quando se filtra REJEITADO/ARQUIVADO. Padrao segue "Todos" de proposito. Junto: importacao de vaga por planilha passa a gravar `cargoId`, e `prisma/vincular-vagas-descritivo.ts` (dry-run por padrao) para as vagas antigas. `test:unit` 421/421. | A unica vaga existente nao casa com descritivo nenhum e precisa de decisao humana. Parecer do Codex: pendente |
| `modulo Gente — vaga vinculada ao descritivo (cargoId)` | Claude | em revisao | 2026-09-23: `RecVaga.cargoId` existia desde a Fase 1 e **nunca tinha sido preenchido**. Campo de cargo virou seletor sobre os descritivos, que preenche area/requisitos/formacao so onde estiver vazio; botao "Abrir vaga" em cada linha de Descritivos leva o cargoId. `encontrarDescritivo` prefere o id e cai no nome; destaque de carreiras usa o nome do descritivo vinculado. cargoId conferido contra a empresa da vaga. `test:unit` 417/417. | Conforme as vagas novas nascerem vinculadas, o casamento por nome vira legado. Parecer do Codex: pendente |
| `carreiras — catalogo unificado e destaque de vaga aberta` | Claude | em revisao | 2026-09-23: a pagina passa a oferecer a lista curada MAIS os descritivos publicados (`montarCatalogo`). A validacao de envio deixou de ser `z.enum(TODOS_CARGOS)` e virou lista de permitidos em tempo de execucao, contra o mesmo catalogo. **Destaque de vaga aberta e DERIVADO do Controle de Vagas**, nao marcado a mao — evita a segunda contabilidade e o site anunciando vaga fechada. Corrigidos antes: casamento por nome exato ignorava o turno, e o contador de publicados mentia. `test:unit` 414/414. | O RH publicar os descritivos; cada um publicado agora vira opcao real no site. Parecer do Codex: pendente |
| `carreiras — descritivo do cargo para o candidato` | Claude | em revisao | 2026-09-23: `cargo-publico.ts` projeta so o que pode sair do descritivo (cargo, grupo, tipo, atividades, formacao, exigencias); testes, etapas, observacoes, raio e competencias ficam DENTRO. Rota publica `/api/carreiras/cargos`, modal na tela do candidato, campos de publicacao no cadastro do RH. **Migration `20260923000000_add_publicacao_reccargo` APLICADA** (publicarNoSite/grupoPublico/turnos + indice); 57 descritivos intactos, 0 publicados. `test:unit` 399/399, 14 testes novos. | **O RH precisa escrever os 34 cargos sem descritivo e marcar `publicarNoSite` + grupo.** Enquanto isso a pagina funciona como antes. Parecer do Codex: pendente |
| `auditoria do portal (perf, UX, privacidade)` | Claude | em revisao | 2026-09-22: relatorio em `docs/auditoria-2026-09-22.md`. **Achado alto: Session Replay do Sentry gravava a tela sem mascara em 10% das sessoes** — salario, CPF e laudo medico de PCD iam para servidores nos EUA; o comentario no arquivo dizia "Mascara... (LGPD)" e o codigo fazia o contrario. Corrigido. Tambem corrigido: DM Sans sem o peso 700 com 323 `font-bold` (negrito sintetizado) e o `confirm()` nativo do Frontline. Medidos e NAO resolvidos: 197 kB de JS em toda rota, 108 findMany sem take, 11 confirm() nativos, modelos de face-api vindos de CDN. | Decidir sobre carregar o Session Replay sob demanda (tira peso de todas as paginas). Parecer do Codex: pendente |
| `modulo Gente — seletor de periodo do painel` | Claude | em revisao | 2026-09-22: atalhos de 2 e 7 dias + intervalo livre em calendario proprio (`_components/SeletorPeriodo.tsx`). **Semantica corrigida: "ultimos N dias" passa a contar N dias incluindo hoje** — antes dava N+1, o que em 2 dias seria visivel. 30 e 90 dias cobrem um dia a menos agora. Fim do intervalo e exclusivo (`lt` na meia-noite do dia seguinte) para incluir o dia inteiro. A rota de desligamentos compartilha o modelo e foi migrada junto. `test:unit` 385/385, 13 testes novos. | Reaproveitar o seletor nas outras telas com filtro de periodo. Parecer do Codex: pendente |
| `modulo Gente — Vagas Frontline` | Claude | em revisao | 2026-09-22: a tela que o plano tinha reduzido a "Frontline vira filtro" (secao 2.2). **Migration `20260922120000_add_quadro_frontline` APLICADA no neondb com autorizacao do PO** — 3 tabelas novas (`QuadroFrontlineCargo`, `QuadroFrontlineMes`, `QuadroFrontlineTeto`), nenhuma alteracao em tabela existente; verificado depois que 57 descritivos, 83 sucessoes e 1 vaga seguem intactos. `lib/gente/frontline.ts` (23 testes), 3 rotas, tela `/gente/frontline`, dock e hub. Catalogo editavel, todas as operacoes, teto por ano editavel pelo RH. | Importacao por planilha do catalogo de cargos (hoje so cadastro manual). Parecer do Codex: pendente |
| `light mode — seletor de preservacao casava por substring` | Claude | em revisao | 2026-09-22: **a causa raiz do texto branco invisivel.** As regras que preservam `text-white` sobre fundo colorido usavam `[class*="bg-brand-"]`, que casa por SUBSTRING. `hover:bg-brand-500/5` contem `bg-brand-`, entao o cartao de candidatos (`bg-white/3 ... hover:bg-brand-500/5`) forcava branco puro em todo `text-white` dentro dele. Varredura: **137 elementos em 55 arquivos**. Trocado por `~=` (token exato): fundo solido casa, variante nao casa, fundo tingido nao casa. 296 seletores gerados por cor x tom. Corrigiu de quebra 6 elementos com fundo tingido + text-white (aprovacoes, login). | Passada visual em OBZ/admin/financeiro segue pendente. Parecer do Codex: pendente |
| `light mode — paleta de texto (app inteiro)` | Claude | em revisao | 2026-09-22: **achado que vale para todo o portal.** Da paleta de texto, so `text-slate-400/500/600` estavam remapeados no `globals.css`. `text-slate-300` (#cbd5e1) da 1.4:1 em pagina branca e some — era o motivo dos nomes de cargo invisiveis na previa de importacao. Remapeados agora os tons -100/-200/-300/-400 de slate, brand, emerald, red, rose, amber, yellow, blue, indigo, violet, purple, orange, teal, sky, cyan, pink, fuchsia, cada um para o -600/-700 da familia. Fechadas tambem as lacunas de `bg-white/X` (/1 /4 /6 /7 /20 + 6 hovers), `border-white/X` (/3 /6 /12 /15 /25 /30) e `divide-white/6`. | Conferir visualmente telas fora de Gente (OBZ, admin, financeiro) — a mudanca e global. Parecer do Codex: pendente |
| `importacao — P2028 em transacao interativa` | Claude | concluido | 2026-09-22: importacao de cargos falhava em producao com "Erro de banco de dados". Log: **P2028** — 57 `create()` sequenciais dentro de `$transaction(async tx => ...)` passaram dos 5s (pedido levou 6,6s). Trocado pela forma em lista (`createMany` + updates num batch), que continua atomica. **Mesmo defeito latente em `candidatos/importar`** (create em loop por causa das etapas aninhadas) corrigido junto. Os outros 6 importadores ja usavam `createMany`. | Se aparecer outra importacao com create em loop, aplicar o mesmo padrao. Parecer do Codex: pendente |
| `modulo Gente — importacao de descricao de cargo` | Claude | em revisao | 2026-09-22: planilha "Cargos e Perfil" do RH virou o modelo do descritivo. `cargo-importador.ts` + `MODELO_CARGOS` + rota `/api/gente/cargos/importar` + tela `/gente/cargos/importar`. **Migration `20260922000000_add_curso_reccargo` APLICADA no neondb em 2026-09-22 com autorizacao expressa do PO** (coluna `curso` anulavel; tabela estava com 0 registros, nada afetado). Ensaio com a planilha real: 14/14 cabecalhos, cabecalho na linha 2, 57/57 validos, 0 erros. `tsc` 0 erros, build OK, `test:unit` 351/351 (18 novos). | Conferir com o RH se "Tipo vaga" deve virar enum. Parecer do Codex: pendente |
| `modulo Gente — ficha do sucessor no pipeline` | Claude | em revisao | 2026-09-22: `sucessao/_components/DetalheSucessor.tsx`. Clicar no cartao da matriz abre a ficha completa (cargo, area, operacao, prontidao, habilidade tecnica/comportamental, PDI, acompanhamento, observacao). Busca sob demanda no `GET /api/gente/sucessao/[id]` que ja existia — o payload do pipeline nao cresceu. Leitura de grupo, botao Editar so com `editavel`. Sem rota nova, sem mudanca de schema. `tsc` 0 erros, build OK, `test:unit` 334/334. | Reaproveitar a ficha em `/gente/sucessao/lista` se o PO quiser. Parecer do Codex: pendente |
| `modulo Gente — revisao frontend do pipeline + fix de light mode` | Claude | em revisao | 2026-09-22: matriz nivel x area passou a `table-fixed` e o modulo foi de `max-w-6xl` para `max-w-[1600px]` — cabe inteira sem rolagem lateral. **Bug corrigido: `bg-[#12121c]` nao esta na lista de remapeamento de light mode do `globals.css`**, entao aparecia como bloco preto em pagina branca; trocado por `bg-surface` em 7 arquivos (sucessao, vagas, candidatos, do-banco-de-talentos, pcd, quadro, `components/ui/dock.tsx`). Cartoes agrupados por cargo de destino; legenda, `scope="col"`, regiao rolavel focavel. `tsc` 0 erros, build sem avisos novos, `test:unit` 334/334. | Varrer o resto do app atras de outros hex fora da whitelist de light mode. Parecer do Codex: pendente |
| `modulo Gente — planilha-modelo nos importadores` | Claude | em revisao | 2026-09-21: `modelos.ts` + rota `/api/gente/modelo` gerando xlsx com 3 abas (Dados, Instrucoes, Operacoes do usuario). Telas de vagas e candidatos migradas para o `ImportadorPlanilha` generico. Teste de ida e volta 4/4 sem erro. `test:unit` 223/223. | Bloco 5 (PCD + Aprendizes). Parecer do Codex: pendente |
| `modulo Gente — Fase 2 blocos 3 e 4 (Painel, QLP, Desligamentos)` | Claude | em revisao | 2026-09-21: painel com SLA e funil; QLP e desligamentos com fluxo transacional de desligar; `ImportadorPlanilha` generico; 29 testes novos. Build OK, `test:unit` 217/217. | Bloco 5 (PCD + Aprendizes) — o mais sensivel, laudo e dado de saude. Parecer do Codex: pendente |
| `modulo Gente — Fase 2 bloco 2 (Candidatos + ponte)` | Claude | em revisao | 2026-09-21: `etapas.ts` + `candidato.ts` + `candidato-importador.ts` + `cv-signed-url.ts`; 7 rotas de API (lista/CSV, CRUD, etapas, cv, promover, disponiveis, importar); 5 telas (lista com etapas editaveis, novo, editar, importar, do-banco-de-talentos); 26 testes novos. Ponte `Candidatura` → `RecCandidato` funcionando, com a candidatura original preservada. Build OK, `test:unit` 188/188, smoke somente-leitura OK. | Bloco 3 (Dashboard) ou 4-5 (QLP/Desligados, PCD/Aprendizes). **Consolidar** `cv-signed-url.ts` com a copia em `admin/rh/candidaturas/[id]/cv-url`. Parecer do Codex: pendente |
| `modulo Gente — Fase 2 bloco 1 (Controle de Vagas)` | Claude | em revisao | 2026-09-21: `scope.ts` + `vaga.ts` + `vaga-importador.ts` + `api.ts`; 4 rotas (`/api/gente/vagas`, `/[id]`, `/importar`, `/api/gente/operacoes`); 3 telas (lista com SLA, importacao com dry-run, nova vaga); 28 testes novos. Escopo por operacao no servidor, salario atras de `canViewDadoSensivel`, importacao so grava com `confirmar: true`. Build OK, `test:unit` 162/162, smoke somente-leitura no banco OK. | Acabamento: edicao de vaga pela UI (rota PATCH ja existe). Depois: bloco 2 (Candidatos Stand-By). Parecer do Codex: pendente |
| `modulo Gente — Fase 1 (fundacao)` | Claude | concluido | 2026-09-21: schema (11 models `Rec*`/`Quadro*` + 8 enums) + helpers `canAccessGente`/`canManageGente`/`canViewDadoSensivel`/`escopoOperacoesGente` + `src/lib/gente/vaga-sla.ts` (13 testes) + guarda de rota `/gente` no middleware + shell `/gente` + nav. **Migration `20260921000000_add_gente_recrutamento_quadro` APLICADA no banco (neondb) em 2026-09-21, autorizada pelo PO.** TypeScript 0 erros de source, build OK, `npm run test:unit` 134/134. | Fase 2, bloco 1 (Controle de Vagas). Parecer do Codex: pendente |
| `testes orfaos da remocao de 2026-08-18` | Claude | concluido | 2026-09-21: 3 testes quebrados desde a remocao dos modulos OBZ/Score foram corrigidos — `auth-helpers.test.ts` (importava `isScoreAdmin` inexistente), `middleware-access.test.ts` (esperava redirects de `/financeiro` e `/score`), `tests/support/session-user.ts` (campos `isObzAdmin`/`isScoreAdmin` removidos do tipo). `tests/score-api.test.ts` tirado do `test:unit`/`test:coverage`. | **Codex/PO:** `tests/score-api.test.ts` testa `src/lib/score-upload` que nao existe mais — arquivo orfao, recomendo deletar. Nao deletei por ser de outro agente |
| `modulo Gente (recrutamento + quadro)` | Claude | em andamento | 2026-09-21: zip do RH analisado (Vite+React19+Firestore, ~20.7k LOC, 14 telas). Plano escrito em `docs/plano-integracao-recrutamento.md`. **Direcao do PO: NAO integrar com o sistema atual — construir nativo no portal.** O app do RH e especificacao, nao fonte. Sem Firebase no caminho critico; dados entram por importacao XLSX/CSV. | Iniciar Fase 1 (migration Prisma dos 11 models + helpers de permissao + `vaga-sla.ts` + shell `/gente`). Parecer do Codex: pendente |
| `remocao modulos Agenda, Historico, Score, OBZ, Financeiro` | Claude | concluido | 2026-08-18: Deletados 14 dirs + 3 arquivos lib. Removidos isObzAdmin/isScoreAdmin do schema Prisma, tipos, auth.ts, auth-helpers.ts, session-user.ts, middleware-access.ts, layout.tsx, command-menu.tsx, backup-export/import.ts, admin/usuarios page+route, tasks/review route, manifest.json, middleware.ts. prisma db push aplicado (tabelas OBZ+Score+isObzAdmin+isScoreAdmin removidas do DB). TypeScript 0 erros de source. | — |

### 📅 Controle Diário de Progresso

| Data | Agente | Atividade | Status | Notas |
| :--- | :--- | :--- | :--- | :--- |
| 2026-04-06 | Antigravity | Refatoração HojePage + TaskService | ✅ Concluído | Decomposição em componentes + Lógica de Negócio isolada. |
| 2026-04-07 | Antigravity | StoreService + Premium UI Glow-up | ✅ Concluído | Loja centralizada + UX/Design Premium com Glassmorphism. |
| 2026-04-07 | Antigravity | Confiabilidade + Optimistic UI | 🏗️ Em Início | Testes Unitários + Performance Percebida (SWR). |
| 2026-04-13 | Gemini | World-Class UX: SWR e Skeletons | ✅ Concluído | Dashboard e Universidade atualizados para SWR. |
| 2026-04-13 | Gemini | UX Gamificacao, PWA e Aprovações | ✅ Concluido | Confetes, Cache Offline e Fila Optimistic UI do Gestor. |
| 2026-05-03 | Claude | Light mode world-class — overrides CSS globais | ✅ Concluído | bg-white/X, hover:bg-white/X, border extras, text-white geral + preservações coloridas, ::placeholder. Arquivo: src/app/globals.css |
| 2026-05-08 | Claude | Fix email transport nodemailer→Resend | ✅ Concluído | email.ts migrado para Resend SDK; contato/route.ts usa EMAIL_ADMIN; .env documentado |

---

### 🚀 Estado Atual do Projeto

O sistema passou por uma grande modernização arquitetural:
1.  **Service Layer**: Toda a lógica pesada de Tarefas (`TaskService`) e Loja (`StoreService`) foi extraída das rotas de API para classes de serviço puras e testáveis.
2.  **Dashboard Moderno**: A `HojePage` foi totalmente refatorada, usando SWR para gestão de estado e uma UI Premium com Glassmorphism e animações avançadas.
3.  **Integridade**: Transações financeiras de pontos e estoque da loja agora são atômicas e auditadas.

### 🛠️ Alterações Recentes Importantes

- **Refatoração HojePage**: Decomposta em `TaskCard`, `ProgressSection`, `ChecklistHeader`.
- **StoreService**: Centralização de resgates e gestão de pedidos.
- **Premium UI**: Implementação de `DashboardSkeleton` e temas visuais de alto padrão.
- **TaskService**: Gestão centralizada de conclusão e revisão de tarefas.

### 🎯 Próximos Passos (Backlog de Elite)
- [x] **Testes de Serviço**: Criar testes unitários para `TaskService` (`StoreService` pendente).
- [x] **Optimistic UI**: Implementar mutações otimistas na `HojePage`. (Concluído previamente)
- [ ] **UserService**: Centralizar cálculos de nível e permissões (RBAC).

---

### ⚠️ Pontos de Atenção (Gotchas)
-   O gerenciamento de pontos agora é centralizado no `TaskService` (ganhos) e `StoreService` (gastos). Evite manipular `PointsLedger` diretamente fora desses serviços.
-   A `HojePage` depende de vários hooks SWR; certifique-se de revalidar as chaves corretas ao persistir dados.

### Em andamento

- Claude — execucao da varredura geral, em fases (2026-10-26; usuario deu autorizacao total)
  - fases 1-3 publicadas; migrations `20261026120000_limite_tentativa` e `20261026150000_drop_legado_pontos_visitas` PENDENTES em producao (o usuario aplica; codigo funciona antes e depois); fase 6 (Next 16) na branch `chore/next-16`, validando na previa da Vercel antes do merge

- Claude — linha do tempo: ano em destaque avancando ano a ano (2026-10-26)
  - objetivo concluido e publicado (ano a ano + caminhaozinho); arquivos em posse: nenhum

- Claude — ajustes da critica de design + paginas publicas no visual do hub (2026-10-23)
  - objetivo concluido e publicado; arquivos em posse: nenhum

- Claude — newsletter (autoplay e botoes em linha) + Universidade (retomar video) (2026-10-22)
  - objetivo concluido; arquivos em posse: nenhum (producao migrada com ok do usuario; curso de teste criado)

- Codex — consolidação de contexto (2026-10-19)
  - objetivo concluído: documentação atual para transferência a um novo agente
  - arquivos em posse: nenhum; pacote de contexto concluído
  - não há alteração funcional planejada nesta rodada

- Codex — portal do colaborador (2026-10-16)
  - objetivo concluido: identidade do hub no portal, correcoes de login/atividades/navegacao e retirada temporaria da loja conforme pedido
  - arquivos em posse: nenhum
  - preservadas as alteracoes anteriores do hub, README e ambiente local; nenhuma migracao destrutiva

- Codex — hub institucional (2026-10-16)
  - objetivo concluido: primeira versao local do hub, marca 2026, empresas/unidades, capitulos editoriais e acessos aos modulos existentes
  - arquivos em posse: nenhum
  - preservar alteracoes anteriores em `.gitignore` e neste handoff; nenhum conflito com posse ativa identificado

- Codex
  - data: 2026-10-16
  - objetivo concluido: PostgreSQL local e conta SYS_ADMIN de desenvolvimento; autenticacao e pagina administrativa verificadas
  - arquivos em posse: nenhum

- Claude
  - data: 2026-10-07
  - objetivo: lote de 7 pedidos do PO (2026-10-07) — CONCLUIDO
  - arquivos em posse: nenhum

- Claude
  - data: 2026-09-30
  - objetivo: (1) Pagina publica /carreiras/candidatar derrubando o Safari do iPhone ("Um problema ocorreu repetidamente"). (2) Campos de triagem socioeconomica (genero, idade, escolaridade) na candidatura e filtros no Banco de Talentos.
  - objetivo concluido. arquivos em posse: nenhum. Migration `20260930000000_add_perfil_triagem_candidatura` APLICADA com autorizacao do PO; tudo em producao.

- Claude
  - data: 2026-09-21
  - objetivo: Corrigir a exportação do módulo Gente (bug reportado pelo PO: CSV abrindo em coluna única e com acentos quebrados no Excel pt-BR).
  - arquivos em posse: `src/lib/gente/exportacao.ts` (novo), rotas de export de vagas/candidatos/quadro/desligamentos, telas correspondentes
  - escopo reservado para o restante da Fase 2: `src/app/gente/**`, `src/app/api/gente/**`, `src/lib/gente/**`
  - **`prisma/schema.prisma` foi editado nesta rodada** (11 models + 8 enums, puramente aditivo). Migration gerada e NÃO aplicada: `prisma/migrations/20260921000000_add_gente_recrutamento_quadro/`.

- Claude
  - data: 2026-08-18
  - objetivo: Remocao completa dos modulos Agenda, Historico, Score Clientes, OBZ e Financeiro — concluido
  - arquivos em posse: nenhum

- GPT-5.2 (Cursor)
  - data: 2026-04-16
  - objetivo: Auditoria e correções WCAG/Resiliência na página de Quiz (Universidade)
  - arquivos em posse:
    - `src/app/universidade/[temporadaId]/quiz/page.tsx`
    - `docs/ai-handoff.md`

- GitHub Copilot
  - data: 2026-04-11
  - objetivo: Expandir suite de testes com APIs críticas, ferramentas de cobertura e mocks
  - arquivos em posse: concluído — commits realizados

- Gemini (Antigravity)
  - data: 2026-04-13
    - objetivo: Centralizar RBAC e Hierarquia (UserService).
  - arquivos em posse:
      - pendente
    - concluído — nenhum arquivo bloqueado

### Rodada GitHub Copilot — 2026-04-11 (expansão testes APIs críticas)

Commits: `06420fc` — docs: update ai-handoff with test suite commit status

Expansão significativa da suite de testes seguindo plano de prioridade alta:

**APIs Críticas:**
- `tests/score-api.test.ts` — 12 testes para GET /api/score/clientes e POST /api/score/upload
- `tests/notifications-api.test.ts` — 9 testes para GET/PATCH /api/notifications
- `tests/feed-api.test.ts` — 6 testes para GET /api/feed

**Ferramentas e Infraestrutura:**
- c8 instalado para cobertura de código
- Script `test:coverage` adicionado ao package.json
- CI workflow atualizado com upload para Codecov
- Mocks externos preparados (Cloudinary, Resend, QRCode) em `tests/support/external-mocks.ts`

**Qualidade e Segurança:**
- `tests/validations-edge-cases.test.ts` — 12 testes para validações, rate limiting, OWASP
- `tests/performance-scalability.test.ts` — 12 testes para queries, cache, concorrência, monitoramento

Resultado: 51 novos testes criados (totalizando 102 testes), estrutura completa para expansão futura, ferramentas de cobertura implementadas. Todos os testes executam sem erro de sintaxe.
- `tests/e2e/login-flow.spec.ts` — E2E login
- `src/lib/obz.ts` — lib OBZ
- `docs/guia-importacao-obz.html` — guia importação
- `src/app/carreiras/preview/page.tsx` — preview carreiras
- `test-results/.last-run.json` — artefato testes

Resultado: Suite de testes completa versionada; CI pronto para execução em pushes/PRs.

### Bloqueios e alertas
- **2026-09-21 — ALERTA DE SEGURANCA/LGPD (sistema externo, fora deste repo).** O app "Gestao de Recrutamento" entregue pelo RH roda sobre um Firestore com `allow read, write: if true` na colecao `app_data`. Ficam expostos publicamente: laudos medicos de PCD (dado sensivel, art. 11 LGPD), curriculos em base64, salarios, desligamentos e senhas de usuario em texto puro (incluindo a mestre `dpb2026`, hardcoded no bundle). Detalhamento em `docs/plano-integracao-recrutamento.md` §1.2. **Decisao do PO: nao integrar com esse sistema.** Logo, isto nao e divida tecnica nossa — e o principal motivo para desligar o app assim que o modulo `/gente` atingir paridade (Fase 4). Comunicacao ao juridico/DPO segue pendente e nao e decisao de engenharia. **O portal nunca deve abrir conexao com esse Firestore.**
- 2026-09-21: `gestao de recrutamento/` esta no workspace como pasta nao versionada contendo o zip do RH. Nao commitar o zip no repo — ele carrega PII real e `firebase-applet-config.json`. Avaliar entrada no `.gitignore`.
- Snapshot 2026-04-09: `git status --short` esta limpo de diffs rastreados, mas ha um lote inteiro de testes/CI ainda nao versionado em `.github/workflows/tests.yml`, `playwright.config.ts`, `tests/e2e/login-flow.spec.ts`, `tests/colaborador-flow.test.ts`, `tests/gestor-flow.test.ts`, `tests/universidade-flow.test.ts`, `tests/seguranca-acesso.test.ts`, `tests/concorrencia.test.ts`, `tests/auditoria-deep.test.ts`, `tests/obz-concorrencia.test.ts`, `src/lib/obz.ts` e `test-results/.last-run.json`. Nao apagar nem sobrescrever ao mudar de frente.
- Snapshot 2026-04-09: `docs/guia-importacao-obz.html` tambem esta nao versionado e nao apareceu referenciado por `rg`. Preservar o arquivo, mas validar depois se ele deve morar em `docs/` como documentacao oficial ou fora do repo.
- `src/lib/obz.ts` aparece como arquivo novo sem referencias por import no estado atual do workspace. Confirmar se ele faz parte do lote OBZ antes de versionar junto de outra tarefa.
- `test-results/.last-run.json` parece ser apenas artefato gerado pelo Playwright; nao tratar como fonte de verdade de implementacao.
- Mudancas detectadas tambem em `src/app/admin/obz/page.tsx`, `src/app/api/admin/obz/tendencia-compliance/`, `src/app/gestor/aprovacoes/page.tsx`, `src/app/obz/page.tsx` e `src/app/universidade/page.tsx`. Nao sobrepor sem revisar o diff.
- Mudancas detectadas fora do escopo atual em `src/app/app/hoje/page.tsx`, `src/app/app/loja/page.tsx`, `src/app/app/pontos/page.tsx`, `src/app/app/ranking/page.tsx` e `src/components/ui/skeleton.tsx`. Evitar sobreposicao sem revisar o diff.

- `public/logos/paubrasil.png` removido — origem desconhecida. Nao restaurar sem validar com o usuario.

### Revisoes cruzadas pendentes
- Atualizacao 2026-03-31: `universidade/temporadas`, `universidade/temporadas/[id]`, `universidade/acesso/[temporadaId]`, `universidade/quiz/[temporadaId]`, `universidade/progresso` e `universidade/certificados` alinhados a usuario efetivo, escopo por empresa/unidade e acesso automatico por funcao. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-03-31: `obz/importar`, `obz/lancamentos`, `obz/meus-pacotes` e `obz/is-dono` alinhados aos helpers centrais com usuario efetivo. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-03-31: `obz/submissao-anual`, `obz/periodo*`, `obz/estrutura*`, `obz/justificativas*` e `obz/area-pacote/[id]` alinhados aos helpers centrais com usuario efetivo e regra de dono/departamento preservada. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-03-31: `financeiro/reconciliacao*` e `financeiro/consolidado` alinhados a `isObzAdmin` com usuario efetivo do banco. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-03-31: `gestor/metas`, `relatorio/[userId]`, `agenda/[id]/convidar` e `historico` alinhados a helpers centrais com usuario efetivo e escopo real de equipe. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-03-31: `admin/funcoes`, `admin/atividades` e `admin/upb/*` alinhados a helpers centrais com usuario efetivo, escopo por empresa e escopo por companhia nas rotas UPB. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-03-31: `admin/metas`, `admin/produtos`, `admin/unidades`, `admin/pedidos` e `admin/auditoria` alinhados a helpers centrais com usuario efetivo do banco. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-03-31: `admin/usuarios*`, `api/usuarios*` e `admin/resgates` alinhados a helpers centrais com usuario efetivo do banco. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-03-31: `empresa/*` e `admin/empresas*` alinhados a helper central de usuario efetivo + helpers de permissao. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-03-31: `coord/aprovacoes` e rotas de `score` alinhadas aos helpers centrais com revalidacao no banco. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-04-01: rotas self-service (`agenda`, `tasks`, `checklist`, `conquistas`, `loja`, `pontos`, `resgates`, `notifications`, `me/*`, `metas/minha`) e a rota legada `admin/funcoes/[id]` ficaram sem `session.user as any`, com validacao de TypeScript verde. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-04-04: `middleware`, `app/layout`, `app/inicio`, `login`, `agenda`, `historico`, `score` e `empresa/usuarios` passaram a usar helpers centrais de permissao e deixaram de repetir checks inline de `role` e `nivel` nesse fluxo. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-04-04: `admin/usuarios` e o filtro de gestores em `empresa/usuarios` passaram a usar helpers compartilhados para `role` e `nivel`, fechando a sobra de arrays inline nas telas de usuarios fora de OBZ. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-04-04: labels e opcoes de `role` e `nivel` foram consolidados em `src/lib/user-display.ts`, com aplicacao em `perfil`, `gestor/relatorio`, `admin/usuarios` e `empresa/usuarios`. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-04-04: `gestor/dashboard`, `gestor/relatorio`, `empresa`, `ranking`, `hoje`, `perfil` e `universidade/certificados` ficaram sem `session.user as any`, com exibicao de unidades em `perfil` alinhada ao campo tipado `units`. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-04-04: `middleware` teve a decisao de redirect extraida para `src/lib/middleware-access.ts`, com testes leves em `auth-helpers` e no fluxo de redirects usando o runner nativo do Node. Aguardando parecer do Claude sobre este batch.

- Atualizacao 2026-03-31: revogacao de acesso reforcada com refresh do JWT, invalidacao de sessao para usuario inativo e refetch automatico no cliente. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-03-31: exclusao de atividades na area de coordenacao corrigida com rota propria. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-03-31: checks antigos com `ADMIN` removidos de `global-goal` e `admin/cockpit`. Aguardando parecer do Claude sobre este batch.
- Atualizacao 2026-03-31: primeira leva de correcoes aplicada pelo Codex. Aguardando parecer do Claude sobre este batch.
- Correcoes de autenticacao/permissoes (JWT, role/nivel, drift) — plano ainda nao definido. Parecer do Claude registrado no historico.

## Regra de Revisao Cruzada

Quando um agente concluir uma rodada relevante, o outro agente deve, quando possivel, registrar um parecer curto aqui com quatro pontos:

- o que ficou bom
- risco ou fragilidade observada
- como poderia ficar melhor
- se recomenda seguir, ajustar ou refatorar

Se nao houver tempo para revisar na mesma rodada, registrar `parecer pendente`.

Discordancia tecnica e bem-vinda, desde que seja registrada com clareza e sem sobrescrever o trabalho do outro agente sem revisar o diff.

## Template de Registro

Use este formato:

### AAAA-MM-DD HH:MM - Agente - Tipo de rodada

- Status:
- Objetivo:
- Arquivos em posse:
- Arquivos alterados:
- O que foi feito:
- Parecer do outro agente:
- Melhorias sugeridas pelo outro agente:
- Pendencias / riscos:
- Proximo passo sugerido:

## Registro de Rodadas

### 2026-10-26 - Claude - Varredura: fase 6 (Next 16, React 19, sem next-pwa)

- Branch `chore/next-16`. `next` 14.2 -> 16.4.3, `react`/`react-dom` 19.3, `@types/react*` 19, `lucide-react` 1.61 (0.441 nao aceitava React 19), `eslint` 9 + `eslint-config-next` 16. `npm audit`: **0 vulnerabilidades**.
- Params assincronos: codemod oficial (`next-async-request-api`, 41 arquivos) + script para o que ele nao pega: handlers dentro de `withHandler(async (req, { params }: {...}) =>` (21) e rotas do Gente com `type Ctx` + `withHandler<Ctx>(async (_req, { params }) =>` (35) -> `ctx` + `const params = await ctx.params`. Refs do React 19 (`RefObject<T | null>`).
- `next-pwa` removido (cadeia vulneravel do workbox; cacheava APIs que nem existem mais). Novo `public/sw.js` escrito a mao: push + notificationclick (vindos de `worker/index.js`) e pagina offline embutida para navegacao sem rede; ao ativar apaga os caches antigos do next-pwa nos aparelhos. Registro em `providers.tsx` (so producao). Removidos `worker/`, `src/app/offline`.
- `middleware.ts` -> `src/proxy.ts`. `next.config.js`: `serverExternalPackages`, sem `instrumentationHook`. Sentry: `sentry.client.config.ts` -> `instrumentation-client.ts` (+ `onRouterTransitionStart`); `onRequestError` no `instrumentation.ts`.
- Turbopack (padrao no build) rejeitou seletores `.bg-\[#0a0a0f\]` do `globals.css`: `#` escapado (`\[\#...`), 25 ocorrencias.
- ESLint 9 flat (`eslint.config.mjs`; `npm run lint` = `eslint .`). Regras novas do React Compiler como aviso (set-state-in-effect 35, purity, refs, static-components) — conversao e rodada propria; a barra lateral do portal recriada a cada render (static-components) e a primeira candidata.
- `tests/e2e/portal-colaborador.spec.ts` estava obsoleto (loja, atividades, pontos, perfil so-Universidade) e falhava escondido (pulado por padrao): reescrito para o portal atual; passa com `PORTAL_E2E_DB=1` (2/2).
- Validacao local: tsc, lint (0 erros), `npm test` 529/0, build; 25 paginas publicas/internas 200 sem erro de JS/API, rotas com [id] (universidade, newsletter, vagas, aderencia, PATCH usuario) ok, proxy redireciona sem login.
- Parecer do outro agente: pendente.

### 2026-10-26 - Claude - Varredura: fase 5 (estrutura)

- `Hub.module.css`: removidas 41 declaracoes mortas (mesmo seletor + mesma cadeia de @media redeclarando a propriedade depois) e 7 regras vazias, via postcss; ordem intacta. Conferido com capturas de 7 paginas em 1440/900/390: diferenca zero fora do ruido conhecido (logo SVG animada e ordem dos cursos vinda do banco). Os demais seletores repetidos estao em media queries diferentes ou mexem em outras propriedades (legitimos); dividir o arquivo exigiria trocar imports de varios componentes — nao feito.
- Cadastros pendentes (lista + aprovar + rejeitar) extraidos para `src/components/usuarios/CadastrosPendentes.tsx` (`api="/api/admin" | "/api/empresa"`, `mostrarEmpresa`, `onTotal`); `/admin/usuarios` 1189 -> 966 linhas, `/empresa/usuarios` 770 -> 577. Testado: pedido criado por /registro aparece com contador e coluna Empresa; rejeicao aplicada.
- Handoff: rodadas ate 2026-10-19 movidas para `docs/historico/ai-handoff-rodadas-ate-2026-10-19.md` (3169 -> ~750 linhas).
- Analisado e mantido: `/talentos` (curriculos do site: CV, etapas, notas) e `/gente/candidatos/do-banco-de-talentos` (promove curriculo para o funil do Gente) sao complementares, nao duplicados.
- Fica para rodada propria: migrar o portal para os tokens do hub e apagar as ~400 linhas de remapeamento `.app-shell` do `globals.css` (mexe em ~40 telas).
- Validacao: tsc, lint, `npm test` 529/0, E2E hub 3/3, build.
- Parecer do outro agente: pendente.

### 2026-10-26 - Claude - Varredura: fase 4 (dependencias e validacao)

- `npm audit fix` sem major: `next-auth` 4.24.15, `@sentry/nextjs` 10.76.2 e transitivas.
- `xlsx` 0.18.5 (prototype pollution e ReDoS, sem correcao no npm) -> 0.20.3 pelo tarball oficial `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` (a SheetJS saiu do npm). Modelo de planilha do Gente testado ao vivo.
- `zod` 3.25 -> 4.6.7 (vulnerabilidade de memoria). Ajustes: `.errors` -> `.issues` (2), `errorMap` -> `error` no `z.literal` da LGPD. Novo `src/lib/zod.ts` com `z.config(z.locales.pt())` (mensagens padrao em portugues) — **importar `z` de `@/lib/zod`, nao de `zod`**; os 54 imports foram trocados.
- Bug: 28 rotas devolviam `{ error: parsed.error.flatten() }` (objeto); telas que exibem `error` como texto quebravam (ex.: contato com mensagem curta derrubava a pagina). Agora `{ error: mensagemDeValidacao(...), detalhes: flatten() }`, mesmo formato do modulo Gente. Contato com `minLength` na tela.
- Restante do audit: `next` (critico; so o 16 corrige) e a cadeia do `next-pwa` (build) ficam para a fase 6.
- Validacao: tsc, lint, `npm test` 529/0, build; ao vivo: modelo xlsx, candidatura sem LGPD (mensagem certa), contato e setup-password com mensagens em portugues.
- Parecer do outro agente: pendente.

### 2026-10-26 - Claude - Varredura: fase 3 (banco legado e backup completo)

- **Backup diario estava incompleto:** a lista de tabelas era manual e nao tinha nada do modulo Gente (Rec*, Quadro*), newsletter nem endomarketing (20 tabelas). Novo `src/lib/backup-modelos.ts` deriva tudo do `Prisma.dmmf`: ordem topologica pelas FKs, segundo passo para auto-referencia/ciclo, chave primaria (`id` ou `key`), campos `Bytes` (fotos da newsletter vao como `{ $bytes: base64 }`). `FORA_DO_BACKUP` so tem `LimiteTentativa`. `backup-export.ts`/`backup-import.ts` usam essa lista; import avisa tabela que nao existe mais no schema (backups antigos). Testes novos garantem cobertura de todos os models e ordem das FKs. Teste local: 43 tabelas, ~20 MB com 121 fotos, reimportacao sem erro e foto identica.
- **Restaurar pela tela nao funcionaria** (upload > 4,5 MB e cortado pela Vercel): `api/admin/backup/import` aceita JSON `{ jobId, dryRun }` e le o arquivo do Blob; botoes "Simular" e "Restaurar" em cada backup da lista.
- Legado removido (codigo + migration `20261026150000_drop_legado_pontos_visitas`): tabelas `LeaderVisit`, `VisitaObrigatoria`, `Operation`, `TaskDefinition`, `TaskInstance`, `PointsLedger`, `RewardProduct`, `RedemptionOrder`, `GlobalGoal`, `FeedEvent`, `MetaPontuacao`; enums `Frequency`, `TaskStatus`, `LedgerKind`, `LedgerStatus`, `OrderStatus`, `LeaderVisitStatus`; colunas `User.isItinerantLeader/isVisitasAdmin/leaderTitle/managedAreaIds/targetRewardId` e `UPBTemporada.pontosNoCertificado`. Tela/API `/admin/operacoes` (sem link no menu), rota duplicada `src/app/admin/funcoes/[id]/route.ts`, `prisma/seed-operations.ts`, partes de tarefas/loja do `seed.ts`, credito de pontos na Universidade, filtro "Aprovadores" e campos de lider itinerante na tela de usuarios, flags na sessao.
- Migration conferida: aplicada no banco local e `prisma migrate diff` so mostra o drift antigo de indices (AuditLog/Notification/RecCargo), que ficou de fora.
- Validacao: tsc, lint, `npm test` 529/0, E2E 4 ok / 3 pulados / `login-flow` (conta gestor so existe no seed do CI); telas admin usuarios/upb/funcoes/backup e edicao de usuario (PATCH 200) sem erro.
- Observacao: GitHub Actions do repo tem 0 execucoes (workflow `tests.yml` nunca rodou).
- Parecer do outro agente: pendente.

### 2026-10-26 - Claude - Varredura: fases 1 e 2 (seguranca, bugs e limpeza)

- `prisma/auxiliar` (URL do Neon com senha, repo publico) removido e ignorado no `.gitignore`. **Senha do Neon precisa ser trocada pelo usuario** (integracao Vercel `neon-rose-compass`; sem acesso de login aqui). O arquivo segue no historico do git.
- Limites de tentativa: novo `src/lib/limite-tentativas.ts` + model `LimiteTentativa` (migration aditiva `20261026120000_limite_tentativa`), janela fixa com `INSERT ... ON CONFLICT` no Postgres; falha do banco libera a tentativa. Substitui os `Map` em memoria e o Upstash (nunca configurado em producao: nao ha env UPSTASH): login (por e-mail; zera no sucesso), registro, upload-cv, parse-cv, candidatura (IP e e-mail). Cron `limpar-cvs` apaga contadores vencidos. Contato ja limitava pelo AuditLog (mantido).
- 2FA: removida a rota morta `api/auth/totp/verify` (sem uso e sem limite) e o token temporario assinado com `NEXTAUTH_SECRET ?? 'fallback-temp-secret'`; o login so devolve `TOTP_REQUIRED:` e o cliente reenvia com o codigo (contado no limite de login).
- `setup-password` agora aplica `validatePasswordPolicy` (aceitava 8 caracteres sem regra); dica da regra na tela. Senhas fracas: checagem por raiz contida (`WEAK_PASSWORD_ROOTS`), antes era igualdade e nunca pegava nada. `tests/provisioning-api.test.ts` entrou no `npm test` (526/0).
- Curriculo: limite unico de 4 MB (`CV_MAX_BYTES` em `carreiras-perfil.ts`; a Vercel corta acima de 4,5 MB) na tela e nas rotas; a tela recusa na hora o arquivo grande ou que nao e PDF. `upload-cv` nao revela mais o nome de quem ja enviou o mesmo PDF.
- Limpeza: removidos `nodemailer`, `@types/nodemailer`, `jose`, `@upstash/ratelimit`, `@upstash/redis`, `src/lib/rate-limit.ts`, `public/brand/logo-principal.png`, tipos `FaixaEtaria`/`ConteudoNossaGente`; `next.config.js` sem nodemailer/date-fns e com `webpack.treeshake.removeDebugLogging` no lugar de `disableLogger`. Pasta local `postman/` (fora do git) apagada — continha 1 arquivo que nao foi inspecionado antes (erro meu, avisado ao usuario).
- Validacao: tsc, lint, `npm test` 526/0, E2E hub 3/3, build; testes locais: 6a tentativa de login bloqueada ("Tente novamente em 9 minutos"), login real ok, registro 429 na 6a, upload 4,2 MB recusado, tela recusa 4,3 MB sem chamar o servidor.
- Parecer do outro agente: pendente.

### 2026-10-26 - Claude - Varredura geral do codigo (somente analise)

- Ferramentas: grafo de imports proprio (knip nao roda com TS 5.9), exports sem uso, deps sem uso, `npm audit --omit=dev`, `next lint`, varredura de segredos no historico do git (mascarada), auditoria de rotas de API, models do Prisma sem uso, links internos quebrados, CSS duplicado.
- **URGENTE (seguranca):** `prisma/auxiliar` versionado desde o 1o commit com URL completa (com senha) de um banco Neon (`ep-long-sea-...`); o repositorio GitHub e PUBLICO. Nao foi possivel confirmar se e o banco de producao atual (o classificador negou puxar o env de producao para comparar). Acao recomendada: trocar a senha no Neon e atualizar as envs na Vercel, apagar o arquivo, avaliar deixar o repo privado.
- Bugs: tela de curriculo diz "max. 5 MB" e `upload-cv` recusa > 2 MB (erro so no ultimo passo); `NEXTAUTH_SECRET ?? 'fallback-temp-secret'` em `auth.ts` e `totp/verify`; limites de tentativa em `Map` em memoria (login, registro, upload-cv, candidaturas) nao funcionam em serverless; `upload-cv` revela o nome do candidato quando o PDF e duplicado; `totp/verify` sem limite; `tests/provisioning-api.test.ts` fora dos scripts e com 1 falha (blocklist).
- Limpeza: `nodemailer` + `@types/nodemailer` sem uso (so no next.config); `public/brand/logo-principal.png` (1,6 MB) sem uso; `postman/` com pastas vazias (fora do git); tipos mortos `FaixaEtaria` e `ConteudoNossaGente`; Universidade ainda credita `PointsLedger` (pontos retirados); Sentry `disableLogger` deprecado.
- Banco legado (precisa migration + ok): `LeaderVisit`, `VisitaObrigatoria`, `Operation` (+ `/admin/operacoes`), `TaskDefinition`, `TaskInstance`, `PointsLedger`, `RewardProduct`, `RedemptionOrder`, `GlobalGoal`, `FeedEvent`, `MetaPontuacao`.
- Dependencias: 3 criticas (`next` so corrige no 16, major; `next-auth` e `@sentry/nextjs` com fix sem major), `xlsx` sem fix no npm, `zod` 4 (major), `next-pwa` descontinuado.
- Estrutura: `Hub.module.css` 3.8 mil linhas com 113 seletores redefinidos; 402 linhas de remapeamento `.app-shell` no `globals.css`; `admin/usuarios` e `empresa/usuarios` ~65% iguais; `/talentos` x `/gente/candidatos/do-banco-de-talentos` sobrepostos; este handoff com 3,1 mil linhas.
- Saudavel: nenhum arquivo de `src` orfao, lint e tsc limpos, 511 testes, sem links internos quebrados (rotas antigas vao para a lista de redirecionamento de `portal-features.ts`).
- Parecer do outro agente: pendente.

### 2026-10-26 - Claude - Linha do tempo: um ano em destaque por vez

- Feedback (print do WhatsApp): "falta destaque", "comecar como se um ano estivesse selecionado e ir pulando ano a ano dando destaque a frase".
- `HubTimeline` (`HubInteractive.tsx`): estado `year` alem da era. Passagem automatica ano a ano e, no ultimo ano, para a proxima era; tempo por ano proporcional ao texto (`yearMs`: 4-8 s). Tempo decorrido em ref (pausar/retomar continua de onde parou, igual a newsletter). Setas andam ano a ano (atravessam eras); clicar no numero do ano (botao, `aria-pressed`) ou em qualquer parte da linha destaca. Barra da aba da era enche ano a ano (`--from`/`--to` no keyframe `eraProgress`, `fill-mode: both`).
- Mesmo bug da newsletter removido: nao pausa mais no hover/foco de mouse (no celular travava); so botao (`data-era-toggle`) e foco de teclado; play limpa a pausa do teclado.
- Visual (`Hub.module.css`, bloco final): ano ativo com cartao branco atras (`li::after`), numero em vinho e texto em preto; os outros em `scale(.78)` / `#8a7565` / `--muted` (contraste mantido). Nada muda de altura, entao a estrada e os alfinetes nao se movem. Alfinete ativo `scale(1.25)` com pulso; os outros 0.45 de opacidade. Movimento reduzido: sem autoplay, sem esmaecer.
- Gotchas: o numero do ano virou `<button>` e `.hub button { font: inherit }` zerava o tamanho; `font: 500 34px/1 inherit` e invalido (o navegador descarta) — usar propriedades separadas.
- `tests/e2e/hub.spec.ts`: "Era anterior" -> "Ano anterior".
- Validacao: Playwright em 1440 e 390 (troca de ano no tempo do texto, alfinetes alinhados, clique, seta, pausa parada por 9 s, play retoma do ponto: 3,3 s restantes de 5,4 s); tsc 0; `npm test` 511/0; E2E hub 3/3.
- Caminhaozinho (pedido do usuario na sequencia): em `EraRoad`, um `<g>` com caminhao visto de cima (bau claro com faixa vinho, cabine vinho), desenhado antes dos alfinetes. Posicao e giro por JS com `getPointAtLength` no path da estrada: comprimento de cada alfinete = ponto amostrado mais proximo (a curva passa pelos pinos); para `lane + 6` depois do alfinete ativo (a cabeca do pino fica acima). Viagem com easing (500-1600 ms conforme a distancia), de re quando volta (gira 180), primeira viagem espera 900 ms a estrada aparecer; cada era entra pelo topo (o painel remonta por `key`). Movimento reduzido: posiciona sem animar. Testado em 1440 e 390: para ~22 px abaixo do pino, inverte na volta, entra pelo topo na troca de era, sem erros.
- Parecer do outro agente: pendente.

### 2026-10-23 - Claude - Paginas publicas restantes na identidade do hub

- Pedido: "passe tudo pro visual novo". Escopo: paginas publicas que ainda tinham o tema escuro verde. Portal interno (`/app`, `/gente`, `/admin`) fora: tem o proprio remapeamento claro (`.app-shell`/`portal-brand`).
- `/carreiras`: HubNav/HubFooter, hero "Gente que cresce.", CTA do banco de talentos em bloco vinho, lideranca geral e cidades em cartoes brancos com avatar em placa areia; painel da cidade (CityView) claro com cabecalho areia; lightbox claro. `AREA_CONFIG` virou so rotulo (as cores neon por area sairam; `filial.color` do banco nao e mais usado na pagina). Logica (API de lideres, foco, Esc, analytics) intacta.
- `/contato`: HubNav/HubFooter, formulario em cartao branco com labels ligados aos campos (`htmlFor`).
- `/registro`: mesma moldura do login (`layout.tsx` com `portal-brand portal-login`, reaproveita `Login.module.css`) + `Registro.module.css` (etapas, selects, checklist da senha, botao secundario, tela de concluido).
- `global-error.tsx` (estilos inline: substitui o layout raiz) e `/offline` claros.
- `Login.module.css`: textos de 9-11px para 12px e cinzas `#72675e/#85796d/#8b7e72` para `#6f5c4e` (contraste; o rodape "© Grupo Pau Brasil" dava 4.0:1).
- Removido `src/app/_components/PublicBackground.tsx` (sem uso).
- Validacao: auditoria Playwright em 1280 (tema escuro) e 390 (claro): nenhum elemento verde, 0 textos abaixo de 4.5:1, sem transbordo; painel da cidade com lideres simulados abre, sem transbordo, fecha com Esc. tsc 0; `npm test` 511/0; E2E 4 passaram, 3 pulados, 1 falha anterior a rodada (`login-flow` usa conta `gestor@` inexistente no banco local; falha igual com as mudancas guardadas no stash).
- Removido `/carreiras/preview` (prototipo antigo no tema verde, sem link no site) com ok do usuario. Publicado com deploy.
- Parecer do outro agente: pendente.

### 2026-10-23 - Claude - Envio de curriculo (/carreiras/candidatar) na identidade do hub

- Pedido: "a area de anexar curriculo ainda esta com aquela area verde". A pagina inteira (e os modais LGPD e descritivo do cargo, e `EmailsCurriculo`) ainda usava o tema escuro verde antigo (`brand-*`/emerald, logo "P", `PublicBackground`).
- Agora: cabecalho e rodape do hub (`HubNav`/`HubFooter` dentro de wrapper `.hub`, sticky), Montserrat, fundo papel, cartao branco, vinho nos estados ativos/selecionados, areia nas sugestoes, botoes vinho no padrao do hub, foco dourado, fonte minima 12px, confete nas cores da marca.
- `globals.css`: classe `.tema-claro` — o `<html>` tem `.dark` e a regra global `.dark select` deixava os selects azul-escuros; dentro de `.tema-claro` ficam brancos, e os titulos herdam a fonte (a regra global de h1-h6 punha Plus Jakarta).
- Bug pego no teste: com 12px os selos "Vaga aberta"/"detalhes" saiam do card e cobriam o vizinho; o conteudo do card agora quebra linha.
- Validacao: fluxo completo com APIs simuladas no Playwright (sem upload real; o Blob e o mesmo da producao) em 1280 e 390: nenhum elemento verde, sem transbordo, modais e tela de concluido ok; tsc 0; `npm test` 511/0; E2E hub 3/3.
- `/carreiras` e `/contato` convertidos na rodada seguinte (abaixo).
- Parecer do outro agente: pendente.

### 2026-10-23 - Claude - Ajustes da critica de design e separacao do cabecalho

- Decisao do usuario: o hero continua ABAIXO da newsletter (pedido da diretoria). O resto da critica foi aprovado.
- Cabecalho (`HubShell.tsx`): fundo areia claro (`#f4efe8`), linha areia e sombra curta; sombra mais forte depois de rolar (`data-scrolled`). Newsletter com fundo branco (opcao B escolhida pelo usuario apos comparacao A/B).
- Contraste: novo token `--muted: #6f5c4e` substitui 15 cinzas-marrons que ficavam entre 3.2 e 4.4:1; auditoria local deu 0 textos abaixo de 4.5:1. Fonte minima de 12px (29 regras de 10/11px).
- Celular: faixa de logos do hero em grade 4x2 (ate 800px), sem rolagem lateral; cards das empresas horizontais e compactos ate 600px (secao de ~4.070px para ~2.260px em 390px).
- Barrinhas de foto da newsletter com area de toque de 24px (traco segue com 3px). Programas da Universidade em placas areia. Botao "Cadastrar meu curriculo" das vagas em contorno. Eyebrows sem icone (home e /nossa-gente). "Explore nossas empresas" com seta para baixo (ancora na pagina).
- Removidos: faixa de acessos rapidos (01/02/03), frase "Origem, crescimento e pertencimento." e nota interna do catalogo de cargos, com o CSS morto correspondente.
- `tests/e2e/hub.spec.ts`: o teste de transbordo ignora elementos dentro de faixa com rolagem lateral (abas da newsletter). O E2E do hub passou 3/3, incluindo o teste de celular que falhava desde antes.
- Validacao: tsc 0; `npm test` 511/0; auditoria Playwright em 320/390/700/1440 sem transbordo.
- **Newsletter (pedido principal da diretoria): pausa/play nao voltava a passar.** Causa: o carrossel pausava no hover e o botao de play fica dentro da area, entao com o mouse ali o play nao retomava; no celular o toque gera "mouse entrou" sem "mouse saiu" e travava de vez; no teclado o foco no proprio botao segurava a pausa. Correcao: sem pausa no hover; o botao (`data-news-toggle`) nao conta como foco que pausa; o play limpa as pausas temporarias (clique e foco). Testado com mouse, toque e teclado: pausado fica parado e o play volta a passar; retoma do ponto (1,46 s restantes de 4 s) e troca de campanha normalmente.
- Parecer do outro agente: pendente.

### 2026-10-23 - Claude - Critica de design da home em producao (somente analise)

- `/design-critique` em https://pau-brasil-development.vercel.app/ com capturas desktop (1440) e celular (390) e auditoria automatica (contraste, alvos de toque, alt, escala de fontes). Nenhum arquivo de codigo alterado.
- Principais achados: newsletter acima do hero rouba a primeira impressao; brand strip cortada no celular (pendencia antiga do E2E); 46 textos abaixo de 4.5:1 (a maioria 4.0-4.4, piores 3.24 nos numeros 01/02/03 e 3.61 nas eras inativas); barrinhas de foto da newsletter com 15 px de altura; 19 tamanhos de fonte (10 px nas datas das abas); pagina com 12.900 px no celular, sendo 4.000 px so na secao Empresas.
- Parecer do outro agente: pendente.

### 2026-10-22 - Claude - Newsletter mais estavel, botoes em uma linha e "voltar de onde parou" na Universidade

- Feedback (print do WhatsApp): "o play ta bugando as vezes", "botoes sempre na mesma linha", e testes de video no portal com "voltar de onde parou".
- `HubNewsletter.tsx`: causas do bug — (1) timer com `if (document.hidden) return` nao reagendava e travava; (2) `onFocus` pausava ate o foco sair, entao qualquer clique de mouse parava o carrossel; (3) hover zerava o tempo. Agora: tempo decorrido em ref (pausa congela, retomar continua), `visibilitychange` pausa/retoma, foco so pausa se `:focus-visible` (teclado), clique segura 6 s (`CLICK_HOLD_MS`), barrinha sempre montada com `animation-play-state`. Botoes em uma linha com rolagem lateral, mascara nas pontas, setinhas (so mouse) e campanha ativa centralizada. Gotcha: `.newsGrid > * { min-width: 0 }` — sem isso a linha nao-quebrante alargava a coluna e estourava o celular.
- Universidade: `UPBProgresso` ganhou `posicaoSeg`, `duracaoSeg`, `vistoEm` + indice (migration `20261022200000_upb_progresso_posicao`, aditiva, a mao). Nova rota `/api/universidade/posicao` (POST salva posicao com as mesmas regras de acesso do progresso; GET devolve o ultimo episodio em andamento). Player: abre em `?ep=` ou no episodio em andamento, `playerVars.start` com a posicao salva (>=10 s e longe do fim), aviso "Retomando de m:ss · Comecar do inicio", salva a cada 10 s tocando, ao pausar/terminar, ao trocar de episodio e ao esconder/fechar (sendBeacon). Card "Continue de onde parou" em `/universidade`.
- Curso de teste "Treinamento Roteirizador (teste de video)" com 2 videos do canal Pau Brasil Ambev, no `prisma/demo-apresentacao.ts` (o `--remover` tambem o apaga, incluindo progressos).
- Validacao: tsc 0; `npm test` 511/0; `next build` ok; E2E local da newsletter (aba escondida pausa e retoma, clique segura e volta, hover continua do restante, 1 linha desktop/mobile, sem transbordo) e da retomada (API 200/400/404, sem login 401, card, `start=95`, aviso, "Comecar do inicio"). Reproducao real do YouTube nao testavel no Chromium headless (sem codecs): confirmar no navegador.
- Parecer do outro agente: pendente.

### 2026-10-22 - Claude - Conteudo de DEMONSTRACAO em producao (apresentacao a diretoria)

- A pedido explicito do usuario, para a apresentacao: `prisma/demo-apresentacao.ts --gravar` em producao criou 2 avisos, 3 reconhecimentos (nomes ficticios: Maria Teste, Joao Exemplo, Ana Silva), 3 campanhas no calendario, 3 numeros do mes, 2 vagas abertas (empresa "Demonstracao (remover)", slug `demo-apresentacao`, invisivel no site publico) e 3 cursos da Universidade (episodios com video de exemplo, nao tocam).
- **REMOVER antes de usar com dados reais:** `npx tsx prisma/demo-apresentacao.ts --remover` (apaga exatamente esses itens; testado em banco descartavel).
- Parecer do outro agente: pendente.

### 2026-10-22 - Claude - Voltar para o inicio em /newsletter e /nossa-gente

- `/newsletter`: link "Voltar para o inicio" (padrao `textLink` vinho, igual ao "Ver todas as campanhas") na area clara acima das fotos. `/nossa-gente`: link discreto no topo escuro (abaixo dele vem a faixa vinho dos numeros).
- Pendencia registrada a pedido do usuario: melhorar depois o tratamento de fotos do servidor (tamanho e formato, ex.: HEIC com mapa de profundidade).
- Parecer do outro agente: pendente.

### 2026-10-22 - Claude - Campanhas 2026 de Patos/Sume, arquivo /newsletter e noticias gerais

- Fonte: servidor de arquivos da empresa (`smb://172.16.51.252/publico_patos/REVENDA/SDPO 2026/DPO/PILAR GENTE/ARQUIVOS DE GENTE/FOTOS/2026`), lido pelo usuario no COSMIC Files (gvfs). Ambiente: Pop!_OS COSMIC; o servidor `dc01n` nao resolve por nome fora do dominio, usar IP.
- Curadoria (decisao do usuario: Claude escolhe ate 8 por campanha): 20 campanhas, 110 fotos, 1600 px sem EXIF; videos e o .zip fora; sem close de criancas; 7 HEIC do Dia do Trabalhador com mapa de profundidade nao convertem (libheif) e ficaram de fora; Dia do ADM ja existia. Pastas vazias (Promotor, Vigilante, Mindset) ignoradas.
- Textos e datas em `prisma/seed-data/newsletter-2026-patos-sume.json` (datas pelo nome dos arquivos/EXIF; unidade "Patos e Sume (PB)"); fotos NAO vao para o Git. Importador `prisma/importar-newsletter.ts <manifesto> <pasta> [--gravar]` (dry-run por padrao, idempotente por titulo+empresa).
- Pagina `/newsletter` (ISR): arquivo completo, filtro por empresa, galeria em tela cheia com setas/teclado. Link "Ver todas as campanhas" na newsletter da home; "Newsletter" do cabecalho aponta para `/newsletter`. `listarNewsletterPublicada(limite)` aceita `null`.
- Noticias gerais (sugestao do Thiago): modelo `EndoAviso` + migration `20261022180000_add_endo_aviso` (aditiva, a mao); 4a aba "Noticias gerais" em `/gente/endomarketing` (link interno ou https validado; destaque). Secao na home `HubNoticias` = avisos + vagas ABERTAS de `RecVaga` agrupadas por cargo+unidade (somente cargo, unidade, quantidade, abertura; salario e solicitante nunca saem).
- Validacao: tsc 0; `npm test` 511/0; E2E local (aviso pela tela, link `javascript:` recusado 400, vagas somadas e fechadas ocultas, sem salario, arquivo com 23 campanhas e galeria); `next build` ok; `hub.spec.ts` 2/3 (falha mobile preexistente). Vagas e empresa de teste so no banco local.
- Producao (ok explicito do usuario, 2026-10-22): `migrate deploy` (EndoAviso) e importacao das 20 campanhas; producao com 23 campanhas e 121 fotos.
- Parecer do outro agente: pendente.

### 2026-10-22 - Claude - Logos uniformes (fim dos selos redondos)

- Pedido da diretoria: Motos, Fazenda Divina, Unida e Instituto YSO estavam em selos redondos. Novas versoes do Drive "Logos": Motos (PNG horizontal), Unida (JPG, fundo removido), Fazenda Divina (PDF "logo fazenda divina_pau brasil", fundo removido — versao com cacto, diferente do selo antigo), YSO (PDF vetorial; fundo preto e moldura removidos, texto branco -> grafite, renderizado no Chromium). Arquivos `*-2026.png` (nome novo evita cache); os antigos foram removidos. Todas `shape: 'wide'`.
- Placas pequenas deixaram de ser circulos: faixa do topo 84x52, pilulas "outras empresas" 54x34, selos da linha do tempo/orientacao 52x32, placa da pagina da empresa 200x120.
- Validacao: tsc 0; `next build` ok; prints desktop/mobile da home e da pagina de empresa.
- Parecer do outro agente: pendente.

### 2026-10-22 - Claude - Universidade na identidade 2026 e endomarketing (/nossa-gente)

- Pedidos do usuario: Universidade sem a paleta verde (vitrine e area logada) e endomarketing com mural de reconhecimento, calendario de campanhas e numeros do mes, em pagina propria + resumo na home. Envio mensal da newsletter: depois.
- Universidade: `/universidade-pb` reescrita no padrao do hub (HubNav/HubFooter, hero vinho, catalogo em cards claros, modal proprio sem framer-motion, CTA); layout deixou de forcar texto branco. `HubLearningPath` extraido da home e reutilizado. Area logada: `emerald/green` trocados por ouro da paleta (#b88c0b/#d4a72c) e capas sem imagem em vinho/grafite.
- Endomarketing: modelos `EndoReconhecimento`, `EndoCampanha`, `EndoNumero`; migration `20261022140000_add_endomarketing` escrita a mao (aditiva; o diff gerado tambem mexia em indices antigos). `src/lib/endomarketing.ts` (schemas zod, `carregarNossaGente`), `src/lib/endomarketing-opcoes.ts` (categorias/cores, sem dependencia de servidor). API generica `/api/gente/endomarketing/[tipo]` e `/[tipo]/[id]` via `autenticarGente`, auditoria `GENTE_ENDOMARKETING_*`, `revalidatePath` de `/` e `/nossa-gente`. Tela `/gente/endomarketing` (abas, criar/editar/excluir, foto via `/api/upload` no Blob). Links no dock do Gente, sidebar (Admin e Gente & Cultura) e cabecalho do site ("Nossa gente").
- Pagina `/nossa-gente` (ISR 300 s): hero, numeros do mes (contador), mural, calendario do ano (destaca "acontecendo agora", esmaece passadas). Home: faixa "Acreditamos em nossa gente" mostra ate 4 numeros + link.
- Gotchas: depois de `prisma generate` o `next dev` precisa reiniciar (delegates novos vinham undefined). `urlDeImagemSchema` passou a aceitar so imagem interna ou res.cloudinary.com: link externo qualquer quebrava o `next/image` de quem exibe a foto.
- Validacao: tsc 0; `npm test` 511/0; E2E local (criar/editar pela tela, API 201/400, sem login 401, pagina publica com os 3 blocos, home com numeros, cabecalho em 1 linha 860-1440, sem transbordo em 320-768); `next build` ok; `hub.spec.ts` 2/3 (falha mobile preexistente). Dados de exemplo (cursos e endomarketing) so no banco local.
- Producao (ok explicito do usuario, 2026-10-22): `migrate deploy` aplicou so `add_endomarketing`; schema em dia.
- Parecer do outro agente: pendente.

### 2026-10-22 - Claude - Hero com a logo branca vetorial (sem a caixa bege)

- Pedido do usuario: o cartao bege com logo, "2026" e frase destoava do topo escuro. Fonte: pasta `arquivos-paubrasil` (manual da marca e `LOGO PAU BRASIL 2026.pdf`). O manual usa a logo branca direto no fundo escuro (capa e pag. 9).
- `public/brand/logo-branca-animada.svg`: extraido da pag. 2 do PDF (versao branca), sem o fundo e sem os contornos finos do Corel; 30 formas com `pathLength=1`; animacao de traco + preenchimento embutida no proprio SVG, desligada com movimento reduzido.
- Hero: figura `heroMark` (logo + brilho vinho suave + legenda "Nova identidade — 2026") no lugar de `heroVisual`/`brandPlate`.
- Parecer do outro agente: pendente.

### 2026-10-22 - Claude - Frase "Acreditamos em nossa gente" mais acima

- Pedido do usuario (nao encontrava a frase, que ficava a ~80% da pagina): a faixa saiu de entre Universidade e Trabalhe conosco e foi para logo depois do topo/atalhos, antes de "Nossas empresas".
- Parecer do outro agente: pendente.

### 2026-10-22 - Claude - Migracao Cloudinary -> Vercel Blob privado

- Decisao do usuario: Vercel Blob. Store criado por Claude a pedido do usuario: `paubrasil-arquivos` (privado, iad1), conectado ao projeto; `BLOB_READ_WRITE_TOKEN` em Production/Preview/Development. Local: token copiado para `.env.development.local` (mesmo store de producao; testes usam arquivos sem dado pessoal e sao apagados).
- `src/lib/armazenamento.ts`: salvar/ler/apagar privado, chaves `cvs/<uuid>.pdf` e `imagens/<uuid>.<ext>`, `urlDeImagemSchema` (aceita https externo ou `/api/arquivos/imagem/...`).
- CV: upload do candidato, importacao do RH, leitura no Banco de Talentos e no Gente (auditoria mantida, `no-store`), remocao (cron, limpar CVs, erasure LGPD). Campos do banco iguais (`cvPublicId` guarda a chave do Blob). `carreiras-cv.ts` e `cv-signed-url.ts` removidos.
- Imagens: `/api/upload` grava no Blob e devolve endereco interno; nova rota publica `/api/arquivos/imagem/[arquivo]` (nome UUID, cache imutavel). Validadores de `photoUrl` e capa de temporada aceitam o endereco interno. Sem recorte por rosto (era transformacao do Cloudinary).
- `.env.example`: Cloudinary trocado por `BLOB_READ_WRITE_TOKEN`. `remotePatterns` de res.cloudinary.com mantido para URLs antigas.
- Validacao: tsc 0; `npm test` 511/0; `next build` ok; E2E com Blob real: upload-cv 200, RH abre CV identico (sem login 401), upload de imagem + entrega publica + salvar foto de perfil, erasure apaga o CV do Blob; Blob terminou vazio. Laudo PCD e backup nao exercitados (codigo inalterado, ja usava Blob).
- Parecer do outro agente: pendente.

### 2026-10-21 - Claude - Atalho da newsletter na barra lateral do portal

- Usuario (SYS_ADMIN) nao encontrava o cadastro: a zona "Gente & Cultura" da sidebar so aparece para RH_ADMIN (`isRhAdminUser && !isAdmin`) e a zona Admin nao tinha link para o modulo Gente. Acesso a rota sempre existiu (`canAccessGente` inclui SYS_ADMIN).
- `src/app/app/layout.tsx`: item "Newsletter do site" (`/gente/newsletter`) nas zonas Admin e Gente & Cultura; entra tambem na busca do portal (derivada das secoes).
- Parecer do outro agente: pendente.

### 2026-10-21 - Claude - Tabelas legadas removidas e upload de CV quebrado em producao

- Remocao autorizada pelo usuario. Antes: as 15 tabelas OBZ*/Score* estavam VAZIAS em producao e no local, e nenhum usuario tinha `isObzAdmin`/`isScoreAdmin`. Migration `20261021220000_drop_legacy_obz_score` (escrita a mao: DROP das 15 tabelas, das 2 colunas em User e dos enums OBZJustStatus/OBZJustTipo). Aplicada local e em producao; producao ficou com 0 tabelas legadas, usuarios e newsletter intactos.
- Drift restante entre schema e banco: apenas indices (AuditLog x2, Notification, RecCargo_publicarNoSite_idx). Sem dado envolvido; nao tratado.
- **CRITICO - upload de CV em producao:** `/api/carreiras/upload-cv` responde 500 "Configuracao de upload indisponivel" (testado com PDF vazio) porque faltam `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_CV_PRESET` na Vercel. A candidatura so e enviada depois do upload, entao NENHUM candidato consegue concluir; producao tem 0 candidaturas desde 19/10. Tambem sem armazenamento: importacao de CV pelo RH, link do CV na ficha, laudo PCD (Vercel Blob privado, sem `BLOB_READ_WRITE_TOKEN`), foto de perfil (`/api/upload`) e download de backup.
- Acao depende do usuario: configurar Cloudinary (credenciais da conta) e/ou criar um Vercel Blob privado ligado ao projeto. Alternativa em codigo a discutir: migrar CV/laudo para Blob ou banco.
- Parecer do outro agente: pendente.

### 2026-10-21 - Claude - Cadastro da newsletter no portal (implementado e validado localmente; producao pendente)

- Decisao do usuario: conteudo de endomarketing cadastrado pelo portal. Primeira entrega: newsletter.
- Banco: `NewsletterPost` e `NewsletterPhoto` (fotos em bytea, ~150 KB cada, reduzidas no navegador). Migration `20261021195235_add_newsletter` ESCRITA A MAO, puramente aditiva.
  - **Gotcha critico:** `prisma migrate dev` gerou junto DROP das tabelas legadas de OBZ (12) e Score (3) e das colunas `isObzAdmin`/`isScoreAdmin`, que sairam do schema na limpeza mas seguem no banco. Nunca aplicar migration gerada sem revisar. Remover essas tabelas exige decisao propria do usuario.
- Por que bytea: producao NAO tem `BLOB_READ_WRITE_TOKEN` nem credenciais Cloudinary (conferido em `vercel env ls`). Isso tambem indica que uploads de CV/laudo provavelmente falham hoje em producao — pendencia a reportar.
- Rotas: `/api/gente/newsletter` (GET/POST), `/[id]` (GET/PATCH/DELETE; PATCH reordena fotos e textos alternativos), `/[id]/fotos` (POST multipart, valida tipo pelo conteudo, limite 1,5 MB e 12 fotos), `/[id]/fotos/[fotoId]` (DELETE), `/api/public/newsletter/foto/[id]` (publica com cache imutavel se publicada; rascunho so para Gente). Todas via `autenticarGente`, com auditoria `GENTE_NEWSLETTER_*` e `revalidatePath('/')`.
- Permissao: quem acessa o modulo Gente (RH_ADMIN, SYS_ADMIN) publica para qualquer empresa do hub; restricao por empresa nao implementada (sem mapeamento hub <-> Empresa).
- Telas: `/gente/newsletter` (lista) e `/gente/newsletter/[id]` (criar com `nova`, editar, fotos com reordenacao/descricao, excluir). Item "Newsletter do site" no dock do Gente.
- Home: `listarNewsletterPublicada()` (8 mais recentes publicadas com foto), `revalidate = 300`; sem banco/sem campanhas a secao some. Dados estaticos `HUB_NEWS` removidos; fotos de Sousa movidas para `prisma/seed-data/newsletter/` e carregadas por `prisma/seed-newsletter.ts` (dry-run por padrao, `--gravar` grava, idempotente).
- Ambiente local recriado nesta pasta: PostgreSQL 16 extraido em `.local-dev/` (`bash .local-dev/postgres.sh start|stop|status|psql`), `.env.development.local`, conta local RH em `.local-dev/contas-teste.env` (tudo fora do Git).
- Validacao: tsc 0; `npm test` 511/0; E2E manual com Playwright (home le do banco, login RH, criar campanha, enviar foto, aparece no site, excluir some, API sem login 401); `next build` + `next start` com banco local; `hub.spec.ts` 2/3 (falha mobile preexistente).
- Producao (com ok explicito do usuario, 2026-10-21): `prisma migrate deploy` aplicou so `add_newsletter` no Neon (23 -> 24 migrations, schema em dia); `seed-newsletter.ts --gravar` criou as 3 campanhas de Sousa (11 fotos). Credenciais lidas de `vercel env pull` em arquivo temporario, apagado em seguida.
- Parecer do outro agente: pendente.

### 2026-10-21 - Claude - Ajustes da newsletter

- Bug de zoom: a foto usava `height: 100%` dentro de um grid de linha automatica e era desenhada com a altura natural (ex.: 1262 px numa moldura de 444 px). Agora a imagem e absoluta (inset 0) com `object-fit: contain`; fotos verticais aparecem inteiras.
- Mais lenta: 4 s por foto (`PHOTO_MS`).
- Navegacao: setas anterior/proxima sobre a foto (aparecem no hover/foco; sempre visiveis em telas de toque), barras clicaveis para pular de foto, contador "n / total", deslizar o dedo no celular e setas do teclado com o carrossel em foco. Nas pontas, passa para a campanha vizinha.
- Validacao: tsc 0 erros; navegacao testada com Playwright; sem transbordo novo; `hub.spec.ts` 2/3 (falha mobile preexistente).
- Parecer do outro agente: pendente.

### 2026-10-21 - Claude - Newsletter, trabalhe conosco, frase e cabecalho (reuniao de alinhamento)

- Pedidos da reuniao: newsletter, trabalhe conosco, frase "Acreditamos em nossa gente", fonte maior no cabecalho, endomarketing (este ultimo so sugestoes, sem implementacao).
- `HubNewsletter.tsx` (novo) logo no inicio da home, antes do hero: campanhas de setembro da revenda de Sousa (Setembro Amarelo, Dia do Administrador 09/09, Dia Nacional do Transito 25/09), conforme calendario do plano de comunicacao no Canva. Fotos passam a cada 2,5 s (`PHOTO_MS`), barras estilo stories, seletor de campanha, pausa no hover/foco/botao, desligado com movimento reduzido; fundo desfocado da propria foto para fotos verticais; proxima foto pre-carregada na troca de campanha.
- Dados em `HUB_NEWS` (`hub-content.ts`), prontos para outras empresas/unidades. Fotos em `public/newsletter/<campanha>/` (1400 px, sem EXIF, + miniatura -blur). Foto duplicada do Dia do Administrador usada uma vez; video do Dia do Transito (7 MB) nao incluido.
- Cabecalho: links 15 px (14 px ate 1320, 13 px ate 1100), sem quebra de linha; novo link "Newsletter"; "Carreiras" virou "Trabalhe conosco" (mesmo destino #talentos), assim como o eyebrow da secao.
- Faixa "Acreditamos em nossa gente." entre Universidade e Trabalhe conosco.
- Validacao: tsc 0 erros; prints 1440/1180/390; cabecalho em 1 linha de 860 a 1440; `next build` + `next start` local com rotacao e fotos ok e estrada presente; `hub.spec.ts` 2/3 (falha mobile preexistente da faixa de logos; transbordo novo do blur corrigido).
- Parecer do outro agente: pendente.

### 2026-10-21 - Claude - Estrada da linha do tempo nao aparecia em producao

- Sintoma: em producao (e em `next build` local) a estrada nao era desenhada, sem erro no console; em `next dev` funcionava.
- Causa: `EraRoad` vinha antes do `<ol ref>` no JSX. No layout effect do primeiro mount o ref da lista ainda nao estava ligado, o efeito saia cedo e nao observava nada. Em dev o StrictMode remonta os efeitos e mascarava o problema.
- Correcao: `EraRoad` renderizado depois da lista. Validado com `next build` + `next start` local (svg presente e pinos alinhados).
- Licao: testar componentes com refs entre irmaos tambem no build de producao.
- Parecer do outro agente: pendente.

### 2026-10-21 - Claude - Era 2003-2009 mais curta e sem 2026

- Pedido do usuario para caber na tela de apresentacao: textos da era 2003-2009 condensados (sem perder fatos), sem selos de empresa nessa era e espacamento entre anos de 18 para 14 px.
- Ano 2026 (nova identidade visual) retirado da linha do tempo; era "Novas fronteiras" passa a 2017-2025.
- Parecer do outro agente: pendente.

### 2026-10-21 - Claude - Linha do tempo em formato de estrada

- Referencia da diretoria: HTML "nossa-historia-estrada-standalone" (estrada vertical sinuosa) e imagem horizontal 1994-2025. Adaptado para manter abas de eras e passagem automatica, sem rolagem horizontal.
- `EraRoad` em `HubInteractive.tsx`: SVG (acostamento, asfalto, faixa tracejada e pinos vinho) desenhado a partir da posicao medida de cada ano, alternando os lados; redesenha com ResizeObserver; entra com clip de cima para baixo e pinos em cascata. Gotcha: o ano precisa de `align-self: start` no grid, senao o item estica e o centro medido fica errado.
- Dados: era 1 completada com 1995, 1997, 1999, 2001 e 2002 do material da diretoria (alimentos, Bonamezza, usinas, Skol, cotas de Zenildo, 1a revenda Brahma); 1994 passa a citar a Comercial Industrial de Alimentos Pau Brasil Ltda. Reconhecimentos marcados com "*" (estrela dourada). A legenda "Reconhecimentos e titulos" foi retirada a pedido do usuario (ficava solta no fim da estrada).
- Validacao: tsc 0 erros; prints de viewport desktop/mobile com pinos alinhados; sem transbordo novo; `hub.spec.ts` 2/3 (falha mobile preexistente).
- Parecer do outro agente: pendente.

### 2026-10-21 - Claude - Passagem automatica das eras da linha do tempo

- Pedido do chefe: as eras avancam sozinhas a cada 10 s (`ERA_MS`; 7 s foi testado e o usuario preferiu 10 s), voltando ao inicio apos a ultima, so com a secao visivel (IntersectionObserver), pausando no hover/foco e por botao (WCAG 2.2.2); desligado com movimento reduzido. Clique manual reinicia a contagem.
- Linha de progresso vinho sob a aba ativa; so existe enquanto a contagem roda, para ficar em sincronia com o timer.
- Validacao: tsc 0 erros; teste manual com Playwright (troca no tempo configurado, mantem com hover); `hub.spec.ts` 2/3 (falha mobile preexistente).
- Parecer do outro agente: pendente.

### 2026-10-21 - Claude - Logos em fundo unico e foto colorida do fundador

- Proposta B escolhida pelo usuario (previa comparativa A/B/C feita fora do repositorio): todas as placas de marca usam `HUB_PLATE` (#f1ebe3) em `hub-content.ts`.
- `bebidas.png` virou versao escura com fundo transparente; `hora-10.png` sem o fundo preto embutido.
- `public/brand/fundador.jpg` trocado pela foto colorida em fundo cinza (pedido do chefe: a P&B ficava apagada); filtro grayscale removido do CSS.
- Validacao: tsc 0 erros; screenshots; `hub.spec.ts` 2/3 (falha mobile preexistente da faixa de logos).
- Parecer do outro agente: pendente.

### 2026-10-21 - Claude - Feedbacks do hub e linha do tempo real

- Rolagem suave: `html:has([data-hub-root])` com `scroll-behavior: smooth` em `globals.css` (respeita movimento reduzido); `data-hub-root` tambem na pagina de empresa.
- Assinatura apagada no celular: era o modo escuro forcado do navegador. Home e paginas de empresa exportam `viewport.colorScheme = 'only light'` (so o hub; o portal mantem seus temas). Confirmar no Samsung Internet real.
- Conteudo corrigido com base na linha do tempo oficial: Instituto YSO = saude e estetica (antes "impacto social"), plate champanhe; Hora 10 = varejo/supermercado (antes "gestao de pessoas"). Interesses: "Pessoas e educacao" virou "Saude e estetica"; Hora 10 entrou em Vendas. Cidades-sede adicionadas: YSO, Locadora e Fazenda (Sousa), Original Start (Petrolina-PE), Unida (Joao Pessoa). Rotulo de estado PE e plural "1 unidade" corrigidos.
- Cores mais fortes: filtros com fundo branco e texto escuro, contadores vinho, selo "Parceiro" vinho solido, segmento dos cards mais escuro.
- Linha do tempo: `HubStory` (4 capitulos editoriais) substituido por `HubTimeline` com `HUB_ERAS` (4 eras, 1994-2026, anos com eventos e selos das empresas). Fontes: PPTX "01 Integracao 1a parte Pau Brasil e Ambev" (fundacao em 14/01/1994 por Zenildo Rodrigues de Oliveira e Fabio Tyrone Braga de Oliveira, rifa do bode, PEX 2006-2009) e imagens da linha do tempo 2003-2025. CSS antigo de `storyPanel`/`historyPhoto` removido.
- Validacao: tsc 0 erros; screenshots desktop/mobile; `hub.spec.ts` 2/3 (teste atualizado para eras e Hora 10 como empresa sem unidades); falha mobile preexistente da faixa de logos.
- Parecer do outro agente: pendente.

### 2026-10-20 - Claude - Logos do Drive do grupo no hub

- Fonte: pasta "Logos" do Google Drive enviada pelo usuario (18 subpastas). Baixados com autorizacao: logos de Original Start e Locadora, logotipo de Zenildo Oliveira, Capacitar, T&D Lideres e o PDF do Grupo.
- `public/logos/hub/original-start.png` e `locadora.png` (cards e faixa do hero deixam de usar monograma); `public/brand/assinatura-zenildo.png` substitui o credito em texto da frase; nome completo "Zenildo Oliveira" na legenda e no alt.
- **Correcao de conteudo:** a logo oficial da Original Start diz "Moto Pecas". Empresa passou de "Inovacao" para "Mobilidade", descricao de loja de pecas para motos, e entrou nos interesses Vendas e Mecanica. O interesse "Inovacao e negocios" e o segmento "Inovacao" deixaram de existir (hero agora conta 6 segmentos). Confirmar com o usuario.
- Universidade: cards dos programas Capacitar e T&D Lideres abaixo das tres etapas. Empresas: faixa tipografica de parceiros (Ambev, Honda) gerada de `partner` em `hub-content.ts`; sem logos de terceiros (o Drive nao tem a marca Ambev).
- Nao feito: logo desenhada por traco. O PDF do Drive e a marca antiga verde com bandeira, nao a identidade 2026, e nao ha potrace na maquina para vetorizar o PNG atual.
- Validacao: tsc 0 erros; screenshots desktop/mobile; `hub.spec.ts` 2/3 (contagens de Mobilidade e Mecanica atualizadas para 3; falha mobile preexistente da faixa de logos).
- Parecer do outro agente: pendente.

### 2026-10-20 - Claude - Varredura de codigo morto

- Ferramenta: `knip` + conferencia manual de cada item (uso interno, referencias dinamicas, historico do Git).
- Arquivos removidos: `generate-icons.js` (gerava icones provisorios laranja e sobrescreveria os oficiais), `scripts/test-email.ts` (remetente "OBZ Portal" e Gmail pessoal fixo), `src/lib/format.ts`, guias HTML de OBZ e visitas, `public/brand/aplicacao-fachada.jpg`, 6 logos antigos em `public/logos` (substituidos por `logos/hub/`) e 8 fotos de pessoas em `public/fotos` que nunca foram referenciadas no codigo e ficavam publicas.
- Codigo removido: skeletons e e-mails do OBZ, `REWARDS_STORE_ENABLED`, `canManageActivityDefinitions`, `getCargosGrupos`, `RESULTADO_LABEL`, `logError`, alias `PROVISIONED_USER_SELECT`, registro de uploads em memoria de `carreiras-cv.ts` (nada chamava `registerUploadedCv`; `destroyUploadedCv` segue).
- Dependencias removidas (20): `@auth/prisma-adapter`, 11 pacotes `@radix-ui/*` (fica `react-dialog`), `@vladmandic/face-api`, `class-variance-authority`, `clsx`, `next-cloudinary`, `recharts`, `tailwind-merge`, `vitest`, `@vitest/ui`. `jose` passou a ser dependencia declarada (ja era importado direto). `recharts` saiu de `optimizePackageImports`.
- Mantidos de proposito: `worker/index.js` (custom worker do next-pwa), seeds `prisma/seed-*.ts` e `prisma/vincular-vagas-descritivo.ts` (scripts manuais), `scripts/test-usuarios.ts`, exportacoes usadas so dentro do proprio arquivo e tipos exportados.
- Alerta: `scripts/test-usuarios.ts` tem senha padrao de admin fixa no codigo; confirmar que nao e a senha real de producao.
- Validacao: tsc 0 erros; `npm test` 511 aprovados/0 falhas; `next build` compilou e gerou 84 paginas (precisou de `NODE_OPTIONS=--dns-result-order=ipv4first` para baixar as fontes nesta maquina; avisos de `DATABASE_URL` por falta de env local); `hub.spec.ts` 2/3, falha mobile preexistente.
- Parecer do outro agente: pendente.

### 2026-10-20 - Claude - Teste do hub alinhado ao link externo da Motos

- `tests/e2e/hub.spec.ts`: o aviso "Novos endereços em breve." passa a ser conferido na Unida; `/empresas/motos` agora deve responder 307 para o site da Pau Brasil Motos (comportamento pedido pelo usuario, sem abrir o site externo no teste).
- Resultado: 2/3 aprovados; resta a falha preexistente da faixa de logos do hero transbordando em 320-768 px.
- Parecer do outro agente: pendente.

### 2026-10-20 - Claude - Nome do fundador

- Usuario confirmou o fundador: Zenildo. Nome aplicado na legenda do retrato, no texto alternativo e na assinatura da frase em `src/app/page.tsx`.
- Parecer do outro agente: pendente.

### 2026-10-20 - Claude - Efeitos do hub, rodada 2

- Frase do fundador fornecida pelo usuario ("Nascemos no sertão da Paraíba e aprendemos que excelência não tem CEP.") em `blockquote` na secao Historia, atribuida a "Fundador do Grupo Pau Brasil" (nome ainda nao confirmado).
- `HubEffects.tsx` (novo): `HubCountUp` (conta ate o valor ao aparecer; SSR ja traz o valor final; leitor de tela recebe o numero final) nos totais de empresas/segmentos do hero; `HubHeroGlow` (brilho que segue o cursor, so com mouse).
- CSS: logo do hero revelada de baixo para cima por mascara (o arquivo e PNG, nao ha tracado SVG para desenhar), grao de papel fixo a 5% de opacidade, entrada coreografada em `/empresas/[slug]` (classe `companyEnter`). Tudo desligado com movimento reduzido.
- Linha do tempo com datas: adiada a pedido do usuario.
- Validacao: tsc sem erros nos arquivos do hub; screenshots no meio e no fim das animacoes; `hub.spec.ts` 1/3, as mesmas 2 falhas preexistentes da rodada anterior.
- Parecer do outro agente: pendente.

### 2026-10-20 - Claude - Foto do fundador e efeitos no hub

- Pedido: usar o acervo do marketing com foco no Grupo (fotos de revenda/Bebidas descartadas pelo usuario); colocar a foto do fundador e efeitos discretos.
- `public/brand/fundador.jpg` (1066x1600, sem EXIF) substitui a "aplicacao ilustrativa" da fachada na secao Historia; legenda "Fundador · Grupo Pau Brasil" sem nome, aguardando confirmacao.
- `HubReveal.tsx` (novo): IntersectionObserver revela blocos `data-reveal`; sem JS ou com movimento reduzido tudo aparece normal. Cards de empresas ficaram de fora (o filtro recria os itens).
- CSS: entrada em cascata do hero, cortina no retrato via `::before` (clip-path no proprio bloco impedia o observer de detecta-lo), P&B→cor no hover, barra de progresso no header com `animation-timeline: scroll()` (so onde ha suporte).
- Validacao: tsc sem erros nos arquivos do hub; screenshots desktop/mobile. `hub.spec.ts`: 1/3 aprovado; as 2 falhas ja existiam sem esta mudanca (conferido com stash): `/empresas/motos` redireciona ao site externo e a faixa de logos do hero transborda em 320-768px.
- Ambiente: `npm ci` nesta pasta nova; `.claude/launch.json` criado para o servidor de preview.
- Parecer do outro agente: pendente.

### Rodadas anteriores

As rodadas até 2026-10-19 (Codex, Claude e Copilot, desde abril/2026) foram arquivadas em
`docs/historico/ai-handoff-rodadas-ate-2026-10-19.md` para este arquivo continuar legível.
Consulte lá decisões antigas; o protocolo e o estado atual seguem aqui.
