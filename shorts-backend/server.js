import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
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
  getFacebookVideoMeta
} from './social.js';
import OpenAI from 'openai';
import archiver from 'archiver';
import multer from 'multer';
import crypto from 'crypto';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
const YTDLP_BIN = process.env.YTDLP_BIN || 'yt-dlp';
fs.mkdirSync(JOBS_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Materialize YouTube cookies from env if provided. Datacenter IPs (Railway) get
// blocked by YouTube's bot check; a cookies.txt from a real browser session bypasses it.
const COOKIES_PATH = path.join(OUTPUT_DIR, '..', 'cookies.txt');
function loadCookies() {
  const raw = process.env.YT_COOKIES_BASE64;
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
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
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Job status store (in-memory mirror; canonical state lives in output/<jobId>/meta.json)
const jobs = {};

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

// ─── ROUTES ──────────────────────────────────────────────────────────────────

app.post('/api/process', async (req, res) => {
  const { youtubeUrl } = req.body;
  if (!youtubeUrl) return res.status(400).json({ error: 'youtubeUrl is required' });

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
  };
  persistJob(jobId);
  res.json({ jobId });

  // Run async — don't await
  processVideo(jobId, jobDir, youtubeUrl).catch(err => {
    setJobStatus(jobId, { status: 'error', message: err.message });
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

// ─── PIPELINE ────────────────────────────────────────────────────────────────

async function processVideo(jobId, jobDir, youtubeUrl) {

  // 1. Download video with yt-dlp
  setJobStatus(jobId, { status: 'downloading', message: 'Downloading video…', progress: 5 });
  const videoPath = path.join(jobDir, 'video.mp4');
  const cookiesArg = YT_COOKIES_FILE ? `--cookies "${YT_COOKIES_FILE}" ` : '';
  // Use the `tv` player client — it tends to be less bot-checked than `web`.
  const clientArg = '--extractor-args "youtube:player_client=tv,web_safari" ';
  await execAsync(
    `${YTDLP_BIN} ${cookiesArg}${clientArg}` +
    `-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" ` +
    `--merge-output-format mp4 -o "${videoPath}" "${youtubeUrl}"`,
    { maxBuffer: 1024 * 1024 * 100 }
  );

  // 2. Extract audio for Whisper
  setJobStatus(jobId, { status: 'transcribing', message: 'Extracting audio…', progress: 20 });
  const audioPath = path.join(jobDir, 'audio.mp3');
  await execAsync(`ffmpeg -i "${videoPath}" -q:a 0 -map a "${audioPath}" -y`);

  // 3. Transcribe with Whisper (verbose_json gives word-level timestamps)
  setJobStatus(jobId, { status: 'transcribing', message: 'Transcribing with Whisper…', progress: 30 });
  const transcriptPath = path.join(jobDir, 'transcript.json');

  const audioReadStream = fs.createReadStream(audioPath);
  const transcription = await openai.audio.transcriptions.create({
    file: audioReadStream,
    model: 'whisper-1',
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

  const claudeResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are a short-form video expert for a pickleball YouTube channel called Pickleball Playbook. 
      
Analyze this transcript and identify the best moments to turn into YouTube Shorts (15–60 seconds each).

Rules:
- Pick up to 10 clips, but only if they're genuinely good. Quality over quantity.
- Each clip must be self-contained — a tip, story, insight, or entertaining moment that makes sense on its own.
- Prefer moments with clear actionable advice, surprising facts, or high energy.
- Clips should be 15–60 seconds long.
- Do not overlap clips.

Transcript:
${readableTranscript}

Respond ONLY with valid JSON — no preamble, no markdown fences. Format:
{
  "clips": [
    {
      "start": 12.4,
      "end": 45.2,
      "title": "Short punchy title for the clip",
      "reason": "One sentence why this makes a great short"
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

  // For 9:16 crop: use full height, crop width to height*(9/16)
  const cropW = Math.floor(height * (9 / 16));
  const cropX = Math.floor((width - cropW) / 2);
  const cropFilter = `scale=1920:1080`;

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

    await execAsync(
      `ffmpeg -ss ${clip.start} -i "${videoPath}" -t ${duration} ` +
      `-vf "${cropFilter}" -c:v libx264 -preset fast -crf 23 ` +
      `-c:a aac -b:a 128k "${outPath}" -y`,
      { maxBuffer: 1024 * 1024 * 200 }
    );

    outputClips.push({
      filename,
      url: `/clips/${jobId}/${filename}`,
      title: clip.title,
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
};

function loadConnections() {
  if (!fs.existsSync(CONNECTIONS_PATH)) return;
  try {
    const data = JSON.parse(fs.readFileSync(CONNECTIONS_PATH, 'utf-8'));
    connections.youtube = data.youtube || [];
    connections.facebook = data.facebook || [];
    connections.instagram = data.instagram || [];
    console.log(`Loaded connections: yt=${connections.youtube.length} fb=${connections.facebook.length} ig=${connections.instagram.length}`);
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
  if (!['youtube', 'facebook', 'instagram'].includes(type)) {
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
// Default to ephemeral container disk (not the persistent volume) — raw uploads
// only need to exist briefly while we publish to YT/IG/FB, and the volume is
// reserved for clips + connections.
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/tmp/shorts-uploads';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || '';
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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
loadScheduledQueue();
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
  const exp = Date.now() + 30 * 60 * 1000; // 30 min
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
//   POST /api/file-upload/<id>/chunk?token=…&exp=…&index=0&total=N&filename=x
//     body: raw bytes of chunk 0 (first chunk → file is truncated/created)
//   POST … &index=1&total=N… body: raw bytes of chunk 1 (appended)
//   …
//   POST … &index=N-1&total=N… body: raw bytes of last chunk → response: { done: true, path }
app.post('/api/file-upload/:uploadId/chunk', (req, res) => {
  const { uploadId } = req.params;
  const token = String(req.query.token || '');
  const exp = Number(req.query.exp || 0);
  const index = Number(req.query.index);
  const total = Number(req.query.total);
  const filename = String(req.query.filename || 'upload.bin')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 200) || 'upload.bin';

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
  const finalPath = path.join(dir, filename);

  // First chunk creates/truncates; subsequent chunks append.
  const writeStream = fs.createWriteStream(finalPath, {
    flags: index === 0 ? 'w' : 'a',
  });
  let aborted = false;
  req.on('aborted', () => { aborted = true; writeStream.destroy(); });
  writeStream.on('error', err => {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  });
  writeStream.on('finish', () => {
    if (aborted) return;
    if (index === total - 1) {
      usedUploadTokens.add(uploadId);
      res.json({ done: true, path: finalPath });
    } else {
      res.json({ done: false, index });
    }
  });
  req.pipe(writeStream);
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

app.post('/api/publish', upload.single('video'), async (req, res) => {
  let { videoPath, title, description, scheduledAt, platforms, videoUrl } = req.body;
  const sharedThumbnailDataUrl =
    typeof req.body.thumbnailDataUrl === 'string' ? req.body.thumbnailDataUrl : undefined;

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
