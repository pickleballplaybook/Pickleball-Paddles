"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";

interface Props {
  paddleSlug: string;
}

interface ReviewData {
  rating: number;
  count: number;
  sourceName: string;
  sourceUrl: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const partial = !filled && rating > star - 1;
        return (
          <div key={star} className="relative">
            {/* Background (empty) star */}
            <Star
              className="w-5 h-5"
              strokeWidth={1.5}
              style={{ color: "var(--flip-text-muted)", opacity: 0.3 }}
            />
            {/* Filled star (full or partial) */}
            {(filled || partial) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : `${(rating - (star - 1)) * 100}%` }}
              >
                <Star
                  className="w-5 h-5"
                  strokeWidth={1.5}
                  style={{ fill: "#facc15", color: "#facc15" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ExternalReviewBadge({ paddleSlug }: Props) {
  const [review, setReview] = useState<ReviewData | null>(null);

  useEffect(() => {
    fetch(`/api/external-reviews?slug=${encodeURIComponent(paddleSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.found) {
          setReview({
            rating: data.rating,
            count: data.count,
            sourceName: data.sourceName,
            sourceUrl: data.sourceUrl,
          });
        }
      })
      .catch(() => {});
  }, [paddleSlug]);

  if (!review) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 flex-wrap">
        <StarDisplay rating={review.rating} />
        <span className="font-extrabold text-sm" style={{ color: "var(--flip-text-head)" }}>
          {review.rating.toFixed(1)}
        </span>
        <span className="text-xs" style={{ color: "var(--flip-text-muted)" }}>
          ({review.count.toLocaleString()} review{review.count !== 1 ? "s" : ""})
        </span>
      </div>
      <a
        href={review.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium transition-colors hover:opacity-80"
        style={{ color: "#60a5fa" }}
      >
        via {review.sourceName}
      </a>
    </div>
  );
}
