import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  resume: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  coverLetter: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("../src/lib/prisma.js", () => ({
  prisma: prismaMock,
}));

describe("artifacts resume upload type validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.resume.create.mockResolvedValue({ id: "r1", content: "ok" });
  });

  async function createApp() {
    const { artifactsRouter } = await import("../src/routes/artifacts.js");
    const app = express();
    app.use(express.json());
    app.use("/api/artifacts", artifactsRouter);
    return app;
  }

  it("rejects unsupported resume file types", async () => {
    const app = await createApp();
    const res = await request(app)
      .post("/api/artifacts/resume")
      .attach("file", Buffer.from("not important"), { filename: "resume.docx", contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Unsupported resume file type");
  });

  it("accepts text uploads", async () => {
    const app = await createApp();
    const res = await request(app)
      .post("/api/artifacts/resume")
      .attach("file", Buffer.from("TypeScript React"), { filename: "resume.txt", contentType: "text/plain" });

    expect(res.status).toBe(200);
    expect(prismaMock.resume.create).toHaveBeenCalled();
  });
});
