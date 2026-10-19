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

As oito empresas cadastradas editorialmente são Pau Brasil Bebidas, Pau Brasil Motos, Unida Construtora, Instituto YSO, Original Start, Hora 10, Locadora Pau Brasil e Fazenda Divina. As associações Ambev/Honda constam do contexto histórico do usuário. Pau Brasil Motos usa `externalUrl` em `src/lib/hub-content.ts`: os links do hub abrem https://www.paubrasilmotos.com.br/valedosaofrancisco/ em nova aba e `/empresas/motos` redireciona para lá (19/10/2026, não publicado).

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
