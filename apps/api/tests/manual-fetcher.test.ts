import { describe, expect, it } from "vitest";
import { parseManualPaste } from "../src/jobs/fetchers/manual.js";

describe("parseManualPaste", () => {
  it("parses title, company, and description from multiline paste", () => {
    const input = [
      "Senior Full Stack Engineer",
      "Example Labs",
      "Build TypeScript APIs",
      "Collaborate with product",
    ].join("\n");

    const parsed = parseManualPaste(input);
    expect(parsed.title).toBe("Senior Full Stack Engineer");
    expect(parsed.company).toBe("Example Labs");
    expect(parsed.description).toContain("Build TypeScript APIs");
    expect(parsed.description).toContain("Collaborate with product");
  });

  it("captures URL when present", () => {
    const input = [
      "Platform Engineer",
      "Cloud Corp",
      "https://example.com/jobs/123",
      "Maintain backend systems",
    ].join("\n");

    const parsed = parseManualPaste(input);
    expect(parsed.url).toBe("https://example.com/jobs/123");
  });

  it("falls back to unknown values when sparse input", () => {
    const parsed = parseManualPaste("  ");
    expect(parsed.title).toBe("Unknown Role");
    expect(parsed.company).toBe("Unknown Company");
    expect(parsed.description).toBe("  ");
  });
});
