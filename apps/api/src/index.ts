import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import { artifactsRouter } from "./routes/artifacts.js";
import { jobsRouter } from "./routes/jobs.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "2mb" }));

app.use("/api/artifacts", artifactsRouter);
app.use("/api/jobs", jobsRouter);

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const errorObj = (err ?? {}) as { status?: number; message?: string };
  const status = Number(errorObj.status ?? 500);
  const message = status >= 500 ? "Internal server error" : String(errorObj.message ?? "Request failed");
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
