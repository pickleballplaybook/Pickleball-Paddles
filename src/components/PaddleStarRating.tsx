"use client";

import { useState, useEffect } from "react";
import { Star, Send } from "lucide-react";

interface Props {
  paddleId: string;
}

interface Review {
  stars: number;
  comment: string;
  date: string;
}

interface RatingSummary {
  average: number;
  count: number;
  userRating: number | null;
  reviews: Review[];
}

// Persistent anonymous ID per device
function getUserKey(): string {
  const key = "ppb_user_key";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getRatingKey(paddleId: string) {
  return `paddle_rating_${paddleId}`;
}

function timeAgo(date: string): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function PaddleStarRating({ paddleId }: Props) {
  const [summary, setSummary] = useState<RatingSummary>({ average: 0, count: 0, userRating: null, reviews: [] });
  const [hovered, setHovered] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState("");
  const [pendingStars, setPendingStars] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(getRatingKey(paddleId));
    const userRating = stored ? parseInt(stored, 10) : null;

    fetch(`/api/paddle-ratings?paddleId=${encodeURIComponent(paddleId)}&_t=${Date.now()}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (typeof data.count === "number") {
          setSummary({ average: data.average ?? 0, count: data.count, userRating, reviews: data.reviews ?? [] });
        }
      })
      .catch((err) => {
        console.error("[PaddleStarRating] fetch failed:", err);
      });
  }, [paddleId]);

  function handleStarClick(stars: number) {
    setPendingStars(stars);
    setShowCommentBox(true);
  }

  async function submitRating() {
    if (submitting || !pendingStars) return;
    setSubmitting(true);

    const userKey = getUserKey();
    localStorage.setItem(getRatingKey(paddleId), String(pendingStars));

    // Optimistic update
    setSummary((prev) => ({
      average: prev.count === 0 ? pendingStars : prev.average,
      count: prev.userRating ? prev.count : prev.count + 1,
      userRating: pendingStars,
      reviews: prev.reviews,
    }));

    try {
      const res = await fetch("/api/paddle-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paddleId, stars: pendingStars, userKey, comment: comment.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSummary({ average: data.average, count: data.count, userRating: pendingStars, reviews: data.reviews ?? [] });
      }
    } catch {}

    setSubmitting(false);
    setShowCommentBox(false);
    setComment("");
    setPendingStars(0);
  }

  const displayStars = hovered || pendingStars || summary.userRating || 0;

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
            onClick={() => handleStarClick(star)}
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

      {/* Comment box — appears after clicking stars */}
      {showCommentBox && (
        <div className="mb-4 space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a written review (optional)"
            maxLength={500}
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            style={{
              background: "var(--flip-bg)",
              color: "var(--flip-text-head)",
              border: "1px solid var(--flip-card-border)",
            }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={submitRating}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "#14b8a6" }}
            >
              <Send className="w-3.5 h-3.5" />
              {comment.trim() ? "Submit Review" : "Submit Rating"}
            </button>
            <button
              onClick={() => { setShowCommentBox(false); setPendingStars(0); }}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ color: "var(--flip-text-muted)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary.count > 0 || summary.userRating ? (
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4" style={{ fill: "#facc15", color: "#facc15" }} strokeWidth={0} />
          <span className="font-extrabold text-sm" style={{ color: "var(--flip-text-head)" }}>
            {(summary.average > 0 ? summary.average : (summary.userRating ?? 0)).toFixed(1)}
          </span>
          <span className="text-sm" style={{ color: "var(--flip-text-muted)" }}>
            ({Math.max(summary.count, summary.userRating ? 1 : 0)} {Math.max(summary.count, summary.userRating ? 1 : 0) === 1 ? "review" : "reviews"})
          </span>
        </div>
      ) : (
        <p className="text-xs" style={{ color: "var(--flip-text-muted)" }}>
          Be the first to review this paddle
        </p>
      )}

      {/* Written reviews */}
      {summary.reviews.length > 0 && (
        <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid var(--flip-divider)" }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--flip-text-muted)" }}>
            Community Reviews
          </p>
          {summary.reviews.slice(0, 5).map((review, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3" strokeWidth={0} style={{ fill: s <= review.stars ? "#facc15" : "var(--flip-divider)", color: s <= review.stars ? "#facc15" : "var(--flip-divider)" }} />
                  ))}
                </div>
                <span className="text-[11px]" style={{ color: "var(--flip-text-muted)" }}>{timeAgo(review.date)}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-body)" }}>{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
