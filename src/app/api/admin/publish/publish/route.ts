import { forwardJson, forwardStreamingPost } from "@/lib/shortsBackend";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.startsWith("multipart/")) {
    return forwardStreamingPost("/api/publish", req);
  }
  const body = await req.json().catch(() => ({}));
  return forwardJson("/api/publish", { method: "POST", body });
}
