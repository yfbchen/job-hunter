import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  job: {
    count: vi.fn(),
  },
  resume: {
    count: vi.fn(),
  },
  coverLetter: {
    count: vi.fn(),
  },
};

vi.mock("../src/lib/prisma.js", () => ({
  prisma: prismaMock,
}));

describe("health readiness endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns onboarding and scoring readiness stats", async () => {
    prismaMock.resume.count.mockResolvedValue(1);
    prismaMock.coverLetter.count.mockResolvedValue(1);
    prismaMock.job.count
      .mockResolvedValueOnce(5) // total jobs
      .mockResolvedValueOnce(2); // unscored jobs

    const { createApp } = await import("../src/app.js");
    const app = createApp();

    const res = await request(app).get("/api/health/readiness");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      resumeExists: true,
      coverLetterExists: true,
      totalJobs: 5,
      unscoredJobs: 2,
      scoredJobs: 3,
    });
  });
});
