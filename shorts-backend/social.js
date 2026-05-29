import { google } from 'googleapis';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── YOUTUBE ─────────────────────────────────────────────────────────────────

function getYouTubeClient() {
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
}

export function getYouTubeAuthUrl() {
  const oauth2Client = getYouTubeClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
    ],
    // `select_account` makes Google show the account picker even when the user
    // is already signed in, so a second YouTube channel from a different
    // Google account can be connected. `consent` keeps us getting a fresh
    // refresh_token each time.
    prompt: 'consent select_account',
  });
}

export async function exchangeYouTubeCode(code) {
  const oauth2Client = getYouTubeClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function uploadToYouTube({
  tokens, videoPath, title, description, scheduledAt,
  visibility,       // 'public' | 'unlisted' | 'private'
  tags,             // string[]
  madeForKids,      // boolean
  playlistIds,      // string[]
  thumbnailDataUrl, // 'data:image/jpeg;base64,...'
}) {
  const oauth2Client = getYouTubeClient();
  oauth2Client.setCredentials(tokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  const snippet = { title, description, categoryId: '17' };
  if (Array.isArray(tags) && tags.length > 0) snippet.tags = tags;

  const status = {
    // Scheduled posts must be private + publishAt. Otherwise honor user choice.
    privacyStatus: scheduledAt
      ? 'private'
      : (['public', 'unlisted', 'private'].includes(visibility) ? visibility : 'public'),
    ...(scheduledAt && { publishAt: new Date(scheduledAt).toISOString() }),
    ...(typeof madeForKids === 'boolean' && { selfDeclaredMadeForKids: madeForKids }),
  };

  const insertRes = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: { snippet, status },
    media: { body: fs.createReadStream(videoPath) },
  });
  const videoId = insertRes.data.id;

  // Custom thumbnail (best-effort; channel needs verification for non-default thumbnails).
  if (thumbnailDataUrl && videoId) {
    try {
      const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(thumbnailDataUrl);
      if (match) {
        const buf = Buffer.from(match[2], 'base64');
        const tmp = path.join('/tmp', `yt-thumb-${videoId}.${match[1].includes('png') ? 'png' : 'jpg'}`);
        fs.writeFileSync(tmp, buf);
        await youtube.thumbnails.set({
          videoId,
          media: { body: fs.createReadStream(tmp) },
        });
        try { fs.unlinkSync(tmp); } catch {}
      }
    } catch (err) {
      console.error('[youtube] thumbnail failed:', err?.response?.data || err.message);
    }
  }

  // Add to playlists (best-effort per playlist).
  if (Array.isArray(playlistIds) && videoId) {
    for (const playlistId of playlistIds) {
      try {
        await youtube.playlistItems.insert({
          part: ['snippet'],
          requestBody: {
            snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } },
          },
        });
      } catch (err) {
        console.error(`[youtube] playlist add failed (${playlistId}):`, err?.response?.data || err.message);
      }
    }
  }

  return insertRes.data;
}

// Lists the authenticated channel's playlists for the UI picker.
export async function listYouTubePlaylists(tokens) {
  const oauth2Client = getYouTubeClient();
  oauth2Client.setCredentials(tokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const out = [];
  let pageToken;
  do {
    const res = await youtube.playlists.list({
      part: ['snippet'],
      mine: true,
      maxResults: 50,
      pageToken,
    });
    for (const p of res.data.items || []) {
      out.push({ id: p.id, title: p.snippet?.title || p.id });
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return out;
}

// Returns the channel that the given OAuth token is associated with.
export async function getYouTubeChannel(tokens) {
  const oauth2Client = getYouTubeClient();
  oauth2Client.setCredentials(tokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const res = await youtube.channels.list({
    part: ['snippet'],
    mine: true,
  });
  const ch = res.data.items?.[0];
  if (!ch) throw new Error('No YouTube channel found for this account');
  return { id: ch.id, title: ch.snippet?.title || ch.id };
}

// ─── META (Instagram + Facebook) ─────────────────────────────────────────────

export function getMetaAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: process.env.META_REDIRECT_URI,
    scope: [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'business_management',
      'catalog_management',
    ].join(','),
    response_type: 'code',
  });
  return `https://www.facebook.com/dialog/oauth?${params}`;
}

export async function exchangeMetaCode(code) {
  const res = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
    params: {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: process.env.META_REDIRECT_URI,
      code,
    },
  });
  return res.data;
}

export async function getLongLivedToken(shortToken) {
  const res = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: shortToken,
    },
  });
  return res.data.access_token;
}

