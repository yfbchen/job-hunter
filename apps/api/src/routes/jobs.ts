import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { scoreJob } from "../jobs/scorer.js";
import { tailorArtifacts } from "../jobs/tailor.js";
import { parseManualPaste } from "../jobs/fetchers/manual.js";
import { fetchRemoteOkJobs } from "../jobs/fetchers/remoteok.js";
import { fetchRssJobs } from "../jobs/fetchers/rss.js";

const router = Router();

router.get("/", async (req, res) => {
  const minScore = req.query.minScore ? Number(req.query.minScore) : undefined;
  const source = typeof req.query.source === "string" ? req.query.source.trim().toLowerCase() : undefined;
  const days = req.query.days ? Number(req.query.days) : undefined;

  if (minScore != null && Number.isNaN(minScore)) {
    return res.status(400).json({ error: "minScore must be numeric" });
  }
  if (days != null && (Number.isNaN(days) || days < 1)) {
    return res.status(400).json({ error: "days must be a positive number" });
  }

  const allowedSources = new Set(["manual", "rss", "remoteok", "linkedin"]);
  if (source && !allowedSources.has(source)) {
    return res.status(400).json({ error: "source must be one of: manual, rss, remoteok, linkedin" });
  }

  const createdAfter = days != null ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;
  const jobs = await prisma.job.findMany({
    where: {
      ...(source ? { source } : {}),
      ...(createdAfter ? { createdAt: { gte: createdAfter } } : {}),
      ...(minScore != null ? { score: { gte: minScore } } : {}),
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
  });

  res.json(jobs);
});

router.get("/:id", async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

router.post("/paste", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text is required" });
  }
  const parsed = parseManualPaste(text);
  const job = await prisma.job.create({
    data: {
      title: parsed.title ?? "Unknown Role",
      company: parsed.company ?? "Unknown Company",
      description: parsed.description,
      url: parsed.url ?? null,
      source: "manual",
    },
  });
  res.json(job);
});

router.post("/:id/score", async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) return res.status(404).json({ error: "Job not found" });

  const resume = await prisma.resume.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!resume) return res.status(400).json({ error: "Upload a resume first" });

  const { score, reasoning } = await scoreJob(resume.content, {
    title: job.title,
    company: job.company,
    description: job.description,
  });

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: { score, scoreReasoning: reasoning },
  });
  res.json(updated);
});

router.post("/:id/tailor", async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) return res.status(404).json({ error: "Job not found" });

  const resume = await prisma.resume.findFirst({ orderBy: { updatedAt: "desc" } });
  const cover = await prisma.coverLetter.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!resume) return res.status(400).json({ error: "Upload a resume first" });
  if (!cover) return res.status(400).json({ error: "Upload a cover letter first" });

  const artifacts = await tailorArtifacts(resume.content, cover.content, {
    title: job.title,
    company: job.company,
    description: job.description,
  });
  res.json(artifacts);
});

router.post("/fetch", async (req, res) => {
  const added: string[] = [];
  const seen = new Set<string>();

  const existing = await prisma.job.findMany({ select: { title: true, company: true } });
  for (const j of existing) {
    seen.add(normalizeKey(j.title, j.company));
  }

  try {
    const remoteOkJobs = await fetchRemoteOkJobs();
    for (const j of remoteOkJobs) {
      const key = normalizeKey(j.position, j.company);
      if (!seen.has(key)) {
        seen.add(key);
        await prisma.job.create({
          data: {
            title: j.position,
            company: j.company,
            description: j.description,
            url: j.url,
            source: "remoteok",
          },
        });
        added.push(key);
      }
    }
  } catch (e) {
    console.error("RemoteOK fetch error:", e);
  }

  const indeedRss = "https://rss.indeed.com/rss?q=software+engineer&l=remote";
  try {
    const rssJobs = await fetchRssJobs(indeedRss);
    for (const j of rssJobs) {
      const key = normalizeKey(j.title, j.company);
      if (!seen.has(key)) {
        seen.add(key);
        await prisma.job.create({
          data: {
            title: j.title,
            company: j.company,
            description: j.description,
            url: j.url,
            source: "rss",
          },
        });
        added.push(key);
      }
    }
  } catch (e) {
    console.error("RSS fetch error:", e);
  }

  res.json({ added: added.length, message: `Added ${added.length} new jobs` });
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Job not found" });

  await prisma.job.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

function normalizeKey(title: string, company: string): string {
  return `${title.trim().toLowerCase()}|${company.trim().toLowerCase()}`;
}

export { router as jobsRouter };
