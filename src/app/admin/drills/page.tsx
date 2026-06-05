"use client";

import { useState } from "react";
import { AdminNav } from "../_components/AdminNav";
import CKEditorBlock from "./_components/CKEditorBlock";

const CATEGORIES = [
  "Dinks",
  "Drops",
  "Drives",
  "Volleys",
  "Ball Machine",
  "Wall",
] as const;

export default function DrillsAdminPage() {
  const [name, setName] = useState("");
  const [descBeginner, setDescBeginner] = useState("");
  const [descIntermediate, setDescIntermediate] = useState("");
  const [descAdvanced, setDescAdvanced] = useState("");
  const [category, setCategory] = useState("");
  const [weekNumber, setWeekNumber] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setDescBeginner("");
    setDescIntermediate("");
    setDescAdvanced("");
    setCategory("");
    setWeekNumber("");
    setVideoUrl("");
    setImage(null);
    setIsFree(false);
    setIsPublished(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessId(null);
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("description_beginner", descBeginner);
      fd.append("description_intermediate", descIntermediate);
      fd.append("description_advanced", descAdvanced);
      fd.append("category", category);
      fd.append("week_number", weekNumber);
      fd.append("video_url", videoUrl);
      fd.append("is_free", isFree ? "true" : "false");
      fd.append("is_published", isPublished ? "true" : "false");
      if (image) fd.append("image", image);

      const res = await fetch("/api/admin/drills", {
        method: "POST",
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = json?.fields?.length
          ? ` (${json.fields.join(", ")})`
          : "";
        setError(`${json?.error ?? "Upload failed"}${detail}`);
        return;
      }
      setSuccessId(json.id);
      resetForm();
    } catch (err: any) {
      setError(err?.message ?? "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <AdminNav />

        <h1 className="text-2xl font-semibold mb-1">Upload Drill</h1>
        <p className="text-gray-400 text-sm mb-6">
          Creates one drill record with separate Beginner / Intermediate /
          Advanced descriptions and a single video. Saved with{" "}
          <code className="text-accent-300">multi_level: true</code> so the
          mobile app can distinguish it from older single-level drills.
        </p>

        {successId && (
          <div className="mb-4 p-3 rounded border border-emerald-700 bg-emerald-900/40 text-sm">
            Drill saved (id: <code>{successId}</code>).
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded border border-red-700 bg-red-900/40 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldLabel label="Name">
            <input
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
            />
          </FieldLabel>

          <FieldLabel label="Description — Beginner">
            <CKEditorBlock
              value={descBeginner}
              onChange={setDescBeginner}
              placeholder="What a beginner should focus on…"
            />
          </FieldLabel>

          <FieldLabel label="Description — Intermediate">
            <CKEditorBlock
              value={descIntermediate}
              onChange={setDescIntermediate}
              placeholder="What an intermediate player should focus on…"
            />
          </FieldLabel>

          <FieldLabel label="Description — Advanced">
            <CKEditorBlock
              value={descAdvanced}
              onChange={setDescAdvanced}
              placeholder="What an advanced player should focus on…"
            />
          </FieldLabel>

          <FieldLabel label="Category">
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
            >
              <option value="" disabled>
                Select a category
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FieldLabel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldLabel label="Week Number">
              <input
                type="number"
                required
                min={1}
                step={1}
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
              />
            </FieldLabel>
            <FieldLabel label="Video URL">
              <input
                type="url"
                required
                placeholder="https://vimeo.com/…"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
              />
            </FieldLabel>
          </div>

          <FieldLabel label="Image (optional)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent-500 file:text-black file:font-medium hover:file:opacity-90"
            />
            {image && (
              <div className="mt-2 text-xs text-gray-400">
                Selected: {image.name} ({Math.round(image.size / 1024)} KB)
              </div>
            )}
          </FieldLabel>

          <div className="flex flex-wrap gap-6 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="accent-accent-500"
              />
              Free
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-accent-500"
              />
              Published
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-accent-500 hover:opacity-90 disabled:opacity-50 text-black font-medium px-6 py-2 rounded transition"
          >
            {submitting ? "Saving…" : "Save Drill"}
          </button>
        </form>
      </div>
    </main>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm text-gray-300 mb-1">{label}</div>
      {children}
    </label>
  );
}