export async function getPages(accessToken) {
  const res = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
    params: { access_token: accessToken },
  });
  return res.data.data;
}

export async function getInstagramAccount(pageId, pageToken) {
  const res = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
    params: {
      fields: 'instagram_business_account',
      access_token: pageToken,
    },
  });
  return res.data.instagram_business_account?.id;
}

// Lists products in a Meta Commerce catalog for the product picker UI.
// `fields` defaults to a useful subset; you can pass more if needed.
export async function listMetaCatalogProducts(catalogId, accessToken, opts = {}) {
  const fields = opts.fields || 'id,retailer_id,name,price,image_url';
  const limit = opts.limit || 50;
  const all = [];
  let url = `https://graph.facebook.com/v19.0/${catalogId}/products`;
  let params = { access_token: accessToken, fields, limit };
  // Paginate up to 5 pages so we don't blow up for huge catalogs.
  for (let page = 0; page < 5; page++) {
    const res = await axios.get(url, { params });
    for (const item of res.data.data || []) all.push(item);
    const next = res.data.paging?.next;
    if (!next) break;
    url = next;
    params = undefined;
  }
  return all;
}

export async function getInstagramUsername(igAccountId, accessToken) {
  try {
    const res = await axios.get(`https://graph.facebook.com/v19.0/${igAccountId}`, {
      params: { fields: 'username', access_token: accessToken },
    });
    return res.data.username || null;
  } catch {
    return null;
  }
}

