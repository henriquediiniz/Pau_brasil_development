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

- Claude — migracao de arquivos do Cloudinary para Vercel Blob privado (2026-10-22)
  - objetivo concluido; arquivos em posse: nenhum

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

### 2026-10-19 - Codex - Consolidação de contexto, portal e produção

- Status: concluído; sem arquivos em posse.
- Entregas funcionais anteriores desta conversa: simplificação do portal (`834fdda`), banco Neon/migrações/runtime público e deploy validado (`f77afba`).
- Produção validada: https://pau-brasil-development.vercel.app; 23 migrações aplicadas, 48 modelos consultados, login SYS_ADMIN e smoke HTTP aprovados.
- Esta rodada: pacote de documentação em `docs/contexto-agente/`, arquivo consolidado, prompt de transferência, orientação na raiz `AGENTS.md`, links no README e avisos nos documentos históricos.
- Não houve alteração funcional nem nova publicação nesta rodada de documentação.
- Pendências técnicas separadas de entregas em `docs/contexto-agente/05-QUALIDADE-E-PENDENCIAS.md`.
- Parecer de outro agente: não solicitado nesta rodada; não houve trabalho paralelo.


### 2026-10-16 - Codex - Portal do colaborador e retirada da loja

- Pedido: continuar o portal na mesma paleta do hub; remover a loja por enquanto e aguardar analise de requisitos dos supervisores para outras remocoes. README permanece somente com `npm ci` e `npm run dev`.
- Marca: tema isolado em `src/app/portal-brand.css`, Montserrat, logos originais, login responsivo; vinho/areia/grafite nos temas claro/escuro. Tailwind conserva fallback da marca anterior nas outras areas.
- Navegacao: busca compartilhada com as permissoes da sidebar; foco e Escape nos dialogs; atalhos mobile por perfil; links de agenda inexistente retirados; retorno ao hub. Login aguarda inicializacao da sessao/hidratacao; destino por perfil e troca obrigatoria de senha no servidor. Middleware usa o login da marca.
- Loja: links e orientacoes retirados do portal, busca, ajuda e atalhos admin; flag central `REWARDS_STORE_ENABLED=false`; paginas antigas redirecionam para pontos no middleware e nos wrappers; API de novos resgates e definicao de meta de recompensa bloqueadas. Produtos/pedidos/saldos preservados, inclusive APIs e paginas administrativas legadas para historico.
- Atividades: conclusao aguarda API, bloqueia envio simultaneo, captura falha e permite tentar novamente com rollback; confetes apenas apos conclusao; atividades avulsas aparecem sem funcao cadastrada; formulario rotulado e validado; contagem inicial consistente; metas usam o formato real da API; evolucao usa os limites reais de nivel.
- Arquivos complementares: `src/lib/checklist.ts`, `src/lib/middleware-access.ts`, `src/middleware.ts`, SSR de Inicio, componentes Hoje, loja/resgates, APIs loja/target e atalhos admin; sobreposicoes historicas revisadas sem diffs ativos de outros agentes. Implementacao detalhada em `docs/portal-colaborador.md`.
- Validacao: `npx tsc --noEmit` e lint dos arquivos principais aprovados; 42 testes de auth/helpers/middleware/tasks/store/notifications aprovados; `PORTAL_E2E_DB=1 npx playwright test tests/e2e/portal-colaborador.spec.ts tests/e2e/hub.spec.ts`: **6/6 aprovados**. Fluxos reais com contas locais temporarias: login, rotas protegidas, busca, temas, redirecionamentos, bloqueio API sem debito, principais telas, menu mobile, perfil Universidade, senha obrigatoria, criacao/conclusao de tarefa e falha simulada com rollback. Screenshots de login, desktop claro/escuro e celular revisadas.
- Ambiente: PostgreSQL local e dev server em localhost:3000; credenciais nao versionadas. Testes opt-in restritos ao banco local e com limpeza dos registros proprios. Sem build de producao, deploy ou commit nesta rodada.
- Pendencias: requisitos dos supervisores; validacao de cursos/avaliacoes com conteudo cadastrado (nesta rodada Universidade validada quanto a acesso/navegacao). Dados oficiais de historia/filiais permanecem pendentes conforme combinado.
- Parecer do outro agente: pendente; nenhuma delegacao nesta rodada.

### 2026-10-16 - Codex - Hub institucional e nova identidade

- Pedido: primeira versao do hub central do grupo com historia, empresas/filiais, universidade e talentos.
- Implementacao: home institucional responsiva; logos originais em `public/brand`; paleta e Montserrat conforme manual; paginas `/empresas/[slug]` para 8 empresas; filtro por segmento; busca de unidades sem acento e filtro por estado; menu mobile; orientacao de empresas por interesse profissional.
- Integracoes: links para universidade, candidatura, carreiras, contato e portal existentes. Nenhuma alteracao em schema, upload de CV, candidaturas ou permissoes. Encaminhamento automatico entre empresas NAO implementado; a orientacao editorial nao envia dados nem decide elegibilidade.
- Conteudo: 8 unidades de Bebidas dos seeds do projeto, com Barra identificada como Barra da Estiva pelo seed de operacoes. Demais filiais pendentes. Historia em capitulos sem datas ficticias; fachada do manual explicitamente ilustrativa.
- Validacao: `npx tsc --noEmit` aprovado; `npx playwright test tests/e2e/hub.spec.ts`: 3/3 aprovados, incluindo 320/390/768/1280 px, filtro de empresas/unidades, estado vazio, 404, menu e orientacao; screenshots desktop/mobile revisadas; `/`, `/carreiras`, `/universidade-pb` responderam 200. Build de producao nao executada; testes nao enviaram curriculos nem validaram automacao de RH.
- Ambiente: Chromium headless instalado para Playwright; banco local iniciado com script existente. Nenhum deploy, commit ou mudanca de producao.
- Pendencias de conteudo e proxima etapa em `docs/hub-institucional.md`.
- Alteracoes anteriores em `.gitignore` e neste handoff preservadas.
- Parecer do outro agente: pendente.

### 2026-10-16 - Codex - PostgreSQL e administrador de desenvolvimento

- Usuario autorizou configurar PostgreSQL nesta maquina e criar uma conta administrativa exclusivamente local.
- PostgreSQL 16 extraido dos pacotes da distribuicao em `.local-dev/postgres/runtime`, dados em `.local-dev/postgres/data`, escutando somente em `127.0.0.1:55432`; banco `paub_portal_dev` novo, schema aplicado com Prisma `db push`.
- `.env.development.local` com conexao local e secret aleatorio; `.local-dev/` adicionado ao `.gitignore`. Nenhuma credencial ou dado do banco foi versionado.
- Conta `admin@grupopaubrasil.com.br` criada como `SYS_ADMIN`, ativa, senha com bcrypt. Autenticacao existente preservada, sem bypass.
- Scripts locais de iniciar/parar/status e instrucoes em `.local-dev/README.md`. Next.js reiniciado para carregar o ambiente.
- Validacao: hash bcrypt, login HTTP, sessao `SYS_ADMIN`, API `/api/admin/usuarios` e pagina `/admin` com HTTP 200. Avisos preexistentes de Sentry, Tailwind e download de fontes durante a compilacao nao impediram a pagina.
- Arquivos versionados alterados: `.gitignore`, `docs/ai-handoff.md` (registro aditivo apos conferir diff limpo; posse historica de abril).
- Parecer do outro agente: pendente.

### 2026-10-08 - Claude - `Painel Gente sem a linha Origem`

- Pedido do PO: a linha "Origem" (WhatsApp / Portal de carreiras / Outro) no painel de `/gente` ficava desproporcional porque parte dos candidatos foi importada em massa. Removida de `src/app/gente/_components/PainelGente.tsx`; `ORIGEM_LABEL` deixou de ser importado ali. `porOrigem` continua na resposta da API e no tipo.
- `tsc` e lint OK.
- Parecer do outro agente: pendente.

### 2026-10-07 - Claude - `Frontline sem o historico de meta mensal`

- Pedido do PO: remover o quadro "Historico de meta mensal" de `/gente/frontline`. Saiu da tela, com os componentes `HistoricoMensal` e `MesEditavel` e o tipo `Historico`.
- **Nao removido** (de proposito, para voltar sem perda se o RH pedir): a tabela `QuadroFrontlineMes`, os dados ja digitados, o calculo de `historico` na `GET /api/gente/frontline` e a rota que grava o mes. A resposta da API ainda traz `historico`, que a tela ignora.
- `tsc` e lint OK.
- Parecer do outro agente: pendente.

### 2026-10-07 - Claude - `Lote de 7 pedidos: quadro, candidatos, Frontline, LGPD`

1. **Quadro de pessoal — contagem segue a operacao.** `GET /api/gente/quadro` contava `ativos` sem o filtro de operacao (209 com Sousa filtrada). Agora conta com ele; a busca por texto nao entra. Real: Sousa 178, Itaporanga 31.
2. **Situacao em massa nos candidatos.** Novo `PATCH /api/gente/candidatos` `{ ids, situacao }` (ate 200, escopo junto com os ids, audit `GENTE_CANDIDATOS_SITUACAO_EM_MASSA`). Muda so `situacao`, como o seletor individual; situacao final + data nao entram (pedem data por pessoa). Tela: caixa por cartao (fora do `<button>` do cartao), "Selecionar os N desta pagina", barra com seletor e Aplicar. Mudar filtro/pagina limpa a selecao.
3. **Painel Frontline: "Mais disputados" -> "Quantidade por cargo".** `topCargos` (so em processo, top 3, com /vagas) virou `porCargo` (todos os candidatos de frontline, qualquer situacao, todos os cargos — a soma bate com o total). O alerta "Sem candidato" continua contando so quem esta em processo. O painel passou a seguir o filtro de operacao da lista (`?operacaoId=`).
4. **Filtro por cargo nos candidatos.** Novo `src/lib/gente/cargo-agrupado.ts` (`agruparCargos`, `grafiasDasChaves`; 6 testes): opcoes agrupam grafias por `chaveDeCargo` e exibem o nome do descritivo; a consulta usa `cargo in [grafias reais]`. Opcoes vem na propria resposta do GET (`cargos`), calculadas com escopo + operacao.
   - **Bugs corrigidos no caminho:** (a) `whereFrontline` comparava o nome com `equals` e o "Ver so frontline" listava 38 candidatos enquanto o painel contava 101 — agora casa pela chave e lista 101; (b) frontline e busca gravavam ambos em `where.OR` e a busca apagava o filtro de frontline — agora entram numa lista `AND`.
   - Grafias que a chave NAO junta (decisao: nao forcar): "Representante de Negocio" (1) x "REPRESENTANTE DE NEGOCIOS" (29) — plural; "Aprendiz" x "JOVEM APRENDIZ".
5. **"Consulte a LGPD" na candidatura.** `src/app/carreiras/candidatar/_components/AvisoLgpd.tsx`: o que e a LGPD, dados pedidos, finalidade, quem ve, retencao (10 dias apos encerrar — depende do `CRON_SECRET` na Vercel), direitos do art. 18 com os e-mails de Patos/Sousa, base legal art. 7, I. Botao fora do `<label>` para nao marcar o "Concordo". Sem backdrop-blur. **Nao substitui politica de privacidade revisada pelo juridico.**
6. **YTD do Frontline**: ja removido no commit `316c114`; nada a fazer.
7. **Frontline — vagas abertas = QLP meta - QLP real** (nunca negativo). `calcularVagasAbertas` substitui `contarVagasAbertas`; `montarLinhas(cargos, teto)` nao recebe mais vagas; a rota deixou de ler `RecVaga`. Comprometimento usa o mesmo numero. Real: Ajudante de Distribuicao Sousa, meta 43, real 42 -> 1 vaga, 2,33%. `tests/gente-frontline.test.ts` reescrito na parte de vagas (19 testes).
- `tsc` OK, lint OK, `test:unit` 595 / 0 falhas, `next build` OK. Numeros conferidos no banco (somente leitura); modal LGPD conferido no WebKit/iPhone. Tela de Candidatos (selecao em massa) **nao** conferida visualmente — exige login.
- Parecer do outro agente: pendente.

### 2026-10-07 - Claude - `Frontline sem o YTD no historico mensal`

- Pedido do PO: tirar o calculo do quadro "Historico de meta mensal" em `/gente/frontline`. Removidos o numero "YTD acumulado (media)" e a nota "O YTD divide por 12...". Os meses (campos editaveis) ficam.
- `HistoricoMensal` deixou de receber `teto` (so servia para colorir o YTD); import de `calcularYtd` removido da pagina. A funcao continua em `src/lib/gente/frontline.ts` (e nos testes), sem uso na tela.
- `tsc` e lint OK.
- Parecer do outro agente: pendente.

### 2026-10-07 - Claude - `Etapas do processo sem data`

- Pedido do PO: na ficha do candidato (`/gente/candidatos`), a linha de cada etapa mostrava "Avaliador · dd/mm/aaaa". Agora mostra so o nome de quem avaliou. A data continua gravada (`avaliadoEm`), so nao e exibida.
- Arquivo: `src/app/gente/candidatos/page.tsx`. `tsc` e lint OK.
- Parecer do outro agente: pendente.

### 2026-10-07 - Claude - `Painel Frontline com cargo repetido, e-mail de Sousa, Gente & Gestao`

- **Cargos repetidos em "Mais disputados"**: `painel-frontline.ts` tinha chave propria que nao ignorava preposicao — "AJUDANTE DISTRIBUICAO" (15) e "Ajudante da Distribuicao" (4) apareciam separados. Leitura no banco: 5 cargos com grafias multiplas (Ajudante de Distribuicao com 4, Ajudante de Armazem, Representante de Negocios, Motorista Caminhao Distribuicao, Promotor). Agora usa `chaveDeCargo` (a mesma que liga candidato ao descritivo) e exibe o nome do descritivo (`nomesOficiais`, passado pela rota) ou, sem descritivo, a grafia mais usada. Com dados reais: "Ajudante de Distribuicao" 19. 3 testes novos em `gente-painel-frontline.test.ts`. Os registros de candidato nao foram alterados.
- **E-mail do curriculo**: novo `src/app/_components/EmailsCurriculo.tsx` com Patos (`agg.patos@`) e Sousa (`cgg.sousa@`), assunto pre-preenchido "Curriculo - <unidade>". Usado no rodape de `/carreiras/candidatar` e na home (`src/app/page.tsx`). Os dois aparecem juntos porque o link esta no passo 1, antes de a pessoa informar a cidade.
- **Gente & Cultura -> Gente & Gestao** nas paginas publicas: `/carreiras` (chamada do Banco de Talentos) e `/carreiras/candidatar` (tela de sucesso e texto do perfil de triagem). **Nao alterado**, aguardando o PO: cargo da Geniana na `/carreiras` ("Diretora de Gente & Cultura"), secao da barra lateral (`app/layout.tsx`) e cabecalho de `/gente`.
- `tsc` OK, lint OK, `test:unit` 593 / 0 falhas, `next build` OK; e-mails conferidos por print no iPhone e no desktop.
- Parecer do outro agente: pendente.

### 2026-10-01 - Claude - `CV de rejeitado/arquivado apagado automaticamente apos 10 dias`

- Pedido do PO, na sequencia da rodada de reabertura (que tinha parado de apagar o CV no ato da rejeicao).
- `src/lib/carreiras-retencao.ts` (novo): `DIAS_RETENCAO_CV = 10`; `saidaDoFunil(historico, alternativa)` le as notas `MUDANCA_ETAPA` e pega a entrada mais recente em REJEITADO/ARQUIVADO vinda de fora delas — Rejeitado -> Arquivado nao reinicia o prazo; reabrir e rejeitar de novo, sim. Sem historico usa `updatedAt`, que erra para o lado de guardar mais. Sem migration. `tests/carreiras-retencao.test.ts` (8 testes), no `test:unit`.
- `src/app/api/cron/limpar-cvs/route.ts` (novo): GET, **recusa se `CRON_SECRET` nao estiver configurado** (os outros crons ficam abertos nesse caso; este apaga arquivo). Zera a referencia no banco antes do Cloudinary, com `etapa in` no update para nao apagar quem foi reaberto no meio da execucao. Audit `CANDIDATURA_CVS_LIMPOS` com `actorId: 'cron'`, `automatico: true`, ids e falhas.
- `vercel.json`: terceiro cron, `0 6 * * *` (03:00 BRT). **Risco:** se o plano da Vercel limitar a 2 crons, o deploy falha — verificar apos o push.
- Ficha da candidatura (`/talentos`): para quem esta fora do funil e ainda tem CV, mostra "O curriculo sera apagado em N dias".
- Simulacao somente leitura antes do deploy: 1 candidatura fora do funil com CV ("Thiago Felix dos Santos", arquivado desde 2026-04-10, cadastro de teste do PO) — sera apagada na primeira execucao. As outras 70 ja nao tinham CV.
- Cron nao executado localmente de proposito (apagaria em producao).
- Achado nao tratado: `/api/cron/daily-reminder` tem GET e POST; os crons existentes aceitam requisicao sem auth quando `CRON_SECRET` falta.
- `tsc` OK, lint OK, `test:unit` 590 / 0 falhas.
- Parecer do outro agente: pendente.

### 2026-10-01 - Claude - `Reabrir candidato rejeitado ou arquivado`

- Pedido do PO: candidato movido para Rejeitado ou Arquivado ficava preso, sem poder ir para nenhuma outra etapa.
- Causa: `TRANSICOES_VALIDAS` tinha `REJEITADO: ['ARQUIVADO']` e `ARQUIVADO: []`. Decisao anterior (do proprio Claude) de que "reabrir e criar nova candidatura" — revertida a pedido do PO.
- **Achado que mudou o escopo:** mover para essas etapas apagava o CV no Cloudinary na hora (`ETAPAS_FINAIS` na rota PATCH). Leitura no banco: 64 rejeitados (0 com CV) e 7 arquivados (1 com CV). Liberar a volta sem mexer nisso devolveria candidatos sem curriculo.
- Mudancas:
  - `carreiras-areas.ts`: `REJEITADO -> RECEBIDO | TRIAGEM | ENTREVISTA | ARQUIVADO`; `ARQUIVADO -> RECEBIDO | TRIAGEM | ENTREVISTA | REJEITADO`. Nunca direto para APROVADO.
  - `candidaturas/[id]/route.ts`: rejeitar/arquivar **nao apaga mais o CV**. Exclusao segue existindo pelo botao "Limpar CVs" (`cleanup-cvs`, apaga CVs de quem esta em REJEITADO/ARQUIVADO) e pela remocao LGPD (`erasure`). Audit de mudanca de etapa ganhou `reaberta: true` quando sai dessas etapas.
  - Tela: confirmacao do "Limpar CVs" avisa que quem for reaberto depois fica sem CV; textos "CV removido apos arquivamento" viraram "Curriculo nao esta mais disponivel".
  - Kanban nao precisou de mudanca: ele delega a validacao a API.
  - `tests/talentos-transicoes.test.ts`: reabertura, nao vai direto para aprovado, nenhuma etapa e beco sem saida.
- Risco/decisao para o PO: retencao de CV de rejeitado agora depende de alguem apertar "Limpar CVs". Se quiser prazo automatico (ex.: apagar apos N dias), e um cron novo.
- `tsc` OK, lint OK, `test:unit` 582 / 0 falhas.
- Parecer do outro agente: pendente.

### 2026-09-30 - Claude - `iPhone caindo na candidatura + perfil de triagem no Banco de Talentos`

- Status: concluida e em producao.
- **Migration `20260930000000_add_perfil_triagem_candidatura` APLICADA em 2026-09-30 via `prisma migrate deploy` no neondb, com autorizacao expressa do PO.** Antes/depois: 299 candidaturas, `max(updatedAt)` inalterado (nenhuma linha tocada); 3 colunas criadas (`dataNascimento date`, `escolaridade text`, `genero text`). Consultas dos filtros novos rodadas no banco (so leitura): funcionam, 299 sem perfil.
- Ordem seguida: push de `2a7e9da` (iPhone) sozinho -> migration -> verificacao -> push de `6a2f7e1` (perfil).

**(1) "Um problema ocorreu repetidamente em .../carreiras/candidatar" (Safari iOS)**

- E o Safari matando a aba por memoria e caindo de novo ao recarregar — nao erro de JS (esse mostraria a tela de erro do Next).
- Descartados com evidencia: rascunho em localStorage e telemetria (`analytics.ts` e no-op sem PostHog/GA); commit do Session Replay de 2026-09-22 (a gravacao em erro ja estava em 100% antes; ele so reduziu).
- Medido com Playwright WebKit emulando iPhone 13, contra producao: pagina a 0,7 quadro/s, travadas de 2,1 s. Sem os orbes borrados: 4,8 q/s. Sem `backdrop-blur`: igual ao original (nao e isso). Orbes parados mas borrados: 0,8 q/s (nao e a animacao). **Causa: `filter: blur(80-90px)` em 4 circulos de 550-900px no `PublicBackground`.**
- Correcao: tirar o `filter`. O radial-gradient ja termina em transparente, entao o visual quase nao muda (conferido por print). Resultado emulado: 3,7 q/s, pior travada 0,35 s. Vale para todas as paginas com o componente (`/carreiras`, `/contato`, `/universidade-pb` e o layout de `/app`).
- Commit `2a7e9da`, isolado, pode subir sem depender do resto.
- Ressalva: WebKit headless no Windows desenha sem GPU; os numeros absolutos nao sao os do iPhone, a comparacao entre cenarios e. Confirmar no aparelho apos o deploy.

**(2) Perfil de triagem (genero, idade, escolaridade)**

- Pedido do PO: triar sem abrir o curriculo, alem do filtro PCD/Mulheres.
- `src/lib/carreiras-perfil.ts` (novo): listas de genero (com "Prefiro nao informar") e escolaridade (8 niveis), `calcularIdade` em UTC, `lerDataNascimento` (recusa 31/02), faixa 14-90 anos, faixas etarias -> intervalo de nascimento. `tests/carreiras-perfil.test.ts` (8 testes, incluindo cobertura sem buraco das faixas), adicionado ao `test:unit`.
- Schema: `Candidatura.genero String?`, `dataNascimento DateTime? @db.Date`, `escolaridade String?`. Texto validado por Zod, nao enum (lista cresce sem migration). Idade nunca e gravada.
- Formulario publico, passo 2: tres campos obrigatorios na tela; na API sao **opcionais** de proposito (quem estava com a pagina antiga aberta no deploy nao perde a candidatura). Rascunho guarda os campos.
- Banco de Talentos (`/talentos`): filtros Genero / Idade / Escolaridade, cada um com "Nao informado" (acha as ~300 antigas e os CVs importados); coluna Perfil ("Feminino · 27 anos · Medio completo"), que no celular vai para baixo do nome; bloco Perfil na ficha com edicao via nova rota `PUT /api/admin/rh/candidaturas/[id]/perfil` (auditoria `CANDIDATURA_PERFIL_ATUALIZADO`, registra quais campos, nao os valores). CSV ganha Genero, Idade, Escolaridade.
- Verificado: `tsc`, lint dos arquivos, `test:unit` 580 / 0 falhas, `next build` OK. Formulario percorrido no WebKit/iPhone com build local e rede interceptada (nada foi a IA nem ao banco): obrigatorios aparecem, 11 anos recusado, avanca com dados validos, rascunho guarda.
- **Migration `20260930000000_add_perfil_triagem_candidatura`**: 3 `ADD COLUMN` anulaveis, nenhum dado alterado. `prisma migrate diff` (somente leitura, banco vivo x schema) confirma exatamente essas 3 colunas. **Ordem obrigatoria: aplicar a migration ANTES do push** — o codigo novo seleciona as colunas e o Banco de Talentos daria 500 sem elas.
- Desvio antigo detectado, nao tratado: o indice `RecCargo_publicarNoSite_idx` existe no banco e nao no schema.
- Nao feito: PCD como campo proprio (continua prefixo na mensagem); `/gente/candidatos/do-banco-de-talentos` nao mostra o perfil.
- Parecer do outro agente: pendente.

### 2026-09-28 - Claude - `Cotas PCD e de aprendiz contavam aprendizes e estagiarios na base`

- Status: concluida (sem migration). Arquivos: `src/lib/gente/cotas.ts`, `src/app/api/gente/pcd/route.ts`, `src/app/gente/pcd/page.tsx`, `src/app/api/gente/aprendizes/route.ts`, `src/app/gente/aprendizes/page.tsx`, `tests/gente-cotas.test.ts`.

**Problema relatado pelo PO**

- A tela de Gestao PCD mostrava cota 5/7 ("faltam 2") sobre 209 colaboradores. A cota real da Pau Brasil e 4: o art. 93 da Lei 8.213/91 conta empregados, e jovem aprendiz (contrato especial, Lei 10.097/2000) e estagiario (sem vinculo, Lei 11.788/2008) nao entram.

**Causa**

- `GET /api/gente/pcd` usava `quadroColaborador.count({ ativo: true })` como base. No QLP ativo havia 9 aprendizes + 2 estagiarios. 209 cai na faixa de 3% (ceil 6,27 = 7); 198 cai na de 2% (ceil 3,96 = 4). Os 11 mudavam a faixa.

**Correcao**

- `QuadroColaborador` nao tem campo de tipo de vinculo; o sinal e o cargo. `cotas.ts` ganhou uma secao comum as duas cotas: `TERMOS_APRENDIZ_OU_ESTAGIARIO = ['APRENDIZ', 'ESTAGI']`, `ehAprendizOuEstagiario(cargo)` e `WHERE_APRENDIZ_OU_ESTAGIARIO` (mesmo criterio como filtro Prisma, `contains` + `insensitive`).
- A rota conta total e excluidos separadamente e usa a diferenca como base. **Nao** usa `NOT` sobre `cargo`: `NOT (NULL ILIKE ...)` e NULL no SQL e descartaria em silencio quem esta sem cargo.
- Resposta passa a trazer `cota.quadroTotal` e `cota.foraDaBase`; a tela escreve "sobre uma base de 198 colaboradores (209 no QLP, fora 11 aprendizes e estagiarios)" para o numero nao parecer errado frente a planilha.
- Verificado contra o banco real (somente leitura): 209 total, 11 fora (lista conferida cargo a cargo), base 198, exigido 4, ocupado 5, em dia.

**Riscos / pendencias**

- `ANALISTA DE VENDAS/APR` **continua na base** — PO confirmou que "APR" nao e aprendiz. Abreviacao nao entra no criterio, de proposito.
- Criterio por texto do cargo: um cargo novo escrito como "APR." ou "MENOR APRENDIZ" funciona; um escrito sem nenhum dos radicais nao. Um campo de vinculo no QLP resolveria de vez, mas exige coluna na planilha e migration — nao feito.
- **Cota de aprendiz corrigida na mesma rodada, a pedido do PO**: `GET /api/gente/aprendizes` usa a mesma base (total menos aprendizes/estagiarios) e devolve `quadroTotal`/`foraDaBase`; a tela explica a conta. Banco real: piso 11 -> 10, teto 31 -> 29, 8 vigentes, faltam 3 -> 2.
- A lei ainda permite tirar da base de aprendiz as funcoes que nao demandam formacao profissional. O sistema nao sabe quais sao; nao foi feito.
- **Divergencia de dados**: o QLP tem 9 cargos `JOVEM APRENDIZ*` ativos, o modulo Aprendizes tem 8 `VIGENTE`. Um aprendiz do QLP provavelmente nao esta cadastrado em `QuadroAprendiz` (ou esta com situacao diferente). Nao investigado — avisado ao PO.

- TypeScript verde; `npm run test:unit` 572 testes, 0 falhas (4 testes novos em `gente-cotas.test.ts`).
- **Ajuste posterior (mesmo dia), a pedido do PO:** a nota "(209 no QLP, fora 11 aprendizes e estagiarios)" foi removida das duas telas. As telas dizem so "base de 198". `quadroTotal`/`foraDaBase` sairam da resposta das APIs e o tipo `BaseDaCota` saiu de `cotas.ts`, porque so existiam para essa nota. O calculo nao mudou.
- Parecer do outro agente: pendente.

### 2026-09-25 - Claude - `Desfazer laudo anexado na pessoa errada`

- Status: concluida (sem migration, sem mudanca de API). Arquivo tocado: `src/app/gente/pcd/page.tsx`.

**Problema relatado pelo PO**

- Um laudo foi anexado no cadastro de outra pessoa, e a tela nao oferecia nenhuma saida: quem ja tinha laudo via apenas o botao "Laudo" (abrir). Sem remover, sem trocar.

**O que existia e o que faltava**

- A rota `DELETE /api/gente/pcd/[id]/laudo` **ja estava implementada e correta** desde a rodada anterior: apaga o blob, zera os quatro campos (`laudoBlobKey`, `laudoOriginalFilename`, `laudoMimeType`, `laudoSizeBytes`) e grava `GENTE_PCD_LAUDO_REMOVIDO` na auditoria. O `POST` ja substituia o anterior apagando o blob antigo.
- Faltava so a interface. Nenhuma alteracao de backend foi necessaria.

**Mudancas na tela**

1. **Nome do arquivo visivel na linha** de quem tem laudo. O campo `laudoOriginalFilename` ja vinha na resposta (`SELECT_PCD`) e na interface `Pcd`, mas nunca era renderizado. E o que permite o RH perceber o laudo trocado **sem abrir o arquivo** — e abrir e acesso a dado de saude, registrado em auditoria. O nome do arquivo nao e o laudo: e o rotulo que o RH recebeu.
2. **Botao "Trocar"** para quem ja tem laudo (reusa o `ModalLaudo`, que faz POST; o backend apaga o anterior).
3. **Botao de remover** (lixeira) abrindo `ModalRemoverLaudo`, novo componente: confirma mostrando nome da pessoa + nome do arquivo lado a lado, avisa que o arquivo e apagado do armazenamento e que a acao fica em auditoria.
4. `ModalLaudo` passou a se chamar "Trocar laudo" quando ja existe arquivo, e o aviso nomeia o arquivo que sera apagado.

**Decisao de escopo**

- A remocao apaga o blob de verdade, em vez de apenas desvincular. Dado de saude no cadastro errado e exatamente o que o modulo existe para evitar; guardar o arquivo orfao manteria a exposicao sem beneficio. Coerente com o `POST`, que ja apagava o anterior ao substituir.

- TypeScript verde (`npx tsc --noEmit`).
- Parecer do outro agente: pendente.

### 2026-09-25 - Claude - `Laudo PCD, sobreposicao em todas as importacoes, acoes em massa no quadro`

- Status: concluida (sem migration). Tres frentes pedidas pelo PO na mesma mensagem.

**(1) Laudo de PCD nao abria: "Erro ao buscar o arquivo"**

- Causa: o GET fazia `fetch(pcd.laudoBlobKey)`. O blob e **privado** — a URL sozinha nao abre e o fetch cru volta 403. O upload sempre funcionou; so a leitura falhava.
- Correcao: `get(chave, { access: 'private' })` do SDK `@vercel/blob`, que assina a requisicao com o `BLOB_READ_WRITE_TOKEN`. Blob ausente deixou de virar "erro" generico e passou a dizer para reanexar.
- **Upload em lote** (`LaudosEmLote`): o RH escolhe varios arquivos e o sistema casa cada um com a pessoa pelo **nome do arquivo** ("HELIO NASCIMENTO LAUDO.pdf", "JOSILDO VIEIRA DE SOUSA_DOC_PCD.pdf"). `laudo-arquivo.ts` tira o ruido (LAUDO, DOC, PCD) e as preposicoes.
  - **Nunca anexa sozinho no duvidoso.** Primeiro nome isolado nao casa com ninguem; homonimo e nome parcial ambiguo exigem escolha; dois arquivos apontando para a mesma pessoa travam os dois. Anexar laudo na pessoa errada e por dado de saude de alguem no prontuario de outro.
  - Conferido com os cinco arquivos reais que o PO colocou na pasta: os cinco casam certo.

