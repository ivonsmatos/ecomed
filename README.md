# EcoMed — App Next.js

> Front-end PWA e API do EcoMed. Documentação completa do projeto em [../README.md](../README.md).

## Desenvolvimento

```bash
pnpm install
cp .env.example .env.local   # preencher credenciais
pnpm db:generate             # gerar Prisma Client
pnpm db:migrate              # aplicar migrations
pnpm dev                     # http://localhost:3000 (Turbopack)
```

## Scripts

| Comando               | Descrição                          |
| --------------------- | ---------------------------------- |
| `pnpm dev`            | Dev server com Turbopack           |
| `pnpm build`          | Build de produção                  |
| `pnpm lint`           | ESLint                             |
| `pnpm test`           | Vitest (unitários)                 |
| `pnpm test:e2e`       | Playwright (E2E)                   |
| `pnpm db:migrate`     | Criar migration Prisma             |
| `pnpm db:studio`      | Prisma Studio                      |
| `pnpm db:seed`        | Popular banco com dados de dev     |
| `pnpm db:seed:logmed` | Popular banco com pontos de coleta |
| `pnpm db:generate`    | Regenerar Prisma Client            |

## Stack

- **Next.js 16** — App Router, Server Components, standalone output
- **Prisma 7** — ORM + migrations, PostgreSQL + PostGIS (Supabase)
- **NextAuth v5** — autenticação JWT (Google OAuth + credenciais)
- **Hono** — API Routes tipadas com Zod
- **Serwist v9** — Service Worker PWA (Workbox)
- **Tailwind CSS v4** — estilização
- **shadcn/ui** — design system (@base-ui/react)
- **Leaflet + react-leaflet** — mapas interativos
- **Recharts** — gráficos de estatísticas
- **Resend + React Email** — emails transacionais
- **Cloudflare R2** — storage de imagens
- **Upstash Redis** — rate limiting

## Estrutura

```
src/
├── app/                # App Router (rotas = pastas)
│   ├── (auth)/         # login, cadastro, reset senha
│   ├── app/            # área cidadão (/app/*)
│   ├── parceiro/       # painel parceiro (/parceiro/*)
│   ├── admin/          # painel admin (/admin/*)
│   ├── mapa/           # mapa público
│   ├── blog/           # artigos Sanity
│   ├── offline/        # fallback PWA offline
│   ├── studio/         # Sanity Studio embutido
│   └── api/[[...route]]/ # API catch-all (Hono)
├── components/         # componentes React
├── lib/                # utilitários (db, auth, email, push, r2)
├── hooks/              # React hooks customizados
└── generated/prisma/   # Prisma Client (gerado automaticamente)
```

## Deploy

**Cloudflare Pages (principal):**

```bash
git push origin main   # CI/CD automático
```

**Docker (VPS alternativo):**

```bash
docker build --no-cache -t ecomed-app:latest .
docker run -d --name ecomed-app -p 3010:3010 \
  --env-file .env.production ecomed-app:latest
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
