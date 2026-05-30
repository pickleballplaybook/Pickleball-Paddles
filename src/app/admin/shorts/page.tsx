"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminNav } from "../_components/AdminNav";

type TextOverlay = {
  id: string;
  text: string;
  start: number;
  end: number;
  xPct: number; // 0-100, position of text center as % of video width
  yPct: number; // 0-100, position of text center as % of video height
  fontSize: number;
};

type ClipEdit = {
  trim: { start: number; end: number } | null;
  texts: TextOverlay[];
  version: number;
};

type Clip = {
  filename?: string;
  url: string;
  title: string;
  reason: string;
  duration: number;
  edit?: ClipEdit;
};

function clipSrc(jobId: string | null, clip: Clip): string {
  const file = clip.filename || clip.url.split("/").pop() || "";
  const v = clip.edit?.version ? `?v=${clip.edit.version}` : "";
  return `/api/admin/shorts/clips/${jobId ?? ""}/${file}${v}`;
}

// URL of the untouched source for re-editing. Once a clip has been edited
// at least once, the backend keeps a `<base>_orig.mp4` snapshot — load that
// so the editor's video player exposes the full original timeline.
function clipOrigSrc(jobId: string | null, clip: Clip): string {
  const file = clip.filename || clip.url.split("/").pop() || "";
  if (!clip.edit || clip.edit.version === 0) {
    return `/api/admin/shorts/clips/${jobId ?? ""}/${file}`;
  }
  const origFile = file.replace(/\.mp4$/i, "_orig.mp4");
  return `/api/admin/shorts/clips/${jobId ?? ""}/${origFile}`;
}

