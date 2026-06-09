"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminNav } from "../_components/AdminNav";
import { buildReelDescription } from "@/lib/reelDescription";

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
  // The Shorts Generator's per-clip rationale ("why this clip is interesting").
  // Used by the auto-fill on this page to compose a default description.
  reason?: string;
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
  scheduled?: boolean;
  scheduledAt?: string;
  scheduledId?: string;
};

type PublishResponse = {
  success?: boolean;
  error?: string;
  results?: PublishResult[];
};

type SourceMode = "upload" | "clip";

type UploadItem = {
  id: string;
  file: File;
  progress: number;          // 0-100
  status: "uploading" | "ready" | "error" | "published";
  videoPath?: string;        // Railway-side path once chunked upload completes
  error?: string;
};

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
  productIds?: string[];
  groupIds?: string[];
  // UI-only:
  taggedInput?: string;
  collaboratorsInput?: string;
};

type FacebookGroup = {
  id: string;
  name: string;
  picture?: { data?: { url?: string } };
  member_count?: number;
  privacy?: string;
};

type InstagramOptions = {
  taggedUsernames?: string[];
  collaboratorUsernames?: string[];
  locationId?: string;
  productIds?: string[];
  // UI-only:
  taggedInput?: string;
  collaboratorsInput?: string;
};

