# 🌿 Grupo Pau Brasil — Portal Corporativo

Portal de engajamento e gamificação do Grupo Pau Brasil.  
Stack: **Next.js 14 App Router · TypeScript · TailwindCSS · Prisma · PostgreSQL · NextAuth · PWA**

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── layout.tsx              # Root layout + providers
│   ├── page.tsx                # Home pública
│   ├── providers.tsx           # SessionProvider + Toaster
│   ├── globals.css             # Tokens de design + Tailwind
│   ├── login/                  # Página de login
│   ├── offline/                # Fallback PWA offline
│   ├── app/                    # Área logada (usuário)
│   │   ├── layout.tsx          # Sidebar + Bottom Nav
│   │   ├── hoje/               # Checklist do dia
│   │   ├── pontos/             # Carteira e extrato
│   │   ├── ranking/            # Ranking por período
│   │   ├── loja/               # Loja de recompensas
│   │   ├── resgates/           # Meus resgates
│   │   └── perfil/             # Perfil do usuário
│   ├── gestor/                 # Área do gestor
│   │   └── aprovacoes/         # Fila de aprovações
│   ├── admin/                  # Área administrativa
│   │   ├── page.tsx            # Painel admin
│   │   ├── usuarios/           # CRUD usuários
│   │   ├── funcoes/            # CRUD funções + atividades
│   │   ├── produtos/           # CRUD produtos
│   │   └── pedidos/            # Gerenciar resgates
│   └── api/                    # Route Handlers
│       ├── auth/[...nextauth]/
│       ├── checklist/          # GET gerar checklist do dia
│       ├── tasks/[id]/complete # POST concluir tarefa
│       ├── tasks/[id]/review   # POST aprovar/reprovar (gestor)
│       ├── pontos/             # GET saldo + extrato
│       ├── ranking/            # GET ranking por período
│       ├── loja/               # GET produtos / POST resgatar
│       ├── resgates/           # GET meus pedidos
│       ├── gestor/aprovacoes/  # GET fila de aprovações
│       └── admin/              # CRUD admin APIs
├── lib/
│   ├── auth.ts                 # NextAuth config + validação domínio
│   ├── prisma.ts               # Singleton do client
│   ├── points.ts               # Saldo e ranking
│   └── checklist.ts            # Geração do checklist diário
├── types/
│   └── index.ts                # Tipos + constantes de nível/gamificação
├── hooks/
│   └── use-toast.ts            # Hook de toast
└── components/
    └── ui/
        └── toaster.tsx         # Componente de notificações
prisma/
├── schema.prisma               # Schema completo
└── seed.ts                     # Seed com admin + demo users + produtos
public/
├── manifest.json               # PWA manifest
└── icons/                      # Ícones PWA (gerar com generate-icons.js)
```

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos

- Node.js 18+ (recomendado 20+)
- Docker + Docker Compose
- Git

### 2. Clonar e instalar

```bash
git clone <repo> grupo-pau-brasil
cd grupo-pau-brasil
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e preencha:

```env
DATABASE_URL="postgresql://paub:paub_dev_2026@localhost:5432/paub_portal?schema=public"
NEXTAUTH_SECRET="gere-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Subir o banco PostgreSQL

```bash
docker compose up -d
```

Aguarde ~5s para o banco inicializar.

### 5. Migrations + Seed

```bash
# Criar as tabelas
npm run db:migrate

