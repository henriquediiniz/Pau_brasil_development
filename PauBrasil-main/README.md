# Portal Pau Brasil

## Desenvolvimento

Execute dentro da pasta `PauBrasil-main`:

```bash
npm ci
npm run dev
```

## Produção na Vercel

- Root Directory: `PauBrasil-main`.
- Build Command: `npm run build`.
- Configure `DATABASE_URL` com a conexão PostgreSQL de produção via TLS.
- Configure `NEXTAUTH_SECRET` e `CRON_SECRET` com segredos aleatórios distintos.
- Configure `NEXTAUTH_URL` com o domínio HTTPS do portal.
- Antes do primeiro deploy e de alterações no schema, aplique `npx prisma migrate deploy` no banco correspondente. Para migrações, prefira a conexão direta do provedor (`DATABASE_URL_UNPOOLED`) como `DATABASE_URL` nesse comando.
- As rotas públicas que consultam o banco são renderizadas em runtime. Uma build concluída não substitui a configuração do banco.

Credenciais ficam nas variáveis de ambiente da Vercel, nunca no Git. Serviços opcionais de e-mail e upload têm suas variáveis listadas em `.env.example`.
