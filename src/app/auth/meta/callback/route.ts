import { forwardStream } from "@/lib/shortsBackend";

export async function GET(req: Request) {
  const search = new URL(req.url).search;
  return forwardStream(`/auth/meta/callback${search}`, req, "text/html");
}