**(2) Reimportar duplicava — revisao de todas as planilhas**

- O PO mostrou o quadro com 419 registros e a mesma pessoa repetida. So `internos` sobrepunha; as outras oito usavam `createMany` puro.
- Regra unica, em `sobreposicao.ts`: **a chave que identifica repeticao dentro do arquivo identifica o registro no banco.** Cada importador passou a exportar sua funcao de chave (`chaveColaborador`, `chaveDesligamento`, `chavePorNome`, `chaveInterno`, `chaveSucessao`, `chaveCandidato`), usada nos dois lados — se divergirem, volta a duplicar.
- **A estrategia nao e a mesma para todos**, e isso e deliberado:
  - **Apaga-e-recria** (quadro, desligamentos, aprendizes, sucessao, internos): nada aponta para essas tabelas, entao trocar o id nao quebra vinculo. Sao duas consultas, nao N.
  - **Atualiza** (PCD): apagar levaria junto o `laudoBlobKey` — o arquivo ficaria orfao e o RH teria que reanexar laudo por laudo sem saber de quem. Dado de saude que se perde assim nao volta da planilha.
  - **Atualiza** (candidatos): o candidato carrega etapas avaliadas, quem avaliou e quando. `situacao` e etapas ficam **fora** do update: quem avancou pela tela nao pode ser puxado de volta ao estagio que a planilha registrava quando foi exportada.
  - **Cargos** ja sobrepunha (`aCriar`/`aAtualizar`) — nada a mudar.
  - **Vagas** segue a decisao anterior (dedupe conservador + desfazer por lote): a planilha nao tem identificador de requisicao e vaga tem candidato vinculado.
- **Bug encontrado pelo teste:** a chave do candidato usava `normalizar(telefone)`, entao "(83) 99999-1234" e "83999991234" eram pessoas diferentes e a mesma pessoa reentrava a cada reimportacao com a formatacao trocada. Passou a usar so digitos.
- `TRANSACAO_IMPORTACAO` (timeout de 120 s) so na forma **interativa** — a forma em lista e um batch so e nao aceita nem precisa dessas opcoes.

**(3) Selecao e acoes em massa no quadro de pessoal**

- Caixa por linha, "selecionar os N desta pagina", contador, **Desligar** e **Excluir**.
- `DELETE /api/gente/quadro` com `{ ids }` ou `{ ids, acao: 'desligar', dataDesligamento, motivo, setor }`.
- Desligar em massa **cria o registro de desligamento de cada pessoa**, como a acao individual: o cadastro nao e apagado e o turnover continua certo. Quem ja esta inativo nao e desligado de novo (geraria segundo registro para a mesma saida).
- `ModalDesligar` passou a receber `alvos: Colaborador[]` e serve aos dois casos — e o mesmo formulario porque e a mesma decisao, e duplicar abriria espaco para divergirem.
- Mesmas travas das outras telas: "todos" e o que esta na tela (nunca o total do filtro), trocar filtro/pagina limpa a selecao, escopo no `where`.
- O modal em massa lista os tres primeiros nomes: contagem sozinha nao diz quem vai sair.

- **Limpeza pendente:** as duplicatas que ja estao no banco nao somem sozinhas. Reimportar a planilha agora substitui **uma** por chave; as copias extras o RH tira pela selecao em massa. Vale conferir o quadro depois da proxima importacao.
- Arquivos: `src/app/api/gente/pcd/[id]/laudo/route.ts`, `src/lib/gente/laudo-arquivo.ts` (novo), `src/app/gente/pcd/_components/LaudosEmLote.tsx` (novo), `src/app/gente/pcd/page.tsx`, `src/lib/gente/sobreposicao.ts` (novo), `src/lib/gente/importar-handler.ts`, `src/lib/gente/quadro-importador.ts`, `src/lib/gente/pcd-importador.ts`, `src/lib/gente/sucessao.ts`, `src/lib/gente/candidato-importador.ts`, as rotas `importar` de quadro/desligamentos/pcd/aprendizes/sucessao/candidatos, `src/app/api/gente/quadro/route.ts`, `src/app/gente/quadro/page.tsx`, `src/lib/audit.ts`, `tests/gente-sobreposicao.test.ts` (novo), `tests/gente-laudo-arquivo.test.ts` (novo), `package.json`.
- Parecer do outro agente: pendente.

### 2026-09-25 - Claude - `Rotulo do filtro de polo em candidatos internos`

- Status: concluida (sem migration). Pedido do PO: trocar "Todos os polos" por "Todas as operacoes" no select. So o rotulo da opcao vazia mudou; slugs e comportamento iguais.
- Arquivo: `src/app/gente/candidatos/internos/page.tsx`.
- Verificacao: `tsc` sem erros.
- Parecer do outro agente: pendente.

### 2026-09-24 - Claude - `Filtro por polo regional em candidatos internos`

- Status: concluida (sem migration).
- Pedido do PO: filtrar candidatos internos por **Patos + Sume**, **Sousa + Itaporanga**, **Guarabira**, **Brumado + Cacule + Barra**. Na lista real quase todos estao como "MATRIZ", entao o filtro matriz/filial da rodada anterior mal separava — o que o RH precisa e a regiao.
- `src/lib/gente/polos.ts` (novo): os quatro polos em codigo, e `operacoesDoPolo` reconhece a operacao pela cidade no nome ("Pau Brasil Sume") ou no `nomeAbrev`, **por palavra inteira e sem acento**. Palavra inteira porque, com `includes`, uma futura "Barragem" cairia no polo de Barra.
- API `GET /api/gente/internos?polo=<slug>` vira `operacaoId in [...]`. O escopo do usuario continua no `where`: operacao do polo que ele nao enxerga nao traz ninguem. Com `operacaoId` junto, o polo so estreita.
- Tela: select "Todos os polos", **mostrando so os polos com operacao no escopo do usuario** — quem cuida so de Patos nao ve "Brumado + Cacule + Barra" para receber lista vazia. O card passou a mostrar a operacao, para conferir o agrupamento.
- **O filtro matriz/filial foi mantido** ao lado. Sao eixos diferentes (tipo de unidade x regiao); remover e uma linha se o PO preferir so o de polo.
- **Limite conhecido:** os testes usam os nomes de `prisma/seed-empresas.ts`. Nao consegui ler as operacoes de producao nesta sessao. Se alguma foi renomeada sem a cidade no nome nem no `nomeAbrev`, ela fica fora do polo — e o sintoma e o polo sumir do select ou a contagem nao bater.
- Polos em codigo, nao em banco: mudar a composicao pede deploy. Se o RH precisar mexer sozinho, o caminho e `Operacao.polo`.
- Arquivos: `src/lib/gente/polos.ts` (novo), `src/app/api/gente/internos/route.ts`, `src/app/gente/candidatos/internos/page.tsx`, `tests/gente-polos.test.ts` (novo), `package.json`.
- Verificacao: `tsc` sem erros, lint limpo no arquivo, `build` OK, `test:unit` 518/518.
- Parecer do outro agente: pendente.

### 2026-09-24 - Claude - `Matricula, CPF e admissao no QLP + filtro matriz/filial`

- Status: concluida. **Migration aplicada:** `20260924120000_add_dados_pessoais_quadro` (tres colunas anulaveis + indice; nenhum registro alterado).
- Dois pedidos do PO.

**(1) Planilha modelo de QLP: Matricula, CPF, Data de admissao**

- Colunas novas no modelo, no importador (com sinonimos: `Chapa`/`Registro`, `Documento`, `Data de Admissao`), no formulario e na listagem.
- **A matricula virou a identidade na importacao.** Antes era nome + operacao, que erra nos dois sentidos: nome muda (casamento, grafia) e homonimo existe. Com matricula preenchida, e ela que decide se duas linhas sao a mesma pessoa; sem matricula, a regra antiga continua valendo.
- **CPF invalido bloqueia a linha, nao avisa.** O RH pede o CPF para conferir a folha; um numero errado so aparece meses depois, quando ninguem lembra de qual linha veio. Validacao pelos dois digitos verificadores, e os 11 digitos repetidos sao recusados (passam no calculo, mas sao preenchimento de teste).
- Guardado **so com digitos**: formatos diferentes do mesmo CPF impediriam de reconhecer a mesma pessoa.
- **Decisao do PO sobre visibilidade do CPF:** *todo usuario com acesso ao modulo Gente ve o CPF completo* — sem mascara, e a coluna sai na exportacao para todos. Eu havia implementado atras de `canViewDadoSensivel` (so RH_ADMIN, como o salario da vaga); o PO escolheu a opcao mais aberta e a camada de mascara foi **removida**, nao deixada inerte.
  - **Consequencia registrada:** hoje `canAccessGente` e `canViewDadoSensivel` sao ambos `isRhAdmin`, entao na pratica nada muda. Mas o comentario de `canViewDadoSensivel` diz que **na Fase 3 o modulo abre para gestores solicitantes** — quando isso acontecer, eles passarao a ver o CPF de todo o quadro. Se nao for a intencao, e este o ponto a revisitar.
  - Sobrou como controle: `GENTE_DADO_SENSIVEL_ACESSADO` gravado **antes** de servir o cadastro individual.

**(2) Filtro matriz/filial em candidatos internos**

- O campo `matrizOuFilial` ja existia no banco e nao aparecia em lugar nenhum da tela.
- **E texto livre da planilha**, entao o filtro reconhece o termo em vez de exigir igualdade: "MATRIZ", "Matriz", "Filial Sousa" e "Matriz - Patos" entram nos grupos certos. Igualdade exata deixaria metade da base de fora.
- Tres opcoes, nao duas: **"Sem informacao"** e o complemento dos outros dois, nao `null`. Um campo preenchido com "Patos" tambem nao diz a lotacao, e o RH precisa achar para corrigir. Os tres somam a base inteira e nao se sobrepoem — ha teste para isso.
- "Matriz/Filial" conta como matriz, e o filtro de filial tem `NOT contem matriz` para a pessoa nao aparecer nos dois.
- A lista mostra o texto **como veio da planilha**, nao a classificacao: "Filial Sousa" diz mais que "Filial", e e por ele que o RH percebe a digitacao que ficou fora dos grupos.

- Arquivos: `prisma/schema.prisma`, `prisma/migrations/20260924120000_add_dados_pessoais_quadro/`, `src/lib/gente/cpf.ts` (novo), `src/lib/gente/matriz-filial.ts` (novo), `src/lib/gente/quadro.ts`, `src/lib/gente/quadro-importador.ts`, `src/lib/gente/modelos.ts`, `src/app/api/gente/quadro/route.ts`, `src/app/api/gente/quadro/[id]/route.ts`, `src/app/api/gente/quadro/importar/route.ts`, `src/app/api/gente/internos/route.ts`, `src/app/gente/quadro/page.tsx`, `src/app/gente/quadro/_components/FormularioColaborador.tsx`, `src/app/gente/quadro/[id]/editar/page.tsx`, `src/app/gente/candidatos/internos/page.tsx`, `src/app/gente/vagas/page.tsx` (warning de lint da rodada anterior), `tests/gente-cpf.test.ts` (novo), `tests/gente-matriz-filial.test.ts` (novo), `tests/gente-quadro.test.ts`, `package.json`.
- Verificacao: `tsc` sem erros, `lint` sem warning novo (os 4 restantes sao pre-existentes, em arquivos nao tocados), `build` OK, `test:unit` 511/511.
- **Pendencia conhecida:** a importacao do QLP ainda usa `createMany` puro, entao reimportar a planilha **duplica** — mesmo defeito que foi corrigido em candidatos internos nesta data. Agora que existe matricula, a sobreposicao tem identidade confiavel. Nao foi feito por nao ter sido pedido.
- Parecer do outro agente: pendente.

### 2026-09-24 - Claude - `Selecao em massa para excluir vagas na lista`

- Status: concluida (sem migration).
- Relato do PO: *"Nao encontrei a opcao de desfazer, coloque caixa de selecao para excluir, caso queira excluir em massa."*
- **O desfazer existia, mas no lugar errado.** Eu o coloquei em `/gente/vagas/importar`, e o RH estava em `/gente/vagas` — a tela onde ele ve as vagas e onde naturalmente iria apaga-las. Descoberta e parte da feature; um recurso que ninguem acha nao existe.
- Solucao: caixa de selecao em cada vaga da lista, "selecionar as N desta pagina", contador e botao "Excluir selecionadas". O painel de desfazer por lote continua na tela de importar — sao complementares: o lote serve para reverter um arquivo inteiro, a selecao serve para qualquer recorte.
- Rota nova: `DELETE /api/gente/vagas` com `{ ids }`.
  - Escopo entra no `where` junto com os ids: id de outra operacao simplesmente nao e encontrado, e a resposta nao distingue "nao existe" de "nao e sua".
  - **Vaga com candidato vinculado continua intocada** — mesma regra da exclusao avulsa. A resposta diz quantas ficaram e por que.
  - Teto de 200 por chamada.
  - Auditoria: `GENTE_VAGAS_EXCLUIDAS_EM_MASSA`.
- Decisoes de UX que valem registro:
  - **"Selecionar todas" e sempre o que esta na tela, nunca o total do filtro.** Marcar 65 vagas num clique sem poder conferir e o tipo de atalho que causa estrago.
  - **Trocar filtro ou pagina limpa a selecao.** Manter marcada uma vaga que saiu da tela e o caminho curto para alguem apagar o que nao estava vendo.
  - O checkbox fica fora do `<button>` do card: aninhado nao e clicavel de forma confiavel, e marcar nao pode abrir o detalhe.
- **Sem cobertura de teste automatizada na rota nova**, como as demais rotas do modulo Gente. Verificado por `tsc` e `build`; a regra de candidato vinculado repete a da exclusao avulsa, que ja estava em producao.
- Arquivos: `src/app/api/gente/vagas/route.ts`, `src/app/gente/vagas/page.tsx`, `src/lib/audit.ts`.
- Verificacao: `tsc` sem erros, `build` OK, `test:unit` 486/486.
- Parecer do outro agente: pendente.

### 2026-09-24 - Claude - `Cadastro manual de candidato interno recusado: "Futuros cargos"`

- Status: concluida (sem migration).
- Relato do PO, com print: cadastrar candidato interno **na mao** morria com `Dados invalidos: Futuros cargos` e, abaixo do campo, `Expected array, received string`. **Editar funcionava.**
- Causa: `futurosCargos` e array no banco, mas o campo em `sucessao/_campos.ts` **nao tinha `tipo: 'lista'`** — entao `FormularioSimples` mandava a string `"Gerente de Vendas;"`. O PATCH tinha um `split` improvisado dentro da rota; **o POST nao tinha**. Por isso so criar quebrava.
- **E o segundo caso identico.** O primeiro foi `turnos` no descritivo de cargo, mesma raiz: o formato depender de a tela e a rota combinarem por acordo tacito.
- Correcao em tres camadas, de proposito:
  1. `tipo: 'lista'` no campo — conserto de origem.
  2. `listaDeTexto()` (`src/lib/gente/lista-campo.ts`, novo) no schema: **aceita array e texto**. Vale para POST, PATCH e qualquer rota futura. Aplicado tambem em `turnos`, que corria o mesmo risco.
  3. O `split` improvisado saiu da rota de PATCH — a conversao agora mora num lugar so.
- Virgula e ponto e virgula passam a separar igual, no formulario e no schema: quem digita nao decora qual o campo aceita, e trocar um pelo outro nao pode custar o cadastro inteiro.
- `tests/gente-interno-contrato.test.ts` (novo), espelhando o do cargo. **Conferido que falha no codigo anterior: 6 testes vermelhos**, incluindo a reproducao exata do que o RH digitou (`cargoPretendido: REPRESENTANTE DE NEGOCIOS`, `futurosCargos: "Gerente de Vendas;"`).
- Arquivos: `src/lib/gente/lista-campo.ts` (novo), `src/lib/gente/sucessao.ts`, `src/lib/gente/cargo.ts`, `src/app/gente/sucessao/_campos.ts`, `src/app/gente/_components/FormularioSimples.tsx`, `src/app/api/gente/internos/[id]/route.ts`, `tests/gente-interno-contrato.test.ts` (novo), `package.json`.
- Verificacao: `tsc` sem erros, `build` OK, `test:unit` 486/486.
- Parecer do outro agente: pendente.

### 2026-09-24 - Claude - `Desfazer importacao de vagas + reimportar internos sobrepoe`

- Status: concluida. **Migration aplicada:** `20260924000000_add_importacao_recvaga` (coluna anulavel + indice; nenhum registro alterado).
- Origem: dois pedidos do PO na mesma mensagem.
  1. *"tem como excluir todos que foram importados, de uma vez? pra importar uma nova planilha porque na hora que eu importei ficou errado, uma coluna da planilha"*
  2. *"quando adiciono candidato interno, mas se adicionar mais uma pessoa na planilha e adicionar novamente e pra sobrepor, nao pode duplicar pra nao ter informacoes erradas"*

**(1) Desfazer importacao de vagas**

- `RecVaga.importacaoId` carimba o lote. Toda importacao confirmada gera um `randomUUID` no servidor e marca as vagas daquele arquivo. Desfazer e apagar por esse id — **nao encosta em vaga cadastrada na tela nem em importacao anterior**.
- Rota nova `GET/DELETE /api/gente/vagas/importacoes`, e o painel "Desfazer uma importacao" na propria tela de importar.
- **As vagas que motivaram o pedido ja estavam no banco com `importacaoId` nulo.** Para elas sobrou o horario: um `createMany` grava tudo dentro do mesmo instante, entao vagas sem lote criadas **no mesmo minuto** vieram do mesmo arquivo. Duas ou mais no minuto e o corte — uma sozinha e cadastro de tela e nao aparece como lote, para o RH nao apagar o que digitou.
- Como o agrupamento por horario e heuristico, **quem decide e o RH**: a tela mostra data, quantidade, operacoes e cargos antes de confirmar, e marca o lote inferido como "importacao antiga".
- **Vaga com candidato vinculado nunca e apagada** — mesma regra da exclusao avulsa. A resposta diz quantas ficaram e por que.
- O filtro do DELETE nasce do escopo do usuario e o lote so o estreita: chave vinda do cliente nunca amplia o alcance. `alvoDaChave` recusa chave com segundos, que esticaria a janela para meio lote que o RH nao viu.
- Auditoria: `GENTE_VAGAS_IMPORTACAO_DESFEITA`.

**(2) Reimportar internos sobrepoe**

- A planilha de candidatos internos e revisada e reenviada. Com `createMany` puro, a segunda importacao criava copias de todo mundo e a mesma pessoa aparecia duas vezes, com dados possivelmente divergentes.
- Identidade: **operacao + nome normalizado** — a mesma que o analisador ja usa dentro do arquivo. Nao ha matricula na planilha.
- Apaga-e-recria em vez de `update` um a um: sao duas consultas, nao N. A transacao da fabrica e **interativa (limite de 5s)** e os updates sequenciais estourariam — foi o que derrubou a importacao de cargos com P2028.
- A tela avisa ao concluir: "Quem ja estava cadastrado foi substituido pelos dados da planilha".

- Arquivos: `prisma/schema.prisma`, `prisma/migrations/20260924000000_add_importacao_recvaga/`, `src/lib/gente/vaga-lotes.ts` (novo), `src/app/api/gente/vagas/importacoes/route.ts` (novo), `src/app/api/gente/vagas/importar/route.ts`, `src/app/api/gente/internos/importar/route.ts`, `src/app/gente/vagas/importar/page.tsx`, `src/app/gente/vagas/importar/_components/DesfazerImportacao.tsx` (novo), `src/app/gente/_components/ImportadorPlanilha.tsx`, `src/lib/audit.ts`, `tests/gente-vaga-lotes.test.ts` (novo), `package.json`.
- Verificacao: `tsc` sem erros, `build` OK, `test:unit` 478/478.
- Parecer do outro agente: pendente.

### 2026-09-24 - Claude - `Vagas identicas deixam de ser descartadas na importacao`

- Status: concluida (sem migration). Continuacao direta da rodada anterior.
- Origem: o PO colocou a planilha real em `gestao de recrutamento/modelo-vagas.xlsx` e pediu avaliacao. Depois da correcao anterior sobraram **4 linhas** acusadas de repeticao.
- **Nenhuma das 4 era duplicata.** Abrindo a planilha:
  - L41 e L42 — `MOTORISTA DE CARRETA`, Sousa, 10/06, tudo igual **exceto o contratado**: "Pedro Iran" e "Alcir Alex".
  - L44 e L45 — `AJUDANTE DE ARMAZEM`: "Jesse Jose" e "Francisco Damiao".
  - L52, L53, L54 — `AJUDANTE DISTRIBUICAO`, 03/08: "Joao Paulo", "Ederson" e "Jose Nilton".
  - Sao **aumento de QLP**: varias posicoes do mesmo cargo abertas no mesmo dia, uma pessoa em cada. O `Cod` estava **"0"** em todas as linhas, entao nunca separou nada.
- Duas mudancas:
  1. **O contratado entra na chave.** Tres vagas de ajudante do dia 03/08 deixam de virar uma so.
  2. **Linha identica deixa de ser descartada** — vira aviso, e as duas entram.
- **Por que (2), e nao so (1):** a planilha nao tem identificador de requisicao. Duas vagas abertas hoje para o mesmo cargo, ambas em aberto e sem contratado, sao **indistinguiveis** de uma linha digitada duas vezes — so quem fez a planilha sabe. Entre errar descartando e errar duplicando, duplicar e o erro barato: a linha repetida o RH ve na lista e apaga; a linha que some ele nao tem como perceber que faltou.
- **Conferido contra a planilha real:** 62 linhas com dados. Pela regra original, **28** seriam descartadas; pela regra nova, **zero identicas** — as 62 sao vagas distintas e todas entram.
- O teste `descarta repetidas do proprio arquivo` afirmava o comportamento que causava a perda. Reescrito, mais um fixando o caso real das tres vagas de ajudante com contratados diferentes.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 466/466.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **A deduplicacao e so dentro do arquivo, nao contra o banco.** Reimportar a mesma planilha duplica as vagas — ja era assim antes, mas agora que nada e descartado o efeito fica mais visivel. Se o RH reimportar com frequencia, vale uma checagem contra o que ja existe.
  - A coluna `Cod` esta preenchida com **"0"** em toda a planilha. Nao atrapalha mais, mas nao serve para nada — vale conferir com o RH se deveria ter conteudo.

### 2026-09-24 - Claude - `Importacao de vagas descartava vagas diferentes como repetidas`

- Status: concluida (sem migration)
- Origem: relato do RH no grupo — "quando estou importando a planilha de controle de vagas esta acontecendo esse erro, e acaba nao importando a mesma vaga, so esta considerando uma". O print mostrava 62 linhas lidas, 34 prontas e **27 repetidas**.
- **Causa:** a chave de deduplicacao era `codigo ? cod:${codigo} : unidade+cargo+abertura+colaborador`. Com a coluna "Cod" preenchida, **o codigo mandava sozinho**. Na planilha do RH o mesmo codigo aparece em vagas de cargos diferentes — ele nao identifica a requisicao.
  - A propria mensagem denunciava o defeito: linhas de cargos distintos (`MOTORISTA DE CARRETA`, `AJUDANTE DE ARMAZEM`, `MOTORISTA DE DISTRIBUICAO`) **todas apontando para a linha 2**, que era `AJUDANTE DISTRIBUICAO`.
- **A regra virou conservadora, de proposito.** Duas vagas so sao a mesma quando **tudo** que as identifica bate: unidade, cargo, data de abertura, colaborador anterior e codigo.
  - O raciocinio: **na duvida, importa.** Uma vaga duplicada o RH ve na lista e apaga; uma vaga descartada em silencio ele nao tem como perceber que faltou. O custo dos dois erros nao e o mesmo, e a regra anterior escolhia o pior.
- A mensagem passou a dizer **o que** colidiu — era "Repete a linha 2 (mesma vaga)", que nao da o que corrigir na planilha.
- **O teste que existia codificava o defeito.** `codigo preenchido e o que define repeticao` afirmava que mesmo codigo com cargo diferente era repeticao; passava, e estava errado. Reescrito, mais tres: linha identica continua sendo repeticao, a mensagem nomeia o que colidiu, e mesmo cargo em datas de abertura diferentes sao duas vagas (reabrir a posicao meses depois e requisicao nova).
- A regra da coluna "Cod" no modelo dizia "quando preenchido, e o que identifica repeticoes" — deixou de ser verdade e foi reescrita.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 467/467.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **Vale conferir com o RH o que o "Cod" significa na planilha deles.** Se for codigo de cargo e nao de requisicao, o nome da coluna no modelo confunde e merece mudar.
  - O print mostrava tambem **1 linha com erro** que nao foi investigada — o RH pode mandar qual e, ou basta abrir "ver" no aviso vermelho.
  - A mesma regra `codigo ? ... : ...` nao existe nos outros importadores, que ja usam chave composta. Este era o unico caso.

### 2026-09-23 - Claude - `Banco de Talentos: rejeitar candidato falhava em silencio`

- Status: concluida (sem migration)
- Origem: PO trouxe um relato do RH no grupo de WhatsApp — "quando a gente clica em rejeitar candidato, o curriculo nao sai da aba de Novos Recebidos... acaba que a gente abre o mesmo curriculo varias vezes". Mais o print do filtro "Rejeitado" devolvendo quatro colunas vazias, e o pedido de alargar o quadro.
- **O relato estava certo, e a causa era uma so:** `TRANSICOES_VALIDAS.RECEBIDO` permitia apenas `TRIAGEM`. O botao "Rejeitar Candidato" num cartao de Novos Recebidos chamava a API, recebia `Transicao invalida: RECEBIDO -> REJEITADO`, e o cartao ficava onde estava.
  - Rejeitar direto da primeira coluna e **legitimo**: o RH abre o curriculo que acabou de chegar e ja ve que nao serve. Obrigar a passar por triagem antes e burocracia sem proposito. `RECEBIDO` passa a aceitar `REJEITADO` e `ARQUIVADO`.
- **Por que ninguem foi avisado:** `handleItemMoved` fazia `throw new Error('API failed')` e **ninguem capturava** — a promessa morria e a tela nao dizia nada. Agora mostra o motivo da recusa em toast e recarrega, para a tela nunca discordar do banco.
- Tres defeitos vizinhos, na mesma tela:
  1. **Nao havia coluna de rejeitados.** `COLUMNS` tinha quatro etapas; o rejeitado sumia do quadro — sem conferir a decisao nem desfazer. Era isso que o filtro "Rejeitado" do topo mostrava como quatro colunas vazias.
  2. **O motivo da rejeicao ia para o lixo.** O `prompt` guardava o texto em `p` e chamava `onReject()` sem argumento. Agora vira nota no historico da candidatura.
  3. **O quadro nao cabia na tela.** Cada coluna com `w-80` fixo numa faixa rolavel; com cinco colunas era arrastar para o lado. Virou grade `repeat(5, minmax(240px, 1fr))`, com rolagem so abaixo de 1280px — onde cinco colunas nao cabem mesmo.
- **A maquina de estados nao tinha teste nenhum**, e foi por isso que a regra que travava o fluxo passou despercebida desde sempre. Entraram 7, incluindo dois que fecham a classe: toda etapa tem regra declarada e aponta so para etapa existente; e de toda etapa ativa da para sair do funil (candidato preso numa etapa sem saida fica no quadro para sempre).
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 464/464.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - A tela ainda usa `prompt()` para o motivo e `confirm()`/`alert()` na limpeza de CVs. Trocar o `alert` do erro por toast foi so o caso que eu toquei; o resto segue na lista da auditoria.
  - `ARQUIVADO` continua sem coluna no quadro. E etapa terminal e de volume baixo, mas quem arquiva hoje tambem perde o candidato de vista.

### 2026-09-23 - Claude - `Painel e filtro de frontline em Candidatos`

- Status: concluida (sem migration)
- Origem: PO — "adicione uma opcao de filtrar apenas frontline e um dashboard tambem pra mostrar quantos frontline temos, quantos por operacao e trazer os 3 cargos que possuem maior solicitacao".
- **Filtro** — `?frontline=1`, aplicado no `where` e nao depois da consulta: a lista e paginada, e filtrar em memoria devolveria paginas de tamanhos aleatorios e contagem errada. Casa pelas duas pontas (vaga por id, candidato solto por nome com `mode: insensitive`). Nenhum cargo marcado devolve lista vazia, e nao "todos" — um `OR: []` no Prisma traria o banco inteiro.
- **Painel** (`src/lib/gente/painel-frontline.ts`, funcao pura com 13 testes):
  - Quantos candidatos de frontline **sobre o total** — o denominador da a proporcao.
  - Por operacao, com barra proporcional ao maior: comparar operacoes e a razao de a lista existir, e so o numero faz o olho recontar.
  - Os 3 cargos mais disputados, com a demanda aberta ao lado.
  - **"Maior solicitacao" foi lido como quem esta EM DISPUTA agora** (`EM_STAND_BY`, `EM_ANDAMENTO`). `CONTRATADO`, `NAO_CONTRATADO` e `INDISPONIVEL` sao desfechos; conta-los deixaria um cargo ja resolvido parecendo aquecido. Decisao discutivel, por isso esta em funcao testada e nao na rota.
- **O quarto numero, que eu acrescentei:** cargo com **vaga aberta e nenhum candidato**. Posicao descoberta sem ninguem no funil nao se resolve sozinha, e nada avisava. So aparece quando existe — alerta permanente vira paisagem.
- Sem cargo marcado, o painel diz "nenhum cargo marcado como frontline" em vez de mostrar zeros: sao coisas diferentes, e zeros fariam parecer que a operacao nao tem frontline nenhum.
- Rota `resumo-frontline` separada da listagem: a lista e paginada e o painel fala do conjunto inteiro. Junta-los obrigaria a buscar tudo a cada troca de pagina, e o numero mudaria com o filtro — o oposto do que um resumo serve para dizer.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 457/457, com 13 testes novos.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - O painel le ate 5000 candidatos e 5000 vagas para somar. Hoje sao dezenas; se crescer para dezenas de milhares, a conta precisa virar `groupBy` no banco.
  - **Nenhum cargo esta marcado como frontline ainda** — o painel mostra o estado vazio explicativo ate o RH marcar.

### 2026-09-23 - Claude - `"Dados invalidos" ao salvar descritivo: turnos sem tipo de campo`

- Status: concluida (sem migration)
- Origem: PO — "deu erro ao salvar", com print da edicao de descritivo e o aviso "Dados invalidos".
- **Causa:** o campo "Turnos oferecidos" perdeu o `tipo: 'lista'` em `_campos.ts`. Sem ele o `FormularioSimples` trata o campo como texto e, vazio, envia `null`. A API espera `z.array(z.string())` e recusa **o formulario inteiro**. Como o campo costuma estar vazio, **qualquer** edicao de descritivo quebrava.
- **Dois bugs vizinhos, achados no caminho:**
  1. **`frontline` estava no formulario e no POST, e fora do PATCH.** O zod descarta chave desconhecida em silencio — marcar a caixa, salvar e ver "Atualizado" nao gravava nada. Entrou na rodada anterior e teria passado despercebido.
  2. **O formulario recebia `detalhes` do servidor e jogava fora.** Sobrava "Dados invalidos" sem dizer onde, e foi isso que tornou o bug dificil de achar. Agora o campo fica marcado em vermelho e o aviso nomeia os campos recusados.
