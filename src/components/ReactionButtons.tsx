"use client";

import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useReactions } from "@/hooks/useReactions";
import { supabase } from "@/lib/supabaseClient";

// ─────────────────────────────────────────────────────────────────────────────
//  ReactionButtons — used on the paddle DETAIL page, below star ratings.
//  Larger and slightly more prominent than the PaddleCard VotePill, but the
//  same shape (single combined teal-outlined pill with thumbs up | thumbs
//  down + counts). Counts are live: thumbs-up reads from paddle_hearts
//  (existing), thumbs-down from paddle_dislikes (requires the migration in
//  supabase/migrations/2026-06-12_paddle_dislikes.sql — until that runs
//  in Supabase, the down count stays at 0).
// ─────────────────────────────────────────────────────────────────────────────

export default function ReactionButtons({ paddleId }: { paddleId: string }) {
  const { reaction, toggle } = useReactions(paddleId);
  const [upCount,   setUpCount]   = useState(0);
  const [downCount, setDownCount] = useState(0);

  // Per-paddle live counts. Fetched once on mount, then nudged by the
  // hearts-updated / dislikes-updated CustomEvents the hook fires, so the
  // numbers move the moment the user taps (no full refetch needed).
  useEffect(() => {
    let alive = true;

    async function loadCounts() {
      const [{ count: up }, { count: down }] = await Promise.all([
        supabase.from("paddle_hearts").select("paddle_id", { count: "exact", head: true }).eq("paddle_id", paddleId),
        supabase.from("paddle_dislikes").select("paddle_id", { count: "exact", head: true }).eq("paddle_id", paddleId)
          .then((r) => r.error ? { count: 0 } : r), // graceful fallback if table missing
      ]);
      if (alive) {
        setUpCount(up ?? 0);
        setDownCount(down ?? 0);
      }
    }
    loadCounts();

    function onHearts(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.paddleId === paddleId) setUpCount((c) => Math.max(0, c + (detail.delta ?? 0)));
    }
    function onDislikes(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.paddleId === paddleId) setDownCount((c) => Math.max(0, c + (detail.delta ?? 0)));
    }
    window.addEventListener("hearts-updated", onHearts);
    window.addEventListener("dislikes-updated", onDislikes);
    return () => {
      alive = false;
      window.removeEventListener("hearts-updated", onHearts);
      window.removeEventListener("dislikes-updated", onDislikes);
    };
  }, [paddleId]);

  const isUp   = reaction === "heart";
  const isDown = reaction === "dislike";

  return (
    <div
      className="inline-flex items-stretch rounded-full overflow-hidden text-sm font-bold tabular-nums"
      style={{
        border: "1px solid rgba(45,212,191,0.32)",
        background: "rgba(45,212,191,0.04)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      <button
        onClick={() => toggle("heart")}
        aria-label={`Thumbs up. ${upCount} ${upCount === 1 ? "vote" : "votes"}.`}
        aria-pressed={isUp}
        className="inline-flex items-center gap-2 px-4 py-2.5 transition-colors active:scale-[0.97]"
        style={{
          color: isUp ? "#2dd4bf" : "var(--flip-text-muted)",
          background: isUp ? "rgba(45,212,191,0.14)" : "transparent",
        }}
      >
        <ThumbsUp className="w-4 h-4" strokeWidth={2} fill={isUp ? "currentColor" : "none"} />
        <span>{upCount}</span>
      </button>

      <span aria-hidden style={{ width: 1, background: "rgba(45,212,191,0.32)" }} />

      <button
        onClick={() => toggle("dislike")}
        aria-label={`Thumbs down. ${downCount} ${downCount === 1 ? "vote" : "votes"}.`}
        aria-pressed={isDown}
        className="inline-flex items-center gap-2 px-4 py-2.5 transition-colors active:scale-[0.97]"
        style={{
          color: isDown ? "#fb7185" : "var(--flip-text-muted)",
          background: isDown ? "rgba(251,113,133,0.12)" : "transparent",
        }}
      >
        <ThumbsDown className="w-4 h-4" strokeWidth={2} fill={isDown ? "currentColor" : "none"} />
        <span>{downCount}</span>
      </button>
    </div>
  );
}
