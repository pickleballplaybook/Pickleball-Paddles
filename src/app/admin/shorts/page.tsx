"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminNav } from "../_components/AdminNav";

type Clip = {
  filename?: string;
  url: string;
  title: string;
  reason: string;
  duration: number;
};

function clipSrc(jobId: string | null, clip: Clip): string {
  const file = clip.filename || clip.url.split("/").pop() || "";
  return `/api/admin/shorts/clips/${jobId ?? ""}/${file}`;
}

type Job = {
  status: "queued" | "processing" | "done" | "error" | string;
  message?: string;
  progress?: number;
  clips?: Clip[];
  error?: string;
};

type JobSummary = {
  jobId: string;
  youtubeUrl: string;
  createdAt: string;
  status: string;
  message?: string;
  progress?: number;
  clipCount: number;
};

type Tab = "new" | "history";

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function statusBadgeClass(status: string) {
  if (status === "done") return "bg-green-500/10 text-green-400 border-green-500/30";
  if (status === "error") return "bg-red-500/10 text-red-400 border-red-500/30";
  return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
}

export default function ShortsPage() {
  const [tab, setTab] = useState<Tab>("new");

  const [url, setUrl] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState<JobSummary[] | null>(null);
  const [historyError, setHistoryError] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryError("");
    try {
      const r = await fetch("/api/admin/shorts/jobs");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Failed (${r.status})`);
      setHistory(d.jobs || []);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Failed to load history");
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (tab === "history" && history === null) {
      loadHistory();
    }
  }, [tab, history, loadHistory]);

  async function logout() {
    try {
      await fetch("/api/admin/shorts/logout", { method: "POST" });
    } catch {
      // ignore
    }
    window.location.href = "/admin/shorts/login";
  }

  async function handleSubmit() {
    const youtubeUrl = url.trim();
    if (!youtubeUrl) return;

    setLoading(true);
    setError("");
    setJob({ status: "queued", message: "Starting...", progress: 0 });

    try {
      const res = await fetch("/api/admin/shorts/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const newJobId: string = data.jobId;
      setJobId(newJobId);

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/admin/shorts/jobs/${newJobId}/status`);
          const d: Job = await r.json();
          setJob(d);
          if (d.status === "done" || d.status === "error") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setLoading(false);
            if (d.status === "error") setError(d.error || d.message || "Processing failed");
            // Invalidate history cache so the next visit reflects the new job
            setHistory(null);
          }
        } catch (pollErr) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setLoading(false);
          setError(pollErr instanceof Error ? pollErr.message : "Polling failed");
        }
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setJob(null);
      setLoading(false);
    }
  }

  function reset() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setJob(null);
    setJobId(null);
    setUrl("");
    setError("");
    setLoading(false);
  }

  async function viewPastJob(id: string) {
    setError("");
    try {
      const r = await fetch(`/api/admin/shorts/jobs/${id}/status`);
      const d: Job = await r.json();
      if (!r.ok) throw new Error((d as { error?: string }).error || `Failed (${r.status})`);
      setJob(d);
      setJobId(id);
      setTab("new");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job");
    }
  }

  async function deletePastJob(id: string) {
    if (!confirm("Delete this video and all its clips? This can't be undone.")) return;
    try {
      const r = await fetch(`/api/admin/shorts/jobs/${id}`, { method: "DELETE" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `Failed (${r.status})`);
      setHistory((prev) => (prev ? prev.filter((j) => j.jobId !== id) : prev));
      if (jobId === id) reset();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const inProgress = job && job.status !== "done" && job.status !== "error";

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <AdminNav />
        <h1 className="text-4xl font-bold mb-2">Shorts Generator</h1>
        <p className="text-gray-400 mb-6">
          Paste a YouTube URL and AI will cut the best clips
        </p>

        <div className="flex items-center justify-between mb-8">
          <div className="inline-flex bg-gray-900 border border-gray-800 rounded-xl p-1">
            {(["new", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  tab === t ? "bg-green-500 text-black" : "text-gray-400 hover:text-white"
                }`}
              >
                {t === "new" ? "New" : "History"}
              </button>
            ))}
          </div>
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Log out
          </button>
        </div>

        {tab === "new" && (
          <>
            {!job && (
              <div className="flex gap-3 mb-8">
                <input
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading || !url.trim()}
                  className="bg-green-500 hover:bg-green-400 disabled:bg-gray-700 text-black font-bold px-6 rounded-xl"
                >
                  Cut It
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-4 mb-6">
                {error}
              </div>
            )}

            {inProgress && (
              <div className="bg-gray-900 rounded-2xl p-6 mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-green-400">{job?.message || "Working..."}</span>
                  <span className="text-green-400 font-bold">{job?.progress || 0}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${job?.progress || 0}%` }}
                  />
                </div>
              </div>
            )}

            {job && job.status === "done" && job.clips && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <h2 className="text-2xl font-bold">{job.clips.length} Clips Ready</h2>
                  {jobId && (
                    <a
                      href={`/api/admin/shorts/jobs/${jobId}/zip`}
                      className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm"
                    >
                      Download all (.zip)
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {job.clips.map((clip, i) => (
                    <div
                      key={i}
                      className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800"
                    >
                      <video
                        src={clipSrc(jobId, clip)}
                        controls
                        className="w-full"
                        preload="metadata"
                      />
                      <div className="p-4">
                        <p className="font-semibold mb-1">{clip.title}</p>
                        <p className="text-gray-400 text-sm mb-3">{clip.reason}</p>
                        <p className="text-gray-600 text-xs mb-3">{clip.duration}s</p>
                        <a
                          href={clipSrc(jobId, clip)}
                          download
                          className="block text-center border border-green-500 text-green-500 hover:bg-green-500 hover:text-black rounded-lg py-2 text-sm font-medium"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={reset}
                  className="border border-gray-700 text-gray-400 px-6 py-3 rounded-xl"
                >
                  Process another video
                </button>
              </div>
            )}

            {job && job.status === "error" && (
              <button
                onClick={reset}
                className="border border-gray-700 text-gray-400 px-6 py-3 rounded-xl"
              >
                Try another video
              </button>
            )}
          </>
        )}

        {tab === "history" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Previous videos</h2>
              <button
                onClick={() => {
                  setHistory(null);
                  loadHistory();
                }}
                className="text-sm text-gray-400 hover:text-white"
              >
                Refresh
              </button>
            </div>

            {historyError && (
              <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-4 mb-6">
                {historyError}
              </div>
            )}

            {history === null && (
              <p className="text-gray-500">Loading...</p>
            )}

            {history && history.length === 0 && (
              <p className="text-gray-500">No videos yet. Cut one from the New tab.</p>
            )}

            {history && history.length > 0 && (
              <div className="space-y-3">
                {history.map((h) => (
                  <div
                    key={h.jobId}
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-wrap items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <a
                        href={h.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-white truncate hover:underline"
                        title={h.youtubeUrl}
                      >
                        {h.youtubeUrl}
                      </a>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                        <span>{formatDate(h.createdAt)}</span>
                        <span>·</span>
                        <span>{h.clipCount} clip{h.clipCount === 1 ? "" : "s"}</span>
                        <span>·</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border ${statusBadgeClass(
                            h.status
                          )}`}
                        >
                          {h.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {h.status === "done" && h.clipCount > 0 && (
                        <>
                          <button
                            onClick={() => viewPastJob(h.jobId)}
                            className="bg-green-500 hover:bg-green-400 text-black text-sm font-semibold px-4 py-2 rounded-lg"
                          >
                            View
                          </button>
                          <a
                            href={`/api/admin/shorts/jobs/${h.jobId}/zip`}
                            className="border border-green-500 text-green-500 hover:bg-green-500 hover:text-black text-sm font-semibold px-4 py-2 rounded-lg"
                          >
                            .zip
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => deletePastJob(h.jobId)}
                        className="border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white text-sm font-semibold px-4 py-2 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
