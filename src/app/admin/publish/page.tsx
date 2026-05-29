"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type YouTubeAccount = { id: string; name: string };
type FacebookAccount = { id: string; name: string };
type InstagramAccount = { id: string; username: string; facebookPageName?: string };

type Connections = {
  youtube: YouTubeAccount[];
  facebook: FacebookAccount[];
  instagram: InstagramAccount[];
};

type Clip = {
  jobId: string;
  filename: string;
  path: string;
  title?: string;
  duration?: number;
  createdAt?: string;
  sourceUrl?: string;
};

type Target = {
  platform: "youtube" | "facebook" | "instagram";
  id: string;
};

type PublishResult = {
  platform: string;
  id: string;
  accountName?: string;
  url?: string;
  error?: string;
};

type PublishResponse = {
  success?: boolean;
  error?: string;
  results?: PublishResult[];
};

type SourceMode = "upload" | "clip";

type YouTubeOptions = {
  visibility?: "public" | "unlisted" | "private";
  madeForKids?: boolean;
  tags?: string[];
  playlistIds?: string[];
  thumbnailDataUrl?: string;
  // UI-only state (not sent):
  tagsInput?: string;
  thumbnailPreview?: string;
};

type TargetOptionsMap = Record<string, YouTubeOptions>; // key = targetKey

type YouTubePlaylist = { id: string; title: string };

function targetKey(t: { platform: string; id: string }) {
  return `${t.platform}:${t.id}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

function sendChunk(
  url: string,
  blob: Blob,
  onProgress: (loaded: number, total: number) => void
): Promise<{ done?: boolean; path?: string; error?: string; index?: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded, e.total);
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(body);
        else reject(new Error(body.error || `Chunk failed (${xhr.status})`));
      } catch {
        reject(new Error(`Chunk failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Chunk network error"));
    xhr.onabort = () => reject(new Error("Chunk aborted"));
    xhr.send(blob);
  });
}

