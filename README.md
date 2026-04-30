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
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `REDIS_URL`
- `TOKEN_ENCRYPTION_SECRET` (>= 32 chars)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `LOG_LEVEL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID` (single-price fallback, useful in development)
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_PREMIUM`
- `GROQ_API_KEY`

### Core (`packages/core`)
- `GROQ_API_KEY`
- `SCRAPER_HEADLESS` (set to `false` to run headed)
- `SCRAPER_DEBUG` (set to `true` to save HTML + screenshot snapshots)
- `SCRAPER_DEBUG_DIR` (override default snapshot directory)
- `SCRAPER_PROXY_SERVERS` (comma-separated proxy URLs) or `SCRAPER_PROXY_SERVER`
- `SCRAPER_PROXY_USERNAME`
- `SCRAPER_PROXY_PASSWORD`

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
