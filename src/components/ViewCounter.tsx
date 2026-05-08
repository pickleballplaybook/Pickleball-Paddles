"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

interface Props {
  slug: string;
  type?: "paddle" | "gear";
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return n.toLocaleString();
  return String(n);
}

export default function ViewCounter({ slug, type = "paddle" }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Record this view and get the updated count
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, type }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.count === "number") setCount(data.count);
      })
      .catch(() => {
        // Silently fail — fall back to GET for count only
        fetch(`/api/views?slug=${encodeURIComponent(slug)}&type=${type}`)
          .then((r) => r.json())
          .then((data) => {
            if (typeof data.count === "number") setCount(data.count);
          })
          .catch(() => {});
      });
  }, [slug, type]);

  if (count === null) return (
    <div className="flex items-center gap-1.5" style={{ color: "var(--flip-text-muted)", opacity: 0.4 }}>
      <Eye className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
      <span className="text-sm font-medium">— views</span>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5" style={{ color: "var(--flip-text-muted)" }}>
      <Eye className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
      <span className="text-sm font-medium">
        {formatCount(count)} {count === 1 ? "view" : "views"}
      </span>
    </div>
  );
}
