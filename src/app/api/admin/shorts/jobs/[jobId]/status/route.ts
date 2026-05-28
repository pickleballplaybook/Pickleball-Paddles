import { forwardJson } from "@/lib/shortsBackend";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await ctx.params;
  return forwardJson(`/api/status/${encodeURIComponent(jobId)}`);
}
