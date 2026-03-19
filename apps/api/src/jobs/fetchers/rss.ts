export interface RssJob {
  title: string;
  company: string;
  description: string;
  url: string;
}

export async function fetchRssJobs(feedUrl: string): Promise<RssJob[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "JobHunter/1.0" },
  });
  if (!res.ok) {
    throw new Error(`RSS request failed: ${res.status}`);
  }

  const xml = await res.text();
  const jobs: RssJob[] = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title") ?? "";
    const link = extractTag(block, "link") ?? "";
    const desc = extractTag(block, "description") ?? "";
    const company = extractTag(block, "dc:creator") ?? extractTag(block, "author") ?? "Unknown";
    if (title) {
      jobs.push({
        title: decodeXml(title),
        company: decodeXml(company),
        description: decodeXml(desc).replace(/<[^>]+>/g, " ").slice(0, 5000),
        url: link,
      });
    }
  }

  return jobs;
}

function extractTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
