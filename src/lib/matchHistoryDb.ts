"use client";

import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { Counts, SavedMatch } from "@/lib/matchHistory";

/**
 * Supabase-backed match history (replaces localStorage when the user
 * is signed in).
 *
 * Returns the same SavedMatch shape as src/lib/matchHistory.ts so the
 * /match/history page renders identically whether the source is local
 * or cloud.
 *
 * All functions throw on errors so callers can show meaningful messages.
 */

interface DbRow {
  id: string;
  saved_at: string;
  ue_data: Counts;
  fe_data: Counts;
  win_data: Counts;
  notes: string;
  ue_total: number;
  fe_total: number;
  total_errors: number;
  winners_total: number;
  ratio: number;
}

function fromRow(r: DbRow): SavedMatch {
  return {
    id:           r.id,
    savedAt:      r.saved_at,
    ueData:       r.ue_data  ?? {},
    feData:       r.fe_data  ?? {},
    winData:      r.win_data ?? {},
    notes:        r.notes    ?? "",
    ueTotal:      r.ue_total,
    feTotal:      r.fe_total,
    totalErrors:  r.total_errors,
    winnersTotal: r.winners_total,
    ratio:        Number(r.ratio),
  };
}

export async function getMatchesDb(): Promise<SavedMatch[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("match_history")
    .select("id, saved_at, ue_data, fe_data, win_data, notes, ue_total, fe_total, total_errors, winners_total, ratio")
    .order("saved_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbRow[]).map(fromRow);
}

export async function saveMatchDb(
  payload: Omit<SavedMatch, "id" | "savedAt">,
): Promise<SavedMatch> {
  const supabase = getSupabaseBrowser();

  // Get current user — RLS requires user_id to match auth.uid().
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    throw new Error("You must be signed in to save a match.");
  }

  const { data, error } = await supabase
    .from("match_history")
    .insert({
      user_id:       userRes.user.id,
      ue_data:       payload.ueData,
      fe_data:       payload.feData,
      win_data:      payload.winData,
      notes:         payload.notes,
      ue_total:      payload.ueTotal,
      fe_total:      payload.feTotal,
      total_errors:  payload.totalErrors,
      winners_total: payload.winnersTotal,
      ratio:         payload.ratio,
    })
    .select("id, saved_at, ue_data, fe_data, win_data, notes, ue_total, fe_total, total_errors, winners_total, ratio")
    .single();

  if (error) throw new Error(error.message);
  return fromRow(data as DbRow);
}

export async function deleteMatchDb(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("match_history").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Bulk-migrate matches from the legacy localStorage store into Supabase.
 * Called once after a user signs in if they have local matches stored.
 * Returns the number successfully migrated.
 */
export async function migrateLocalMatches(matches: SavedMatch[]): Promise<number> {
  if (matches.length === 0) return 0;
  const supabase = getSupabaseBrowser();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    throw new Error("You must be signed in to migrate matches.");
  }

  const rows = matches.map((m) => ({
    user_id:       userRes.user!.id,
    saved_at:      m.savedAt,
    ue_data:       m.ueData,
    fe_data:       m.feData,
    win_data:      m.winData,
    notes:         m.notes,
    ue_total:      m.ueTotal,
    fe_total:      m.feTotal,
    total_errors:  m.totalErrors,
    winners_total: m.winnersTotal,
    ratio:         m.ratio,
  }));

  const { error } = await supabase.from("match_history").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}
