"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

// Fires the /api/admin/stripe-backfill route. That route paginates every
// Stripe subscription and upserts subscription_mirror — the source of
// truth for the admin funnel + landing views. Useful when the webhook
// has missed events and the mirror is out of sync with Stripe (users
// showing as CANCELED here while Stripe shows them ACTIVE, etc.).
export default function SyncFromStripeButton() {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<string>("");

  const run = async () => {
    if (state === "running") return;
    setState("running");
    setResult("Scanning every Stripe subscription — this can take up to 5 minutes for large accounts…");
    try {
      const res = await fetch("/api/admin/stripe-backfill", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        scanned?: number;
        upserted?: number;
        skipped?: number;
        errors?: string[];
      };
      if (!res.ok) {
        setState("error");
        setResult(`HTTP ${res.status} — ${JSON.stringify(body)}`);
        return;
      }
      const errCount = body.errors?.length ?? 0;
      setState(errCount > 0 ? "error" : "done");
      setResult(
        `Scanned ${body.scanned ?? 0} · Upserted ${body.upserted ?? 0} · Skipped ${body.skipped ?? 0}${
          errCount > 0 ? ` · ${errCount} error(s): ${body.errors?.[0]}` : ""
        }. Refresh to see updated statuses.`,
      );
    } catch (err) {
      setState("error");
      setResult(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={run}
        disabled={state === "running"}
        className="inline-flex items-center gap-2 text-xs font-bold py-2 px-3 rounded-lg transition active:scale-[0.98] disabled:opacity-60"
        style={{
          background: "rgba(96,165,250,0.12)",
          color: "#60a5fa",
          border: "1px solid rgba(96,165,250,0.35)",
        }}
        title="Re-sync the local subscription_mirror from Stripe. Fixes stale rows where Stripe shows Active but the admin page shows Canceled (or vice versa)."
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${state === "running" ? "animate-spin" : ""}`}
        />
        {state === "running" ? "Syncing from Stripe…" : "Sync from Stripe"}
      </button>
      {result && (
        <p
          className="text-[11px] mt-2 leading-relaxed"
          style={{
            color:
              state === "error"
                ? "#ef4444"
                : state === "done"
                ? "#22c55e"
                : "var(--text-muted)",
          }}
        >
          {result}
        </p>
      )}
    </div>
  );
}
