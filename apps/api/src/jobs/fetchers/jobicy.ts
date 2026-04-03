/**
 * Jobicy Remote Jobs API - free, no auth required.
 * https://jobicy.com/api/v2/remote-jobs
 * Params: tag (role/keyword), geo (location), count (1-100)
 */

const JOBICY_URL = "https://jobicy.com/api/v2/remote-jobs";

export interface JobicyJob {
  title: string;
  company: string;
  description: string;
  url: string;
}

export interface FetchJobicyOptions {
  tag?: string;
  geo?: string;
  count?: number;
}

export async function fetchJobicyJobs(
  options: FetchJobicyOptions = {}
): Promise<JobicyJob[]> {
  const params = new URLSearchParams();
  if (options.tag?.trim()) params.set("tag", options.tag.trim());
  if (options.geo?.trim()) params.set("geo", options.geo.trim());
  params.set("count", String(Math.min(100, Math.max(1, options.count ?? 50))));

  const url = `${JOBICY_URL}?${params.toString()}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "JobHunter/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Jobicy request failed: ${res.status}`);
  }

  const data = (await res.json()) as { jobs?: Array<Record<string, unknown>> };
  const jobs = data.jobs ?? [];

  return jobs.map((j) => ({
    title: String(j.jobTitle ?? j.title ?? "Unknown"),
    company: String(j.companyName ?? j.company ?? "Unknown"),
    description: String(j.jobDescription ?? j.jobExcerpt ?? j.description ?? "")
      .replace(/<[^>]+>/g, " ")
      .slice(0, 5000),
    url: String(j.url ?? ""),
  }));
}
