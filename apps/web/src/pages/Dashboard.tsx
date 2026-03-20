import { useState, useEffect } from "react";
import type { Job } from "../types";

const API = "/api";

interface DashboardProps {
  onSelectJob: (id: string) => void;
}

export function Dashboard({ onSelectJob }: DashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [minScore, setMinScore] = useState<number | "">("");
  const [source, setSource] = useState<"" | "manual" | "rss" | "remoteok" | "linkedin">("");
  const [days, setDays] = useState<number | "">(30);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (minScore !== "") params.set("minScore", String(minScore));
      if (source !== "") params.set("source", source);
      if (days !== "") params.set("days", String(days));
      const query = params.toString();
      const url = query ? `${API}/jobs?${query}` : `${API}/jobs`;
      const res = await fetch(url);
      const data = await res.json();
      setJobs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [minScore, source, days]);

  const handleFetch = async () => {
    setFetching(true);
    try {
      await fetch(`${API}/jobs/fetch`, { method: "POST" });
      await loadJobs();
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const handlePaste = async () => {
    if (!pasteText.trim()) return;
    try {
      await fetch(`${API}/jobs/paste`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      setPasteText("");
      setPasteMode(false);
      await loadJobs();
    } catch (e) {
      console.error(e);
    }
  };

  const scoreColor = (s: number | null | undefined) => {
    if (s == null) return "text-zinc-500";
    if (s >= 70) return "text-emerald-400";
    if (s >= 50) return "text-amber-400";
    return "text-zinc-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-zinc-100">Job List</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400">Min score:</label>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-16 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm"
          />
          <label className="text-sm text-zinc-400">Source:</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as "" | "manual" | "rss" | "remoteok" | "linkedin")}
            className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm"
          >
            <option value="">All</option>
            <option value="manual">Manual</option>
            <option value="rss">RSS</option>
            <option value="remoteok">RemoteOK</option>
            <option value="linkedin">LinkedIn</option>
          </select>
          <label className="text-sm text-zinc-400">Window:</label>
          <select
            value={days}
            onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))}
            className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm"
          >
            <option value="">All time</option>
            <option value={7}>7d</option>
            <option value={30}>30d</option>
            <option value={90}>90d</option>
          </select>
          <button
            onClick={handleFetch}
            disabled={fetching}
            className="px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium disabled:opacity-50"
          >
            {fetching ? "Fetching…" : "Fetch jobs"}
          </button>
          <button
            onClick={() => setPasteMode(!pasteMode)}
            className="px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium"
          >
            Paste job
          </button>
        </div>
      </div>

      {pasteMode && (
        <div className="p-4 rounded-xl bg-zinc-800/80 border border-zinc-700">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste job title, company, and description (or full URL). One per line."
            className="w-full h-32 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-600 text-zinc-200 placeholder-zinc-500 text-sm resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handlePaste}
              disabled={!pasteText.trim()}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50"
            >
              Add job
            </button>
            <button
              onClick={() => { setPasteMode(false); setPasteText(""); }}
              className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-zinc-500">Loading jobs…</div>
      ) : jobs.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 rounded-xl border border-dashed border-zinc-700">
          No jobs yet. Paste a job or fetch from RSS/RemoteOK.
        </div>
      ) : (
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li
              key={job.id}
              onClick={() => onSelectJob(job.id)}
              className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/80 hover:border-zinc-600 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-zinc-100 truncate">{job.title}</h3>
                  <p className="text-sm text-zinc-400">{job.company}</p>
                  <span className="inline-block mt-1 text-xs text-zinc-500 uppercase tracking-wide">
                    {job.source}
                  </span>
                </div>
                {job.score != null && (
                  <span className={`text-lg font-semibold tabular-nums ${scoreColor(job.score)}`}>
                    {Math.round(job.score)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
