import { forwardJson } from "@/lib/shortsBackend";

export async function GET() {
  return forwardJson("/auth/meta/status");
}
