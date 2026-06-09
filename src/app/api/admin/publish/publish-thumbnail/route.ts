import { forwardStreamingPost } from "@/lib/shortsBackend";

/**
 * Streams a multipart/form-data thumbnail upload through to the shorts-backend
 * /api/publish-thumbnail endpoint. Bypasses Vercel's 4.5 MB serverless body
 * cap because forwardStreamingPost uses a streaming request body
 * (duplex: half) — the bytes flow through without being buffered/parsed.
 *
 * Returns { thumbnailPath, size, mimetype } on success. The client then
 * includes thumbnailPath (a short string) in the JSON publish call instead
 * of a multi-hundred-KB base64 data URL.
 */
export async function POST(req: Request) {
  return forwardStreamingPost("/api/publish-thumbnail", req);
}
