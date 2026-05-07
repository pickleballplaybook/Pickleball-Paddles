/**
 * Meta Graph API senders for Instagram + Facebook.
 *
 * Two operations per platform:
 *   1. Reply to a comment publicly
 *   2. Send a private DM
 *
 * IG and FB have slightly different endpoints/shapes - we handle each separately.
 *
 * All functions return a discriminated result type rather than throwing,
 * so the caller can write structured outcomes to the auto_reply_logs table.
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string; code?: number; subcode?: number };

// ---------------------------------------------------------------------------
// Public reply to a comment
// ---------------------------------------------------------------------------

/**
 * Reply to an Instagram comment.
 * Endpoint: POST /{ig-comment-id}/replies
 *   Body: message=<text>
 * Returns the new reply's id.
 */
export async function replyToInstagramComment(opts: {
  commentId: string;
  message: string;
  accessToken: string;
}): Promise<SendResult> {
  return await postForm(`${GRAPH_BASE}/${opts.commentId}/replies`, {
    message: opts.message,
    access_token: opts.accessToken,
  });
}

/**
 * Reply to a Facebook Page comment.
 * Endpoint: POST /{fb-comment-id}/comments
 *   Body: message=<text>
 * (Yes - to reply to a comment on FB you POST to /comments. Different from IG.)
 */
export async function replyToFacebookComment(opts: {
  commentId: string;
  message: string;
  pageAccessToken: string;
}): Promise<SendResult> {
  return await postForm(`${GRAPH_BASE}/${opts.commentId}/comments`, {
    message: opts.message,
    access_token: opts.pageAccessToken,
  });
}

// ---------------------------------------------------------------------------
// Direct messages
// ---------------------------------------------------------------------------

/**
 * Send an IG DM in response to a comment.
 *
 * The "private replies" mechanism lets you DM someone who commented on your
 * post within 7 days, without needing them to message you first.
 *
 * Endpoint: POST /{ig-business-account-id}/messages
 *   Body JSON: { recipient: { comment_id }, message: { text } }
 *
 * If a CTA link is provided we append it to the text (IG doesn't support
 * structured buttons via this endpoint without further Messenger setup).
 */
export async function sendInstagramPrivateReply(opts: {
  igBusinessAccountId: string;
  commentId: string;
  message: string;
  ctaLink?: string | null;
  accessToken: string;
}): Promise<SendResult> {
  const body: any = {
    recipient: { comment_id: opts.commentId },
    message: {
      text: opts.ctaLink ? `${opts.message}\n\n${opts.ctaLink}` : opts.message,
    },
  };

  return await postJson(
    `${GRAPH_BASE}/${opts.igBusinessAccountId}/messages?access_token=${encodeURIComponent(
      opts.accessToken
    )}`,
    body
  );
}

/**
 * Send a Facebook Page DM in response to a comment ("private reply").
 *
 * Endpoint: POST /{page-id}/messages
 *   Body JSON: { recipient: { comment_id }, message: { text } }
 *
 * Page-scoped Messenger has a 7-day window from the original comment.
 */
export async function sendFacebookPrivateReply(opts: {
  pageId: string;
  commentId: string;
  message: string;
  ctaLink?: string | null;
  pageAccessToken: string;
}): Promise<SendResult> {
  const body: any = {
    recipient: { comment_id: opts.commentId },
    message: {
      text: opts.ctaLink ? `${opts.message}\n\n${opts.ctaLink}` : opts.message,
    },
  };

  return await postJson(
    `${GRAPH_BASE}/${opts.pageId}/messages?access_token=${encodeURIComponent(
      opts.pageAccessToken
    )}`,
    body
  );
}

// ---------------------------------------------------------------------------
// Low-level HTTP helpers
// ---------------------------------------------------------------------------

async function postForm(
  url: string,
  fields: Record<string, string>
): Promise<SendResult> {
  const body = new URLSearchParams(fields).toString();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    return await parseGraphResponse(res);
  } catch (err: any) {
    return { ok: false, error: `network: ${err?.message || String(err)}` };
  }
}

async function postJson(url: string, body: any): Promise<SendResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await parseGraphResponse(res);
  } catch (err: any) {
    return { ok: false, error: `network: ${err?.message || String(err)}` };
  }
}

async function parseGraphResponse(res: Response): Promise<SendResult> {
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    return { ok: false, error: `non-json response (status ${res.status})` };
  }

  if (!res.ok || json?.error) {
    const e = json?.error || {};
    return {
      ok: false,
      error: e.message || `HTTP ${res.status}`,
      code: e.code,
      subcode: e.error_subcode,
    };
  }

  // Success shape varies: comments return { id: "..." }, messages return { recipient_id, message_id }
  const id = json.id || json.message_id || json.recipient_id || "ok";
  return { ok: true, id: String(id) };
}
