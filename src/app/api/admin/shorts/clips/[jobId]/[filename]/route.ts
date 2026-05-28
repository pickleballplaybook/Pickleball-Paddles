import { forwardStream } from "@/lib/shortsBackend";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ jobId: string; filename: string }> }
) {
  const { jobId, filename } = await ctx.params;
  // Defense in depth: the file segment is a single path component but reject anything fishy.
  if (filename.includes("/") || filename.includes("..")) {
    return Response.json({ error: "Invalid filename" }, { status: 400 });
  }
  return forwardStream(
    `/clips/${encodeURIComponent(jobId)}/${encodeURIComponent(filename)}`,
    req,
    "video/mp4"
  );
}
