"use client";

import Link from "next/link";
import { Heart, ThumbsDown } from "lucide-react";
import { useReactions } from "@/hooks/useReactions";

interface PaddleEntry {
  id: string;
  slug: string;
  brand: string;
  name: string;
  image: string | null;
}

function PaddleReviewCard({ paddle }: { paddle: PaddleEntry }) {
  const { reaction, toggle } = useReactions(paddle.id);

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors"
      style={{ border: "1px solid var(--border)", background: "var(--bg-card, var(--bg-alt))" }}
    >
      {/* Thumbnail */}
      <div
        className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: "var(--bg-section)" }}
      >
        {paddle.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={paddle.image} alt={paddle.name} className="w-full h-full object-contain p-1" />
        ) : (
          <svg viewBox="0 0 120 160" fill="none" className="w-7 h-auto opacity-20" aria-hidden>
            <rect x="5" y="5" width="110" height="115" rx="55" fill="#14b8a6" />
            <rect x="45" y="116" width="30" height="40" rx="15" fill="#0d9488" />
          </svg>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500 leading-none mb-0.5">
          {paddle.brand}
        </p>
        <Link
          href={`/paddles/${paddle.slug}`}
          className="text-sm font-semibold leading-snug hover:text-brand-500 transition-colors truncate block"
          style={{ color: "var(--text-primary)" }}
        >
          {paddle.name}
        </Link>
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => toggle("heart")}
          aria-label="Love this paddle"
          className="p-2 rounded-lg transition-all duration-150 active:scale-90"
          style={{ color: reaction === "heart" ? "#ef4444" : "var(--text-muted)" }}
        >
          <Heart
            className="w-5 h-5"
            fill={reaction === "heart" ? "currentColor" : "none"}
            strokeWidth={2}
          />
        </button>
        <button
          onClick={() => toggle("dislike")}
          aria-label="Not for me"
          className="p-2 rounded-lg transition-all duration-150 active:scale-90"
          style={{ color: reaction === "dislike" ? "var(--text-secondary)" : "var(--text-muted)" }}
        >
          <ThumbsDown
            className="w-5 h-5"
            fill={reaction === "dislike" ? "currentColor" : "none"}
            strokeWidth={2}
          />
        </button>
      </div>
    </div>
  );
}

export default function ReviewPaddleGrid({ paddles }: { paddles: PaddleEntry[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {paddles.map((p) => (
        <PaddleReviewCard key={p.id} paddle={p} />
      ))}
    </div>
  );
}
