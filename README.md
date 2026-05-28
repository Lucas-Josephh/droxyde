# Droxyde

Fullstack monorepo: **Next.js 15** (web) + **NestJS 10** (API) + **Prisma** + **PostgreSQL (Supabase)**, orchestrated by **Turborepo** and **pnpm workspaces**.

- Web (prod): https://droxyde.vercel.app
- API (prod): https://droxyde.onrender.com

```
.
├── apps
│   ├── api          # NestJS REST API
│   └── web          # Next.js App Router frontend
├── packages
│   ├── types        # Shared TS types (DTOs, response shapes) — used by web + api
│   └── tsconfig     # Shared TS configurations
├── .github/workflows
│   ├── ci.yml          # Lint + type-check + test + build
│   ├── commitlint.yml  # Conventional commits enforcement on PRs
│   └── deploy.yml      # Triggers Render + Vercel deploys, only if CI passed
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 1. Prerequisites

- **Node.js 20 LTS** (see `.nvmrc`)
- **pnpm 10+** (`npm install -g pnpm`)
- A **Supabase** project (PostgreSQL) — free tier works

---

## 2. Local setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Fill in your Supabase connection strings in `apps/api/.env`:

- `DATABASE_URL` → **pooled** connection (port `6543`, `?pgbouncer=true&connection_limit=1`)
- `DIRECT_URL` → **direct** connection (port `5432`) — required by `prisma migrate`

Generate a strong session secret:

```bash
openssl rand -hex 64   # paste as SESSION_SECRET in apps/api/.env
```

Apply the database schema:

```bash
pnpm --filter @droxyde/api prisma:migrate:dev
```

Start everything (parallel):

```bash
pnpm dev
```

- Web → http://localhost:3000
- API → http://localhost:4000/api
- Swagger → http://localhost:4000/api/docs

---

## 3. Shared types

The `@droxyde/types` package exposes DTO/response interfaces consumable from both apps:

```ts
// apps/web/...
import type { LoginPayload, AuthResponse, PublicUser } from '@droxyde/types';

// apps/api/...
import type { RegisterPayload } from '@droxyde/types';
```

Add types in `packages/types/src/`, then re-export them from `index.ts`. They are consumed as source (no build step required during dev) thanks to `transpilePackages` in Next.js and a tsconfig path in the API.

---

## 4. Authentication

Session-based, database-backed, with a signed httpOnly cookie.

| Endpoint                  | Description                               |
| ------------------------- | ----------------------------------------- |
| `POST /api/auth/register` | Create user + open session                |
| `POST /api/auth/login`    | Validate credentials + open session       |
| `POST /api/auth/logout`   | Revoke current session (cookie-protected) |
| `GET  /api/auth/me`       | Return `{ authenticated, user }`          |
| `DELETE /api/auth/me`     | Delete the user + cascade their sessions  |

Cookie behavior:

- Dev: `SameSite=Lax`, no `Secure`
- Prod: `SameSite=None; Secure` (required because the front is on `vercel.app` and the API on `onrender.com` — cross-site)
- Always `httpOnly` + signed with `SESSION_SECRET`

---

## 5. CI/CD overview

The pipeline is a two-step process driven entirely by GitHub Actions:

1. **CI** (`.github/workflows/ci.yml`) — runs on every push and PR to `main`:
   - `pnpm install` (frozen lockfile)
   - `prisma generate`
   - `type-check`, `lint`, `build`, `test`, `test:e2e`
2. **Deploy** (`.github/workflows/deploy.yml`) — runs **only when CI succeeds on a push to `main`** via `workflow_run`:
   - Calls the **Render Deploy Hook** → rebuilds the backend
   - Calls the **Vercel Deploy Hook** → rebuilds the frontend

> Because deploys are triggered exclusively by these hooks, **you must disable the native auto-deploy** on both Vercel and Render (see below). Otherwise both providers would deploy on every push, bypassing the CI gate.

---

## 6. Deploy to **Render** (backend — NestJS + Prisma)

### 6.1 — Create the Web Service

1. Render Dashboard → **New +** → **Web Service** → connect this repo.
2. **Name**: `droxyde` (so URL becomes `droxyde.onrender.com`)
3. **Region**: closest to your Supabase region (e.g. `Frankfurt` for `eu-west-3`)
4. **Branch**: `main`
5. **Root Directory**: _(leave empty — we build from repo root for monorepo support)_
6. **Runtime**: `Node`
7. **Build Command**:
   ```bash
   corepack enable && corepack prepare pnpm@10.33.2 --activate && pnpm install --frozen-lockfile && pnpm --filter @droxyde/api... build && pnpm --filter @droxyde/api prisma:migrate:deploy
   ```
8. **Start Command**:
   ```bash
   pnpm --filter @droxyde/api start:prod
   ```
9. **Health Check Path**: `/api/health`
10. **Instance Type**: Starter (or Free for testing — but free instances spin down)

### 6.2 — **Disable auto-deploy** (critical!)

In the service settings → **Build & Deploy** → set **Auto-Deploy** to **No**. This way only the CI-gated GitHub Action can trigger deploys.

### 6.3 — Create the Deploy Hook

Service settings → **Deploy Hook** → **Copy URL** → save it as the GitHub repo secret `RENDER_DEPLOY_HOOK_URL`.

### 6.4 — Environment variables

Add these in the Render service → **Environment**:

| Variable              | Value                        | Notes                                                                    |
| --------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| `NODE_ENV`            | `production`                 | auto-set by Render usually, but explicit is safer                        |
| `PORT`                | `10000`                      | Render's default — leave as default, do not hard-code 4000               |
| `DATABASE_URL`        | _(from Supabase, pooled)_    | `...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL`          | _(from Supabase, direct)_    | `...pooler.supabase.com:5432/postgres`                                   |
| `SESSION_SECRET`      | _(`openssl rand -hex 64`)_   | Long random secret                                                       |
| `SESSION_COOKIE_NAME` | `droxyde.sid`                | optional, default works                                                  |
| `SESSION_TTL_DAYS`    | `30`                         | optional                                                                 |
| `FRONTEND_URL`        | `https://droxyde.vercel.app` | exact origin, comma-separated if multiple                                |
| `COOKIE_DOMAIN`       | _(leave EMPTY)_              | front and back on different root domains → don't set a domain            |

