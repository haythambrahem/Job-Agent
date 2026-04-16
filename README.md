# Job-Agent SaaS Platform

Production SaaS refactor of the original CLI job agent into a monorepo architecture.

## Monorepo structure

```text
apps/
  api/        # Express API + Prisma + Socket.io
  web/        # React + Vite + Tailwind dashboard
packages/
  core/       # Shared business logic (scraping, AI, matching, email, pipeline)
```

## Key capabilities

- Job scraping pipeline (multi-source Playwright scraping)
- CV matching + AI cover letter generation
- Approval-first application flow (`pending -> approved -> sent`)
- Database persistence with Prisma + SQLite (ready to upgrade to Postgres)
- API endpoints for jobs, applications, approvals, and previews
- React dashboard with sidebar, stats cards, jobs list, applications table, and approval modal
- Real-time frontend refresh through Socket.io events
- Basic production safety: input checks, rate limiting, request/action logging, approval gate before send

## API endpoints

### Jobs
- `GET /jobs`
- `POST /jobs/search`

### Applications
- `GET /applications`
- `POST /applications/apply`
- `GET /applications/:id/preview`
- `POST /applications/:id/approve`
- `POST /applications/:id/reject`

## Local setup

1. Install dependencies

```bash
npm install
```

2. Configure environment (example)

```bash
export DATABASE_URL='file:./prisma/dev.db'
export GROQ_API_KEY='...'
export WEB_ORIGIN='http://localhost:5173'
```

3. Generate Prisma client and sync schema

```bash
DATABASE_URL='file:./prisma/dev.db' npm run db:generate
DATABASE_URL='file:./prisma/dev.db' npm run db:push
```

4. Run apps

```bash
npm run dev:api
npm run dev:web
```

5. Build all workspaces

```bash
npm run build
```
