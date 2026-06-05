/**
 * matchHistory
 * ------------
 * localStorage-backed store for /match/analysis tally records.
 *
 * No auth, no backend — saves per browser. Trade-off: clearing cache or
 * switching devices wipes the data. Trade-up: zero friction, ships instantly.
 * Migrating to Supabase later just means swapping the four exported
 * functions; the shape and callers stay the same.
 */

const STORAGE_KEY = "ppb_match_history_v1";

export type Counts = Record<string, number>;

export interface SavedMatch {
  id: string;            // uuid-ish (timestamp + random)
  savedAt: string;       // ISO datetime
  ueData: Counts;
  feData: Counts;
  winData: Counts;
  notes: string;
  // Derived stats — stored so the history page can render fast w/o recomputing
  ueTotal: number;
  feTotal: number;
  totalErrors: number;
  winnersTotal: number;
  ratio: number;         // numeric (wins / errors), 0 if errors === 0
}

// ── Read ────────────────────────────────────────────────────────────────────
export function getMatches(): SavedMatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedMatch);
  } catch {
    return [];
  }
}

// ── Write ───────────────────────────────────────────────────────────────────
export function saveMatch(
  payload: Omit<SavedMatch, "id" | "savedAt">,
): SavedMatch {
  const match: SavedMatch = {
    ...payload,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
  };
  const all = [match, ...getMatches()];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Quota exceeded or storage disabled — silently noop.
  }
  return match;
}

export function deleteMatch(id: string): void {
  const next = getMatches().filter((m) => m.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // noop
  }
}

export function clearAllMatches(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

// ── Aggregations ────────────────────────────────────────────────────────────
export function aggregate(
  matches: SavedMatch[],
  key: "ueData" | "feData" | "winData",
): { label: string; total: number }[] {
  const sum: Record<string, number> = {};
  for (const m of matches) {
    for (const [label, n] of Object.entries(m[key])) {
      sum[label] = (sum[label] ?? 0) + n;
    }
  }
  return Object.entries(sum)
    .filter(([, n]) => n > 0)
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);
}

export function totals(matches: SavedMatch[]) {
  const ue = matches.reduce((s, m) => s + m.ueTotal, 0);
  const fe = matches.reduce((s, m) => s + m.feTotal, 0);
  const errors = ue + fe;
  const wins = matches.reduce((s, m) => s + m.winnersTotal, 0);
  const ratio = errors === 0 && wins === 0 ? 0 : errors === 0 ? wins : wins / errors;
  return { ue, fe, errors, wins, ratio };
}

// ── Type guard ──────────────────────────────────────────────────────────────
function isSavedMatch(v: unknown): v is SavedMatch {
  if (!v || typeof v !== "object") return false;
  const m = v as Partial<SavedMatch>;
  return (
    typeof m.id === "string" &&
    typeof m.savedAt === "string" &&
    typeof m.ueTotal === "number" &&
    typeof m.feTotal === "number" &&
    typeof m.winnersTotal === "number" &&
    typeof m.ratio === "number" &&
    typeof m.ueData === "object" &&
    typeof m.feData === "object" &&
    typeof m.winData === "object"
  );
}
