"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

// Small inline action button. Confirms, hits the delete API, then refreshes
// the server-rendered page so the counts/stats update from the union source.

export default function DeleteRowButton({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy) return;
    if (!confirm(`Hide ${email} from the email list? You can't undo this from the admin UI.`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/email/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Delete failed (${res.status})`);
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      aria-label={`Delete ${email}`}
      title="Delete from list"
      className="w-7 h-7 rounded-md flex items-center justify-center transition disabled:opacity-30 hover:scale-105"
      style={{
        background: "rgba(239,68,68,0.10)",
        border: "1px solid rgba(239,68,68,0.35)",
        color: "#ef4444",
      }}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
