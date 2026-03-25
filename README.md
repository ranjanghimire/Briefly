# Briefly Backend (Vercel Serverless)

Lightweight backend for the Briefly mobile news app:
- Fetches news (Bing primary, fallback provider)
- Generates short + long AI summaries
- Caches summaries and refresh metadata in Vercel KV
- Stores canonical articles + topics in Vercel Postgres
- Uses Vercel Cron Jobs to refresh on a schedule

## Quick start

1. Create a Vercel project from this repo.
2. Add environment variables from `.env.example` in Vercel.
3. Run database migrations (one-time).
   - Locally (if you have a compatible Postgres URL): `npm run migrate`
   - Otherwise, run `scripts/migrate.ts` against your Vercel Postgres using your preferred workflow.

## Cron jobs (Vercel)

Cron schedules are configured in `vercel.json`:
- Hourly: `/api/cron/refresh-topics`, `/api/cron/refresh-core`
- Daily: `/api/cron/decay-scores`
- Weekly: `/api/cron/cleanup`

## REST API

Base path is `/api`.

1. `GET /api/categories`
2. `GET /api/feed/core/[category]`
3. `GET /api/feed/custom/[topic]`
4. `GET /api/feed/mixed`
5. `POST /api/topic/[topic]/click`

## Notes on configuration

- `NEWS_API_KEYS` is a JSON string (Bing primary, GNews fallback).
- `AI_MODEL_KEYS` is a JSON string for OpenAI summarization.

## Migrations

SQL migrations live in `migrations/`.
The helper script `scripts/migrate.ts` applies them idempotently.