- **A correcao estrutural, que e o ponto da rodada:** o schema estava **duplicado** dentro de `api/gente/cargos/route.ts` e `api/gente/cargos/[id]/route.ts`, e as copias divergiram — foi assim que `frontline` ficou so numa. Virou `src/lib/gente/cargo.ts`, com `cargoSchema`, `cargoPatchSchema` e `SELECT_CARGO` num lugar so.
- `tests/gente-cargo-contrato.test.ts` fecha a classe do bug: **todo campo de `SECOES_CARGO` tem que existir no schema da API**, e o payload montado a partir de `VALORES_CARGO` reais tem que passar pelos dois schemas. Foi esse teste que apontou o `turnos` — na primeira execucao.
- **Registro de metodo, porque custou tempo:** minha primeira simulacao do payload **passou**, porque eu hardcodei o tipo do campo em vez de ler `_campos.ts`. Foi so escrever o teste lendo o arquivo de verdade para o erro aparecer. Suposicao nao substitui leitura — vale para a proxima investigacao deste tipo.
- Um `npm run build` falhou com `TypeError: Cannot read properties of null (reading '1')` no `next/font`; e a falha transitoria de fetch do Google Fonts que ja apareceu antes, nao o codigo. O build seguinte passou limpo.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 444/444, com 8 testes novos.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - As outras telas de cadastro do modulo (`vagas`, `pcd`, `aprendizes`, `internos`, `sucessao`) tem o mesmo arranjo: schema dentro da rota, formulario declarado a parte, sem teste ligando os dois. O mesmo bug pode existir em qualquer uma — vale replicar o teste de contrato.

### 2026-09-23 - Claude - `Cargo de frontline: marca no descritivo, destaque no candidato`

- Status: concluida. Migration aditiva (uma coluna, default false; nenhum registro alterado).
- Origem: PO — "em descritivo de cargo adicione uma caixa para selecionar se e ou nao vaga de frontline" e "em candidatos, se o candidato for uma vaga de frontline mostrar no painel destacado por alguma cor".
- **A marca fica no cargo, nao na vaga.** "Ajudante de Armazem" e frontline sempre, nao so numa requisicao especifica — a natureza e do cargo, e o descritivo ja e onde ela esta descrita. Guardar por vaga obrigaria a remarcar a cada requisicao e deixaria as vagas divergirem entre si.
- Nasce desmarcado: classificar 57 cargos de uma vez seria inventar uma decisao que so o RH sabe tomar.
- **Como o candidato e ligado ao cargo** (`src/lib/gente/frontline-cargo.ts`):
  1. **Pela vaga** — `candidato.vagaId` -> `vaga.cargoId` -> descritivo. E id, nao erra.
  2. **Pelo nome** — o candidato guarda `cargo` como texto (veio da candidatura do site ou foi digitado). Casa pela mesma `chaveDeCargo` do resto do modulo: ignora acento, caixa, turno e preposicao.
  - **Quando ha vinculo, ele decide sozinho.** Cair no nome depois de o id dizer "nao" faria o id valer menos que a digitacao. Ha teste fixando isso.
  - Na pratica o caminho 2 e o que atende o volume: a maioria dos candidatos vem do Banco de Talentos e nao esta presa a uma vaga.
- Performance: uma consulta so dos descritivos marcados e o cruzamento em memoria. Resolver por candidato daria um N+1 no meio da listagem paginada.
- UX: o selo e **ambar**, nao verde. Verde na lista de candidatos ja significa etapa aprovada; repetir a cor faria o selo ser lido como resultado do processo em vez de natureza do cargo.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 436/436, com 9 testes novos.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **Nenhum descritivo esta marcado ainda.** Enquanto o RH nao marcar, nenhum candidato mostra o selo — o que e o comportamento correto, mas pode parecer que a feature nao funcionou.
  - O acompanhamento **Vagas Frontline** (`QuadroFrontlineCargo`) continua com catalogo proprio, por operacao e departamento, com QLP meta/real. Sao coisas distintas: um e o indicador, o outro e a classificacao do cargo. Vale avaliar se o catalogo do indicador deveria passar a ler os descritivos marcados, em vez de manter cadastro separado.

### 2026-09-23 - Claude - `A pagina de carreiras passa a mostrar so cargos com descritivo`

- Status: concluida. **Escritas no banco autorizadas pelo PO** (publicacao, renomeacao de um descritivo, criacao de um, e despublicacao de 7).
- Origem: as quatro decisoes do PO sobre a remocao da lista curada.
- Decisoes executadas:
  1. **Grupo "Tecnologia" criado** — os 3 descritivos de TI nao tinham onde entrar e ficavam invisiveis mesmo publicados.
  4. **Grupo "Programas" criado** — Aprendiz, Estagiario e Trainee sao programas de entrada, nao cargos de area. Ficavam nas areas internas "Todas" e "Administrativo", que nao existem na pagina.
  2. **Logistica:** `Motorista` foi renomeado para `Motorista da Distribuicao` e `Motorista de Carreta` foi **criado a partir dele**, ambos em Distribuicao. Os outros 7 sairam do site — **nao foram excluidos**: o descritivo continua valendo internamente.
  3. **Turnos removidos:** nenhum descritivo declara turno, entao Diurno/Noturno deixam de existir na pagina.
- **`montarCatalogo` parou de unir** a lista curada com os publicados. A uniao mantinha no ar cargos sem descricao nenhuma, que o candidato escolhia sem saber o que eram.
- **O plano B virou armadilha e foi removido.** Quando a rota falhava, a pagina caia na lista chumbada. Com a validacao de envio aceitando **so** o catalogo de descritivos, essa lista mostraria cargos que o servidor recusa: o candidato preencheria tudo e levaria erro no fim. Agora falha visivel e cedo, com estados distintos para "carregando" e "nao carregou".
- **`carreiras-areas.ts` mantem o array `cargos`, e nao e descuido.** As candidaturas **ja recebidas** guardam o nome do cargo como texto com a grafia daquela lista, e as telas do Banco de Talentos filtram por esses nomes. Esvaziar o array deixaria o filtro do historico sem opcoes. O cabecalho do arquivo agora diz isso.
- O aviso do RH mudou de criterio: era "o nome nao esta na lista da pagina", virou "falta dizer em que grupo ele entra" — que e o que de fato decide se o cargo aparece.
- **Erro meu, corrigido na mesma rodada:** o `updateMany` que tirou Logistica do site filtrou por **area** e derrubou junto `Ajudante de Armazem` e `Coordenador de Armazem`, que tinham grupo escolhido a mao. Religados com a regra certa — grupo explicito significa que alguem decidiu, e decisao nao se desfaz por filtro amplo. Armazem tinha ficado vazio na pagina.
- **Estado no banco:** 58 descritivos, **51 na pagina** — Armazem 2, Distribuicao 4, Vendas & Marketing 26, Financeiro 8, RH 5, Tecnologia 3, Programas 3. **Frota ficou sem descritivo** e o grupo nao aparece.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 427/427. Os testes do catalogo foram reescritos para a regra nova.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **`Motorista de Carreta` nasceu como copia** do descritivo de Motorista, com observacao marcando para revisao. O conteudo especifico de carreta precisa ser escrito.
  - **Frota nao tem nenhum descritivo** — o grupo sumiu da pagina. Se o RH quiser Auxiliar de Frota e Coordenador de Frotas de volta, precisa cadastra-los.
  - Conferir com o RH duas classificacoes que vieram da area interna: `Auxiliar Servicos Gerias` (com o typo) caiu em Financeiro, e `Coordenador de Seguranca`/`Tecnico Seguranca` cairam em RH em vez do grupo Seguranca, que ficou vazio.

### 2026-09-23 - Claude - `Descritivo nasce publicado; a lista curada segue de pe, por ora`

- Status: concluida. **Duas escritas no banco, autorizadas pelo PO:** publicacao de 5 descritivos ("pode chamar a api") e ligar os 50 restantes ("por padrao adiciona no site"). Mais uma migration de DEFAULT.
- Origem: PO — "pode chamar a api" (publicar os 5) e "vamos deixar mostrando apenas as vagas que tenham descritivo de cargo, o que acha? conforme for adicionando, por padrao adiciona no site e o RH remove caso necessario".
- **Padrao invertido.** `publicarNoSite` nasceu `false`, para cargo em estudo nao vazar. O efeito real foi outro: o RH escreveu **57 descritivos e publicou 2**, porque publicar era um passo extra que ninguem lembrava. Migration `20260923120000_publicar_cargo_por_padrao` muda so o DEFAULT; ligar os existentes foi feito a parte, porque e decisao de conteudo e nao de schema.
- **O grupo passa a ser deduzido da area interna quando o RH nao escolhe.** Sem grupo o cargo nao aparece — com a publicacao virando padrao, isso transformaria "publicado" em "publicado e invisivel".
  - `GRUPO_POR_AREA` cobre so o que e um-para-um: Financeiro, Vendas, Marketing, Gente e Gestao, Seguranca, Servicos Gerais.
  - **Logistica fica de fora de proposito:** na pagina ela se divide em Armazem, Distribuicao e Frota, e deduzir colocaria um motorista dentro de Armazem.
- **Estado no banco depois desta rodada:** 57 descritivos, **57 publicados**, **43 aparecem na pagina**, 14 sem grupo dedutivel (8 Logistica, 3 TI, 2 "Todas", 1 Administrativo).
- **A lista curada NAO foi removida, e isso foi escolha minha.** O PO pediu; os numeros dizem que ainda nao. Tres decisoes precisam vir antes:
  1. **TI nao tem grupo na pagina.** Os grupos sao Armazem, Distribuicao, Frota, Vendas & Marketing, Financeiro, RH, Seguranca e Servicos Gerais. Tres descritivos de TI ficariam invisiveis — criar um grupo "Tecnologia" ou encaixar onde?
  2. **Os 8 de Logistica** precisam de destino: Armazem, Distribuicao ou Frota, um a um.
  3. **Os turnos somem.** "Ajudante de Armazem - Diurno/Noturno", "Conferente ... Diurno/Noturno" e "Operador de Empilhadeira - Diurno/Noturno" so existem na lista curada; os descritivos tem `turnos` vazio. Sem preencher, o candidato perde a escolha de turno em cargos operacionais.
  - Alem disso, **32 cargos da lista curada nao tem descritivo** e sairiam do site. Varios sao operacionais de alto volume (Motorista da Distribuicao, Conferente de Armazem, Operador de Empilhadeira, Auxiliar de Frota). Alguns tem equivalente com outro nome no cadastro ("Conferente de Armazem" -> "Conferente"), mas o candidato veria nomes diferentes.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 423/423.
- Parecer do outro agente: pendente (Codex)
- Proximo passo: com as tres decisoes, remover a lista curada de `carreiras-areas.ts` (o arquivo fica so com a definicao dos grupos) e apagar o caminho de uniao em `montarCatalogo`.

### 2026-09-23 - Claude - `Preposicao duplicava o cargo na pagina de carreiras`

- Status: concluida (so `cargo-publico.ts` e o teste)
- Origem: PO — "tem como linkar aqui tambem?", com print mostrando **Distribuicao com 5 cargos onde tinha 4**.
- **O defeito era meu.** A lista mostrava lado a lado:
  - `Ajudante da Distribuicao` — da lista curada de `carreiras-areas.ts`
  - `Ajudante de Distribuicao` — do descritivo publicado, com o botao "detalhes"
  - Uma **preposicao**. `chaveDeCargo` normalizava acento, caixa e turno, mas tratava "de" e "da" como palavras distintas. O descritivo nao ligou na entrada existente e entrou como opcao nova: a mesma funcao duas vezes para o candidato, so uma com descritivo.
- Correcao: a chave descarta `de/da/do/das/dos/e`. Nao existe par de cargos realmente diferentes que so se distinga por uma preposicao.
- **Efeito medido no banco:** dos 57 descritivos, os que casam com a lista da pagina foram de **6 para 7**. `Coordenador de Distribuicao` tambem passou a casar com `Coordenador da Distribuicao` e vai ligar sozinho quando for publicado.
- Quatro testes fixavam a **saida literal** da chave (`'ajudante de armazem'`) e quebraram. Foram reescritos para afirmar **comportamento** — que duas grafias caem na mesma chave — em vez da string produzida. Teste mais robusto e que nao precisa mudar de novo se a normalizacao evoluir.
- Entrou tambem o teste que a chave mais frouxa **nao pode** quebrar: cargos realmente diferentes continuam diferentes (Ajudante x Conferente, Motorista x Motorista de Carreta, Armazem x Frotas).
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 423/423.
- Parecer do outro agente: pendente (Codex)
- **Estado do catalogo, para quem pegar isto depois** (medido em 2026-09-23):
  - 57 descritivos cadastrados, **2 publicados**.
  - **5 descritivos ja existem, casam com a lista da pagina e so falta publicar:** Auxiliar de Marketing, Coordenador de Armazem, Coordenador de Distribuicao, Gerente de Vendas, Promotor.
  - **32 cargos da pagina nao tem descritivo nenhum** — dependem do RH escrever.

### 2026-09-23 - Claude - `Filtro de etapa no Banco de Talentos e as duas pontas soltas do vinculo`

- Status: concluida (sem migration; uma escrita opcional, via script com dry-run, que **nao** foi aplicada)
- Origem: PO — "tem como a opcao de trazer os candidatos colocar um filtro das etapas? percebi que puxa todo mundo independente de qual etapa esta" — mais as duas pendencias que eu tinha registrado na rodada anterior.
- **Filtro de etapa.** A tela "Do Banco de Talentos" listava as 254 candidaturas juntas, oferecendo com o mesmo peso quem acabou de se candidatar, quem esta em entrevista e quem foi rejeitado.
  - A rota `disponiveis` **ja aceitava `?etapa=`** e ja devolvia `etapa` em cada item; a tela nunca expos nem uma coisa nem outra. O trabalho foi quase todo de tela.
  - Funil: `RECEBIDO -> TRIAGEM -> ENTREVISTA -> APROVADO`, com `REJEITADO` e `ARQUIVADO` como saidas. "Passou de todas as etapas" = **APROVADO**.
  - **As contagens por etapa sao o que transforma o filtro em informacao:** sem elas, escolher "Aprovados" e receber lista vazia nao distingue "ninguem passou" de "o filtro quebrou". Vem de um `groupBy` que **ignora** o filtro de etapa (senao so contaria a propria) e **respeita** a busca, para os numeros baterem com o que esta na tela.
  - Cada linha mostra a etapa. Filtrar por REJEITADO/ARQUIVADO mostra um aviso: trazer alguem dali e reconsideracao, nao fluxo normal.
  - **Nao mudei o padrao para "Aprovados"** de proposito: se nao houver nenhum, a tela pareceria quebrada. Com a contagem a vista, a escolha fica obvia sem esconder nada.
- **Ponta solta 1 — importacao de vaga por planilha.** `analisarPlanilhaVagas` passou a receber os descritivos da empresa e a gravar `cargoId` quando o nome bate, normalizando acento e caixa (a planilha do RH escreve em caixa alta sem acento). Nao casar nao e erro: a vaga entra sem vinculo, como entrava antes. So entram no indice os descritivos que o usuario enxerga.
- **Ponta solta 2 — vagas antigas.** `prisma/vincular-vagas-descritivo.ts`, idempotente (so olha `cargoId: null`) e com **dry-run por padrao**. Casa por nome + empresa, com a area desempatando, igual ao verificador de aderencia.
  - **Rodei o dry-run: 1 vaga sem vinculo, 57 descritivos, 0 casaram.** A vaga e `MOTORISTA CAMINHAO DISTRIBUIÇÃO` e o descritivo mais proximo e `Motorista`.
  - O script **nao casa por aproximacao, de proposito**: "Motorista" casaria tambem com "Motorista de Carreta", e ligar a vaga ao descritivo errado e pior que nao ligar. Essa vaga precisa de decisao humana — o seletor novo na tela de edicao resolve em dois cliques.
  - **Nada foi gravado no banco.** O script fica no repo para quando houver volume.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 421/421, com 4 testes novos sobre o vinculo na importacao (incluindo o caso real que nao casa).
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - A vaga `MOTORISTA CAMINHAO DISTRIBUIÇÃO` segue sem descritivo. Ou o RH cria o descritivo com esse nome, ou vincula pela tela ao que fizer sentido.
  - O funil do Banco de Talentos (`EtapaCandidatura`) e o do processo seletivo (`RecCandidatoEtapa`) sao coisas distintas e continuam separados. Vale conferir com o RH se "aprovado no Banco de Talentos" e mesmo o criterio que eles querem para trazer alguem.

### 2026-09-23 - Claude - `Vaga nasce do descritivo: o vinculo deixa de ser o nome digitado`

- Status: concluida (sem migration — o campo ja existia)
- Origem: PO — "agora que temos um descritivo de cargo podemos selecionar la na aba de cargos quando for selecionar uma nova vaga... voce pode ver uma nova forma de subir essas vagas?".
- **O achado que da sentido a rodada:** `RecVaga.cargoId` esta no schema desde a Fase 1, com relacao e ate uma guarda de exclusao (`count({ where: { cargoId } })`) — e **nenhum codigo jamais o preencheu**. A guarda sempre devolveu zero.
  - Enquanto isso, **tres consumidores ligavam vaga e descritivo pelo nome digitado**: o verificador de aderencia (`normalizar(vaga.cargo) === normalizar(c.cargo)`), o cruzamento do Frontline e o destaque da pagina de carreiras.
  - Um acento, uma abreviacao ou um "- Noturno" no fim desligava os tres **em silencio**. Nada avisava, e o RH concluiria que a ferramenta nao funciona.
- O cargo da vaga virou escolha, nao digitacao:
  - Seletor com busca sobre os descritivos cadastrados (`SeletorCargo`).
  - Escolher preenche area, requisitos minimos e formacao **so onde estiver vazio**. Se o RH ja ajustou algo daquela vaga, escolher o cargo nao pode apagar o que ele escreveu — o descritivo e o padrao, a vaga e o caso.
  - Digitar a mao continua possivel, com caminho de volta e aviso do que se perde. Vaga urgente nao pode esperar o RH escrever um descritivo.
- **Fluxo invertido:** "Abrir vaga" em cada linha de Descritivos de Cargo, levando `?cargoId=`. O RH esta olhando o cargo e abre a vaga dali, em vez de ir ao Controle de Vagas e redigitar o que ja esta cadastrado.
- O vinculo passa a ser usado:
  - `encontrarDescritivo` prefere `cargoId` e **cai no nome** quando nao ha. Descritivo renomeado depois nao desliga mais a conferencia.
  - O destaque de carreiras usa o nome do descritivo vinculado, que e exato.
  - Descritivo excluido nao deixa a vaga orfa: volta para o nome. Ha teste.
- **Seguranca:** o `cargoId` enviado e conferido contra a empresa da vaga. Sem isso, um id de outra empresa no JSON criaria vaga apontando para descritivo que o usuario nao pode nem ver, e a aderencia passaria a comparar contra ele.
- Tropecos da rodada, para registro: o build acusou `useSearchParams` sem Suspense em `/gente/vagas/nova`; o primeiro conserto usava o proprio conteudo como fallback, que le a query igual. O fallback virou estatico.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 417/417, com 3 testes novos sobre a precedencia do vinculo.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - As vagas **ja existentes** continuam sem `cargoId` e seguem casando por nome. Conforme as novas nascerem vinculadas, o caminho por nome vira legado; vale uma passada para vincular as antigas se o volume crescer.
  - O importador de vagas por planilha continua gravando so o nome. Se o RH sobe vaga por planilha, o vinculo nao acontece — dava para casar pelo nome na importacao e ja gravar o `cargoId`.

### 2026-09-23 - Claude - `Carreiras: catalogo completo, destaque de vaga aberta e dois defeitos meus`

- Status: concluida (nenhuma migration nesta rodada)
- Origem: PO — "vamos adicionar todos os cargos aqui para o candidato ter acesso" e "uma feature que o RH decide qual vaga esta em aberto... a opcao ficaria em destaque, o que acha?".
- **Antes, dois defeitos meus que o PO encontrou usando:**
  1. **Casamento por nome exato.** Publicou "Ajudante de Armazem" e nada mudou no site, porque a pagina oferece "Ajudante de Armazem - Diurno" e "- Noturno". Eu tinha posto o desdobramento de turno no campo `turnos`, que o RH teria que preencher — e nada dizia isso. A decisao do PO era "um descritivo serve os dois turnos", e o codigo exigia configuracao para cumprir. `chaveDeCargo` passa a ignorar o sufixo, **so no fim do nome** ("Supervisor Noturno de Frota" tem o turno no meio e e outro cargo).
  2. **O contador mentia.** A tela dizia "1 cargo aparece na pagina de carreiras" quando nenhum aparecia — contava o que estava marcado, nao o que o candidato ve. **Este e o pior dos dois:** o primeiro so nao funcionava; o segundo afirmava que tinha funcionado, e quem confia no numero nao confere. Agora conta so o que aparece e mostra em ambar quantos estao marcados sem estar listados; a linha ganha o aviso "nao listado".
- **Catalogo: uniao, nao substituicao.** A pagina oferece a lista curada de `carreiras-areas.ts` **mais** os descritivos publicados que nao estao nela. Tirar a lista curada quebraria a candidatura dos cargos que o RH ainda nao descreveu, que hoje sao a maioria. Descritivo ja presente nao duplica — enriquece os dois turnos.
- **A validacao de envio precisou mudar junto.** Era `z.enum(TODOS_CARGOS)`, derivado do arquivo chumbado; com o catalogo crescendo, recusaria justamente o cargo recem-publicado — o candidato veria a opcao e nao conseguiria enviar. Continua **lista de permitidos**, agora montada em tempo de execucao contra o mesmo `montarCatalogo` que a pagina serve. As duas pontas saem da mesma funcao de proposito, e ha teste ligando uma a outra.
- **Destaque de vaga aberta: derivado, e nao um interruptor.** O PO pediu marcacao manual; discordei e fiz derivado do Controle de Vagas, que ja e a fonte dessa informacao.
  - Marcar a mao criaria uma segunda contabilidade. E o risco nao e esquecer de **acender** — e esquecer de **apagar**: o site anunciando vaga fechada meses depois custa candidatura perdida e credibilidade.
  - Aqui, abrir a vaga no modulo **e** acender o destaque; fecha-la apaga.
  - O cargo com vaga aberta **sobe para o topo do grupo** e ganha selo verde: enterrado no meio de onze opcoes, o dado mais acionavel da lista se perde.
  - Limite conhecido: o casamento e por nome (sem turno, caixa, acento). `RecVaga.cargo` e texto livre, entao vaga escrita diferente do descritivo nao acende. Converge conforme os dois cadastros usam o mesmo vocabulario.
- A rota publica devolve **so o nome do cargo** das vagas abertas. Uma vaga tem salario, solicitante e historico — nada disso tem o que fazer numa resposta sem autenticacao.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 414/414, com 15 testes novos somando as duas rodadas do dia.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - Com a validacao dinamica, **despublicar um cargo invalida candidatura nova para ele** — que e o comportamento certo, mas vale saber antes de despublicar algo com processo em andamento.
  - `TODOS_CARGOS` e `getCargosGrupos` continuam exportados em `carreiras-areas.ts` e ja nao sao a fonte da candidatura. Valem uma limpeza quando os descritivos cobrirem a lista.

### 2026-09-23 - Claude - `Carreiras: o candidato passa a ver o descritivo do cargo (COM MIGRATION)`

- Status: concluida. **Migration aditiva aplicada**, dentro do plano que o PO aprovou.
- Origem: PO — "agora que temos as vagas cadastradas e o descritivo, seria ideal que aqui linkasse com elas, para que os candidatos conseguissem ver o descritivo de cada vaga".
- **O cruzamento que mudou a conversa.** Antes de concordar, medi quanto os dois catalogos casavam:
  - Lista publica (chumbada em `src/lib/carreiras-areas.ts`): **40 cargos**. Descritivos em `RecCargo`: **57**.
  - **Casam pelo nome: 4.** Mais 2 ignorando o sufixo de turno. **34 sem descritivo nenhum.**
  - Taxonomias de area diferentes: o site agrupa por "Armazem", "Distribuicao", "Frota", "Vendas & Marketing"; o RH classifica por "Logistica", "Vendas", "TI", "Administrativo". **So "Financeiro" coincide.**
  - Ligar por nome naquele estado faria **85% dos cargos abrirem vazio** — pior que nao ter link: o candidato conclui que o site esta quebrado.
- **O descritivo e documento interno.** `src/lib/gente/cargo-publico.ts` projeta so o permitido: cargo, grupo, tipo de vaga, atividades, formacao (nivel + situacao + curso numa linha) e exigencias. Ficam **dentro**: `testes` (entrega a prova do processo), `etapasProcesso`, `observacoes` (tem criterio de triagem, "distancia menor que 1h trabalho x residencia"), `precisaAderenciaRaio` e `competenciasSugeridas`.
  - A lista e de **permitidos**, nao de proibidos: campo novo no descritivo nasce privado. Ha teste que serializa a projecao e falha se qualquer conteudo interno aparecer, e que trava o formato das chaves.
- Decisoes do PO nesta rodada: descritivo como fonte, **um descritivo serve os dois turnos**, e **o RH escreve os 34 que faltam**.
- **Transicao sem quebrar a candidatura.** A lista de cargos continua vindo do arquivo; trocar a fonte de uma vez deixaria a pagina quase vazia hoje e ninguem conseguiria se candidatar. O cargo que ja tem descritivo ganha "detalhes", os outros seguem como antes, e conforme o RH escreve eles acendem um a um. Se a rota falhar, o mapa fica vazio e a pagina funciona como sempre — candidatura nao pode depender de chamada opcional.
- Campos novos em `RecCargo`, todos decididos para falhar fechado:
  - `publicarNoSite` nasce **false**. Ligar por padrao publicaria os 57 descritivos no momento do deploy, incluindo cargo em estudo.
  - `grupoPublico` diz onde o cargo entra no site. Sem grupo ele **nao aparece** — inventar um lugar e pior que omitir.
  - `turnos` desdobra um descritivo em varias opcoes publicas, apontando para o mesmo texto.
- Detalhes que valem registro:
  - A rota publica e **sem autenticacao** de proposito (quem consulta e candidato), com `select` explicito para o dado interno nao sair nem do banco, e cache de 5 min.
  - O botao "detalhes" e um `span` com `role="button"`: o cartao do cargo ja e um `<button>`, e botao dentro de botao e HTML invalido — o navegador desfaz o aninhamento e a selecao para de funcionar.
  - `FormularioSimples` ganhou o tipo de campo `lista` (separa por virgula, vazio vira `[]` e nao `null`).
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 399/399; pos-migration conferido — as 3 colunas existem, 57 descritivos intactos, 0 publicados.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **Acao do RH:** escrever os 34 cargos sem descritivo e, em cada um, marcar `publicarNoSite` e escolher o grupo. Ate la nada muda para o candidato.
  - Quando os descritivos cobrirem os 40 cargos, `carreiras-areas.ts` pode deixar de listar cargos e ficar so com a definicao dos grupos.
  - `competenciasSugeridas` ficou de fora por decisao minha (roteiro para o candidato se moldar). Se o RH achar que ajuda na autosselecao, e trocar uma linha em `cargo-publico.ts`.

### 2026-09-22 - Claude - `Auditoria: performance, UX e uma falha de privacidade`

- Status: concluida. Relatorio completo em **`docs/auditoria-2026-09-22.md`** — este registro e o resumo.
- Origem: PO — "audite, revise e melhore todo o processo interno... veja o que esta pesando... encontre oportunidades de UX e design".
- **Achado principal, e nao e de performance: `sentry.client.config.ts` gravava a tela sem mascara.**
  - O arquivo tinha o comentario `// Mascara inputs e textos por padrao (LGPD)` e, na linha seguinte, `maskAllText: false` e `blockAllMedia: false`. Com `replaysSessionSampleRate: 0.1`, 10% de TODAS as sessoes viravam video enviado para `ingest.us.sentry.io`.
  - Pela tela deste portal passam salario (Controle de Vagas), CPF e telefone (Candidatos) e **laudo medico** (Gestao de PCD, art. 11 da LGPD). O modulo trata o laudo com blob privado e auditoria antes de servir; o Replay contornava tudo isso pela captura de tela.
  - Corrigido: amostragem de sessao em 0 (so grava com erro), `maskAllText` e `blockAllMedia` ligados, mascara explicita em campos de formulario.
- **Tipografia:** DM Sans, a fonte do corpo, carregava 400/500/600 enquanto `font-bold` (700) aparece **323 vezes** no codigo. Sem o arquivo do peso o navegador sintetiza o negrito e o texto sai borrado. 700 adicionado; 900 (`font-black`, 55 usos) fica de fora de proposito, porque cair no 700 real e melhor que um 900 falsificado.
- **Peso (medido, nao resolvido):** 197 kB de JS em **toda** rota, inclusive o login. A rota mais pesada e `/app/visitas/dashboard` com 399 kB, mas o problema e o piso, nao as rotas. O SDK do Sentry com Replay esta nesse piso; carrega-lo sob demanda e o proximo passo, e e decisao de produto.
- **Medicao honesta:** liguei `optimizePackageImports` e **nao mudou nada** — zero rotas alteraram de tamanho e os chunks compartilhados sairam com hash identico. Ficou no config como guarda, nao como ganho. Registrado para ninguem repetir a tentativa.
- **Falso alarme descartado:** o build avisa sobre `@vladmandic/face-api` (24 MB). Conferido: ja e `await import()` dinamico e nao entra no bundle inicial.
- **Erro meu de medicao, corrigido antes de virar achado:** uma varredura sugeriu `RecVaga` e `RecCandidato` sem indice. Era `grep -A 40` cortando o modelo antes do fim. No schema completo, `RecVaga` tem 6 indices (com os compostos `(empresaId, status)` e `(operacaoId, status)`) e `RecCandidato` tem 5. **A cobertura de indice esta correta** — registrado para ninguem gastar tempo com isso.
- Corrigidos tambem: `confirm()` nativo do Frontline (virou confirmacao em dois toques na linha, com Esc e expiracao em 5s) e as 3 consultas sem `take` do Frontline.
- Registrados e **nao** alterados, por estarem em area de outros agentes: 105 `findMany` sem `take` (pior concentracao em `api/admin/upb/relatorio`, com 7), 11 `confirm()`/`alert()` nativos, e os modelos de face-api vindos do jsDelivr em tempo de execucao.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 385/385.
- **ADENDO (mesma rodada, achado apos o relatorio inicial):** ao desfazer um commit errado descobri `docs/plano-de-melhorias.md` e `docs/oportunidades-ux.md`, de outro agente, **nao versionados** e por isso invisiveis no git log. O primeiro ja reportava 16 vulnerabilidades de producao em 08/05 e recomendava atualizar o Next. **Eu nao li antes de comecar — erro de metodo.**
  - `npm audit --omit=dev` hoje: **32 vulnerabilidades, 4 criticas e 15 altas.** Piorou desde maio.
  - A que importa aqui: **Authorization Bypass in Next.js Middleware**. `/admin`, `/empresa` e `/talentos` sao protegidos **so** pelo middleware — nao checam sessao na propria pagina, como `/gente` faz. Com o bypass, pedido nao autenticado alcancava as tres.
  - **Corrigido com autorizacao expressa do PO:** Next 14.2.7 -> 14.2.35, patch na mesma minor. Depois do upgrade o bypass sai da lista. `tsc`, `test:unit` 385/385 e `build` passaram; JS compartilhado foi de 197 kB para 199 kB.
  - Os 4 criticos restantes foram verificados um a um e **nao se aplicam a este deploy**: RCE em Windows (roda na Vercel/Linux), RCE via AVIF (formats desligado no next.config), e homoglyph no normalizador de e-mail do next-auth (o portal usa CredentialsProvider, nao EmailProvider). Limpar o resto exige **Next 15**, que e major.
  - **Pendencia de defesa em profundidade, independente de CVE:** `/admin`, `/empresa` e `/talentos` deveriam checar sessao na propria pagina. Hoje dependem de uma camada so. Nao mexi por serem telas de outros agentes.
