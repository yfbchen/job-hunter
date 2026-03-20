import { useState, useEffect, useCallback } from "react";
import type { Job, TailoredArtifacts } from "../types";
import { Toast } from "../components/Toast";

const API = "/api";

type Notice = { message: string; type: "success" | "error" };

interface JobDetailProps {
  jobId: string;
  onBack: () => void;
}

export function JobDetail({ jobId, onBack }: JobDetailProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tailored, setTailored] = useState<TailoredArtifacts | null>(null);
  const [resumeBulletsEdit, setResumeBulletsEdit] = useState("");
  const [coverLetterEdit, setCoverLetterEdit] = useState("");
  const [activeTab, setActiveTab] = useState<"description" | "tailored">("description");
  const [notice, setNotice] = useState<Notice | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const res = await fetch(`${API}/jobs/${jobId}`);
        const data = await res.json();
        if (!res.ok) {
          setNotice({ message: data?.error ?? "Failed to load job details.", type: "error" });
          return;
        }
        setJob(data);
      } catch (e) {
        console.error(e);
        setNotice({ message: "Failed to load job details.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    void loadJob();
  }, [jobId]);

  const handleScore = async () => {
    setScoring(true);
    try {
      const res = await fetch(`${API}/jobs/${jobId}/score`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ message: data?.error ?? "Scoring failed.", type: "error" });
        return;
      }
      setJob(data);
      setNotice({ message: "Job scored successfully.", type: "success" });
    } catch (e) {
      console.error(e);
      setNotice({ message: "Scoring failed.", type: "error" });
    } finally {
      setScoring(false);
    }
  };

  const handleTailor = async () => {
    setTailoring(true);
    try {
      const res = await fetch(`${API}/jobs/${jobId}/tailor`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ message: data?.error ?? "Tailoring failed.", type: "error" });
        return;
      }
      setTailored(data);
      setResumeBulletsEdit(data.resumeBullets ?? "");
      setCoverLetterEdit(data.coverLetter ?? "");
      setActiveTab("tailored");
      setNotice({ message: "Tailored artifacts generated.", type: "success" });
    } catch (e) {
      console.error(e);
      setNotice({ message: "Tailoring failed.", type: "error" });
    } finally {
      setTailoring(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ message: "Copied to clipboard.", type: "success" });
    } catch (e) {
      console.error(e);
      setNotice({ message: "Failed to copy to clipboard.", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    const confirmed = window.confirm(`Delete "${job.title}" at ${job.company}?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API}/jobs/${job.id}`, { method: "DELETE" });
      if (!res.ok) {
        setNotice({ message: "Failed to delete job.", type: "error" });
        return;
      }
      onBack();
    } catch (e) {
      console.error(e);
      setNotice({ message: "Failed to delete job.", type: "error" });
    } finally {
      setDeleting(false);
    }
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
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm font-medium disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {notice && (
        <Toast message={notice.message} type={notice.type} onDismiss={dismissNotice} />
      )}

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
                    onClick={() => void copyToClipboard(resumeBulletsEdit)}
                    className="text-xs text-violet-400 hover:text-violet-300"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700">
                  <textarea
                    value={resumeBulletsEdit}
                    onChange={(e) => setResumeBulletsEdit(e.target.value)}
                    className="w-full min-h-32 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-600 text-zinc-200 text-sm resize-y"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-zinc-400">Cover letter</h4>
                  <button
                    onClick={() => void copyToClipboard(coverLetterEdit)}
                    className="text-xs text-violet-400 hover:text-violet-300"
                  >
                    Copy
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700">
                  <textarea
                    value={coverLetterEdit}
                    onChange={(e) => setCoverLetterEdit(e.target.value)}
                    className="w-full min-h-56 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-600 text-zinc-200 text-sm resize-y"
                  />
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
