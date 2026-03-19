import { useState, useEffect } from "react";
import type { Resume, CoverLetter } from "../types";

const API = "/api";

export function Artifacts() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [cover, setCover] = useState<CoverLetter | null>(null);
  const [resumeEdit, setResumeEdit] = useState("");
  const [coverEdit, setCoverEdit] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [rRes, cRes] = await Promise.all([
      fetch(`${API}/artifacts/resume`),
      fetch(`${API}/artifacts/cover-letter`),
    ]);
    const r = await rRes.json();
    const c = await cRes.json();
    setResume(r);
    setCover(c);
    setResumeEdit(r?.content ?? "");
    setCoverEdit(c?.content ?? "");
  };

  useEffect(() => {
    load();
  }, []);

  const saveResume = async () => {
    if (!resumeEdit.trim()) return;
    setSaving(true);
    try {
      if (resume) {
        await fetch(`${API}/artifacts/resume/${resume.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: resumeEdit }),
        });
      } else {
        await fetch(`${API}/artifacts/resume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: resumeEdit }),
        });
      }
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const saveCover = async () => {
    if (!coverEdit.trim()) return;
    setSaving(true);
    try {
      if (cover) {
        await fetch(`${API}/artifacts/cover-letter/${cover.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: coverEdit }),
        });
      } else {
        await fetch(`${API}/artifacts/cover-letter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: coverEdit }),
        });
      }
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const uploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await fetch(`${API}/artifacts/resume`, { method: "POST", body: fd });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-zinc-100">Your Artifacts</h2>

      <section>
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Resume</h3>
        <div className="flex gap-2 mb-2">
          <label className="px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm cursor-pointer">
            {uploading ? "Uploading…" : "Upload .txt"}

            <input
              type="file"
              accept=".txt"
              onChange={uploadResume}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
        <textarea
          value={resumeEdit}
          onChange={(e) => setResumeEdit(e.target.value)}
          placeholder="Paste or paste resume text here…"
          className="w-full h-48 px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-200 placeholder-zinc-500 text-sm resize-y font-mono"
        />
        <button
          onClick={saveResume}
          disabled={saving || !resumeEdit.trim()}
          className="mt-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50"
        >
          {resume ? "Update" : "Save"} resume
        </button>
      </section>

      <section>
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Base cover letter</h3>
        <textarea
          value={coverEdit}
          onChange={(e) => setCoverEdit(e.target.value)}
          placeholder="Paste your base cover letter here…"
          className="w-full h-48 px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-200 placeholder-zinc-500 text-sm resize-y"
        />
        <button
          onClick={saveCover}
          disabled={saving || !coverEdit.trim()}
          className="mt-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50"
        >
          {cover ? "Update" : "Save"} cover letter
        </button>
      </section>
    </div>
  );
}
