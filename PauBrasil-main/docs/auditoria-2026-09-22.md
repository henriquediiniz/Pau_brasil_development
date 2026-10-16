# Auditoria do portal — 2026-09-22

**Para:** PO (Thiago) e o próximo agente que pegar o código.
**Método:** medição antes de opinião. Todo número aqui saiu de `next build`,
do schema ou de varredura no código. O que não foi medido está marcado como
não medido.

---

## Resumo

| # | Achado | Gravidade | Situação |
|---|---|---|---|
| **0** | **Bypass de autorização no middleware do Next (CVE crítica)** | **Crítica** | **Corrigido** |
| 1 | Session Replay gravava a tela sem máscara, em 10% das sessões | **Alta (LGPD)** | Corrigido |
| 2 | 323 `font-bold` numa fonte sem o peso 700 — negrito sintetizado | Média (design) | Corrigido |
| 3 | 197 kB de JS em **toda** rota, inclusive login | Média (perf) | Medido, não resolvido |
| 4 | 108 `findMany` sem `take` | Média (risco) | 3 corrigidos, 105 registrados |
| 5 | 12 `confirm()`/`alert()` nativos | Baixa (UX) | 1 corrigido, 11 registrados |
| 6 | Modelos de reconhecimento facial vindos de CDN de terceiro | A decidir | Só registrado |
| — | Cobertura de índices no banco | — | **Verificado: está correta** |

---

## 0. Bypass de autorização no middleware — e como quase passou batido

**Este é o achado mais grave, e eu o encontrei por último e por acidente.**

Ao final da auditoria descobri que outro agente já havia escrito
`docs/plano-de-melhorias.md` e `docs/oportunidades-ux.md` em 08/05/2026. O
primeiro já reportava 16 vulnerabilidades de produção (1 crítica, 9 altas) e
recomendava atualizar o Next. Eu não li esses documentos antes de começar —
erro de método, porque o protocolo do `CLAUDE.md` existe exatamente para isso.

Rodando `npm audit --omit=dev` na data de hoje: **32 vulnerabilidades, 4
críticas e 15 altas**. Piorou desde maio.

A que tem impacto real neste portal:

> **Authorization Bypass in Next.js Middleware** (crítica)

O portal protege rotas por middleware. E a proteção de três delas é **só** o
middleware:

| Rota | Checa sessão na própria página? |
|---|---|
| `/gente` | sim (`getServerSession` + `canAccessGente`) |
| `/admin` | **não** |
| `/empresa` | **não** |
| `/talentos` | **não** |

Com o bypass, um pedido não autenticado alcançava `/admin`, `/empresa` e
`/talentos` — este último é o Banco de Talentos, com dado de candidato. As
rotas de API continuavam checando, então os dados buscados no cliente
retornariam 401; mas qualquer coisa renderizada no servidor vazava, e o
console de administração não devia sequer desenhar.

**Corrigido:** Next 14.2.7 → 14.2.35, patch dentro da mesma minor. Depois do
upgrade o bypass sai da lista. `tsc`, 385 testes e build passaram; o JS
compartilhado subiu de 197 kB para 199 kB.

**Os 4 críticos que restam não se aplicam a este deploy** — verifiquei um a um,
em vez de deixar o número assustando sem explicação:

| CVE restante | Por que não se aplica |
|---|---|
| RCE em servidor hospedado em Windows | roda na Vercel (Linux) |
| RCE via AVIF no Image Optimizer | sem `formats` no `next.config.js`, AVIF está desligado |
| Homoglyph no normalizador de e-mail (`next-auth`, `@auth/core`) | o portal usa `CredentialsProvider`, não `EmailProvider` |

Limpar o resto exigiria **Next 15**, que é major e não cabe numa rodada de
auditoria. Fica como decisão separada.

**Defesa em profundidade, independente de CVE:** `/admin`, `/empresa` e
`/talentos` deveriam checar sessão na própria página, como `/gente` faz. Hoje
dependem de uma única camada. Não mexi porque são telas de outros agentes, mas
é a correção que sobrevive à próxima CVE de middleware.

---

## 1. Session Replay gravava dado sensível sem máscara

**O que estava no arquivo:**

```ts
// Mascara inputs e textos por padrão (LGPD)
maskAllText: false,
blockAllMedia: false,
```

O comentário declara a intenção e a linha seguinte faz o contrário. Com
`replaysSessionSampleRate: 0.1`, **10% de todas as sessões** eram gravadas em
vídeo e enviadas para `ingest.us.sentry.io`.

O que passa pela tela deste portal: salário em Controle de Vagas, CPF e
telefone em Candidatos, e **laudo médico em Gestão de PCD** — dado de saúde,
art. 11 da LGPD, que o próprio módulo trata com blob privado e auditoria antes
de servir. O Replay contornava todo esse cuidado pela captura de tela.

