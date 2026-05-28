import { forwardJson } from "@/lib/shortsBackend";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await ctx.params;
  return forwardJson(`/api/jobs/${encodeURIComponent(jobId)}`, { method: "DELETE" });
}
