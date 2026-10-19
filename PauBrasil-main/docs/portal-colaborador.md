# Portal do colaborador — versão inicial

> **Atualização de contexto — 19/10/2026:** Documento da versão anterior à simplificação de 19/10/2026. Atividades, carteira, conquistas e ranking foram retirados da experiência do portal. Leia [produto e decisões atuais](contexto-agente/01-PRODUTO-E-DECISOES.md). Referências abaixo a navegação e testes antigos são históricas.

O portal reutiliza as funções existentes de início, atividades, pontos, ranking,
conquistas, perfil e Universidade Pau Brasil. A navegação respeita os acessos de
cada perfil: colaboradores de outras empresas continuam com a Universidade e
os módulos que já lhes eram autorizados.

## Identidade 2026

Login e área autenticada usam Montserrat, os logos originais e a paleta de vinho
(`#7A1520`), grafite, areia e dourado. O portal oferece temas claro e escuro.
Os tokens de marca são definidos em `src/app/portal-brand.css`; os tokens Tailwind
mantêm a paleta anterior como fallback nas áreas que não usam esse tema.
Cores de status, como sucesso e erro, preservam seu significado.

## Loja suspensa

Por solicitação do responsável pelo projeto, a loja saiu desta versão enquanto
os requisitos são alinhados com os supervisores:

- Sem links de loja, pedidos ou metas de recompensa no portal, na busca, na ajuda
  e nos atalhos administrativos.
- `/app/loja` e `/app/resgates` redirecionam para os pontos.
- `/api/loja` bloqueia consultas e novos resgates; `/api/me/target` não permite
  definir metas de recompensa e devolve uma meta vazia.
- Produtos, pedidos e saldos existentes não foram apagados. O histórico de
  movimentações de pontos permanece disponível. APIs e páginas administrativas
  legadas de produtos/pedidos permanecem para gestão do histórico, sem atalhos.

A configuração `REWARDS_STORE_ENABLED`, em `src/lib/portal-features.ts`, centraliza
os bloqueios. Reintroduzir a loja exige também revisar navegação, ajuda e regras
com os supervisores; mudar apenas a configuração não restaura esses elementos.

## Ajustes de funcionamento

- Busca e atalhos móveis seguem as permissões da barra lateral.
- Busca e menu móvel têm foco controlado, fechamento por Escape e retorno ao botão.
- Login aguarda a inicialização da sessão, normaliza o e-mail e apresenta erros.
  O destino por perfil e a troca obrigatória de senha são resolvidos no servidor.
- Abertura de rota protegida sem sessão leva ao login da marca.
- Atividades avulsas aparecem mesmo para usuários ainda sem função cadastrada.
- Conclusão de atividade aguarda a API, impede envio simultâneo, desfaz a atualização
  otimista em caso de erro e permite tentar novamente.
- Início e checklist apresentam falha de carregamento com opção de tentar novamente.
- Evolução usa os limites reais de nível; a antiga meta de produto foi retirada.
- Contagem inicial inclui as atividades avulsas tanto no total quanto nas concluídas.

## Verificação local

Com o servidor de desenvolvimento e PostgreSQL local ativos:

```bash
PORTAL_E2E_DB=1 npx playwright test tests/e2e/portal-colaborador.spec.ts
npx playwright test tests/e2e/hub.spec.ts
npx tsc --noEmit
```

O teste do portal cria contas temporárias, testa as APIs reais e limpa seus próprios
registros. Só executa com opt-in e no banco `paub_portal_dev`, em `127.0.0.1:55432`.
Também simula uma falha de conclusão para verificar a recuperação da interface.
A validação da Universidade nesta rodada cobre acesso e navegação; cursos e
avaliações continuam dependendo do conteúdo cadastrado.

Validação desta rodada: 6 testes de navegador (portal e hub), 42 testes automatizados
de permissões/tarefas/pontos/notificações, TypeScript e lint dos arquivos principais
aprovados. Não foi executada build de produção nem publicação.

## Próxima rodada

Aguardar a análise de requisitos dos supervisores antes de remover outros módulos
ou alterar regras de pontuação. O acervo histórico e o cadastro oficial de filiais
do hub continuam pendentes, conforme combinado com o usuário.
