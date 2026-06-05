"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextBlock from "./RichTextBlock";

const CATEGORIES = [
  "Dinks",
  "Drops",
  "Drives",
  "Volleys",
  "Ball Machine",
  "Wall",
] as const;

export type DrillFormInitial = {
  id?: string;
  name?: string;
  description_beginner?: string;
  description_intermediate?: string;
  description_advanced?: string;
  category?: string;
  week_number?: number | string;
  video_url?: string;
  image?: string | null;
  scheduled_publish_at?: string | null;
  is_published?: boolean;
};

type Props =
  | { mode: "create"; initial?: DrillFormInitial }
  | { mode: "edit"; drillId: string; initial: DrillFormInitial };

// Convert a stored UTC ISO string to a value the `datetime-local` input
// understands ("YYYY-MM-DDTHH:MM" in the browser's local timezone).
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export default function DrillForm(props: Props) {
  const router = useRouter();
  const initial = props.initial ?? {};

  const [name, setName] = useState(initial.name ?? "");
  const [descBeginner, setDescBeginner] = useState(
    initial.description_beginner ?? ""
  );
  const [descIntermediate, setDescIntermediate] = useState(
    initial.description_intermediate ?? ""
  );
  const [descAdvanced, setDescAdvanced] = useState(
    initial.description_advanced ?? ""
  );
  const [category, setCategory] = useState(initial.category ?? "");
  const [weekNumber, setWeekNumber] = useState(
    initial.week_number != null ? String(initial.week_number) : ""
  );
  const [videoUrl, setVideoUrl] = useState(initial.video_url ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
    initial.image ?? null
  );
  const [scheduledPublishAt, setScheduledPublishAt] = useState(
    isoToLocalInput(initial.scheduled_publish_at)
  );
  const [isPublished, setIsPublished] = useState(
    initial.is_published ?? false
  );

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      if (scheduledPublishAt) {
        fd.append(
          "scheduled_publish_at",
          new Date(scheduledPublishAt).toISOString()
        );
      } else {
        fd.append("scheduled_publish_at", "");
      }
      fd.append("is_published", isPublished ? "true" : "false");
      if (image) {
        fd.append("image", image);
      } else if (existingImageUrl) {
        // Tell the server to keep the existing image URL (edit mode only).
        fd.append("existing_image_url", existingImageUrl);
      }

      const url =
        props.mode === "edit"
          ? `/api/admin/drills/${props.drillId}`
          : "/api/admin/drills";
      const method = props.mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, { method, body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = json?.fields?.length
          ? ` (${json.fields.join(", ")})`
          : "";
        setError(`${json?.error ?? "Save failed"}${detail}`);
        return;
      }
      router.push("/admin/drills");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (props.mode !== "edit") return;
    const ok = window.confirm(
      `Delete drill "${name}"? This cannot be undone.`
    );
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/drills/${props.drillId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ?? "Delete failed");
        return;
      }
      router.push("/admin/drills");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded border border-red-700 bg-red-900/40 text-sm">
          {error}
        </div>
      )}

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
        <RichTextBlock
          value={descBeginner}
          onChange={setDescBeginner}
          placeholder="What a beginner should focus on…"
        />
      </FieldLabel>

      <FieldLabel label="Description — Intermediate">
        <RichTextBlock
          value={descIntermediate}
          onChange={setDescIntermediate}
          placeholder="What an intermediate player should focus on…"
        />
      </FieldLabel>

      <FieldLabel label="Description — Advanced">
        <RichTextBlock
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
        {existingImageUrl && !image && (
          <div className="mb-2 flex items-center gap-3 p-2 rounded border border-gray-800 bg-gray-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={existingImageUrl}
              alt=""
              className="h-16 w-16 object-cover rounded"
            />
            <div className="text-xs text-gray-400 flex-1 truncate">
              Current image
            </div>
            <button
              type="button"
              onClick={() => setExistingImageUrl(null)}
              className="text-xs text-red-300 hover:text-red-200"
            >
              Remove
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent-500 file:text-black file:font-medium hover:file:opacity-90"
        />
        {image && (
          <div className="mt-2 text-xs text-gray-400">
            New: {image.name} ({Math.round(image.size / 1024)} KB) — will
            replace the current image on save.
          </div>
        )}
      </FieldLabel>

      <FieldLabel label="Schedule (optional)">
        <input
          type="datetime-local"
          value={scheduledPublishAt}
          onChange={(e) => setScheduledPublishAt(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Leave blank to publish immediately. Times are in your local
          timezone — the server stores an absolute UTC instant.
        </p>
      </FieldLabel>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="accent-accent-500"
        />
        Published
      </label>

      <div className="flex items-center justify-between pt-4">
        <button
          type="submit"
          disabled={submitting || deleting}
          className="bg-accent-500 hover:opacity-90 disabled:opacity-50 text-black font-medium px-6 py-2 rounded transition"
        >
          {submitting
            ? "Saving…"
            : props.mode === "edit"
              ? "Save changes"
              : "Save Drill"}
        </button>
        {props.mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting || deleting}
            className="text-sm text-red-300 hover:text-red-200 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete drill"}
          </button>
        )}
      </div>
    </form>
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
