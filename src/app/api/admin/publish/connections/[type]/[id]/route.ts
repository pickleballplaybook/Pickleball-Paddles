import { forwardJson } from "@/lib/shortsBackend";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await ctx.params;
  return forwardJson(
    `/auth/connections/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
