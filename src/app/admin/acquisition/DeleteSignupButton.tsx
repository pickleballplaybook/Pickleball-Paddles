"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

/**
 * Trash icon for each row in /admin/acquisition's debug list. Confirms
 * before hitting the delete endpoint so a misclick doesn't nuke a real
 * user's record. On success we router.refresh() — Next.js re-runs the
 * page's server-side data fetch and the row disappears.
 */
export default function DeleteSignupButton({
  uid,
  email,
}: {
  uid: string;
  email: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const label = email || uid;
    if (!confirm(`Delete signup record for ${label}?\n\nThis removes them from /admin/acquisition AND /admin/email. The Firebase Auth account is preserved — if it was a real user they can re-onboard.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${uid}/delete`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Delete failed: ${data.error ?? res.statusText}`);
        setBusy(false);
        return;
      }
      router.refresh();
    } catch (e) {
      alert(`Delete failed: ${e instanceof Error ? e.message : "network error"}`);
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      title="Delete this signup record"
      style={{
        background: "transparent",
        border: "none",
        cursor: busy ? "wait" : "pointer",
        padding: 4,
        display: "flex",
        alignItems: "center",
        opacity: busy ? 0.5 : 0.6,
        color: "#ef4444",
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!busy) e.currentTarget.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        if (!busy) e.currentTarget.style.opacity = "0.6";
      }}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
