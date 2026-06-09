import { forwardJson } from "@/lib/shortsBackend";

/**
 * GET /api/admin/publish/scheduled
 * --------------------------------
 * Lists scheduled Instagram posts held in the shorts-backend queue.
 * (YouTube + Facebook scheduled posts live on those platforms once
 * submitted — they're managed in YouTube Studio / Meta Business Suite,
 * not here.)
 */
export async function GET() {
  return forwardJson("/api/scheduled");
}