type CatalogProduct = {
  id: string;
  retailer_id?: string;
  name?: string;
  image_url?: string;
  price?: string;
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

// ── Destination brand grouping ────────────────────────────────────────────
// Splits all connected accounts into per-brand columns on the publish form.
// Order in BRAND_ORDER controls left-to-right layout. "other" is the catch-
// all so an account with an unmatched name never disappears from the form.
type BrandKey = "playbook" | "drills" | "picklebrain" | "reviews" | "other";

const BRAND_LABEL: Record<BrandKey, string> = {
  playbook:    "Pickleball Playbook",
  drills:      "Pickleball Drills",
  picklebrain: "Picklebrain",
  reviews:     "Pickleball Playbook Reviews",
  other:       "Other",
};

const BRAND_ORDER: BrandKey[] = ["playbook", "drills", "picklebrain", "reviews", "other"];

// Match brand by keywords in the account name / username. "review" is
// checked before "playbook" because every Reviews account also contains
// "playbook" in its name (e.g. "@playbookreviews").
function brandFor(label: string): BrandKey {
  const s = label.toLowerCase();
  if (s.includes("review"))                             return "reviews";
  if (s.includes("drill"))                              return "drills";
  if (s.includes("picklebrain") || s.includes("brain")) return "picklebrain";
  if (s.includes("playbook"))                           return "playbook";
  return "other";
}

const FILMER_HANDLES = [
  "zachhigginson_pb",
  "elliott_schupp_pickleball",
  "itsezpb",
  "lucpham__",
  "picklewithsilas",
  "officialmeganfudge",
  "sheaunderwood_",
  "blakesuard.pb",
  "wesdawg_pb",
  "travisrettenmaier",
  "riripickleball",
  "everett.epa",
  "alber.pickleball",
  "zack.card_pb",
  "james_lin.pb",
  "yaol.pb",
  "zackmarceau_pb",
  "dr.lane_o",
  "drillmorepickleball",
  "troyakin",
  "pickleballmama",
];

const CREDIT_RE = /\n*🎥\s*@[\w.]+\s*$/;

const DESCRIPTION_PRESETS = [
  {
    label: "🏆 Drills App",
    text: `🏆PBDrills.com

@pickleballdrillsapp gives you a clear path to leveling up.
Get personalized drills
Learn proper technique
Train with top PPA & APP pros

Try Pickleball Drills free on the App Store - Link in bio.

#pickleballdrills #pickleball #pickleballdrillsapp #pickleballdrilling #pickleballtournament`,
  },
  {
    label: "🏓 Playbook Paddles",
    text: `🏓PlaybookPaddles.com

Save on paddles & gear with code PLAYBOOK - Link in bio.`,
  },
];

// Scale + re-encode an image File so its base64 representation stays well
// under Vercel's 4.5 MB request body cap. Mirrors the renderFrame()
// compression loop used by the "Capture from video" path.
function compressImageToDataUrl(
  file: File,
  maxDim = 960,
  maxBytes = 700 * 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(
          1,
          maxDim / Math.max(img.naturalWidth, img.naturalHeight)
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("canvas 2d context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > maxBytes && quality > 0.35) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("could not decode image"));
    };
    img.src = objectUrl;
  });
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
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
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
  const [result, setResult] = useState<PublishResponse | null>(null);

  const selectedUpload =
    uploads.find((u) => u.id === selectedUploadId) || null;

  const popupPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive a previewable video URL for the thumbnail scrubber: a blob URL for
  // uploaded files, or the proxied clip URL for clips picked from history.
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  // Depend only on the File reference (stable across upload progress updates)
  // and clip path — NOT the full selectedUpload object, which gets recreated
  // every time progress ticks and would re-mount the <video> element.
  const selectedFile = selectedUpload?.file ?? null;
  useEffect(() => {
    if (sourceMode === "upload" && selectedFile) {
      const url = URL.createObjectURL(selectedFile);
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
  }, [sourceMode, selectedFile, selectedClipPath, clips]);

  // ── Auto-fill the description when a source is selected ──────────────────
  // Three behaviors:
  //   1. Description is empty                    → always auto-fill
  //   2. Description matches the last auto-fill  → replace with the new
  //      auto-fill (user picked another clip without touching the field)
  //   3. Description has been edited             → leave it alone (user
  //      changes always win)
  //
  // `lastAutoFilled` is the exact string we wrote last time. As long as
  // the current description equals it, we know the user hasn't edited.
  // The moment they type anything, the strings diverge and auto-fill
  // stops touching the field.
  //
  // Sources:
  //   • Clip mode   → buildReelDescription(clip, clip.sourceUrl, []) —
  //     identical to the Shorts Generator's per-clip description.
  //   • Upload mode → "🏓 Playbook Paddles" DESCRIPTION_PRESETS default
  //     since fresh uploads have no per-video metadata.
  const [lastAutoFilled, setLastAutoFilled] = useState("");
  useEffect(() => {
    let next: string | null = null;
    if (sourceMode === "clip" && selectedClipPath && clips) {
      const clip = clips.find((c) => c.path === selectedClipPath);
      if (clip) next = buildReelDescription(clip, clip.sourceUrl, []);
    } else if (sourceMode === "upload" && selectedFile) {
      const defaultPreset = DESCRIPTION_PRESETS.find((p) => p.label.includes("Playbook Paddles"));
      if (defaultPreset) next = defaultPreset.text;
    }
    if (next === null) return;

    // Safe to overwrite if the field is empty OR still equal to whatever
    // we put there last time (user hasn't typed anything).
    if (description.length === 0 || description === lastAutoFilled) {
      setDescription(next);
      setLastAutoFilled(next);
    }
    // Intentionally omit `description` + `lastAutoFilled` from deps —
    // they're read inside the effect but should NOT retrigger it. The
    // effect should only fire on actual source changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceMode, selectedFile, selectedClipPath, clips]);

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

  function addFiles(files: File[]) {
    if (files.length === 0) return;
    const items: UploadItem[] = files.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      progress: 0,
      status: "uploading",
    }));
    setUploads((prev) => [...prev, ...items]);
    setSelectedUploadId((cur) => cur || items[0].id);
    for (const item of items) startBackgroundUpload(item);
  }

  function removeUpload(id: string) {
    setUploads((prev) => prev.filter((u) => u.id !== id));
    setSelectedUploadId((cur) => {
      if (cur !== id) return cur;
      const next = uploads.find((u) => u.id !== id && u.status === "ready");
      return next?.id || null;
    });
  }

  async function startBackgroundUpload(item: UploadItem) {
    try {
      const path = await uploadFileDirect(item.file, (pct) => {
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, progress: pct } : u))
        );
      });
      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id
            ? { ...u, status: "ready", videoPath: path, progress: 100 }
            : u
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id ? { ...u, status: "error", error: message } : u
        )
      );
    }
  }

  async function uploadFileDirect(
    f: File,
    onProgress: (pct: number) => void
  ): Promise<string> {
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

      const body = await sendChunk(url, chunk, (chunkLoaded) => {
        const done = i * CHUNK_SIZE + chunkLoaded;
        onProgress(Math.min(100, Math.round((done / f.size) * 100)));
      });

      if (body.done && body.path) finalPath = body.path;
    }
    if (!finalPath) throw new Error("Upload finished without a final path");
    return finalPath;
  }

  async function handlePublish() {
    if (sourceMode === "upload" && !selectedUpload) {
      setResult({ error: "Add a video to the upload queue first." });
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

    // Facebook and YouTube reject scheduled publishes less than 10 minutes
    // in the future. We enforce 15 minutes as a safer buffer.
    if (scheduleAt) {
      const fireAt = new Date(scheduleAt).getTime();
      const minAhead = 15 * 60 * 1000;
      if (fireAt - Date.now() < minAhead) {
        setResult({
          error:
            "Schedule must be at least 15 minutes in the future. Facebook and YouTube reject anything closer (Meta returns 'specified scheduled publish time is invalid').",
        });
        return;
      }
    }

    setPublishing(true);
    setResult(null);
    try {
      const scheduledAt = scheduleAt ? new Date(scheduleAt).toISOString() : undefined;

      let videoPath: string;
      if (sourceMode === "upload") {
        if (!selectedUpload || selectedUpload.status !== "ready" || !selectedUpload.videoPath) {
          throw new Error(
            "Selected upload isn't ready yet. Wait for the progress bar to hit 100%."
          );
        }
        videoPath = selectedUpload.videoPath;
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
          if (raw.productIds && raw.productIds.length > 0) options.productIds = raw.productIds;
          if (raw.groupIds && raw.groupIds.length > 0) options.groupIds = raw.groupIds;
        } else if (t.platform === "instagram") {
          const tagged = csv(raw.taggedInput).map((u) => u.replace(/^@/, ""));
          const collabs = csv(raw.collaboratorsInput).map((u) => u.replace(/^@/, ""));
          if (tagged.length > 0) options.taggedUsernames = tagged;
          if (collabs.length > 0) options.collaboratorUsernames = collabs;
          if (raw.locationId) options.locationId = raw.locationId;
          if (raw.productIds && raw.productIds.length > 0) options.productIds = raw.productIds;
        }
        return Object.keys(options).length > 0 ? { ...t, options } : t;
      });

      // ── Thumbnail: upload separately via multipart, then reference by path. ──
      // The dedicated /api/admin/publish/publish-thumbnail route uses
      // streaming proxy so the bytes never hit Vercel's 4.5 MB body cap.
      // What goes in the publish JSON is a short `thumbnailPath` string
      // instead of multi-hundred-KB of base64, keeping the publish payload
      // under 50 KB even with long descriptions + many targets.
      let thumbnailPath: string | undefined;
      if (thumbnailDataUrl) {
        try {
          // Convert the data URL into a Blob so it can be multipart-uploaded.
          const blob = await (await fetch(thumbnailDataUrl)).blob();
          const fd = new FormData();
          // Field name "thumbnail" must match upload.single('thumbnail') on the backend.
          fd.append("thumbnail", blob, "thumbnail.jpg");
          const upRes = await fetch("/api/admin/publish/publish-thumbnail", {
            method: "POST",
            body: fd,
          });
          if (!upRes.ok) {
            const txt = await upRes.text().catch(() => "");
            throw new Error(`Thumbnail upload failed (${upRes.status}): ${txt.slice(0, 200)}`);
          }
          const upJson = await upRes.json();
          thumbnailPath = upJson.thumbnailPath;
          if (!thumbnailPath) {
            throw new Error("Thumbnail upload returned no path");
          }
          console.log(`[publish] thumbnail uploaded → ${thumbnailPath} (${Math.round(blob.size / 1024)} KB)`);
        } catch (err) {
          throw new Error(
            "Thumbnail upload failed: " +
              (err instanceof Error ? err.message : String(err)) +
              ". Try re-picking the thumbnail or skip it."
          );
        }
      }

      const bodyJson = JSON.stringify({
        videoPath,
        title: title.trim(),
        description,
        targets: targetsWithOptions,
        scheduledAt,
        // thumbnailPath replaces thumbnailDataUrl — orders of magnitude smaller.
        thumbnailPath,
      });
      const bodyKB = Math.round(bodyJson.length / 1024);
      console.log(`[publish] body=${bodyKB}KB thumbPath=${thumbnailPath ?? "none"}`);

      const r = await fetch("/api/admin/publish/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyJson,
      });
      // The publish proxy sometimes returns a non-JSON HTML error (e.g. Vercel 413
      // when the request body is too large). Catch that cleanly.
      let d: PublishResponse;
      try {
        d = await r.json();
      } catch {
        if (r.status === 413) {
          throw new Error(
            "Publish payload too large (Vercel 4.5 MB body cap). Likely cause: thumbnail. Try Capture from video (auto-compresses) or use a smaller uploaded image."
          );
        }
        throw new Error(`Publish failed with HTTP ${r.status} (non-JSON response)`);
      }
      if (!r.ok || d.error) {
        throw new Error(d.error || `Request failed (${r.status})`);
      }
      setResult(d);
      // Mark the published upload done and advance to the next ready one.
      if (sourceMode === "upload" && selectedUpload) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === selectedUpload.id ? { ...u, status: "published" as const } : u
          )
        );
        setSelectedUploadId((cur) => {
          if (cur !== selectedUpload.id) return cur;
          const next = uploads.find(
            (u) => u.id !== selectedUpload.id && u.status === "ready"
          );
          return next?.id || null;
        });
      }
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Publish failed" });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <AdminNav />
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
                    ? "bg-accent-500 text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {m === "upload" ? "Upload file" : "Pick from clips"}
              </button>
            ))}
          </div>

          {sourceMode === "upload" && (
            <UploadQueue
              uploads={uploads}
              selectedId={selectedUploadId}
              onAdd={(fs) => addFiles(fs)}
              onSelect={(id) => setSelectedUploadId(id)}
              onRemove={(id) => removeUpload(id)}
            />
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

          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <label className="block text-xs uppercase tracking-wide text-gray-500">
              Description
            </label>
            <div className="flex gap-1.5 items-center flex-wrap">
              <FilmerCreditPicker
                description={description}
                onChange={setDescription}
              />
              {DESCRIPTION_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setDescription(p.text)}
                  className="text-xs px-2.5 py-1 rounded border border-gray-700 text-gray-300 hover:border-accent-500 hover:text-white"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
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
            // ── Group every connected destination by brand, render as columns ──
            // Brand detection is name-pattern based (see brandFor() helper);
            // unmatched accounts land in "Other" so nothing disappears.
            (() => {
              type Row = { node: React.ReactNode; brand: BrandKey };
              const rows: Row[] = [];

              for (const c of connections.youtube) {
                const key = `youtube:${c.id}`;
                const checked = selectedTargets.some((t) => t.platform === "youtube" && t.id === c.id);
                rows.push({
                  brand: brandFor(c.name),
                  node: (
                    <div key={`yt-${c.id}`}>
                      <DestinationCheckbox
                        label={`YouTube · ${c.name}`}
                        checked={checked}
                        onChange={() => toggleTarget({ platform: "youtube", id: c.id })}
                      />
                      {checked && (
                        <YouTubeOptionsExpander
                          opts={targetOptions[key] || {}}
                          playlists={ytPlaylists[c.id] || null}
                          onChange={(patch) => setOptions(key, patch)}
                        />
                      )}
                    </div>
                  ),
                });
              }
              for (const c of connections.facebook) {
                const key = `facebook:${c.id}`;
                const checked = selectedTargets.some((t) => t.platform === "facebook" && t.id === c.id);
                rows.push({
                  brand: brandFor(c.name),
                  node: (
                    <div key={`fb-${c.id}`}>
                      <DestinationCheckbox
                        label={`Facebook · ${c.name}`}
                        checked={checked}
                        onChange={() => toggleTarget({ platform: "facebook", id: c.id })}
                      />
                      {checked && (
                        <FacebookOptionsExpander
                          opts={targetOptions[key] || {}}
                          onChange={(patch) => setOptions(key, patch)}
                          otherPages={connections.facebook.filter((p) => p.id !== c.id)}
                          connectionId={c.id}
                        />
                      )}
                    </div>
                  ),
                });
              }
              for (const c of connections.instagram) {
                const key = `instagram:${c.id}`;
                const checked = selectedTargets.some((t) => t.platform === "instagram" && t.id === c.id);
                rows.push({
                  brand: brandFor(c.username),
                  node: (
                    <div key={`ig-${c.id}`}>
                      <DestinationCheckbox
                        label={`Instagram · @${c.username}`}
                        checked={checked}
                        onChange={() => toggleTarget({ platform: "instagram", id: c.id })}
                      />
                      {checked && (
                        <InstagramOptionsExpander
                          opts={targetOptions[key] || {}}
                          onChange={(patch) => setOptions(key, patch)}
                          otherAccounts={connections.instagram.filter((a) => a.id !== c.id)}
                          connectionId={c.id}
                        />
                      )}
                    </div>
                  ),
                });
              }

              // Group by brand and only render non-empty columns (keeps the
              // grid tight when a brand has zero connected accounts).
              const grouped: Record<BrandKey, Row[]> = {
                playbook: [], drills: [], picklebrain: [], reviews: [], other: [],
              };
              for (const r of rows) grouped[r.brand].push(r);
              const activeBrands = BRAND_ORDER.filter((b) => grouped[b].length > 0);

              return (
                <div
                  className="grid gap-4 mb-4"
                  style={{
                    gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`,
                  }}
                >
                  {activeBrands.map((b) => (
                    <div key={b} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
                        {BRAND_LABEL[b]}{" "}
                        <span className="text-gray-600 font-medium">({grouped[b].length})</span>
                      </p>
                      <div className="space-y-1.5">
                        {grouped[b].map((r) => r.node)}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
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
            className="bg-accent-500 hover:bg-accent-400 disabled:bg-gray-700 disabled:text-gray-400 text-black font-bold px-6 py-3 rounded-xl"
          >
            {publishing
              ? "Publishing..."
              : scheduleAt
              ? "Schedule"
              : `Publish to ${selectedTargets.length || "..."} destination${
                  selectedTargets.length === 1 ? "" : "s"
                }`}
          </button>

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
                        ? "border-accent-500/30 bg-accent-500/5 text-accent-300"
                        : "border-red-500/30 bg-red-500/5 text-red-300"
                    }`}
                  >
                    <span className="font-medium">
                      <span className="capitalize">{r.platform}</span>
                      {r.accountName ? ` · ${r.accountName}` : ""}
                    </span>
                    <span
                      className="ml-3 break-all"
                      title={r.error || r.url || ""}
                    >
                      {r.scheduled
                        ? `⏱ Scheduled for ${r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : "later"}`
                        : ok
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
  // Collapsed by default — the publish page is busy and connections rarely
  // need editing. Click the row header to expand. Count shown inline so
  // you can see "YouTube (1)" at a glance without opening.
  const [open, setOpen] = useState(false);
  const childArray = Array.isArray(children) ? children.filter(Boolean) : (children ? [children] : []);
  const count = childArray.length;
  const hasAny = count > 0;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-800/60 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">{heading}</span>
          <span className="text-xs text-gray-500">
            {hasAny ? `(${count})` : "(0)"}
          </span>
        </span>
        <span className="text-xs text-gray-500" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className="divide-y divide-gray-800 border-t border-gray-800">
          {hasAny ? children : <p className="px-4 py-3 text-sm text-gray-500">{empty}</p>}
          <button
            onClick={onConnect}
            className="block w-full text-left px-4 py-2.5 text-sm text-accent-400 hover:bg-gray-800"
          >
            {connectLabel}
          </button>
        </div>
      )}
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
            className="accent-accent-500"
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
                  className="accent-accent-500"
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

function GroupsPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<FacebookGroup[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || groups !== null) return;
    setError("");
    fetch("/api/admin/publish/facebook/groups")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `Failed (${r.status})`);
        setGroups(d.groups || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load");
        setGroups([]);
      });
  }, [open, groups]);

  const filtered = (groups || []).filter((g) =>
    !search ? true : g.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else if (selected.length >= 9) {
      alert("Facebook caps cross-posts at 9 groups per Reel.");
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs px-2.5 py-1 rounded border border-gray-700 text-gray-300 hover:border-gray-500"
        >
          {open ? "Hide groups" : "+ Share to FB Groups"}
        </button>
        {selected.length > 0 && (
          <span className="text-xs text-accent-400">
            {selected.length}/9 selected
          </span>
        )}
      </div>
      {open && (
        <div className="mt-2 border border-gray-800 bg-gray-950 rounded-lg p-2 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          {groups === null && <p className="text-xs text-gray-500">Loading…</p>}
          {groups && filtered.length === 0 && (
            <p className="text-xs text-gray-500">
              {search ? "No matches." : "No groups found. (Requires user_managed_groups permission.)"}
            </p>
          )}
          {groups && filtered.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filtered.map((g) => {
                const on = selected.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggle(g.id)}
                    className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded border transition ${
                      on
                        ? "border-accent-500/40 bg-accent-500/5"
                        : "border-gray-800 bg-gray-900 hover:border-gray-700"
                    }`}
                  >
                    {g.picture?.data?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.picture.data.url}
                        alt=""
                        className="h-8 w-8 object-cover rounded shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white truncate">{g.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {g.privacy || ""}
                        {g.member_count ? ` · ${g.member_count.toLocaleString()} members` : ""}
                      </p>
                    </div>
                    <span className={`text-[10px] ${on ? "text-accent-400" : "text-gray-500"}`}>
                      {on ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || products !== null) return;
    setError("");
    fetch("/api/admin/publish/meta/products")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `Failed (${r.status})`);
        setProducts(d.products || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load");
        setProducts([]);
      });
  }, [open, products]);

  const filtered = (products || []).filter((p) =>
    !search
      ? true
      : (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.retailer_id || "").toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs px-2.5 py-1 rounded border border-gray-700 text-gray-300 hover:border-gray-500"
        >
          {open ? "Hide products" : "+ Add products from shop"}
        </button>
        {selected.length > 0 && (
          <span className="text-xs text-accent-400">
            {selected.length} product{selected.length === 1 ? "" : "s"} tagged
          </span>
        )}
      </div>

      {open && (
        <div className="mt-2 border border-gray-800 bg-gray-950 rounded-lg p-2 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or SKU…"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          {products === null && (
            <p className="text-xs text-gray-500">Loading…</p>
          )}
          {products && filtered.length === 0 && (
            <p className="text-xs text-gray-500">
              {search ? "No matches." : "No products in catalog."}
            </p>
          )}
          {products && filtered.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filtered.map((p) => {
                const on = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded border transition ${
                      on
                        ? "border-accent-500/40 bg-accent-500/5"
                        : "border-gray-800 bg-gray-900 hover:border-gray-700"
                    }`}
                  >
                    {p.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-8 w-8 object-cover rounded shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white truncate">
                        {p.name || p.retailer_id || p.id}
                      </p>
                      {p.price && (
                        <p className="text-[10px] text-gray-500">{p.price}</p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] ${
                        on ? "text-accent-400" : "text-gray-500"
                      }`}
                    >
                      {on ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
                ? "bg-accent-500/15 border-accent-500/50 text-accent-200"
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
  connectionId,
}: {
  opts: FacebookOptions;
  onChange: (patch: Partial<FacebookOptions>) => void;
  otherPages: FacebookAccount[];
  connectionId: string;
}) {
  const postAsReel = opts.postAsReel !== false;
  return (
    <div className="mt-2 ml-6 mb-2 rounded-lg border border-gray-800 bg-gray-950/60 p-3 space-y-3 text-sm">
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={postAsReel}
          onChange={(e) => onChange({ postAsReel: e.target.checked })}
          className="accent-accent-500 mt-0.5"
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
        <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
          Collaborators
        </span>
        <p className="text-[11px] text-yellow-500/80">
          Page-to-Page Reels collaboration isn&apos;t exposed in Meta&apos;s
          Graph API — the in-app collab feature is UI/Studio-only. (Verified:
          Reels published via API have no <code>collaborators</code> field set
          even when we pass it.) Use the FB Pages app to add a Page collab
          manually after posting.
        </p>
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

      <div>
        <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
          Tag products from your shop
        </span>
        <ProductPicker
          selected={opts.productIds || []}
          onChange={(next) => onChange({ productIds: next })}
        />
      </div>

      <div>
        <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
          Share the Reel to Facebook Groups (max 9)
        </span>
        <p className="text-[11px] text-yellow-500/80 mb-1.5">
          Pending Meta App Review for user_managed_groups + publish_to_groups.
          Selection is saved and will fan out once the permissions are granted.
        </p>
        <GroupsPicker
          selected={opts.groupIds || []}
          onChange={(next) => onChange({ groupIds: next })}
        />
      </div>
    </div>
  );
}

function InstagramOptionsExpander({
  opts,
  onChange,
  otherAccounts,
  connectionId,
}: {
  opts: InstagramOptions;
  onChange: (patch: Partial<InstagramOptions>) => void;
  otherAccounts: InstagramAccount[];
  connectionId: string;
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

      <div>
        <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
          Tag products from your shop
        </span>
        <p className="text-[11px] text-yellow-500/80 mb-1.5">
          Pending Meta App Review for instagram_shopping_tag_products. Selection
          is saved and will be applied once the permission is granted.
        </p>
        <ProductPicker
          selected={opts.productIds || []}
          onChange={(next) => onChange({ productIds: next })}
        />
      </div>
    </div>
  );
}

function FilmerCreditPicker({
  description,
  onChange,
}: {
  description: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const match = description.match(/🎥\s*@([\w.]+)\s*$/);
  const currentCredit = match ? match[1] : null;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const filtered = FILMER_HANDLES.filter((h) =>
    h.toLowerCase().includes(search.toLowerCase())
  );

  function apply(handle: string) {
    const stripped = description.replace(CREDIT_RE, "").trimEnd();
    const next = stripped + (stripped ? "\n\n" : "") + `🎥 @${handle}`;
    onChange(next);
    setSearch("");
    setOpen(false);
  }

  function clear() {
    onChange(description.replace(CREDIT_RE, "").trimEnd());
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`text-xs px-2.5 py-1 rounded border transition ${
            currentCredit
              ? "border-accent-500/40 text-accent-200 bg-accent-500/5"
              : "border-gray-700 text-gray-300 hover:border-accent-500 hover:text-white"
          }`}
        >
          🎥 {currentCredit ? `@${currentCredit}` : "Filmer credit"}
        </button>
        {currentCredit && (
          <button
            type="button"
            onClick={clear}
            className="text-xs text-gray-500 hover:text-red-400"
            title="Remove credit"
          >
            ×
          </button>
        )}
      </div>
      {open && (
        <div className="absolute right-0 mt-1 z-20 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-2">
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search filmer…"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none mb-1.5"
          />
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-500 px-2 py-1.5">No matches</p>
            ) : (
              filtered.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => apply(h)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-800 ${
                    h === currentCredit ? "text-accent-300" : "text-gray-300"
                  }`}
                >
                  @{h}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UploadQueue({
  uploads,
  selectedId,
  onAdd,
  onSelect,
  onRemove,
}: {
  uploads: UploadItem[];
  selectedId: string | null;
  onAdd: (files: File[]) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  return (
    <div className="mb-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const files = Array.from(e.dataTransfer.files).filter((f) =>
            f.type.startsWith("video/")
          );
          if (files.length > 0) onAdd(files);
        }}
        className={`border-2 border-dashed rounded-lg p-4 mb-2 transition ${
          isDragOver
            ? "border-accent-500 bg-accent-500/5"
            : "border-gray-700 hover:border-gray-500"
        }`}
      >
        <input
          type="file"
          accept="video/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) onAdd(files);
            e.target.value = ""; // allow re-adding the same file
          }}
          className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700"
        />
        <p className="text-xs text-gray-500 mt-1.5">
          Drag &amp; drop multiple videos here — they upload in parallel.
        </p>
      </div>

      {uploads.length === 0 ? null : (
        <ul className="space-y-1.5">
          {uploads.map((u) => {
            const selected = u.id === selectedId;
            const sizeMb = (u.file.size / 1024 / 1024).toFixed(1);
            return (
              <li
                key={u.id}
                onClick={() => u.status === "ready" && onSelect(u.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  selected
                    ? "border-accent-500/40 bg-accent-500/5"
                    : "border-gray-800 bg-gray-800"
                } ${u.status === "ready" ? "cursor-pointer hover:border-gray-600" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate">
                    {selected && <span className="text-accent-400 mr-1">●</span>}
                    {u.file.name}{" "}
                    <span className="text-gray-500 text-xs">· {sizeMb} MB</span>
                  </p>
                  {u.status === "uploading" && (
                    <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500 transition-all"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                  )}
                  {u.status === "error" && (
                    <p className="text-xs text-red-400 mt-0.5 truncate">
                      {u.error}
                    </p>
                  )}
                </div>
                <span className="text-xs whitespace-nowrap">
                  {u.status === "uploading" && (
                    <span className="text-gray-400">{u.progress}%</span>
                  )}
                  {u.status === "ready" && (
                    <span className="text-accent-400">Ready</span>
                  )}
                  {u.status === "error" && (
                    <span className="text-red-400">Error</span>
                  )}
                  {u.status === "published" && (
                    <span className="text-gray-500">✓ Published</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(u.id);
                  }}
                  className="text-gray-500 hover:text-red-400 text-lg leading-none"
                  title="Remove"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
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
    // Compress through a canvas instead of accepting raw bytes: scales to
    // 960px longest dim and JPEG-encodes with a quality loop targeting
    // <700KB. Stays well under Vercel's 4.5 MB body cap regardless of
    // what the user uploads (4K phone screenshots, etc.).
    try {
      const url = await compressImageToDataUrl(file);
      onChange(url);
    } catch (err) {
      alert(
        "Could not process this image. Try a different file. " +
          (err instanceof Error ? `(${err.message})` : "")
      );
    }
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
    // Cap the canvas at 960px on the longest dimension and let the size loop
    // below bring the JPEG under ~700KB. Vercel rejects requests >4.5 MB and
    // base64 inflates payloads by ~34%, so we aim well below that.
    const maxDim = 960;
    const scale = Math.min(
      1,
      maxDim / Math.max(video.videoWidth, video.videoHeight)
    );
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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

    // Try decreasing JPEG quality until the data URL is small enough.
    // Target: <700KB to stay well under Vercel's 4.5 MB body cap with
    // headroom for the rest of the request.
    const MAX_BYTES = 700 * 1024;
    let quality = 0.82;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > MAX_BYTES && quality > 0.35) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    return dataUrl;
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
                ? "bg-accent-500 text-black"
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
                className="accent-accent-500"
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
                  className="bg-accent-500 hover:bg-accent-400 text-black text-xs font-semibold px-3 py-1.5 rounded"
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
            <div className="text-xs text-accent-400">
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
          ? "border-accent-500/40 bg-accent-500/5"
          : "border-gray-800 bg-gray-800 hover:border-gray-700"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-accent-500"
      />
      <span className="text-white">{label}</span>
    </label>
  );
}
