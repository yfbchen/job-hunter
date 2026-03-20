import { beforeEach, describe, expect, it, vi } from "vitest";

describe("scoreJob fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("returns bounded fallback score and reasoning when no API key", async () => {
    const { scoreJob } = await import("../src/jobs/scorer.js");

    const result = await scoreJob(
      "Built React TypeScript features and Prisma-backed APIs.",
      {
        title: "Full Stack Engineer",
        company: "Example",
        description: "Looking for React, TypeScript, Node, and Prisma experience.",
      }
    );

    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.score).toBeLessThanOrEqual(90);
    expect(result.reasoning).toContain("Fallback score");
  });
});
