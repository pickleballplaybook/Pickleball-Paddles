import { forwardJson } from "@/lib/shortsBackend";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await ctx.params;
  return forwardJson(`/api/youtube/${encodeURIComponent(channelId)}/playlists`);
}