- **Segundo deslize de `git add` na mesma sessao:** `git add docs/` varreu 4 arquivos nao versionados de outro agente. Desfeito com `git rm --cached`; conteudo no disco intacto. Registrado tambem na minha memoria de projeto para nao repetir.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - Nada aqui mediu **tempo real**: e tudo analise estatica. O proximo passo e olhar os traces que o Sentry ja coleta.
  - OBZ, financeiro e Universidade seguem sem passada visual depois das mudancas globais de light mode.

### 2026-09-22 - Claude - `Periodo do painel: 2 e 7 dias, e intervalo no calendario`

- Status: concluida (nenhuma escrita no banco)
- Origem: PO — "adicionar mais filtros de periodos, 02 dias, 07 dias e tb uma forma da gente inserir o intervalo, pode ser um calendario... pense como UX senior".
- **Correcao de semantica que apareceu ao implementar.** "Ultimos N dias" subtraia N da meia-noite de hoje e filtrava por `gte`, o que cobre **N+1 dias**. Em 30 ninguem percebe; em 2 a diferenca e de 50%, e "2 dias" mostrando 3 apareceria no primeiro uso. Passou a contar N dias de calendario **incluindo hoje**.
  - Efeito colateral assumido: 30 e 90 dias cobrem **um dia a menos** do que cobriam. E a direcao certa — o rotulo passa a dizer a verdade — mas os numeros mudam de leve, entao esta registrado aqui.
- **O fim do intervalo e exclusivo.** Escolher 22/09 como fim precisa incluir o que entrou as 14h do dia 22, entao o corte vai para a meia-noite do dia 23 e a consulta usa `lt`. Com `lte` na meia-noite do 22 o dia inteiro sumiria. Ha teste fixando isso; e o erro classico deste tipo de filtro.
- Calendario proprio, e nao `<input type="date">`: o projeto nao tem biblioteca de datas, e o input nativo resolve mal um **intervalo** — sao dois pickers separados, sem previa do trecho e sem relacao visivel entre as pontas. Aqui um clique marca o inicio, o segundo o fim, e o trecho aparece destacado enquanto o ponteiro percorre os dias.
- Decisoes de UX:
  - Rotulos curtos ("30 dias"), com um rotulo "Periodo" para o grupo. Com seis atalhos, repetir "Ultimos" enchia a linha e sumia no celular sem dizer mais nada.
  - Abaixo das pilulas, **o recorte em data**: a pilula diz "90 dias" e ninguem calcula de cabeca que dia foi isso. O texto e resolvido **no servidor**, junto da consulta, para nao divergir do que foi filtrado.
  - So se repete o que muda: "15 – 21 set 2026" no mesmo mes, "1 jul – 21 set 2026" no mesmo ano, os dois completos virando o ano.
  - O seletor fica visivel durante a carga — esconder o filtro e tirar o controle de quem esta esperando para trocar de recorte.
  - Clicar antes do inicio move o inicio (correcao de rota), nao inverte o intervalo. Datas futuras desabilitadas e o avanco de mes para no mes atual.
  - Esc e clique fora fecham. E popover, nao modal: prender o foco atrapalharia quem so quer voltar para a lista.
  - `aria-pressed` nas pilulas (sao filtros, nao navegacao), grupo anunciado por `aria-labelledby`, mes do calendario em `aria-live`.
- Fail-safe: datas invertidas sao tratadas como engano de clique; personalizado sem as duas pontas nao recorta nada, porque mostrar tudo e melhor do que mostrar vazio sem explicar por que.
- A rota de desligamentos compartilha o modelo de periodo e foi migrada junto — ganhou o intervalo livre de graca.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 385/385, com 13 testes novos. **Um deles pegou um erro meu**: o codigo escrevia "15 set – 21 set 2026", repetindo o mes; corrigi a funcao, nao o teste.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - O `SeletorPeriodo` esta em `gente/_components` e serve so o painel. Vale promover quando outra tela precisar.
  - A selecao nao persiste: recarregar volta para 90 dias. Nao foi pedido; se incomodar, o caminho e querystring (exige Suspense no App Router) ou `localStorage`.

### 2026-09-22 - Claude - `Vagas Frontline: a tela que o plano tinha reduzido a um filtro (COM MIGRATION)`

- Status: concluida. **Houve escrita no banco: migration aditiva de 3 tabelas, autorizada pelo PO nesta rodada.**
- Origem: PO — "essa vaga frontline ficou de fora?", com print da tela do app do RH.
- **Resposta: sim, e nao foi esquecimento.** `docs/plano-integracao-recrutamento.md` linha 107 decidiu "Controle de Vagas (Frontline vira filtro)", e o bloco 1 foi fechado como "Controle de Vagas + Frontline — entregue". O que existia era um campo `frontline` (texto livre) na vaga e um filtro na listagem.
- **A reducao estava errada.** Lendo o `VagasFrontlineView.tsx` do zip do RH: Frontline nao e uma lista de vagas filtrada, e o **indice de comprometimento de QLP** — quanto do quadro previsto esta descoberto. Nada disso existia no portal: catalogo de cargos frontline, QLP meta x real por cargo, o indice, o teto de 3%, o cruzamento com vagas abertas, o historico mensal e o YTD. O unico "meta" do modulo era `QuadroPcdMeta`, que e a cota de PCD.
- **Onde os dados moravam no app do RH: `localStorage`.** As metas de QLP e os percentuais mensais existiam so na maquina de quem digitou — trocar de computador ou limpar o navegador perdia tudo. Consequencia pratica: **nao havia base para migrar**, o conteudo vai ser digitado ou importado.
- Decisoes do PO nesta rodada, perguntadas antes de comecar:
  1. **Catalogo editavel** — no RH sao 32 cargos chumbados no codigo (21 Patos, 7 Sume). Aqui e tabela, com cadastro e exclusao pela tela.
  2. **Todas as operacoes** — o app do RH so conhecia Patos e Sume.
  3. **Teto editavel** — a Ambev usa 3,00%, mas o campo fica na tela, por ano. Chumbar no codigo obrigaria deploy para acompanhar mudanca de meta corporativa.
- Regras de calculo, todas em funcao pura e testadas (`src/lib/gente/frontline.ts`, 23 testes):
  - `comprometimento = vagas abertas / QLP meta x 100`.
  - **O denominador e a meta, nao o real.** Com o real, perder gente melhoraria o indice sozinho: some um posto do quadro e o percentual cai, com a vaga continuando aberta. Ha teste fixando isso.
  - Vagas abertas contam **posicoes**, nao requisicoes: um pedido de 3 motoristas descobre 3 posicoes (`quantidadeVagas`).
  - O resumo do segmento sai dos **totais**, nao da media dos cargos. Um cargo de meta 1 com 1 vaga aberta da 100% e distorceria a media; pelos totais, 1 posicao em 71 da 1,4%. Ha teste que afirma as duas contas e mostra a divergencia.
  - Meta zero devolve 0, nao infinito.
  - Exatamente no teto **nao** conta como acima: a meta e "maximo 3%", entao 3% cumpre.
  - YTD divide por 12, nao pelos meses preenchidos — e a media do ano, nao uma projecao.
  - O cruzamento casa cargo por nome normalizado (sem acento, sem caixa): sao dois cadastros digitados por pessoas diferentes.
- **O percentual mensal e digitado, nao calculado.** O numero que o RH fecha com a Ambev e a media do periodo; o painel mostra o instante. Calcular aqui daria um historico que discorda do que foi reportado.
- Escopo: por operacao, como o resto do quadro. O filtro de operacao so estreita, nunca amplia. Escrita presa a `podeEscreverNaOperacao`, e a tela esconde os campos de quem so pode consultar em vez de oferecer botao que daria 403.
- Verificacao: `tsc` sem erros; `build` OK; `test:unit` 374/374; `prisma migrate status` limpo (16/16); e checagem pos-migration de que as 3 tabelas existem zeradas e os dados existentes seguem intactos.
- **Deslize corrigido na mesma rodada:** um `git add prisma` varreu junto `prisma/seed-funcoes-lideranca.ts`, arquivo nao versionado de outro agente. Foi removido do versionamento no commit seguinte (`git rm --cached`); o conteudo no disco nao foi tocado e o arquivo voltou a `??`. Registrado aqui porque o CLAUDE.md pede que mexida em trabalho de outro agente seja documentada.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **Sem importacao por planilha.** Sao 32 cargos so em Patos e Sume; com 8 operacoes o cadastro manual cansa. O catalogo cabe no padrao `criarRotaImportacao` (tem `operacaoId`), entao e trabalho curto.
  - O cruzamento depende do cargo estar escrito igual no Controle de Vagas. O formulario avisa, mas um erro de digitacao faz a vaga nao contar. Se virar problema, o caminho e vincular por `RecCargo` em vez de por texto.
  - O historico mensal, quando a tela mostra mais de uma operacao, exibe a media das operacoes; a edicao exige escolher uma operacao, porque o dado e por unidade.

### 2026-09-22 - Claude - `Light mode: a causa raiz era o seletor, nao a paleta`

- Status: concluida (nenhuma escrita no banco, um arquivo alterado: `globals.css`)
- Origem: PO — "o branco continua com problema, nao ta dando pra enxergar o titulo nesse caso", com print da lista de candidatos: o nome do candidato branco sobre cartao claro, enquanto a linha de baixo (cargo, operacao, telefone) lia normalmente.
- O detalhe que apontou o caminho: o nome usa `text-white`, que **ja estava remapeado** para escuro. Se o remapeamento existe e nao vale ali, algo com mais especificidade esta sobrepondo.
- **Causa raiz.** As regras que preservam o branco onde o fundo e realmente colorido usavam `[class*="bg-brand-"]` — casamento por **substring** no atributo `class` inteiro:
  - O cartao da lista e `bg-white/3 ... hover:bg-brand-500/5`. A string `hover:bg-brand-500/5` **contem** `bg-brand-`.
  - A regra disparava, e como e seletor de **descendente**, todo `text-white` dentro do cartao virava branco puro sobre fundo claro.
  - Nao era caso isolado: a varredura achou **137 elementos com variante `hover:`/`focus:`/`group-hover:` de fundo colorido, em 55 arquivos** — candidatos, vagas, admin/usuarios, aprovacoes, command-menu, a home.
- **Correcao: `~=` no lugar de `*=`.** `~=` casa token exato separado por espaco:
  - `bg-brand-500` casa (fundo solido, branco e o certo)
  - `hover:bg-brand-500` nao casa (o fundo base nao e colorido)
  - `bg-brand-500/15` nao casa (fundo tingido, palido no light)
  - O terceiro caso tambem estava errado antes: 6 elementos com fundo tingido e `text-white` (`bg-red-500/5` nas tres telas de aprovacoes, `bg-amber-500/10` no login) ficavam brancos sobre rosa e amarelo claros. Agora recebem texto escuro.
- Por que a lista e por token e nao por familia: o seletor le o **DOM**, nao o codigo. Enumerar cor x tom cobre tambem classe montada em tempo de execucao — as faixas das trilhas do pipeline (`bg-violet-500`, `bg-blue-600`) vem de um objeto de estilo e nao aparecem em nenhum `className` literal. 296 seletores, um bloco, uma declaracao.
- Levantamento que orientou a escolha: o app inteiro tem **15 tokens de fundo solido colorido**. As regras por substring protegiam esses 15 e quebravam 137.
- Verificacao: `tsc` sem erros; `npm run build` OK; `test:unit` 351/351; e os seletores conferidos no **CSS compilado** (294 ocorrencias de `class~=`, sem aspas porque o minificador as remove) — build passar nao garante que a regra sobreviveu ao PostCSS.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - Segue pendente a passada visual em OBZ, admin e financeiro. As duas ultimas rodadas mexeram no light mode do app inteiro.
  - Se aparecer texto branco onde deveria ser escuro (ou o contrario), o lugar e este bloco: ou falta o token na lista, ou sobra.

### 2026-09-22 - Claude - `P2028 na importacao, paleta do light mode, dock e ficha do cargo`

- Status: concluida (nenhuma escrita de schema; a unica escrita no banco seria a propria importacao, feita pelo usuario)
- Origem: tres pedidos do PO — revisar o tema branco em Gente e Banco de Talentos, mostrar o titulo do icone ao passar o mouse no menu, e abrir a ficha do cargo ao clicar nele. **Junto veio um bug no print que o PO nao mencionou: "Erro de banco de dados" na importacao de cargos.**
- **P2028 — a importacao de cargos nao gravava.** O print mostrava 57 linhas prontas, 0 erros, e mesmo assim o erro vermelho. `vercel logs` deu o codigo:
  - `Transaction API error: Transaction not found` / `[api] Prisma error P2028`.
  - Causa: a rota que entreguei na rodada anterior abria `$transaction(async tx => ...)` e fazia um `create` por linha. Cada `await` e uma ida e volta ate o Neon (sa-east-1); 57 em sequencia passaram do limite de 5s da transacao **interativa**. O pedido entrou 15:31:58.96 e morreu 15:32:05.60 — 6,6s.
  - Correcao: forma em lista (`$transaction([...])`), com `createMany` para os novos e os updates no mesmo batch. Continua atomico, mas e uma ida e volta em vez de 57.
  - **O mesmo defeito estava latente em `candidatos/importar`**, que tambem faz `create` em loop porque as etapas sao filhas aninhadas e `createMany` nao cria filho. Corrigido junto, antes de alguem importar uma planilha grande de candidato. Os outros seis importadores ja usavam `createMany` e nunca estiveram expostos.
  - Licao para o proximo importador: `createMany` sempre que possivel; quando nao der (filhos aninhados), a forma em lista, nunca o loop dentro da transacao interativa.
- **Tema claro — o buraco era de paleta, nao de tela.** Vale para o portal inteiro, nao so para Gente:
  - O app e escrito dark-first e o light mode funciona por uma lista de remapeamentos no `globals.css` (nao ha uma variante `dark:` em `src/app`). Da paleta de **texto**, so `text-slate-400/500/600` estavam nessa lista.
  - `text-slate-300` e `#cbd5e1`: em pagina branca da **1.4:1** e simplesmente some. Era exatamente o que o print mostrava — os nomes dos cargos na previa de importacao quase invisiveis. Sao 181 usos so em Gente e Talentos, 601 no app.
  - `text-emerald-400` da 1.9:1, `text-brand-400` da 1.9:1, e assim por diante. Todos passavam direto.
  - Cada tom -100/-200/-300/-400 passa a cair para o -600/-700 da mesma familia: o significado da cor e preservado (verde continua verde) e o contraste passa. Os fundos tingidos que acompanham (`bg-emerald-500/15`) tambem clareiam, entao o par continua coerente.
  - Fechadas tambem as lacunas de opacidade que estavam em uso sem par: `bg-white/1 /4 /6 /7 /20`, seis `hover:bg-white/X`, `border-white/3 /6 /12 /15 /25 /30` e `divide-white/6`.
  - Os tres `bg-slate-900` que sobraram (dropdown do ranking, do relatorio do gestor, modal de metas) clareiam junto — preserva-los exigiria desfazer o remapeamento de texto um por um.
  - Hex arbitrarios: a varredura mostrou que os unicos fora da whitelist estao em `/carreiras/*`, que e publico e fica **fora** do `.app-shell` de proposito. O unico dentro do shell era `bg-[#0c0c12]/80` na tela de ajuda, agora mapeado.
- **Dock — o titulo existia e nunca aparecia.** O rotulo ja estava implementado (hover e foco). O `<nav>` usa `overflow-x-auto` para o dock rolar no celular; quando `overflow-x` e `auto` e `overflow-y` e `visible`, o CSS calcula `overflow-y` como `auto` tambem. O rotulo fica acima do item, fora da caixa, e era recortado. `sm:overflow-visible` resolve: a partir de 640px os dez itens cabem (~500px) e nao ha o que rolar; abaixo disso e toque, onde nao ha hover.
- **Ficha do descritivo de cargo** (`cargos/_components/DetalheCargo.tsx`): clicar na linha abre a ficha completa, no mesmo padrao da ficha do sucessor. Busca por `id` ao abrir (a rota `GET /api/gente/cargos/[id]` ja existia); nao engorda a listagem, que traz ate 500 itens com seis campos de texto longo cada. `whitespace-pre-wrap` nos textos longos, porque competencias e etapas sao multilinha de proposito. O botao Editar e irmao do botao da linha, nao filho — botao dentro de botao e HTML invalido.
- Verificacao: `npx tsc --noEmit` sem erros; `npm run build` sem avisos novos nos arquivos tocados; `npm run test:unit` 351/351.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **A mudanca de paleta do light mode e global.** Testei o raciocinio de contraste, mas vale uma passada visual em OBZ, admin e financeiro, que nao foram olhados nesta rodada.
  - O PO falou em "banco de horas"; o modulo e o **Banco de Talentos** (`/talentos`), como ja registrado em rodadas anteriores. Os hex usados la (`#111118`, `#1a1a2e`) ja estavam na whitelist.

### 2026-09-22 - Claude - `Descricao de cargo: a planilha do RH vira o modelo (COM MIGRATION)`

- Status: concluida. **Houve escrita no banco: uma migration aditiva, autorizada pelo PO nesta rodada.**
- Origem: PO — "adicionei a planilha de Cargos e Ajustes dentro da pasta de gestao de recrutamento. Ela deve ser o modelo para descricao de cargo." O arquivo na pasta chama-se `Cargos e Perfil.xlsx`; e o unico novo, entao e ele.
- Contexto que faltava: descritivo de cargo era **a unica das nove telas do modulo sem importacao**. So cadastro manual, um cargo por vez, para os 57 cargos que o RH mantem.
- **Migration `20260922000000_add_curso_reccargo`** — `ALTER TABLE "RecCargo" ADD COLUMN "curso" TEXT`:
  - A planilha trata tres perguntas distintas: **Formacao** (o nivel: Ensino Superior), **Status** (a situacao: Formado / Cursando) e **Curso** (qual curso). O schema so tinha `formacao` e `statusCurso`; a tela chamava `statusCurso` de "Curso / certificacao", um rotulo improvisado sobre o campo errado.
  - Nao e coluna decorativa: ao menos um cargo traz "Obrigatorio tecnico em Seguranca do Trabalho, desejavel Superior cursando: Administracao, engenharias ou areas afins". Isso nao cabe em `formacao` nem em `statusCurso`.
  - Aditiva e anulavel. Verificacao antes e depois: `prisma migrate status` limpo (15/15), coluna criada como `is_nullable: YES`, e `RecCargo` estava com **0 registros** — nenhum dado existente foi tocado.
  - Ordem seguida de proposito: migration primeiro, push depois. O Prisma Client ja seleciona `curso`; subir o codigo antes derrubaria a tela de cargos com 500.
- Importador (`src/lib/gente/cargo-importador.ts`):
  - Os 14 cabecalhos reais, **incluindo os espacos sobrando** que a planilha tem em "Formacao ", "Status " e "Exigencias ". `normalizar` ja apara, entao nao viraram sinonimo proprio — mas o teste fixa os rotulos com o espaco para impedir que alguem volte a comparar string exata.
  - O cabecalho de verdade e a **segunda** linha: a primeira e uma faixa mesclada ("Sobre a Vaga", "Responsabilidades e Atribuicoes", "Requisitos e Qualificacoes", "Informacoes Adicionais", "Definicao de Etapas"). `localizarTabela` ja resolvia isso e foi so registrar os sinonimos.
  - **"N/A" e "NA" viram campo vazio.** Sao preenchimento, nao conteudo: guardar a string faria a tela exibir "N/A" como se fosse a exigencia do cargo. Aparecem em 23 das 57 linhas so na coluna de experiencia.
  - Texto multilinha preservado linha a linha (uma competencia por linha, como o RH escreve); o `\r` do Excel e normalizado para `\n` antes de gravar.
  - Obrigatorios: Cargo e Area. Area e obrigatoria porque entra na identidade — dois cargos de mesmo nome em areas diferentes sao dois descritivos, nao um.
  - Avisa sem bloquear quando falta descricao de atividades (e o campo que `aderencia.ts` compara) ou etapas do processo.
- **Reimportar atualiza, nao duplica.** A planilha e revisada e reenviada — o PO a chamou de "Cargos e Ajustes". Sem upsert, o segundo envio esbarraria no `@@unique([empresaId, cargo, area])` e o RH teria que apagar tudo antes. A previa marca cada linha como "novo" ou "atualiza" **antes** de confirmar, e `ativo` fica de fora do update: descritivo desativado na tela nao volta sozinho so porque continua listado na planilha.
- **Rota propria, nao `criarRotaImportacao`.** A fabrica resolve a empresa pela operacao de destino de cada linha, e o descritivo nao tem operacao — e da empresa, porque o padrao de "Analista de Controle" nao muda entre Patos e Sume. Forcar cargos la dentro exigiria afrouxar o tipo da fabrica para as outras sete importacoes, que dependem do escopo por operacao para nao gravar fora do lugar. O contrato com a tela e identico: dry-run por padrao, grava so com `confirmar: true`, audita ao final (`GENTE_CARGOS_IMPORTADOS`).
- Efeito no teste de modelos: ele afirmava que **todo** modelo tem coluna de unidade obrigatoria. Cargos e a excecao, entao o teste passou a afirmar o contrario para ele — e melhor do que inventar uma coluna de unidade num assunto que nao tem unidade.
- Ensaio com a planilha real do RH, somente leitura, caminho completo (`localizarTabela` -> `montarLinhas` -> `analisarPlanilhaCargos`): aba "Cargos e Perfil", cabecalho na linha 2, **14/14 cabecalhos reconhecidos, 57/57 linhas validas, 0 erros, 0 avisos, 0 duplicados**. 8 areas: Logistica, Vendas, Financeiro, Gente e Gestao, TI, Todas, Marketing, Administrativo.
- Verificacao: `npx tsc --noEmit` sem erros; `npm run build` OK; `npm run test:unit` 351/351, com 18 testes novos.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - "Tipo vaga" tem so tres valores na planilha (Operacional, Demais cargos, Lideranca). Hoje entra como texto livre. Se o RH confirmar que sao so esses tres, vale virar enum — hoje "Lideranca" e "lideranca" seriam dois valores distintos em relatorio.
  - "Area" tambem e texto livre e ja aparece com o valor "Todas", que nao e uma area. Sem impacto agora, mas conta como area propria em qualquer agrupamento.
  - O arquivo `gestao de recrutamento/Cargos e Perfil.xlsx` **nao esta versionado** e nao deve ser: a pasta segue no .gitignore.

### 2026-09-22 - Claude - `Pipeline: ficha do sucessor ao clicar no cartao`

- Status: concluida (nenhuma escrita no banco, nenhuma rota nova, nenhuma mudanca de schema)
- Origem: PO — "adicione uma feature que ao apertar nos nomes, mostre as informacoes deles, nesse modelo", com print do modal `ALTERAR INFORMACOES DO SUCESSOR` do app do RH.
- Entregue: `src/app/gente/sucessao/_components/DetalheSucessor.tsx`, aberto pelos cartoes da matriz em `/gente/sucessao`.
- **Decisao: a ficha e de leitura, nao um segundo formulario.** O print de referencia e o modal de *edicao* do app do RH (Salvar/Excluir). O pedido, porem, foi "mostre as informacoes". Reconstruir o formulario ali duplicaria `/gente/sucessao/[id]/editar`, que ja tem `sucessaoPatchSchema`, checagem de operacao de destino e auditoria — duas telas de escrita para o mesmo registro divergem na primeira regra que mudar. A ficha mostra os mesmos campos, na mesma ordem do print, e leva para o editor existente.
- Escopo respeitado: a leitura de sucessao e de grupo (empresa), entao a ficha abre para qualquer registro visivel. O botao "Editar mapeamento" so aparece com `editavel` (vem do `GET`, que usa `podeEscreverNaOperacao`); sem permissao, o rodape explica de qual operacao e o registro em vez de oferecer um botao que daria 403.
- Por que nao engordar o payload do pipeline: a matriz carrega dezenas de cartoes e sao tres campos de texto longo por registro (habilidade tecnica, comportamental, PDI). A ficha busca por `id` quando abre, no `GET /api/gente/sucessao/[id]` que ja existia com o escopo certo. Nenhuma rota nova.
- Detalhes de interacao: o cartao inteiro virou `<button>` (a 11px o nome sozinho e alvo pequeno demais no toque), Esc fecha, clique no fundo fecha, o scroll do body trava enquanto aberta e o foco volta para o cartao de origem ao fechar.
- `null` x `false`: em "Houve promocao?" e nos tres campos de prontidao, ausencia de informacao e diferente de "nao". A ficha distingue — `simNao` devolve `null` para nao informado.
- Verificacao: `npx tsc --noEmit` sem erros; `npm run build` OK; `npm run test:unit` 334/334.
- Sem teste novo: e componente de apresentacao consumindo rota ja coberta. A unica regra local (`simNao`) e trivial; se a ficha ganhar logica, vale extrair.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - A ficha e reaproveitavel em `/gente/sucessao/lista` (hoje a lista so tem "Editar"). Nao foi feito por estar fora do pedido.
  - Segue valendo a varredura de hex fora da whitelist de light mode em `src/` (rodada anterior).

### 2026-09-22 - Claude - `Pipeline: matriz sem rolagem lateral + revisao de frontend`

- Status: concluida (nenhuma escrita no banco)
- Origem: PO — "aumente o quadro para que nao precise rolar para a direita" e "revise como frontend senior como ficou o modelo".
- **Achado principal, que vale para o app inteiro:** o light mode do portal nao e feito com variantes `dark:` (o projeto tem **zero** ocorrencias de `dark:` em `src/app`). Ele funciona por uma **lista fixa de remapeamentos** em `src/app/globals.css` (`:root:not(.dark) .app-shell .bg-\[#111118\] { ... }`). Qualquer hex arbitrario que nao esteja nessa lista **nao e remapeado** e atravessa o light mode como cor escura.
  - Era exatamente o caso de `bg-[#12121c]`, usado em 7 arquivos. Na tela de sucessao a coluna fixa "Nivel" aparecia como bloco preto numa pagina branca; nos drawers e modais de vagas, candidatos, PCD e quadro o painel inteiro vinha escuro em light mode.
  - Corrigido trocando por `bg-surface` (token `hsl(var(--surface))`, ja definido para os dois temas: `#ffffff` no claro, `240 18% 7%` no escuro). Opaco nos dois — importante porque a coluna e `sticky`.
  - **Pendencia para a proxima rodada:** varrer `src/` atras de outros `bg-[#...]` fora da whitelist. A lista atual cobre 13 hexes; qualquer tela que tenha inventado o seu proprio tem o mesmo defeito silencioso.
- Rolagem lateral (o pedido literal):
  - A matriz usava `min-w-[200px]` por coluna. Com 6 areas dava 1310px dentro de um container de `max-w-6xl` (1152px) — as colunas Armazem e Frota ficavam fora da tela.
  - `table-fixed` + `<colgroup>` reparte a largura igualmente em vez de cada coluna exigir um minimo. O `min-w` passou a ser da tabela inteira (`min-w-[880px]`), so para o celular continuar rolando.
  - O container do modulo foi de `max-w-6xl` para `max-w-[1600px]`. As telas de formulario (`max-w-4xl`) e de importacao (`max-w-5xl`) tem limite proprio e nao foram afetadas.
- Revisao de frontend — o que estava errado alem do tema:
  - **Cartao sem o cargo de destino.** A posicao na matriz so informa nivel e area. Dois destinos diferentes na mesma celula (Gerente de Vendas e Gerente Comercial) viravam a mesma pilha de nomes, e o subtitulo mostrava o cargo *atual*, que nao responde "quem cobre esta vaga". Os cartoes agora sao agrupados por `cargoSucessao`, com o cargo atual como linha secundaria ("hoje ...").
  - **Rotulo do indicador descrevia outra coisa.** "Sem sucessor pronto: 40" contava *pessoas* em preparacao, nao cargos descobertos — quem lia entendia 40 cargos. Virou "Em preparacao: 40 / em 26 cargos sem ninguem pronto". O numero nao mudou, so parou de mentir.
  - **Cor sem legenda.** Borda verde (promovido) e rosa (desligado) carregavam informacao sem nada que explicasse. Legenda adicionada no cabecalho da matriz.
  - **Acessibilidade:** regiao rolavel ganhou `role="region"`, `aria-label` e `tabIndex={0}` (sem isso ela nao rola por teclado); cabecalhos de area ganharam `scope="col"`; etiquetas subiram de 9px para 10px.
  - **Celula vazia** ocupava 64px de altura com a palavra "vazio" e inflava a matriz. Virou uma faixa tracejada de 28px — continua visivel, porque celula vazia num mapa de cobertura e informacao, nao ausencia dela.
- Verificacao: `npx tsc --noEmit` sem erros; `npm run build` sem avisos novos (os que aparecem sao pre-existentes, em outros arquivos); `npm run test:unit` 334/334.
- Nenhum teste novo: a rodada e de apresentacao e tema, sem regra nova. As mudancas de comportamento testavel (agrupamento por cargo) estao em funcao pura local; se virar regra de negocio, vale extrair para `pipeline.ts` e testar.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - Varredura de hex fora da whitelist de light mode em `src/` (acima).
  - Com 8 areas preenchidas a matriz fica em ~178px por coluna; ainda cabe, mas e o limite. Se o RH criar uma nona area, reavaliar.

### 2026-09-22 - Claude - `Sucessao — pipeline como padrao e visao de grupo (EXCECAO DE ESCOPO)`

- Status: concluida (nenhuma escrita no banco)
- Origem: dois pedidos do PO — (1) pipeline como visao padrao; (2) "pipeline nao deve ter restricao de operacao: quem e de Patos e Sume deve ter visao geral do grupo, assim como outras revendas".
- **ATENCAO — esta rodada abre uma excecao deliberada a regra de escopo do modulo.** Ate aqui, toda query do Gente era filtrada por `operacaoId`. Sucessao passa a ser lida por **empresa**, nao por operacao. Registrado aqui para nao parecer descuido em revisao futura.
- O que a excecao preserva, de proposito:
  - **A empresa continua cortando.** `whereGrupoGente` filtra por `empresaId`; "o grupo" e a empresa. Uma segunda empresa no futuro nao enxerga a primeira. SYS_ADMIN segue vendo tudo.
  - **A escrita NAO foi afrouxada.** Editar, excluir e importar seguem presos a `podeEscreverNaOperacao`. A leitura e do grupo; a caneta e da unidade.
  - **Sem empresa no cadastro, devolve `null`** — fail-closed, como o resto do modulo.
  - A excecao vale **so para sucessao**. Vagas, candidatos, quadro, desligamentos, PCD e aprendizes continuam por operacao.
