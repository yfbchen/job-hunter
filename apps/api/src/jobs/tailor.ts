import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is required");
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export interface TailoredArtifacts {
  resumeBullets: string;
  coverLetter: string;
}

export async function tailorArtifacts(
  resumeContent: string,
  coverLetterContent: string,
  job: { title: string; company: string; description: string }
): Promise<TailoredArtifacts> {
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

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i)?.[1] ?? trimmed;
    return JSON.parse(fenced);
  }
}
