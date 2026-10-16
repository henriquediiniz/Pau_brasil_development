# Hub institucional Pau Brasil

A entrada pública `/` reúne empresas, história, universidade e carreiras. A implementação aproveita o Next.js e os módulos existentes do portal, sem criar uma segunda aplicação ou alterar dados de produção.

## Conteúdo e identidade

- Manual fornecido: `manual_pau_brasil.pdf`, páginas 3–5: vinho `#7A1520`, preto `#1A1A1A`, areia `#DCC8B1` e Montserrat. Logos originais preservados em `public/brand/`.
- A fotografia de fachada é uma aplicação **ilustrativa** extraída da página 6 do manual, identificada como tal na interface; não representa uma sede verificada.
- As oito empresas e suas atividades vêm do conteúdo da home anterior. As associações Ambev e Honda foram informadas pelo usuário.
- As oito unidades de Bebidas vêm de `prisma/seed-empresas.ts`. Estados conferidos com `prisma/seed-operations.ts` e cadastro de operações do projeto. É uma relação inicial, não uma consulta ao cadastro operacional ativo.
- As demais empresas exibem ausência de informações de unidades. Nenhum endereço ou contato foi inventado.
- `src/lib/hub-content.ts` concentra empresas, unidades, capítulos e orientação por interesse para atualização editorial.

## Rotas e comportamento

- `/`: hub com filtros de segmento, capítulos da história, universidade e orientação de carreira.
- `/empresas/[slug]`: páginas das oito empresas; busca de cidades sem distinção de acento e filtro por estado; slug desconhecido retorna 404.
- `/universidade-pb`: catálogo existente. `/universidade`: área autenticada de aprendizagem existente.
- `/carreiras` e `/carreiras/candidatar`: catálogo e candidatura existentes, atualmente vinculados ao domínio de Bebidas. Fluxos de upload e gravação não foram alterados.
- A orientação por interesse sugere negócios para conhecer e explica o motivo. Não interpreta currículos, não classifica candidatos, não faz envio ao RH nem altera o banco de talentos. O usuário mantém acesso às demais empresas.
- A identidade visual é isolada em CSS Module no hub e nas novas páginas de empresa. Os módulos internos conservam o tema atual.

## Conteúdo necessário para a próxima etapa

1. Datas e textos aprovados da fundação, expansão e demais marcos para a timeline cronológica. Os capítulos atuais são editoriais, sem datas históricas presumidas.
2. Fotos reais do acervo, legendas e créditos; substituir a aplicação ilustrativa quando o acervo estiver disponível.
3. Relação completa e oficial de filiais, endereços, contatos e responsáveis por empresa.
4. Conteúdo e ordem dos cursos de integração, público de cada trilha e critérios de conclusão na universidade existente.
5. Regras de encaminhamento dos currículos entre empresas: áreas, competências, localidades, preferências do candidato e responsáveis de RH. O catálogo atual precisa ser ampliado antes de anunciar candidatura para todas as empresas.

## Evolução do banco de talentos

Para o encaminhamento real entre empresas, será preciso definir associação da candidatura com empresas/unidades, disponibilizar cargos de todas as empresas e adaptar as permissões dos responsáveis de RH. A recomendação deve usar experiência, competências e preferências profissionais com justificativa visível e revisão humana. Esta rodada entrega a navegação e a orientação editorial, não essa automação.

## Verificação local

Na pasta do projeto:

```bash
bash .local-dev/postgres.sh start
npm run dev -- --hostname 127.0.0.1
npx tsc --noEmit
npx playwright test tests/e2e/hub.spec.ts
```

Os testes do hub exercitam navegação, filtros, estados vazios, recomendação por interesse, rota inexistente e layout de 320 a 1280 pixels. Não enviam currículos nem alteram o banco.

Validação desta rodada: TypeScript aprovado; 3 testes E2E aprovados; imagens desktop/mobile revisadas; páginas de carreiras e universidade retornaram HTTP 200. Build de produção e envio real de candidatura não foram executados.