**Corrigido:** amostragem de sessão em 0 (grava só quando há erro), texto
mascarado, mídia bloqueada, e máscara explícita em `input`/`textarea`/`select`.

**Fica para decidir:** o código do Replay continua no bundle mesmo sem gravar.
Removê-lo tiraria peso de todas as páginas (ver achado 3), mas é decisão de
produto — é ferramenta de diagnóstico.

---

## 2. Negrito sintetizado em centenas de lugares

DM Sans é a fonte do corpo e carregava os pesos 400/500/600.

| Classe | Peso | Usos | Arquivo carregado? |
|---|---|---|---|
| `font-medium` | 500 | 616 | sim |
| `font-bold` | 700 | **323** | **não** |
| `font-semibold` | 600 | 119 | sim |
| `font-black` | 900 | 55 | não |
| `font-extrabold` | 800 | 0 | sim (Jakarta) |

Sem o arquivo do peso, o navegador **sintetiza** o negrito: engrossa o traço
por transformação geométrica. O resultado é texto borrado, pior em tela de
alta densidade. É o tipo de defeito que ninguém sabe nomear e todo mundo
percebe como "meio sujo".

**Corrigido:** 700 entra na lista da DM Sans. 900 fica de fora de propósito —
cair no 700 real é melhor que um 900 falsificado. O 800 da Jakarta fica, apesar
de zero `font-extrabold`: é para onde os `font-black` dos títulos caem sem
síntese.

---

## 3. 197 kB de JavaScript em toda rota

```
First Load JS shared by all          197 kB
  chunks/5288…                       103 kB
  chunks/fd9d1056…                    53.8 kB
  chunks/52774a7f…                    37.4 kB
```

Rotas mais pesadas (o total já inclui os 197 kB):

| Rota | First Load |
|---|---|
| `/app/visitas/dashboard` | 399 kB |
| `/app/hoje` | 279 kB |
| `/talentos` | 271 kB |
| `/gente/candidatos` | 270 kB |

O ponto não são as rotas: é o **piso**. Uma tela de 70 kB de código próprio
custa 267 kB porque todas pagam os 197 kB antes de existir. Quem abre o login
num 3G do interior baixa os 197 kB para ver um formulário.

O que está lá dentro: framework (React + Next, inevitável), o SDK do Sentry
com o Replay, next-auth, next-themes e o Toaster.

**Não resolvido.** O caminho é carregar o Replay sob demanda em vez de no
bundle inicial, e isso mexe em monitoramento — precisa de decisão.

**Medição honesta:** liguei `optimizePackageImports` para framer-motion,
recharts e lucide-react. **Não mudou nada** — zero rotas alteraram de tamanho e
os chunks compartilhados saíram com hash idêntico. Ficou no `next.config.js`
como guarda para imports futuros, não como ganho. Registro aqui para ninguém
repetir a tentativa achando que resolve.

**Falso alarme descartado:** o build avisa sobre `@vladmandic/face-api`
(24 MB no disco), usado no check-in por reconhecimento facial. Fui verificar:
já é `await import()` dinâmico, fica em chunk próprio e **não** entra no
bundle inicial. Nada a fazer.

---

## 4. Consultas sem teto

**108 de 135** `findMany` nas rotas de API não têm `take`. Concentração:

| Arquivo | Sem teto |
|---|---|
| `api/admin/upb/relatorio` | 7 |
| `api/admin/upb/temporadas/[id]/alunos` | 5 |
| `api/gestor/aprovacoes` | 4 |
| `api/visitas/matriz` | 3 |

Hoje as tabelas são pequenas e nada disso dói. O problema aparece sozinho: a
consulta que funciona com 200 linhas é a mesma que trava com 200 mil, e o dia
em que travar será um dia em que ninguém mexeu em nada.

**Corrigi as 3 do Frontline** (módulo meu). As outras estão em áreas de outros
agentes: pôr `take` às cegas num relatório trunca resultado **sem avisar**, o
que é pior que a consulta lenta. O caminho certo é caso a caso, decidindo
entre paginar, limitar com aviso na tela, ou agregar no banco.

---

## 5. Diálogos nativos do navegador

12 `confirm()`/`alert()` em 7 telas, incluindo uma minha no Frontline. O
diálogo nativo ignora o tema do portal, trava a aba inteira e no celular
aparece colado no topo — longe do item que vai ser excluído, o que é
justamente onde a atenção está.

**Corrigi a minha** com confirmação em dois toques na própria linha: Esc
desfaz e ela expira em 5s, porque confirmação pendente esquecida na tela vira
armadilha. As outras 11 ficam registradas — o padrão já está pronto para
reaproveitar.

