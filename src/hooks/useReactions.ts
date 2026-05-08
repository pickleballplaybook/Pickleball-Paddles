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

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useReactions(paddleId: string) {
  const [reaction, setReaction] = useState<Reaction>(null);

  // Load initial state from Supabase on mount
  useEffect(() => {
    const userKey = getUserKey();
    heartExists(paddleId, userKey).then((hearted) => {
      setReaction(hearted ? "heart" : null);
    });
  }, [paddleId]);

  const toggle = useCallback((r: "heart" | "dislike") => {
    if (r === "dislike") {
      // Dislike is UI-only — not stored anywhere
      setReaction((prev) => (prev === "dislike" ? null : "dislike"));
      return;
    }

    // Heart: optimistic update then sync to Supabase
    setReaction((prev) => {
      const next: Reaction = prev === "heart" ? null : "heart";
      const userKey = getUserKey();
      if (next === "heart") {
        addHeart(paddleId, userKey).then(() => {
          window.dispatchEvent(new CustomEvent("hearts-updated", { detail: { paddleId, delta: 1 } }));
        });
      } else {
        removeHeart(paddleId, userKey).then(() => {
          window.dispatchEvent(new CustomEvent("hearts-updated", { detail: { paddleId, delta: -1 } }));
        });
      }
      return next;
    });
  }, [paddleId]);

  return { reaction, toggle };
}

// ── Bulk fetch helpers ────────────────────────────────────────────────────────

/**
 * Fetch paddle IDs hearted by the current user from Supabase.
 * Used by the Saved page.
 */
export async function fetchSavedPaddleIds(): Promise<string[]> {
  const userKey = getUserKey();
  const { data, error } = await supabase
    .from("paddle_hearts")
    .select("paddle_id")
    .eq("user_key", userKey);
  if (error) {
    console.error("[fetchSavedPaddleIds]", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.paddle_id);
}

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

// ── Legacy shims (kept so other imports compile) ──────────────────────────────
// These no longer read localStorage. Code that relied on them should migrate
// to fetchSavedPaddleIds() / fetchUserReactionMap().

/** @deprecated Use fetchUserReactionMap() */
export function getAllReactions(): ReactionMap { return {}; }

/** @deprecated Use fetchSavedPaddleIds() */
export function getSavedPaddleIds(): string[] { return []; }