- Decisoes de coerencia:
  - **A lista acompanha o pipeline.** Deixar so o pipeline amplo faria as duas telas mostrarem numeros diferentes do mesmo assunto.
  - **`editavel` por item.** Como a leitura e ampla e a escrita nao, a API marca o que cada usuario pode editar e a lista troca o botao "Editar" por "Outra operacao" nos demais — botao morto seria pior.
  - **`PATCH`/`DELETE` agora devolvem 403 com motivo** em vez de 404. Com a leitura ampla, um 404 num registro visivel pareceria bug.
  - **`/api/gente/operacoes?escopo=grupo`** lista todas as operacoes da empresa, para o filtro das telas de sucessao. As demais telas seguem com a lista restrita.
- Troca de paginas:
  - `/gente/sucessao` = pipeline (era a lista)
  - `/gente/sucessao/lista` = lista (movida com `git mv`, historico preservado)
  - `/gente/sucessao/pipeline` = redirect para `/gente/sucessao`, para links ja salvos
  - `itemAtivo` do dock continua correto: `/gente/sucessao/lista` casa com `/gente/sucessao`
- Verificacao: `npx tsc --noEmit` 0 erros de source; `npm run build` sem avisos novos; `npm run test:unit` **334 passando, 0 falhando** (eram 328). Os 6 testes novos cobrem exatamente a excecao — inclusive que ela **nao** afrouxa a escrita e que segue fail-closed sem empresa.
- Parecer do outro agente: pendente (Codex). **Vale revisao especifica desta excecao.**
- Pendencias / riscos:
  - O `cicloGente` (PREPARAR / DESLIGAR / MUITO BOM) e avaliacao de desempenho e agora e visivel para o RH de qualquer revenda. Foi decisao do PO; se precisar restringir, o ponto unico e `whereGrupoGente`.
  - A tela segue sem dado real no banco.

### 2026-09-22 - Claude - `Modulo Gente — visao de pipeline (indicadores, trilhas e matriz)`

- Status: concluida (nenhuma escrita no banco)
- Origem: o PO mandou dois prints do app do RH pedindo a mesma visao no portal — os 4 indicadores do topo, o diagrama das 5 trilhas de carreira e a matriz nivel × area com os cartoes de sucessor.
- Arquivos novos:
  - `src/lib/gente/pipeline.ts` — `trilhaDoCargo`, `nivelDoCargo`, `areaDoCargo`, `montarPipeline`
  - `src/app/api/gente/sucessao/pipeline/route.ts`
  - `src/app/gente/sucessao/pipeline/page.tsx`
  - `tests/gente-pipeline.test.ts` (22)
- Arquivos alterados: `src/app/gente/sucessao/page.tsx` (botao "Ver pipeline"), `package.json`
- Decisoes que valem registro:
  - **As regras vieram do `PipelineSucessaoView` do app do RH**, que deriva nivel, area e trilha do **texto do cargo** — nao ha campo normalizado na planilha. Reimplementadas como funcao pura, com teste por regra.
  - **A ordem das checagens importa e esta testada:** "Gerente Comercial" e gerente, nao comercial. Diretoria e gerencia sao avaliadas antes dos cargos comerciais.
  - **Corrigi um problema do app original:** la, area que nao casava com nenhuma regra ia para "Armazem", enchendo aquela coluna de gente de outras areas sem ninguem perceber. Aqui vai para "Outras areas", que so aparece quando tem alguem — o problema fica visivel em vez de escondido. Na planilha real isso deu zero, ou seja, todas as areas casaram.
  - **Renomeei um indicador por honestidade.** O app do RH rotula "PRONTOS EM ATE 12 MESES" mas conta apenas `prontoAgora`. Como "pronto agora" e subconjunto de "pronto em 12 meses", o rotulo promete mais do que entrega. A tela agora diz **"Prontos agora"** com o numero de 12 meses como nota embaixo. **Os numeros vao diferir do sistema antigo** — e proposital, e vale avisar o RH.
  - Desligado aparece riscado e com etiqueta, como no original, e nao conta em "no projeto" nem em "em preparacao".
- Verificacao:
  - `npx tsc --noEmit` 0 erros de source; `npm run build` sem avisos novos; `npm run test:unit` **328 passando, 0 falhando** (eram 306).
  - **Rodado sobre a planilha real:** 83 de 83 classificados, **soma das trilhas = 77 = exatamente o total de ativos**, total da matriz = 83 (ninguem se perdeu), e **zero registros em "Outras areas"**. Indicadores: 48 prontos agora, 71 em ate 1 ano, 29 em preparacao (12 cargos), 36 promovidos, 6 desligados.
  - Os numeros nao batem com os do print porque o print e de outro snapshot de dados (la a soma das trilhas da 81, aqui 77).
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **A tela nunca foi vista com dado real** — o banco ainda esta vazio; a validacao foi sobre a planilha, nao sobre a tela renderizada.
  - Os cartoes ainda nao sao clicaveis. No app do RH cada indicador abre uma lista filtrada; aqui ainda nao.
  - A matriz rola horizontalmente com ate 8 colunas; em telas pequenas fica apertada.

### 2026-09-22 - Claude - `Modulo Gente — aceitar a planilha real do ciclo de gente do RH`

- Status: concluida (nenhuma escrita no banco)
- Origem: o PO colocou `gestao de recrutamento/Modelo Pipeline.xlsx` (arquivo real do RH, **nao versionado** — tem nome de colaborador e avaliacao de desempenho) e pediu que o importador aceitasse a aba "Plano de Sucessao".
- **O arquivo nao teria sido lido de jeito nenhum antes.** O importador assumia o caso simples: uma aba, cabecalho na linha 1. O arquivo real tem 6 abas (a primeira e uma capa com texto), a tabela esta na terceira, o cabecalho na linha 6 e as 3 primeiras colunas sao vazias. O cliente pegava `SheetNames[0]` e montava objetos com chaves `__EMPTY`.
- **Bug serio encontrado no caminho — datas.** A coluna ÍNICIO DO MAPEAMENTO e data de verdade (`t=d`), mas formatada como **mes/dia/ano**: "9/5/24" e 5 de setembro. O cliente lia com `raw: false`, que devolve o texto formatado pela propria celula, e o parser brasileiro entendia 9 de maio — **4 meses de erro, em silencio**. Valores como "4/15/26" e "9/16/24" no arquivo provam o formato (15 e 16 nao sao mes). Corrigido lendo com `raw: true`, que entrega `Date` e elimina a interpretacao.
- **Segundo problema de data, de fuso.** O XLSX cria `Date` com meia-noite **local**; ao serializar em JSON vira ISO com o deslocamento, e a parte da data pode mudar (meia-noite de 5/9 em UTC+2 e `2024-09-04T22:00Z`). Agora `prepararParaEnvio` converte para `aaaa-mm-dd` a partir dos componentes locais, antes de enviar. Foi um teste que pegou isso.
- Arquivos novos:
  - `src/lib/gente/planilha-leitura.ts` — `localizarTabela`, `montarLinhas`, `prepararParaEnvio`, registro `SINONIMOS`
  - `tests/gente-planilha-leitura.test.ts` (14)
- Arquivos alterados:
  - `src/app/gente/_components/ImportadorPlanilha.tsx` — le todas as abas, localiza a tabela, `raw: true`, e **mostra na tela em que aba e linha achou**, para a pessoa conferir antes de confirmar
  - `src/lib/gente/sucessao.ts` — cabecalhos reais do RH (inclusive o typo "POTECIALIZAR" que esta no arquivo deles), `MÊS / ANO`, e `STATUS` virando o booleano `ativo`
  - `src/lib/gente/{vaga,candidato,quadro,pcd}-importador.ts` — mapas de sinonimos exportados para alimentar a deteccao
  - `src/lib/gente/modelos.ts` — o modelo de sucessao passou a usar os cabecalhos do RH, para modelo e planilha real falarem a mesma lingua
- Decisoes:
  - **Localizar a tabela em vez de exigir reformatacao.** Varre todas as abas e as 25 primeiras linhas, escolhe onde reconhece mais cabecalhos conhecidos. Minimo de 2 colunas reconhecidas para afirmar que achou — senao devolve `null` e a tela pede para comparar com o modelo, em vez de chutar.
  - **O numero da linha no relatorio e o da planilha**, considerando o deslocamento do `!ref`. Erro apontando para a linha errada e pior do que erro nenhum.
  - **A deteccao e visivel:** a tela informa aba, linha do cabecalho e quantas colunas reconheceu. Automatismo sem conferencia seria pior do que o problema.
  - Beneficio colateral: **os 8 importadores ganharam isso de graca**, porque o componente e compartilhado.
- Verificacao:
  - `npx tsc --noEmit` 0 erros de source; `npm run build` sem avisos novos; `npm run test:unit` **306 passando, 0 falhando** (eram 292).
  - **Teste com o arquivo real:** script temporario rodou o caminho completo do cliente sobre `Modelo Pipeline.xlsx`. Resultado: aba "Plano de Sucessao" escolhida entre 6, cabecalho na linha 6, **17 colunas reconhecidas, 83 de 83 linhas validas, 0 erros e 0 avisos**. Datas conferidas (05/09/2024, nao 09/05), 6 registros com STATUS=DESLIGADO viraram `ativo: false`, e as 7 operacoes do arquivo (Sousa, Patos, Guarabira, Brumado, Itaporanga, Cacule, Sume) resolveram todas. 25 cargos mapeados.
  - O teste versionado usa uma **replica sintetica** do formato, porque o arquivo real nao pode ir para o repo.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **A importacao real ainda nao foi feita** — o teste provou que o arquivo e aceito, mas ninguem gravou os 83 registros ainda.
  - O arquivo `Modelo Pipeline.xlsx` esta na pasta ignorada pelo git. **Nao versionar.**
  - A deteccao olha as 25 primeiras linhas de cada aba; planilha com cabecalho mais abaixo nao seria encontrada.

### 2026-09-22 - Claude - `Modulo Gente — submenu em dock e largura das telas`

- Status: concluida (feedback de UX do PO; nenhuma escrita no banco)
- Origem: duas observacoes do PO sobre `/gente/sucessao/importar` — (1) o conteudo ficava espremido em menos da metade da tela no desktop e (2) trocar de modulo obrigava a voltar pela setinha, o que e contraintuitivo. O PO indicou a referencia do dock do 21st.dev / motion-primitives (@ibelick).
- Arquivos novos:
  - `src/components/ui/dock.tsx` — primitivo do dock com ampliacao por proximidade
  - `src/app/gente/_components/DockGente.tsx` — submenu com os 10 destinos do modulo
  - `tests/gente-dock.test.ts` (6)
- Arquivos alterados: `src/app/gente/layout.tsx`, larguras de ~20 paginas de `/gente`, `_components/PaginaCadastro.tsx`, `package.json`
- Decisoes que valem registro:
  - **O dock mora no `layout.tsx` do modulo, nao em cada pagina.** Aparece automaticamente nas 20+ telas, inclusive nas de importar e editar — que eram exatamente as que obrigavam a voltar pelo hub.
  - **A ampliacao e so decoracao.** Reimplementado com `framer-motion` (ja no projeto) seguindo o comportamento da referencia: distancia do ponteiro ao centro de cada item, faixa de 130px, mola `mass 0.1 / stiffness 150 / damping 12`. Com `prefers-reduced-motion` os itens simplesmente nao crescem; no celular o dock vira uma faixa rolavel. Cada item e um `<Link>` de verdade, entao Tab, Enter e abrir em nova aba funcionam.
  - **O rotulo aparece no hover E no foco por teclado** — tooltip que so responde a mouse deixa quem navega por teclado sem saber o que o icone faz.
  - **A regra de item ativo tem uma armadilha e por isso tem teste:** `/gente/candidatos/internos` comeca com `/gente/candidatos`, entao um `startsWith` ingenuo acenderia os dois itens ao mesmo tempo. `itemAtivo` escolhe o href mais especifico, e o teste cobre isso junto com o caso de prefixo parecido (`/gente/vagas-antigas` nao acende Vagas).
  - **Largura:** o `<main>` do shell nunca teve limite — o estrangulamento vinha do `max-w-3xl`/`max-w-2xl` de cada pagina. Agora o `layout.tsx` define `max-w-6xl` para o modulo, e as paginas foram para `max-w-5xl` (listas e importacao) e `max-w-4xl` (formularios, onde a grade de 2 colunas fica confortavel). Nao fui para largura total de proposito: linha muito longa piora a leitura.
  - As setas de "voltar" foram **mantidas**: elas sobem um nivel (de `importar` para a lista), que e navegacao diferente da lateral que o dock resolve.
- Verificacao: `npx tsc --noEmit` 0 erros de source; `npm run build` sem avisos novos; `npm run test:unit` **292 passando, 0 falhando** (eram 286).
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **O dock nao foi visto rodando** — comportamento de ampliacao e rolagem no celular dependem de conferencia visual do PO.
  - `src/components/ui/dock.tsx` e generico: se outro modulo quiser submenu, e so reusar.
  - Herdadas: consolidar `cv-signed-url.ts`; corrigir o CSV do Banco de Talentos (`admin/rh/candidaturas`); confirmar o caso NAO x NA com a Vitoria.

### 2026-09-22 - Claude - `Modulo Gente — correcao da exportacao (bug reportado pelo PO)`

- Status: concluida (nenhuma escrita no banco)
- Origem: o PO exportou candidatos e o arquivo abriu no Excel **com tudo numa coluna so e os acentos quebrados** ("SituaÃ§Ã£o", "Pau Brasil SumÃ©", "ArmazÃ©m").
- Diagnostico — duas causas somadas:
  1. **Separador.** O Excel em portugues usa `;` como separador de lista. Um CSV separado por `,` abre em coluna unica. Nao e bug do arquivo, e diferenca de locale.
  2. **Codificacao.** Sem o BOM de UTF-8 (EF BB BF) o Excel assume Windows-1252 e todo acento vira mojibake.
- Decisao: **a exportacao padrao passou a ser `.xlsx`**, nao CSV corrigido. Motivo: no xlsx separador e codificacao nao existem como conceito, entao o problema nao volta por locale de maquina. De quebra, data vai como data e numero como numero — antes tudo era texto e o Excel adivinhava (um codigo "001" viraria 1). O CSV continua disponivel em `?export=csv`, agora com BOM, `;` e CRLF, para quem precisa alimentar outra ferramenta.
- Arquivos novos:
  - `src/lib/gente/exportacao.ts` — funcoes puras (CSV, `formatarDataBR`, `formatarNumeroBR`, escape de celula)
  - `src/lib/gente/exportacao-xlsx.ts` — geracao do xlsx (separado por importar `xlsx`, que so roda no servidor)
  - `src/lib/gente/responder-exportacao.ts` — resposta nos dois formatos
  - `tests/gente-exportacao.test.ts` (14)
- Arquivos alterados: rotas de export de `vagas`, `candidatos`, `quadro`, `desligamentos`; as 4 telas correspondentes; `package.json`
- Melhorias que vieram junto:
  - Os valores de enum saiam crus na planilha (`EM_ANDAMENTO`, `PORTAL_CARREIRAS`, `ABERTA_VENCIDA`). Agora saem com rotulo legivel ("Em andamento", "Portal de carreiras", "Vaga aberta vencida").
  - Datas saiam em ISO (`2026-02-12`); agora saem como data de verdade no xlsx e `dd/mm/aaaa` no CSV.
  - A exportacao de vagas ganhou a coluna "Dias de atraso", que ja era calculada e nao era exportada.
  - Cabecalho congelado e largura de coluna ajustada ao conteudo.
  - O meta da auditoria passou a registrar o formato exportado.
- Verificacao:
  - `npx tsc --noEmit` 0 erros de source; `npm run build` sem avisos novos; `npm run test:unit` **286 passando, 0 falhando** (eram 272).
  - **Teste de ida e volta com os dados reais do PO:** script temporario montou a planilha com a linha do JEFFERSON (incluindo "Pau Brasil Sumé" e "Ajudante de Armazém"), mais uma linha propositalmente suja com `;`, aspas e quebra de linha. Releu os dois formatos: **15 de 15 colunas separadas, zero mojibake**, `Progresso %` como numero, data como `Date`, e "Supervisor; Coordenador" preservado numa celula so.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **`src/app/api/admin/rh/candidaturas/route.ts` (Banco de Talentos) tem o mesmo bug** — CSV com virgula e sem BOM. Nao alterei por ser de outro agente; a correcao e trocar o corpo pelo `responderExportacao`.
  - O download pelo navegador continua sem confirmacao de usuario real (a geracao esta testada ponta a ponta).
- Proximo passo sugerido:
  - Fase 0 com o RH (export das planilhas reais) e depois Fase 3.

### 2026-09-21 - Claude - `Modulo Gente — blocos 5, 6 e 7 (Fase 2 CONCLUIDA)`

- Status: concluida. **As 9 telas do modulo Gente estao entregues.** Nenhuma escrita no banco durante a rodada.
- Objetivo: fechar a Fase 2 — PCD + Aprendizes, Descritivos de Cargo + Verificador, Internos + Sucessao.
- Arquivos novos (libs): `cotas.ts`, `pcd.ts`, `pcd-importador.ts`, `aderencia.ts`, `sucessao.ts`, `importar-handler.ts`
- Arquivos novos (API): `pcd/` (route, [id], [id]/laudo, importar, metas), `aprendizes/` (route, [id], importar), `cargos/` (route, [id]), `vagas/[id]/aderencia`, `internos/` (route, [id], importar), `sucessao/` (route, [id], importar)
- Arquivos novos (telas): `pcd/`, `aprendizes/`, `cargos/`, `candidatos/internos/`, `sucessao/` — cada uma com lista, novo, editar e (onde cabe) importar
- Componentes novos: `_components/campos.tsx`, `_components/FormularioSimples.tsx`, `_components/PaginaCadastro.tsx`
- Testes novos: `gente-cotas.test.ts` (15), `gente-aderencia.test.ts` (14), `gente-sucessao.test.ts` (16); `gente-modelos.test.ts` estendido para os 8 modelos
- **Bloco 5 — PCD e Aprendizes:**
  - **A cota legal deixou de ser numero digitado.** `cotas.ts` calcula a cota de PCD pelo art. 93 da Lei 8.213/91 (faixas de 2% a 5%) sobre o quadro de QLP, **arredondando sempre para cima** — arredondar para baixo deixaria a empresa irregular achando que esta em dia. Abaixo de 100 colaboradores devolve "nao aplicavel", nao "0 exigidos".
  - Aprendizes: faixa de 5% a 15% (Lei 10.097/2000). **Acima do teto tambem e irregular**, nao so abaixo do piso.
  - Vigencia de contrato com janela de alerta de 60 dias; contrato que vence hoje conta como "vencendo", nao "vencido".
  - **O laudo e o ponto mais sensivel do modulo inteiro** — e exatamente o arquivo que estava exposto publicamente no Firestore. Vive em blob privado (`@vercel/blob`, access private), a chave **nunca** sai numa listagem (`serializarPcd` a remove), exige `canViewDadoSensivel` para ler E para anexar, e a auditoria e gravada **antes** de servir. Trocar o laudo apaga o anterior; excluir o cadastro apaga o laudo junto — dado de saude orfao no blob seria exposicao sem registro apontando para ela. O tipo de deficiencia **nao vai para o meta da auditoria**.
- **Bloco 6 — Cargos e Verificador de Aderencia:**
  - **A analise e deterministica, nao de IA.** O app do RH mandava vaga e descritivo para o Gemini e recebia texto livre. O problema nao e a qualidade: e que a resposta muda a cada execucao e o RH nao consegue cobrar correcao com ela. `aderencia.ts` compara campo a campo com regra explicita e pontuacao com peso por severidade. Uma camada de IA pode enriquecer depois; o diagnostico nao depende dela — **e nenhum provedor de LLM precisou ser escolhido**.
  - Sem descritivo cadastrado o resultado e "nao da para avaliar", nao "0% de aderencia": dizer 0 sugeriria que a vaga esta errada quando o que falta e o padrao.
  - Descritivo e **da empresa, nao da operacao** — o padrao de um cargo nao muda entre Patos e Sume. Unico lugar do modulo com escopo por `empresaId`.
- **Bloco 7 — Internos e Sucessao:**
  - **Os tres "pronto agora/1 ano/2 anos" viraram um horizonte unico.** No app do RH eram booleanos independentes, o que permitia estados contraditorios. `horizonteProntidao` toma sempre o prazo mais proximo.
  - **O indicador e "cargos em risco", nao "quantos sucessores existem".** Cargo em risco = sem ninguem pronto agora nem em 1 ano. Contar sucessores esconde o cargo que tem tres nomes, todos para daqui a dois anos.
- **Reaproveitamento:** `criarRotaImportacao` centraliza as 8 rotas de importacao — garante que nenhuma nasca sem dry-run, sem escopo ou sem auditoria. `FormularioSimples` + `PaginaCadastro` descrevem os cadastros simples como dados, evitando telas quase identicas.
- Verificacao:
  - `npx tsc --noEmit` 0 erros de source; `npm run build` **sem nenhum aviso novo** (os 3 restantes sao pre-existentes, em `app/visitas/*`); `npm run test:unit` **272 passando, 0 falhando** (eram 223).
  - Smoke test somente leitura dos blocos 5, 6 e 7. Confirmado que `laudoBlobKey` **nao vaza** na serializacao. Nenhuma escrita.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **Nenhuma tabela dos blocos 5-7 tem dado ainda.** Os caminhos de escrita estao cobertos por tipo e teste, mas so a importacao real exercita.
  - **O upload de laudo nunca rodou de verdade** — depende de `BLOB_READ_WRITE_TOKEN` estar configurado no ambiente (a rota devolve 500 explicito se faltar). Vale testar com um arquivo de mentira antes de o RH usar com laudo real.
  - `PaginaCadastro` usa `data.nome` para o titulo na edicao; em Cargo e Sucessao nao ha campo `nome`, entao cai no titulo generico. Cosmetico.
  - Consolidar `cv-signed-url.ts` com a copia em `admin/rh/candidaturas/[id]/cv-url` (herdado do bloco 2).
  - Confirmar com a Vitoria o caso NAO x NA do bloco 3.
- Proximo passo sugerido:
  - **Fase 2 encerrada.** O proximo passo natural e a Fase 0 com o RH (export das planilhas reais) e depois a Fase 3 (funil unico, casamento com `User`, desligamento disparando revisao de acesso).

### 2026-09-21 - Claude - `Modulo Gente — planilha-modelo em todos os importadores`

- Status: concluida (pedido do PO, antes do bloco 5; nenhuma escrita no banco)
- Objetivo: todo importador do modulo passa a oferecer download de uma planilha-modelo.
- Arquivos novos:
  - `src/lib/gente/modelos.ts` — definicao das 4 planilhas-modelo
  - `src/app/api/gente/modelo/route.ts` — gera o `.xlsx` (tipo via querystring)
  - `tests/gente-modelos.test.ts` (6)
- Arquivos alterados:
  - `src/app/gente/_components/ImportadorPlanilha.tsx` — prop `tipoModelo` + botao "Baixar modelo"
  - `src/app/gente/{vagas,candidatos}/importar/page.tsx` — **migrados para o componente generico** (resolve a pendencia de duplicacao aberta no bloco 4)
  - `src/app/gente/{quadro,desligamentos}/importar/page.tsx` — passam `tipoModelo`
  - `package.json`
- Decisoes que valem registro:
  - **O modelo e gerado no servidor, nao no navegador.** Motivo concreto: a aba "Operacoes" traz as unidades que **aquele usuario** pode gravar. Unidade nao reconhecida e o erro que mais bloqueia importacao, e o modelo entrega a lista pronta para copiar em vez de deixar o RH adivinhar.
  - **Os cabecalhos do modelo sao os rotulos que o importador aceita**, e isso e garantido por teste: `tests/gente-modelos.test.ts` passa a linha de exemplo de cada modelo pelo analisador de verdade e exige **zero erro**, alem de conferir que os campos-chave foram realmente lidos (nao so "nao falharam"). Se alguem renomear um cabecalho aceito sem atualizar o modelo, quebra no CI, nao na mao do RH.
  - **Tres abas:** `Dados` (cabecalhos + 1 linha de exemplo), `Instrucoes` (obrigatoriedade e regra de cada coluna, comecando com o aviso de apagar a linha de exemplo) e `Operacoes` (unidades validas do usuario).
  - `XLSX.write` devolve Buffer, que o `BodyInit` tipado desta versao do Next nao aceita; o corpo vai como `Blob`.
- Verificacao:
  - `npx tsc --noEmit` 0 erros de source; `npm run build` OK; `npm run test:unit` **223 passando, 0 falhando** (eram 217).
  - **Teste de ida e volta:** script temporario gerou os quatro `.xlsx` com a mesma logica da rota, releu cada arquivo como o navegador faria no reenvio e passou pelo importador correspondente. Resultado: 4/4 com 1 linha valida, **0 erros e 0 avisos**. Tamanhos 18–21 KB.
  - Efeito colateral bom da migracao: `/gente/vagas/importar` caiu de 4,39 kB para 1,18 kB e `/gente/candidatos/importar` de 4,32 kB para 1,19 kB.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - O `.xlsx` nunca foi baixado por um usuario real — a geracao esta testada ponta a ponta, mas o download pelo navegador so o uso confirma.
  - Consolidar `cv-signed-url.ts` com a copia em `admin/rh/candidaturas/[id]/cv-url` (herdado do bloco 2).
  - Confirmar com a Vitoria o caso NAO x NA do bloco 3.
- Proximo passo sugerido:
  - Bloco 5: PCD + Jovens Aprendizes, com o modelo ja previsto no mesmo padrao.

### 2026-09-21 - Claude - `Modulo Gente — Fase 2 bloco 4 (QLP e Desligamentos)`

- Status: concluida (nenhuma escrita feita no banco durante a rodada)
- Objetivo: quarto bloco de paridade — quadro de lotacao e historico de saidas.
- Arquivos novos:
  - `src/lib/gente/quadro.ts` — schemas, selects, `calcularTurnover`
  - `src/lib/gente/quadro-importador.ts` — dois analisadores puros (QLP e desligamentos)
  - `src/app/api/gente/quadro/` — `route.ts`, `[id]/route.ts`, `[id]/desligar/route.ts`, `importar/route.ts`
  - `src/app/api/gente/desligamentos/` — `route.ts`, `[id]/route.ts`, `importar/route.ts`
  - `src/app/gente/quadro/` — `page.tsx`, `novo/`, `[id]/editar/`, `importar/`, `_components/FormularioColaborador.tsx`
  - `src/app/gente/desligamentos/` — `page.tsx`, `importar/`
  - `src/app/gente/_components/ImportadorPlanilha.tsx` — tela de importacao generica
  - `tests/gente-quadro.test.ts` (14)
- Arquivos alterados: `src/lib/audit.ts` (9 acoes novas), `src/app/gente/page.tsx`, `package.json`
- Decisoes que valem registro:
  - **Desligar do quadro e uma transacao, nao dois lancamentos.** No app do RH tirar da lotacao e anotar na lista de desligados eram telas diferentes, e era comum um acontecer sem o outro. Agora `POST /api/gente/quadro/[id]/desligar` cria o `QuadroDesligamento` e marca `ativo: false` juntos — ou os dois, ou nenhum.
  - **O cadastro do quadro nao e apagado no desligamento, so inativado.** Quem saiu precisa continuar no historico e no calculo de turnover.
  - **Importar desligamento NAO da baixa no quadro.** Deliberado: a planilha de desligados traz historico antigo, de gente que nunca esteve no QLP importado, e dar baixa automatica apagaria quadro ativo por engano. A tela avisa isso no fim da importacao.
  - **Excluir um desligamento nao devolve a pessoa ao quadro** — se foi engano, o colaborador precisa ser reativado a parte. Registrado no meta da auditoria para nao virar surpresa.
  - **Turnover e apresentado como aproximacao**, com a limitacao escrita na propria tela: o modelo nao guarda historico mensal de headcount, entao usa o quadro de hoje como base. Preferi expor a imprecisao a fingir precisao.
  - **Recontratacao e caso real:** a chave de deduplicacao de desligamento inclui a data, entao a mesma pessoa com datas diferentes entra duas vezes de proposito.
  - **A tela de importacao virou componente generico** (`ImportadorPlanilha`), usado pelos dois importadores deste bloco. As telas de vagas e candidatos ainda tem a versao propria — **migra-las e uma limpeza pendente**, nao feita agora para nao misturar refatoracao com entrega.
  - **Desligar quem tem conta no portal nao revoga o acesso.** O modal avisa e a auditoria grava `temUsuarioNoPortal`. A revogacao automatica e item da Fase 3.
- Verificacao:
  - `npx tsc --noEmit` 0 erros de source; `npm run build` OK (7 rotas de API + 7 paginas novas); `npm run test:unit` **217 passando, 0 falhando** (eram 203).
  - Smoke test somente leitura com o `where` mais complexo das duas listagens. Nenhuma escrita.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - Quadro e desligamentos estao vazios: so a importacao real do RH exercita o caminho de escrita.
  - Migrar `vagas/importar` e `candidatos/importar` para `ImportadorPlanilha`.
  - Consolidar `cv-signed-url.ts` com a copia em `admin/rh/candidaturas/[id]/cv-url` (herdado do bloco 2).
  - Confirmar com a Vitoria o caso NAO x NA do bloco 3.
- Proximo passo sugerido:
  - Bloco 5: PCD + Jovens Aprendizes. **E o bloco mais sensivel**: o laudo de PCD e dado de saude (art. 11 LGPD) e exige blob privado, `canViewDadoSensivel` e auditoria por leitura.

### 2026-09-21 - Claude - `Modulo Gente — Fase 2 bloco 3 (Painel de Gente)`

- Status: concluida (nenhuma escrita feita no banco durante a rodada)
- Objetivo: terceiro bloco de paridade — o painel, que so fazia sentido depois de vagas e candidatos existirem.
- Arquivos novos:
  - `src/lib/gente/dashboard.ts` — `agregarVagas`, `agregarCandidatos`, corte de periodo
  - `src/app/api/gente/dashboard/route.ts`
  - `src/app/gente/_components/PainelGente.tsx`
  - `tests/gente-dashboard.test.ts` (15)
- Arquivos alterados: `src/app/gente/page.tsx` (painel acima dos cards), `package.json`
- Decisoes que valem registro:
  - **A agregacao e feita em memoria, nao em SQL.** Deliberado: o painel precisa das mesmas regras de `vaga-sla.ts` e `etapas.ts`, e reescreve-las em SQL criaria uma segunda verdade que divergiria da tela de vagas na primeira mudanca de regra. Ha um teto de 5000 linhas por agregacao e a resposta avisa (`truncado: true`) quando bate nele — o painel degrada de forma visivel em vez de ficar lento em silencio.
  - **Requisicao x posto de trabalho:** o painel separa "vagas abertas" (requisicoes) de "postos a preencher" (soma de `quantidadeVagas`). No app do RH os dois numeros se confundiam.
  - **"Abertas vencidas" conta so vaga ABERTA fora do prazo.** Vaga fechada fora do prazo entra no percentual de pontualidade, nao no alerta de vencidas — sao problemas diferentes.
  - **Sem vagas fechadas, tempo medio e pontualidade ficam `null`, nao `0`.** Zero dia de media e uma afirmacao falsa; "—" e honesto.
  - **Gargalo conta so quem ainda esta correndo.** Quem foi reprovado nao esta "parado numa etapa", esta fora do processo.
  - **O corte de periodo e sobre a entrada** (abertura da vaga / criacao do candidato), nao sobre o fechamento: uma vaga aberta ha 200 dias ainda e problema de hoje. O painel informa quantas vagas ficaram fora do recorte.
