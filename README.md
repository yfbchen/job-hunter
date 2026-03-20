# Job Hunter

A personal job application assistant that scores job postings against your resume, tailors your artifacts for each role, and helps you apply efficiently.

## What It Does

1. **Store your artifacts** – Upload your resume (PDF/text) and base cover letter
2. **Discover jobs** – Daily fetch from RSS feeds (Indeed, etc.), RemoteOK API, or paste job descriptions manually
3. **Score matches** – AI rates each job (0–100) against your resume with reasoning
4. **Tailor content** – Generate role-specific resume bullets and cover letters
5. **Apply** – Copy/download tailored artifacts; optional form autofill (Phase 3)

## Planned Architecture

```
job-hunter/
├── apps/
│   ├── web/          # React + Vite + TypeScript + Tailwind
│   └── api/          # Node + Express + Prisma + SQLite
├── packages/
│   └── shared/       # Shared TypeScript types
├── .github/
│   └── workflows/    # GitHub Actions (daily job fetch)
└── package.json     # npm workspaces
```

### Tech Stack

| Layer    | Choice                    |
| -------- | ------------------------- |
| Frontend | React, Vite, TypeScript, Tailwind |
| Backend  | Node, Express             |
| Database | SQLite + Prisma           |
| LLM      | Anthropic (Claude Haiku)  |
| Scheduler| GitHub Actions            |

### Job Sources (Hybrid)

- **RSS** – Indeed and other feeds
- **RemoteOK API** – Remote jobs
- **Manual paste** – Paste job URL or description
- **Post-MVP** – Optional lightweight LinkedIn scrape (use sparingly)

### Phased Rollout

- **Phase 1 (MVP):** Monorepo, Node backend, React UI, manual paste + scoring + tailoring
- **Phase 2:** RSS + RemoteOK fetch, GitHub Actions daily run
- **Phase 3:** LinkedIn scrape placeholder, apply-assistant, tracking dashboard

### Current Phase 1 Status

- Monorepo API/Web scaffold completed
- Resume + cover artifact management (resume supports `.txt` and `.pdf`)
- Job ingest via manual paste + RSS + RemoteOK
- Per-job scoring and bulk scoring for unscored jobs
- Tailoring flow with editable outputs before copy
- Dashboard triage filters (score/source/time window/unscored-only/top-N)
- Readiness health endpoint + dashboard readiness checklist

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment (create apps/api/.env)
# ANTHROPIC_API_KEY=sk-ant-... (optional, enables LLM mode)

# Run development (both web and api)
npm run dev
```

## Environment Variables

Create `apps/api/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...  # Optional; without this, local fallback scoring/tailoring is used
DATABASE_URL="file:./dev.db"  # SQLite (default)
```

## Testing

```bash
# Run all tests (currently API specs)
npm test

# Run API tests in watch mode
npm run test:watch -w apps/api
```

## SQLite Now, Supabase Later

You can keep local development on SQLite and migrate to Supabase Postgres when you deploy.

### Migration Checklist

1. Create a Supabase project and copy the Postgres connection string.
2. Set production `DATABASE_URL` (Vercel environment variable) to the Supabase connection string.
3. Update Prisma datasource provider from `sqlite` to `postgresql` in `apps/api/prisma/schema.prisma`.
4. Create and apply migrations for Postgres:
   - `npm run db:generate`
   - `npx prisma migrate dev --name init_postgres` (run locally against Postgres URL)
   - `npx prisma migrate deploy` (in deploy pipeline/runtime)
5. Deploy API with the new environment variable and run a smoke test:
   - `GET /api/health`
   - `POST /api/jobs/fetch`
   - `GET /api/jobs`

### Notes

- Your current model shapes (`uuid` string IDs, timestamps, text fields) are portable.
- Keep SQLite for local speed; use Supabase only for hosted environments.
- This project currently does not use SQLite-specific raw SQL, so cutover risk is low.

## Implementation Plan (Todo)

- [ ] **Greenhouse + Lever fetchers** – Add job fetchers for Greenhouse (`boards-api.greenhouse.io`) and Lever (`api.lever.co`) APIs. Each company has its own board token; maintain a curated list of target companies and fetch jobs from each. No API key needed for Greenhouse job listing; official APIs, no scraping/blocking risk.
