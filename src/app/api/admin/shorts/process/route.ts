import { forwardJson } from "@/lib/shortsBackend";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return forwardJson("/api/process", { method: "POST", body });
}
