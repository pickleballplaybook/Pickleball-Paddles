"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type LessonCategory = {
  id: string;
  title: string;
  description: string;
  minLevel: number;
  requiresPro: boolean;
  order: number;
  isActive: boolean;
};

type FormState = {
  id: string;
  title: string;
  description: string;
  minLevel: number;
  requiresPro: boolean;
  order: number;
  isActive: boolean;
};

const EMPTY: FormState = {
  id: "",
  title: "",
  description: "",
  minLevel: 3,
  requiresPro: true,
  order: 0,
  isActive: true,
};

const LEVELS = Array.from({ length: 12 }, (_, i) => i + 1);

export function LessonsClient({ initial }: { initial: LessonCategory[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState<LessonCategory[]>(initial);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = editingId !== null;

  const startEdit = (c: LessonCategory) => {
    setEditingId(c.id);
    setForm({
      id: c.id,
      title: c.title,
      description: c.description,
      minLevel: c.minLevel,
      requiresPro: c.requiresPro,
      order: c.order,
      isActive: c.isActive,
    });
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditing) {
        const res = await fetch(`/api/admin/lessons/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            minLevel: form.minLevel,
            requiresPro: form.requiresPro,
            order: form.order,
            isActive: form.isActive,
          }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) throw new Error(json.error ?? "Update failed.");
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? { ...c, title: form.title, description: form.description, minLevel: form.minLevel, requiresPro: form.requiresPro, order: form.order, isActive: form.isActive }
              : c
          )
        );
        setSuccess(`"${form.title}" updated.`);
        resetForm();
      } else {
        const res = await fetch("/api/admin/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
        if (!res.ok || !json.ok) throw new Error(json.error ?? "Create failed.");
        const newCat: LessonCategory = { ...form, id: json.id! };
        setCategories((prev) =>
          [...prev, newCat].sort((a, b) => a.order - b.order)
        );
        setSuccess(`"${form.title}" created.`);
        resetForm();
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/lessons/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Delete failed.");
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) resetForm();
      setSuccess(`"${title}" deleted.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setBusy(false);
    }
  };

  const handleSeed = async () => {
    if (!confirm("Seed the 8 default lesson categories? Only works if collection is empty.")) return;
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/lessons", { method: "PUT" });
      const json = (await res.json()) as { ok?: boolean; seeded?: number; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Seed failed.");
      setSuccess(`Seeded ${json.seeded} default categories. Reload to see them.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          {isEditing ? `Editing: ${editingId}` : "Add New Category"}
        </h2>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-sm text-green-400 bg-green-900/20 border border-green-800 rounded-lg px-4 py-3">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Category ID — only on create */}
            {!isEditing && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Category ID <span className="text-gray-500">(e.g. Dinks, Drives)</span>
                </label>
                <input
                  type="text"
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  placeholder="Dinks"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must match the Firestore <code>technique_videos</code> collection ID. Cannot be changed after creation.
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Display Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Dinks"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short subtitle shown on the category card"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Min Level */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Min Level to Unlock</label>
              <select
                value={form.minLevel}
                onChange={(e) => setForm({ ...form, minLevel: Number(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    Level {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sort Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
                min={0}
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3 justify-center pt-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiresPro}
                  onChange={(e) => setForm({ ...form, requiresPro: e.target.checked })}
                  className="w-4 h-4 accent-accent-500"
                />
                <span>Paid only</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 accent-accent-500"
                />
                <span>Active (visible in app)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 bg-accent-500 text-black rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "Saving…" : isEditing ? "Save Changes" : "Create Category"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2 bg-gray-700 text-white rounded-lg text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Category table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Categories ({categories.length})
          </h2>
          {categories.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {seeding ? "Seeding…" : "Seed Defaults"}
            </button>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400 text-sm">
            No categories yet. Add one above or click{" "}
            <strong className="text-white">Seed Defaults</strong> to load the 8
            built-in categories.
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs">
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-center px-4 py-3">Level</th>
                  <th className="text-center px-4 py-3">Paid</th>
                  <th className="text-center px-4 py-3">Order</th>
                  <th className="text-center px-4 py-3">Active</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {categories.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-gray-800/60 last:border-0 ${
                      editingId === c.id ? "bg-accent-500/5" : i % 2 === 0 ? "" : "bg-gray-800/30"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.id}</td>
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{c.description}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-accent-500/15 text-accent-400 rounded text-xs font-semibold">
                        Lv {c.minLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.requiresPro ? (
                        <span className="text-yellow-400">✓</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">{c.order}</td>
                    <td className="px-4 py-3 text-center">
                      {c.isActive ? (
                        <span className="text-green-400">●</span>
                      ) : (
                        <span className="text-gray-600">○</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => startEdit(c)}
                          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.title)}
                          disabled={busy}
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
