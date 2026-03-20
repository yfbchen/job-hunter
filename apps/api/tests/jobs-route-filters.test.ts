import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  job: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  resume: {
    findFirst: vi.fn(),
    count: vi.fn(),
  },
  coverLetter: {
    findFirst: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock("../src/lib/prisma.js", () => ({
  prisma: prismaMock,
}));

describe("jobs router filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function createApp() {
    const { jobsRouter } = await import("../src/routes/jobs.js");
    const app = express();
    app.use(express.json());
    app.use("/api/jobs", jobsRouter);
    return app;
  }

  it("rejects minScore when combined with unscored=true", async () => {
    const app = await createApp();
    const res = await request(app).get("/api/jobs?minScore=70&unscored=true");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("minScore");
  });

  it("rejects invalid source values", async () => {
    const app = await createApp();
    const res = await request(app).get("/api/jobs?source=glassdoor");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("source");
  });

  it("rejects limit outside accepted bounds", async () => {
    const app = await createApp();
    const res = await request(app).get("/api/jobs?limit=999");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("limit");
  });

  it("applies unscored and limit filters into prisma query", async () => {
    prismaMock.job.findMany.mockResolvedValue([]);
    const app = await createApp();

    const res = await request(app).get("/api/jobs?unscored=true&limit=25");

    expect(res.status).toBe(200);
    expect(prismaMock.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ score: null }),
        take: 25,
      })
    );
  });

  it("rejects whitespace-only manual paste payloads", async () => {
    const app = await createApp();
    const res = await request(app).post("/api/jobs/paste").send({ text: "   " });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Text is required");
  });
});
