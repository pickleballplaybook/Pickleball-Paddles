import { forwardStream } from "@/lib/shortsBackend";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await ctx.params;
  return forwardStream(`/api/zip/${encodeURIComponent(jobId)}`, req, "application/zip");
}
