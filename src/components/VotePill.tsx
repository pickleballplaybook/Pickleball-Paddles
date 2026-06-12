"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useReactions } from "@/hooks/useReactions";

// ─────────────────────────────────────────────────────────────────────────────
//  VotePill
//  A single rounded teal-outlined pill containing thumbs-up + count, a hairline
//  divider, and thumbs-down + count. One shape rather than the more common
//  two-pills-side-by-side treatment — this is the structural difference that
//  makes the card look distinct vs reference designs.
//
//  Used on PaddleCard. The on-paddle-page version (ReactionButtons) uses a
//  larger, more prominent treatment.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  paddleId: string;
  upCount: number;
  downCount: number;
  /** Slightly larger variant for the paddle detail page. */
  size?: "sm" | "md";
}

export default function VotePill({ paddleId, upCount, downCount, size = "sm" }: Props) {
  const { reaction, toggle } = useReactions(paddleId);

  const isUp   = reaction === "heart";
  const isDown = reaction === "dislike";

  const pad         = size === "sm" ? "px-2 py-1"     : "px-3 py-1.5";
  const iconSize    = size === "sm" ? "w-3.5 h-3.5"   : "w-4 h-4";
  const fontSize    = size === "sm" ? "text-[11px]"   : "text-sm";
  const gapBetween  = size === "sm" ? "gap-1.5"       : "gap-2";

  return (
    <div
      className={`inline-flex items-stretch rounded-full overflow-hidden ${fontSize} font-bold tabular-nums`}
      style={{
        border: "1px solid rgba(45,212,191,0.30)",
        background: "rgba(45,212,191,0.04)",
      }}
    >
      {/* ── Thumbs up ── */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle("heart"); }}
        aria-label={`Thumbs up. ${upCount} ${upCount === 1 ? "vote" : "votes"}.`}
        aria-pressed={isUp}
        className={`inline-flex items-center ${gapBetween} ${pad} transition-colors`}
        style={{
          color: isUp ? "#2dd4bf" : "var(--text-muted)",
          background: isUp ? "rgba(45,212,191,0.14)" : "transparent",
        }}
      >
        <ThumbsUp
          className={iconSize}
          strokeWidth={2}
          fill={isUp ? "currentColor" : "none"}
        />
        <span>{upCount}</span>
      </button>

      {/* Divider — same hairline as the outer border so it reads as one shape */}
      <span aria-hidden style={{ width: 1, background: "rgba(45,212,191,0.30)" }} />

      {/* ── Thumbs down ── */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle("dislike"); }}
        aria-label={`Thumbs down. ${downCount} ${downCount === 1 ? "vote" : "votes"}.`}
        aria-pressed={isDown}
        className={`inline-flex items-center ${gapBetween} ${pad} transition-colors`}
        style={{
          color: isDown ? "#fb7185" : "var(--text-muted)",
          background: isDown ? "rgba(251,113,133,0.12)" : "transparent",
        }}
      >
        <ThumbsDown
          className={iconSize}
          strokeWidth={2}
          fill={isDown ? "currentColor" : "none"}
        />
        <span>{downCount}</span>
      </button>
    </div>
  );
}
