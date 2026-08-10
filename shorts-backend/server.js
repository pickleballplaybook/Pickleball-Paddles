import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import {
  getYouTubeAuthUrl, exchangeYouTubeCode, uploadToYouTube, getYouTubeChannel,
  listYouTubePlaylists,
  getMetaAuthUrl, exchangeMetaCode, getLongLivedToken,
  getPages, getInstagramAccount, getInstagramUsername,
  uploadToInstagram, uploadToFacebook, uploadToFacebookReel,
  listMetaCatalogProducts,
  listFacebookGroups, shareToFacebookGroup,
  getFacebookVideoMeta, getFacebookPostMeta, listFacebookPagePosts,
  getTikTokPkce, getTikTokAuthUrl, exchangeTikTokCode, getTikTokUserInfo, publishToTikTok,
} from './social.js';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import archiver from 'archiver';
import multer from 'multer';
import crypto from 'crypto';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Safety net: a stray fs.createReadStream() against a missing file emits an
// 'error' event on the stream — and if nothing listens for it, Node escalates
// to an uncaughtException that kills the process. That cascade is what caused
// the 502 outage: an /api/publish call referenced a file in /tmp that had been
// wiped by a container restart, the platform-SDK's internal ReadStream crashed
// the whole server, and Vercel saw "Backend unreachable" for every request
// until Railway rebooted us. Swallow ENOENT specifically; preserve fatal-crash
// behavior for everything else.
process.on('uncaughtException', (err) => {
  if (err && err.code === 'ENOENT') {
    console.error('[uncaught ENOENT, kept alive]', err.path || err.message);
    return;
  }
  console.error('[uncaughtException]', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

const app = express();
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
app.use(cors(ALLOWED_ORIGIN ? { origin: ALLOWED_ORIGIN.split(',').map(s => s.trim()) } : {}));
app.use(express.json()); app.use(express.urlencoded({ extended: true }));

const SHORTS_BACKEND_TOKEN = process.env.SHORTS_BACKEND_TOKEN;
if (SHORTS_BACKEND_TOKEN) {
  app.use((req, res, next) => {
    // Allow CORS preflight through
    if (req.method === 'OPTIONS') return next();
    // Direct uploads from browser self-authenticate via signed token in query string.
    if (req.path.startsWith('/api/file-upload/')) return next();
    // Uploaded videos must be publicly fetchable so Instagram/Meta can ingest them.
    // The path includes a UUID upload id which acts as an unguessable token.
    if (req.path.startsWith('/uploads/')) return next();
    // Same for scheduled-IG media — Meta fetches the video URL at fire time.
    if (req.path.startsWith('/scheduled/')) return next();
    const header = req.headers.authorization || '';
    const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (provided !== SHORTS_BACKEND_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });
  console.log('Token auth enabled');
} else {
  console.warn('SHORTS_BACKEND_TOKEN not set — backend is unauthenticated (dev mode)');
}

function signUploadToken(uploadId, exp) {
  const secret = SHORTS_BACKEND_TOKEN || 'dev-secret';
  return crypto.createHmac('sha256', secret).update(`${uploadId}|${exp}`).digest('hex');
}
const usedUploadTokens = new Set();

const JOBS_DIR = process.env.JOBS_DIR || path.join(__dirname, 'jobs');
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, 'output');
// Declared here (not next to the multer/express upload routes further down)
// because diskCleanup() runs at startup and references UPLOADS_DIR. Keeping
// these in the order [declare → mkdir → diskCleanup → routes] avoids a TDZ
// ReferenceError when the cleanup function runs.
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/tmp/shorts-uploads';
const YTDLP_BIN = process.env.YTDLP_BIN || 'yt-dlp';
fs.mkdirSync(JOBS_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Materialize YouTube cookies from env if provided. Datacenter IPs (Railway) get
// blocked by YouTube's bot check; a cookies.txt from a real browser session bypasses it.
// Written to /tmp (ephemeral container disk) rather than the persistent volume
// because the file is regenerated from YT_COOKIES_BASE64 on every startup, and
// stashing it on the volume just adds pressure to the same disk that holds
// uploaded videos + processed clips (1 GB total). Saw ENOSPC trying to write
// even a 16 KB cookies file when the volume was at capacity.
const COOKIES_PATH = '/tmp/cookies.txt';
function loadCookies() {
  const raw = process.env.YT_COOKIES_BASE64;
  if (!raw) return null;
  try {
    const buf = Buffer.from(raw, 'base64');
    // Try gzip first (preferred — lets us ship ~2x as many cookies under
    // Railway's 32 KB env var cap). Fall back to plain base64 for backward
    // compat with the older deploy flow.
    let decoded;
    try {
      decoded = zlib.gunzipSync(buf).toString('utf-8');
    } catch {
      decoded = buf.toString('utf-8');
    }
    fs.writeFileSync(COOKIES_PATH, decoded);
    fs.chmodSync(COOKIES_PATH, 0o600);
    console.log(`Wrote cookies.txt (${decoded.length} bytes) for yt-dlp`);
    return COOKIES_PATH;
  } catch (err) {
    console.error('Failed to decode YT_COOKIES_BASE64:', err.message);
    return null;
  }
}
const YT_COOKIES_FILE = loadCookies();

// Serve output clips as static files
app.use('/clips', express.static(OUTPUT_DIR));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Wrap anthropic.messages.create with retries on transient failures. The SDK
// retries connection errors by default but NOT 5xx — and we lost a whole job
// to a single `api_error: Internal server error` mid-pipeline. Retries on
// 429 (rate limit) and 5xx with exponential backoff: 1s, 2s, 4s.
async function callClaudeWithRetry(opts, { retries = 3, baseDelayMs = 1000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await anthropic.messages.create(opts);
    } catch (err) {
      lastErr = err;
      const status = err?.status ?? err?.response?.status;
      const transient = status === 429 || (status >= 500 && status < 600);
      if (!transient || attempt === retries - 1) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[claude] transient ${status} (${err.message}); retry ${attempt + 1}/${retries - 1} in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Job status store (in-memory mirror; canonical state lives in output/<jobId>/meta.json)
const jobs = {};

// jobIds whose video.mp4 is currently being read by ffmpeg/whisper. diskCleanup
// must skip these — otherwise the 15-min interval (or a concurrent /api/process
// pre-job cleanup) wipes the source mid-cut and ffmpeg errors with "No such
// file or directory" partway through the clip loop.
const activeJobIds = new Set();

function metaPath(jobId) {
  return path.join(OUTPUT_DIR, jobId, 'meta.json');
}

function persistJob(jobId) {
  const job = jobs[jobId];
  if (!job) return;
  const dir = path.join(OUTPUT_DIR, jobId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(metaPath(jobId), JSON.stringify(job, null, 2));
}

function setJobStatus(jobId, update) {
  jobs[jobId] = { ...jobs[jobId], ...update };
  console.log(`[${jobId}] ${update.status || ''} ${update.message || ''}`);
  try {
    persistJob(jobId);
  } catch (err) {
    console.error(`[${jobId}] failed to persist meta:`, err.message);
  }
}

function recoverJobFromClips(jobId, dir) {
  const clipFiles = fs
    .readdirSync(dir)
    .filter(f => /^clip_\d+\.mp4$/i.test(f))
    .sort();
  if (clipFiles.length === 0) return null;
  const stat = fs.statSync(dir);
  return {
    jobId,
    youtubeUrl: '(recovered — created before history was added)',
    createdAt: stat.mtime.toISOString(),
    status: 'done',
    message: `Recovered ${clipFiles.length} clips`,
    progress: 100,
    clips: clipFiles.map((filename, i) => ({
      filename,
      url: `/clips/${jobId}/${filename}`,
      title: `Clip ${i + 1}`,
      reason: '',
      start: 0,
      end: 0,
      duration: 0,
    })),
  };
}

function loadJobsFromDisk() {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  for (const entry of fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(OUTPUT_DIR, entry.name);
    const file = path.join(dir, 'meta.json');
    try {
      if (fs.existsSync(file)) {
        const meta = JSON.parse(fs.readFileSync(file, 'utf-8'));
        // Anything that was mid-flight when the server died is now stale.
        if (meta.status && meta.status !== 'done' && meta.status !== 'error') {
          meta.status = 'error';
          meta.message = 'Interrupted (server restarted)';
        }
        jobs[entry.name] = meta;
      } else {
        const recovered = recoverJobFromClips(entry.name, dir);
        if (recovered) {
          jobs[entry.name] = recovered;
          fs.writeFileSync(file, JSON.stringify(recovered, null, 2));
          console.log(`Recovered job ${entry.name} (${recovered.clips.length} clips)`);
        }
      }
    } catch (err) {
      console.error(`Failed to load job ${entry.name}:`, err.message);
    }
  }
  console.log(`Loaded ${Object.keys(jobs).length} job(s) from disk`);
}

loadJobsFromDisk();

// ─── DISK CLEANUP ────────────────────────────────────────────────────────────
// Without this, /data fills up (raw downloads + finished clips accumulate
// indefinitely on the persistent volume) and yt-dlp fails with ENOSPC.
function dirSize(p) {
  let total = 0;
  try {
    for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
      const full = path.join(p, entry.name);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) total += dirSize(full);
        else total += stat.size;
      } catch {}
    }
  } catch {}
  return total;
}

// Keep only the N most recent finished jobs on disk — bounded storage,
// independent of how actively clips are being generated. History tab will
// only show what's still on disk.
// Default lowered 15 → 3 because the Railway volume is 1GB and each job's
// downloaded source + clips can be 100–300MB. Keeping 15 quickly filled the
// disk and broke encodes with "No space left on device". Override via
// CLEANUP_KEEP_JOBS env var if the volume gets bumped up.
const CLEANUP_KEEP_JOBS = Number(process.env.CLEANUP_KEEP_JOBS || 2);
// Max age before an UPLOADS_DIR/<uuid> dir is considered abandoned and wiped.
// Anything past this is either an orphan from a publish that never happened
// or a partial chunk run that errored — both are safe to drop.
const UPLOAD_TTL_MS = Number(process.env.UPLOAD_TTL_MS || 24 * 60 * 60 * 1000);

function diskCleanup({ wipeUploads = false } = {}) {
  let freed = 0;
  let removed = 0;

  // JOBS_DIR holds the raw downloaded video for an in-flight job — wiped at
  // the end of processVideo. Anything still here that ISN'T in activeJobIds
  // is an orphan from a crashed/interrupted run, so wipe it. Skipping active
  // jobs is critical: the 15-min interval used to nuke video.mp4 mid-cut and
  // ffmpeg errored "No such file or directory" partway through clip cutting.
  if (fs.existsSync(JOBS_DIR)) {
    for (const entry of fs.readdirSync(JOBS_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (activeJobIds.has(entry.name)) continue;
      const dir = path.join(JOBS_DIR, entry.name);
      try {
        freed += dirSize(dir);
        fs.rmSync(dir, { recursive: true, force: true });
        removed++;
      } catch (err) {
        console.error(`[cleanup] failed to remove ${dir}:`, err.message);
      }
    }
  }

  // OUTPUT_DIR: keep only the most recent N job dirs, drop the rest.
  // Skip files (connections.json, scheduled-queue.json) and the scheduled/ dir.
  if (fs.existsSync(OUTPUT_DIR)) {
    const jobDirs = [];
    for (const entry of fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'scheduled') continue;
      const dir = path.join(OUTPUT_DIR, entry.name);
      try {
        const stat = fs.statSync(dir);
        jobDirs.push({ name: entry.name, dir, mtime: stat.mtimeMs });
      } catch {}
    }
    jobDirs.sort((a, b) => b.mtime - a.mtime); // newest first
    for (const j of jobDirs.slice(CLEANUP_KEEP_JOBS)) {
      // Don't wipe an output dir whose clips are still being written.
      if (activeJobIds.has(j.name)) continue;
      try {
        freed += dirSize(j.dir);
        fs.rmSync(j.dir, { recursive: true, force: true });
        delete jobs[j.name];
        removed++;
      } catch (err) {
        console.error(`[cleanup] failed to remove ${j.dir}:`, err.message);
      }
    }
  }

  // UPLOADS_DIR: drop any per-upload subdirectory older than UPLOAD_TTL_MS.
  // The publish handler only cleans uploads that were actually published, so
  // without this pass orphan files (failed publishes, never-published queues,
  // partial chunk runs that errored) accumulate forever and eventually fill
  // the Railway volume — surfacing as ENOSPC on the next chunk write.
  // On startup we wipe everything: chunk state lives in browser memory so a
  // server restart already invalidates any in-flight upload, and this is the
  // only way to clear orphans that are younger than the TTL after a restart.
  if (fs.existsSync(UPLOADS_DIR)) {
    const cutoff = Date.now() - UPLOAD_TTL_MS;
    for (const entry of fs.readdirSync(UPLOADS_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(UPLOADS_DIR, entry.name);
      try {
        if (!wipeUploads) {
          const stat = fs.statSync(dir);
          if (stat.mtimeMs > cutoff) continue;
        }
        freed += dirSize(dir);
        fs.rmSync(dir, { recursive: true, force: true });
        removed++;
      } catch (err) {
        console.error(`[cleanup] failed to remove ${dir}:`, err.message);
      }
    }
  }

  console.log(`[cleanup] freed ${(freed / 1024 / 1024).toFixed(1)} MB across ${removed} dir(s) (keep ${CLEANUP_KEEP_JOBS} most recent, uploads TTL ${(UPLOAD_TTL_MS / 1000 / 60 / 60).toFixed(0)}h)`);
}

diskCleanup({ wipeUploads: true });
setInterval(() => diskCleanup(), 15 * 60 * 1000); // every 15 min

// ─── DRAWTEXT FONT ───────────────────────────────────────────────────────────
// ffmpeg's drawtext filter (for clip text overlays) needs a TTF/OTF path.
// Resolve once at startup via fontconfig; falls back gracefully if missing.
let DRAWTEXT_FONT = '';
try {
  const out = execSync('fc-match -f "%{file}" "DejaVu Sans:style=Bold"', { encoding: 'utf-8' }).trim();
  if (out && fs.existsSync(out)) {
    DRAWTEXT_FONT = out;
    console.log(`[font] using ${DRAWTEXT_FONT} for drawtext overlays`);
  } else {
    console.warn(`[font] fc-match returned "${out}" but file does not exist`);
  }
} catch (err) {
  console.warn('[font] fc-match unavailable; text overlays disabled:', err.message);
}

// Escape user-supplied text so ffmpeg's drawtext filter parses it correctly.
// drawtext is colon-separated, single-quoted strings, with % expansions.
function escapeDrawText(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\\\'")
    .replace(/%/g, '\\%');
}

function normalizeOverlayOptions(raw = {}) {
  return { topTitle: raw.topTitle === true };
}

// Brand-styled drawtext: red filled box with a white outline and white text.
// ffmpeg's drawtext can only draw a SOLID box, so the outline is faked with
// two stacked drawtexts at the same position: an outer white box (larger
// padding) and an inner red box on top. The padding difference is the
// visible white border width.
const BRAND_BOX_RED = '#DC2626';
const BRAND_BOX_OUTER_PAD = 28;
const BRAND_BOX_INNER_PAD = 22; // → 6 px white outline
function brandDrawText({ text, fontSize, x, y, enable }) {
  if (!DRAWTEXT_FONT) return [];
  const escaped = escapeDrawText(text);
  const common =
    `fontfile='${DRAWTEXT_FONT}':text='${escaped}':fontsize=${fontSize}:fontcolor=white:` +
    `x=${x}:y=${y}`;
  const enableSuffix = enable ? `:enable='${enable}'` : '';
  return [
    `drawtext=${common}:box=1:boxcolor=white:boxborderw=${BRAND_BOX_OUTER_PAD}${enableSuffix}`,
    `drawtext=${common}:box=1:boxcolor=${BRAND_BOX_RED}:boxborderw=${BRAND_BOX_INNER_PAD}${enableSuffix}`,
  ];
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

app.post('/api/process', async (req, res) => {
  const { youtubeUrl, topTitle } = req.body;
  if (!youtubeUrl) return res.status(400).json({ error: 'youtubeUrl is required' });
  const overlayOpts = normalizeOverlayOptions({ topTitle });

  // Free disk BEFORE we start a new ~300 MB yt-dlp download. The hourly
  // interval can't catch up fast enough on the 1 GB volume, so without
  // this every other submit was ENOSPC'ing.
  try {
    diskCleanup();
  } catch (err) {
    console.error('[cleanup] pre-job cleanup failed (continuing):', err.message);
  }

  const jobId = uuidv4();
  const jobDir = path.join(JOBS_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, jobId), { recursive: true });

  jobs[jobId] = {
    jobId,
    youtubeUrl,
    createdAt: new Date().toISOString(),
    status: 'queued',
    message: 'Starting…',
    clips: [],
    overlayOpts,
  };
  persistJob(jobId);
  res.json({ jobId });

  // Run async — don't await
  activeJobIds.add(jobId);
  processVideo(jobId, jobDir, youtubeUrl, overlayOpts)
    .catch(err => {
      setJobStatus(jobId, { status: 'error', message: err.message });
    })
    .finally(() => activeJobIds.delete(jobId));
});

// Sibling of /api/process for the laptop-driven yt-dlp flow. The caller (the
// local-ytdlp CLI) has already pushed the video file through the existing
// chunked-upload pipeline (/api/upload-reserve + /api/file-upload/<id>/chunk)
// and now hands us the resulting path so we can skip the download stage
// entirely and run the same analyze + cut + clip pipeline.
//
// videoPath must resolve to a file under UPLOADS_DIR — anything else is
// rejected so a misbehaving client can't read arbitrary disk.
app.post('/api/process-local', express.json(), async (req, res) => {
  const { videoPath, sourceUrl, topTitle } = req.body || {};
  if (typeof videoPath !== 'string' || !videoPath) {
    return res.status(400).json({ error: 'videoPath is required' });
  }
  const overlayOpts = normalizeOverlayOptions({ topTitle });

  const abs = path.resolve(videoPath);
  const root = path.resolve(UPLOADS_DIR);
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    return res.status(400).json({ error: 'videoPath must live under UPLOADS_DIR' });
  }
  if (!fs.existsSync(abs)) {
    return res.status(404).json({ error: 'videoPath does not exist' });
  }

  try { diskCleanup(); } catch (err) {
    console.error('[cleanup] pre-job cleanup failed (continuing):', err.message);
  }

  const jobId = uuidv4();
  // jobDir is created so analyzeAndCutVideo can write intermediate audio /
  // transcript files into it, and so the existing rmSync(jobDir) at the
  // end of the pipeline has a place to clean up.
  const jobDir = path.join(JOBS_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, jobId), { recursive: true });

  jobs[jobId] = {
    jobId,
    youtubeUrl: typeof sourceUrl === 'string' ? sourceUrl : '',
    createdAt: new Date().toISOString(),
    status: 'queued',
    message: 'Starting (local ingest)…',
    clips: [],
    overlayOpts,
  };
  persistJob(jobId);
  res.json({ jobId });

  activeJobIds.add(jobId);
  analyzeAndCutVideo(jobId, jobDir, abs, overlayOpts)
    .catch(err => setJobStatus(jobId, { status: 'error', message: err.message }))
    .finally(() => {
      activeJobIds.delete(jobId);
      // Remove the uploaded source's per-upload dir so a successful run
      // doesn't leak the 100–300 MB file under /tmp/shorts-uploads. The
      // 24 h UPLOAD_TTL_MS sweep would eventually catch it, but cleaning
      // immediately keeps headroom on the container disk.
      try {
        const parent = path.dirname(abs);
        if (parent !== UPLOADS_DIR && parent.startsWith(root + path.sep)) {
          fs.rmSync(parent, { recursive: true, force: true });
        }
      } catch (cleanupErr) {
        console.error('[process-local] upload cleanup failed:', cleanupErr.message);
      }
    });
});

app.get('/api/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.get('/api/jobs', (_req, res) => {
  const list = Object.values(jobs)
    .map(j => ({
      jobId: j.jobId,
      youtubeUrl: j.youtubeUrl,
      createdAt: j.createdAt,
      status: j.status,
      message: j.message,
      progress: j.progress,
      clipCount: Array.isArray(j.clips) ? j.clips.length : 0,
      sourceResolution: j.sourceResolution || null,
    }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ jobs: list });
});

app.delete('/api/jobs/:jobId', (req, res) => {
  const { jobId } = req.params;
  if (!jobs[jobId]) return res.status(404).json({ error: 'Job not found' });
  const clipDir = path.join(OUTPUT_DIR, jobId);
  const tmpDir = path.join(JOBS_DIR, jobId);
  try {
    fs.rmSync(clipDir, { recursive: true, force: true });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (err) {
    console.error(`[${jobId}] delete failed:`, err.message);
    return res.status(500).json({ error: err.message });
  }
  delete jobs[jobId];
  res.json({ ok: true });
});

app.get('/api/zip/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs[jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'done' || !job.clips || job.clips.length === 0) {
    return res.status(409).json({ error: 'Job not finished or has no clips' });
  }

  const clipDir = path.join(OUTPUT_DIR, jobId);
  if (!fs.existsSync(clipDir)) {
    return res.status(404).json({ error: 'Clips directory missing' });
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="shorts-${jobId.slice(0, 8)}.zip"`);

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', err => {
    console.error(`[${jobId}] zip error:`, err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.destroy(err);
  });
  archive.pipe(res);

  for (const clip of job.clips) {
    const filePath = path.join(clipDir, clip.filename);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: clip.filename });
    }
  }

  const manifest = job.clips
    .map((c, i) => `${i + 1}. ${c.filename}\n   Title:  ${c.title}\n   Reason: ${c.reason}\n   Length: ${c.duration}s (source ${c.start}s–${c.end}s)\n`)
    .join('\n');
  archive.append(manifest, { name: 'clips.txt' });

  archive.finalize();
});

// ─── CLIP EDIT (trim + text overlays) ────────────────────────────────────────
// First edit snapshots the clip file as `<base>_orig.mp4`. Subsequent edits
// re-render from that original so trims and text don't compound. Reset
// restores from the snapshot.
app.post('/api/clips/:jobId/:filename/edit', async (req, res) => {
  const { jobId, filename } = req.params;
  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const job = jobs[jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const clip = (job.clips || []).find(c => c.filename === filename);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });

  const { trim, texts } = req.body || {};
  const clipDir = path.join(OUTPUT_DIR, jobId);
  const editedPath = path.join(clipDir, filename);
  const origPath = path.join(clipDir, filename.replace(/\.mp4$/i, '_orig.mp4'));

  if (!fs.existsSync(editedPath) && !fs.existsSync(origPath)) {
    return res.status(404).json({ error: 'Clip file missing on disk' });
  }
  if (!fs.existsSync(origPath)) {
    try { fs.copyFileSync(editedPath, origPath); }
    catch (err) { return res.status(500).json({ error: `Snapshot failed: ${err.message}` }); }
  }

  const filters = [];
  if (Array.isArray(texts) && texts.length > 0) {
    if (!DRAWTEXT_FONT) {
      return res.status(500).json({ error: 'Server is missing a font for text overlays' });
    }
    for (const t of texts) {
      if (!t || !t.text) continue;
      const xPct = Math.max(0, Math.min(100, Number(t.xPct) || 50)) / 100;
      const yPct = Math.max(0, Math.min(100, Number(t.yPct) || 80)) / 100;
      const fontSize = Math.max(12, Math.min(200, Number(t.fontSize) || 64));
      const start = Math.max(0, Number(t.start) || 0);
      const end = Math.max(start + 0.1, Number(t.end) || (start + 3));
      // Position the text CENTER at (xPct, yPct) of the video. Matches the
      // CSS `left: xPct%; top: yPct%; transform: translate(-50%,-50%)` we use
      // in the editor preview, so what the user drags is what they get.
      filters.push(
        ...brandDrawText({
          text: t.text,
          fontSize,
          x: `(w*${xPct}-text_w/2)`,
          y: `(h*${yPct}-text_h/2)`,
          enable: `between(t,${start},${end})`,
        })
      );
    }
  }
  const vfArg = filters.length > 0 ? `-vf "${filters.join(',')}"` : '';

  let ssArg = '';
  let tArg = '';
  if (trim && typeof trim.start === 'number' && typeof trim.end === 'number' && trim.end > trim.start) {
    ssArg = `-ss ${trim.start}`;
    tArg = `-t ${trim.end - trim.start}`;
  }

  const tmpOut = path.join(clipDir, `__edit_${Date.now()}_${filename}`);
  const cmd =
    `ffmpeg ${ssArg} -i "${origPath}" ${tArg} ${vfArg} ` +
    `-c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k "${tmpOut}" -y`;
  try {
    await execAsync(cmd, { maxBuffer: 1024 * 1024 * 200 });
  } catch (err) {
    try { fs.rmSync(tmpOut, { force: true }); } catch {}
    return res.status(500).json({ error: err.message.slice(0, 500) });
  }
  try { fs.renameSync(tmpOut, editedPath); }
  catch (err) { return res.status(500).json({ error: `Swap failed: ${err.message}` }); }

  clip.edit = {
    trim: (trim && trim.end > trim.start) ? { start: trim.start, end: trim.end } : null,
    texts: Array.isArray(texts) ? texts : [],
    version: ((clip.edit && clip.edit.version) || 0) + 1,
  };
  // Do NOT mutate clip.duration — it must remain the original source length so
  // the editor can re-trim against the full _orig.mp4. Effective length is
  // derived from clip.edit.trim in the UI.
  persistJob(jobId);
  res.json({ ok: true, clip });
});

app.delete('/api/clips/:jobId/:filename/edit', (req, res) => {
  const { jobId, filename } = req.params;
  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const job = jobs[jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const clip = (job.clips || []).find(c => c.filename === filename);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });

  const clipDir = path.join(OUTPUT_DIR, jobId);
  const editedPath = path.join(clipDir, filename);
  const origPath = path.join(clipDir, filename.replace(/\.mp4$/i, '_orig.mp4'));
  if (fs.existsSync(origPath)) {
    try { fs.copyFileSync(origPath, editedPath); }
    catch (err) { return res.status(500).json({ error: err.message }); }
  }
  clip.edit = { trim: null, texts: [], version: ((clip.edit && clip.edit.version) || 0) + 1 };
  persistJob(jobId);
  res.json({ ok: true, clip });
});

// ─── PIPELINE ────────────────────────────────────────────────────────────────

// Wipe everything in a job's working dir and re-create it. Used between
// yt-dlp attempts so leftover .part / .fXXX intermediate streams don't
// pile up and fill the volume.
function cleanJobDir(jobDir) {
  try { fs.rmSync(jobDir, { recursive: true, force: true }); } catch {}
  try { fs.mkdirSync(jobDir, { recursive: true }); } catch {}
}

async function processVideo(jobId, jobDir, youtubeUrl, overlayOpts) {

  // Make sure the volume has space before pulling a potentially-large video.
  try { diskCleanup(); } catch (err) { console.error('[cleanup] pre-job sweep failed:', err.message); }
  // Also clear this job's own dir of any stale state from prior runs.
  cleanJobDir(jobDir);

  // 1. Download video with yt-dlp
  setJobStatus(jobId, { status: 'downloading', message: 'Downloading video…', progress: 5 });
  const videoPath = path.join(jobDir, 'video.mp4');
  const cookiesArg = YT_COOKIES_FILE ? `--cookies "${YT_COOKIES_FILE}" ` : '';
  // Optional proxy for every yt-dlp call. Set YT_PROXY on Railway when
  // YouTube starts rejecting Railway's egress IP with bot-check errors
  // (recurring problem on datacenter IPs). Accepts any yt-dlp proxy form:
  //   http://user:pass@host:port      socks5://user:pass@host:port
  // When unset, yt-dlp connects directly (default behavior).
  const proxyArg = process.env.YT_PROXY ? `--proxy "${process.env.YT_PROXY}" ` : '';
  // YouTube's SABR-only experiment is breaking the bestvideo+bestaudio merge
  // path on some accounts (separate streams missing URLs, ffmpeg fails to
  // merge). Each attempt below picks (client, format) combos that prefer
  // pre-muxed formats so we don't need to merge at all.
  // - `ios` + format 18 (360p muxed) is the most reliable on datacenter IPs
  // - `android` is a fallback that also often serves muxed
  // - `tv,web_safari` with merge is the last resort for HD when SABR isn't on
  // Try HD merge (1080p source) FIRST across multiple clients — gives sharp
  // 1080x1080 foreground squares with no upscaling. If all HD attempts fail
  // (e.g. SABR-only experiment is on for this account, breaking merges),
  // fall back to muxed single-file formats — usually 720p, sometimes 360p,
  // which the encoder has to upscale (visibly softer but always works).
  // No height cap — if the source has 4K/2K available, grab it. Downscaling
  // a 4K source to a 1080x1080 square (with lanczos) is visibly sharper than
  // a 1080p source at 1080x1080 because every output pixel gets averaged
  // from multiple source pixels instead of mapped 1:1.
  // Format priority (left to right):
  //   1. Pre-muxed HD MP4 ≥ 1080p (height OK, no merge needed — bypasses SABR
  //      "Postprocessing: Conversion failed!" entirely)
  //   2. Pre-muxed HD MP4 ≥ 720p
  //   3. Separate bestvideo+bestaudio MP4 (needs ffmpeg merge; fails on SABR
  //      accounts but works elsewhere — kept as fallback)
  //   4. Any pre-muxed MP4 (last resort within the HD attempt list)
  // The pre-muxed-first ordering meaningfully reduces our dependency on
  // YouTube cookies. Cookies are still required for some videos but no longer
  // for every video that happens to have a pre-muxed 1080p stream.
  const HD =
    '-f "best[height>=1080][ext=mp4]/best[height>=720][ext=mp4]/' +
    'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" ' +
    '--merge-output-format mp4';
  const MUXED = '-f "best[ext=mp4][protocol^=http]/22/18/best[ext=mp4]/best"';
  // No-codec-constraint fallback. YouTube is increasingly serving webm/AV1
  // only for newer/specific videos; the MP4-constrained selectors above all
  // fail with "Requested format is not available" when no MP4 stream exists,
  // even though /best is supposed to be a universal fallback (the [ext=mp4]
  // constraints from earlier in the chain still propagate through yt-dlp's
  // format-spec parsing). This selector accepts ANY codec and lets ffmpeg
  // remux to mp4 at the merge step.
  // Height-capped at 1080 so we don't accidentally pull a 4K source and burn
  // the entire 1GB Railway volume on a single download. The downstream
  // smart_crop pipeline crops to a 1080x1080 square anyway, so anything above
  // 1080p in the source is wasted bytes and disk pressure.
  const ANY =
    '-f "bv*[height<=1080][height>=720]+ba/bv*[height<=1080]+ba/b[height<=1080]/bv*+ba/b" ' +
    '--merge-output-format mp4';
  // Truly-last-resort selector: any single muxed file, no height or codec
  // constraint. Used only on the final attempt with acceptLow:true so a
  // 360p source (SABR experiment on YouTube's end) still delivers a clip
  // instead of failing the whole job.
  const ANYTHING = '-f "best/b/worst"';
  // Order matters: clients with the best SABR-bypass behavior go first.
  // YouTube's SABR experiment hides URLs for higher-res streams, leaving
  // only muxed 360p/720p — so even when yt-dlp reports "success" it may
  // only have 360p. We re-probe after each download and treat <720p as a
  // failure so we keep trying.
  const MIN_HEIGHT = 720;
  const attempts = [
    { label: 'tv_embedded HD',     args: `--extractor-args "youtube:player_client=tv_embedded" ${HD}` },
    { label: 'web_creator HD',     args: `--extractor-args "youtube:player_client=web_creator" ${HD}` },
    { label: 'tv,web_safari HD',   args: `--extractor-args "youtube:player_client=tv,web_safari" ${HD}` },
    { label: 'web HD',             args: `--extractor-args "youtube:player_client=web" ${HD}` },
    { label: 'mweb HD',            args: `--extractor-args "youtube:player_client=mweb" ${HD}` },
    { label: 'tv HD',              args: `--extractor-args "youtube:player_client=tv" ${HD}` },
    { label: 'tv_embedded HD (2)', args: `--extractor-args "youtube:player_client=tv_embedded" ${HD}` },
    // Last-resort muxed fallbacks — the MUXED format prefers 22 (720p) before
    // 18 (360p). MIN_HEIGHT (720) now applies to these too so we never silently
    // ship blurry 360p clips. If all 10 attempts come back below 720p, the
    // job errors out — better than publishing low-res output to social.
    { label: 'mweb muxed',         args: `--extractor-args "youtube:player_client=mweb" ${MUXED}` },
    { label: 'tv muxed',           args: `--extractor-args "youtube:player_client=tv" ${MUXED}` },
    { label: 'web muxed',          args: `--extractor-args "youtube:player_client=web" ${MUXED}` },
    // Final fallbacks: drop the MP4 codec constraint entirely. Accept webm/AV1
    // and let ffmpeg remux. `acceptLow` lets the smart_crop pipeline run on
    // sub-720p source rather than failing the whole job — visibly softer, but
    // the alternative here is "no clip at all."
    { label: 'tv_embedded any',    args: `--extractor-args "youtube:player_client=tv_embedded" ${ANY}` },
    { label: 'tv any',             args: `--extractor-args "youtube:player_client=tv" ${ANY}` },
    // Absolute last resort: no client restriction, no height or codec filter.
    // If even this fails, the video is genuinely unreachable (age-gated,
    // private, region-locked, etc.) and no format gymnastics will help.
    { label: 'tv anything (low ok)',  args: `--extractor-args "youtube:player_client=tv" ${ANYTHING}`, acceptLow: true },
    { label: 'web anything (low ok)', args: `--extractor-args "youtube:player_client=web" ${ANYTHING}`, acceptLow: true },
  ];
  const attemptErrors = [];
  let lastErr;
  let downloadedOk = false;
  for (const attempt of attempts) {
    try {
      await execAsync(
        `${YTDLP_BIN} ${cookiesArg}${proxyArg}${attempt.args} -o "${videoPath}" "${youtubeUrl}"`,
        { maxBuffer: 1024 * 1024 * 100 }
      );
      // Probe the resolution. If below MIN_HEIGHT and this isn't a fallback
      // attempt, treat as failure and try the next client.
      let h = 0;
      try {
        const { stdout: pOut } = await execAsync(
          `ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "${videoPath}"`
        );
        h = parseInt(pOut.trim(), 10) || 0;
      } catch {}
      if (!attempt.acceptLow && h > 0 && h < MIN_HEIGHT) {
        console.warn(`[yt-dlp] ${attempt.label} returned only ${h}p — rejecting, trying next client`);
        attemptErrors.push(`${attempt.label}: returned ${h}p (below ${MIN_HEIGHT}p)`);
        cleanJobDir(jobDir);
        continue;
      }
      console.log(`[yt-dlp] succeeded with ${attempt.label} at ${h || '?'}p`);
      lastErr = null;
      downloadedOk = true;
      break;
    } catch (err) {
      const shortMsg = err.message.split('\n').filter(Boolean).pop()?.slice(0, 200) || err.message.slice(0, 200);
      console.warn(`[yt-dlp] failed with ${attempt.label}:`, shortMsg);
      attemptErrors.push(`${attempt.label}: ${shortMsg}`);
      lastErr = err;
      // Nuke the job dir entirely between attempts — yt-dlp leaves .part
      // and .fXXX intermediate streams that pile up. Without this, after a
      // few HD-merge failures the volume fills to ENOSPC.
      cleanJobDir(jobDir);
      // Emergency disk wipe if the failure was ENOSPC. Beyond the per-attempt
      // job dir cleanup, do an aggressive pass that drops orphan uploads and
      // older finished jobs so the next attempt has actual headroom — without
      // this, every subsequent attempt also dies on ENOSPC.
      if (/ENOSPC|No space left/i.test(err.message)) {
        console.warn('[yt-dlp] ENOSPC detected — running emergency cleanup');
        try { diskCleanup({ wipeUploads: true }); } catch (cleanupErr) {
          console.error('[yt-dlp] emergency cleanup failed:', cleanupErr.message);
        }
      }
    }
  }
  if (!downloadedOk) {
    throw new Error(
      `yt-dlp failed all ${attempts.length} client attempts:\n` + attemptErrors.join('\n')
    );
  }

  await analyzeAndCutVideo(jobId, jobDir, videoPath, overlayOpts);
}

// Stages 2–6 of the original processVideo() pipeline (audio extract →
// Whisper transcript → Claude clip selection → ffmpeg cut → cleanup),
// factored out so the local-yt-dlp ingest path (/api/process-local) can
// run them against a video that was uploaded from a laptop instead of
// downloaded by Railway. videoPath must already exist on disk.
async function analyzeAndCutVideo(jobId, jobDir, videoPath, overlayOpts = { topTitle: false }) {
  // 2. Extract audio for Whisper
  // Whisper has a hard 25 MB file cap. -q:a 0 (highest VBR quality) was
  // producing ~245 kbps MP3s that blew past 25 MB for any video >~14 min.
  // Speech transcription doesn't need anywhere near that quality:
  //   mono + 16 kHz + 32 kbps = ~14 MB per hour of audio.
  // Comfortably fits videos up to ~2 hours under the cap.
  setJobStatus(jobId, { status: 'transcribing', message: 'Extracting audio…', progress: 20 });
  const audioPath = path.join(jobDir, 'audio.mp3');
  await execAsync(
    `ffmpeg -i "${videoPath}" -vn -ac 1 -ar 16000 -b:a 32k "${audioPath}" -y`
  );

  // 3. Transcribe with Whisper (verbose_json gives word-level timestamps)
  setJobStatus(jobId, { status: 'transcribing', message: 'Transcribing with Whisper…', progress: 30 });
  const transcriptPath = path.join(jobDir, 'transcript.json');

  const audioReadStream = fs.createReadStream(audioPath);
  const transcription = await groq.audio.transcriptions.create({
    file: audioReadStream,
    model: 'whisper-large-v3-turbo',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  fs.writeFileSync(transcriptPath, JSON.stringify(transcription, null, 2));

  // Build a clean readable transcript with timestamps
  const segments = transcription.segments || [];
  const readableTranscript = segments
    .map(s => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text.trim()}`)
    .join('\n');

  // 4. Ask Claude to pick the best clip moments
  setJobStatus(jobId, { status: 'analyzing', message: 'AI is finding the best moments…', progress: 55 });

  const claudeResponse = await callClaudeWithRetry({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are a short-form video expert for a pickleball YouTube channel called Pickleball Playbook. 
      
Analyze this transcript and identify the best moments to turn into YouTube Shorts (15–60 seconds each).

Rules:
- Pick up to 10 clips, but only if they're genuinely good. Quality over quantity.
- Each clip must be self-contained — a tip, story, insight, or entertaining moment that makes sense on its own WITHOUT any prior context from the video.
- Prefer moments with clear actionable advice, surprising facts, or high energy.
- Clips should be 15–60 seconds long.
- Do not overlap clips.

CLEAN CUTS — this is critical:
- Start timestamps must land at the very beginning of a complete sentence. Never mid-word, never mid-sentence. Scan back to the nearest sentence start if needed.
- End timestamps must land at the end of a complete sentence or thought. Never cut off the speaker mid-sentence.
- A clip must cover ONE continuous topic. If the speaker finishes a point and moves on to a different subject, end the clip before that transition — do not combine two separate topics into one clip. Two topics stitched together will feel like two different videos and confuse the viewer.
- Ask yourself: if a stranger watches only this segment with zero context, does it make complete sense from start to finish? If not, adjust the timestamps or skip it.

TITLES MUST BE CLICKBAIT, NOT DESCRIPTIONS.

A descriptive title is a failure. We're competing against every other Short
in the feed — viewers must feel stupid scrolling past. Use curiosity gaps,
contrarian takes, callouts, FOMO, big claims, secrets, mistakes.

"title" rules (one per clip, 30–60 chars):
- Hook + tease, never just a topic.
- Don't say WHAT it's about — make them tap to find out.
- Punch up with words like: secret, mistake, wrong, stop, never, hate, the
  truth about, why, the one thing, nobody tells you, every pro does this.
- BAD: "Tips for the third shot drop"
- GOOD: "The third shot drop mistake EVERY rec player makes"
- BAD: "How to improve your serve"
- GOOD: "Pros won't tell you this serve secret"
- BAD: "Six Zero Coral Pro review"
- GOOD: "I tried the world's hyped paddle. It was bad."
- The hook MUST pay off in the actual clip — no lies, just irresistible framing.

"topTitle" rules (one per clip, 2–4 words, max 20 chars, ALL CAPS preferred,
no emojis): a punchy on-screen hook. Match the clickbait energy of the title.
- BAD: "THIRD SHOT DROP"
- GOOD: "STOP DOING THIS", "PRO SECRET", "YOU'RE WRONG", "WORST PADDLE EVER",
        "TRY THIS HACK", "NOBODY TELLS YOU"

"description" rules (one per clip, 2–4 sentences, ~250–400 chars):
- This is the SOCIAL POST CAPTION for the Reel / Short / TikTok. It's what
  the viewer reads under the video.
- Tell the viewer what they're about to see and what they'll learn. Concrete
  content, not meta-commentary.
- Hook them in the first sentence (echo the title's energy), then deliver
  enough of the payoff to justify the watch. End with a soft call to watch.
- NEVER say "in this clip" or "this short shows" — speak directly to the
  viewer as if it's already playing.
- NEVER describe why the clip is good or why we picked it (that's "reason",
  separate field, internal-only).
- BAD: "This clip showcases a great moment of instruction about the third
  shot drop." (meta-commentary)
- GOOD: "Most rec players push the third shot flat and the ball pops up
  every time. The fix isn't grip or footwork — it's where your contact
  point sits on the paddle face. Two seconds of adjustment and your drop
  lands at their feet instead of their paddle. Save this one."

"reason" rules (one per clip, ONE sentence): internal-only label for the
admin UI explaining why we chose this segment. NOT used in the public post.

Transcript:
${readableTranscript}

Respond ONLY with valid JSON — no preamble, no markdown fences. Format:
{
  "clips": [
    {
      "start": 12.4,
      "end": 45.2,
      "title": "Pros won't tell you this serve secret",
      "topTitle": "PRO SECRET",
      "description": "Most rec players spend years working on serve mechanics that don't actually matter. The pros don't think about any of that — they're focused on one tiny pre-serve cue that resets their whole motion and lands every serve where they want it. Once you see it you can't unsee it.",
      "reason": "Strong rationale paragraph from the host that uniquely names the cue."
    }
  ]
}`
    }]
  });

  const rawJson = claudeResponse.content[0].text.trim().replace(/```json\n?/g, "").replace(/```/g, "").trim();
  let clipMoments;
  try {
    clipMoments = JSON.parse(rawJson).clips;
  } catch (e) {
    throw new Error('Claude returned invalid JSON: ' + rawJson.slice(0, 200));
  }

  if (!clipMoments || clipMoments.length === 0) {
    throw new Error('Claude found no suitable clips in this video.');
  }

  // 5. Cut clips with FFmpeg + crop to 9:16
  setJobStatus(jobId, { status: 'cutting', message: `Cutting ${clipMoments.length} clips…`, progress: 65 });

  // Get video dimensions
  const { stdout: probeOut } = await execAsync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height ` +
    `-of json "${videoPath}"`
  );
  const { width, height } = JSON.parse(probeOut).streams[0];
  console.log(`[${jobId}] source video: ${width}x${height}`);
  // Persist the source resolution to the job record so the History UI can
  // surface it as a quality indicator (and so future "why does this look
  // blurry" debugging takes one glance instead of a Railway log dive).
  setJobStatus(jobId, { sourceResolution: `${width}x${height}` });

  // Output is 9:16 portrait (1080x1920) for IG/FB Reels. The landscape source
  // is center-cropped to a SQUARE (1080x1080) — feels more zoomed-in than
  // letterboxed landscape — then placed in the middle of the portrait frame.
  // The background fills the full 1080x1920 with the same frame zoomed to
  // cover and heavily blurred (radius 60, 3 passes = noticeably soft, no
  // sharp edges leaking through).
  void width; void height;
  // flags=lanczos on every scale = sharper rescaling than ffmpeg's default
  // (bilinear). Noticeable on 720p sources that have to upscale to 1080.
  const reelBaseFilter =
    `[0:v]split=2[bg][fg];` +
    `[bg]scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,boxblur=60:3[bg];` +
    `[fg]crop=ih:ih,scale=1080:1080:flags=lanczos[fg];` +
    `[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1`;

  const clipOutputDir = path.join(OUTPUT_DIR, jobId);
  fs.mkdirSync(clipOutputDir, { recursive: true });

  const outputClips = [];

  for (let i = 0; i < clipMoments.length; i++) {
    const clip = clipMoments[i];
    const duration = clip.end - clip.start;
    const filename = `clip_${String(i + 1).padStart(2, '0')}.mp4`;
    const outPath = path.join(clipOutputDir, filename);

    setJobStatus(jobId, {
      status: 'cutting',
      message: `Cutting clip ${i + 1} of ${clipMoments.length}: "${clip.title}"`,
      progress: 65 + Math.round((i / clipMoments.length) * 30)
    });

    // Top title (whole-clip overlay) is the only drawtext baked in at cut
    // time — bottom CTAs are added per-clip via the editor's preset buttons.
    // The title sits in the upper blurred-letterbox area above the centered
    // 1080x1080 foreground (which spans y=420..1500 in the 1080x1920 frame).
    let reelFilter = reelBaseFilter;
    if (
      DRAWTEXT_FONT &&
      overlayOpts.topTitle &&
      typeof clip.topTitle === 'string' &&
      clip.topTitle.trim()
    ) {
      const brand = brandDrawText({
        text: clip.topTitle.trim(),
        fontSize: 64,
        x: '(w-text_w)/2',
        y: '260',
        enable: null,
      });
      if (brand.length) reelFilter += ',' + brand.join(',');
    }

    // -preset medium + crf 19 is a much higher-quality target than the old
    // fast/23 (visually near-lossless H264). Encode is ~2-3x slower but
    // these are short clips so it's still seconds, not minutes.
    await execAsync(
      `ffmpeg -ss ${clip.start} -i "${videoPath}" -t ${duration} ` +
      `-filter_complex "${reelFilter}" -c:v libx264 -preset medium -crf 19 ` +
      `-pix_fmt yuv420p -c:a aac -b:a 192k "${outPath}" -y`,
      { maxBuffer: 1024 * 1024 * 200 }
    );

    outputClips.push({
      filename,
      url: `/clips/${jobId}/${filename}`,
      title: clip.title,
      topTitle: clip.topTitle || '',
      // description = social post body (what viewers read under the Reel).
      // reason = internal "why we picked this clip" rationale for the admin UI.
      description: clip.description || '',
      reason: clip.reason,
      start: clip.start,
      end: clip.end,
      duration: Math.round(duration),
    });
  }

  // 6. Cleanup job temp files (keep output clips)
  fs.rmSync(jobDir, { recursive: true, force: true });

  setJobStatus(jobId, {
    status: 'done',
    message: `Done! ${outputClips.length} clips ready.`,
    progress: 100,
    clips: outputClips,
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
}

// ─── START ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Shorts backend running on port ${PORT}`));

// ─── SOCIAL MEDIA ROUTES ─────────────────────────────────────────────────────



// Connection storage — persisted to disk so connections survive Railway redeploys.
// Each entry has minimum: { id, name, … platform-specific fields }.
const CONNECTIONS_PATH = path.join(OUTPUT_DIR, 'connections.json');
const connections = {
  youtube: [],   // { id (channelId), name, tokens }
  facebook: [],  // { id (pageId), name, accessToken }
  instagram: [], // { id (igAccountId), username, accessToken, facebookPageId, facebookPageName }
  tiktok: [],   // { id (open_id), username (display_name), access_token, refresh_token }
};

function loadConnections() {
  if (!fs.existsSync(CONNECTIONS_PATH)) return;
  try {
    const data = JSON.parse(fs.readFileSync(CONNECTIONS_PATH, 'utf-8'));
    connections.youtube = data.youtube || [];
    connections.facebook = data.facebook || [];
    connections.instagram = data.instagram || [];
    connections.tiktok = data.tiktok || [];
    console.log(`Loaded connections: yt=${connections.youtube.length} fb=${connections.facebook.length} ig=${connections.instagram.length} tt=${connections.tiktok.length}`);
  } catch (err) {
    console.error('Failed to load connections.json:', err.message);
  }
}

function saveConnections() {
  try {
    fs.writeFileSync(CONNECTIONS_PATH, JSON.stringify(connections, null, 2));
  } catch (err) {
    console.error('Failed to write connections.json:', err.message);
  }
}

function upsertConnection(type, entry) {
  const arr = connections[type];
  const idx = arr.findIndex(c => c.id === entry.id);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...entry };
  else arr.push(entry);
  saveConnections();
}

function removeConnection(type, id) {
  const before = connections[type].length;
  connections[type] = connections[type].filter(c => c.id !== id);
  if (connections[type].length !== before) saveConnections();
  return connections[type].length !== before;
}

loadConnections();

// ─── YOUTUBE AUTH ─────────────────────────────────────────────────────────────
app.get('/auth/youtube', (req, res) => {
  res.redirect(getYouTubeAuthUrl());
});

app.get('/auth/youtube/callback', async (req, res) => {
  try {
    const tokens = await exchangeYouTubeCode(req.query.code);
    const channel = await getYouTubeChannel(tokens);
    upsertConnection('youtube', { id: channel.id, name: channel.title, tokens });
    res.send(`<script>window.close();</script>YouTube connected: ${channel.title}. You can close this window.`);
  } catch (e) {
    res.status(500).send('YouTube auth failed: ' + e.message);
  }
});

// ─── META AUTH ────────────────────────────────────────────────────────────────
app.get('/auth/meta', (req, res) => {
  res.redirect(getMetaAuthUrl());
});

app.get('/auth/meta/callback', async (req, res) => {
  try {
    const { access_token } = await exchangeMetaCode(req.query.code);
    const longLived = await getLongLivedToken(access_token);
    const pages = await getPages(longLived);
    for (const page of pages) {
      upsertConnection('facebook', {
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        // User access token is needed for Group endpoints (Pages can't list
        // or post to Groups; only Users can with user_managed_groups +
        // publish_to_groups, both Advanced Access).
        userAccessToken: longLived,
      });
      const igId = await getInstagramAccount(page.id, page.access_token);
      if (igId) {
        const username = await getInstagramUsername(igId, page.access_token);
        upsertConnection('instagram', {
          id: igId,
          username: username || `(IG ${igId})`,
          accessToken: page.access_token,
          facebookPageId: page.id,
          facebookPageName: page.name,
        });
      }
    }
    const summary = `${pages.length} Page${pages.length === 1 ? '' : 's'}`;
    res.send(`<script>window.close();</script>Meta connected: ${summary}. You can close this window.`);
  } catch (e) {
    res.status(500).send('Meta auth failed: ' + e.message);
  }
});

// ─── TIKTOK AUTH ──────────────────────────────────────────────────────────────
// Single-admin tool — store the PKCE verifier in memory for the duration of
// the OAuth flow. Reset on each new auth start so stale values can't be reused.
let _tiktokPkceVerifier = null;

app.get('/auth/tiktok', (req, res) => {
  const { verifier, challenge } = getTikTokPkce();
  _tiktokPkceVerifier = verifier;
  res.redirect(getTikTokAuthUrl(challenge));
});

app.get('/auth/tiktok/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    if (error) throw new Error(error_description || error);
    if (!code) throw new Error('No code returned from TikTok');
    if (!_tiktokPkceVerifier) throw new Error('PKCE verifier missing — restart the auth flow');
    const tokenData = await exchangeTikTokCode(code, _tiktokPkceVerifier);
    _tiktokPkceVerifier = null;
    const userInfo = await getTikTokUserInfo(tokenData.access_token);
    const openId = tokenData.open_id || userInfo.open_id;
    const displayName = userInfo.display_name || userInfo.username || openId;
    upsertConnection('tiktok', {
      id: openId,
      username: displayName,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in || 86400) * 1000,
    });
    res.send(`<script>window.close();</script>TikTok connected: ${displayName}. You can close this window.`);
  } catch (e) {
    console.error('[tiktok auth]', e.message);
    res.status(500).send('TikTok auth failed: ' + e.message);
  }
});

// ─── CONNECTIONS ──────────────────────────────────────────────────────────────
// Returns a sanitized view (no tokens) for the UI.
app.get('/auth/connections', (_req, res) => {
  res.json({
    youtube: connections.youtube.map(c => ({ id: c.id, name: c.name })),
    facebook: connections.facebook.map(c => ({ id: c.id, name: c.name })),
    instagram: connections.instagram.map(c => ({
      id: c.id,
      username: c.username,
      facebookPageName: c.facebookPageName,
    })),
    tiktok: connections.tiktok.map(c => ({ id: c.id, username: c.username })),
  });
});

// Meta Commerce catalog products, for the FB/IG product-tag picker.
// Uses the first connected FB Page's access token (which has the
// catalog_management scope after Meta re-auth).
app.get('/api/meta/products', async (_req, res) => {
  const catalogId = process.env.META_CATALOG_ID;
  if (!catalogId) {
    return res.status(500).json({ error: 'META_CATALOG_ID env var not set on backend' });
  }
  const page = connections.facebook[0];
  if (!page) {
    return res.status(400).json({ error: 'No Facebook page connected' });
  }
  try {
    const products = await listMetaCatalogProducts(catalogId, page.accessToken);
    res.json({ products });
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err.message;
    res.status(500).json({ error: detail });
  }
});

// Facebook Groups the authenticated user admins, for the FB expander's
// "Share to groups" picker. Requires user_managed_groups on the OAuth
// token, which is Advanced Access and pending Meta App Review.
app.get('/api/facebook/groups', async (_req, res) => {
  const conn = connections.facebook[0];
  if (!conn || !conn.userAccessToken) {
    return res.status(400).json({ error: 'No Facebook user token. Reconnect Meta.' });
  }
  try {
    const groups = await listFacebookGroups(conn.userAccessToken, { adminOnly: true });
    res.json({ groups });
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err.message;
    res.status(500).json({ error: detail });
  }
});

// Per-channel playlist list for the YouTube expander UI.
app.get('/api/youtube/:channelId/playlists', async (req, res) => {
  const conn = connections.youtube.find(c => c.id === req.params.channelId);
  if (!conn) return res.status(404).json({ error: 'Channel not connected' });
  try {
    const playlists = await listYouTubePlaylists(conn.tokens);
    res.json({ playlists });
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err.message;
    res.status(500).json({ error: detail });
  }
});

app.delete('/auth/connections/:type/:id', (req, res) => {
  const { type, id } = req.params;
  if (!['youtube', 'facebook', 'instagram', 'tiktok'].includes(type)) {
    return res.status(400).json({ error: 'Invalid connection type' });
  }
  const removed = removeConnection(type, id);
  if (!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// Back-compat for the previous frontend until it deploys with the new shape.
app.get('/auth/youtube/status', (_req, res) => {
  res.json({ connected: connections.youtube.length > 0 });
});
app.get('/auth/meta/status', (_req, res) => {
  res.json({
    connected: connections.facebook.length > 0 || connections.instagram.length > 0,
    pages: connections.facebook.map(p => ({ id: p.id, name: p.name })),
  });
});

// ─── UPLOAD & SCHEDULE ────────────────────────────────────────────────────────
// UPLOADS_DIR is declared at the top of the file (next to JOBS_DIR /
// OUTPUT_DIR) because diskCleanup() references it during startup. Default to
// ephemeral container disk (not the persistent volume) — raw uploads only
// need to exist briefly while we publish to YT/IG/FB, and the volume is
// reserved for clips + connections.
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || '';
// Serve uploaded files so Instagram can fetch them. URLs include a UUID
// uploadId which acts as an unguessable token.
app.use('/uploads', express.static(UPLOADS_DIR));

// Instagram has no native scheduled-publish API. We hold scheduled IG posts in
// a persistent queue on the volume (so a container restart doesn't lose them)
// and a cron loop fires them at the scheduled time.
const SCHEDULED_DIR = path.join(OUTPUT_DIR, 'scheduled');
const SCHEDULED_QUEUE_PATH = path.join(OUTPUT_DIR, 'scheduled-queue.json');
fs.mkdirSync(SCHEDULED_DIR, { recursive: true });
// Serve persisted videos/covers so Instagram can fetch them at fire time.
app.use('/scheduled', express.static(SCHEDULED_DIR));

let scheduledQueue = [];
function loadScheduledQueue() {
  if (!fs.existsSync(SCHEDULED_QUEUE_PATH)) return;
  try {
    scheduledQueue = JSON.parse(fs.readFileSync(SCHEDULED_QUEUE_PATH, 'utf-8'));
    // Reset any entries that errored due to transient "Media download failed"
    // (subcode 2207076) so the cron can retry once the underlying fix lands.
    let resets = 0;
    for (const e of scheduledQueue) {
      if (e.status === 'error' && /2207076|Media download failed/i.test(e.error || '')) {
        const dir = path.join(SCHEDULED_DIR, e.id);
        if (fs.existsSync(path.join(dir))) {
          e.status = 'pending';
          delete e.error;
          resets += 1;
        }
      }
    }
    if (resets > 0) {
      console.log(`Reset ${resets} previously-errored entr(y/ies) for retry`);
      saveScheduledQueue();
    }
    console.log(`Loaded ${scheduledQueue.length} scheduled IG post(s)`);
  } catch (err) {
    console.error('Failed to load scheduled queue:', err.message);
    scheduledQueue = [];
  }
}
function saveScheduledQueue() {
  try {
    fs.writeFileSync(SCHEDULED_QUEUE_PATH, JSON.stringify(scheduledQueue, null, 2));
  } catch (err) {
    console.error('Failed to save scheduled queue:', err.message);
  }
}

// Reconcile SCHEDULED_DIR with the queue. fireScheduledEntry() schedules
// the per-entry media wipe via setTimeout(.unref()) one hour after publish,
// which means every container restart silently drops those pending timers
// and the persisted videos (50–200 MB each) leak onto the 1 GB volume
// forever. Called once at startup right after loadScheduledQueue() so we
// have an authoritative view of which dirs are still in-flight.
function reapOrphanedScheduledMedia() {
  if (!fs.existsSync(SCHEDULED_DIR)) return;
  const keep = new Set(
    scheduledQueue
      .filter(e => e.status === 'pending' || e.status === 'publishing')
      .map(e => e.id)
  );
  let freed = 0;
  let removed = 0;
  for (const entry of fs.readdirSync(SCHEDULED_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (keep.has(entry.name)) continue;
    const dir = path.join(SCHEDULED_DIR, entry.name);
    try {
      freed += dirSize(dir);
      fs.rmSync(dir, { recursive: true, force: true });
      removed++;
    } catch (err) {
      console.error(`[scheduled cleanup] failed to remove ${dir}:`, err.message);
    }
  }
  // Also drop queue entries whose media we just wiped (published/error) so
  // the queue doesn't carry dead references forever.
  const before = scheduledQueue.length;
  scheduledQueue = scheduledQueue.filter(
    e => e.status === 'pending' || e.status === 'publishing'
  );
  if (scheduledQueue.length !== before) saveScheduledQueue();
  console.log(
    `[scheduled cleanup] freed ${(freed / 1024 / 1024).toFixed(1)} MB across ${removed} orphan dir(s); queue ${before} → ${scheduledQueue.length}`
  );
}
loadScheduledQueue();
reapOrphanedScheduledMedia();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB
});

// Reserve a one-time upload slot. Called by Next.js with the bearer token.
// Returns a short-lived signed token the browser can use to PUT a file directly.
app.post('/api/upload-reserve', (_req, res) => {
  const uploadId = uuidv4();
  const exp = Date.now() + 6 * 60 * 60 * 1000; // 6 hours — large files (6 GB+) can take >30 min over typical home uplinks
  const token = signUploadToken(uploadId, exp);
  res.json({ uploadId, token, exp });
});

// Direct upload from the browser. Self-authenticated by the signed token query param.
// Exempt from the global bearer-token gate above.
const uploadMulter = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const { uploadId } = req.params;
      const dir = path.join(UPLOADS_DIR, uploadId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, safe);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5 GB
});

// Chunked upload — each chunk is its own short HTTP request so we never hit
// Railway's 5-minute per-request timeout, even for files larger than the
// network can push in 5 minutes.
//
// Sequence (browser sends in order, awaits each):
//   POST /api/file-upload/<id>/chunk?token=…&exp=…&index=0&total=N&chunkSize=…&filename=x
//     body: raw bytes of chunk 0 (first chunk → file is truncated/created)
//   POST … &index=1&total=N&chunkSize=… body: raw bytes of chunk 1
//   …
//   POST … &index=N-1&total=N&chunkSize=… body: raw bytes of last chunk → response: { done: true, path }
//
// Retry safety: before writing each chunk we truncate the file back to the
// expected pre-chunk size (index * chunkSize). That way a chunk that failed
// mid-upload (and may have partially written) can be retried without
// duplicating bytes — the partial leftovers are discarded and the retried
// chunk's bytes land in the same final position.
// Chunk upload — saves each chunk as an independent file so the client can
// upload multiple chunks in parallel without ordering constraints.
app.post('/api/file-upload/:uploadId/chunk', (req, res) => {
  const { uploadId } = req.params;
  const token = String(req.query.token || '');
  const exp = Number(req.query.exp || 0);
  const index = Number(req.query.index);
  const total = Number(req.query.total);

  if (!token || !exp || !Number.isFinite(index) || !Number.isFinite(total)) {
    return res.status(400).json({ error: 'Missing or invalid chunk params' });
  }
  if (total < 1 || index < 0 || index >= total) {
    return res.status(400).json({ error: 'Bad index/total' });
  }
  if (exp < Date.now()) return res.status(401).json({ error: 'Token expired' });
  if (usedUploadTokens.has(uploadId)) {
    return res.status(409).json({ error: 'Upload already finalized' });
  }
  const expected = signUploadToken(uploadId, exp);
  if (
    expected.length !== token.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  ) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const dir = path.join(UPLOADS_DIR, uploadId);
  fs.mkdirSync(dir, { recursive: true });
  const chunkPath = path.join(dir, `chunk_${String(index).padStart(8, '0')}`);

  const writeStream = fs.createWriteStream(chunkPath);
  let aborted = false;
  req.on('aborted', () => { aborted = true; writeStream.destroy(); });
  writeStream.on('error', err => {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  });
  writeStream.on('finish', () => {
    if (aborted) return;
    res.json({ ok: true, index });
  });
  req.pipe(writeStream);
});

// Finalize — called after all chunks have been uploaded. Assembles them in
// order into the final file. Token re-verified to prevent unauthorized assembly.
app.post('/api/file-upload/:uploadId/finalize', express.json(), async (req, res) => {
  const { uploadId } = req.params;
  const { token, exp, total, filename } = req.body || {};
  const numExp = Number(exp);
  const numTotal = Number(total);

  if (!token || !numExp || !numTotal) {
    return res.status(400).json({ error: 'Missing finalize params' });
  }
  if (numExp < Date.now()) return res.status(401).json({ error: 'Token expired' });
  if (usedUploadTokens.has(uploadId)) {
    return res.status(409).json({ error: 'Upload already finalized' });
  }
  const expected = signUploadToken(uploadId, numExp);
  if (
    expected.length !== token.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  ) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const dir = path.join(UPLOADS_DIR, uploadId);
  const safeFilename = String(filename || 'upload.bin')
    .replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200) || 'upload.bin';
  const finalPath = path.join(dir, safeFilename);

  const chunkPaths = Array.from({ length: numTotal }, (_, i) =>
    path.join(dir, `chunk_${String(i).padStart(8, '0')}`)
  );
  const missing = chunkPaths.filter(p => { try { return !fs.statSync(p).size; } catch { return true; } });
  if (missing.length > 0) {
    return res.status(409).json({ error: `${missing.length} chunk(s) missing — retry upload` });
  }

  try {
    const out = fs.createWriteStream(finalPath);
    for (const cp of chunkPaths) {
      await new Promise((resolve, reject) => {
        const inp = fs.createReadStream(cp);
        inp.on('error', reject);
        inp.on('end', resolve);
        inp.pipe(out, { end: false });
      });
      try { fs.unlinkSync(cp); } catch {}
    }
    await new Promise((resolve, reject) => { out.end(); out.on('finish', resolve); out.on('error', reject); });
    usedUploadTokens.add(uploadId);
    res.json({ done: true, path: finalPath });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Lists every clip across every job — used by the publish picker.
app.get('/api/clips', (_req, res) => {
  const out = [];
  for (const job of Object.values(jobs)) {
    if (!Array.isArray(job.clips)) continue;
    for (const clip of job.clips) {
      if (!clip.filename) continue;
      const diskPath = path.join(OUTPUT_DIR, job.jobId, clip.filename);
      if (!fs.existsSync(diskPath)) continue;
      out.push({
        jobId: job.jobId,
        filename: clip.filename,
        path: diskPath,
        title: clip.title,
        description: clip.description || '',
        reason: clip.reason,
        duration: clip.duration,
        createdAt: job.createdAt,
        sourceUrl: job.youtubeUrl,
      });
    }
  }
  out.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ clips: out });
});

// Persist a video + cover into SCHEDULED_DIR/<id>/ and return URLs that the
// /scheduled static route will serve at fire time. Source files are left in
// place; the caller continues to publish to non-IG targets immediately.
function persistForScheduledIg({ videoPath, coverUrlSource }) {
  const id = uuidv4();
  const dir = path.join(SCHEDULED_DIR, id);
  fs.mkdirSync(dir, { recursive: true });

  const videoFilename = `video${path.extname(videoPath) || '.mp4'}`;
  const persistedVideo = path.join(dir, videoFilename);
  fs.copyFileSync(videoPath, persistedVideo);
  const videoUrl = PUBLIC_BASE_URL
    ? `${PUBLIC_BASE_URL.replace(/\/$/, '')}/scheduled/${id}/${videoFilename}`
    : null;

  let coverUrl;
  // coverUrlSource is the local on-disk cover image path inside UPLOADS_DIR
  if (coverUrlSource && fs.existsSync(coverUrlSource)) {
    const coverFilename = `cover${path.extname(coverUrlSource) || '.jpg'}`;
    fs.copyFileSync(coverUrlSource, path.join(dir, coverFilename));
    coverUrl = PUBLIC_BASE_URL
      ? `${PUBLIC_BASE_URL.replace(/\/$/, '')}/scheduled/${id}/${coverFilename}`
      : undefined;
  }
  return { id, dir, videoUrl, coverUrl };
}

async function fireScheduledEntry(entry) {
  entry.status = 'publishing';
  entry.attemptedAt = new Date().toISOString();
  saveScheduledQueue();
  try {
    const data = await uploadToInstagram({
      igAccountId: entry.igAccountId,
      accessToken: entry.accessToken,
      videoUrl: entry.videoUrl,
      caption: entry.caption,
      coverUrl: entry.coverUrl,
      taggedUsernames: entry.taggedUsernames,
      collaboratorUsernames: entry.collaboratorUsernames,
      locationId: entry.locationId,
      productIds: entry.productIds,
    });
    entry.status = 'published';
    entry.publishedAt = new Date().toISOString();
    entry.publishedId = data?.id;
    console.log(`[scheduler] published IG ${entry.id} -> ${data?.id}`);
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err.message;
    entry.status = 'error';
    entry.error = detail;
    console.error(`[scheduler] IG ${entry.id} failed:`, detail);
  }
  saveScheduledQueue();
  // Clean up the persisted media 1 hour after firing — Meta has long since
  // ingested the video, and we want the volume back.
  setTimeout(() => {
    try {
      fs.rmSync(path.join(SCHEDULED_DIR, entry.id), { recursive: true, force: true });
      scheduledQueue = scheduledQueue.filter(e => e.id !== entry.id);
      saveScheduledQueue();
    } catch {}
  }, 60 * 60 * 1000).unref();
}

// Cron-style loop: every 30 seconds, fire any pending entries whose
// scheduledAt has passed. Fail-stuck entries (in 'publishing' for >15 min)
// reset to pending — guards against container restart mid-publish.
setInterval(() => {
  const now = Date.now();
  for (const entry of scheduledQueue) {
    if (entry.status === 'publishing') {
      const stuckMs = now - new Date(entry.attemptedAt || 0).getTime();
      if (stuckMs > 15 * 60 * 1000) {
        entry.status = 'pending';
        saveScheduledQueue();
      }
      continue;
    }
    if (entry.status !== 'pending') continue;
    if (new Date(entry.scheduledAt).getTime() > now) continue;
    fireScheduledEntry(entry).catch(err =>
      console.error(`[scheduler] fire crashed:`, err.message)
    );
  }
}, 30 * 1000).unref();

// Nuclear: wipe every scheduled-IG dir on /data/output/scheduled/ AND
// reset the queue file to []. Use when the queue has fallen out of
// sync with disk (publish failures held the volume hostage so the
// publisher loop kept ENOSPC'ing, leaving orphan media nobody can
// reach via DELETE /api/scheduled/:id).
app.post('/api/scheduled/wipe-all', (_req, res) => {
  let removed = 0;
  let freed = 0;
  try {
    if (fs.existsSync(SCHEDULED_DIR)) {
      for (const entry of fs.readdirSync(SCHEDULED_DIR, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const dir = path.join(SCHEDULED_DIR, entry.name);
        try {
          freed += dirSize(dir);
          fs.rmSync(dir, { recursive: true, force: true });
          removed++;
        } catch {}
      }
    }
    const before = scheduledQueue.length;
    scheduledQueue = [];
    saveScheduledQueue();
    console.log(`[wipe-all] removed ${removed} dir(s), freed ${(freed/1024/1024).toFixed(1)} MB, queue ${before} → 0`);
    res.json({ ok: true, removedDirs: removed, freedMB: +(freed/1024/1024).toFixed(1), queueBefore: before });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/scheduled', (_req, res) => {
  // Sanitize: never leak access tokens to the UI.
  const list = scheduledQueue.map(e => ({
    id: e.id,
    platform: e.platform,
    accountId: e.igAccountId,
    accountName: e.accountName,
    scheduledAt: e.scheduledAt,
    status: e.status,
    error: e.error,
    publishedId: e.publishedId,
    caption: e.caption?.slice(0, 200),
  }));
  res.json({ scheduled: list });
});

app.delete('/api/scheduled/:id', (req, res) => {
  const idx = scheduledQueue.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const entry = scheduledQueue[idx];
  if (entry.status === 'published') return res.status(409).json({ error: 'Already published' });
  scheduledQueue.splice(idx, 1);
  saveScheduledQueue();
  try { fs.rmSync(path.join(SCHEDULED_DIR, entry.id), { recursive: true, force: true }); } catch {}
  res.json({ ok: true });
});

// Edit the scheduled-at timestamp of a pending IG post. Other fields are
// snapshotted at publish-prep time and not safely editable post-hoc.
app.patch('/api/scheduled/:id', express.json(), (req, res) => {
  const entry = scheduledQueue.find(e => e.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  if (entry.status === 'published') {
    return res.status(409).json({ error: 'Already published — cannot edit' });
  }
  const next = req.body?.scheduledAt;
  if (typeof next !== 'string' || !next) {
    return res.status(400).json({ error: 'scheduledAt is required' });
  }
  const t = Date.parse(next);
  if (Number.isNaN(t)) return res.status(400).json({ error: 'Invalid scheduledAt' });
  // Don't let a user schedule into the past — the publisher loop ignores
  // entries with a past timestamp on the next tick, so this is the easiest
  // place to catch user error.
  if (t < Date.now() + 60 * 1000) {
    return res.status(400).json({ error: 'scheduledAt must be at least 1 minute in the future' });
  }
  entry.scheduledAt = new Date(t).toISOString();
  if (entry.status === 'error') {
    // Reset retryable error state so it gets another go on the new time.
    entry.status = 'pending';
    delete entry.error;
  }
  saveScheduledQueue();
  res.json({ ok: true, scheduledAt: entry.scheduledAt, status: entry.status });
});

// ── Thumbnail-only upload endpoint ─────────────────────────────────────────
// Lets the client POST a thumbnail image via multipart/form-data and get back
// a short path string. The client then includes that path in the JSON
// publish payload instead of a multi-hundred-KB base64 data URL, sidestepping
// Vercel's 4.5 MB serverless body cap entirely (the multipart upload streams
// through Vercel via forwardStreamingPost without being buffered/parsed).
app.post('/api/publish-thumbnail', upload.single('thumbnail'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No thumbnail file uploaded (expected multipart field "thumbnail")' });
  }
  // Return the path RELATIVE to UPLOADS_DIR so we control the resolution
  // surface and clients can't pass arbitrary absolute paths back at us.
  const relPath = path.relative(UPLOADS_DIR, req.file.path);
  res.json({ thumbnailPath: relPath, size: req.file.size, mimetype: req.file.mimetype });
});

// Resolve a thumbnailPath (relative to UPLOADS_DIR) into a data URL string.
// Path traversal guard: any path that resolves outside UPLOADS_DIR is rejected.
function thumbnailPathToDataUrl(relPath) {
  if (!relPath || typeof relPath !== 'string') return null;
  const abs = path.resolve(UPLOADS_DIR, relPath);
  const root = path.resolve(UPLOADS_DIR);
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    console.warn('[publish] rejected thumbnailPath outside UPLOADS_DIR:', relPath);
    return null;
  }
  if (!fs.existsSync(abs)) {
    console.warn('[publish] thumbnailPath not found on disk:', abs);
    return null;
  }
  try {
    const buf = fs.readFileSync(abs);
    const ext = (path.extname(abs) || '.jpg').toLowerCase();
    const mime = ext === '.png' ? 'image/png'
               : ext === '.webp' ? 'image/webp'
               : 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch (err) {
    console.error('[publish] failed to read thumbnailPath:', err.message);
    return null;
  }
}

app.post('/api/publish', upload.single('video'), async (req, res) => {
  let { videoPath, title, description, scheduledAt, platforms, videoUrl } = req.body;
  // Two ways to supply the thumbnail: a base64 data URL inline (legacy,
  // capped by Vercel at 4.5 MB) or a thumbnailPath returned from
  // /api/publish-thumbnail (preferred — the bytes were streamed in a
  // separate multipart request that doesn't hit the body cap).
  const sharedThumbnailDataUrl =
    typeof req.body.thumbnailDataUrl === 'string' && req.body.thumbnailDataUrl.length > 0
      ? req.body.thumbnailDataUrl
      : (typeof req.body.thumbnailPath === 'string' && req.body.thumbnailPath.length > 0
          ? thumbnailPathToDataUrl(req.body.thumbnailPath)
          : undefined);

  // If an uploaded file came through multer, prefer it.
  if (req.file) videoPath = req.file.path;

  // Reject path-traversal / out-of-allowed-roots paths.
  if (videoPath) {
    const resolved = path.resolve(videoPath);
    const outRoot = path.resolve(OUTPUT_DIR);
    const upRoot = path.resolve(UPLOADS_DIR);
    if (!resolved.startsWith(outRoot) && !resolved.startsWith(upRoot)) {
      return res.status(400).json({ error: 'videoPath outside allowed roots' });
    }
    videoPath = resolved;

    // The file must still exist on disk. If UPLOADS_DIR sits on ephemeral
    // /tmp, a Railway container restart between upload and publish wipes the
    // bytes — and a downstream fs.createReadStream(videoPath) would emit an
    // unhandled 'error' on the stream and crash the whole server. Catch it
    // up-front and tell the client to re-upload.
    if (!fs.existsSync(resolved)) {
      console.warn('[publish] videoPath missing on disk:', resolved);
      return res.status(410).json({
        error: 'Uploaded video no longer on disk (likely the backend restarted between upload and publish). Please re-upload the file and try again.',
      });
    }

    // If the file lives in UPLOADS_DIR and we have a public base URL, derive
    // a fetchable URL for Instagram. (IG requires video_url, not a local path.)
    if (!videoUrl && resolved.startsWith(upRoot) && PUBLIC_BASE_URL) {
      const rel = path.relative(upRoot, resolved).split(path.sep).map(encodeURIComponent).join('/');
      videoUrl = `${PUBLIC_BASE_URL.replace(/\/$/, '')}/uploads/${rel}`;
    }
  }

  if (!videoPath && !videoUrl) {
    return res.status(400).json({ error: 'videoPath, videoUrl, or video upload required' });
  }

  // Build the list of (platform, connectionId) targets.
  let targets = req.body.targets;
  if (typeof targets === 'string') {
    try { targets = JSON.parse(targets); } catch { targets = []; }
  }
  if (!Array.isArray(targets)) targets = [];

  // Back-compat: if the old `platforms` shape was used, map to first connection of each type.
  if (targets.length === 0 && platforms) {
    if (typeof platforms === 'string') {
      platforms = platforms.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (Array.isArray(platforms)) {
      for (const p of platforms) {
        const first = connections[p]?.[0];
        if (first) targets.push({ platform: p, id: first.id });
      }
    }
  }

  if (targets.length === 0) {
    return res.status(400).json({ error: 'No destinations selected' });
  }

  // If a shared thumbnail was sent, materialize it to disk and build a public
  // URL so Instagram (which only accepts cover_url, not file uploads) can fetch it.
  let coverUrl;
  let coverDirToCleanup;
  if (sharedThumbnailDataUrl) {
    const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(sharedThumbnailDataUrl);
    if (m && PUBLIC_BASE_URL) {
      try {
        const buf = Buffer.from(m[2], 'base64');
        const ext = m[1].includes('png') ? 'png' : 'jpg';
        const thumbId = uuidv4();
        const thumbDir = path.join(UPLOADS_DIR, `cover-${thumbId}`);
        fs.mkdirSync(thumbDir, { recursive: true });
        const thumbPath = path.join(thumbDir, `cover.${ext}`);
        fs.writeFileSync(thumbPath, buf);
        coverUrl = `${PUBLIC_BASE_URL.replace(/\/$/, '')}/uploads/cover-${thumbId}/cover.${ext}`;
        coverDirToCleanup = thumbDir;
      } catch (err) {
        console.error('[publish] failed to materialize cover:', err.message);
      }
    }
  }

  const results = [];
  for (const target of targets) {
    const { platform, id } = target;
    const key = `${platform}:${id}`;
    const conn = connections[platform]?.find(c => c.id === id);
    if (!conn) {
      results.push({ platform, id, error: 'Connection not found' });
      continue;
    }
    const opts = (target && typeof target.options === 'object' && target.options) || {};
    try {
      if (platform === 'youtube') {
        const data = await uploadToYouTube({
          tokens: conn.tokens, videoPath, title, description, scheduledAt,
          visibility: opts.visibility,
          tags: Array.isArray(opts.tags) ? opts.tags : undefined,
          madeForKids: typeof opts.madeForKids === 'boolean' ? opts.madeForKids : undefined,
          playlistIds: Array.isArray(opts.playlistIds) ? opts.playlistIds : undefined,
          thumbnailDataUrl: sharedThumbnailDataUrl,
        });
        results.push({
          platform, id, accountName: conn.name,
          url: data.id ? `https://youtu.be/${data.id}` : undefined,
          raw: data,
          scheduled: !!scheduledAt,
          scheduledAt: scheduledAt || undefined,
        });
      } else if (platform === 'facebook') {
        // Reels endpoint is the only one that supports `collaborators`.
        // Default: post as Reel. If postAsReel is explicitly false, use the
        // legacy /videos endpoint (collaborators won't apply there).
        const postAsReel = opts.postAsReel !== false;
        const data = postAsReel
          ? await uploadToFacebookReel({
              pageId: conn.id, accessToken: conn.accessToken,
              videoPath, description, scheduledAt,
              thumbnailDataUrl: sharedThumbnailDataUrl,
              collaboratorIds: Array.isArray(opts.collaboratorIds) ? opts.collaboratorIds : undefined,
              placeId: typeof opts.placeId === 'string' ? opts.placeId : undefined,
              productIds: Array.isArray(opts.productIds) ? opts.productIds : undefined,
            })
          : await uploadToFacebook({
              pageId: conn.id, accessToken: conn.accessToken,
              videoPath, title, description, scheduledAt,
              thumbnailDataUrl: sharedThumbnailDataUrl,
              taggedUserIds: Array.isArray(opts.taggedUserIds) ? opts.taggedUserIds : undefined,
              collaboratorIds: Array.isArray(opts.collaboratorIds) ? opts.collaboratorIds : undefined,
              placeId: typeof opts.placeId === 'string' ? opts.placeId : undefined,
            });
        const reelUrl = data.id ? `https://facebook.com/${data.id}` : undefined;
        // Verify what FB actually attached to the just-published Reel.
        // Mostly to diagnose collaborator issues (silent drops vs pending vs accepted).
        let fbVerify;
        if (postAsReel && data.id) {
          fbVerify = await getFacebookVideoMeta(data.id, conn.accessToken);
          console.log(`[fb verify ${data.id} t=0]`, JSON.stringify(fbVerify).slice(0, 800));
          // Re-query at 2 and 5 minutes — FB hides fields like description and
          // collaborators until the Reel finishes processing.
          for (const delaySec of [120, 300]) {
            setTimeout(async () => {
              const later = await getFacebookVideoMeta(data.id, conn.accessToken);
              console.log(`[fb verify ${data.id} t=${delaySec}s]`, JSON.stringify(later).slice(0, 800));
            }, delaySec * 1000).unref();
          }
        }
        // If the user asked to share to FB Groups, fan out to each.
        // Best-effort — failures are recorded but don't fail the main result.
        let groupShareSummary;
        if (postAsReel && Array.isArray(opts.groupIds) && opts.groupIds.length > 0 && reelUrl) {
          const ok = [];
          const fail = [];
          for (const gid of opts.groupIds) {
            try {
              await shareToFacebookGroup({
                groupId: String(gid),
                link: reelUrl,
                message: description,
                userAccessToken: conn.userAccessToken,
              });
              ok.push(gid);
            } catch (gerr) {
              fail.push({ groupId: gid, error: gerr?.response?.data?.error?.message || gerr.message });
            }
          }
          groupShareSummary = { ok, fail };
        }
        results.push({
          platform, id, accountName: conn.name,
          url: reelUrl,
          raw: data,
          groupShare: groupShareSummary,
          fbVerify,
          scheduled: !!scheduledAt,
          scheduledAt: scheduledAt || undefined,
        });
      } else if (platform === 'instagram') {
        // IG has no native scheduling — if scheduledAt is in the future,
        // enqueue and persist a copy of the media so we can fire later.
        const fireAt = scheduledAt ? new Date(scheduledAt).getTime() : 0;
        if (fireAt && fireAt > Date.now() + 60 * 1000) {
          // Re-derive the cover image source path for persistence.
          const coverSource = coverDirToCleanup
            ? fs.readdirSync(coverDirToCleanup).map(f => path.join(coverDirToCleanup, f))[0]
            : null;
          const persisted = persistForScheduledIg({
            videoPath,
            coverUrlSource: coverSource,
          });
          const entry = {
            id: persisted.id,
            platform: 'instagram',
            igAccountId: conn.id,
            accountName: conn.username,
            accessToken: conn.accessToken,
            videoUrl: persisted.videoUrl,
            coverUrl: persisted.coverUrl,
            caption: description,
            taggedUsernames: opts.taggedUsernames,
            collaboratorUsernames: opts.collaboratorUsernames,
            locationId: opts.locationId,
            productIds: opts.productIds,
            scheduledAt,
            status: 'pending',
            createdAt: new Date().toISOString(),
          };
          scheduledQueue.push(entry);
          saveScheduledQueue();
          results.push({
            platform, id,
            accountName: conn.username,
            scheduled: true,
            scheduledAt,
            scheduledId: persisted.id,
          });
          console.log(`[scheduler] queued IG ${persisted.id} for ${scheduledAt}`);
          continue; // skip immediate publish
        }
        const data = await uploadToInstagram({
          igAccountId: conn.id, accessToken: conn.accessToken,
          videoUrl, caption: description,
          coverUrl,
          taggedUsernames: Array.isArray(opts.taggedUsernames) ? opts.taggedUsernames : undefined,
          collaboratorUsernames: Array.isArray(opts.collaboratorUsernames) ? opts.collaboratorUsernames : undefined,
          locationId: typeof opts.locationId === 'string' ? opts.locationId : undefined,
          productIds: Array.isArray(opts.productIds) ? opts.productIds : undefined,
        });
        results.push({
          platform, id, accountName: conn.username,
          url: data.id ? `https://instagram.com/p/${data.id}` : undefined,
          raw: data,
        });
      } else if (platform === 'tiktok') {
        const data = await publishToTikTok({
          conn,
          videoPath,
          title,
          description,
          opts: {
            privacyLevel: typeof opts.privacyLevel === 'string' ? opts.privacyLevel : 'PUBLIC_TO_EVERYONE',
          },
        });
        results.push({
          platform, id, accountName: conn.username,
          url: data.url,
          raw: data,
          scheduled: false,
        });
      } else {
        results.push({ platform, id, error: 'Unknown platform' });
      }
    } catch (e) {
      // Surface as much Meta/Google error detail as possible.
      const data = e?.response?.data;
      const err = data?.error || {};
      const parts = [
        err.message,
        err.error_user_msg,
        err.error_user_title,
        err.error_subcode ? `subcode=${err.error_subcode}` : null,
        err.fbtrace_id ? `trace=${err.fbtrace_id}` : null,
        data?.error_description,
      ].filter(Boolean);
      const detail = parts.length
        ? parts.join(' | ')
        : (data && typeof data === 'object' ? JSON.stringify(data).slice(0, 500) : '');
      // Also log the raw payload so we can grep it from Railway logs later.
      console.error(`[publish ${platform}:${id}] ${e.message}`, data || e);
      results.push({
        platform, id,
        accountName: conn.name || conn.username,
        error: detail ? `${e.message} — ${detail}` : e.message,
      });
    }
    console.log(`[publish] ${key} done`);
  }

  // If the source was an upload (lives in UPLOADS_DIR), schedule cleanup so
  // ephemeral disk doesn't accumulate. Give Instagram time to fetch first.
  const pathsToClean = [];
  if (videoPath && path.resolve(videoPath).startsWith(path.resolve(UPLOADS_DIR))) {
    const parent = path.dirname(videoPath);
    if (parent !== UPLOADS_DIR && parent.startsWith(path.resolve(UPLOADS_DIR))) {
      pathsToClean.push(parent);
    }
  }
  if (coverDirToCleanup) pathsToClean.push(coverDirToCleanup);
  if (pathsToClean.length > 0) {
    setTimeout(() => {
      for (const p of pathsToClean) {
        try {
          fs.rmSync(p, { recursive: true, force: true });
          console.log(`[cleanup] removed ${p}`);
        } catch (err) {
          console.error('[cleanup] failed:', err.message);
        }
      }
    }, 10 * 60 * 1000).unref();
  }

  res.json({ success: true, results });
});
