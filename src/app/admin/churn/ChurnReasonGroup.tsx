"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

type Row = {
  id: string;
  userId: string | null;
  email: string | null;
  name: string | null;
  reason: string;
  comment: string | null;
  plan: string | null;
  platform: string | null;
  createdAt: string | null;
};

const PAGE_SIZE = 3;

// A single reason's cancellations rendered as a collapsible group with a
// 3-at-a-time carousel inside. Top-of-list reasons default to open so the
// most-actionable feedback is visible immediately; less common reasons stay
// collapsed so the page doesn't read as one endless list.
export default function ChurnReasonGroup({
  reason,
  rows,
  total,
  defaultOpen,
}: {
  reason: string;
  rows: Row[];
  total: number;
  defaultOpen: boolean;
}) {
  const router = useRouter();
  const [start, setStart] = useState(0);
  // Optimistic-remove set so the row disappears immediately on delete instead
  // of waiting for the server-side refresh round-trip. The router.refresh()
  // call after the API succeeds re-renders the server component with the
  // updated Firestore data, at which point this local state is moot.
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const filtered = rows.filter((r) => !removed.has(r.id));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.floor(start / PAGE_SIZE) + 1;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const pct = total > 0 ? Math.round((filtered.length / total) * 100) : 0;

  function goPrev() {
    setStart((s) => Math.max(0, s - PAGE_SIZE));
  }
  function goNext() {
    setStart((s) => Math.min((pageCount - 1) * PAGE_SIZE, s + PAGE_SIZE));
  }

  async function deleteRow(id: string) {
    if (deletingId) return;
    if (!confirm("Delete this cancellation entry? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/churn/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Delete failed (${res.status})`);
      }
      // Optimistically hide it; then refresh so the server-rendered counts
      // (top stats, histogram) update too.
      setRemoved((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl overflow-hidden"
      style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
    >
      <summary
        className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-transform group-open:rotate-45 text-base font-bold"
            style={{
              background: "rgba(239,68,68,0.12)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.40)",
            }}
            aria-hidden
          >
            +
          </span>
          <p className="text-base font-bold truncate" style={{ color: "var(--text-primary)" }}>
            {reason}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
            {filtered.length} · {pct}%
          </span>
          <span
            className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded"
            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
          >
            {filtered.length === 1 ? "1 user" : `${filtered.length} users`}
          </span>
        </div>
      </summary>

      <div
        className="px-5 pb-5 pt-1"
        style={{ borderTop: "1px solid var(--flip-card-border)" }}
      >
        {/* Carousel controls — only render when there's more than one page */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between mt-4 mb-3">
            <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>
              {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={start === 0}
                aria-label="Older page"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition disabled:opacity-30 hover:scale-105"
                style={{ background: "var(--flip-divider)", border: "1px solid var(--flip-card-border)", color: "var(--text-primary)" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs tabular-nums px-1" style={{ color: "var(--text-muted)" }}>
                {currentPage} / {pageCount}
              </span>
              <button
                onClick={goNext}
                disabled={start + PAGE_SIZE >= filtered.length}
                aria-label="Newer page"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition disabled:opacity-30 hover:scale-105"
                style={{ background: "var(--flip-divider)", border: "1px solid var(--flip-card-border)", color: "var(--text-primary)" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-3">
          {visible.map((r) => (
            <li
              key={r.id}
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--flip-card-border)" }}
            >
              <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {r.email || "(no email on file)"}
                  {r.name ? ` · ${r.name}` : ""}
                </p>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  {r.plan && (
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{
                        background: r.plan.toLowerCase().includes("pro")
                          ? "rgba(222, 250, 50, 0.15)"
                          : "rgba(60, 172, 174, 0.15)",
                        color: r.plan.toLowerCase().includes("pro") ? "#defa32" : "#3cacae",
                        fontWeight: 600,
                        fontSize: 10,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {r.plan}
                    </span>
                  )}
                  {r.platform && <span style={{ fontSize: 11 }}>{r.platform}</span>}
                  {r.createdAt && (
                    <span style={{ fontSize: 11 }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  )}
                  <button
                    onClick={() => deleteRow(r.id)}
                    disabled={deletingId === r.id}
                    aria-label="Delete this entry"
                    title="Delete"
                    className="w-7 h-7 rounded-md flex items-center justify-center transition disabled:opacity-30 hover:scale-105 ml-1"
                    style={{
                      background: "rgba(239,68,68,0.10)",
                      border: "1px solid rgba(239,68,68,0.35)",
                      color: "#ef4444",
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {r.comment && r.comment.trim().length > 0 && (
                <p className="text-sm italic" style={{ color: "var(--text-primary)" }}>
                  &ldquo;{r.comment}&rdquo;
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
