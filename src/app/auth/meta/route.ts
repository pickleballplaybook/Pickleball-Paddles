import { forwardRedirect } from "@/lib/shortsBackend";

export async function GET() {
  return forwardRedirect("/auth/meta");
}
