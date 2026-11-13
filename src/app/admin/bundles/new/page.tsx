"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "../../_components/AdminNav";

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function NewBundlePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  function onNameChange(val: string) {
    setName(val);
    if (!slug || slug === toSlug(name)) setSlug(toSlug(val));
  }

  async function create() {
    if (!name || !slug) return;
    setCreating(true);
    setError("");
    try {
      const r = await fetch("/api/admin/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to create");
      router.replace(`/admin/bundles/${d.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-8">
      <div className="max-w-xl mx-auto">
        <AdminNav />
        <h1 className="text-2xl font-semibold mb-6">New Bundle</h1>

        <div className="rounded border border-gray-800 bg-gray-900 p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Bundle name</label>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ultimate Pickleball Drills Bundle"
              className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">URL slug</label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">/members/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(toSlug(e.target.value))}
                placeholder="ultimate-drills-bundle"
                className="flex-1 bg-gray-800 text-white rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Description <span className="text-gray-600">(optional — shown to members)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="30 drills across 6 categories..."
              className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent-500 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={create}
            disabled={creating || !name || !slug}
            className="w-full bg-accent-500 hover:opacity-90 disabled:opacity-50 text-black font-semibold py-2 rounded text-sm"
          >
            {creating ? "Creating…" : "Create Bundle"}
          </button>
        </div>
      </div>
    </main>
  );
}