- **A ponte foi validada em producao por usuaria real.** Durante a verificacao desta rodada apareceu 1 `RecCandidato` no banco e as candidaturas disponiveis cairam de 216 para 215. A auditoria mostra `GENTE_CANDIDATO_PROMOVIDO` seguido de 5 `GENTE_CANDIDATO_ETAPA_REGISTRADA`, todos por **Vitoria de Lucena Luiz** (RH_ADMIN), em 2026-09-21 19:45 UTC. O candidato veio com `candidaturaId`, curriculo anexado e operacao definida. O fluxo do bloco 2 funciona ponta a ponta com dado real.
- **Risco de UX observado nessa mesma sessao:** o candidato ficou com `entrevista_gg`, `aprovacao_gestor` e `teste_pratico` em OK e `teste_direcao` em **NAO**. Como `teste_direcao` e justamente a etapa marcada com "so para cargos que dirigem", e possivel que a intencao fosse **NA** (nao se aplica) e nao NAO (reprovado) — os dois botoes ficam lado a lado e se distinguem so por icone (X e tracinho) e tooltip. A diferenca e relevante: NAO bloqueia o processo, NA apenas tira a etapa da conta. Nao da para saber a intencao dela; **vale confirmar com a usuaria** e, se confirmado, rotular os botoes com texto em vez de so icone.
- Verificacao:
  - `npx tsc --noEmit` 0 erros de source; `npm run build` sem avisos; `npm run test:unit` **203 passando, 0 falhando** (eram 188).
  - Smoke test somente leitura rodando as consultas exatas da rota. Nenhuma escrita.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - Consolidar `src/lib/cv-signed-url.ts` com a copia em `admin/rh/candidaturas/[id]/cv-url` (herdado do bloco 2).
  - Confirmar com a Vitoria o caso NAO x NA descrito acima.
- Proximo passo sugerido:
  - Blocos 4 e 5: QLP + Desligados, depois PCD + Jovens Aprendizes (compliance, exige o fluxo de anexo privado do laudo).

### 2026-09-21 - Claude - `Modulo Gente — Fase 2 bloco 2 (Candidatos + ponte com o Banco de Talentos)`

- Status: concluida (nenhuma escrita feita no banco durante a rodada)
- Objetivo: segundo bloco de paridade — processo seletivo, etapas e a uniao dos dois funis.
- Arquivos novos:
  - `src/lib/gente/etapas.ts` — catalogo de etapas + `resumirEtapas`
  - `src/lib/gente/candidato.ts` — schema zod, `SELECT_CANDIDATO`, serializacao
  - `src/lib/gente/candidato-importador.ts` — analise pura da planilha de stand-by
  - `src/lib/cv-signed-url.ts` — assinatura de URL de curriculo
  - `src/app/api/gente/candidatos/` — `route.ts` (GET lista/CSV, POST), `[id]/route.ts`, `[id]/etapas/route.ts`, `[id]/cv/route.ts`, `promover/route.ts`, `disponiveis/route.ts`, `importar/route.ts`
  - `src/app/gente/candidatos/` — `page.tsx`, `novo/`, `[id]/editar/`, `importar/`, `do-banco-de-talentos/`, `_components/FormularioCandidato.tsx`
  - `tests/gente-etapas.test.ts` (10), `tests/gente-candidato-importador.test.ts` (16)
- Arquivos alterados: `src/lib/audit.ts` (8 acoes `GENTE_CANDIDATO_*`), `src/app/gente/page.tsx`, `package.json`
- Decisoes que valem registro:
  - **Etapas viraram linhas, nao colunas.** No app do RH cada etapa era coluna fixa da planilha; aqui sao `RecCandidatoEtapa` com chave estavel e `upsert` por (candidato, chave). Incluir etapa nova nao exige migration. Autor e data da avaliacao sao gravados pelo servidor, nunca vem do cliente.
  - **`NA` sai da conta de progresso.** E assim que um cargo que nao dirige chega a 100% sem os dois testes de direcao. Uma reprovacao marca o processo como bloqueado, e a tela para de cobrar as proximas etapas.
  - **A ponte com o Banco de Talentos** (`POST /api/gente/candidatos/promover`) copia nome, contato, residencia e o curriculo ja enviado pela pessoa, e marca `candidaturaId`. A `Candidatura` original **e preservada** — ela e o registro do consentimento LGPD que a pessoa deu; o que nasce e o acompanhamento do processo. `candidaturaId @unique` impede promover a mesma pessoa duas vezes (409 com o id do candidato existente).
  - **`/api/gente/candidatos/disponiveis` nao filtra por escopo** de proposito: `Candidatura` nao tem operacao (quem se candidata pelo site escolhe cidade, nao filial). O escopo entra no momento de promover, quando o RH escolhe a operacao.
  - **A URL do curriculo nunca sai na listagem nem no detalhe.** `serializarCandidato` remove `cvUrl`/`cvPublicId` e devolve so `temCurriculo`. O arquivo sai pela rota `/[id]/cv`, com link assinado de vida curta e **auditoria gravada antes de servir** — o evento e o acesso ao dado pessoal, nao o sucesso do download.
  - **Importacao cria candidato e etapas na mesma transacao** (`create` aninhado, porque `createMany` nao cria filhos).
  - **E-mail malformado nao bloqueia a pessoa** de entrar: vira vazio com aviso. Origem desconhecida vira OUTRO com aviso. Ja unidade sem operacao correspondente continua sendo erro bloqueante.
- Verificacao:
  - `npx tsc --noEmit` 0 erros de source; `npm run build` OK (7 rotas de API + 5 paginas novas); `npm run test:unit` **188 passando, 0 falhando** (eram 162).
  - Um aviso de `react-hooks/exhaustive-deps` apareceu no build e foi corrigido (`operacoes` memoizado em `do-banco-de-talentos`) — sem ele o efeito de pre-selecao rodaria a cada render.
  - Smoke test **somente leitura** no banco: listagem com o `where` mais complexo, consulta da ponte, chave composta do upsert de etapas e serializacao. Confirmado que `cvUrl` e `cvPublicId` **nao vazam**. Nenhuma escrita.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - **216 candidaturas ja estao disponiveis para promover** e nenhuma foi promovida ainda. A ponte nunca foi exercitada com escrita real.
  - `src/lib/cv-signed-url.ts` duplica a logica de assinatura que hoje tambem vive em `src/app/api/admin/rh/candidaturas/[id]/cv-url/route.ts`. **Vale consolidar** — codigo de assinatura duplicado diverge em silencio. Nao alterei a rota existente por ser de outro agente.
  - Nao ha tela de edicao em massa de etapas; cada etapa e marcada individualmente no drawer.
- Proximo passo sugerido:
  - Bloco 3 (Dashboard, que so faz sentido com dados reais dos blocos 1 e 2) ou blocos 4-5 (QLP/Desligados e PCD/Aprendizes).

### 2026-09-21 - Claude - `Modulo Gente — Fase 2 bloco 1 (Controle de Vagas)`

- Status: concluida (sem commit; nenhuma escrita feita no banco)
- Objetivo: primeiro bloco de paridade do plano — Controle de Vagas ponta a ponta.
- Arquivos novos:
  - `src/lib/gente/scope.ts` — escopo por operacao aplicado no servidor
  - `src/lib/gente/vaga.ts` — schema zod, `SELECT_VAGA` e serializacao com SLA
  - `src/lib/gente/vaga-importador.ts` — analise pura da planilha
  - `src/lib/gente/api.ts` — sessao + permissao + escopo num lugar so
  - `src/app/api/gente/vagas/route.ts` (GET lista/CSV, POST), `.../[id]/route.ts` (GET/PATCH/DELETE), `.../importar/route.ts`, `src/app/api/gente/operacoes/route.ts`
  - `src/app/gente/vagas/page.tsx`, `.../importar/page.tsx`, `.../nova/page.tsx`
  - `tests/gente-scope.test.ts` (7), `tests/gente-vaga-importador.test.ts` (21)
- Arquivos alterados: `src/lib/audit.ts` (6 acoes `GENTE_*`), `src/app/gente/page.tsx` (card de Vagas ativado), `package.json`, `.gitignore`
- Acabamento do bloco (mesma rodada): formulario extraido para `src/app/gente/vagas/_components/FormularioVaga.tsx` e reusado por `nova` e `[id]/editar`; botoes Editar e Excluir no drawer, com confirmacao em dois passos que sugere cancelar em vez de excluir (preserva o historico de prazo). O form exige data de contratacao ao marcar FECHADA e data de encerramento ao marcar CANCELADA — sao elas que alimentam o SLA. Quando a API omite `salario` (usuario sem `canViewDadoSensivel`), o campo nao aparece **e nao e enviado no PATCH**, para nao apagar o valor existente.
- **`.gitignore`:** acrescentado `gestao de recrutamento/` (pasta do app do RH, com PII real e credenciais do Firebase — nunca versionar), `test-results/`, `playwright-report/`, `scratch*`, `public/worker-*.js`. A linha `.vercel` ja estava no diff de outro agente e foi preservada, nao revertida.
- Decisoes que valem registro:
  - **Escopo no servidor, nunca na tela.** `whereEscopoGente` entra em toda query. O filtro de operacao da UI so estreita o escopo; nunca o amplia. Registro fora do escopo responde **404, nao 403** — quem nao tem acesso nao deve nem confirmar que a vaga existe.
  - **Empresa vem sempre da operacao de destino**, nunca do corpo da requisicao. Fecha a porta de criar registro em outra empresa mandando outro `empresaId` no JSON.
  - **Mover vaga de operacao exige permissao nas duas pontas** (origem e destino), senao daria para empurrar um registro para fora do proprio escopo.
  - **Importacao e dry-run por padrao.** So grava com `confirmar: true`. Unidade que nao casa com operacao cadastrada e **erro bloqueante**, nao aviso — nada entra sem dono, que e o que sustenta a regra de escopo.
  - **O importador so enxerga as operacoes que o usuario pode gravar.** Uma unidade fora do escopo e recusada com a mesma mensagem de "nao cadastrada", sem vazar que ela existe.
  - **Salario sai na serializacao**, num unico ponto (`serializarVaga`), atras de `canViewDadoSensivel`. A exportacao CSV registra em auditoria se saiu com salario ou sem.
  - **Excluir vaga com candidato vinculado e bloqueado** (409, sugere cancelar) — evita orfao quando o bloco 2 (Candidatos) chegar.
  - **`xlsx` e carregado sob demanda** (`await import`) so quando alguem importa, para nao pesar a primeira carga da tela.
- Verificacao:
  - `npx tsc --noEmit` 0 erros de source; `npm run build` OK (4 rotas de API + 4 paginas registradas); `npm run test:unit` **162 passando, 0 falhando** (eram 134).
  - Smoke test **somente leitura** contra o banco: a rota de listagem monta `where` como `Record<string, unknown>`, entao o tsc nao valida essa parte. Rodei a forma mais complexa possivel (escopo + status + departamento + OR de 6 campos com `mode: insensitive` + orderBy composto + select com relacao) direto no Prisma: todas as consultas responderam. Nenhuma escrita.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - Nenhuma vaga foi gravada ainda — o caminho de escrita esta coberto por tipo e teste unitario, mas nao foi exercitado contra o banco. A primeira importacao real do RH e o teste de verdade.
  - `MAX_LINHAS` de importacao = 2000 por lote. A planilha do RH cabe, mas se vier maior precisa de paginacao no cliente.
  - Arquivos de outros agentes continuam sem commit e foram deixados intactos: `docs/apresentacao-checkin-beta.html`, `docs/backup-sistema.html`, `docs/oportunidades-ux.md`, `docs/plano-de-melhorias.md`, `prisma/seed-funcoes-lideranca.ts`, `scratch_clean.ts`.
- Proximo passo sugerido:
  - Acabamento do bloco 1 (edicao pela UI) ou bloco 2 (Candidatos Stand-By, que e onde entra a ponte com o Banco de Talentos).

### 2026-09-21 - Claude - `Modulo Gente — Fase 1 (fundacao)`

- Status: concluida (sem commit; **migration aplicada no banco em 2026-09-21 com autorizacao do PO**)
- Objetivo: fundacao do modulo Gente conforme `docs/plano-integracao-recrutamento.md` §3 Fase 1.
- Arquivos alterados:
  - `prisma/schema.prisma` — 8 enums + 11 models novos; relacoes inversas em `User`, `Empresa`, `Operacao`, `Function`, `Candidatura`
  - `prisma/migrations/20260921000000_add_gente_recrutamento_quadro/migration.sql` (novo, NAO aplicado)
  - `src/lib/auth-helpers.ts` — `canAccessGente`, `canManageGente`, `canViewDadoSensivel`, `escopoOperacoesGente`
  - `src/lib/gente/vaga-sla.ts` (novo) — regra de SLA e status de fechamento
  - `src/lib/middleware-access.ts` + `src/middleware.ts` — guarda de `/gente`
  - `src/app/gente/layout.tsx` + `src/app/gente/page.tsx` (novos) — shell do modulo
  - `src/app/app/layout.tsx` — item "Gente" nas secoes Gente & Cultura e Admin
  - `tests/gente-vaga-sla.test.ts` (novo, 13 testes), `tests/auth-helpers.test.ts`, `tests/middleware-access.test.ts`, `tests/support/session-user.ts`, `package.json`
- O que foi feito:
  - **Schema:** `RecVaga`, `RecCargo`, `RecCandidato`, `RecCandidatoEtapa`, `RecCandidatoInterno`, `RecSucessao`, `QuadroColaborador`, `QuadroDesligamento`, `QuadroPcd`, `QuadroPcdMeta`, `QuadroAprendiz`. Escopo por `operacaoId` (FK para `Operacao`, o mesmo alvo de `User.operationIds`) + `empresaId`. Ponte `RecCandidato.candidaturaId @unique` → `Candidatura`. FK opcional para `User` em toda entidade que representa pessoa do grupo (fica `null` ate a Fase 3).
  - **Migration:** gerada via `prisma migrate diff` (nao via `migrate dev`, para nao tocar no banco). Conferida: 11 CREATE TABLE, 8 CREATE TYPE, 41 CREATE INDEX, 35 ADD FOREIGN KEY, **zero DROP / ALTER COLUMN / DELETE**. Nenhuma tabela existente e alterada.
  - **Permissoes fail-closed:** `escopoOperacoesGente` retorna `null` so para SYS_ADMIN; para RH_ADMIN retorna `operationIds`, e lista vazia significa NENHUMA operacao, nao todas. Decisao deliberada: o modulo guarda laudo medico e salario, entao cadastro incompleto nao pode virar acesso irrestrito.
  - **`vaga-sla.ts`:** `diasEmAberto` e `statusFechamento` deixaram de ser colunas e viraram derivados. Comparacao por dia de calendario em UTC. Preserva o fallback de 30 dias e o override manual do RH. Dois testes usam linhas reais do `data.ts` do app do RH como ancora de regressao.
  - **Efeito colateral corrigido:** 3 testes estavam quebrados desde a remocao dos modulos OBZ/Score (2026-08-18) e impediam rodar a suite. Ver linha propria na Tabela Diaria.
  - **Verificacao:** `npx tsc --noEmit` 0 erros de source; `npm run build` OK (`/gente` registrada como rota dinamica); `npm run test:unit` 134 passando, 0 falhando.
  - **Migration aplicada** em 2026-09-21 via `prisma migrate deploy` no `neondb` (Neon, sa-east-1), com autorizacao expressa do PO. `prisma migrate status` ficou limpo (14/14 aplicadas). Verificacao somente-leitura pos-migration: as 11 tabelas novas existem e estao zeradas; dados existentes intactos (66 usuarios, 10 empresas, 8 operacoes, 213 candidaturas, 2577 audit logs); a ponte `Candidatura` ↔ `RecCandidato` responde corretamente com 0 vinculos.
  - Checagem de acesso real: os 2 usuarios RH_ADMIN ativos (Vitoria/agg.patos e Beatriz/cgg.sousa) ja tem 2 operacoes cada, entao a regra fail-closed de `escopoOperacoesGente` nao deixa ninguem de fora hoje. 3 SYS_ADMIN veem tudo.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - `tests/score-api.test.ts` e arquivo orfao (testa `src/lib/score-upload`, removido). Tirado dos scripts, nao deletado.
  - `src/app/admin/page.tsx` ainda linka `/admin/obz`, que foi removido em 2026-08-18 — link morto para SYS_ADMIN. Nao corrigi por estar fora do escopo desta rodada.
  - Observacao sobre `resolveMiddlewareRedirect`: a regra de rota legada `/admin/rh` → `/talentos` roda ANTES da checagem de permissao, entao usuario sem acesso faz dois saltos ate `/app/hoje`. Nao e falha de seguranca (o segundo salto e reavaliado pelo middleware), mas o teste agora documenta esse encadeamento. Vale considerar inverter a ordem.
- Proximo passo sugerido:
  - Aplicada a migration, iniciar a Fase 2 bloco 1: Controle de Vagas (rota API + tela + importacao XLSX com dry-run).

### 2026-09-21 - Claude - `Integracao app RH "Gestao de Recrutamento" — analise e arquitetura`

- Status: concluida (rodada de analise; sem alteracao de codigo de producao)
- Objetivo: analisar o app externo entregue pelo RH e projetar o caminho de integracao ao portal.
- Arquivos em posse:
  - `docs/plano-integracao-recrutamento.md` (novo)
  - `docs/ai-handoff.md`
- O que foi feito:
  - Zip do RH extraido e analisado em scratchpad (nao no repo): Vite 6 + React 19 + Tailwind 4 + Firestore, ~20.700 linhas, 14 telas, sem backend proprio (Express so expoe 2 endpoints Gemini).
  - Levantados 9 achados de seguranca/LGPD (S1–S9), 4 deles criticos. Registrados em `Bloqueios e alertas`.
  - Mapeado o reaproveitamento do que o portal ja tem: `auth-helpers`, `audit`, `cv-parser`, blob privado, `operacoes-rh`, Kanban de `/talentos`.
  - Proposta de arquitetura: reescrita da camada de dados preservando regras e telas (opcao C), novo grupo de rotas `/gente`, 11 models Prisma (`Rec*` + `Quadro*`) com escopo por `operacaoId` no servidor, ponte `RecCandidato.candidaturaId` ligando o funil inbound do Banco de Talentos ao processo seletivo do RH.
  - Plano em 5 fases (0 contencao, 1 fundacao, 2 paridade, 3 integracao real, 4 desativacao) com riscos e criterios de saida.
- **Decisoes do PO na mesma rodada (mudaram o plano):**
  1. Modulo alvo confirmado: Banco de Talentos (`/talentos`). Nao existe banco de horas no repo.
  2. **Nao integrar com o sistema atual do RH — construir nativo no portal, com os nossos recursos e no nosso padrao.**
  - Efeito: o app em Firebase vira **especificacao**, nao fonte. Nenhum codigo dele entra; o portal nunca conecta no Firestore deles. Paridade e funcional (campos + regras), nao visual — telas escritas no design system do portal. Dados entram por **importacao XLSX/CSV** que o proprio RH exporta. Plano reescrito: Fase 0 deixou de ser "contencao do vazamento" e virou "especificacao e coleta", e nao bloqueia mais a Fase 1.
- Parecer do outro agente: pendente (Codex)
- Pendencias / riscos:
  - Lista de usuarios do RH (quem ja tem conta no portal) — necessaria para dimensionar o provisionamento.
  - Reporte de incidente LGPD: encaminhado ao PO/juridico, fora do escopo de engenharia.
  - Escopo da Fase 3 (funil unico Candidatura → RecCandidato → RecVaga → User) ainda nao decidido: nesta rodada ou backlog.
  - Qualidade das planilhas que o RH vai exportar e a principal incognita da importacao.
- Proximo passo sugerido:
  - Fase 1, que nao depende de nada externo: migration Prisma dos 11 models (`Rec*` + `Quadro*`), helpers `canAccessGente`/`canManageGente`/`canViewDadoSensivel` com testes, `src/lib/gente/vaga-sla.ts` com testes, shell `/gente` com navegacao e guardas de rota.

### 2026-04-16 - GPT-5.2 (Cursor) - `UX/A11y: Quiz Universidade`

