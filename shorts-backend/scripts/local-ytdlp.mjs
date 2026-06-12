#!/usr/bin/env node
// Run yt-dlp on your laptop (your residential IP, no bot-check) and stream
// the resulting video to Railway, then kick off the same AI clip-selection
// pipeline that /api/process would have run. Use when YouTube is blocking
// Railway's egress IP (which is most of the time on a datacenter host).
//
// Usage:
//   node scripts/local-ytdlp.mjs <YouTube URL>
//   node scripts/local-ytdlp.mjs --file ./already-downloaded.mp4 [--source-url URL]
//
// Env vars (or pass via --backend / --token):
//   SHORTS_BACKEND_URL    e.g. https://shorts-backend-production.up.railway.app
//   SHORTS_BACKEND_TOKEN  the bearer token Railway's server.js validates
//
// Tip: stash these in shorts-backend/.env (already gitignored).

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const opts = { youtubeUrl: '', file: '', backend: '', token: '', sourceUrl: '' };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--file') opts.file = args[++i];
  else if (a === '--source-url') opts.sourceUrl = args[++i];
  else if (a === '--backend') opts.backend = args[++i];
  else if (a === '--token') opts.token = args[++i];
  else if (!opts.youtubeUrl && !a.startsWith('--')) opts.youtubeUrl = a;
}

const BACKEND = opts.backend || process.env.SHORTS_BACKEND_URL || '';
const TOKEN = opts.token || process.env.SHORTS_BACKEND_TOKEN || '';
if (!BACKEND) die('Missing SHORTS_BACKEND_URL (env or --backend).');
if (!TOKEN) die('Missing SHORTS_BACKEND_TOKEN (env or --token).');

if (!opts.youtubeUrl && !opts.file) {
  die('Usage: local-ytdlp.mjs <YouTube URL>   OR   --file <path> [--source-url URL]');
}

function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

async function run() {
  const cleanupPaths = [];
  process.on('exit', () => {
    for (const p of cleanupPaths) {
      try { fs.rmSync(p, { force: true, recursive: true }); } catch {}
    }
  });

  // ── 1. Acquire the local video file ────────────────────────────────────
  let videoPath;
  let sourceUrl = opts.sourceUrl || opts.youtubeUrl || '';
  if (opts.file) {
    videoPath = path.resolve(opts.file);
    if (!fs.existsSync(videoPath)) die(`File not found: ${videoPath}`);
    console.log(`[1/3] Using local file: ${videoPath}`);
  } else {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'local-ytdlp-'));
    cleanupPaths.push(tmpDir);
    videoPath = path.join(tmpDir, 'video.mp4');
    console.log(`[1/3] Downloading via yt-dlp → ${videoPath}`);
    await runYtDlp(opts.youtubeUrl, videoPath);
  }
  const size = fs.statSync(videoPath).size;
  console.log(`      ${fmtBytes(size)} ready`);

  // ── 2. Chunk-upload to Railway ─────────────────────────────────────────
  console.log(`[2/3] Reserving upload slot at ${BACKEND}`);
  const reserveRes = await fetch(`${BACKEND}/api/upload-reserve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!reserveRes.ok) die(`upload-reserve failed (${reserveRes.status}): ${await reserveRes.text()}`);
  const { uploadId, token: uploadToken, exp } = await reserveRes.json();

  const CHUNK_SIZE = 5 * 1024 * 1024;
  const total = Math.max(1, Math.ceil(size / CHUNK_SIZE));
  const filename = path.basename(videoPath).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200) || 'video.mp4';
  const baseChunkUrl =
    `${BACKEND}/api/file-upload/${encodeURIComponent(uploadId)}/chunk?` +
    `token=${encodeURIComponent(uploadToken)}&exp=${exp}&total=${total}` +
    `&chunkSize=${CHUNK_SIZE}&filename=${encodeURIComponent(filename)}`;

  console.log(`      ${total} chunk${total === 1 ? '' : 's'} of ${fmtBytes(CHUNK_SIZE)}`);

  const fd = fs.openSync(videoPath, 'r');
  let finalPath = null;
  try {
    for (let i = 0; i < total; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, size);
      const length = end - start;
      const buf = Buffer.alloc(length);
      fs.readSync(fd, buf, 0, length, start);

      const url = `${baseChunkUrl}&index=${i}`;
      const body = await uploadChunkWithRetry(url, buf);
      const pct = Math.round(((i + 1) / total) * 100);
      process.stdout.write(`\r      chunk ${i + 1}/${total} (${pct}%)   `);
      if (body.done && body.path) finalPath = body.path;
    }
  } finally {
    fs.closeSync(fd);
  }
  process.stdout.write('\n');
  if (!finalPath) die('Upload finished without a final path.');
  console.log(`      uploaded → ${finalPath}`);

  // ── 3. Kick off processing ─────────────────────────────────────────────
  console.log(`[3/3] Starting AI clip selection…`);
  const processRes = await fetch(`${BACKEND}/api/process-local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ videoPath: finalPath, sourceUrl }),
  });
  if (!processRes.ok) die(`process-local failed (${processRes.status}): ${await processRes.text()}`);
  const { jobId } = await processRes.json();

  console.log('');
  console.log(`✓ Job started: ${jobId}`);
  console.log(`  Track progress at: ${BACKEND.replace(/\/$/, '')}/api/status/${jobId}`);
  console.log(`  Or open /admin/shorts → History on the web app.`);
}

async function uploadChunkWithRetry(url, buf) {
  const MAX_ATTEMPTS = 5;
  let lastErr;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buf,
      });
      const text = await r.text();
      if (!r.ok) {
        // 4xx is a logical error (bad token, expired, etc.) — don't retry.
        if (r.status >= 400 && r.status < 500) {
          throw new Error(`chunk rejected (${r.status}): ${text.slice(0, 200)}`);
        }
        throw new Error(`chunk failed (${r.status}): ${text.slice(0, 200)}`);
      }
      try { return JSON.parse(text); } catch { return {}; }
    } catch (err) {
      lastErr = err;
      const msg = err.message || String(err);
      const isTransient =
        msg.includes('network') ||
        msg.includes('ECONNRESET') ||
        msg.includes('fetch failed') ||
        msg.startsWith('chunk failed (5');
      if (!isTransient || attempt === MAX_ATTEMPTS - 1) throw err;
      const delay = Math.min(8000, 500 * 2 ** attempt) + Math.random() * 250;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr || new Error('chunk failed');
}

function runYtDlp(url, outPath) {
  return new Promise((resolve, reject) => {
    // Format preference matches what the Railway pipeline expects: prefer
    // a pre-muxed HD MP4 so no ffmpeg merge is needed; fall back to a
    // bestvideo+bestaudio merge if no pre-muxed stream exists.
    const fmt =
      'best[height>=1080][ext=mp4]/best[height>=720][ext=mp4]/' +
      'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
    const args = [
      '-f', fmt,
      '--merge-output-format', 'mp4',
      '-o', outPath,
      url,
    ];
    const child = spawn('yt-dlp', args, { stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error(
          'yt-dlp not found on PATH.\n' +
          '  Install with:  brew install yt-dlp   (macOS Homebrew)\n' +
          '                pipx install yt-dlp   (Linux/cross-platform)'
        ));
      } else {
        reject(err);
      }
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited with code ${code}`));
    });
  });
}

run().catch((err) => die(err.message || String(err)));
