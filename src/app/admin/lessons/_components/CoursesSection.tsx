"use client";

import { useState } from "react";
import Link from "next/link";

export type Course = {
  id: string;
  title: string;
  description: string;
  accessType: string;
  coverImageUrl: string | null;
  published: boolean;
  sortOrder: number;
};

const ACCESS_TYPES = [
  { value: "open", label: "Open", desc: "All members can access." },
  { value: "pro", label: "Pro only", desc: "Requires an active Pro membership." },
  { value: "level", label: "Level unlock", desc: "Members unlock at a specific level." },
  { value: "private", label: "Private", desc: "Hidden from member view." },
] as const;

const MEMBER_TIERS = [
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
] as const;

type FormState = {
  title: string;
  description: string;
  accessType: string;
  minLevel: number;
  orMemberTierEnabled: boolean;
  memberTier: "basic" | "pro";
  proTier: "basic" | "pro";
  published: boolean;
  coverImageUrl: string | null;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  accessType: "pro",
  minLevel: 3,
  orMemberTierEnabled: false,
  memberTier: "pro",
  proTier: "pro",
  published: true,
  coverImageUrl: null,
};

export function CoursesSection({ initial }: { initial: Course[] }) {
  const [courses, setCourses] = useState<Course[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const openModal = () => {
    setForm(EMPTY);
    setError(null);
    setShowModal(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/drills/upload-asset", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json?.error ?? "Upload failed.");
      setForm((f) => ({ ...f, coverImageUrl: json.url! }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...form,
        ...(form.accessType === "level"
          ? { minLevel: form.minLevel, orMemberTierEnabled: form.orMemberTierEnabled, memberTier: form.memberTier }
          : { minLevel: null, orMemberTierEnabled: false }),
        ...(form.accessType === "pro"
          ? { proTier: form.proTier }
          : { proTier: null }),
      };
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok) throw new Error(json?.error ?? "Create failed.");
      // Navigate to the course editor immediately
      window.location.href = `/admin/lessons/${json.id!}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
      setBusy(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`Delete "${course.title}" and all its content? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
    } catch {
      alert("Delete failed.");
    }
  };

  return (
    <>
      {/* Course grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((course) => (
          <div key={course.id} className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-gray-600 transition-all">
            <Link href={`/admin/lessons/${course.id}`} className="block">
              {/* Cover image */}
              <div
                className="h-40 bg-gray-800 relative"
                style={
                  course.coverImageUrl
                    ? { backgroundImage: `url(${course.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : {}
                }
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {!course.published && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs text-gray-400 font-medium">
                    Draft
                  </div>
                )}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="font-bold text-white text-base leading-snug line-clamp-2 drop-shadow">
                    {course.title || "Untitled"}
                  </h3>
                </div>
              </div>
              {/* Card body */}
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-3 line-clamp-2 min-h-[2.5rem]">{course.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                    <div className="bg-accent-500 h-1.5 rounded-full w-0" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">0%</span>
                </div>
              </div>
            </Link>
            {/* Delete button — appears on hover */}
            <button
              onClick={() => handleDelete(course)}
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition px-2 py-1 bg-red-900/80 hover:bg-red-800 text-red-200 text-xs rounded font-medium"
            >
              Delete
            </button>
          </div>
        ))}

        {/* New lesson card */}
        <button
          onClick={openModal}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-700 hover:border-accent-500/60 bg-gray-900/30 hover:bg-gray-900/60 transition-all h-52 text-gray-500 hover:text-gray-300"
        >
          <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center">
            <span className="text-xl leading-none font-light">+</span>
          </div>
          <span className="text-sm font-semibold">New lesson</span>
        </button>
      </div>

      {/* Create modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl mx-4 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-bold">Add lesson</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {error && (
                  <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">{error}</div>
                )}

                {/* Title */}
                <div>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value.slice(0, 50) })}
                    placeholder="Lesson name"
                    maxLength={50}
                    required
                    autoFocus
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-500"
                  />
                  <div className="text-right text-xs text-gray-600 mt-1">{form.title.length} / 50</div>
                </div>

                {/* Description */}
                <div>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value.slice(0, 500) })}
                    placeholder="Lesson description"
                    maxLength={500}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-500 resize-none"
                  />
                  <div className="text-right text-xs text-gray-600 mt-1">{form.description.length} / 500</div>
                </div>

                {/* Access type */}
                <div className="grid grid-cols-2 gap-2">
                  {ACCESS_TYPES.map((at) => (
                    <label
                      key={at.value}
                      className={`flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition ${
                        form.accessType === at.value
                          ? "border-accent-500 bg-accent-500/10"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="accessType"
                          value={at.value}
                          checked={form.accessType === at.value}
                          onChange={() => setForm({ ...form, accessType: at.value })}
                          className="accent-accent-500"
                        />
                        <span className="text-sm font-semibold">{at.label}</span>
                      </div>
                      <p className="text-xs text-gray-400 pl-5">{at.desc}</p>
                    </label>
                  ))}
                </div>

                {/* Level unlock sub-options */}
                {form.accessType === "level" && (
                  <div className="space-y-3 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-4">
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1.5">Access starts at level</label>
                      <select
                        value={form.minLevel}
                        onChange={(e) => setForm((f) => ({ ...f, minLevel: Number(e.target.value) }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500"
                      >
                        {[1, 2, 3, 3.5, 4, 4.5, 5].map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, orMemberTierEnabled: !f.orMemberTierEnabled }))}
                        className="flex-shrink-0"
                      >
                        <div className={`w-9 h-5 rounded-full relative transition-colors ${form.orMemberTierEnabled ? "bg-accent-500" : "bg-gray-600"}`}>
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.orMemberTierEnabled ? "translate-x-4" : ""}`} />
                        </div>
                      </button>
                      <span className="text-sm text-gray-300">Or members on/above</span>
                      <select
                        value={form.memberTier}
                        onChange={(e) => setForm((f) => ({ ...f, memberTier: e.target.value as "basic" | "pro" }))}
                        disabled={!form.orMemberTierEnabled}
                        className="ml-auto bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-500 disabled:opacity-40"
                      >
                        {MEMBER_TIERS.map((t) => (
                          <option key={t.value} value={t.value}>{t.label} tier</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Pro only sub-options */}
                {form.accessType === "pro" && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-4">
                    <label className="text-xs text-gray-400 font-medium block mb-2">Minimum tier required</label>
                    <div className="flex gap-2">
                      {MEMBER_TIERS.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, proTier: t.value }))}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                            form.proTier === t.value
                              ? "border-accent-500 bg-accent-500/10 text-accent-400"
                              : "border-gray-700 text-gray-400 hover:border-gray-500"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover image */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Cover image <span className="text-gray-600">(optional · 1460 × 752 px)</span></p>
                  <div className="flex gap-4 items-start">
                    {form.coverImageUrl ? (
                      <div className="relative w-36 h-20 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, coverImageUrl: null }))}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-black"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label
                        className={`w-36 h-20 rounded-xl border-2 border-dashed border-gray-600 hover:border-gray-400 flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-gray-300 transition flex-shrink-0 ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <span className="text-xl">{uploading ? "⋯" : "+"}</span>
                        <span className="text-xs mt-0.5">{uploading ? "Uploading…" : "Upload"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
                {/* Published toggle */}
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
                  className="flex items-center gap-2"
                >
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${form.published ? "bg-green-500" : "bg-gray-600"}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.published ? "translate-x-5" : ""}`} />
                  </div>
                  <span className={`text-sm font-medium ${form.published ? "text-green-400" : "text-gray-400"}`}>
                    {form.published ? "Published" : "Draft"}
                  </span>
                </button>

                <div className="flex gap-3 items-center">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy || !form.title.trim() || uploading}
                    className="px-6 py-2 bg-accent-500 text-black text-sm font-bold rounded-lg disabled:opacity-50 hover:bg-accent-400 transition"
                  >
                    {busy ? "Creating…" : "Add"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
