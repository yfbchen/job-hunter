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

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment (create apps/api/.env)
# ANTHROPIC_API_KEY=sk-ant-...

# Run development (both web and api)
npm run dev
```

## Environment Variables

Create `apps/api/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...  # Required for scoring and tailoring
DATABASE_URL="file:./dev.db"  # SQLite (default)
```