function effectiveDuration(clip: Clip): number {
  if (clip.edit?.trim) return Math.round((clip.edit.trim.end - clip.edit.trim.start) * 10) / 10;
  return clip.duration;
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

function ClipEditor({
  jobId,
  clip,
  onClose,
  onSaved,
}: {
  jobId: string;
  clip: Clip;
  onClose: () => void;
  onSaved: (updated: Clip) => void;
}) {
  const filename = clip.filename || clip.url.split("/").pop() || "";
  // The original snapshot (`_orig.mp4`) is the source of truth for length —
  // clip.duration in meta.json can be stale if an old edit overwrote it.
  // Read it from the loaded <video> element via onLoadedMetadata.
  const [sourceDuration, setSourceDuration] = useState(clip.duration);
  const initialTrim = clip.edit?.trim ?? { start: 0, end: clip.duration };
  const [trimStart, setTrimStart] = useState(initialTrim.start);
  const [trimEnd, setTrimEnd] = useState(initialTrim.end);
  const [texts, setTexts] = useState<TextOverlay[]>(clip.edit?.texts || []);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<string | null>(null);

  const visibleTexts = texts.filter(
    (t) => currentTime >= t.start && currentTime <= t.end
  );

  function addText() {
    const start = Math.max(0, currentTime);
    const end = Math.min(clip.duration, start + 3);
    setTexts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 10),
        text: "Your text",
        start,
        end,
        xPct: 50,
        yPct: 80,
        fontSize: 64,
      },
    ]);
  }

  function updateText(id: string, patch: Partial<TextOverlay>) {
    setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function removeText(id: string) {
    setTexts((prev) => prev.filter((t) => t.id !== id));
  }

  function onTextPointerDown(e: React.PointerEvent<HTMLDivElement>, id: string) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = id;
  }
  function onOverlayPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    updateText(dragRef.current, { xPct, yPct });
  }
  function onTextPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const trimChanged = trimStart > 0 || trimEnd < sourceDuration - 0.01;
      const body = {
        trim: trimChanged ? { start: trimStart, end: trimEnd } : null,
        texts: texts.map(({ id: _id, ...rest }) => rest),
      };
      const r = await fetch(
        `/api/admin/shorts/clips/${jobId}/${filename}/edit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Failed (${r.status})`);
      onSaved(d.clip as Clip);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function resetEdit() {
    if (!confirm("Reset this clip back to the original?")) return;
    setResetting(true);
    setError("");
    try {
      const r = await fetch(
        `/api/admin/shorts/clips/${jobId}/${filename}/edit`,
        { method: "DELETE" }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Failed (${r.status})`);
      onSaved(d.clip as Clip);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-950 border border-gray-800 rounded-2xl max-w-5xl w-full my-8 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-950 z-10">
          <h2 className="text-xl font-bold">Edit clip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
          {/* Video + draggable text overlay */}
          <div>
            <div
              ref={overlayRef}
              className="relative bg-black rounded-xl overflow-hidden select-none"
              onPointerMove={onOverlayPointerMove}
              onPointerUp={onTextPointerUp}
            >
              <video
                ref={videoRef}
                src={clipOrigSrc(jobId, clip)}
                controls
                className="w-full block"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration;
                  if (isFinite(d) && d > 0) {
                    setSourceDuration(d);
                    // If the saved trim window ends short of the real source
                    // (because a prior edit truncated clip.duration), and the
                    // user clearly intended "the full clip", expand back out.
                    if (!clip.edit?.trim) setTrimEnd(d);
                  }
                }}
              />
              {visibleTexts.map((t) => (
                <div
                  key={t.id}
                  onPointerDown={(e) => onTextPointerDown(e, t.id)}
                  className="absolute cursor-move px-3 py-1.5 bg-black/55 text-white font-bold whitespace-nowrap border-2 border-dashed border-white/30"
                  style={{
                    left: `${t.xPct}%`,
                    top: `${t.yPct}%`,
                    transform: "translate(-50%, -50%)",
                    fontSize: `${Math.max(10, t.fontSize / 4)}px`,
                    touchAction: "none",
                  }}
                >
                  {t.text || "(empty)"}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Drag the dashed boxes to position text. The position you set is exactly where the text will render in the final video.
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-5">
            {/* Trim */}
            <div>
              <h3 className="font-semibold mb-2">Trim</h3>
              <p className="text-xs text-gray-500 mb-2">
                Scrub the video to the moment you want, then click &quot;Set start&quot; or &quot;Set end&quot;. Fine-tune with the numbers.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTrimStart(Math.min(trimEnd - 0.1, Math.max(0, Number(currentTime.toFixed(2)))))}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg whitespace-nowrap"
                  >
                    Set start ← {currentTime.toFixed(2)}s
                  </button>
                  <label className="flex-1">
                    <span className="text-xs text-gray-400 block">Start (s)</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={sourceDuration}
                      value={trimStart}
                      onChange={(e) => setTrimStart(Math.max(0, Math.min(trimEnd - 0.1, Number(e.target.value))))}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTrimEnd(Math.max(trimStart + 0.1, Math.min(sourceDuration, Number(currentTime.toFixed(2)))))}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg whitespace-nowrap"
                  >
                    Set end ← {currentTime.toFixed(2)}s
                  </button>
                  <label className="flex-1">
                    <span className="text-xs text-gray-400 block">End (s)</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={sourceDuration}
                      value={trimEnd}
                      onChange={(e) => setTrimEnd(Math.max(trimStart + 0.1, Math.min(sourceDuration, Number(e.target.value))))}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => { setTrimStart(0); setTrimEnd(sourceDuration); }}
                  className="w-full text-xs border border-gray-700 text-gray-400 hover:bg-gray-800 px-3 py-1.5 rounded-lg"
                >
                  Reset trim to full ({sourceDuration.toFixed(2)}s)
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Output length: <span className="text-white">{Math.max(0, trimEnd - trimStart).toFixed(2)}s</span>
                {" · "}Source: {sourceDuration.toFixed(2)}s
              </p>
            </div>

            {/* Text overlays */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Text overlays</h3>
                <button
                  onClick={addText}
                  className="text-sm bg-green-500 hover:bg-green-400 text-black font-semibold px-3 py-1.5 rounded-lg"
                >
                  + Add text
                </button>
              </div>
              {texts.length === 0 && (
                <p className="text-xs text-gray-500">
                  Click &quot;Add text&quot; to overlay a caption. Drag it on the video to position.
                </p>
              )}
              <div className="space-y-3">
                {texts.map((t) => (
                  <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={t.text}
                        onChange={(e) => updateText(t.id, { text: e.target.value })}
                        placeholder="Caption text"
                        className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-sm mr-2"
                      />
                      <button
                        onClick={() => removeText(t.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <label className="block">
                        <span className="text-gray-400">In (s)</span>
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          value={t.start}
                          onChange={(e) => updateText(t.id, { start: Math.max(0, Number(e.target.value)) })}
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1"
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-400">Out (s)</span>
                        <input
                          type="number"
                          step="0.1"
                          min={t.start + 0.1}
                          value={t.end}
                          onChange={(e) => updateText(t.id, { end: Math.max(t.start + 0.1, Number(e.target.value)) })}
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1"
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-400">Size</span>
                        <input
                          type="number"
                          step={4}
                          min={20}
                          max={160}
                          value={t.fontSize}
                          onChange={(e) => updateText(t.id, { fontSize: Math.max(20, Math.min(160, Number(e.target.value))) })}
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
              <button
                onClick={save}
                disabled={saving || resetting}
                className="flex-1 bg-green-500 hover:bg-green-400 disabled:bg-gray-700 text-black font-bold py-2.5 rounded-xl"
              >
                {saving ? "Saving…" : "Save edit"}
              </button>
              {clip.edit && clip.edit.version > 0 && (
                <button
                  onClick={resetEdit}
                  disabled={saving || resetting}
                  className="border border-gray-700 text-gray-300 hover:bg-gray-800 px-4 py-2.5 rounded-xl"
                >
                  {resetting ? "Resetting…" : "Reset"}
                </button>
              )}
              <button
                onClick={onClose}
                disabled={saving || resetting}
                className="border border-gray-700 text-gray-400 px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

  const [editingClipIdx, setEditingClipIdx] = useState<number | null>(null);

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
                        <p className="text-gray-600 text-xs mb-3">
                          {effectiveDuration(clip)}s
                          {clip.edit?.trim && (
                            <span className="text-gray-700"> (trimmed from {clip.duration}s)</span>
                          )}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setEditingClipIdx(i)}
                            className="border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg py-2 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <a
                            href={clipSrc(jobId, clip)}
                            download
                            className="block text-center border border-green-500 text-green-500 hover:bg-green-500 hover:text-black rounded-lg py-2 text-sm font-medium"
                          >
                            Download
                          </a>
                        </div>
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

        {editingClipIdx !== null && jobId && job?.clips?.[editingClipIdx] && (
          <ClipEditor
            jobId={jobId}
            clip={job.clips[editingClipIdx]}
            onClose={() => setEditingClipIdx(null)}
            onSaved={(updated) => {
              setJob((prev) => {
                if (!prev || !prev.clips) return prev;
                const next = [...prev.clips];
                next[editingClipIdx] = { ...next[editingClipIdx], ...updated };
                return { ...prev, clips: next };
              });
            }}
          />
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
