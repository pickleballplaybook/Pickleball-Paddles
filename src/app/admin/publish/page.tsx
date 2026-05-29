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
  // UI-only state (not sent):
  tagsInput?: string;
};

type FacebookOptions = {
  postAsReel?: boolean;
  taggedUserIds?: string[];
  collaboratorIds?: string[];
  placeId?: string;
  // UI-only:
  taggedInput?: string;
  collaboratorsInput?: string;
};

type InstagramOptions = {
  taggedUsernames?: string[];
  collaboratorUsernames?: string[];
  locationId?: string;
  // UI-only:
  taggedInput?: string;
  collaboratorsInput?: string;
};

type AnyOptions = YouTubeOptions & FacebookOptions & InstagramOptions;
type TargetOptionsMap = Record<string, AnyOptions>; // key = targetKey

type YouTubePlaylist = { id: string; title: string };

function targetKey(t: { platform: string; id: string }) {
  return `${t.platform}:${t.id}`;
}

function csvList(input: string | undefined): string[] {
  return (input || "").split(",").map((s) => s.trim()).filter(Boolean);
}

function normalize(v: string): string {
  return v.replace(/^@/, "").toLowerCase();
}

function isInCsv(input: string | undefined, value: string): boolean {
  const items = csvList(input);
  const want = normalize(value);
  return items.some((i) => normalize(i) === want);
}

