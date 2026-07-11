"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  hashtag: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

type FormState = {
  title: string;
  description: string;
  hashtag: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  hashtag: "",
  startsAt: "",
  endsAt: "",
  active: true,
};

// Convert an ISO string to the value shape a <input type="datetime-local">
// expects: `YYYY-MM-DDTHH:mm` in local time.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplay(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChallengesClient({ initial }: { initial: Challenge[] }) {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>(initial);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (c: Challenge) => {
    setEditingId(c.id);
    setForm({
      title: c.title,
      description: c.description,
      hashtag: c.hashtag,
      startsAt: toLocalInput(c.startsAt),
      endsAt: toLocalInput(c.endsAt),
      active: c.active,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // datetime-local inputs give a local wall-clock string with no TZ; new
    // Date() interprets that as local time, which is what admins expect.
    const payload = {
      title: form.title,
      description: form.description,
      hashtag: form.hashtag,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : "",
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : "",
      active: form.active,
    };
    try {
      const url = editingId
        ? `/api/admin/challenges/${editingId}`
        : "/api/admin/challenges";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        id?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const savedId = editingId ?? body.id ?? "";
      const saved: Challenge = {
        id: savedId,
        title: payload.title,
        description: payload.description,
        hashtag: payload.hashtag.replace(/^#+/, ""),
        startsAt: payload.startsAt,
        endsAt: payload.endsAt,
        active: payload.active,
      };
      setChallenges((prev) => {
        const without = prev.filter((c) => c.id !== savedId);
        const next = [...without, saved];
        next.sort((a, b) => {
          const at = a.startsAt ? new Date(a.startsAt).getTime() : 0;
          const bt = b.startsAt ? new Date(b.startsAt).getTime() : 0;
          return bt - at;
        });
        return next;
      });
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this challenge? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `Delete failed (${res.status})`);
      }
      setChallenges((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={submit}
        className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editingId ? "Edit challenge" : "New challenge"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-gray-400 hover:text-white"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm"
            placeholder="Kitchen line reset week"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm min-h-[100px]"
            placeholder="Post your best reset clip this week — winner gets a shoutout."
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Hashtag (without #)
          </label>
          <div className="flex items-center rounded-lg bg-gray-950 border border-gray-800 focus-within:border-accent-500">
            <span className="pl-3 text-gray-500 text-sm">#</span>
            <input
              type="text"
              value={form.hashtag}
              onChange={(e) =>
                setForm((f) => ({ ...f, hashtag: e.target.value }))
              }
              className="w-full bg-transparent px-2 py-2 text-sm outline-none"
              placeholder="ResetWeek"
              pattern="[A-Za-z0-9_]+"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Letters, numbers, and underscores only.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Starts at
            </label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, startsAt: e.target.value }))
              }
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Ends at
            </label>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, endsAt: e.target.value }))
              }
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        <label className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) =>
              setForm((f) => ({ ...f, active: e.target.checked }))
            }
            className="h-4 w-4 rounded border-gray-700 bg-gray-950"
          />
          <span className="text-sm">Active</span>
        </label>

        {error && (
          <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent-500 text-black px-5 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {busy
              ? "Saving…"
              : editingId
              ? "Save changes"
              : "Create challenge"}
          </button>
        </div>
      </form>

      <div>
        <h2 className="text-lg font-semibold mb-3">Existing challenges</h2>
        {challenges.length === 0 ? (
          <p className="text-sm text-gray-500">No challenges yet.</p>
        ) : (
          <div className="space-y-3">
            {challenges.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-800 bg-gray-900/40 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{c.title}</h3>
                      {c.active ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-900/40 border border-emerald-800/60 rounded-full px-2 py-0.5">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-800/60 border border-gray-700 rounded-full px-2 py-0.5">
                          Inactive
                        </span>
                      )}
                      <span className="text-xs text-accent-400">
                        #{c.hashtag}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">
                      {c.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDisplay(c.startsAt)} → {formatDisplay(c.endsAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-xs px-3 py-1.5 rounded-md border border-gray-700 hover:border-gray-500"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      disabled={busy}
                      className="text-xs px-3 py-1.5 rounded-md border border-red-900/60 text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
