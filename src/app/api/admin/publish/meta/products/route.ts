import { forwardJson } from "@/lib/shortsBackend";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const connectionType = url.searchParams.get("connectionType") || "";
  const connectionId = url.searchParams.get("connectionId") || "";
  const qs = new URLSearchParams({ connectionType, connectionId }).toString();
  return forwardJson(`/api/meta/products?${qs}`);
}
