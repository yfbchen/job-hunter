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

const scoreJobMock = vi.fn();

vi.mock("../src/lib/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../src/jobs/scorer.js", () => ({
  scoreJob: scoreJobMock,
}));

describe("jobs bulk score", () => {
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

  it("returns 400 for bulk scoring when no resume exists", async () => {
    prismaMock.resume.findFirst.mockResolvedValue(null);
    const app = await createApp();

    const res = await request(app).post("/api/jobs/score-unscored").send({ limit: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("resume");
  });

  it("scores unscored jobs up to limit and returns summary", async () => {
    prismaMock.resume.findFirst.mockResolvedValue({ id: "r1", content: "resume" });
    prismaMock.job.findMany.mockResolvedValue([
      { id: "j1", title: "A", company: "X", description: "desc1" },
      { id: "j2", title: "B", company: "Y", description: "desc2" },
    ]);
    scoreJobMock.mockResolvedValue({ score: 77, reasoning: "good fit" });
    prismaMock.job.update.mockResolvedValue({});

    const app = await createApp();
    const res = await request(app).post("/api/jobs/score-unscored").send({ limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.scored).toBe(2);
    expect(res.body.failed).toBe(0);
    expect(scoreJobMock).toHaveBeenCalledTimes(2);
    expect(prismaMock.job.update).toHaveBeenCalledTimes(2);
  });

  it("score-selected returns 400 when ids is empty", async () => {
    const app = await createApp();
    const res = await request(app).post("/api/jobs/score-selected").send({ ids: [] });
    expect(res.status).toBe(400);
  });

  it("score-selected scores jobs by id and returns summary", async () => {
    prismaMock.resume.findFirst.mockResolvedValue({ id: "r1", content: "resume" });
    prismaMock.job.findMany.mockResolvedValue([
      { id: "j1", title: "A", company: "X", description: "desc1" },
      { id: "j2", title: "B", company: "Y", description: "desc2" },
    ]);
    scoreJobMock.mockResolvedValue({ score: 80, reasoning: "fit" });
    prismaMock.job.update.mockResolvedValue({});

    const app = await createApp();
    const res = await request(app).post("/api/jobs/score-selected").send({ ids: ["j1", "j2"] });

    expect(res.status).toBe(200);
    expect(res.body.scored).toBe(2);
    expect(prismaMock.job.findMany).toHaveBeenCalledWith({ where: { id: { in: ["j1", "j2"] } } });
  });

  it("delete-selected returns 400 when ids is empty", async () => {
    const app = await createApp();
    const res = await request(app).post("/api/jobs/delete-selected").send({ ids: [] });
    expect(res.status).toBe(400);
  });

  it("delete-selected deletes jobs by id", async () => {
    prismaMock.job.deleteMany.mockResolvedValue({ count: 2 });

    const app = await createApp();
    const res = await request(app).post("/api/jobs/delete-selected").send({ ids: ["j1", "j2"] });

    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(2);
    expect(prismaMock.job.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["j1", "j2"] } } });
  });
});
