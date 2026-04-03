/**
 * Greenhouse Job Board API - free, no auth for listing jobs.
 * Each company has its own board: https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs
 * Requires a curated list of company board tokens.
 */

const GREENHOUSE_BASE = "https://boards-api.greenhouse.io/v1/boards";

export interface GreenhouseJob {
  title: string;
  company: string;
  description: string;
  url: string;
}

/** Popular tech companies using Greenhouse (board tokens from their careers URLs) */
const DEFAULT_BOARD_TOKENS = [
  "stripe",
  "notion",
  "figma",
  "linear",
  "vercel",
  "discord",
  "airbnb",
  "dropbox",
  "reddit",
  "square",
  "coinbase",
  "datadog",
  "hashicorp",
  "mongodb",
  "twilio",
  "asana",
  "canva",
  "doordash",
  "instacart",
  "robinhood",
  "plaid",
  "brex",
  "rippling",
  "deel",
  "lattice",
  "gusto",
  "retool",
  "supabase",
  "replicate",
  "anthropic",
  "openai",
  "scale",
  "runway",
  "langchain",
  "perplexity",
  "claude",
  "cursor",
  "netlify",
  "cloudflare",
];

export async function fetchGreenhouseJobs(
  boardTokens: string[] = DEFAULT_BOARD_TOKENS
): Promise<GreenhouseJob[]> {
  const allJobs: GreenhouseJob[] = [];

  for (const token of boardTokens) {
    try {
      const url = `${GREENHOUSE_BASE}/${encodeURIComponent(token)}/jobs?content=true`;
      const res = await fetch(url, {
        headers: { "User-Agent": "JobHunter/1.0" },
      });

      if (!res.ok) continue;

      const data = (await res.json()) as { jobs?: Array<Record<string, unknown>> };
      const jobs = data.jobs ?? [];

      for (const j of jobs) {
        const company = String(j.company_name ?? token);
        allJobs.push({
          title: String(j.title ?? "Unknown"),
          company,
          description: String(j.content ?? j.description ?? "")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/<[^>]+>/g, " ")
            .slice(0, 5000),
          url: String(j.absolute_url ?? j.url ?? ""),
        });
      }
    } catch {
      // Skip failed boards
    }
  }

  return allJobs;
}
