"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type YouTubeStatus = { connected: boolean };
type MetaPage = { id: string; name: string };
type MetaStatus = {
  connected: boolean;
  pages?: MetaPage[];
  instagramAccountId?: string | null;
};
type PlatformStatus = { youtube: YouTubeStatus; meta: MetaStatus };

type Platforms = { youtube: boolean; instagram: boolean; facebook: boolean };

type Clip = {
  jobId: string;
  filename: string;
  path: string;
  title?: string;
  duration?: number;
  createdAt?: string;
  sourceUrl?: string;
};

type PublishResponse = {
  success?: boolean;
  error?: string;
  results?: Record<string, { error?: string; url?: string; id?: string } | unknown>;
};

type SourceMode = "upload" | "clip";

export default function PublishPage() {
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [statusError, setStatusError] = useState("");

  const [sourceMode, setSourceMode] = useState<SourceMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [clips, setClips] = useState<Clip[] | null>(null);
  const [selectedClipPath, setSelectedClipPath] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platforms, setPlatforms] = useState<Platforms>({
    youtube: false,
    instagram: false,
    facebook: false,
  });
  const [scheduleAt, setScheduleAt] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [result, setResult] = useState<PublishResponse | null>(null);

  const popupRef = useRef<Window | null>(null);
  const popupPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStatus = useCallback(async () => {
    setStatusError("");
    try {
      const [yt, meta] = await Promise.all([
        fetch("/api/admin/publish/youtube/status").then((r) => r.json()),
        fetch("/api/admin/publish/meta/status").then((r) => r.json()),
      ]);
      setStatus({ youtube: yt, meta });
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to load status");
    }
  }, []);

  const loadClips = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/publish/clips");
      const d = await r.json();
      setClips(d.clips || []);
    } catch {
      setClips([]);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadClips();
  }, [loadStatus, loadClips]);

  useEffect(() => {
    return () => {
      if (popupPollRef.current) clearInterval(popupPollRef.current);
    };
  }, []);

  async function logout() {
    try {
      await fetch("/api/admin/shorts/logout", { method: "POST" });
    } catch {
      // ignore
    }
    window.location.href = "/admin/shorts/login?next=/admin/publish";
  }

  function openConnectPopup(provider: "youtube" | "meta") {
    const w = 600;
    const h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(
      `/auth/${provider}`,
      `connect-${provider}`,
      `width=${w},height=${h},left=${left},top=${top}`
    );
    if (!popup) {
      alert("Popup blocked — allow popups for this site and try again.");
      return;
    }
    popupRef.current = popup;
    if (popupPollRef.current) clearInterval(popupPollRef.current);
    popupPollRef.current = setInterval(() => {
      if (popup.closed) {
        if (popupPollRef.current) clearInterval(popupPollRef.current);
        popupPollRef.current = null;
        loadStatus();
      }
    }, 800);
  }

  function togglePlatform(key: keyof Platforms) {
    setPlatforms((p) => ({ ...p, [key]: !p[key] }));
  }

  // Upload a file directly to the backend in two steps:
  //   1. POST /api/admin/publish/upload-reserve → { uploadUrl, token, exp, uploadId }
  //   2. POST <uploadUrl>?token=...&exp=... with multipart `video`
  // Returns the on-disk path the publish endpoint should consume.
  async function uploadFileDirect(f: File): Promise<string> {
    const reserveRes = await fetch("/api/admin/publish/upload-reserve", {
      method: "POST",
    });
    const reserve = await reserveRes.json();
    if (!reserveRes.ok || reserve.error) {
      throw new Error(reserve.error || `Reserve failed (${reserveRes.status})`);
    }
    const { uploadUrl, token, exp } = reserve as {
      uploadUrl: string;
      token: string;
      exp: number;
    };

    const target = `${uploadUrl}?token=${encodeURIComponent(token)}&exp=${exp}`;
    return await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", target);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        try {
          const body = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && body.path) {
            resolve(body.path);
          } else {
            reject(new Error(body.error || `Upload failed (${xhr.status})`));
          }
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error("Upload network error"));
      xhr.onabort = () => reject(new Error("Upload aborted"));

      const fd = new FormData();
      fd.append("video", f);
      xhr.send(fd);
    });
  }

  async function handlePublish() {
    if (sourceMode === "upload" && !file) {
      setResult({ error: "Pick a video file first." });
      return;
    }
    if (sourceMode === "clip" && !selectedClipPath) {
      setResult({ error: "Pick a clip first." });
      return;
    }
    if (!title.trim()) {
      setResult({ error: "Title is required." });
      return;
    }
    const chosen = (Object.keys(platforms) as Array<keyof Platforms>).filter(
      (k) => platforms[k]
    );
    if (chosen.length === 0) {
      setResult({ error: "Pick at least one platform." });
      return;
    }

    setPublishing(true);
    setUploadProgress(null);
    setResult(null);
    try {
      const scheduledAt = scheduleAt ? new Date(scheduleAt).toISOString() : undefined;

      let videoPath: string;
      if (sourceMode === "upload") {
        setUploadProgress(0);
        videoPath = await uploadFileDirect(file as File);
        setUploadProgress(null);
      } else {
        videoPath = selectedClipPath;
      }

      const r = await fetch("/api/admin/publish/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoPath,
          title: title.trim(),
          description,
          platforms: chosen,
          scheduledAt,
        }),
      });

      const d: PublishResponse = await r.json();
      if (!r.ok || d.error) {
        throw new Error(d.error || `Request failed (${r.status})`);
      }
      setResult(d);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Publish failed" });
    } finally {
      setPublishing(false);
      setUploadProgress(null);
    }
  }

  const ytConnected = !!status?.youtube?.connected;
  const metaConnected = !!status?.meta?.connected;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-2 gap-4">
          <h1 className="text-4xl font-bold">Publish</h1>
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-gray-300 mt-3"
          >
            Log out
          </button>
        </div>
        <p className="text-gray-400 mb-8">
          Upload a video to YouTube, Instagram, and Facebook in one go.
        </p>

        {/* ───────── Connections ───────── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Connections</h2>
            <button
              onClick={loadStatus}
              className="text-sm text-gray-400 hover:text-white"
            >
              Refresh
            </button>
          </div>
          {statusError && (
            <p className="text-red-400 text-sm mb-3">{statusError}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ConnectionCard
              name="YouTube"
              connected={ytConnected}
              onConnect={() => openConnectPopup("youtube")}
            />
            <ConnectionCard
              name="Meta (Instagram + Facebook)"
              connected={metaConnected}
              detail={[
                status?.meta?.pages?.[0]?.name,
                status?.meta?.instagramAccountId ? "Instagram linked" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              onConnect={() => openConnectPopup("meta")}
            />
          </div>
        </section>

        {/* ───────── Upload form ───────── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">New post</h2>

          <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
            Video source
          </label>
          <div className="inline-flex bg-gray-800 border border-gray-700 rounded-lg p-0.5 mb-3">
            {(["upload", "clip"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSourceMode(m)}
                className={`px-4 py-1.5 rounded text-sm font-medium transition ${
                  sourceMode === m
                    ? "bg-green-500 text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {m === "upload" ? "Upload file" : "Pick from clips"}
              </button>
            ))}
          </div>

          {sourceMode === "upload" && (
            <>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700 mb-2"
              />
              {file && (
                <p className="text-xs text-gray-500 mb-4">
                  {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </>
          )}

          {sourceMode === "clip" && (
            <div className="mb-4">
              {clips === null && <p className="text-sm text-gray-500">Loading clips…</p>}
              {clips && clips.length === 0 && (
                <p className="text-sm text-gray-500">
                  No clips found. Cut a video in <span className="text-gray-300">/admin/shorts</span> first.
                </p>
              )}
              {clips && clips.length > 0 && (
                <select
                  value={selectedClipPath}
                  onChange={(e) => setSelectedClipPath(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none"
                >
                  <option value="">— Pick a clip —</option>
                  {clips.map((c) => (
                    <option key={c.path} value={c.path}>
                      {c.title || c.filename}
                      {c.duration ? ` · ${c.duration}s` : ""}
                      {c.createdAt ? ` · ${new Date(c.createdAt).toLocaleDateString()}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1 mt-4">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none mb-4"
            placeholder="Short, descriptive title"
          />

          <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none mb-4 resize-y"
            placeholder="Caption / description"
          />

          <label className="block text-xs uppercase tracking-wide text-gray-500 mb-2">
            Platforms
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            <PlatformPill
              label="YouTube"
              active={platforms.youtube}
              disabled={!ytConnected}
              onClick={() => togglePlatform("youtube")}
            />
            <PlatformPill
              label="Instagram"
              active={platforms.instagram}
              disabled={!metaConnected}
              onClick={() => togglePlatform("instagram")}
            />
            <PlatformPill
              label="Facebook"
              active={platforms.facebook}
              disabled={!metaConnected}
              onClick={() => togglePlatform("facebook")}
            />
          </div>

          <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
            Schedule (optional)
          </label>
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none mb-6"
          />
          <p className="text-xs text-gray-500 -mt-4 mb-6">
            Leave blank to publish immediately.
          </p>

          <button
            onClick={handlePublish}
            disabled={publishing}
            className="bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-400 text-black font-bold px-6 py-3 rounded-xl"
          >
            {publishing
              ? uploadProgress !== null
                ? `Uploading ${uploadProgress}%`
                : "Publishing..."
              : scheduleAt
              ? "Schedule"
              : "Publish now"}
          </button>

          {publishing && uploadProgress !== null && (
            <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {result?.error && (
            <div className="mt-6 bg-red-950 border border-red-800 text-red-300 rounded-lg p-4 text-sm">
              {result.error}
            </div>
          )}
          {result?.results && Object.keys(result.results).length > 0 && (
            <div className="mt-6 space-y-2">
              {Object.entries(result.results).map(([platform, raw]) => {
                const r = (raw || {}) as { error?: string; url?: string; id?: string };
                const ok = !r.error;
                return (
                  <div
                    key={platform}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                      ok
                        ? "border-green-500/30 bg-green-500/5 text-green-300"
                        : "border-red-500/30 bg-red-500/5 text-red-300"
                    }`}
                  >
                    <span className="font-medium capitalize">{platform}</span>
                    <span className="truncate ml-3">
                      {ok
                        ? r.url
                          ? <a href={r.url} target="_blank" rel="noreferrer" className="underline">{r.url}</a>
                          : r.id
                            ? `id: ${r.id}`
                            : "Published"
                        : r.error || "Failed"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ConnectionCard({
  name,
  connected,
  detail,
  onConnect,
}: {
  name: string;
  connected: boolean;
  detail?: string;
  onConnect: () => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connected ? "bg-green-400" : "bg-gray-600"
            }`}
          />
          <span className="font-medium">{name}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">
          {connected ? detail || "Connected" : "Not connected"}
        </p>
      </div>
      <button
        onClick={onConnect}
        className={`text-sm font-semibold px-4 py-2 rounded-lg shrink-0 ${
          connected
            ? "border border-gray-700 text-gray-300 hover:text-white"
            : "bg-green-500 hover:bg-green-400 text-black"
        }`}
      >
        {connected ? "Reconnect" : "Connect"}
      </button>
    </div>
  );
}

function PlatformPill({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Connect this platform first" : undefined}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
        disabled
          ? "border-gray-800 text-gray-600 cursor-not-allowed"
          : active
          ? "bg-green-500 border-green-500 text-black"
          : "border-gray-700 text-gray-300 hover:border-gray-500"
      }`}
    >
      {label}
    </button>
  );
}