export async function uploadToInstagram({
  igAccountId, accessToken, videoUrl, caption,
  coverUrl,             // public URL to a JPG/PNG for the cover frame
  taggedUsernames,      // string[] — IG usernames
  collaboratorUsernames,// string[] — IG usernames (max 3)
  locationId,           // string
  productIds,           // string[] — catalog product IDs
}) {
  // Step 1: Create container
  const params = {
    media_type: 'REELS',
    video_url: videoUrl,
    caption,
    access_token: accessToken,
  };
  if (coverUrl) params.cover_url = coverUrl;
  if (locationId) params.location_id = locationId;
  if (Array.isArray(taggedUsernames) && taggedUsernames.length > 0) {
    // IG user_tags need positions; default-center anyone the user didn't position.
    params.user_tags = JSON.stringify(
      taggedUsernames.map(u => ({ username: String(u), x: 0.5, y: 0.5 }))
    );
  }
  if (Array.isArray(collaboratorUsernames) && collaboratorUsernames.length > 0) {
    params.collaborators = JSON.stringify(collaboratorUsernames.map(String));
  }
  if (Array.isArray(productIds) && productIds.length > 0) {
    // IG product_tags: [{product_id, x, y}] — center default; user can position later in IG.
    params.product_tags = JSON.stringify(
      productIds.map((pid) => ({ product_id: String(pid), x: 0.5, y: 0.5 }))
    );
  }

  const containerRes = await axios.post(
    `https://graph.facebook.com/v19.0/${igAccountId}/media`,
    null,
    { params }
  );
  const containerId = containerRes.data.id;

  // Step 2: Poll container status until Meta has fully ingested the video.
  // status_code: IN_PROGRESS → FINISHED (ready) | ERROR | EXPIRED.
  // For large Reels this can take several minutes; we cap at 10 min.
  const maxWaitMs = 10 * 60 * 1000;
  const startedAt = Date.now();
  // Initial breather so we're not hammering the API.
  await new Promise(r => setTimeout(r, 3000));
  for (;;) {
    if (Date.now() - startedAt > maxWaitMs) {
      throw new Error('Instagram container did not finish within 10 minutes');
    }
    const statusRes = await axios.get(
      `https://graph.facebook.com/v19.0/${containerId}`,
      { params: { fields: 'status_code,status', access_token: accessToken } }
    );
    const code = statusRes.data.status_code;
    if (code === 'FINISHED') break;
    if (code === 'ERROR' || code === 'EXPIRED') {
      throw new Error(`Instagram container ${code}: ${statusRes.data.status || ''}`);
    }
    // IN_PROGRESS — wait and try again.
    await new Promise(r => setTimeout(r, 5000));
  }

  // Step 3: Publish
  const publishRes = await axios.post(
    `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
    null,
    {
      params: {
        creation_id: containerId,
        access_token: accessToken,
      },
    }
  );
  return publishRes.data;
}

// Three-step resumable Reels upload. The Reels endpoint is the ONLY one that
// supports `collaborators`. Video must be 9:16 vertical, 15-90s.
export async function uploadToFacebookReel({
  pageId, accessToken, videoPath, description, scheduledAt,
  thumbnailDataUrl,
  collaboratorIds, placeId, productIds,
}) {
  // 1. Start
  const startRes = await axios.post(
    `https://graph.facebook.com/v19.0/${pageId}/video_reels`,
    null,
    { params: { upload_phase: 'start', access_token: accessToken } }
  );
  const { video_id, upload_url } = startRes.data;
  if (!video_id || !upload_url) {
    throw new Error('FB Reels start: missing video_id or upload_url');
  }

  // 2. Upload binary
  const stat = fs.statSync(videoPath);
  await axios.post(upload_url, fs.createReadStream(videoPath), {
    headers: {
      Authorization: `OAuth ${accessToken}`,
      offset: '0',
      file_size: String(stat.size),
      'Content-Type': 'application/octet-stream',
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  // 3. Finish — pass collaborators and other options here
  const finishParams = {
    upload_phase: 'finish',
    video_id,
    access_token: accessToken,
  };
  if (scheduledAt) {
    finishParams.video_state = 'SCHEDULED';
    finishParams.scheduled_publish_time = Math.floor(
      new Date(scheduledAt).getTime() / 1000
    );
  } else {
    finishParams.video_state = 'PUBLISHED';
  }
  if (description) finishParams.description = description;
  if (Array.isArray(collaboratorIds) && collaboratorIds.length > 0) {
    finishParams.collaborators = JSON.stringify(collaboratorIds.map(String));
  }
  if (placeId) finishParams.place = String(placeId);
  if (Array.isArray(productIds) && productIds.length > 0) {
    // FB Reels product_tags: [{product_id, ...}] — center positions default.
    finishParams.product_tags = JSON.stringify(
      productIds.map((pid) => ({ product_id: String(pid) }))
    );
  }

  await axios.post(
    `https://graph.facebook.com/v19.0/${pageId}/video_reels`,
    null,
    { params: finishParams }
  );

  // 4. Custom thumbnail post-publish (best effort).
  if (thumbnailDataUrl) {
    try {
      const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(thumbnailDataUrl);
      if (m) {
        const buf = Buffer.from(m[2], 'base64');
        const fd = new FormData();
        fd.append('source', buf, {
          filename: m[1].includes('png') ? 'thumb.png' : 'thumb.jpg',
          contentType: m[1],
        });
        fd.append('is_preferred', 'true');
        fd.append('access_token', accessToken);
        await axios.post(
          `https://graph.facebook.com/v19.0/${video_id}/thumbnails`,
          fd,
          {
            headers: fd.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }
        );
      }
    } catch (err) {
      console.error('[fb reel thumbnail] failed:', err?.response?.data || err.message);
    }
  }

  return { id: video_id };
}

export async function uploadToFacebook({
  pageId, accessToken, videoPath, title, description, scheduledAt,
  thumbnailDataUrl,   // string data URL
  taggedUserIds,      // string[] (FB user ids or usernames)
  collaboratorIds,    // string[]
  placeId,            // FB place id
}) {
  const formData = new FormData();
  if (title) formData.append('title', title);
  if (description) formData.append('description', description);
  formData.append('source', fs.createReadStream(videoPath));
  if (scheduledAt) {
    formData.append('scheduled_publish_time', Math.floor(new Date(scheduledAt).getTime() / 1000));
    formData.append('published', 'false');
  } else {
    formData.append('published', 'true');
  }

  // Optional: thumbnail uploaded as a binary buffer.
  if (thumbnailDataUrl) {
    const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(thumbnailDataUrl);
    if (m) {
      const buf = Buffer.from(m[2], 'base64');
      formData.append('thumb', buf, {
        filename: m[1].includes('png') ? 'thumb.png' : 'thumb.jpg',
        contentType: m[1],
      });
    }
  }

  if (Array.isArray(taggedUserIds) && taggedUserIds.length > 0) {
    // FB expects an array of { tag_uid, x, y, in_video } — we don't have positions
    // from the UI yet, so we pass minimal entries (still valid for non-positional tags).
    formData.append('tags', JSON.stringify(taggedUserIds.map(uid => ({ tag_uid: String(uid) }))));
  }
  if (Array.isArray(collaboratorIds) && collaboratorIds.length > 0) {
    formData.append('collaborators', JSON.stringify(collaboratorIds.map(String)));
  }
  if (placeId) formData.append('place', String(placeId));

  formData.append('access_token', accessToken);

  const res = await axios.post(
    `https://graph.facebook.com/v19.0/${pageId}/videos`,
    formData,
    {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  );
  return res.data;
}
