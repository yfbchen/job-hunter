import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

export interface ScoreResult {
  score: number;
  reasoning: string;
}

export async function scoreJob(resumeContent: string, job: { title: string; company: string; description: string }): Promise<ScoreResult> {
  if (!anthropic) {
    return scoreJobLocally(resumeContent, job);
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a job match scorer. Rate how well the candidate's resume matches the job (0-100).
Respond ONLY with valid JSON: { "score": number, "reasoning": "brief explanation" }
Be realistic: 70+ = strong match, 50-69 = partial match, below 50 = weak match.`,
    messages: [
      {
        role: "user",
        content: `Resume:\n${resumeContent.slice(0, 6000)}\n\n---\nJob: ${job.title} at ${job.company}\n\n${job.description.slice(0, 4000)}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  const text = block && "text" in block ? block.text : "{}";
  const parsed = parseJsonObject(text) as { score?: number; reasoning?: string };
  const score = Math.min(100, Math.max(0, Number(parsed.score) ?? 50));
  const reasoning = String(parsed.reasoning ?? "No reasoning provided.");

  return { score, reasoning };
}

function scoreJobLocally(
  resumeContent: string,
  job: { title: string; company: string; description: string }
): ScoreResult {
  const resumeTokens = tokenize(resumeContent);
  const jobTokens = tokenize(`${job.title} ${job.company} ${job.description}`);

  const jobUnique = new Set(jobTokens);
  const overlap = resumeTokens.filter((token) => jobUnique.has(token));
  const overlapRatio = jobUnique.size === 0 ? 0 : overlap.length / jobUnique.size;
  const score = Math.round(Math.min(90, Math.max(20, 20 + overlapRatio * 100)));

  const sampleTerms = [...new Set(overlap)].slice(0, 8);
  const reasoning =
    sampleTerms.length > 0
      ? `Fallback score (no LLM key configured). Keyword overlap found on: ${sampleTerms.join(", ")}.`
      : "Fallback score (no LLM key configured). Limited keyword overlap detected.";

  return { score, reasoning };
}

function tokenize(input: string): string[] {
  const stopWords = new Set([
    "and", "the", "for", "with", "from", "that", "this", "are", "you", "your", "our", "was", "were", "have",
    "has", "will", "their", "about", "into", "over", "under", "than", "then", "when", "what", "where", "who",
    "why", "how", "not", "but", "all", "any", "can", "out", "job", "role", "company", "team", "work", "using"
  ]);

  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));
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
