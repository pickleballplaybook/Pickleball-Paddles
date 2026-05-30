import { forwardJson } from "@/lib/shortsBackend";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ jobId: string; filename: string }> }
) {
  const { jobId, filename } = await ctx.params;
  if (filename.includes("/") || filename.includes("..")) {
    return Response.json({ error: "Invalid filename" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  return forwardJson(
    `/api/clips/${encodeURIComponent(jobId)}/${encodeURIComponent(filename)}/edit`,
    { method: "POST", body }
  );
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ jobId: string; filename: string }> }
) {
  const { jobId, filename } = await ctx.params;
  if (filename.includes("/") || filename.includes("..")) {
    return Response.json({ error: "Invalid filename" }, { status: 400 });
  }
  return forwardJson(
    `/api/clips/${encodeURIComponent(jobId)}/${encodeURIComponent(filename)}/edit`,
    { method: "DELETE" }
  );
}