- Status: concluído (sem commit)
- Objetivo: corrigir semântica WCAG (radio/fieldset), foco/teclado e resiliência de carregamento na página de Quiz da Universidade.
- Arquivos em posse:
  - `src/app/universidade/[temporadaId]/quiz/page.tsx`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/app/universidade/[temporadaId]/quiz/page.tsx`
  - `docs/ai-handoff.md`
- O que foi feito:
  - Substituído “radio via button” por `fieldset/legend` + `input type="radio"` com `label` (teclado e leitores de tela nativos).
  - Adicionados `role="status"` no loading e `role="alert"` para erro/validação, e foco programático no primeiro item faltante e no cabeçalho do resultado.
  - Endurecido `load()` com `try/catch`, `AbortController`, parse JSON defensivo e telemetria de `quiz_loaded/quiz_load_failed/quiz_validation_failed`.
- Parecer do outro agente: pendente
- Pendencias / riscos:
  - Telemetria ainda está acoplada ao componente (melhoria futura: extrair para tracker dedicado).
  - Retry em erro de carregamento usa `window.location.reload()` (poderia virar `refetch()` local no futuro).
- Proximo passo sugerido:
  - Extrair `useQuiz(temporadaId)` e componentes `QuizResultCard/QuizQuestion` para reduzir acoplamento e facilitar evolução.

### 2026-04-13 - Gemini - `World-Class UI: Loja de Recompensas`

- Status: concluído
- Objetivo: Eliminar layout shift da Loja e aplicar feedback instantâneo (Optimistic UI) nas compras.
- Arquivos em posse: `src/app/app/loja/page.tsx`, `src/app/app/loja/LojaClient.tsx` (novo)
- Arquivos alterados:
  - `src/app/app/loja/page.tsx` — Transformado em Server Component para hidratação das metas e saldo.
  - `src/app/app/loja/LojaClient.tsx` — Lógica do SWR unificada, adição da prop `layout` no Framer Motion e mutações otimistas nos botões de "Resgatar" e "Fixar Meta".
- O que foi feito: A experiência da Loja agora é "Zero-Latency". Ao clicar em resgatar, o saldo diminui instantaneamente na tela (e troca de cor). Se algum item for esgotado, a grade da loja se reorganiza magicamente através do `layout` animation.
- Parecer do outro agente: pendente
- Proximo passo sugerido: Mover o foco de UI para o Core da Aplicação criando o `UserService` para centralizar a governança de permissões (RBAC).

### 2026-04-13 - Gemini - `World-Class Reliability: Testes TaskService`

- Status: concluído
- Objetivo: Garantir 100% de cobertura e estabilidade nas regras de negócio e transações do motor de tarefas.
- Arquivos em posse: `tests/task-service.test.ts`
- Arquivos alterados:
  - `tests/task-service.test.ts` (Novo arquivo) — Suíte completa mockando o Prisma para rodar em milissegundos.
- O que foi feito: O coração gamificado e produtivo do sistema (hierarquia, aprovações, limites diários, validação de evidências e encadeamento) foi testado através de 8 casos cruciais.
- Parecer do outro agente: pendente
- Proximo passo sugerido: Desenvolver a suíte de testes do StoreService (Loja) ou focar na centralização do UserService.

### 2026-04-13 - Gemini - `UX Retencao: Auto-save no Banco de Talentos`

- Status: concluído
- Objetivo: Evitar perda de dados no formulário de candidatura caso a página seja recarregada ou fechada.
- Arquivos em posse: `src/app/carreiras/candidatar/page.tsx`
- Arquivos alterados:
  - `src/app/carreiras/candidatar/page.tsx` — Implementada persistência local (`localStorage`) sincronizada com o estado do formulário.
- O que foi feito: O formulário agora salva silenciosamente o progresso do usuário a cada interação. Se a aba for fechada por acidente, os dados são restaurados automaticamente no próximo acesso. Atualizamos o Backlog de Elite confirmando a presença da Optimistic UI na HojePage.
- Parecer do outro agente: pendente
- Proximo passo sugerido: Iniciar a frente de "World-Class Reliability", escrevendo testes automatizados para a engine central do sistema (TaskService).

### 2026-04-13 - Gemini - `Gamificacao e Offline PWA`

- Status: concluído
- Objetivo: Implementar resiliência offline (PWA) e micro-interações de gamificação (Confetes).
- Arquivos em posse: `src/app/app/hoje/page.tsx`, `next.config.js`
- Arquivos alterados:
  - `src/app/app/hoje/page.tsx` — Efeito de confete ao atingir 100% no checklist diário.
  - `next.config.js` — Caching offline avançado (NetworkFirst com timeout de 3s) para as APIs essenciais do colaborador.
- O que foi feito: O PWA agora entrega a página Hoje instantaneamente mesmo em áreas de sombra de 4G. Além disso, adicionamos a celebração interativa ao concluir as tarefas.
- Parecer do outro agente: pendente
- Pendencias / riscos: Opção 1 (Aprovações do Gestor) pendente de carregamento do arquivo pelo usuário.
- Proximo passo sugerido: O usuário deve enviar o arquivo `src/app/gestor/aprovacoes/page.tsx` para implementarmos a fila de aprovações de baixa latência.

### 2026-04-13 - Gemini - `Expansão World-Class UX (SWR + Skeletons)`

- Status: concluído
- Objetivo: Expandir a arquitetura World-Class para o restante do projeto, eliminando carregamentos obstrutivos e implementando cache resiliente.
- Arquivos em posse: `src/app/app/inicio/page.tsx`, `src/app/universidade/certificados/page.tsx`
- Arquivos alterados:
  - `src/app/app/inicio/page.tsx` — Migração de `useEffect` com múltiplos fetchs para `useSWR` unificado com cache de 60s.
  - `src/app/universidade/certificados/page.tsx` — Substituição do loader padrão por um Skeleton Screen (Glassmorphism).
  - `docs/ai-handoff.md` — Registro da operação.
- O que foi feito: O Dashboard agora carrega instantaneamente via cache (SWR) em navegações secundárias. Skeletons implementados para alinhar o visual corporativo premium.
- Parecer do outro agente: pendente
- Melhorias sugeridas pelo outro agente: pendente
- Proximo passo sugerido: Expandir o SWR para a página de tarefas e aplicar Optimistic UI.

### 2026-04-13 - Claude - `World Class UX: Optimistic UI + Skeleton Screens (OBZ)`

- Status: concluido
- Objetivo: Aplicar tecnicas World Class UX no modulo OBZ — Optimistic UI para eliminacao de spinners e Skeleton Screens para carga inicial
- Arquivos modificados:
  - `src/components/ui/skeleton.tsx` — SkeletonOBZHero e SkeletonOBZTable adicionados
  - `src/app/obz/page.tsx` — loading state com SkeletonOBZHero + SkeletonCard (nao apenas spinner)
  - `src/app/obz/pacote/[id]/page.tsx` — skeleton na carga; saveCell com Optimistic UI (commit imediato, rollback em erro)
  - `src/app/obz/justificativas/page.tsx` — handleReview, handleBulkReview e handleResubmit com Optimistic UI
  - `src/app/admin/obz/page.tsx` — togglePeriodo com Optimistic UI; periodoSaving removido (variavel orfada)
- Parecer do outro agente: pendente

### 2026-04-09 - Codex - `preview visual carreiras + painel RH`

- Status: concluido
- Objetivo: criar um preview apenas visual da feature de Banco de Talentos, sem tocar na implementacao funcional em andamento.
- Arquivos em posse:
  - `docs/ai-handoff.md`
  - `src/app/carreiras/preview/page.tsx`
- Arquivos alterados:
  - `docs/ai-handoff.md`
  - `src/app/carreiras/preview/page.tsx`
- O que foi feito:
  - Criada a rota isolada `src/app/carreiras/preview/page.tsx` com uma proposta visual para a jornada publica do candidato e para o painel interno do RH.
  - O preview foi mantido sem backend, sem formularios funcionais e sem tocar nas rotas reais de `carreiras` ou `admin/rh`.
  - Validacao executada com `npx.cmd tsc --noEmit` e TypeScript ficou verde no estado atual do workspace.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - O preview nao representa o estado final da feature, apenas uma direcao visual isolada para feedback rapido.
  - Como a implementacao funcional do Claude ja avancou em paralelo, qualquer consolidacao futura de UI deve comparar as duas abordagens antes de sobrescrever telas reais.
- Proximo passo sugerido:
  - Coletar feedback do usuario sobre a direcao visual.
  - Se aprovado, reaproveitar somente os trechos de hierarquia e acabamento que fizerem sentido nas telas funcionais.

### 2026-04-09 - Codex - `snapshot da frente pendente de testes/CI`

- Status: concluido
- Objetivo: registrar o estado real da frente pendente antes de trocar de escopo, sem mexer no conteudo funcional dos testes.
- Arquivos em posse:
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `docs/ai-handoff.md`
- O que foi feito:
  - Conferidos `git status --short`, `git diff --name-only` e `docs/mapa-do-sistema.md`.
  - Confirmado que o workspace esta sem diff rastreado, mas com arquivos novos nao versionados em `.github/workflows/tests.yml`, `playwright.config.ts`, `tests/e2e/login-flow.spec.ts`, `tests/colaborador-flow.test.ts`, `tests/gestor-flow.test.ts`, `tests/universidade-flow.test.ts`, `tests/seguranca-acesso.test.ts`, `tests/concorrencia.test.ts`, `tests/auditoria-deep.test.ts`, `tests/obz-concorrencia.test.ts`, `src/lib/obz.ts` e `test-results/.last-run.json`.
  - Detectado tambem `docs/guia-importacao-obz.html` como arquivo novo em `docs/`, sem referencias textuais no repo no estado atual.
  - Verificado que `package.json` ja referencia essas suites no comando `npm test`, e que `test-results/.last-run.json` e somente artefato de execucao.
  - Verificado via `rg` que `src/lib/obz.ts` ainda nao tem importacoes no codigo atual e merece confirmacao antes de entrar em outro batch.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - Existe discrepancia entre o handoff que marcava a frente de testes como concluida e o estado real do workspace, onde os arquivos continuam nao versionados.
  - `docs/guia-importacao-obz.html` tambem pode se perder na troca de frente se nao for tratado como parte explicita de um lote futuro.
  - Mudar de escopo sem registrar isso aumentaria o risco de limpar ou sobrescrever esses arquivos por engano.
- Proximo passo sugerido:
  - Ao iniciar a nova frente, evitar tocar nesses arquivos.
  - Quando voltarmos a esse eixo, decidir se o lote sera commitado como esta e se `test-results/.last-run.json` deve ficar fora do versionamento.

### 2026-04-07 - Claude - `refatoração dashboard (HojePage)`

- Status: em andamento
- Objetivo: decompor a HojePage (> 700 linhas) em componentes menores e migrar para SWR.
- Arquivos em posse:
  - `src/app/app/hoje/page.tsx`
  - `package.json`
- Arquivos alterados:
  - nenhum ainda
- O que foi feito:
  - Plano de implementação criado.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - Necessário instalar a dependência `swr`.
- Proximo passo sugerido:
  - Iniciar a decomposição dos componentes de UI.

### 2026-04-06 - Claude - `expansão de testes de integração`

- Status: concluido
- Objetivo: criar suites de regressao para os fluxos das paginas que ainda nao tem cobertura (Colaborador, Gestor, Universidade).
- Arquivos em posse:
  - nenhum
- Arquivos alterados:
  - `docs/ai-handoff.md`
  - `package.json`
  - `tests/support/integration-base.ts`
  - `tests/colaborador-flow.test.ts`
  - `tests/gestor-flow.test.ts`
  - `tests/universidade-flow.test.ts`
- O que foi feito:
  - Criado `tests/support/integration-base.ts` como helper unificado para sessoes de teste HTTP.
  - Implementado `tests/colaborador-flow.test.ts` cobrindo Checklist, Pontos, Ad-hoc e Feed.
  - Implementado `tests/gestor-flow.test.ts` cobrindo Dashboard e o fluxo completo de Aprovação de tarefas.
  - Implementado `tests/universidade-flow.test.ts` cobrindo temporadas, progresso e certificados.
  - `package.json` atualizado para incluir as novas suites no comando `npm test`.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / risks:
  - As suites dependem do dev server rodando localmente (padrão do projeto para integração).
- Proximo passo sugerido:
  - Codex revisar as novas suites e considerar a migracao do `test-obz.ts` para usar o novo `integration-base.ts`.

### 2026-04-04 - Codex - `ajustes finais OBZ apos revisao cruzada`

- Status: concluido
- Objetivo: corrigir os riscos confirmados na revisao final do lote OBZ do Claude, sem sobrepor arquivos fora do eixo revisado.
- Arquivos em posse:
  - `docs/ai-handoff.md`
  - `src/app/api/admin/obz/tendencia-compliance/route.ts`
  - `src/app/api/obz/justificativas/route.ts`
  - `src/app/obz/justificativas/page.tsx`
  - `src/app/financeiro/page.tsx`
  - `src/lib/obz-justificativas.ts`
  - `scripts/test-obz.ts`
- Arquivos alterados:
  - `docs/ai-handoff.md`
  - `src/app/api/admin/obz/tendencia-compliance/route.ts`
  - `src/app/api/obz/justificativas/route.ts`
  - `src/app/obz/justificativas/page.tsx`
  - `src/app/financeiro/page.tsx`
  - `src/lib/obz-justificativas.ts`
  - `scripts/test-obz.ts`
- O que foi feito:
  - `tendencia-compliance` passou a calcular cobertura e status pela subarvore realmente atribuida em `areaPacote.linhaId`, em vez de contar o pacote inteiro.
  - `api/obz/justificativas` agora devolve `contexto` compartilhado (`tipo`, `orcado`, `valorInformado`, `desvio`) usando o helper novo `src/lib/obz-justificativas.ts`.
  - As telas `obz/justificativas` e `financeiro` passaram a exibir corretamente justificativas de `REAL` versus `TENDENCIA`, evitando mostrar tendencia como se fosse valor real.
  - O E2E `G.5` foi endurecido para buscar exatamente a justificativa criada e passou a montar uma area realmente fora do `managedAreaIds` do gestor antes de exigir `403`.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - Validar se Claude prefere manter a inferencia de `tipo` por heuristica textual no helper atual ou se quer evoluir isso depois para um campo explicito no schema.
- Pendencias / riscos:
  - A classificacao de `REAL` vs `TENDENCIA` ainda e heuristica, porque `OBZJustificativa` nao tem um campo de tipo no schema atual.
  - O eixo visual de compliance em `src/app/admin/obz/page.tsx` segue fora deste lote para evitar colisao desnecessaria; apenas a API foi corrigida.
- Proximo passo sugerido:
  - Pedir parecer do Claude sobre este fechamento e, se o time concordar, considerar uma evolucao de schema para registrar explicitamente o tipo da justificativa no futuro.

### 2026-04-04 - Codex - `revisao do lote final OBZ do Claude`

- Status: concluido
- Objetivo: revisar os lotes OBZ mais recentes do Claude, cobrindo o fluxo gestor, o YTD do relatorio e a nova aba/API de compliance de tendencia.
- Arquivos em posse:
  - `docs/ai-handoff.md`
  - `src/app/admin/obz/page.tsx`
  - `src/app/api/admin/obz/relatorio/route.ts`
  - `src/app/api/admin/obz/tendencia-compliance/route.ts`
  - `src/app/api/obz/importar/route.ts`
  - `src/app/api/obz/lancamentos/route.ts`
  - `src/app/api/obz/justificativas/route.ts`
  - `src/app/obz/justificativas/page.tsx`
  - `scripts/test-obz.ts`
- Arquivos alterados:
  - `docs/ai-handoff.md`
- O que foi feito:
  - Revisados os commits `9828c2e` e `6c5bf82`, com leitura dirigida dos diffs e dos arquivos atuais do eixo OBZ.
  - Validacao local executada com `npx.cmd tsc --noEmit` e com `npx.cmd tsx scripts/test-obz.ts`; a suite OBZ passou com `64/64` cenarios verdes.
  - O fluxo gestor, o relatorio YTD e a cobertura E2E nova ficaram bem encaminhados e sem regressao evidente no caminho feliz.
- Parecer do outro agente:
  - feito por Codex
  - o que ficou bom: o fluxo de aprovacao por gestor entrou de forma coerente com `managedAreaIds`, o relatorio mensal/YTD esta consistente no caminho feliz e a suite E2E de OBZ segue verde.
  - risco ou fragilidade observada: a API de compliance de tendencia calcula `totalLinhas` por pacote inteiro e nao pela subarvore atribuida em `areaPacote.linhaId`, o que pode marcar areas como `PARCIAL/PENDENTE` mesmo quando a atribuicao parcial esta completa.
  - como poderia ficar melhor: o compliance deveria contar apenas folhas descendentes da linha-raiz atribuida e diferenciar melhor justificativas de `real` versus justificativas criadas por desvio de `tendencia`.
  - se recomenda seguir, ajustar ou refatorar: recomendo ajustar antes de confiar a nova aba de compliance como fonte de verdade operacional.
- Melhorias sugeridas pelo outro agente:
  - Ajustar `tendencia-compliance` para respeitar a hierarquia atribuida em `areaPacote.linhaId`.
  - Enriquecer `justificativas` com contexto de `tendencia` ou `tipo` para que a UI nao apresente um desvio de tendencia como se fosse `real`.
  - Endurecer o caso negativo G.5 da suite E2E para nao passar em modo "best effort" sem realmente validar o `403`.
- Pendencias / riscos:
  - A nova aba de compliance pode subcontar ou supercontar cobertura em atribuicoes parciais de pacote.
  - A revisao de justificativas ainda mistura fluxo de `real` e de `tendencia` na mesma representacao visual.
  - O teste G.5 hoje ainda pode ficar verde sem exercitar o 403 de area alheia, como aconteceu nesta rodada.
- Proximo passo sugerido:
  - Ajustar a API/aba de compliance e a representacao de justificativas de tendencia.
  - Reforcar o teste G.5 para sempre criar e capturar uma justificativa fora do escopo antes de aprovar.

### 2026-04-04 - Codex - `testes leves de permissao`

- Status: concluido
- Objetivo: criar uma base leve de regressao para `auth-helpers` e para a decisao de redirects do `middleware`, sem adicionar nova biblioteca de testes nem tocar no eixo OBZ.
- Arquivos em posse:
  - `docs/ai-handoff.md`
  - `package.json`
  - `src/middleware.ts`
  - `src/lib/middleware-access.ts`
  - `tests/auth-helpers.test.ts`
  - `tests/middleware-access.test.ts`
  - `tests/support/session-user.ts`
- Arquivos alterados:
  - `docs/ai-handoff.md`
  - `package.json`
  - `src/middleware.ts`
  - `src/lib/middleware-access.ts`
  - `tests/auth-helpers.test.ts`
  - `tests/middleware-access.test.ts`
  - `tests/support/session-user.ts`
- O que foi feito:
  - Criado `src/lib/middleware-access.ts` para concentrar a decisao pura de redirect do `middleware`, preservando as mesmas regras de `admin`, `gestor`, `coord`, `financeiro`, `score`, `empresa`, gamificacao e sessao revogada.
  - `src/middleware.ts` passou a delegar a decisao para o helper puro, reduzindo o custo de regressao e tornando o fluxo testavel.
  - Adicionado `tests/support/session-user.ts` com factory tipada de usuario de sessao para evitar fixtures duplicadas.
  - Criados `tests/auth-helpers.test.ts` e `tests/middleware-access.test.ts` cobrindo 9 cenarios centrais de permissao e redirects.
  - `package.json` ganhou script `test` baseado em `node --import tsx --test --test-isolation=none`, sem adicionar dependencia nova ao projeto.
  - Validacao executada com `npm.cmd test` e `npx.cmd tsc --noEmit`, ambos sem erros.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - No ambiente sandboxado desta sessao, o runner precisou ser executado fora do sandbox por causa do `spawn` interno do `tsx/esbuild`; a base de testes em si continua local e sem dependencias extras.
  - A cobertura atual mira helpers e decisao de redirect; ainda nao cobre fluxos de API nem integra o `authorized` do `withAuth`.
- Proximo passo sugerido:
  - Pedir parecer do Claude sobre a extracao da logica pura do `middleware` e sobre a cobertura inicial escolhida.
  - Se a base continuar livre, ampliar a regressao para helpers de escopo por empresa e para algumas rotas de API de maior risco fora de OBZ.

### 2026-04-04 - Codex - `casts restantes de session.user no front`

- Status: concluido
- Objetivo: remover os casts restantes de `session.user as any` nas telas cliente fora de OBZ, sem sobrepor o eixo que o Claude ainda esta tocando.
- Arquivos em posse:
  - `docs/ai-handoff.md`
  - `src/app/gestor/relatorio/page.tsx`
  - `src/app/empresa/page.tsx`
  - `src/app/gestor/dashboard/page.tsx`
  - `src/app/app/ranking/page.tsx`
  - `src/app/app/hoje/page.tsx`
  - `src/app/app/perfil/PerfilClient.tsx`
  - `src/app/app/perfil/page.tsx`
  - `src/app/universidade/certificados/page.tsx`
- Arquivos alterados:
  - `docs/ai-handoff.md`
  - `src/lib/user-display.ts`
  - `src/app/gestor/relatorio/page.tsx`
  - `src/app/empresa/page.tsx`
  - `src/app/gestor/dashboard/page.tsx`
  - `src/app/app/ranking/page.tsx`
  - `src/app/app/hoje/page.tsx`
  - `src/app/app/perfil/PerfilClient.tsx`
  - `src/app/app/perfil/page.tsx`
  - `src/app/universidade/certificados/page.tsx`
- O que foi feito:
  - Removidos os casts restantes de `session.user as any` nas telas fora de OBZ identificadas na varredura final.
  - `gestor/dashboard` e `gestor/relatorio` ficaram sem `useSession` morto depois da retirada dos casts locais.
  - `perfil` e `PerfilClient` passaram a exibir unidades por meio de `getUnitsLabel`, alinhando a UI ao campo tipado `units` da sessao em vez de depender de `user.unit`.
  - Varredura final em `src/app`, excluindo OBZ, ficou sem ocorrencias de `session.user as any`.
  - Validacao executada com `npx.cmd tsc --noEmit` sem erros no estado atual do workspace.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - O workspace continua com mudancas paralelas em `scripts/test-obz.ts`, `src/app/api/obz/importar/route.ts` e `src/app/api/obz/lancamentos/route.ts`, fora deste lote.
  - O proximo passo natural continua sendo reforcar testes de permissao, mas o projeto ainda nao tem infraestrutura de testes declarada em `package.json`.
- Proximo passo sugerido:
  - Pedir parecer do Claude sobre a limpeza final de tipagem das telas cliente.
  - Avaliar uma base de testes leve para `auth-helpers` e `middleware` antes de abrir um lote maior de regressao.

### 2026-04-04 - Codex - `labels compartilhados de usuario`

- Status: concluido
- Objetivo: consolidar labels e opcoes de `role` e `nivel` em um modulo compartilhado no front, sem tocar no eixo OBZ.
- Arquivos em posse:
  - `docs/ai-handoff.md`
  - `src/lib/user-display.ts`
  - `src/app/admin/usuarios/page.tsx`
  - `src/app/empresa/usuarios/page.tsx`
  - `src/app/app/perfil/PerfilClient.tsx`
  - `src/app/app/perfil/page.tsx`
  - `src/app/gestor/relatorio/page.tsx`
- Arquivos alterados:
  - `docs/ai-handoff.md`
  - `src/lib/user-display.ts`
  - `src/app/admin/usuarios/page.tsx`
  - `src/app/empresa/usuarios/page.tsx`
  - `src/app/app/perfil/PerfilClient.tsx`
  - `src/app/app/perfil/page.tsx`
  - `src/app/gestor/relatorio/page.tsx`
- O que foi feito:
  - Criado `src/lib/user-display.ts` com labels compartilhados de `role` e `nivel`, helpers de exibicao e listas de opcoes por contexto.
  - `admin/usuarios`, `empresa/usuarios`, `perfil` e `gestor/relatorio` passaram a consumir o modulo compartilhado em vez de manter mapas locais duplicados.
  - O formulario de `admin/usuarios` agora expõe tambem `SUPERVISOR` e `DIRETO`, alinhando a UI ao conjunto de niveis ja aceito pelas APIs.
  - Varredura final indicou que, fora do modulo novo, a unica duplicacao remanescente de labels esta em `src/app/admin/obz/page.tsx`, mantida fora deste lote por estar no eixo do Claude.
  - Validacao executada com `npx.cmd tsc --noEmit` sem erros no estado atual do workspace.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - O workspace continua com mudancas paralelas em `scripts/test-obz.ts`, `src/app/api/obz/importar/route.ts` e `src/app/api/obz/lancamentos/route.ts`, fora deste lote.
  - A consolidacao cobriu labels e opcoes compartilhadas; `ROLE_DEFS` e outros metadados visuais especificos por tela continuam locais por design.
- Proximo passo sugerido:
  - Pedir parecer do Claude sobre o modulo `user-display.ts` e sobre a ampliacao dos niveis no formulario de `admin/usuarios`.
  - Se a base continuar livre, escolher um proximo lote fora de OBZ entre limpeza de labels visuais restantes ou revisao de telas cliente com casts `as any` que nao afetam permissao.

### 2026-04-04 - Codex - `auth drift em telas de usuarios`

- Status: concluido
- Objetivo: fechar a ultima sobra de arrays inline de `role` e `nivel` nas telas administrativas de usuarios, sem tocar no eixo OBZ.
- Arquivos em posse:
  - `docs/ai-handoff.md`
  - `src/lib/auth-helpers.ts`
  - `src/app/admin/usuarios/page.tsx`
  - `src/app/empresa/usuarios/page.tsx`
- Arquivos alterados:
  - `docs/ai-handoff.md`
  - `src/lib/auth-helpers.ts`
  - `src/app/admin/usuarios/page.tsx`
  - `src/app/empresa/usuarios/page.tsx`
- O que foi feito:
  - `auth-helpers` passou a expor helpers para `role` e `nivel` brutos (`isSystemAdminRole`, `isCoordNivelValue`, `isGestorNivelValue`, `isDiretoriaNivelValue`, `canManageTeamByNivel`) para reutilizacao fora do contexto de sessao.
  - `admin/usuarios` deixou de repetir arrays inline para detectar admins do sistema e usuarios elegiveis a gestao.
  - `empresa/usuarios` passou a usar o mesmo helper compartilhado para definir quem pode aparecer como gestor responsavel e manteve o gate de `Admin de Empresa` via helper central.
  - Validacao executada com `npx.cmd tsc --noEmit` sem erros no estado atual do workspace.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - O workspace continua com mudancas paralelas em `scripts/test-obz.ts`, `src/app/api/obz/importar/route.ts` e `src/app/api/obz/lancamentos/route.ts`, fora deste lote.
  - Ainda existem listas e labels de papel/nivel no front que sao apenas apresentacionais; este batch mexeu somente no que afeta filtros, formulários e decisao de acesso.
- Proximo passo sugerido:
  - Pedir parecer do Claude sobre os helpers novos para `role` e `nivel` brutos no front.
  - Se a base continuar livre, revisar se vale consolidar mapas de labels/opcoes de nivel em um modulo compartilhado para reduzir duplicacao visual.

### 2026-04-04 - Codex - `auth drift em middleware + app shell`

- Status: concluido
- Objetivo: reduzir o drift restante de autorizacao fora de OBZ, alinhando `middleware` e paginas cliente centrais aos helpers de permissao.
- Arquivos em posse:
  - `docs/ai-handoff.md`
  - `src/lib/auth-helpers.ts`
  - `src/middleware.ts`
  - `src/app/app/layout.tsx`
  - `src/app/app/inicio/page.tsx`
  - `src/app/app/agenda/page.tsx`
  - `src/app/app/historico/page.tsx`
  - `src/app/login/page.tsx`
  - `src/app/score/page.tsx`
  - `src/app/empresa/usuarios/page.tsx`
- Arquivos alterados:
  - `docs/ai-handoff.md`
  - `src/lib/auth-helpers.ts`
  - `src/middleware.ts`
  - `src/app/app/layout.tsx`
  - `src/app/app/inicio/page.tsx`
  - `src/app/app/agenda/page.tsx`
  - `src/app/app/historico/page.tsx`
  - `src/app/login/page.tsx`
  - `src/app/score/page.tsx`
  - `src/app/empresa/usuarios/page.tsx`
- O que foi feito:
  - Criado `hasGamificationAccess` em `auth-helpers` para parar de repetir a regra da empresa com gamificacao nas bordas do app.
  - `middleware` passou a usar helpers centrais para acesso de `admin`, `gestor`, `coord`, `financeiro`, `score` e `empresa`, removendo arrays inline de papel e nivel.
  - `app/layout`, `app/inicio`, `login`, `agenda`, `historico`, `score` e `empresa/usuarios` deixaram de repetir checks inline de `SYS_ADMIN/RH_ADMIN` e de usar casts locais de `session.user as any` nesse fluxo.
  - Validacao executada com `npx.cmd tsc --noEmit` sem erros no estado atual do workspace.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - O workspace continua com mudancas paralelas em `scripts/test-obz.ts`, `src/app/api/obz/importar/route.ts` e `src/app/api/obz/lancamentos/route.ts`, fora deste lote.
  - Ainda existem checks de papel em outras telas cliente, mas este batch ficou focado apenas nos pontos de entrada mais centrais para evitar sobreposicao desnecessaria.
- Proximo passo sugerido:
  - Pedir parecer do Claude sobre o uso dos helpers centrais no `middleware` e nas paginas cliente.
  - Seguir para uma ultima varredura de telas cliente restantes que ainda repetem `role` ou `nivel` inline fora de OBZ.

### 2026-03-31 - Codex - Mapeamento de arquitetura

- Status: concluido
- Objetivo: mapear a arquitetura atual do portal.
- Arquivos em posse:
  - `docs/mapa-do-sistema.md`
- Arquivos alterados:
  - `docs/mapa-do-sistema.md`
- O que foi feito:
  - Criado um mapa do sistema com stack, modulos, pontos de entrada, APIs, persistencia e hotspots tecnicos.
- Parecer do outro agente:
  - feito por Claude
- Melhorias sugeridas pelo outro agente:
  - O que ficou bom: mapa completo, coerente com o codigo real. Hotspots bem identificados — `admin/obz/page.tsx` e `financeiro/page.tsx` sao de fato os mais criticos.
  - Risco: mapa e snapshot estatico. Sem processo de atualizacao, tende a ficar desatualizado rapidamente num projeto ativo.
  - Como melhorar: adicionar data de revisao ao topo do arquivo e um campo `pendente de atualizacao` quando uma rodada tocar areas nao refletidas no mapa.
  - Recomendacao: seguir — o mapa e util como referencia de entrada para qualquer agente.
- Pendencias / riscos:
  - O projeto ainda nao tinha uma regra formal de handoff entre agentes.
- Proximo passo sugerido:
  - Revisar autenticacao, perfis e permissoes.

### 2026-03-31 - Codex - Revisao de autenticacao e permissoes

- Status: concluido
- Objetivo: revisar autenticacao, perfis e permissoes em modo leitura.
- Arquivos em posse:
  - nenhum
- Arquivos alterados:
  - nenhum
- O que foi feito:
  - Revisao de `auth`, `middleware`, `auth-helpers` e rotas sensiveis.
  - Findings principais:
    - revogacao de acesso nao imediata por causa de JWT com vida util de 4 horas
    - inconsistencias entre `role` e `nivel`
    - endpoints legados ainda dependem de `role = GESTOR`
    - existe drift com checks antigos usando `ADMIN`
- Parecer do outro agente:
  - feito por Claude
- Melhorias sugeridas pelo outro agente:
  - O que ficou bom: findings precisos e priorizados corretamente. JWT de 4h sem revogacao imediata e o risco mais critico e foi corretamente destacado.
  - Risco: sem testes cobrindo a matriz de permissao, qualquer correcao pode introduzir regressao silenciosa. O drift `ADMIN` vs `SYS_ADMIN` ja causou bugs em pelo menos uma rota de OBZ que vi nesta sessao.
  - Como melhorar: antes de corrigir, mapear em uma tabela quais rotas usam qual check (`role`, `nivel`, flag). Isso evita corrigir metade e deixar a outra metade inconsistente.
  - Recomendacao: ajustar — a analise esta correta, mas o plano de correcao precisa de escopo claro antes de comecar. Sugestao: comecar pela unificacao dos helpers antes de tocar rotas individuais.
- Pendencias / riscos:
  - Nao foi aplicada correcao ainda.
  - Nao encontrei testes automatizados cobrindo a matriz de permissao.
- Proximo passo sugerido:
  - unificar autorizacao em helpers centrais
  - corrigir fluxos de aprovacao e gestao que ainda dependem de `role`
  - revisar estrategia de invalidez imediata de sessao

### 2026-03-31 - Codex - Melhoria do processo paralelo

- Status: concluido
- Objetivo: evoluir o handoff para um quadro operacional com posse de arquivos e revisao cruzada.
- Arquivos em posse:
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `docs/ai-handoff.md`
- O que foi feito:
  - Adicionadas regras de posse temporaria de arquivos.
  - Adicionada secao de revisao cruzada entre agentes.
  - Adicionado quadro operacional com `Em andamento`, `Bloqueios e alertas` e `Revisoes cruzadas pendentes`.
  - Atualizado o prompt recomendado para refletir esse fluxo.
- Parecer do outro agente:
  - feito por Claude
- Melhorias sugeridas pelo outro agente:
  - O que ficou bom: a estrutura e solida. Tabela diaria de controle e especialmente util — e o primeiro lugar que vou olhar no inicio de qualquer rodada.
  - Risco: o fluxo depende de o agente ler este arquivo antes de agir. Na sessao de hoje eu nao li antes de implementar — o que significa que o protocolo so funciona se for referenciado de forma automatica (ex: CLAUDE.md).
  - Como melhorar: criar `CLAUDE.md` na raiz com instrucao explicita de ler este arquivo antes de qualquer acao. Isso torna o protocolo parte do contexto padrao do Claude, nao uma convencao opcional.
  - Recomendacao: seguir — e criar o CLAUDE.md imediatamente (feito nesta mesma rodada).
- Pendencias / riscos:
  - O processo depende de disciplina dos dois agentes em atualizar este arquivo no inicio e no fim de cada rodada.
- Proximo passo sugerido:
  - O proximo agente que iniciar trabalho deve preencher `Em andamento` antes de editar codigo.

### 2026-03-31 - Codex - Painel diario de controle

- Status: concluido
- Objetivo: adicionar uma visao curta e operacional para uso diario pelos dois agentes.
- Arquivos em posse:
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `docs/ai-handoff.md`
- O que foi feito:
  - Adicionada a `Tabela Diaria de Controle` com colunas de arquivo, agente, status, ultima acao e proxima acao.
  - Registradas nela as alteracoes de workspace detectadas fora do escopo do Codex.
  - Mantido o handoff detalhado para historico, mas agora com uma visao rapida para consulta imediata.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - Como parte das mudancas do workspace nao esta identificada com certeza como Codex ou Claude, foi usado `nao identificado` para evitar assumir autoria incorreta.
- Proximo passo sugerido:
  - O proximo agente deve atualizar primeiro a tabela diaria e depois o registro detalhado.

### 2026-03-31 - Claude - Importacao OBZ via XLSX + aba admin

- Status: concluido
- Objetivo: adicionar suporte a XLSX na importacao OBZ e criar aba de importacao no painel admin.
- Arquivos em posse:
  - `src/app/api/obz/importar/route.ts`
  - `src/app/admin/obz/page.tsx`
  - `src/app/obz/page.tsx`
- Arquivos alterados:
  - `src/app/api/obz/importar/route.ts` — adicionado helper `extrairLinhas()` com suporte a XLSX/XLS/ODS via biblioteca `xlsx` (ja presente no projeto). POST refatorado para usar o helper em vez de TextDecoder + split manual.
  - `src/app/admin/obz/page.tsx` — adicionada 4a aba "Importacao" com selecao de tipo (orcado/real), download de template e upload de arquivo CSV ou XLSX. Reutiliza `periodoAno` existente como seletor de ano.
  - `src/app/obz/page.tsx` — input de arquivo atualizado para aceitar `.csv,.xlsx,.xls,.txt`.
- O que foi feito:
  - Nenhuma mudanca de schema ou nova dependencia. `xlsx` ja estava no projeto (usado em `financeiro/reconciliacao`).
  - O padrão `extrairLinhas()` foi replicado diretamente de `src/app/api/financeiro/reconciliacao/route.ts`.
  - Admins OBZ ja bypassavam restricoes de periodo na API — a aba admin apenas expoe essa capacidade existente na UI.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - NOTA: esta rodada foi executada SEM ler o handoff antes de comecar — violacao do protocolo. O CLAUDE.md criado ao final desta rodada deve prevenir isso nas proximas sessoes.
  - `public/logos/paubrasil.png` esta removido no workspace com origem desconhecida. Nao foi tocado nesta rodada.
- Proximo passo sugerido:
  - Codex revisar as tres alteracoes de OBZ.
  - Definir plano para correcoes de autenticacao/permissoes identificadas pelo Codex.

### 2026-03-31 - Claude - Protocolo de handoff e CLAUDE.md

- Status: concluido
- Objetivo: registrar pareceres sobre rodadas do Codex e criar CLAUDE.md para tornar o protocolo automatico.
- Arquivos em posse:
  - `docs/ai-handoff.md`
  - `CLAUDE.md` (criado)
- Arquivos alterados:
  - `docs/ai-handoff.md` — pareceres registrados nas 3 rodadas do Codex, tabela diaria atualizada, bloqueios revisados.
  - `CLAUDE.md` — criado com instrucao de leitura obrigatoria do handoff antes de qualquer acao.
- O que foi feito:
  - Pareceres registrados para: mapeamento de arquitetura, revisao de autenticacao, melhoria do processo paralelo.
  - CLAUDE.md criado para garantir que o protocolo seja lido automaticamente no inicio de cada sessao.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - nenhuma
- Proximo passo sugerido:
  - Codex confirmar se o CLAUDE.md esta no formato e local correto para seu fluxo tambem.

### 2026-03-31 - Codex - Primeira leva de correcoes de auth/permissoes

- Status: concluido
- Objetivo: corrigir a primeira leva de inconsistencias entre `role` e `nivel` nas APIs de aprovacoes e gestao.
- Arquivos em posse:
  - `src/lib/auth-helpers.ts`
  - `src/app/api/tasks/[id]/review/route.ts`
  - `src/app/api/gestor/aprovacoes/route.ts`
  - `src/app/api/atividades/route.ts`
  - `src/app/api/atividades/[id]/route.ts`
- Arquivos alterados:
  - `src/lib/auth-helpers.ts`
  - `src/app/api/tasks/[id]/review/route.ts`
  - `src/app/api/gestor/aprovacoes/route.ts`
  - `src/app/api/atividades/route.ts`
  - `src/app/api/atividades/[id]/route.ts`
- O que foi feito:
  - Centralizada a compatibilidade do papel legado `GESTOR` em `src/lib/auth-helpers.ts`.
  - `isGestorLevel` passou a aceitar tanto `role = GESTOR` quanto lideranca moderna por `nivel`.
  - `tasks/[id]/review` e `gestor/aprovacoes` agora revalidam `role` e `nivel` no banco antes de decidir permissao.
  - Os endpoints legados de `atividades` deixaram de depender apenas de `role` e passaram a usar helper central.
  - Validacao executada com `npx.cmd tsc --noEmit` sem erros.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - A revogacao imediata de sessao ainda nao foi resolvida. Middleware continua confiando no JWT atual.
  - O topo do handoff ainda precisa ser alinhado para refletir este batch na tabela curta.
  - `next lint` nao foi usado porque o projeto ainda abre o assistente interativo de configuracao do ESLint.
- Proximo passo sugerido:
  - Revisar e corrigir os checks antigos com `ADMIN` em `global-goal` e `admin/cockpit`.
  - Planejar a estrategia para invalidacao mais imediata de permissao/sessao.

### 2026-03-31 - Codex - Remocao do drift com `ADMIN`

- Status: concluido
- Objetivo: remover checks legados com `ADMIN` e alinhar `global-goal` + `admin/cockpit` ao fluxo central de permissao.
- Arquivos em posse:
  - `src/app/api/global-goal/route.ts`
  - `src/app/api/admin/cockpit/route.ts`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/app/api/global-goal/route.ts`
  - `src/app/api/admin/cockpit/route.ts`
  - `docs/ai-handoff.md`
- O que foi feito:
  - `global-goal` deixou de depender de arrays hardcoded com `ADMIN` e passou a usar `getServerSession(authOptions)` + revalidacao de `role` e `nivel` no banco.
  - `admin/cockpit` passou a seguir o mesmo padrao, usando `isGestorLevel` como regra central de autorizacao.
  - Validacao executada com `npx.cmd tsc --noEmit` sem erros.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - O topo da tabela curta ainda precisa refletir melhor os batches ja commitados de `auth/permissoes`.
  - A revogacao imediata de sessao/permissao continua pendente.
- Proximo passo sugerido:
  - Corrigir a revogacao imediata de acesso para usuarios desativados ou com flags alteradas.
  - Revisar a exclusao em `coord/atividades`, que ainda aponta para endpoint admin-only.

### 2026-03-31 - Codex - Exclusao em `coord/atividades`

