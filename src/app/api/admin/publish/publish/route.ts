import { forwardJson, forwardStreamingPost } from "@/lib/shortsBackend";

// A multi-destination publish runs YT → FB(s) → IG serially upstream and can
// take 2–3 minutes end to end. Bump to the platform max so the request can
// finish; without this the connection is killed mid-flight and the browser
// surfaces a misleading "Failed to fetch" even though Railway completed the
// work (the failed-fetch case loses the per-destination results array).
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.startsWith("multipart/")) {
    return forwardStreamingPost("/api/publish", req);
  }
  const body = await req.json().catch(() => ({}));
  return forwardJson("/api/publish", { method: "POST", body });
}
