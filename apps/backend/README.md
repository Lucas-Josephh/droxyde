# @droxyde/api

NestJS REST API for Droxyde. PostgreSQL via Prisma. Sessions in DB, cookie-based auth.

## Local

```bash
cp .env.example .env
pnpm prisma:migrate:dev   # creates tables on your Supabase DB
pnpm dev                  # http://localhost:4000/api
```

Swagger UI is exposed in non-prod at `http://localhost:4000/api/docs`.

## Useful scripts

| Script                       | Purpose                                   |
| ---------------------------- | ----------------------------------------- |
| `pnpm dev`                   | Hot-reload Nest server                    |
| `pnpm build`                 | Compile to `dist/`                        |
| `pnpm start:prod`            | Run the compiled server                   |
| `pnpm prisma:generate`       | Regenerate Prisma client                  |
| `pnpm prisma:migrate:dev`    | Create+apply a new migration locally      |
| `pnpm prisma:migrate:deploy` | Apply pending migrations (used on Render) |
| `pnpm test`                  | Unit tests (Jest)                         |
| `pnpm test:e2e`              | End-to-end tests                          |

## Endpoints (auth)

| Method | Path                 | Body                         | Auth                                           |
| ------ | -------------------- | ---------------------------- | ---------------------------------------------- |
| POST   | `/api/auth/register` | `{ email, password, name? }` | –                                              |
| POST   | `/api/auth/login`    | `{ email, password }`        | –                                              |
| POST   | `/api/auth/logout`   | –                            | cookie                                         |
| GET    | `/api/auth/me`       | –                            | – (returns `{ authenticated: false }` if none) |
| DELETE | `/api/auth/me`       | –                            | cookie                                         |
