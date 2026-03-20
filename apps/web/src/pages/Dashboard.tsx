import { useState, useEffect } from "react";
import type { Job, ReadinessStatus } from "../types";

const API = "/api";
const IS_DEV = import.meta.env.DEV;

interface DashboardProps {
  onSelectJob: (id: string) => void;
}

export function Dashboard({ onSelectJob }: DashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [bulkScoring, setBulkScoring] = useState(false);
  const [linkedinEnabled] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [minScore, setMinScore] = useState<number | "">("");
  const [source, setSource] = useState<"" | "manual" | "rss" | "remoteok" | "linkedin" | "stub">("");
  const [days, setDays] = useState<number | "">(30);
  const [unscoredOnly, setUnscoredOnly] = useState(false);
  const [limit, setLimit] = useState<number | "">(50);
  const [fetchRole, setFetchRole] = useState("software engineer");
  const [fetchLocation, setFetchLocation] = useState("remote");
  const [notice, setNotice] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ReadinessStatus | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (minScore !== "" && !unscoredOnly) params.set("minScore", String(minScore));
      if (source !== "") params.set("source", source);
      if (days !== "") params.set("days", String(days));
      if (unscoredOnly) params.set("unscored", "true");
      if (limit !== "") params.set("limit", String(limit));
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

  const loadReadiness = async () => {
    try {
      const res = await fetch(`${API}/health/readiness`);
      const data = (await res.json()) as ReadinessStatus;
      setReadiness(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadJobs();
    loadReadiness();
  }, [minScore, source, days, unscoredOnly, limit]);

  const handleFetch = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API}/jobs/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: fetchRole.trim() || undefined, location: fetchLocation.trim() || undefined }),
      });
      const payload = (await res.json()) as { message?: string };
      if (payload.message) {
        setNotice(payload.message);
      }
      await loadJobs();
      await loadReadiness();
    } catch (e) {
      console.error(e);
      setNotice("Failed to fetch jobs.");
    } finally {
      setFetching(false);
    }
  };

  const handleLinkedInMiniScrape = async () => {
    if (!linkedinEnabled) {
      setNotice("LinkedIn mini-scrape is post-MVP and currently disabled.");
      return;
    }

    try {
      const res = await fetch(`${API}/jobs/fetch/linkedin-mini`, { method: "POST" });
      const payload = (await res.json()) as { message?: string; error?: string };
      setNotice(payload.message ?? payload.error ?? "LinkedIn mini-scrape triggered.");
    } catch (e) {
      console.error(e);
      setNotice("Failed to trigger LinkedIn mini-scrape.");
    }
  };

  const handleLoadStubs = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API}/jobs/fetch/stubs`, { method: "POST" });
      const payload = (await res.json()) as { message?: string; error?: string };
      setNotice(payload.message ?? payload.error ?? "Stub jobs processed.");
      await loadJobs();
      await loadReadiness();
    } catch (e) {
      console.error(e);
      setNotice("Failed to load stub jobs.");
    } finally {
      setFetching(false);
    }
  };

  const handleScoreUnscored = async () => {
    if (readiness && !readiness.resumeExists) {
      setNotice("Upload a resume first from the Artifacts page.");
      return;
    }

    setBulkScoring(true);
    try {
      const res = await fetch(`${API}/jobs/score-unscored`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 20 }),
      });
      const payload = (await res.json()) as { message?: string; error?: string };
      setNotice(payload.message ?? payload.error ?? "Bulk scoring completed.");
      await loadJobs();
      await loadReadiness();
    } catch (e) {
      console.error(e);
      setNotice("Failed to bulk score jobs.");
    } finally {
      setBulkScoring(false);
    }
  };

  const handleClearStubs = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API}/jobs/stubs`, { method: "DELETE" });
      const payload = (await res.json()) as { message?: string; error?: string };
      setNotice(payload.message ?? payload.error ?? "Stub jobs cleared.");
      await loadJobs();
      await loadReadiness();
    } catch (e) {
      console.error(e);
      setNotice("Failed to clear stub jobs.");
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
      await loadReadiness();
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
      {readiness && (
        <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-300 mb-2">MVP Readiness</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            <div className="text-zinc-300">
              {readiness.resumeExists ? "✅" : "⬜"} Resume uploaded
            </div>
            <div className="text-zinc-300">
              {readiness.coverLetterExists ? "✅" : "⬜"} Cover letter uploaded
            </div>
            <div className="text-zinc-300">
              {readiness.totalJobs > 0 ? "✅" : "⬜"} Jobs fetched ({readiness.totalJobs})
            </div>
            <div className="text-zinc-300">
              {readiness.unscoredJobs === 0 ? "✅" : "⬜"} Jobs scored ({readiness.scoredJobs}/{readiness.totalJobs})
            </div>
          </div>
        </div>
      )}

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
            disabled={unscoredOnly}
            className="w-16 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm disabled:opacity-50"
          />
          <label className="text-sm text-zinc-400">Source:</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as "" | "manual" | "rss" | "remoteok" | "linkedin" | "stub")}
            className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm"
          >
            <option value="">All</option>
            <option value="manual">Manual</option>
            <option value="rss">RSS</option>
            <option value="remoteok">RemoteOK</option>
            {IS_DEV && <option value="stub">Stub</option>}
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
          <label className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={unscoredOnly}
              onChange={(e) => setUnscoredOnly(e.target.checked)}
              className="accent-violet-500"
            />
            Unscored only
          </label>
          <label className="text-sm text-zinc-400">Top:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(e.target.value === "" ? "" : Number(e.target.value))}
            className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value="">All</option>
          </select>
          <label className="text-sm text-zinc-400">Role:</label>
          <input
            type="text"
            value={fetchRole}
            onChange={(e) => setFetchRole(e.target.value)}
            placeholder="e.g. software engineer"
            className="w-36 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-500"
          />
          <label className="text-sm text-zinc-400">Location:</label>
          <input
            type="text"
            value={fetchLocation}
            onChange={(e) => setFetchLocation(e.target.value)}
            placeholder="e.g. remote"
            className="w-24 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-500"
          />
          <button
            onClick={handleFetch}
            disabled={fetching}
            className="px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium disabled:opacity-50"
          >
            {fetching ? "Fetching…" : "Fetch jobs"}
          </button>
          <button
            onClick={handleScoreUnscored}
            disabled={bulkScoring || readiness?.resumeExists === false}
            className="px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium disabled:opacity-50"
          >
            {bulkScoring ? "Scoring…" : "Score unscored"}
          </button>
          <button
            onClick={handleLinkedInMiniScrape}
            disabled={!linkedinEnabled}
            title="Post-MVP placeholder"
            className="px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            LinkedIn Scrape (Not Available)
          </button>
          {IS_DEV && (
            <>
              <button
                onClick={handleLoadStubs}
                disabled={fetching}
                className="px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium disabled:opacity-50"
              >
                Load stub jobs
              </button>
              <button
                onClick={handleClearStubs}
                disabled={fetching}
                className="px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium disabled:opacity-50"
              >
                Clear stub jobs
              </button>
            </>
          )}
          <button
            onClick={() => setPasteMode(!pasteMode)}
            className="px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium"
          >
            Paste job
          </button>
        </div>
      </div>

      {notice && (
        <div className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800/70 text-sm text-zinc-300">
          {notice}
        </div>
      )}

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
