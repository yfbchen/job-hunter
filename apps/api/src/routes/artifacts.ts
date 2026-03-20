import { Router } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { prisma } from "../lib/prisma.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/resume", async (_, res) => {
  const resume = await prisma.resume.findFirst({ orderBy: { updatedAt: "desc" } });
  res.json(resume ?? null);
});

router.post("/resume", upload.single("file"), async (req, res) => {
  try {
    let content = "";
    if (req.file) {
      content = await extractResumeContent(req.file);
    } else if (typeof req.body?.content === "string") {
      content = req.body.content;
    }
    if (!content.trim()) {
      return res.status(400).json({ error: "Resume content is required" });
    }
    const resume = await prisma.resume.create({ data: { content } });
    res.json(resume);
  } catch (err) {
    const errorObj = (err ?? {}) as { status?: number; message?: string };
    const status = Number(errorObj.status ?? 500);
    const message = errorObj.message ?? "Failed to process resume upload";
    return res.status(status).json({ error: message });
  }
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

async function extractResumeContent(file: Express.Multer.File): Promise<string> {
  const lowerName = file.originalname.toLowerCase();
  const isPdf = file.mimetype === "application/pdf" || lowerName.endsWith(".pdf");
  const isText = file.mimetype.startsWith("text/") || lowerName.endsWith(".txt");

  if (isPdf) {
    const parser = new PDFParse({ data: file.buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return parsed.text ?? "";
  }

  if (isText) {
    return file.buffer.toString("utf-8");
  }

  throw Object.assign(new Error("Unsupported resume file type. Upload .txt or .pdf"), { status: 400 });
}

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
