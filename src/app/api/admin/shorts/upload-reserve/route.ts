import { forwardJson } from "@/lib/shortsBackend";

// Returns the backend URL alongside the upload token so the browser
// can POST chunks directly to the backend, bypassing Vercel's 4.5 MB body limit.
const BACKEND_URL = process.env.SHORTS_BACKEND_URL || "http://localhost:3001";

export async function POST() {
  const upstream = await forwardJson("/api/upload-reserve", { method: "POST" });
  const data = await upstream.json();
  // Propagate error status — if the backend returns 401/502/etc, pass it through
  // so the frontend throws "Reserve failed" instead of silently sending undefined
  // token/exp to the chunk endpoint (which produces the cryptic "Missing or invalid
  // chunk params" error).
  if (!upstream.ok) {
    return Response.json(data, { status: upstream.status });
  }
  return Response.json({ ...data, uploadBaseUrl: BACKEND_URL });
}