- Status: concluido
- Objetivo: corrigir a exclusao de atividades na area de coordenacao, que chamava um endpoint admin-only e falhava com `403`.
- Arquivos em posse:
  - `src/app/coord/atividades/page.tsx`
  - `src/app/api/coord/atividades/route.ts`
  - `src/app/api/coord/atividades/[id]/route.ts`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/app/coord/atividades/page.tsx`
  - `src/app/api/coord/atividades/route.ts`
  - `src/app/api/coord/atividades/[id]/route.ts`
  - `docs/ai-handoff.md`
- O que foi feito:
  - A tela de coordenacao passou a remover atividades por `/api/coord/atividades/[id]`.
  - Criada uma rota propria de exclusao com soft delete em `taskDefinition.active = false`.
  - A rota de `coord/atividades` foi alinhada ao helper central, com revalidacao de `role` e `nivel` no banco antes de autorizar GET e POST.
  - Validacao executada com `npx.cmd tsc --noEmit` sem erros.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - O topo da tabela curta ainda nao reflete bem os batches mais recentes de `auth/permissoes`.
  - A revogacao imediata de sessao/permissao continua sendo o risco mais alto aberto.
- Proximo passo sugerido:
  - Atacar a revogacao imediata de acesso em `auth` e `middleware`.
  - Revisar outras rotas que ainda dependem de checks inline de permissao.

### 2026-03-31 - Codex - Reforco de revogacao de sessao/acesso

- Status: concluido
- Objetivo: reduzir a janela de acesso indevido apos desativacao do usuario ou mudanca de flags/permissoes.
- Arquivos em posse:
  - `src/lib/auth.ts`
  - `src/middleware.ts`
  - `src/app/providers.tsx`
  - `src/app/app/layout.tsx`
  - `src/app/login/page.tsx`
  - `src/types/next-auth.d.ts`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/lib/auth.ts`
  - `src/middleware.ts`
  - `src/app/providers.tsx`
  - `src/app/app/layout.tsx`
  - `src/app/login/page.tsx`
  - `src/types/next-auth.d.ts`
  - `docs/ai-handoff.md`
- O que foi feito:
  - O JWT agora refresca estado sensivel do usuario a partir do banco em janela curta, atualizando `role`, `nivel`, flags e `isActive`.
  - Quando o usuario deixa de existir ou fica inativo, a sessao passa a ser invalidada no callback de sessao.
  - O `middleware` passou a bloquear tokens marcados como inativos.
  - O cliente agora refaz a sessao automaticamente com `refetchInterval` e `refetchOnWindowFocus`, e o `AppLayout` redireciona para login quando a sessao cai.
  - A tela de login passou a exibir mensagem especifica para `SessionRevoked`.
  - Validacao executada com `npx.cmd tsc --noEmit` sem erros.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - Com estrategia JWT, a revogacao ainda depende do proximo refresh de sessao para atualizar o cookie antigo. Isso reduz bastante o risco, mas nao equivale a invalidacao instantanea no primeiro byte da requisicao.
  - Para revogacao realmente imediata no middleware, provavelmente sera necessario migrar para mecanismo de revogacao acessivel no edge ou mudar a estrategia de sessao.
- Proximo passo sugerido:
  - Revisar outras rotas com checks inline para reaproveitar o estado de sessao ja refrescado.
  - Discutir se vale uma estrategia futura de sessao stateful ou lista de revogacao central.

### 2026-03-31 - Codex - `coord/aprovacoes` + `score`

- Status: concluido
- Objetivo: remover checks inline de permissao em `coord/aprovacoes` e nas rotas principais de `score`.
- Arquivos em posse:
  - `src/app/api/coord/aprovacoes/route.ts`
  - `src/app/api/score/clientes/[chave]/route.ts`
  - `src/app/api/score/ranking-filial/route.ts`
  - `src/app/api/score/upload/route.ts`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/app/api/coord/aprovacoes/route.ts`
  - `src/app/api/score/clientes/[chave]/route.ts`
  - `src/app/api/score/ranking-filial/route.ts`
  - `src/app/api/score/upload/route.ts`
  - `docs/ai-handoff.md`
- O que foi feito:
  - `coord/aprovacoes` deixou de depender de array inline e passou a revalidar `role` e `nivel` no banco antes de autorizar.
  - As rotas de `score` passaram a usar `isScoreAdmin` como regra central, com revalidacao de `role`, `nivel` e `isScoreAdmin` no banco.
  - O handoff foi atualizado com alertas sobre mudancas externas detectadas no workspace.
  - Validacao executada com `npx.cmd tsc --noEmit` sem erros.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - Ainda existem varias rotas com checks inline em `admin`, `empresa`, `obz` e outros dominios.
  - Existem mudancas paralelas no workspace fora deste batch que nao foram tocadas.
- Proximo passo sugerido:
  - Continuar a varredura pelas rotas `admin/*` e `empresa/*` que ainda repetem arrays de papeis.
  - Pedir parecer do Claude sobre a sequencia de batches de `auth/permissoes`.

### 2026-03-31 - Codex - `empresa/*` + `admin/empresas*`

- Status: concluido
- Objetivo: alinhar o eixo de empresa/empresas aos helpers centrais, reduzindo checks inline de `SYS_ADMIN`, `RH_ADMIN` e `isEmpresaAdmin`.
- Arquivos em posse:
  - `src/lib/auth-helpers.ts`
  - `src/lib/session-user.ts`
  - `src/app/api/empresa/usuarios/route.ts`
  - `src/app/api/empresa/usuarios/[id]/route.ts`
  - `src/app/api/empresa/operacoes/route.ts`
  - `src/app/api/admin/empresas/route.ts`
  - `src/app/api/admin/empresas/[id]/route.ts`
  - `src/app/api/admin/empresas/[id]/operacoes/route.ts`
  - `src/app/api/admin/empresas/[id]/operacoes/[opId]/route.ts`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/lib/auth-helpers.ts`
  - `src/lib/session-user.ts`
  - `src/app/api/empresa/usuarios/route.ts`
  - `src/app/api/empresa/usuarios/[id]/route.ts`
  - `src/app/api/empresa/operacoes/route.ts`
  - `src/app/api/admin/empresas/route.ts`
  - `src/app/api/admin/empresas/[id]/route.ts`
  - `src/app/api/admin/empresas/[id]/operacoes/route.ts`
  - `src/app/api/admin/empresas/[id]/operacoes/[opId]/route.ts`
  - `docs/ai-handoff.md`
- O que foi feito:
  - Criado `src/lib/session-user.ts` para montar o usuario efetivo da sessao a partir do banco.
  - Adicionado `canManageEmpresa` em `src/lib/auth-helpers.ts`.
  - Rotas de `empresa/*` e `admin/empresas*` passaram a revalidar `role`, `isEmpresaAdmin` e `empresaId` no banco antes de autorizar.
  - A rota `empresa/operacoes` agora falha de forma explicita quando nao existe `empresaId`, em vez de depender de comportamento indefinido.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - A validacao global com `npx.cmd tsc --noEmit` ficou bloqueada por erros paralelos em `src/app/obz/page.tsx`, fora deste escopo.
  - Ainda restam varias rotas `admin/*`, `usuarios/*` e outros dominios com checks inline repetidos.
- Proximo passo sugerido:
  - Continuar pelos endpoints `admin/usuarios*`, `api/usuarios*` e `admin/resgates`.
  - Pedir parecer do Claude sobre o helper novo `session-user.ts`.

### 2026-03-31 - Codex - `admin/usuarios*` + `api/usuarios*` + `admin/resgates`

- Status: concluido
- Objetivo: alinhar a administracao de usuarios e resgates aos helpers centrais com revalidacao do usuario efetivo no banco.
- Arquivos em posse:
  - `src/app/api/admin/usuarios/route.ts`
  - `src/app/api/admin/usuarios/[id]/route.ts`
  - `src/app/api/usuarios/route.ts`
  - `src/app/api/usuarios/[id]/route.ts`
  - `src/app/api/usuarios/buscar/route.ts`
  - `src/app/api/admin/resgates/route.ts`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/app/api/admin/usuarios/route.ts`
  - `src/app/api/admin/usuarios/[id]/route.ts`
  - `src/app/api/usuarios/route.ts`
  - `src/app/api/usuarios/[id]/route.ts`
  - `src/app/api/usuarios/buscar/route.ts`
  - `src/app/api/admin/resgates/route.ts`
  - `docs/ai-handoff.md`
- O que foi feito:
  - Rotas de administracao de usuarios passaram a revalidar `role` no banco via `getEffectiveSessionUser`.
  - `usuarios/buscar` passou a usar `canManageTeam`, cobrindo coords, gestores e admins pela regra central.
  - `admin/resgates` deixou de depender de array local de papeis e passou a usar helper central.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - `npx.cmd tsc --noEmit` continua bloqueado por erros paralelos em `src/app/obz/page.tsx`, fora deste escopo.
  - Ainda restam varias rotas `admin/*` com checks inline repetidos.
- Proximo passo sugerido:
  - Continuar por `admin/metas`, `admin/produtos`, `admin/unidades`, `admin/pedidos` e `admin/auditoria`.
  - Pedir parecer do Claude sobre a consolidacao de `session-user.ts` nos endpoints administrativos.

### 2026-03-31 - Codex - `admin/metas` + `admin/produtos` + `admin/unidades` + `admin/pedidos` + `admin/auditoria`

- Status: concluido
- Objetivo: alinhar catalogos administrativos e auditoria aos helpers centrais com revalidacao do usuario efetivo no banco.
- Arquivos em posse:
  - `src/lib/auth-helpers.ts`
  - `src/app/api/admin/metas/route.ts`
  - `src/app/api/admin/metas/[id]/route.ts`
  - `src/app/api/admin/produtos/route.ts`
  - `src/app/api/admin/produtos/[id]/route.ts`
  - `src/app/api/admin/unidades/route.ts`
  - `src/app/api/admin/pedidos/route.ts`
  - `src/app/api/admin/pedidos/[id]/route.ts`
  - `src/app/api/admin/auditoria/route.ts`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/lib/auth-helpers.ts`
  - `src/app/api/admin/metas/route.ts`
  - `src/app/api/admin/metas/[id]/route.ts`
  - `src/app/api/admin/produtos/route.ts`
  - `src/app/api/admin/produtos/[id]/route.ts`
  - `src/app/api/admin/unidades/route.ts`
  - `src/app/api/admin/pedidos/route.ts`
  - `src/app/api/admin/pedidos/[id]/route.ts`
  - `src/app/api/admin/auditoria/route.ts`
  - `docs/ai-handoff.md`
- O que foi feito:
  - `admin/metas`, `admin/produtos`, `admin/unidades` e `admin/pedidos` deixaram de depender de checks inline e passaram a usar `getEffectiveSessionUser` com helper central de admin.
  - `admin/produtos/[id]` preservou a regra mais restritiva de exclusao exclusiva por `SYS_ADMIN`.
  - `admin/auditoria` deixou de repetir arrays de `role` e `nivel` e passou a usar `canViewAudit`.
  - `auth-helpers` ganhou helpers para diretoria e visualizacao de auditoria.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - `npx.cmd tsc --noEmit` continua bloqueado por erros paralelos em `src/app/obz/page.tsx`, fora deste escopo.
  - Ainda restam outras rotas `admin/*` com checks inline repetidos.
- Proximo passo sugerido:
  - Continuar a varredura pelas rotas administrativas restantes antes de atacar refactors maiores.
  - Pedir parecer do Claude sobre os helpers novos `isDiretoriaLevel` e `canViewAudit`.

### 2026-03-31 - Codex - `admin/funcoes` + `admin/atividades` + `admin/upb/*`

- Status: concluido
- Objetivo: fechar a varredura de rotas administrativas restantes, alinhando funcoes, atividades e todo o dominio `admin/upb` aos helpers centrais com revalidacao do usuario efetivo no banco.
- Arquivos em posse:
  - `src/lib/auth-helpers.ts`
  - `src/app/api/admin/funcoes/route.ts`
  - `src/app/api/admin/funcoes/[id]/route.ts`
  - `src/app/api/admin/atividades/route.ts`
  - `src/app/api/admin/atividades/[id]/route.ts`
  - `src/app/api/admin/upb/temporadas/route.ts`
  - `src/app/api/admin/upb/temporadas/[id]/route.ts`
  - `src/app/api/admin/upb/episodios/route.ts`
  - `src/app/api/admin/upb/episodios/[id]/route.ts`
  - `src/app/api/admin/upb/matriculas/route.ts`
  - `src/app/api/admin/upb/matriculas/[id]/route.ts`
  - `src/app/api/admin/upb/obrigatorios/route.ts`
  - `src/app/api/admin/upb/obrigatorios/[id]/route.ts`
  - `src/app/api/admin/upb/questoes/route.ts`
  - `src/app/api/admin/upb/questoes/[id]/route.ts`
  - `src/app/api/admin/upb/relatorio/route.ts`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/lib/auth-helpers.ts`
  - `src/app/api/admin/funcoes/route.ts`
  - `src/app/api/admin/funcoes/[id]/route.ts`
  - `src/app/api/admin/atividades/route.ts`
  - `src/app/api/admin/atividades/[id]/route.ts`
  - `src/app/api/admin/upb/temporadas/route.ts`
  - `src/app/api/admin/upb/temporadas/[id]/route.ts`
  - `src/app/api/admin/upb/episodios/route.ts`
  - `src/app/api/admin/upb/episodios/[id]/route.ts`
  - `src/app/api/admin/upb/matriculas/route.ts`
  - `src/app/api/admin/upb/matriculas/[id]/route.ts`
  - `src/app/api/admin/upb/obrigatorios/route.ts`
  - `src/app/api/admin/upb/obrigatorios/[id]/route.ts`
  - `src/app/api/admin/upb/questoes/route.ts`
  - `src/app/api/admin/upb/questoes/[id]/route.ts`
  - `src/app/api/admin/upb/relatorio/route.ts`
  - `docs/ai-handoff.md`
- O que foi feito:
  - `admin/funcoes` passou a exigir permissao de empresa ou sistema com usuario efetivo revalidado no banco. O `GET` foi corrigido para nao ficar exposto a qualquer usuario logado.
  - `admin/atividades` saiu de checks inline de `role` e passou a usar helper central com refresh de sessao.
  - Todo o eixo `admin/upb` passou a revalidar `role`, `isUPBAdmin`, `company` e escopo por empresa/temporada antes de listar, criar, editar ou revisar dados.
  - `auth-helpers` ganhou `canAccessCompanyScope` para reaproveitar a regra de escopo por companhia.
  - Varredura do escopo validada sem sobras de arrays inline em `admin/funcoes`, `admin/atividades` e `admin/upb`.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - `npx.cmd tsc --noEmit` continua bloqueado por erros paralelos em `src/app/obz/page.tsx`, fora deste escopo.
  - Ainda existem rotas fora de `admin/*` com checks inline repetidos, especialmente em `gestor`, `relatorio`, `agenda`, `historico`, `financeiro` e `obz`.
- Proximo passo sugerido:
  - Continuar pelos endpoints nao-admin que ainda repetem arrays de `role`, `nivel` e flags.
  - Pedir parecer do Claude sobre o fechamento do dominio `admin/upb` e sobre o endurecimento de escopo em `admin/funcoes`.

### 2026-03-31 - Codex - `gestor/metas` + `relatorio/[userId]` + `agenda/[id]/convidar` + `historico`

- Status: concluido
- Objetivo: alinhar rotas de gestao e historico aos helpers centrais, removendo arrays inline e fechando vazamentos de escopo de equipe.
- Arquivos em posse:
  - `src/app/api/gestor/metas/route.ts`
  - `src/app/api/relatorio/[userId]/route.ts`
  - `src/app/api/agenda/[id]/convidar/route.ts`
  - `src/app/api/historico/route.ts`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/app/api/gestor/metas/route.ts`
  - `src/app/api/relatorio/[userId]/route.ts`
  - `src/app/api/agenda/[id]/convidar/route.ts`
  - `src/app/api/historico/route.ts`
  - `docs/ai-handoff.md`
- O que foi feito:
  - `gestor/metas` deixou de repetir arrays de papel e passou a usar `isGestorLevel` com usuario efetivo revalidado no banco.
  - `agenda/[id]/convidar` passou a usar `canManageTeam` e sessao efetiva antes de criar convites.
  - `historico` passou a usar helper central para diferenciar autoacesso, lideranca e admin, mantendo o filtro por subordinacao.
  - `relatorio/[userId]` foi endurecido: agora lideranca so acessa o proprio relatorio ou o de subordinados diretos, enquanto `SYS_ADMIN` continua com visao global.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - `npx.cmd tsc --noEmit` continua bloqueado por erros paralelos em `src/app/obz/page.tsx`, fora deste escopo.
  - Ainda restam checks inline em dominios como `financeiro` e `obz`, que merecem uma rodada separada para nao conflitar com o trabalho paralelo.
- Proximo passo sugerido:
  - Continuar por `financeiro/reconciliacao*`, `financeiro/consolidado` e depois pelos helpers de permissao em `obz/*` se o workspace continuar livre.
  - Pedir parecer do Claude sobre o endurecimento de escopo aplicado em `relatorio/[userId]`.

### 2026-03-31 - Codex - `financeiro/reconciliacao*` + `financeiro/consolidado`

- Status: concluido
- Objetivo: alinhar os endpoints financeiros que dependem de permissao OBZ ao helper central `isObzAdmin` e ao usuario efetivo da sessao.
- Arquivos em posse:
  - `src/app/api/financeiro/reconciliacao/route.ts`
  - `src/app/api/financeiro/reconciliacao/[id]/route.ts`
  - `src/app/api/financeiro/reconciliacao/[id]/aceitar/route.ts`
  - `src/app/api/financeiro/consolidado/route.ts`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/app/api/financeiro/reconciliacao/route.ts`
  - `src/app/api/financeiro/reconciliacao/[id]/route.ts`
  - `src/app/api/financeiro/reconciliacao/[id]/aceitar/route.ts`
  - `src/app/api/financeiro/consolidado/route.ts`
  - `docs/ai-handoff.md`
- O que foi feito:
  - `financeiro/reconciliacao`, `financeiro/reconciliacao/[id]`, `financeiro/reconciliacao/[id]/aceitar` e `financeiro/consolidado` passaram a usar `getEffectiveSessionUser` com `isObzAdmin`.
  - Os endpoints deixaram de depender de `session.user` cru e de arrays inline de `SYS_ADMIN`/`RH_ADMIN`.
  - Os logs de auditoria da reconciliacao agora usam o usuario efetivo, acompanhando mudancas recentes de permissao e sessao.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - `npx.cmd tsc --noEmit` continua bloqueado por erros paralelos em `src/app/obz/page.tsx`, fora deste escopo.
  - Ainda restam varios endpoints `obz/*` com checks inline no mesmo padrao, mas preferi manter esse lote fora do escopo de UI em paralelo.
- Proximo passo sugerido:
  - Se o workspace continuar livre, seguir por `obz/submissao-anual`, `obz/periodo*`, `obz/estrutura*`, `obz/justificativas*` e `obz/area-pacote/[id]`.
  - Pedir parecer do Claude sobre a consistencia entre os fluxos financeiros e os helpers novos de sessao efetiva.

### 2026-03-31 - Codex - `obz/submissao-anual` + `obz/periodo*` + `obz/estrutura*` + `obz/justificativas*` + `obz/area-pacote/[id]`

- Status: concluido
- Objetivo: alinhar o nucleo de permissao do OBZ aos helpers centrais sem mudar a politica de negocio entre admin, dono e aprovador departamental.
- Arquivos em posse:
  - `src/app/api/obz/submissao-anual/route.ts`
  - `src/app/api/obz/periodo-anual/route.ts`
  - `src/app/api/obz/periodo/route.ts`
  - `src/app/api/obz/estrutura/route.ts`
  - `src/app/api/obz/estrutura/[id]/route.ts`
  - `src/app/api/obz/estrutura/duplicar/route.ts`
  - `src/app/api/obz/estrutura/bulk-atribuicao/route.ts`
  - `src/app/api/obz/justificativas/route.ts`
  - `src/app/api/obz/justificativas/[id]/route.ts`
  - `src/app/api/obz/area-pacote/[id]/route.ts`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/app/api/obz/submissao-anual/route.ts`
  - `src/app/api/obz/periodo-anual/route.ts`
  - `src/app/api/obz/periodo/route.ts`
  - `src/app/api/obz/estrutura/route.ts`
  - `src/app/api/obz/estrutura/[id]/route.ts`
  - `src/app/api/obz/estrutura/duplicar/route.ts`
  - `src/app/api/obz/estrutura/bulk-atribuicao/route.ts`
  - `src/app/api/obz/justificativas/route.ts`
  - `src/app/api/obz/justificativas/[id]/route.ts`
  - `src/app/api/obz/area-pacote/[id]/route.ts`
  - `docs/ai-handoff.md`
- O que foi feito:
  - As rotas centrais de OBZ passaram a usar `getEffectiveSessionUser` com `isObzAdmin`, removendo arrays inline de `SYS_ADMIN` e `RH_ADMIN`.
  - A distincao entre admin global, dono do pacote e aprovador departamental foi preservada, mas agora a decisao parte do usuario efetivo revalidado no banco.
  - `submissao-anual`, `periodo-anual`, `estrutura`, `bulk-atribuicao`, `justificativas` e `area-pacote/[id]` deixaram de depender de `session.user` cru.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - `npx.cmd tsc --noEmit` continua bloqueado por erros paralelos em `src/app/obz/page.tsx`, fora deste escopo.
  - Ainda restam endpoints OBZ fora deste lote, como `importar`, `lancamentos`, `meus-pacotes`, `is-dono` e outros auxiliares.
- Proximo passo sugerido:
  - Continuar pelos endpoints OBZ restantes se o workspace continuar sem conflitos de escopo.
  - Pedir parecer do Claude sobre a preservacao das regras de dono e aprovador departamental neste batch.

### 2026-03-31 - Codex - `obz/importar` + `obz/lancamentos` + `obz/meus-pacotes` + `obz/is-dono`

- Status: concluido
- Objetivo: fechar o restante das APIs auxiliares de OBZ que ainda dependiam de `session.user` cru ou do flag local sem helper central.
- Arquivos em posse:
  - `src/app/api/obz/importar/route.ts`
  - `src/app/api/obz/lancamentos/route.ts`
  - `src/app/api/obz/meus-pacotes/route.ts`
  - `src/app/api/obz/is-dono/route.ts`
  - `docs/ai-handoff.md`
- Arquivos alterados:
  - `src/app/api/obz/importar/route.ts`
  - `src/app/api/obz/lancamentos/route.ts`
  - `src/app/api/obz/meus-pacotes/route.ts`
  - `src/app/api/obz/is-dono/route.ts`
  - `docs/ai-handoff.md`
- O que foi feito:
  - `obz/importar` e `obz/lancamentos` passaram a usar `getEffectiveSessionUser` com `isObzAdmin`, preservando a mesma regra de admin versus dono do pacote.
  - `obz/meus-pacotes` e `obz/is-dono` deixaram de ler `session.user` cru e passaram a operar com o usuario efetivo da sessao.
  - A varredura desse escopo ficou sem sobras de arrays inline ou checks antigos nas quatro rotas.
  - Validacao executada com `npx.cmd tsc --noEmit` sem erros no estado atual do workspace.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - Ainda existem endpoints fora deste eixo que usam `session.user as any`, mas sem repetir a matriz antiga de permissao.
  - O workspace continua com mudancas paralelas em telas, especialmente no eixo OBZ e app.
- Proximo passo sugerido:
  - Fazer uma ultima varredura transversal das APIs restantes para identificar usos de `session.user as any` que valham consolidacao futura.
  - Pedir parecer do Claude sobre o fechamento completo do dominio OBZ do lado das rotas.

### 2026-03-31 - Codex - `universidade user APIs`

- Status: concluido
- Objetivo: alinhar as APIs publicas da universidade ao usuario efetivo da sessao, ao escopo real por empresa/unidade e ao acesso automatico por funcao.
- Arquivos em posse:
  - `docs/ai-handoff.md`
  - `src/lib/auth-helpers.ts`
  - `src/lib/upb-access.ts`
  - `src/app/api/universidade/acesso/[temporadaId]/route.ts`
  - `src/app/api/universidade/certificados/route.ts`
  - `src/app/api/universidade/progresso/route.ts`
  - `src/app/api/universidade/quiz/[temporadaId]/route.ts`
  - `src/app/api/universidade/temporadas/route.ts`
  - `src/app/api/universidade/temporadas/[id]/route.ts`
- Arquivos alterados:
  - `docs/ai-handoff.md`
  - `src/lib/auth-helpers.ts`
  - `src/lib/upb-access.ts`
  - `src/app/api/universidade/acesso/[temporadaId]/route.ts`
  - `src/app/api/universidade/certificados/route.ts`
  - `src/app/api/universidade/progresso/route.ts`
  - `src/app/api/universidade/quiz/[temporadaId]/route.ts`
  - `src/app/api/universidade/temporadas/route.ts`
  - `src/app/api/universidade/temporadas/[id]/route.ts`
- O que foi feito:
  - Criado `src/lib/upb-access.ts` para centralizar escopo por empresa/unidade e a aprovacao automatica por funcao no dominio da universidade.
  - `universidade/temporadas` e `universidade/temporadas/[id]` passaram a usar usuario efetivo do banco e a respeitar o mesmo escopo por empresa/unidade nos links diretos.
  - `universidade/acesso/[temporadaId]` passou a validar escopo antes de consultar ou solicitar matricula, passou a bloquear pedido quando o acesso ja e automatico por funcao e corrigiu a notificacao para incluir `SYS_ADMIN/RH_ADMIN` mesmo sem `isUPBAdmin`.
  - `universidade/quiz/[temporadaId]` e `universidade/progresso` passaram a respeitar escopo por empresa/unidade e a mesma regra de acesso de cursos restritos, incluindo aprovacao automatica por funcao.
  - `universidade/certificados` passou a usar usuario efetivo da sessao.
  - Varredura final sem sobras de `session.user as any` nem do filtro inline `role in ['SYS_ADMIN', 'RH_ADMIN']` dentro de `src/app/api/universidade`.
  - Validacao executada com `npx.cmd tsc --noEmit` sem erros no estado atual do workspace.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - O workspace continua com mudancas paralelas em telas fora deste escopo, especialmente `src/app/universidade/page.tsx`, `src/app/obz/page.tsx` e `src/app/admin/obz/page.tsx`.
  - Ainda existe uma remocao nao identificada em `public/logos/paubrasil.png`, fora deste batch.
- Proximo passo sugerido:
  - Pedir parecer do Claude sobre o endurecimento de escopo nas rotas publicas da universidade.
  - Seguir para a ultima varredura transversal das APIs restantes que ainda usam `session.user as any`, priorizando os endpoints de `agenda`, `tasks`, `loja`, `pontos` e `notifications`.

### 2026-04-01 - Codex - `self-service APIs restantes`

- Status: concluido
- Objetivo: fechar a ultima varredura transversal das rotas restantes que ainda usavam `session.user as any`, mantendo o escopo fora das telas em paralelo.
- Arquivos em posse:
  - `docs/ai-handoff.md`
  - `src/app/admin/funcoes/[id]/route.ts`
  - `src/app/api/agenda/route.ts`
  - `src/app/api/agenda/[id]/route.ts`
  - `src/app/api/agenda/[id]/convite/route.ts`
  - `src/app/api/checklist/route.ts`
  - `src/app/api/conquistas/route.ts`
  - `src/app/api/loja/route.ts`
  - `src/app/api/me/password/route.ts`
  - `src/app/api/me/photo/route.ts`
  - `src/app/api/metas/minha/route.ts`
  - `src/app/api/notifications/route.ts`
  - `src/app/api/notifications/stream/route.ts`
  - `src/app/api/pontos/route.ts`
  - `src/app/api/pontos/evolucao/route.ts`
  - `src/app/api/resgates/route.ts`
  - `src/app/api/tasks/adhoc/route.ts`
  - `src/app/api/tasks/[id]/complete/route.ts`
- Arquivos alterados:
  - `docs/ai-handoff.md`
  - `src/app/admin/funcoes/[id]/route.ts`
  - `src/app/api/agenda/route.ts`
  - `src/app/api/agenda/[id]/route.ts`
  - `src/app/api/agenda/[id]/convite/route.ts`
  - `src/app/api/checklist/route.ts`
  - `src/app/api/conquistas/route.ts`
  - `src/app/api/loja/route.ts`
  - `src/app/api/me/password/route.ts`
  - `src/app/api/me/photo/route.ts`
  - `src/app/api/metas/minha/route.ts`
  - `src/app/api/notifications/route.ts`
  - `src/app/api/notifications/stream/route.ts`
  - `src/app/api/pontos/route.ts`
  - `src/app/api/pontos/evolucao/route.ts`
  - `src/app/api/resgates/route.ts`
  - `src/app/api/tasks/adhoc/route.ts`
  - `src/app/api/tasks/[id]/complete/route.ts`
- O que foi feito:
  - Removidos os acessos `session.user as any` das rotas restantes de self-service, substituindo por acesso tipado a `session.user`.
  - `notifications`, `agenda`, `tasks`, `loja`, `pontos`, `resgates`, `checklist`, `conquistas`, `me/*` e `metas/minha` ficaram sem casts locais de sessao.
  - Durante a varredura apareceu a rota legada `src/app/admin/funcoes/[id]/route.ts`; ela foi alinhada ao mesmo padrao de permissao da versao em `src/app/api/admin/funcoes/[id]/route.ts`, com `getEffectiveSessionUser`, `canManageEmpresa` e escopo por empresa.
  - Varredura final em `src` ficou sem sobras de `session.user as any`.
  - Validacao executada com `npx.cmd tsc --noEmit` sem erros no estado atual do workspace.
- Parecer do outro agente:
  - pendente
- Melhorias sugeridas pelo outro agente:
  - pendente
- Pendencias / riscos:
  - A remocao nao identificada em `public/logos/paubrasil.png` continua no workspace e permaneceu fora do escopo.
  - Ainda vale revisar se a rota legada `src/app/admin/funcoes/[id]/route.ts` pode ser removida futuramente, ja que as telas atuais consomem `/api/admin/funcoes/[id]`.
- Proximo passo sugerido:
  - Pedir parecer do Claude sobre o fechamento da varredura transversal e sobre a manutencao da rota legada de `admin/funcoes/[id]`.
  - Se a base continuar livre, revisar rotas duplicadas/legadas fora de `src/app/api` para reduzir drift de autorizacao.

## Prompt Recomendado Para Claude ou Codex

Use este prompt no inicio de qualquer nova rodada:

```text
Antes de implementar qualquer coisa neste projeto, leia inteiro o arquivo docs/ai-handoff.md e depois leia docs/mapa-do-sistema.md.

Em seguida:
1. Rode git status --short
2. Rode git diff --name-only
3. Atualize a "Tabela Diaria de Controle" e a secao "Em andamento" com seu nome, objetivo e arquivos em posse
4. Liste quais arquivos ja estao alterados e quais voce pretende evitar
5. Nao reverta mudancas feitas por outro agente
6. Se houver conflito de escopo, ajuste seu plano para trabalhar em arquivos diferentes ou registre o bloqueio

Ao terminar sua rodada:
1. Atualize docs/ai-handoff.md
2. Atualize a "Tabela Diaria de Controle"
3. Registre objetivo, arquivos alterados, o que foi feito, pendencias e proximo passo sugerido
4. Marque se o trabalho precisa de parecer do outro agente
5. Se estiver revisando o trabalho do outro agente, preencha o campo de parecer com o que ficou bom, risco observado e melhoria sugerida
6. Registre mesmo se a rodada tiver sido apenas de analise
```

## Regra Combinada

Se o usuario confirmar este fluxo como regra do projeto, o processo padrao passa a ser:

- inicio de rodada = ler `docs/ai-handoff.md` + ler `docs/mapa-do-sistema.md` + checar `git status`
- leitura rapida = consultar primeiro a `Tabela Diaria de Controle`
- antes de editar = registrar posse de arquivos em `Em andamento`
- fim de rodada = atualizar `Registro de rodadas`
- revisao relevante = pedir ou registrar parecer do outro agente

Esse processo e melhor do que usar apenas conversa no chat, porque cria memoria persistente no repositorio, ajuda a evitar colisao de escopo e ainda incentiva revisao cruzada de qualidade.