export default function PublishPage() {
  const [connections, setConnections] = useState<Connections | null>(null);
  const [connectionsError, setConnectionsError] = useState("");

  const [sourceMode, setSourceMode] = useState<SourceMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [clips, setClips] = useState<Clip[] | null>(null);
  const [selectedClipPath, setSelectedClipPath] = useState<string>("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<Target[]>([]);
  const [targetOptions, setTargetOptions] = useState<TargetOptionsMap>({});
  const [ytPlaylists, setYtPlaylists] = useState<Record<string, YouTubePlaylist[]>>({});
  const [scheduleAt, setScheduleAt] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [result, setResult] = useState<PublishResponse | null>(null);

  const popupPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConnections = useCallback(async () => {
    setConnectionsError("");
    try {
      const r = await fetch("/api/admin/publish/connections");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Failed (${r.status})`);
      setConnections(d);
    } catch (err) {
      setConnectionsError(err instanceof Error ? err.message : "Failed to load");
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
    loadConnections();
    loadClips();
  }, [loadConnections, loadClips]);

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
      `connect-${provider}-${Date.now()}`,
      `width=${w},height=${h},left=${left},top=${top}`
    );
    if (!popup) {
      alert("Popup blocked — allow popups for this site and try again.");
      return;
    }
    if (popupPollRef.current) clearInterval(popupPollRef.current);
    popupPollRef.current = setInterval(() => {
      if (popup.closed) {
        if (popupPollRef.current) clearInterval(popupPollRef.current);
        popupPollRef.current = null;
        loadConnections();
      }
    }, 800);
  }

  async function disconnect(type: keyof Connections, id: string) {
    if (!confirm(`Remove this ${type} connection?`)) return;
    try {
      const r = await fetch(
        `/api/admin/publish/connections/${type}/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Failed (${r.status})`);
      }
      setSelectedTargets((prev) =>
        prev.filter((t) => !(t.platform === type && t.id === id))
      );
      loadConnections();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Disconnect failed");
    }
  }

  function toggleTarget(t: Target) {
    setSelectedTargets((prev) => {
      const exists = prev.some((p) => p.platform === t.platform && p.id === t.id);
      return exists
        ? prev.filter((p) => !(p.platform === t.platform && p.id === t.id))
        : [...prev, t];
    });
    // First time a YT channel is toggled, fetch its playlists.
    if (t.platform === "youtube" && !ytPlaylists[t.id]) {
      fetch(`/api/admin/publish/youtube/${encodeURIComponent(t.id)}/playlists`)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.playlists)) {
            setYtPlaylists((m) => ({ ...m, [t.id]: d.playlists }));
          }
        })
        .catch(() => {
          // ignore; expander will show empty list
        });
    }
  }

  function setOptions(key: string, patch: Partial<YouTubeOptions>) {
    setTargetOptions((m) => ({ ...m, [key]: { ...(m[key] || {}), ...patch } }));
  }

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

    // 5 MB chunks. Each chunk is a short HTTP request, well under Railway's
    // 5-minute per-request timeout, regardless of total file size.
    const CHUNK_SIZE = 5 * 1024 * 1024;
    const total = Math.max(1, Math.ceil(f.size / CHUNK_SIZE));
    const filename = encodeURIComponent(
      f.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "upload.bin"
    );

    let finalPath: string | null = null;
    for (let i = 0; i < total; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, f.size);
      const chunk = f.slice(start, end);

      const url =
        `${uploadUrl}/chunk?token=${encodeURIComponent(token)}` +
        `&exp=${exp}&index=${i}&total=${total}&filename=${filename}`;

      const body = await sendChunk(url, chunk, (chunkLoaded, chunkTotal) => {
        const done = i * CHUNK_SIZE + chunkLoaded;
        setUploadProgress(Math.min(100, Math.round((done / f.size) * 100)));
      });

      if (body.done && body.path) finalPath = body.path;
    }
    if (!finalPath) throw new Error("Upload finished without a final path");
    return finalPath;
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
    if (selectedTargets.length === 0) {
      setResult({ error: "Pick at least one destination." });
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

      // Strip UI-only state (tagsInput, thumbnailPreview) and parse tags string.
      const targetsWithOptions = selectedTargets.map((t) => {
        const raw = targetOptions[targetKey(t)] || {};
        const tags = (raw.tagsInput || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const options: Record<string, unknown> = {};
        if (raw.visibility) options.visibility = raw.visibility;
        if (typeof raw.madeForKids === "boolean") options.madeForKids = raw.madeForKids;
        if (tags.length > 0) options.tags = tags;
        if (raw.playlistIds && raw.playlistIds.length > 0) options.playlistIds = raw.playlistIds;
        if (raw.thumbnailDataUrl) options.thumbnailDataUrl = raw.thumbnailDataUrl;
        return Object.keys(options).length > 0 ? { ...t, options } : t;
      });

      const r = await fetch("/api/admin/publish/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoPath,
          title: title.trim(),
          description,
          targets: targetsWithOptions,
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
          Connect multiple accounts and post to any combination of them at once.
        </p>

        {/* ───────── Connections ───────── */}
        <section className="mb-10 space-y-6">
          <ConnectionGroup
            heading="YouTube"
            empty="No channels connected."
            connectLabel="+ Connect YouTube channel"
            onConnect={() => openConnectPopup("youtube")}
          >
            {connections?.youtube.map((c) => (
              <ConnectionRow
                key={c.id}
                label={c.name}
                onRemove={() => disconnect("youtube", c.id)}
              />
            ))}
          </ConnectionGroup>

          <ConnectionGroup
            heading="Facebook Pages"
            empty="No Facebook Pages connected."
            connectLabel="+ Connect a Meta account"
            onConnect={() => openConnectPopup("meta")}
          >
            {connections?.facebook.map((c) => (
              <ConnectionRow
                key={c.id}
                label={c.name}
                onRemove={() => disconnect("facebook", c.id)}
              />
            ))}
          </ConnectionGroup>

          <ConnectionGroup
            heading="Instagram"
            empty="No Instagram accounts connected. Instagram requires a linked Facebook Page."
            connectLabel="+ Connect a Meta account"
            onConnect={() => openConnectPopup("meta")}
          >
            {connections?.instagram.map((c) => (
              <ConnectionRow
                key={c.id}
                label={`@${c.username}`}
                sublabel={c.facebookPageName ? `via ${c.facebookPageName}` : undefined}
                onRemove={() => disconnect("instagram", c.id)}
              />
            ))}
          </ConnectionGroup>

          {connectionsError && (
            <p className="text-red-400 text-sm">{connectionsError}</p>
          )}
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
                  No clips found. Cut a video in{" "}
                  <span className="text-gray-300">/admin/shorts</span> first.
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
            Destinations
          </label>
          {connections === null ? (
            <p className="text-sm text-gray-500 mb-4">Loading…</p>
          ) : connections.youtube.length === 0 &&
            connections.facebook.length === 0 &&
            connections.instagram.length === 0 ? (
            <p className="text-sm text-gray-500 mb-4">
              Connect at least one account above first.
            </p>
          ) : (
            <div className="space-y-1.5 mb-4">
              {connections.youtube.map((c) => {
                const key = `youtube:${c.id}`;
                const checked = selectedTargets.some(
                  (t) => t.platform === "youtube" && t.id === c.id
                );
                return (
                  <div key={`yt-${c.id}`}>
                    <DestinationCheckbox
                      label={`YouTube · ${c.name}`}
                      checked={checked}
                      onChange={() =>
                        toggleTarget({ platform: "youtube", id: c.id })
                      }
                    />
                    {checked && (
                      <YouTubeOptionsExpander
                        opts={targetOptions[key] || {}}
                        playlists={ytPlaylists[c.id] || null}
                        onChange={(patch) => setOptions(key, patch)}
                      />
                    )}
                  </div>
                );
              })}
              {connections.facebook.map((c) => (
                <DestinationCheckbox
                  key={`fb-${c.id}`}
                  label={`Facebook · ${c.name}`}
                  checked={selectedTargets.some(
                    (t) => t.platform === "facebook" && t.id === c.id
                  )}
                  onChange={() => toggleTarget({ platform: "facebook", id: c.id })}
                />
              ))}
              {connections.instagram.map((c) => (
                <DestinationCheckbox
                  key={`ig-${c.id}`}
                  label={`Instagram · @${c.username}`}
                  checked={selectedTargets.some(
                    (t) => t.platform === "instagram" && t.id === c.id
                  )}
                  onChange={() => toggleTarget({ platform: "instagram", id: c.id })}
                />
              ))}
            </div>
          )}

          <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
            Schedule (optional)
          </label>
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none mb-2"
          />
          <p className="text-xs text-gray-500 mb-6">
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
              : `Publish to ${selectedTargets.length || "..."} destination${
                  selectedTargets.length === 1 ? "" : "s"
                }`}
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
          {result?.results && result.results.length > 0 && (
            <div className="mt-6 space-y-2">
              {result.results.map((r) => {
                const ok = !r.error;
                return (
                  <div
                    key={`${r.platform}-${r.id}`}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                      ok
                        ? "border-green-500/30 bg-green-500/5 text-green-300"
                        : "border-red-500/30 bg-red-500/5 text-red-300"
                    }`}
                  >
                    <span className="font-medium">
                      <span className="capitalize">{r.platform}</span>
                      {r.accountName ? ` · ${r.accountName}` : ""}
                    </span>
                    <span className="truncate ml-3">
                      {ok
                        ? r.url
                          ? <a href={r.url} target="_blank" rel="noreferrer" className="underline">{r.url}</a>
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

function ConnectionGroup({
  heading,
  empty,
  connectLabel,
  onConnect,
  children,
}: {
  heading: string;
  empty: string;
  connectLabel: string;
  onConnect: () => void;
  children?: React.ReactNode;
}) {
  const hasAny = Array.isArray(children)
    ? children.filter(Boolean).length > 0
    : Boolean(children);
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-300 mb-2">{heading}</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        {hasAny ? children : <p className="px-4 py-3 text-sm text-gray-500">{empty}</p>}
        <button
          onClick={onConnect}
          className="block w-full text-left px-4 py-2.5 text-sm text-green-400 hover:bg-gray-800"
        >
          {connectLabel}
        </button>
      </div>
    </div>
  );
}

function ConnectionRow({
  label,
  sublabel,
  onRemove,
}: {
  label: string;
  sublabel?: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-white truncate">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 truncate">{sublabel}</p>}
      </div>
      <button
        onClick={onRemove}
        className="text-xs text-gray-500 hover:text-red-400 ml-3"
      >
        Disconnect
      </button>
    </div>
  );
}

function YouTubeOptionsExpander({
  opts,
  playlists,
  onChange,
}: {
  opts: YouTubeOptions;
  playlists: YouTubePlaylist[] | null;
  onChange: (patch: Partial<YouTubeOptions>) => void;
}) {
  const selectedPlaylists = opts.playlistIds || [];
  function togglePlaylist(id: string) {
    const next = selectedPlaylists.includes(id)
      ? selectedPlaylists.filter((p) => p !== id)
      : [...selectedPlaylists, id];
    onChange({ playlistIds: next });
  }
  async function handleThumb(file: File | null) {
    if (!file) {
      onChange({ thumbnailDataUrl: undefined, thumbnailPreview: undefined });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("YouTube thumbnails must be 2 MB or smaller.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    onChange({ thumbnailDataUrl: dataUrl, thumbnailPreview: dataUrl });
  }
  return (
    <div className="mt-2 ml-6 mb-2 rounded-lg border border-gray-800 bg-gray-950/60 p-3 space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-gray-500">Visibility</span>
          <select
            value={opts.visibility || "public"}
            onChange={(e) =>
              onChange({ visibility: e.target.value as YouTubeOptions["visibility"] })
            }
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
          >
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!opts.madeForKids}
            onChange={(e) => onChange({ madeForKids: e.target.checked })}
            className="accent-green-500"
          />
          <span>Made for kids</span>
        </label>
      </div>

      <label className="block">
        <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
          Tags (comma-separated)
        </span>
        <input
          type="text"
          value={opts.tagsInput || ""}
          onChange={(e) => onChange({ tagsInput: e.target.value })}
          placeholder="pickleball, drills, paddle review"
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white outline-none"
        />
      </label>

      <div>
        <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
          Add to playlists
        </span>
        {playlists === null && <p className="text-gray-500 text-xs">Loading…</p>}
        {playlists && playlists.length === 0 && (
          <p className="text-gray-500 text-xs">No playlists on this channel.</p>
        )}
        {playlists && playlists.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
            {playlists.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedPlaylists.includes(p.id)}
                  onChange={() => togglePlaylist(p.id)}
                  className="accent-green-500"
                />
                <span className="truncate">{p.title}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <label className="block">
        <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
          Custom thumbnail (JPG/PNG, ≤2 MB)
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => handleThumb(e.target.files?.[0] ?? null)}
          className="block w-full text-xs text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700"
        />
        {opts.thumbnailPreview && (
          <div className="mt-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={opts.thumbnailPreview}
              alt="thumb"
              className="h-16 w-28 object-cover rounded border border-gray-700"
            />
            <button
              type="button"
              onClick={() => handleThumb(null)}
              className="text-xs text-gray-500 hover:text-red-400"
            >
              Remove
            </button>
          </div>
        )}
      </label>
    </div>
  );
}

function DestinationCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${
        checked
          ? "border-green-500/40 bg-green-500/5"
          : "border-gray-800 bg-gray-800 hover:border-gray-700"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-green-500"
      />
      <span className="text-white">{label}</span>
    </label>
  );
}
