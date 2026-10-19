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
