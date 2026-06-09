import { forwardJson } from "@/lib/shortsBackend";

/**
 * DELETE /api/admin/publish/scheduled/[id]
 * ----------------------------------------
 * Removes an Instagram scheduled post from the backend queue and
 * deletes its on-disk video + cover. 404 if not found, 409 if the
 * post has already been published.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return forwardJson(`/api/scheduled/${encodeURIComponent(params.id)}`, {
    method: "DELETE",
  });
}

/**
 * PATCH /api/admin/publish/scheduled/[id]
 * ---------------------------------------
 * Updates the scheduled-at timestamp of a pending Instagram post.
 * Body: { scheduledAt: ISO string, at least 1 minute in the future }.
 * Resets entries from the "error" state back to "pending" so they
 * get re-attempted on the new time.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json().catch(() => ({}));
  return forwardJson(`/api/scheduled/${encodeURIComponent(params.id)}`, {
    method: "PATCH",
    body,
  });
}
