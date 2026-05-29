import { google } from 'googleapis';
import axios from 'axios';
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
    prompt: 'consent',
  });
}

export async function exchangeYouTubeCode(code) {
  const oauth2Client = getYouTubeClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function uploadToYouTube({ tokens, videoPath, title, description, scheduledAt, privacy }) {
  const oauth2Client = getYouTubeClient();
  oauth2Client.setCredentials(tokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  const resource = {
    snippet: { title, description, categoryId: '17' },
    status: {
      privacyStatus: scheduledAt ? 'private' : (privacy || 'public'),
      ...(scheduledAt && { publishAt: new Date(scheduledAt).toISOString() }),
    },
  };

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: resource,
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  return res.data;
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
    scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_posts',
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

export async function uploadToInstagram({ igAccountId, accessToken, videoUrl, caption, scheduledAt }) {
  // Step 1: Create container
  const containerRes = await axios.post(
    `https://graph.facebook.com/v19.0/${igAccountId}/media`,
    null,
    {
      params: {
        media_type: 'REELS',
        video_url: videoUrl,
        caption,
        access_token: accessToken,
      },
    }
  );
  const containerId = containerRes.data.id;

  // Step 2: Wait for container to be ready
  await new Promise(r => setTimeout(r, 15000));

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

export async function uploadToFacebook({ pageId, accessToken, videoPath, title, description, scheduledAt }) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('source', fs.createReadStream(videoPath));
  if (scheduledAt) {
    formData.append('scheduled_publish_time', Math.floor(new Date(scheduledAt).getTime() / 1000));
    formData.append('published', 'false');
  } else {
    formData.append('published', 'true');
  }
  formData.append('access_token', accessToken);

  const res = await axios.post(
    `https://graph.facebook.com/v19.0/${pageId}/videos`,
    formData,
    { headers: formData.getHeaders() }
  );
  return res.data;
}