---

## 6. Modelos de reconhecimento facial vindos de CDN

```ts
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
```

O check-in por reconhecimento facial baixa os modelos do jsDelivr em tempo de
execução. Se o CDN cair, mudar de versão ou ficar bloqueado na rede da
unidade, o check-in para — e o erro vai aparecer como "não reconheceu o rosto",
não como "CDN fora do ar".

Não mexi: é feature de outro agente e a alternativa (servir os modelos do
próprio domínio) tem custo de banda e de deploy que não é meu para decidir.

---

## O que verifiquei e está certo

Vale registrar para ninguém gastar tempo de novo:

- **Índices do banco.** Uma primeira varredura minha sugeriu que `RecVaga` e
  `RecCandidato` estavam sem índice. Era erro de medição — o `grep` cortava o
  modelo antes do fim. Conferido no schema completo: `RecVaga` tem 6 índices,
  incluindo os compostos `(empresaId, status)` e `(operacaoId, status)`;
  `RecCandidato` tem 5. **A cobertura acompanha os filtros que as rotas usam.**
- **Estados de carregamento.** 16 das 19 telas com `useSWR` têm skeleton.
- **`face-api`** já é carregado sob demanda (acima).

---

## Cruzamento com o diagnóstico do outro agente

Depois de descobrir `docs/oportunidades-ux.md` e `docs/plano-de-melhorias.md`
(08/05/2026), conferi o que daquele levantamento ainda está de pé:

| Achado de 08/05 | Estado hoje |
|---|---|
| Encoding quebrado (`ConfiguraÃ§Ãµes`) no login e no layout | **Resolvido** — varredura por mojibake não acha mais nada |
| 16 vulnerabilidades de produção, atualizar o Next | **Piorou para 32** antes desta rodada; a crítica com impacto real foi fechada hoje |
| `alert`/`confirm`/`prompt` nativos | **Aberto** — 12 ocorrências, 1 corrigida hoje |
| Padronizar loading / vazio / erro | **Majoritariamente feito** — 16 das 19 telas com `useSWR` têm skeleton |
| Importações mais guiadas | **Feito no módulo Gente** — `ImportadorPlanilha` com dry-run, prévia e planilha-modelo |
| Esteira de qualidade / CI | **Já existe** e cobre mais do que o doc sugeria (ver abaixo) |
| Arquivos grandes | **Aberto** — `admin/upb` 1286 linhas, `admin/usuarios` 1191 |

Onde os dois levantamentos se cruzaram — diálogos nativos, estados de
carregamento — as conclusões bateram. Levantamentos independentes convergindo
é bom sinal para ambos.

### Dois falsos alarmes meus, registrados de propósito

Errei duas medições nesta auditoria e peguei as duas só porque o resultado
pareceu surpreendente demais. Ficam registradas para que ninguém repita:

1. **"`RecVaga` e `RecCandidato` sem índice."** Era `grep -A 40` cortando o
   modelo antes das linhas `@@index`. No schema completo, `RecVaga` tem 6
   índices e `RecCandidato` tem 5, com os compostos certos.
2. **"Os testes unitários não rodam no CI."** Procurei a string `test:unit` no
   workflow e não achei. Mas o passo roda `npm test`, que no `package.json`
   delega para `test:unit`. **O CI roda os 385 testes.**

A lição é a mesma nos dois casos: `grep` responde sobre texto, não sobre
comportamento. Achado que depende de ausência de string precisa ser confirmado
lendo o arquivo.

---

## Não auditado

Honestidade sobre o alcance desta rodada:

- **Tempo real de resposta.** Tudo aqui é análise estática. Não medi TTFB nem
  duração de query em produção. O próximo passo natural é olhar os traces que
  o Sentry já coleta (`tracesSampleRate: 0.1`).
- **Acessibilidade completa.** Corrigi o que passou pelo caminho nas últimas
  rodadas (foco, `aria-pressed`, região rolável). Não rodei auditoria de
  contraste em todas as telas.
- **OBZ, financeiro e Universidade.** As mudanças de light mode das rodadas
  anteriores foram globais e essas áreas não tiveram passada visual.
- **As 15 vulnerabilidades altas.** Olhei as 4 críticas uma a uma; as altas
  (brace-expansion, browserslist, fast-uri, babel) são majoritariamente de
  cadeia transitiva e DoS em ferramenta de build. Merecem uma passada própria.
- **`docs/oportunidades-ux.md`** (447 linhas, de outro agente) tem um catálogo
  de UX que não revisei item a item. Onde nos cruzamos — diálogos nativos,
  estados de loading — as conclusões bateram, o que é bom sinal para os dois
  levantamentos.
