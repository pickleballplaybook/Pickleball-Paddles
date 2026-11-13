"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronUp, ChevronDown, GripVertical } from "lucide-react";

// Module-level cache survives re-renders/tab switches within the session.
const vimeoThumbCache: Record<string, string> = {};

function extractVimeoInfo(url?: string): { id: string; hash?: string } | null {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/);
  if (!m) return null;
  return { id: m[1], hash: m[2] };
}

function DrillThumbnail({ image, videoUrl }: { image?: string | null; videoUrl?: string }) {
  const [vimeoSrc, setVimeoSrc] = useState<string | null>(null);

  useEffect(() => {
    if (image) return;
    const info = extractVimeoInfo(videoUrl);
    if (!info) return;
    if (vimeoThumbCache[info.id]) {
      setVimeoSrc(vimeoThumbCache[info.id]);
      return;
    }
    const vimeoUrl = info.hash
      ? `https://vimeo.com/${info.id}/${info.hash}`
      : `https://vimeo.com/${info.id}`;
    fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(vimeoUrl)}`)
      .then((r) => r.json())
      .then((data) => {
        const thumb: string | undefined = data.thumbnail_url;
        if (thumb) {
          vimeoThumbCache[info.id] = thumb;
          setVimeoSrc(thumb);
        }
      })
      .catch(() => {});
  }, [image, videoUrl]);

  const src = image || vimeoSrc;
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-10 w-10 rounded object-cover bg-gray-800 shrink-0" />
  ) : (
    <div className="h-10 w-10 rounded bg-gray-800 shrink-0" />
  );
}

export type DrillRow = {
  id: string;
  name: string;
  category?: string;
  week_number?: number;
  video_url?: string;
  image?: string | null;
  scheduled_publish_at?: string | null;
  is_published?: boolean;
};

function formatScheduled(iso: string | null | undefined): string {
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

function statusBadge(d: DrillRow): { label: string; className: string } {
  if (!d.is_published) {
    return { label: "Draft", className: "bg-gray-800 text-gray-300" };
  }
  if (d.scheduled_publish_at) {
    const when = new Date(d.scheduled_publish_at);
    if (!Number.isNaN(when.getTime()) && when.getTime() > Date.now()) {
      return {
        label: "Scheduled",
        className: "bg-amber-900/60 text-amber-200 border border-amber-700/60",
      };
    }
  }
  return {
    label: "Live",
    className: "bg-emerald-900/60 text-emerald-200 border border-emerald-700/60",
  };
}

export function DrillsTableClient({ initialDrills }: { initialDrills: DrillRow[] }) {
  const [drills, setDrills] = useState<DrillRow[]>(initialDrills);
  const [busy, setBusy] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const router = useRouter();

  async function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= drills.length) return;

    const drillA = drills[index];
    const drillB = drills[targetIndex];
    const weekA = drillA.week_number ?? 0;
    const weekB = drillB.week_number ?? 0;

    // Optimistic: swap positions and week_numbers
    const newDrills = [...drills];
    newDrills[index] = { ...drillB, week_number: weekA };
    newDrills[targetIndex] = { ...drillA, week_number: weekB };
    setDrills(newDrills);
    setBusy(drillA.id);

    try {
      const res = await fetch("/api/admin/drills/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "swap", idA: drillA.id, idB: drillB.id }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      setDrills(drills);
    } finally {
      setBusy(null);
    }
  }

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragOverIndex(null);

    if (dragIndex === null || dragIndex === dropIndex) return;

    // Reorder: remove from dragIndex, insert at dropIndex
    const newDrills = [...drills];
    const [dragged] = newDrills.splice(dragIndex, 1);
    newDrills.splice(dropIndex, 0, dragged);

    // Redistribute existing week_numbers (sorted desc) to new positions
    const sortedWeeks = drills.map((d) => d.week_number ?? 0).sort((a, b) => a - b);
    const reordered = newDrills.map((d, i) => ({ ...d, week_number: sortedWeeks[i] }));
    setDrills(reordered);

    const items = reordered.map((d) => ({ id: d.id, week_number: d.week_number ?? 0 }));
    fetch("/api/admin/drills/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", items }),
    }).then((res) => {
      if (res.ok) router.refresh();
    });
  }

  function handleDragEnd() {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-900 text-gray-300 text-left text-xs uppercase tracking-wide">
        <tr>
          <th className="px-4 py-3 font-medium">Drill</th>
          <th className="px-4 py-3 font-medium">Category</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">Scheduled</th>
          <th className="px-4 py-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-gray-950">
        {drills.map((d, i) => {
          const status = statusBadge(d);
          const isBusy = busy === d.id;
          const isDragOver = dragOverIndex === i && dragIndexRef.current !== i;
          return (
            <tr
              key={d.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`border-t border-gray-800 hover:bg-gray-900/60 transition-colors ${
                isDragOver ? "border-t-2 border-t-blue-500 bg-blue-950/20" : ""
              } ${isBusy ? "opacity-60" : ""}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <GripVertical
                    size={14}
                    className="text-gray-600 shrink-0 cursor-grab active:cursor-grabbing"
                  />
                  <DrillThumbnail image={d.image} videoUrl={d.video_url} />
                  <div className="font-medium text-white truncate">{d.name}</div>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-300">{d.category ?? "—"}</td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${status.className}`}>
                  {status.label}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">
                {formatScheduled(d.scheduled_publish_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-3">
                  <div className="flex flex-col gap-0">
                    <button
                      onClick={() => handleMove(i, "up")}
                      disabled={i === 0 || isBusy}
                      className="text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed leading-none"
                      aria-label="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMove(i, "down")}
                      disabled={i === drills.length - 1 || isBusy}
                      className="text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed leading-none"
                      aria-label="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  <Link
                    href={`/admin/drills/${d.id}/edit`}
                    className="text-accent-300 hover:text-accent-200 text-sm"
                  >
                    Edit
                  </Link>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
