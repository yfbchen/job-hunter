const REMOTEOK_URL = "https://remoteok.com/api";

export interface RemoteOkJob {
  id: string;
  position: string;
  company: string;
  description: string;
  url: string;
}

export async function fetchRemoteOkJobs(): Promise<RemoteOkJob[]> {
  const res = await fetch(REMOTEOK_URL, {
    headers: { "User-Agent": "JobHunter/1.0" },
  });
  if (!res.ok) {
    throw new Error(`RemoteOK request failed: ${res.status}`);
  }

  const data = (await res.json()) as unknown[];
  const jobs: RemoteOkJob[] = [];
  for (const item of data.slice(1, 51)) {
    if (item && typeof item === "object" && "id" in item && "position" in item) {
      const obj = item as Record<string, unknown>;
      jobs.push({
        id: String(obj.id),
        position: String(obj.position ?? ""),
        company: String(obj.company ?? ""),
        description: String(obj.description ?? "").replace(/<[^>]+>/g, " ").slice(0, 5000),
        url: `https://remoteok.com/l/${obj.id}`,
      });
    }
  }
  return jobs;
}
