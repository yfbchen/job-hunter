import { useState, useEffect, useCallback } from "react";
import type { Job, ReadinessStatus } from "../types";
import { Toast } from "../components/Toast";

const API = "/api";

type Notice = { message: string; type: "success" | "error" };

interface DashboardProps {
  onSelectJob: (id: string) => void;
}

export function Dashboard({ onSelectJob }: DashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [bulkScoring, setBulkScoring] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [minScore, setMinScore] = useState<number | "">("");
  const [source, setSource] = useState<"" | "manual" | "rss" | "remoteok" | "linkedin">("");
  const [days, setDays] = useState<number | "">(30);
  const [unscoredOnly, setUnscoredOnly] = useState(false);
  const [limit, setLimit] = useState<number | "">(50);
  const [fetchRole, setFetchRole] = useState("software engineer");
  const [fetchLocation, setFetchLocation] = useState("remote");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [readiness, setReadiness] = useState<ReadinessStatus | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const dismissNotice = useCallback(() => setNotice(null), []);

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

  useEffect(() => {
    setSelectedIds((prev) => {
      const jobIds = new Set(jobs.map((j) => j.id));
      const next = new Set<string>();
      for (const id of prev) {
        if (jobIds.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [jobs]);

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
        setNotice({ message: payload.message, type: "success" });
      }
      await loadJobs();
      await loadReadiness();
    } catch (e) {
      console.error(e);
      setNotice({ message: "Failed to fetch jobs.", type: "error" });
    } finally {
      setFetching(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(jobs.map((j) => j.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleScoreSelected = async () => {
    if (selectedIds.size === 0) {
      setNotice({ message: "Select at least one job to score.", type: "error" });
      return;
    }
    if (readiness && !readiness.resumeExists) {
      setNotice({ message: "Upload a resume first from the Artifacts page.", type: "error" });
      return;
    }

    setBulkScoring(true);
    try {
      const res = await fetch(`${API}/jobs/score-selected`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const payload = (await res.json()) as { message?: string; error?: string };
      const isError = !!payload.error;
      setNotice({
        message: payload.message ?? payload.error ?? "Scoring completed.",
        type: isError ? "error" : "success",
      });
      setSelectedIds(new Set());
      await loadJobs();
      await loadReadiness();
    } catch (e) {
      console.error(e);
      setNotice({ message: "Failed to score selected jobs.", type: "error" });
    } finally {
      setBulkScoring(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      setNotice({ message: "Select at least one job to delete.", type: "error" });
      return;
    }

    setFetching(true);
    try {
      const res = await fetch(`${API}/jobs/delete-selected`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const payload = (await res.json()) as { message?: string; error?: string };
      const isError = !!payload.error;
      setNotice({
        message: payload.message ?? payload.error ?? "Jobs deleted.",
        type: isError ? "error" : "success",
      });
      setSelectedIds(new Set());
      await loadJobs();
      await loadReadiness();
    } catch (e) {
      console.error(e);
      setNotice({ message: "Failed to delete selected jobs.", type: "error" });
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
      setNotice({ message: "Job added.", type: "success" });
      await loadJobs();
      await loadReadiness();
    } catch (e) {
      console.error(e);
      setNotice({ message: "Failed to add job.", type: "error" });
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-zinc-100">Job List</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPasteMode(!pasteMode)}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium"
          >
            Paste job
          </button>
          <button
            onClick={handleFetch}
            disabled={fetching}
            className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium disabled:opacity-50"
          >
            {fetching ? "Fetching…" : "Fetch"}
          </button>
          <div className="relative">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtersOpen
                  ? "bg-zinc-700 text-zinc-200"
                  : "bg-zinc-800/60 border border-zinc-700 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {filtersOpen ? "Hide filters" : "Filters"}
            </button>
            {filtersOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40"
                  onClick={() => setFiltersOpen(false)}
                  aria-hidden
                />
                <div className="absolute top-full right-0 mt-2 z-50 w-[calc(100vw-2rem)] max-w-2xl p-4 rounded-xl bg-zinc-800 border border-zinc-600 shadow-xl space-y-4">
            <h3 className="text-sm font-medium text-zinc-400">Filter list</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Min score</label>
              <input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={unscoredOnly}
                className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as "" | "manual" | "rss" | "remoteok" | "linkedin")}
                className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm"
              >
                <option value="">All</option>
                <option value="manual">Manual</option>
                <option value="rss">RSS</option>
                <option value="remoteok">RemoteOK</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Time window</label>
              <select
                value={days}
                onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm"
              >
                <option value="">All time</option>
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Show top</label>
              <select
                value={limit}
                onChange={(e) => setLimit(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value="">All</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Role</label>
              <input
                type="text"
                value={fetchRole}
                onChange={(e) => setFetchRole(e.target.value)}
                placeholder="e.g. software engineer"
                className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Location</label>
              <input
                type="text"
                value={fetchLocation}
                onChange={(e) => setFetchLocation(e.target.value)}
                placeholder="e.g. remote"
                className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm placeholder-zinc-500"
              />
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={unscoredOnly}
              onChange={(e) => setUnscoredOnly(e.target.checked)}
              className="accent-violet-500"
            />
            Unscored only
          </label>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
          <button
            onClick={handleScoreSelected}
            disabled={bulkScoring || selectedIds.size === 0 || readiness?.resumeExists === false}
            className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium disabled:opacity-50"
          >
            {bulkScoring ? "Scoring…" : "Score Selected"}
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={fetching || selectedIds.size === 0}
            className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium disabled:opacity-50"
          >
            Delete Selected
          </button>
        </div>

      {notice && (
        <Toast message={notice.message} type={notice.type} onDismiss={dismissNotice} />
      )}

      {pasteMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => { setPasteMode(false); setPasteText(""); }}
        >
          <div
            className="w-full max-w-lg p-5 rounded-xl bg-zinc-800 border border-zinc-700 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-zinc-200 mb-3">Paste job</h3>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste job title, company, and description (or full URL). One per line."
              className="w-full h-36 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-600 text-zinc-200 placeholder-zinc-500 text-sm resize-none"
              autoFocus
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button
                onClick={() => { setPasteMode(false); setPasteText(""); }}
                className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handlePaste}
                disabled={!pasteText.trim()}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50"
              >
                Find Job(s)
              </button>
            </div>
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
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-2 py-1 text-sm text-zinc-500">
            <button
              onClick={selectAll}
              className="hover:text-zinc-300"
            >
              Select all
            </button>
            <button
              onClick={clearSelection}
              className="hover:text-zinc-300"
            >
              Clear selection
            </button>
            {selectedIds.size > 0 && (
              <span className="text-zinc-400">{selectedIds.size} selected</span>
            )}
          </div>
          <ul className="space-y-2">
            {jobs.map((job) => (
              <li
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-colors flex items-start gap-3 ${
                  selectedIds.has(job.id)
                    ? "bg-zinc-700/80 border-violet-500/50"
                    : "bg-zinc-800/60 border-zinc-700/80 hover:border-zinc-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(job.id)}
                  onChange={() => toggleSelect(job.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 accent-violet-500 shrink-0"
                />
                <div className="flex items-start justify-between gap-4 min-w-0 flex-1">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-zinc-100 truncate">{job.title}</h3>
                    <p className="text-sm text-zinc-400">{job.company}</p>
                    <span className="inline-block mt-1 text-xs text-zinc-500 uppercase tracking-wide">
                      {job.source}
                    </span>
                  </div>
                  {job.score != null && (
                    <span className={`text-lg font-semibold tabular-nums shrink-0 ${scoreColor(job.score)}`}>
                      {Math.round(job.score)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
