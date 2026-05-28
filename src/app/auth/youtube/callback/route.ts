import { forwardStream } from "@/lib/shortsBackend";

export async function GET(req: Request) {
  const search = new URL(req.url).search;
  return forwardStream(`/auth/youtube/callback${search}`, req, "text/html");
}
