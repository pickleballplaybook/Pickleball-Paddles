"use client";

import { Bookmark, ThumbsDown } from "lucide-react";
import { useReactions } from "@/hooks/useReactions";

// NOTE: the internal reaction key stays "heart" (and the DB table name stays
// paddle_hearts) so the existing data doesn't break. Only the user-facing
// presentation — icon, color, label — switches to the Save metaphor. That
// metaphor change is the whole point: a heart says "I love this", a bookmark
// says "I want to come back to this", and the second is what actually drives
// people to click on a paddle comparison site.

export default function ReactionButtons({ paddleId }: { paddleId: string }) {
  const { reaction, toggle } = useReactions(paddleId);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => toggle("heart")}
        aria-label="Save this paddle"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
        style={{
          background: reaction === "heart" ? "rgba(20,184,166,0.10)" : "var(--flip-bg-card)",
          color:      reaction === "heart" ? "#2dd4bf"               : "var(--flip-text-muted)",
          border: `1px solid ${reaction === "heart" ? "rgba(20,184,166,0.30)" : "var(--flip-card-border)"}`,
        }}
      >
        <Bookmark
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
