import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

export interface TailoredArtifacts {
  resumeBullets: string;
  coverLetter: string;
}

export async function tailorArtifacts(
  resumeContent: string,
  coverLetterContent: string,
  job: { title: string; company: string; description: string }
): Promise<TailoredArtifacts> {
  if (!anthropic) {
    return tailorLocally(resumeContent, coverLetterContent, job);
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `You tailor resumes and cover letters for specific jobs.
Respond ONLY with valid JSON:
{
  "resumeBullets": "3-5 bullet points highlighting the most relevant experience for THIS role, written in past tense, quantified where possible",
  "coverLetter": "A tailored cover letter (3-4 short paragraphs) that references the company and role specifically"
}`,
    messages: [
      {
        role: "user",
        content: `Resume:\n${resumeContent.slice(0, 6000)}\n\nBase cover letter:\n${coverLetterContent.slice(0, 3000)}\n\n---\nJob: ${job.title} at ${job.company}\n\n${job.description.slice(0, 4000)}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  const text = block && "text" in block ? block.text : "{}";
  const parsed = parseJsonObject(text) as { resumeBullets?: string; coverLetter?: string };
  return {
    resumeBullets: String(parsed.resumeBullets ?? ""),
    coverLetter: String(parsed.coverLetter ?? ""),
  };
}

function tailorLocally(
  resumeContent: string,
  coverLetterContent: string,
  job: { title: string; company: string; description: string }
): TailoredArtifacts {
  const bullets = extractHighlightBullets(resumeContent, job.description);
  const coverLetter = buildCoverLetter(coverLetterContent, job);
  return { resumeBullets: bullets, coverLetter };
}

function extractHighlightBullets(resumeContent: string, jobDescription: string): string {
  const resumeLines = resumeContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const keywords = new Set(
    jobDescription
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3)
  );

  const scoredLines = resumeLines.map((line) => {
    const tokens = line
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3);
    const matchCount = tokens.filter((token) => keywords.has(token)).length;
    return { line, matchCount };
  });

  const top = scoredLines
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 5)
    .map((entry) => `- ${entry.line}`);

  if (top.length > 0) {
    return top.join("\n");
  }

  return "- Tailor your recent impact to emphasize outcomes relevant to this role.\n- Highlight technologies and responsibilities mentioned in the job description.\n- Quantify achievements where possible (latency, revenue, reliability, or delivery speed).";
}

function buildCoverLetter(
  baseCoverLetter: string,
  job: { title: string; company: string }
): string {
  const base = baseCoverLetter.trim();
  const opening = `Dear Hiring Team at ${job.company},`;
  const body = `I am excited to apply for the ${job.title} role. I bring experience delivering measurable results on cross-functional projects and I am especially motivated by the opportunity to contribute at ${job.company}.`;
  const closing = "Thank you for your consideration. I would welcome the chance to discuss how my background aligns with your team.";

  if (!base) {
    return `${opening}\n\n${body}\n\n${closing}`;
  }

  return `${opening}\n\n${body}\n\n${base}\n\n${closing}`;
}

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i)?.[1] ?? trimmed;
    return JSON.parse(fenced);
  }
}