# Dados iniciais (admin + usuários demo + produtos)
npm run db:seed
```

### 6. Gerar ícones PWA

```bash
node generate-icons.js
```

> Isso gera ícones SVG placeholder em `public/icons/`.  
> Para produção, converta para PNG usando sharp, Figma ou https://realfavicongenerator.net

### 7. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🔑 Credenciais de Acesso (Seed)

| Papel      | E-mail                              | Senha          |
|------------|-------------------------------------|----------------|
| SYS_ADMIN  | admin@grupopaubrasil.com.br         | Admin@2026!    |
| GESTOR     | gestor@grupopaubrasil.com.br        | Gestor@2026!   |
| USER       | joao@grupopaubrasil.com.br          | User@2026!     |

> ⚠️ Apenas e-mails `@grupopaubrasil.com.br` são aceitos no login.

---

## 🛡️ Segurança e RBAC

### Domínio restrito
Validação dupla:
- **Frontend**: `validateEmail()` no formulário de login
- **Backend**: `loginSchema` Zod no `authorize()` do NextAuth

### Roles e rotas

| Role      | Acesso                                |
|-----------|---------------------------------------|
| USER      | `/app/*`                             |
| GESTOR    | `/app/*` + `/gestor/*`              |
| RH_ADMIN  | `/app/*` + `/gestor/*` + `/admin/*` |
| SYS_ADMIN | Tudo acima                           |

### Middleware (`src/middleware.ts`)
- Protege `/app`, `/gestor`, `/admin` via `withAuth`
- Redireciona não-autorizados para `/app/hoje`

### Cookies
- `httpOnly: true`
- `secure: true` em produção
- `sameSite: 'lax'`
- Sessão JWT com expiração de 8h

---

## 📱 PWA — Instalação e Teste

### Como testar o PWA no celular

#### Android (Chrome)
1. Acesse o portal pelo Chrome no Android
2. Aguarde ~30s de uso (ou vá em Menu → "Adicionar à tela inicial")
3. O Chrome mostrará o banner de instalação automaticamente
4. Toque em "Instalar"

#### iOS (Safari)
1. Abra no Safari no iPhone/iPad
2. Toque no botão de compartilhar (quadrado com seta pra cima)
3. Role e toque em "Adicionar à Tela de Início"
4. Confirme o nome e toque em "Adicionar"

#### Desktop (Chrome/Edge)
1. No endereço, clique no ícone de instalação (⊕) à direita da barra
2. Ou Menu → "Instalar Grupo Pau Brasil"

### Como verificar o manifest

Abra DevTools → Application → Manifest  
Verifique: nome, ícones, theme_color, start_url

### Service Worker

O `next-pwa` registra o SW automaticamente em produção.  
Em desenvolvimento (`NODE_ENV=development`) o SW é desabilitado para evitar cache issues.

Para testar o SW localmente:
```bash
npm run build && npm start
```
Depois DevTools → Application → Service Workers

### Offline fallback

- **Páginas públicas**: servidas do cache quando offline
- **Área logada**: mostra `/offline` com mensagem amigável
- Estratégia: **NetworkFirst** (tenta rede, cai no cache)

---

## 🌐 Deploy (produção)

### Variáveis obrigatórias em produção

```env
DATABASE_URL="postgresql://..."      # banco de produção
NEXTAUTH_SECRET="string-secreta"     # string forte gerada
NEXTAUTH_URL="https://seudominio.com"
NODE_ENV="production"
```

### Vercel (recomendado)

```bash
npm install -g vercel
vercel --prod
```

Adicione as env vars no dashboard Vercel.  
O PWA funciona automaticamente em deploy (next-pwa só ativa em `NODE_ENV=production`).

### Outros providers (Railway, Render, Fly.io)

```bash
npm run build
npm start
```

### Checklist pré-deploy

- [ ] Gerar ícones PNG reais para `/public/icons/`
- [ ] Definir `NEXTAUTH_SECRET` seguro (32+ chars)
- [ ] Configurar banco PostgreSQL de produção
- [ ] Rodar `npm run db:migrate` no banco de produção
- [ ] Rodar `npm run db:seed` para criar o SYS_ADMIN
- [ ] **Trocar senha padrão** do admin após primeiro acesso
- [ ] Verificar HTTPS (obrigatório para PWA em produção)

---

## 🗃️ Banco de Dados

### Comandos úteis

```bash
# Ver dados no browser
npm run db:studio

# Nova migration após alterar schema
npm run db:migrate

# Reset completo (⚠️ apaga tudo)
npx prisma migrate reset
```

### Modelo de dados

```
User ─── Function ─── TaskDefinition ─── TaskInstance
  │                                           │
  ├── PointsLedger ◄──────────────────────────┤
  │                                           │
  └── RedemptionOrder ─── RewardProduct       │
                                              │
                      aprovação do gestor ────┘
```

---

## 🎨 Design System

### Cores principais

| Token         | Valor       | Uso                    |
|---------------|-------------|------------------------|
| brand-500     | `#ff7d0d`   | Laranja principal      |
| brand-700     | `#c74a04`   | Laranja escuro         |
| background    | `#0d0d14`   | Fundo dark             |
| card          | `#111118`   | Cards e sidebar        |

### Tipografia

- **Títulos**: Plus Jakarta Sans (font-display)
- **Corpo**: DM Sans (font-sans)

### Níveis de gamificação

| Nível    | Pontos    |
|----------|-----------|
| Bronze   | 0+        |
| Prata    | 400+      |
| Ouro     | 1.000+    |
| Diamante | 2.000+    |

---

## 📝 Adicionando Usuários

Via API (admin logado):

```bash
curl -X POST http://localhost:3000/api/admin/usuarios \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "name": "Maria Silva",
    "email": "maria@grupopaubrasil.com.br",
    "password": "Senha@Segura123",
    "role": "USER",
    "functionId": "func-vendedor",
    "company": "Pau Brasil Motos",
    "unit": "Unidade SP"
  }'
```

---

## 🐛 Troubleshooting

**Erro `PrismaClientKnownRequestError`**: rode `npm run db:migrate`

**Login não funciona**: verifique `NEXTAUTH_SECRET` e `NEXTAUTH_URL` no `.env`

**PWA não instala**: teste em `npm run build && npm start` (não em `npm run dev`)

**Ícones não aparecem**: rode `node generate-icons.js` ou adicione PNGs em `public/icons/`

**Porta 5432 ocupada**: `docker compose down` e `docker compose up -d`
