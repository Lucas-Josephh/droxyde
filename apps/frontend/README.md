# @droxyde/web

Next.js 15 (App Router, React 19) frontend.

## Local

```bash
cp .env.example .env.local
pnpm dev   # http://localhost:3000
```

The web app calls the NestJS API on `NEXT_PUBLIC_API_URL` with `credentials: include`, so the session cookie set by the API is automatically reused.

## Scripts

| Script            | Purpose                  |
| ----------------- | ------------------------ |
| `pnpm dev`        | Next.js dev server       |
| `pnpm build`      | Production build         |
| `pnpm start`      | Run the production build |
| `pnpm lint`       | Next.js ESLint           |
| `pnpm type-check` | TypeScript strict check  |
| `pnpm test`       | Vitest unit tests        |
