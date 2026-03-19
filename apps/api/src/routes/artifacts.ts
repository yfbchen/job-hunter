import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/resume", async (_, res) => {
  const resume = await prisma.resume.findFirst({ orderBy: { updatedAt: "desc" } });
  res.json(resume ?? null);
});

router.post("/resume", upload.single("file"), async (req, res) => {
  let content = "";
  if (req.file) {
    content = req.file.buffer.toString("utf-8");
  } else if (typeof req.body?.content === "string") {
    content = req.body.content;
  }
  if (!content.trim()) {
    return res.status(400).json({ error: "Resume content is required" });
  }
  const resume = await prisma.resume.create({ data: { content } });
  res.json(resume);
});

router.put("/resume/:id", async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Content required" });
  const existing = await prisma.resume.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Resume not found" });

  const resume = await prisma.resume.update({
    where: { id: req.params.id },
    data: { content },
  });
  res.json(resume);
});

router.get("/cover-letter", async (_, res) => {
  const cover = await prisma.coverLetter.findFirst({ orderBy: { updatedAt: "desc" } });
  res.json(cover ?? null);
});

router.post("/cover-letter", async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Cover letter content is required" });
  const cover = await prisma.coverLetter.create({ data: { content } });
  res.json(cover);
});

router.put("/cover-letter/:id", async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Content required" });
  const existing = await prisma.coverLetter.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Cover letter not found" });

  const cover = await prisma.coverLetter.update({
    where: { id: req.params.id },
    data: { content },
  });
  res.json(cover);
});

export { router as artifactsRouter };
