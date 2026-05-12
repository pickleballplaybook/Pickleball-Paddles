"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";

interface Props {
  paddleId: string;
  /** Baseline rating to show when no community ratings exist (Austin's review) */
  baselineRating?: number;
}

interface RatingSummary {
  average: number;
  count: number;
  userRating: number | null;
}

function getStorageKey(paddleId: string) {
  return `paddle_rating_${paddleId}`;
}

export default function PaddleStarRating({ paddleId, baselineRating = 4.5 }: Props) {
  const [summary, setSummary] = useState<RatingSummary>({ average: 0, count: 0, userRating: null });
  const [hovered, setHovered] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(paddleId));
    const userRating = stored ? parseInt(stored, 10) : null;

    fetch(`/api/paddle-ratings?paddleId=${encodeURIComponent(paddleId)}`)
      .then((r) => r.json())
      .then((data) => {
        const apiCount = data.count ?? 0;
        const apiAvg = data.average ?? 0;
        setSummary({ average: apiAvg, count: apiCount, userRating });
        setLoaded(true);
      })
      .catch(() => {
        // API failed — use baseline
        setSummary({ average: 0, count: 0, userRating });
        setLoaded(true);
      });
  }, [paddleId]);

  async function handleRate(stars: number) {
    if (submitting) return;
    setSubmitting(true);

    localStorage.setItem(getStorageKey(paddleId), String(stars));
    setSummary((prev) => ({
      average: prev.count === 0 ? stars : prev.average,
      count: prev.userRating ? prev.count : prev.count + 1,
      userRating: stars,
    }));

    try {
      const res = await fetch("/api/paddle-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paddleId, stars }),
      });
      const data = await res.json();
      if (res.ok) {
        setSummary({ average: data.average, count: data.count, userRating: stars });
      }
    } catch {}
    setSubmitting(false);
  }

  const displayStars = hovered || summary.userRating || 0;

  // Always show at least 1 review (Austin's baseline) even if API returns 0
  const displayCount = summary.userRating
    ? Math.max(summary.count, 1)
    : Math.max(summary.count, 1); // baseline = Austin's review
  const displayAvg = summary.average > 0
    ? summary.average
    : summary.userRating
    ? summary.userRating
    : baselineRating;

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
    >
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--flip-text-muted)" }}>
        Rating
      </p>

      {/* Star input */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            disabled={submitting}
            className="transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className="w-7 h-7"
              strokeWidth={1.5}
              style={{
                fill: star <= displayStars ? "#facc15" : "none",
                color: star <= displayStars ? "#facc15" : "var(--flip-text-muted)",
                opacity: star <= displayStars ? 1 : 0.35,
                transition: "fill 0.1s, color 0.1s, opacity 0.1s",
              }}
            />
          </button>
        ))}
        <span className="ml-1 text-sm font-medium" style={{ color: "var(--flip-text-muted)" }}>
          {summary.userRating ? "Your rating" : "Rate this paddle"}
        </span>
      </div>

      {/* Summary — always show at least Austin's review */}
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4" style={{ fill: "#facc15", color: "#facc15" }} strokeWidth={0} />
        <span className="font-extrabold text-sm" style={{ color: "var(--flip-text-head)" }}>
          {displayAvg.toFixed(1)}
        </span>
        <span className="text-sm" style={{ color: "var(--flip-text-muted)" }}>
          ({displayCount} {displayCount === 1 ? "review" : "reviews"})
        </span>
      </div>
    </div>
  );
}
