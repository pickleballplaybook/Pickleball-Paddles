"use client";

import { useState, useEffect, useCallback } from "react";
import type { Reaction, ReactionEntry, ReactionMap } from "@/types";
import { supabase } from "@/lib/supabaseClient";

export type { Reaction, ReactionEntry, ReactionMap };

// ── Anonymous user key ────────────────────────────────────────────────────────
// The ONLY thing stored in localStorage — a stable UUID identifying this browser.
// Hearts themselves live in Supabase, not localStorage.

const USER_KEY_STORAGE = "ppb_user_key";

export function getUserKey(): string {
  try {
    let key = localStorage.getItem(USER_KEY_STORAGE);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(USER_KEY_STORAGE, key);
    }
    return key;
  } catch {
    // Private/incognito mode — generate ephemeral key
    return crypto.randomUUID();
  }
}

// ── Supabase heart operations ─────────────────────────────────────────────────
// The DB still uses "paddle_hearts" / "heart" naming; the user-facing concept
// is now thumbs-up (the Save metaphor was scrapped in favor of votes). Internal
// names stay so existing data and queries keep working unchanged.

async function heartExists(paddleId: string, userKey: string): Promise<boolean> {
  const { data } = await supabase
    .from("paddle_hearts")
    .select("paddle_id")
    .eq("paddle_id", paddleId)
    .eq("user_key", userKey)
    .maybeSingle();
  return data !== null;
}

async function addHeart(paddleId: string, userKey: string): Promise<void> {
  const { error } = await supabase
    .from("paddle_hearts")
    .upsert({ paddle_id: paddleId, user_key: userKey }, { onConflict: "paddle_id,user_key" });
  if (error) console.error("[useReactions] insert error:", error.message);
}

async function removeHeart(paddleId: string, userKey: string): Promise<void> {
  const { error } = await supabase
    .from("paddle_hearts")
    .delete()
    .eq("paddle_id", paddleId)
    .eq("user_key", userKey);
  if (error) console.error("[useReactions] delete error:", error.message);
}

// ── Supabase dislike operations ───────────────────────────────────────────────
// Mirrors the heart functions against a paddle_dislikes table. If the table
// hasn't been created yet (Supabase migration pending), every call here
// fails silently — the UI keeps working with optimistic local state, the
// vote just won't be persisted across sessions.

async function dislikeExists(paddleId: string, userKey: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("paddle_dislikes")
      .select("paddle_id")
      .eq("paddle_id", paddleId)
      .eq("user_key", userKey)
      .maybeSingle();
    if (error) return false;
    return data !== null;
  } catch {
    return false;
  }
}

async function addDislike(paddleId: string, userKey: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("paddle_dislikes")
      .upsert({ paddle_id: paddleId, user_key: userKey }, { onConflict: "paddle_id,user_key" });
    if (error) console.warn("[useReactions] dislike insert failed (table missing?):", error.message);
  } catch (e) {
    console.warn("[useReactions] dislike insert exception:", e);
  }
}

async function removeDislike(paddleId: string, userKey: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("paddle_dislikes")
      .delete()
      .eq("paddle_id", paddleId)
      .eq("user_key", userKey);
    if (error) console.warn("[useReactions] dislike delete failed:", error.message);
  } catch (e) {
    console.warn("[useReactions] dislike delete exception:", e);
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useReactions(paddleId: string) {
  const [reaction, setReaction] = useState<Reaction>(null);

  // Load initial state from Supabase on mount — check both heart + dislike
  // tables so the button reflects the user's saved vote across both axes.
  useEffect(() => {
    const userKey = getUserKey();
    Promise.all([
      heartExists(paddleId, userKey),
      dislikeExists(paddleId, userKey),
    ]).then(([hearted, disliked]) => {
      setReaction(hearted ? "heart" : disliked ? "dislike" : null);
    });
  }, [paddleId]);

  const toggle = useCallback((r: "heart" | "dislike") => {
    // Toggling thumbs-up while a dislike is set (or vice versa) needs to
    // clean up the OTHER reaction in the DB too, so each user contributes
    // at most one vote in one direction. Tracked via the prev state.
    setReaction((prev) => {
      const userKey = getUserKey();
      const next: Reaction = prev === r ? null : r;

      if (r === "heart") {
        if (next === "heart") {
          addHeart(paddleId, userKey).then(() => {
            window.dispatchEvent(new CustomEvent("hearts-updated", { detail: { paddleId, delta: 1 } }));
          });
          // Switching from dislike → heart: also remove the prior dislike.
          if (prev === "dislike") {
            removeDislike(paddleId, userKey).then(() => {
              window.dispatchEvent(new CustomEvent("dislikes-updated", { detail: { paddleId, delta: -1 } }));
            });
          }
        } else {
          removeHeart(paddleId, userKey).then(() => {
            window.dispatchEvent(new CustomEvent("hearts-updated", { detail: { paddleId, delta: -1 } }));
          });
        }
      } else {
        // r === "dislike"
        if (next === "dislike") {
          addDislike(paddleId, userKey).then(() => {
            window.dispatchEvent(new CustomEvent("dislikes-updated", { detail: { paddleId, delta: 1 } }));
          });
          if (prev === "heart") {
            removeHeart(paddleId, userKey).then(() => {
              window.dispatchEvent(new CustomEvent("hearts-updated", { detail: { paddleId, delta: -1 } }));
            });
          }
        } else {
          removeDislike(paddleId, userKey).then(() => {
            window.dispatchEvent(new CustomEvent("dislikes-updated", { detail: { paddleId, delta: -1 } }));
          });
        }
      }
      return next;
    });
  }, [paddleId]);

  return { reaction, toggle };
}

// ── Bulk fetch helpers ────────────────────────────────────────────────────────

/**
 * Fetch current user's hearts as a ReactionMap.
 * Used by PaddlesPage for "most-hearts" and "popular-month" sorting.
 */
export async function fetchUserReactionMap(): Promise<ReactionMap> {
  const userKey = getUserKey();
  const { data, error } = await supabase
    .from("paddle_hearts")
    .select("paddle_id, created_at")
    .eq("user_key", userKey);
  if (error) {
    console.error("[fetchUserReactionMap]", error.message);
    return {};
  }
  const map: ReactionMap = {};
  for (const row of data ?? []) {
    map[row.paddle_id] = {
      r:  "heart",
      ts: new Date(row.created_at).getTime(),
    };
  }
  return map;
}

