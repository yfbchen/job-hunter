import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  job: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  resume: { findFirst: vi.fn() },
  coverLetter: { findFirst: vi.fn() },
};

vi.mock("../src/lib/prisma.js", () => ({ prisma: prismaMock }));

const fetchRemoteOkJobsMock = vi.fn();
const fetchRssJobsMock = vi.fn();

vi.mock("../src/jobs/fetchers/remoteok.js", () => ({
  fetchRemoteOkJobs: fetchRemoteOkJobsMock,
}));
vi.mock("../src/jobs/fetchers/rss.js", () => ({
  fetchRssJobs: fetchRssJobsMock,
}));

describe("POST /jobs/fetch role targeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.job.findMany.mockResolvedValue([]);
    prismaMock.job.create.mockResolvedValue({});
    fetchRemoteOkJobsMock.mockResolvedValue([]);
    fetchRssJobsMock.mockResolvedValue([]);
  });

  async function createApp() {
    const { jobsRouter } = await import("../src/routes/jobs.js");
    const app = express();
    app.use(express.json());
    app.use("/api/jobs", jobsRouter);
    return app;
  }

  it("passes role and location to fetchers when provided", async () => {
    const app = await createApp();
    await request(app)
      .post("/api/jobs/fetch")
      .send({ role: "product manager", location: "remote" });

    expect(fetchRemoteOkJobsMock).toHaveBeenCalledWith({ roleFilter: "product manager" });
    expect(fetchRssJobsMock).toHaveBeenCalledWith(
      expect.stringContaining("product+manager")
    );
    expect(fetchRssJobsMock).toHaveBeenCalledWith(
      expect.stringContaining("l=remote")
    );
  });

  it("uses default role and location when body empty", async () => {
    const app = await createApp();
    await request(app).post("/api/jobs/fetch").send({});

    expect(fetchRemoteOkJobsMock).toHaveBeenCalledWith({
      roleFilter: "software engineer",
    });
    expect(fetchRssJobsMock).toHaveBeenCalledWith(
      expect.stringMatching(/q=software\+engineer/)
    );
  });
});