> **Why leave `COOKIE_DOMAIN` empty?** With `SameSite=None; Secure`, the cookie is set on the API host (`droxyde.onrender.com`) and sent on every cross-site request to it from `droxyde.vercel.app` without needing a shared parent domain.

### 6.5 — Free tier note

Render free instances cold-start (~30 s). For an always-on backend, switch to the paid Starter plan. The health check at `/api/health` helps Render decide when an instance is ready after a deploy.

---

## 7. Deploy to **Vercel** (frontend — Next.js)

### 7.1 — Create the project

1. Vercel Dashboard → **Add New** → **Project** → import this repo.
2. **Framework Preset**: Next.js
3. **Root Directory**: `apps/web` (click _Edit_ and pick the folder)
4. **Build Command**: _(leave default, Vercel auto-detects `next build`)_
5. **Install Command**: `pnpm install --frozen-lockfile`
6. **Output Directory**: _(leave default)_
7. **Node.js Version**: `20.x` (Project settings → General)

> Vercel auto-detects pnpm workspaces and will install at the repo root.

### 7.2 — **Disable Git auto-deploy on `main`** (critical!)

Two options — pick **one**:

- **Project Settings → Git → Ignored Build Step**: paste the script below. It tells Vercel to skip every git-triggered build; only deploys triggered by our deploy hook (which sends a `GIT_BRANCH` header it ignores) or by us manually will run.

  ```bash
  echo "Skipping — deploys are CI-gated via GitHub Actions" && exit 0
  ```

  **Limitation**: this also skips Preview Deployments on PRs.

- **Better option for keeping previews**: keep production deploys gated by your CI, by enabling “Only deploy production from this branch” = `__never__` (a non-existent branch) **OR** by using **Vercel’s “Deploy Hooks”** for prod **and** unchecking _Production_ in `Settings → Git → Production Branch` so only previews get auto-deployed.

> Simplest setup: pick the first option for now. PR previews can be re-enabled later by removing the ignored build step.

### 7.3 — Create the Deploy Hook (production)

Project Settings → **Git** → **Deploy Hooks** → Create:

- **Name**: `gh-actions-prod`
- **Branch**: `main`
- → Copy URL → save it as GitHub repo secret `VERCEL_DEPLOY_HOOK_URL`.

### 7.4 — Environment variables

In Project Settings → **Environment Variables** (scope: _Production_):

| Variable              | Value                          |
| --------------------- | ------------------------------ |
| `NEXT_PUBLIC_API_URL` | `https://droxyde.onrender.com` |
| `API_INTERNAL_URL`    | `https://droxyde.onrender.com` |

For **Preview** environment (PRs), reuse the same values pointing to your prod API, or create a Render preview service.

---

## 8. Required GitHub repository secrets

Set them in **Settings → Secrets and variables → Actions → New repository secret**:

| Secret                   | Where to get it                       |
| ------------------------ | ------------------------------------- |
| `RENDER_DEPLOY_HOOK_URL` | Render → Web Service → Deploy Hook    |
| `VERCEL_DEPLOY_HOOK_URL` | Vercel → Project → Git → Deploy Hooks |

That's it for deploys — no Vercel/Render API tokens needed because we go through deploy hooks.

---

## 9. Day-to-day commands

```bash
pnpm dev                          # run all apps in parallel (turbo)
pnpm build                        # build everything
pnpm test                         # all unit tests
pnpm test:e2e                     # API e2e tests
pnpm type-check                   # tsc --noEmit everywhere
pnpm lint
pnpm format                       # prettier --write
pnpm --filter @droxyde/api prisma:studio
pnpm --filter @droxyde/api prisma:migrate:dev --name <change>
```

---

## 10. Conventional commits

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/). Enforced on PRs by the `Commitlint` workflow.

Examples:

```
feat(api): add password reset flow
fix(web): redirect to /login on 401
chore: bump turbo to 2.3.4
```

---

## 11. Troubleshooting

| Symptom                                       | Likely cause                                   | Fix                                                                   |
| --------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| 401 / no session on web in prod               | `SameSite=Lax` cookie blocked cross-site       | Confirm `NODE_ENV=production` on Render so cookie is `None;Secure`    |
| `fetch failed` from Next.js Server Component  | API cold-started on Render free tier           | Upgrade to Starter, or add retry/timeout                              |
| `prisma migrate deploy` hangs in Render build | Using pooled URL for `DIRECT_URL`              | `DIRECT_URL` must be the **direct** Supabase connection (port `5432`) |
| Render builds run out of memory               | pnpm + turbo on Free tier (512 MB)             | Upgrade to Starter, or split the build to API-only on Render          |
| CORS error in browser                         | `FRONTEND_URL` mismatch                        | Must match the origin exactly (scheme + host, no path)                |
| Web deploys still trigger from git pushes     | Forgot to set the Ignored Build Step on Vercel | See section 7.2                                                       |
| Backend deploys still trigger from git pushes | Auto-Deploy still on in Render                 | See section 6.2                                                       |
