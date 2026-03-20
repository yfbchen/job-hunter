const REMOTEOK_URL = "https://remoteok.com/api";

export interface RemoteOkJob {
  id: string;
  position: string;
  company: string;
  description: string;
  url: string;
}

export interface FetchRemoteOkOptions {
  roleFilter?: string;
}

export async function fetchRemoteOkJobs(
  options: FetchRemoteOkOptions = {}
): Promise<RemoteOkJob[]> {
  const { roleFilter } = options;
  const res = await fetch(REMOTEOK_URL, {
    headers: { "User-Agent": "JobHunter/1.0" },
  });
  if (!res.ok) {
    throw new Error(`RemoteOK request failed: ${res.status}`);
  }

  const data = (await res.json()) as unknown[];
  const rawItems: Array<Record<string, unknown>> = [];
  for (const item of data.slice(1, 51)) {
    if (item && typeof item === "object" && "id" in item && "position" in item) {
      rawItems.push(item as Record<string, unknown>);
    }
  }

  let filtered = rawItems;
  if (roleFilter?.trim()) {
    filtered = filterByRole(rawItems, roleFilter.trim());
  }

  return filtered.map((obj) => ({
    id: String(obj.id),
    position: String(obj.position ?? ""),
    company: String(obj.company ?? ""),
    description: String(obj.description ?? "")
      .replace(/<[^>]+>/g, " ")
      .slice(0, 5000),
    url: `https://remoteok.com/l/${obj.id}`,
  }));
}

function filterByRole(
  items: Array<Record<string, unknown>>,
  role: string
): Array<Record<string, unknown>> {
  const keywords = role
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);
  if (keywords.length === 0) return items;

  return items.filter((obj) => {
    const pos = String(obj.position ?? "").toLowerCase();
    const tags = Array.isArray(obj.tags) ? obj.tags : [];
    const tagStr = tags.map(String).join(" ").toLowerCase();
    const searchable = `${pos} ${tagStr}`;
    return keywords.some((kw) => searchable.includes(kw));
  });
}
