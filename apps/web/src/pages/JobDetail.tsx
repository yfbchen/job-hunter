import { useState, useEffect } from "react";
import type { Job, TailoredArtifacts } from "../types";

const API = "/api";

interface JobDetailProps {
  jobId: string;
  onBack: () => void;
}

export function JobDetail({ jobId, onBack }: JobDetailProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [tailored, setTailored] = useState<TailoredArtifacts | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "tailored">("description");

  useEffect(() => {
    fetch(`${API}/jobs/${jobId}`)
      .then((r) => r.json())
      .then(setJob)
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleScore = async () => {
    setScoring(true);
    try {
      const res = await fetch(`${API}/jobs/${jobId}/score`, { method: "POST" });
      const data = await res.json();
      setJob(data);
    } catch (e) {
      console.error(e);
    } finally {
      setScoring(false);
    }
  };

  const handleTailor = async () => {
    setTailoring(true);
    try {
      const res = await fetch(`${API}/jobs/${jobId}/tailor`, { method: "POST" });
      const data = await res.json();
      setTailored(data);
      setActiveTab("tailored");
    } catch (e) {
      console.error(e);
    } finally {
      setTailoring(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading || !job) {
    return (
      <div className="py-12 text-center text-zinc-500">Loading…</div>
    );
  }

  const scoreColor = job.score != null
    ? job.score >= 70
      ? "text-emerald-400"
      : job.score >= 50
        ? "text-amber-400"
        : "text-zinc-500"
    : "text-zinc-500";

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-sm text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
      >
        ← Back to jobs
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">{job.title}</h2>
          <p className="text-zinc-400">{job.company}</p>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-violet-400 hover:text-violet-300 mt-1 inline-block"
            >
              Open job posting →
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {job.score != null && (
            <span className={`text-2xl font-bold tabular-nums ${scoreColor}`}>
              {Math.round(job.score)}
            </span>
          )}
          <button
            onClick={handleScore}
            disabled={scoring}
            className="px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium disabled:opacity-50"
          >
            {scoring ? "Scoring…" : job.score != null ? "Re-score" : "Score"}
          </button>
          <button
            onClick={handleTailor}
            disabled={tailoring}
            className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50"
          >
            {tailoring ? "Tailoring…" : "Tailor"}
          </button>
        </div>
      </div>

      {job.scoreReasoning && (
        <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700">
          <h4 className="text-sm font-medium text-zinc-400 mb-2">Match reasoning</h4>
          <p className="text-zinc-300 text-sm">{job.scoreReasoning}</p>
        </div>
      )}

      <div className="flex gap-2 border-b border-zinc-700">
        <button
          onClick={() => setActiveTab("description")}
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === "description"
              ? "text-violet-300 border-b-2 border-violet-500"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Description
        </button>
        <button
          onClick={() => setActiveTab("tailored")}
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === "tailored"
              ? "text-violet-300 border-b-2 border-violet-500"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Tailored
        </button>
      </div>

      {activeTab === "description" && (
        <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700">
          <pre className="whitespace-pre-wrap text-zinc-300 text-sm font-sans max-h-96 overflow-y-auto">
            {job.description}
          </pre>
        </div>
      )}

      {activeTab === "tailored" && (
        <div className="space-y-4">
          {tailored ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-zinc-400">Resume bullets</h4>
                  <button
                    onClick={() => copyToClipboard(tailored.resumeBullets)}
                    className="text-xs text-violet-400 hover:text-violet-300"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700">
                  <pre className="whitespace-pre-wrap text-zinc-300 text-sm font-sans">
                    {tailored.resumeBullets}
                  </pre>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-zinc-400">Cover letter</h4>
                  <button
                    onClick={() => copyToClipboard(tailored.coverLetter)}
                    className="text-xs text-violet-400 hover:text-violet-300"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700">
                  <pre className="whitespace-pre-wrap text-zinc-300 text-sm font-sans">
                    {tailored.coverLetter}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <p className="text-zinc-500 text-sm">
              Click "Tailor" to generate role-specific resume bullets and cover letter.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
