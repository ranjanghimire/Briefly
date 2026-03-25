# Briefly (Frontend + Backend)

Lightweight backend for the Briefly mobile news app:
- Fetches news (Bing primary, fallback provider)
- Generates short + long AI summaries 
- Caches summaries and refresh metadata in Vercel KV
- Stores canonical articles + topics in Vercel Postgres
- On-demand refresh when feeds are requested (no scheduled cron)

Minimal mobile-first frontend:
- Next.js App Router + Tailwind
- Premium-feeling feed cards + long-summary modal
- Topics + Profile screens with bottom navigation

## Quick start

1. Create a Vercel project from this repo.
2. Add environment variables from `.env.example` in Vercel.
3. Run database migrations (one-time).
   - Locally (if you have a compatible Postgres URL): `npm run migrate`
   - Otherwise, run `scripts/migrate.ts` against your Vercel Postgres using your preferred workflow.

## Background refresh

Feeds call `POST /api/internal/refresh` (fire-and-forget) when KV says content is stale. Configure optional `INTERNAL_REFRESH_SECRET` (Bearer token) and `BRIEFLY_BASE_URL` for reliable server-side `fetch` on Vercel.

## REST API

Base path is `/api`.

1. `GET /api/categories`
2. `GET /api/feed/core/[category]`
3. `GET /api/feed/custom/[topic]`
4. `GET /api/feed/mixed`
5. `POST /api/topic/[topic]/click`
6. `POST /api/internal/refresh` (JSON body: `{ "category": "world" }` **or** `{ "topic": "Ai" }`, not both)

## Notes on configuration

- `NEWS_API_KEYS` is a JSON string (Bing primary, GNews fallback).
- `AI_MODEL_KEYS` is a JSON string for OpenAI summarization.

## Frontend routes

- `/feed`
- `/topics`
- `/profile`

## Migrations

SQL migrations live in `migrations/`.
The helper script `scripts/migrate.ts` applies them idempotently.

