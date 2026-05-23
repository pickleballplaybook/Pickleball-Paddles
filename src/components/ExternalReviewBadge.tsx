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
    <a
      href={review.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
      style={{ color: "var(--flip-text-muted)" }}
    >
      <Star className="w-3.5 h-3.5" style={{ fill: "#facc15", color: "#facc15" }} strokeWidth={0} />
      <span className="font-bold" style={{ color: "var(--flip-text-head)" }}>
        {review.rating.toFixed(1)}
      </span>
      <span>
        from {review.count.toLocaleString()} review{review.count !== 1 ? "s" : ""}
      </span>
      <span style={{ color: "#2dd4bf" }}>
        via {review.sourceName}
      </span>
    </a>
  );
}
