import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is required");
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export interface ScoreResult {
  score: number;
  reasoning: string;
}

export async function scoreJob(resumeContent: string, job: { title: string; company: string; description: string }): Promise<ScoreResult> {
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

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i)?.[1] ?? trimmed;
    return JSON.parse(fenced);
  }
}
