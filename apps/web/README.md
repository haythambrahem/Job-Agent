# @job-agent/web (Next.js)

Frontend SaaS app built with Next.js + NextAuth.

## Key features

- Email/password sign-up and sign-in (NextAuth credentials)
- Session-aware protected dashboard routes
- Tenant-scoped API consumption with credentialed requests
- Subscription controls (Stripe checkout + billing portal links)

## Environment variables

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (example: `http://localhost:3000`)
- `NEXT_PUBLIC_API_BASE_URL` (example: `http://localhost:4000`)
- `DATABASE_URL` (same PostgreSQL instance as API)

## Commands

```bash
npm run dev --workspace @job-agent/web
npm run build --workspace @job-agent/web
npm run start --workspace @job-agent/web
```
