"use client";

import { Heart, ThumbsDown } from "lucide-react";
import { useReactions } from "@/hooks/useReactions";

export default function ReactionButtons({ paddleId }: { paddleId: string }) {
  const { reaction, toggle } = useReactions(paddleId);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => toggle("heart")}
        aria-label="Save this paddle"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
        style={{
          background: reaction === "heart" ? "rgba(239,68,68,0.1)" : "var(--flip-bg-card)",
          color: reaction === "heart" ? "#ef4444" : "var(--flip-text-muted)",
          border: `1px solid ${reaction === "heart" ? "rgba(239,68,68,0.3)" : "var(--flip-card-border)"}`,
        }}
      >
        <Heart
          className="w-4 h-4"
          fill={reaction === "heart" ? "currentColor" : "none"}
          strokeWidth={2}
        />
        {reaction === "heart" ? "Saved" : "Save"}
      </button>

      <button
        onClick={() => toggle("dislike")}
        aria-label="Not for me"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
        style={{
          background: reaction === "dislike" ? "rgba(100,116,139,0.1)" : "var(--flip-bg-card)",
          color: reaction === "dislike" ? "var(--flip-text-body)" : "var(--flip-text-muted)",
          border: `1px solid ${reaction === "dislike" ? "var(--border)" : "var(--flip-card-border)"}`,
        }}
      >
        <ThumbsDown
          className="w-4 h-4"
          fill={reaction === "dislike" ? "currentColor" : "none"}
          strokeWidth={2}
        />
        Not for me
      </button>
    </div>
  );
}