function toggleCsv(input: string | undefined, value: string): string {
  const items = csvList(input);
  const want = normalize(value);
  if (items.some((i) => normalize(i) === want)) {
    return items.filter((i) => normalize(i) !== want).join(", ");
  }
  return [...items, value].join(", ");
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

  // Single thumbnail applied to every selected platform.
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [result, setResult] = useState<PublishResponse | null>(null);

  const popupPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive a previewable video URL for the thumbnail scrubber: a blob URL for
  // uploaded files, or the proxied clip URL for clips picked from history.
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  useEffect(() => {
    if (sourceMode === "upload" && file) {
      const url = URL.createObjectURL(file);
      setPreviewVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (sourceMode === "clip" && selectedClipPath && clips) {
      const clip = clips.find((c) => c.path === selectedClipPath);
      if (clip) {
        setPreviewVideoUrl(
          `/api/admin/shorts/clips/${encodeURIComponent(clip.jobId)}/${encodeURIComponent(clip.filename)}`
        );
        return;
      }
    }
    setPreviewVideoUrl(null);
  }, [sourceMode, file, selectedClipPath, clips]);

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

  function setOptions(key: string, patch: Partial<AnyOptions>) {
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

      const csv = (s: string | undefined) =>
        (s || "").split(",").map((x) => x.trim()).filter(Boolean);

      // Strip UI-only state and parse comma-separated inputs per platform.
      const targetsWithOptions = selectedTargets.map((t) => {
        const raw = targetOptions[targetKey(t)] || {};
        const options: Record<string, unknown> = {};
        if (t.platform === "youtube") {
          const tags = csv(raw.tagsInput);
          if (raw.visibility) options.visibility = raw.visibility;
          if (typeof raw.madeForKids === "boolean") options.madeForKids = raw.madeForKids;
          if (tags.length > 0) options.tags = tags;
          if (raw.playlistIds && raw.playlistIds.length > 0)
            options.playlistIds = raw.playlistIds;
        } else if (t.platform === "facebook") {
          const tagged = csv(raw.taggedInput);
          const collabs = csv(raw.collaboratorsInput);
          // Send postAsReel explicitly when user has toggled it OFF (default is true on the backend).
          if (raw.postAsReel === false) options.postAsReel = false;
          if (tagged.length > 0) options.taggedUserIds = tagged;
          if (collabs.length > 0) options.collaboratorIds = collabs;
          if (raw.placeId) options.placeId = raw.placeId;
        } else if (t.platform === "instagram") {
          const tagged = csv(raw.taggedInput).map((u) => u.replace(/^@/, ""));
          const collabs = csv(raw.collaboratorsInput).map((u) => u.replace(/^@/, ""));
          if (tagged.length > 0) options.taggedUsernames = tagged;
          if (collabs.length > 0) options.collaboratorUsernames = collabs;
          if (raw.locationId) options.locationId = raw.locationId;
        }
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
          thumbnailDataUrl: thumbnailDataUrl || undefined,
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
            Thumbnail
          </label>
          <div className="mb-5">
            <SharedThumbnailPicker
              videoUrl={previewVideoUrl}
              dataUrl={thumbnailDataUrl}
              onChange={setThumbnailDataUrl}
            />
          </div>

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
              {connections.facebook.map((c) => {
                const key = `facebook:${c.id}`;
                const checked = selectedTargets.some(
                  (t) => t.platform === "facebook" && t.id === c.id
                );
                return (
                  <div key={`fb-${c.id}`}>
                    <DestinationCheckbox
                      label={`Facebook · ${c.name}`}
                      checked={checked}
                      onChange={() =>
                        toggleTarget({ platform: "facebook", id: c.id })
                      }
                    />
                    {checked && (
                      <FacebookOptionsExpander
                        opts={targetOptions[key] || {}}
                        onChange={(patch) => setOptions(key, patch)}
                        otherPages={connections.facebook.filter(
                          (p) => p.id !== c.id
                        )}
                      />
                    )}
                  </div>
                );
              })}
              {connections.instagram.map((c) => {
                const key = `instagram:${c.id}`;
                const checked = selectedTargets.some(
                  (t) => t.platform === "instagram" && t.id === c.id
                );
                return (
                  <div key={`ig-${c.id}`}>
                    <DestinationCheckbox
                      label={`Instagram · @${c.username}`}
                      checked={checked}
                      onChange={() =>
                        toggleTarget({ platform: "instagram", id: c.id })
                      }
                    />
                    {checked && (
                      <InstagramOptionsExpander
                        opts={targetOptions[key] || {}}
                        onChange={(patch) => setOptions(key, patch)}
                        otherAccounts={connections.instagram.filter(
                          (a) => a.id !== c.id
                        )}
                      />
                    )}
                  </div>
                );
              })}
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

    </div>
  );
}

type ThumbMode = "capture" | "upload";

function PresetChips({
  presets,
  currentValue,
  onToggle,
}: {
  presets: { label: string; value: string }[];
  currentValue: string;
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {presets.map((p) => {
        const on = isInCsv(currentValue, p.value);
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => onToggle(p.value)}
            className={`text-xs px-2 py-1 rounded-full border transition ${
              on
                ? "bg-green-500/15 border-green-500/50 text-green-200"
                : "border-gray-700 text-gray-300 hover:border-gray-500"
            }`}
          >
            {on ? "✓ " : "+ "}
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

function FacebookOptionsExpander({
  opts,
  onChange,
  otherPages,
}: {
  opts: FacebookOptions;
  onChange: (patch: Partial<FacebookOptions>) => void;
  otherPages: FacebookAccount[];
}) {
  const postAsReel = opts.postAsReel !== false;
  return (
    <div className="mt-2 ml-6 mb-2 rounded-lg border border-gray-800 bg-gray-950/60 p-3 space-y-3 text-sm">
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={postAsReel}
          onChange={(e) => onChange({ postAsReel: e.target.checked })}
          className="accent-green-500 mt-0.5"
        />
        <span>
          Post as Reel
          <span className="block text-xs text-gray-500">
            Required for collaborators. Video must be 9:16 vertical, 15–90s.
          </span>
        </span>
      </label>
      {!postAsReel && (
        <p className="text-xs text-yellow-400">
          ⚠ Collaborators won&apos;t apply on legacy /videos posts.
        </p>
      )}
      <label className="block">
        <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
          Tag people (comma-separated FB user IDs, only works on legacy /videos)
        </span>
        <input
          type="text"
          value={opts.taggedInput || ""}
          onChange={(e) => onChange({ taggedInput: e.target.value })}
          placeholder="user1, user2"
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white outline-none"
        />
      </label>
      <div>
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
            Collaborators
          </span>
          <input
            type="text"
            value={opts.collaboratorsInput || ""}
            onChange={(e) => onChange({ collaboratorsInput: e.target.value })}
            placeholder="Click chips below or paste FB Page IDs"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white outline-none"
          />
        </label>
        {otherPages.length > 0 && (
          <PresetChips
            presets={otherPages.map((p) => ({ label: p.name, value: p.id }))}
            currentValue={opts.collaboratorsInput || ""}
            onToggle={(value) =>
              onChange({
                collaboratorsInput: toggleCsv(opts.collaboratorsInput, value),
              })
            }
          />
        )}
      </div>
      <label className="block">
        <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
          Location (FB place ID, optional)
        </span>
        <input
          type="text"
          value={opts.placeId || ""}
          onChange={(e) => onChange({ placeId: e.target.value })}
          placeholder="e.g. 11077326922 (look up on FB)"
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white outline-none"
        />
      </label>
    </div>
  );
}

function InstagramOptionsExpander({
  opts,
  onChange,
  otherAccounts,
}: {
  opts: InstagramOptions;
  onChange: (patch: Partial<InstagramOptions>) => void;
  otherAccounts: InstagramAccount[];
}) {
  const accountChips = otherAccounts.map((a) => ({
    label: `@${a.username}`,
    value: `@${a.username}`,
  }));
  return (
    <div className="mt-2 ml-6 mb-2 rounded-lg border border-gray-800 bg-gray-950/60 p-3 space-y-3 text-sm">
      <div>
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
            Tag people
          </span>
          <input
            type="text"
            value={opts.taggedInput || ""}
            onChange={(e) => onChange({ taggedInput: e.target.value })}
            placeholder="Click chips below or paste @usernames"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white outline-none"
          />
        </label>
        {accountChips.length > 0 && (
          <PresetChips
            presets={accountChips}
            currentValue={opts.taggedInput || ""}
            onToggle={(value) =>
              onChange({ taggedInput: toggleCsv(opts.taggedInput, value) })
            }
          />
        )}
      </div>
      <div>
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
            Collaborators (max 3)
          </span>
          <input
            type="text"
            value={opts.collaboratorsInput || ""}
            onChange={(e) => onChange({ collaboratorsInput: e.target.value })}
            placeholder="Click chips below or paste @usernames"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white outline-none"
          />
        </label>
        {accountChips.length > 0 && (
          <PresetChips
            presets={accountChips}
            currentValue={opts.collaboratorsInput || ""}
            onToggle={(value) =>
              onChange({
                collaboratorsInput: toggleCsv(opts.collaboratorsInput, value),
              })
            }
          />
        )}
      </div>
      <label className="block">
        <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
          Location ID (optional)
        </span>
        <input
          type="text"
          value={opts.locationId || ""}
          onChange={(e) => onChange({ locationId: e.target.value })}
          placeholder="e.g. 213385402 (look up on IG)"
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white outline-none"
        />
      </label>
    </div>
  );
}

function SharedThumbnailPicker({
  videoUrl,
  dataUrl,
  onChange,
}: {
  videoUrl: string | null;
  dataUrl: string | null;
  onChange: (next: string | null) => void;
}) {
  async function handleUpload(file: File | null) {
    if (!file) {
      onChange(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Thumbnail images must be 2 MB or smaller.");
      return;
    }
    const url = await fileToDataUrl(file);
    onChange(url);
  }
  if (videoUrl) {
    return (
      <ThumbnailFromVideo
        videoUrl={videoUrl}
        currentPreview={dataUrl || undefined}
        onCapture={(d) => onChange(d)}
        onClear={() => onChange(null)}
        fallbackUpload={
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700"
          />
        }
      />
    );
  }
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">
        Pick a video file or a clip above to scrub for a thumbnail. Or upload an
        image directly:
      </p>
      <input
        type="file"
        accept="image/jpeg,image/png"
        onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
        className="block w-full text-xs text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700"
      />
      {dataUrl && (
        <div className="mt-2 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="thumb"
            className="h-16 w-28 object-cover rounded border border-gray-700"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-gray-500 hover:text-red-400"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function ThumbnailFromVideo({
  videoUrl,
  currentPreview,
  onCapture,
  onClear,
  fallbackUpload,
}: {
  videoUrl: string;
  currentPreview?: string;
  onCapture: (dataUrl: string) => void;
  onClear: () => void;
  fallbackUpload: React.ReactNode;
}) {
  const [mode, setMode] = useState<ThumbMode>("capture");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [livePreview, setLivePreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [pos, setPos] = useState<"top" | "middle" | "bottom">("middle");
  const [color, setColor] = useState("#ffffff");
  const [outline, setOutline] = useState(true);
  const [sizePct, setSizePct] = useState(60); // 0..100 → scales relative to video height

  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    try {
      ctx.drawImage(video, 0, 0);
    } catch {
      // Cross-origin tainting — shouldn't happen with same-origin clips or blob URLs.
      return null;
    }

    if (text.trim()) {
      const fontPx = Math.max(
        16,
        Math.round((sizePct / 100) * canvas.height * 0.18)
      );
      ctx.font = `900 ${fontPx}px Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const lines = wrapTextLines(ctx, text.trim(), canvas.width * 0.9);
      const lineHeight = Math.round(fontPx * 1.15);
      const totalH = lines.length * lineHeight;
      const cx = canvas.width / 2;
      let cy =
        pos === "top"
          ? Math.round(canvas.height * 0.08) + totalH / 2
          : pos === "middle"
          ? canvas.height / 2
          : canvas.height - Math.round(canvas.height * 0.08) - totalH / 2;

      let y = cy - totalH / 2 + lineHeight / 2;
      for (const line of lines) {
        if (outline) {
          ctx.lineJoin = "round";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = Math.max(3, fontPx * 0.14);
          ctx.strokeText(line, cx, y);
        }
        ctx.fillStyle = color;
        ctx.fillText(line, cx, y);
        y += lineHeight;
      }
    }

    return canvas.toDataURL("image/jpeg", 0.92);
  }, [text, pos, color, outline, sizePct]);

  // Re-render on text/style changes
  useEffect(() => {
    const t = setTimeout(() => {
      const url = renderFrame();
      if (url) setLivePreview(url);
    }, 80);
    return () => clearTimeout(t);
  }, [renderFrame]);

  // Re-render on video seek
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => {
      const url = renderFrame();
      if (url) setLivePreview(url);
    };
    video.addEventListener("seeked", handler);
    video.addEventListener("loadeddata", handler);
    return () => {
      video.removeEventListener("seeked", handler);
      video.removeEventListener("loadeddata", handler);
    };
  }, [renderFrame]);

  function useThisFrame() {
    const url = renderFrame();
    if (url) onCapture(url);
  }

  return (
    <div>
      <div className="inline-flex bg-gray-800 border border-gray-700 rounded p-0.5 mb-2">
        {(["capture", "upload"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              mode === m
                ? "bg-green-500 text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {m === "capture" ? "Capture from video" : "Upload image"}
          </button>
        ))}
      </div>

      {mode === "capture" ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            crossOrigin="anonymous"
            className="w-full rounded border border-gray-700 bg-black"
            style={{ maxHeight: 320 }}
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add bold text (optional)"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white outline-none text-sm"
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
            <label className="flex items-center gap-1">
              <span className="text-gray-500">Position</span>
              <select
                value={pos}
                onChange={(e) =>
                  setPos(e.target.value as "top" | "middle" | "bottom")
                }
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
              >
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              <span className="text-gray-500">Size</span>
              <input
                type="range"
                min={20}
                max={100}
                value={sizePct}
                onChange={(e) => setSizePct(Number(e.target.value))}
              />
            </label>
            <label className="flex items-center gap-1">
              <span className="text-gray-500">Color</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-8 bg-transparent border border-gray-700 rounded"
              />
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={outline}
                onChange={(e) => setOutline(e.target.checked)}
                className="accent-green-500"
              />
              <span>Outline</span>
            </label>
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {livePreview && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={livePreview}
                alt="preview"
                className="w-full max-w-xs rounded border border-gray-700"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={useThisFrame}
                  className="bg-green-500 hover:bg-green-400 text-black text-xs font-semibold px-3 py-1.5 rounded"
                >
                  Use this thumbnail
                </button>
                {currentPreview && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="text-xs text-gray-500 hover:text-red-400"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
          {currentPreview && (
            <div className="text-xs text-green-400">
              ✓ Thumbnail set (will be applied on publish)
            </div>
          )}
        </div>
      ) : (
        <>{fallbackUpload}</>
      )}
    </div>
  );
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const tentative = current ? `${current} ${word}` : word;
    if (ctx.measureText(tentative).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = tentative;
    }
  }
  if (current) lines.push(current);
  return lines;
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
