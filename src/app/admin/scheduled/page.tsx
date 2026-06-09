"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "../_components/AdminNav";

type ScheduledItem = {
  id: string;
  platform: "instagram"; // backend currently only persists IG scheduled posts
  accountId: string;
  accountName?: string;
  scheduledAt: string;        // ISO
  status: "pending" | "publishing" | "published" | "error" | string;
  error?: string;
  publishedId?: string;
  caption?: string;
};

function formatLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

// HTML <input type="datetime-local"> expects "YYYY-MM-DDTHH:mm" in LOCAL time.
function isoToLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" + pad(d.getMonth() + 1) +
    "-" + pad(d.getDate()) +
    "T" + pad(d.getHours()) +
    ":" + pad(d.getMinutes())
  );
}

// Convert "YYYY-MM-DDTHH:mm" back to an ISO string (treats input as local).
function localInputValueToIso(local: string): string {
  // Date() parses "YYYY-MM-DDTHH:mm" as local time, which is what we want.
  const d = new Date(local);
  return d.toISOString();
}

function statusBadge(status: string): string {
  switch (status) {
    case "published":
      return "bg-accent-500/10 text-accent-400 border-accent-500/30";
    case "error":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    case "publishing":
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "pending":
    default:
      return "bg-gray-700/40 text-gray-300 border-gray-700";
  }
}

export default function ScheduledPage() {
  const [items, setItems]     = useState<ScheduledItem[] | null>(null);
  const [error, setError]     = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({}); // id → local datetime value while editing
  const [busyId, setBusyId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/publish/scheduled", { cache: "no-store" });
      if (!r.ok) throw new Error(`Failed to load (${r.status})`);
      const d = await r.json();
      setItems(Array.isArray(d.scheduled) ? d.scheduled : []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this scheduled post? The video + cover will be removed from the backend volume.")) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/admin/publish/scheduled/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(t || `Delete failed (${r.status})`);
      }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  function startEditing(item: ScheduledItem) {
    setEditing((prev) => ({ ...prev, [item.id]: isoToLocalInputValue(item.scheduledAt) }));
  }
  function cancelEditing(id: string) {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function saveEditing(id: string) {
    const local = editing[id];
    if (!local) return;
    setBusyId(id);
    try {
      const iso = localInputValueToIso(local);
      const r = await fetch(`/api/admin/publish/scheduled/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: iso }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Update failed (${r.status})`);
      }
      cancelEditing(id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  const upcoming = (items ?? []).filter((i) => i.status !== "published");
  const past     = (items ?? []).filter((i) => i.status === "published");

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <AdminNav />

        <header className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Scheduled posts</h1>
          <p className="text-sm text-gray-400">
            Instagram posts queued by the publish flow. Edit the scheduled time or delete one
            before it fires. <span className="text-gray-500">(YouTube + Facebook scheduled posts live on those platforms — manage them in YouTube Studio or Meta Business Suite.)</span>
          </p>
        </header>

        <button
          onClick={load}
          className="mb-6 text-sm text-accent-400 hover:text-accent-300"
        >
          ↻ Refresh
        </button>

        {error && (
          <p className="text-sm text-red-400 mb-4">{error}</p>
        )}

        {items === null ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 px-6 py-12 text-center">
            <p className="text-sm text-gray-400 mb-2">No scheduled posts.</p>
            <Link href="/admin/publish" className="text-sm text-accent-400 hover:text-accent-300">
              Schedule one from the Publish page →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-2.5">
                  {upcoming.map((item) => {
                    const isEditing = editing[item.id] != null;
                    const isBusy    = busyId === item.id;
                    return (
                      <article
                        key={item.id}
                        className="rounded-xl border border-gray-800 bg-gray-900 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              Instagram · {item.accountName || item.accountId}
                            </p>
                            {isEditing ? (
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <input
                                  type="datetime-local"
                                  value={editing[item.id]}
                                  onChange={(e) =>
                                    setEditing((prev) => ({ ...prev, [item.id]: e.target.value }))
                                  }
                                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm outline-none"
                                />
                                <button
                                  onClick={() => saveEditing(item.id)}
                                  disabled={isBusy}
                                  className="text-xs font-semibold px-3 py-1 rounded bg-accent-500 text-black hover:bg-accent-400 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => cancelEditing(item.id)}
                                  disabled={isBusy}
                                  className="text-xs font-semibold px-3 py-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Scheduled for{" "}
                                <span className="text-gray-200 font-medium">{formatLocal(item.scheduledAt)}</span>
                              </p>
                            )}
                          </div>
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBadge(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        {item.caption && (
                          <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                            {item.caption}
                          </p>
                        )}

                        {item.error && (
                          <p className="text-xs text-red-400 mb-3">⚠ {item.error}</p>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => startEditing(item)}
                              disabled={isBusy}
                              className="px-3 py-1 rounded border border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                              Edit time
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={isBusy}
                              className="px-3 py-1 rounded border border-red-700/50 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              {isBusy ? "…" : "Delete"}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Already published ({past.length})
                </h2>
                <div className="space-y-2 opacity-70">
                  {past.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          Instagram · {item.accountName || item.accountId}
                        </p>
                        <p className="text-xs text-gray-500">
                          Fired at {formatLocal(item.scheduledAt)}
                          {item.publishedId ? ` · ${item.publishedId}` : ""}
                        </p>
                      </div>
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBadge(item.status)}`}>
                        published
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
