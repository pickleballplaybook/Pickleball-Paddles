"use client";

import { useState } from "react";

type Drill = {
  id: string;
  name: string;
  category: string;
  week_number: number;
  is_published: boolean;
};

type GroupedDrills = { category: string; drills: Drill[] }[];

type Bundle = {
  id: string;
  name: string;
  slug: string;
  description: string;
  drill_ids: string[];
  published: boolean;
};

type Member = {
  id: string;
  email: string;
  must_reset: boolean;
  reset_link: string | null;
};

export function BundleEditor({
  bundleId,
  initialBundle,
  groupedDrills,
  initialMembers,
}: {
  bundleId: string;
  initialBundle: Bundle;
  groupedDrills: GroupedDrills;
  initialMembers: Member[];
}) {
  const [name, setName] = useState(initialBundle.name);
  const [description, setDescription] = useState(initialBundle.description || "");
  const [published, setPublished] = useState(initialBundle.published);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialBundle.drill_ids || [])
  );
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  function toggleDrill(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSaved(false);
  }

  function toggleCategory(drills: Drill[]) {
    const allSelected = drills.every((d) => selectedIds.has(d.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) drills.forEach((d) => next.delete(d.id));
      else drills.forEach((d) => next.add(d.id));
      return next;
    });
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const r = await fetch(`/api/admin/bundles/${bundleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, published, drill_ids: Array.from(selectedIds) }),
      });
      if (r.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function addMember() {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setAddingMember(true);
    try {
      const r = await fetch(`/api/admin/bundles/${bundleId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) { alert(d.error || "Failed"); return; }
      setMembers((prev) => [
        ...prev.filter((m) => m.email !== email),
        { id: d.member_id, email, must_reset: true, reset_link: d.reset_link },
      ]);
      if (d.reset_link) copy(d.reset_link);
      setNewEmail("");
    } finally {
      setAddingMember(false);
    }
  }

  async function removeMember(id: string) {
    if (!confirm("Remove this member's access to this bundle?")) return;
    await fetch(`/api/admin/bundles/${bundleId}/members/${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function generateReset(id: string) {
    const r = await fetch(`/api/admin/bundles/${bundleId}/members/${id}`, { method: "POST" });
    const d = await r.json();
    if (d.reset_link) {
      copy(d.reset_link);
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, reset_link: d.reset_link, must_reset: true } : m))
      );
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedLink(text);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Edit Bundle</h1>
          <a
            href={`/members/${initialBundle.slug}`}
            target="_blank"
            className="text-sm text-accent-300 hover:underline mt-0.5 block"
          >
            /members/{initialBundle.slug} ↗
          </a>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
          <button
            onClick={save}
            disabled={saving}
            className="bg-accent-500 hover:opacity-90 disabled:opacity-50 text-black font-medium px-5 py-2 rounded text-sm"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded border border-gray-800 bg-gray-900 p-5 mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Bundle name</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setSaved(false); }}
              className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Slug</label>
            <input
              value={initialBundle.slug}
              disabled
              className="w-full bg-gray-900 text-gray-500 rounded px-3 py-2 text-sm font-mono border border-gray-700 cursor-not-allowed"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
            rows={2}
            className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent-500 resize-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setPublished((p) => !p); setSaved(false); }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              published ? "bg-emerald-500" : "bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                published ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-gray-300">
            {published
              ? "Live — members can access this bundle"
              : "Draft — not visible to members yet"}
          </span>
        </div>
      </div>

      {/* Drill selection */}
      <div className="rounded border border-gray-800 bg-gray-900 mb-6">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300">Drills in this bundle</h2>
          <span className="text-xs text-gray-400">{selectedIds.size} selected</span>
        </div>
        <div className="divide-y divide-gray-800">
          {groupedDrills.map(({ category, drills }) => {
            const selectedInCat = drills.filter((d) => selectedIds.has(d.id)).length;
            const allSelected = selectedInCat === drills.length;
            return (
              <details key={category} className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none hover:bg-gray-800/50 list-none">
                  <svg
                    className="h-3.5 w-3.5 text-gray-500 transition-transform group-open:rotate-90"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.22 4.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L10.94 10 6.22 5.28a.75.75 0 010-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-white">{category}</span>
                  <span className="text-xs text-gray-400">
                    {selectedInCat}/{drills.length} selected
                  </span>
                  <button
                    onClick={(e) => { e.preventDefault(); toggleCategory(drills); }}
                    className="ml-auto text-xs text-gray-500 hover:text-gray-300 px-2 py-0.5 rounded hover:bg-gray-800"
                  >
                    {allSelected ? "Deselect all" : "Select all"}
                  </button>
                </summary>
                <div className="px-5 pb-3 space-y-1">
                  {drills.map((drill) => (
                    <label
                      key={drill.id}
                      className="flex items-center gap-3 py-1 cursor-pointer group/drill"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(drill.id)}
                        onChange={() => toggleDrill(drill.id)}
                        className="rounded border-gray-600 bg-gray-700 text-accent-500 focus:ring-accent-500 focus:ring-offset-gray-900"
                      />
                      <span className="text-sm text-gray-300 group-hover/drill:text-white transition-colors">
                        {drill.name}
                      </span>
                      {!drill.is_published && (
                        <span className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                          draft
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      {/* Members */}
      <div className="rounded border border-gray-800 bg-gray-900">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300">
            Members{members.length > 0 && <span className="ml-2 text-gray-500 font-normal">{members.length}</span>}
          </h2>
        </div>

        <div className="px-5 py-4 border-b border-gray-800 flex gap-2">
          <input
            type="email"
            placeholder="member@email.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMember()}
            className="flex-1 bg-gray-800 text-white rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent-500"
          />
          <button
            onClick={addMember}
            disabled={addingMember || !newEmail.trim()}
            className="bg-accent-500 hover:opacity-90 disabled:opacity-50 text-black font-medium px-4 py-2 rounded text-sm"
          >
            {addingMember ? "Adding…" : "Add member"}
          </button>
        </div>

        {copiedLink && (
          <div className="px-5 py-3 bg-emerald-900/20 border-b border-emerald-800/30">
            <p className="text-xs text-emerald-300 font-medium mb-1">
              Reset link copied — send this to the member:
            </p>
            <p className="text-xs text-emerald-200/80 font-mono break-all">{copiedLink}</p>
          </div>
        )}

        {members.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No members yet. Add one above.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {members.map((m) => (
              <div key={m.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{m.email}</div>
                  {m.must_reset && (
                    <div className="text-xs text-amber-400 mt-0.5">Password not yet set</div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {m.reset_link && (
                    <button
                      onClick={() => copy(m.reset_link!)}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800"
                    >
                      Copy link
                    </button>
                  )}
                  <button
                    onClick={() => generateReset(m.id)}
                    className="text-xs text-accent-300 hover:text-accent-200 px-2 py-1 rounded hover:bg-gray-800"
                  >
                    New link
                  </button>
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
