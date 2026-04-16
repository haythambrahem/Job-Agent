# Job-Agent SaaS Platform

Production SaaS refactor of the original CLI job agent into a secure multi-tenant monorepo.

## Monorepo structure

```text
apps/
  api/        # Express API + Prisma + Stripe + tenant isolation
  web/        # Next.js + NextAuth frontend
packages/
  core/       # Shared business logic (scraping, AI, matching, email, pipeline)
```

## Key capabilities

- NextAuth-based user authentication
- Multi-tenant data isolation (`userId` scoping on all domain entities)
- Stripe checkout, billing portal, and webhook subscription sync
- Plan/feature gating (`free`, `pro`, `premium`)
- Free-tier monthly quota enforcement (10 applications/month)
- Job scraping + AI matching + approval-first application flow

## Environment variables

### Shared
- `DATABASE_URL` (PostgreSQL)

### Web (`apps/web`)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_API_BASE_URL`

### API (`apps/api`)
- `API_PORT`
- `WEB_ORIGIN`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_PREMIUM`
- `GROQ_API_KEY`

## Local setup

1. Install dependencies

```bash
npm install
```

2. Generate Prisma client and apply schema

```bash
npm run db:generate
npm run db:push
```

3. Run apps

```bash
npm run dev:api
npm run dev:web
```

4. Build all workspaces

```bash
npm run build
```
