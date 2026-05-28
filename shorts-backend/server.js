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
import OpenAI from 'openai';
import archiver from 'archiver';

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

const JOBS_DIR = process.env.JOBS_DIR || path.join(__dirname, 'jobs');
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, 'output');
const YTDLP_BIN = process.env.YTDLP_BIN || 'yt-dlp';
fs.mkdirSync(JOBS_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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
  await execAsync(
    `${YTDLP_BIN} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" ` +
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
