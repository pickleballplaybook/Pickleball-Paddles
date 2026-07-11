"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw, Send, Sparkles, Minus, Plus, Loader2, Save, Check, LineChart, LogOut } from "lucide-react";
import { saveMatchDb } from "@/lib/matchHistoryDb";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

// ── Tally categories ────────────────────────────────────────────────────────
const UE_ITEMS = [
  "Dink error",
  "Volley error",
  "Drive / groundstroke error",
  "Failed reset / popped up",
  "Speed-up error",
  "Around-the-post miss",
  "Lob miss",
  "Overhead miss",
  "Serve error",
  "Return error",
  "Drop error",
] as const;

const FE_ITEMS = [
  "Dink error (forced)",
  "Volley error (forced)",
  "Drive error (forced)",
  "Reset error (forced)",
  "Speed-up error (forced)",
  "Lob error (forced)",
  "Overhead error (forced)",
  "Drop error (forced)",
  "Return error (forced)",
] as const;

const WIN_ITEMS = [
  "Dink",
  "Drive",
  "Around-the-post (ATP)",
  "Lob",
  "Overhead put-away",
  "Erne",
  "Speed-up",
  "Ace",
] as const;

const COACHES = [
  {
    id: "tough" as const,
    label: "Tough & honest",
    description: "Direct, blunt — no sugarcoating",
    accent: "#ef4444",
  },
  {
    id: "encouraging" as const,
    label: "Encouraging",
    description: "Celebrate wins, guide growth positively",
    accent: "#22c55e",
  },
  {
    id: "mentor" as const,
    label: "Constructive mentor",
    description: "Balanced — explain the why",
    accent: "#0a64bc",
  },
];

type CoachId = (typeof COACHES)[number]["id"];
type Counts = Record<string, number>;

const initFromList = (items: readonly string[]): Counts =>
  Object.fromEntries(items.map((i) => [i, 0]));

const sum = (counts: Counts) =>
  Object.values(counts).reduce((a, b) => a + b, 0);

function computeRatio(wins: number, errors: number): string {
  if (errors === 0 && wins === 0) return "—";
  if (errors === 0) return `${wins} : 0`;
  return `${(wins / errors).toFixed(2)} : 1`;
}

// ── Tally row ───────────────────────────────────────────────────────────────
function TallyRow({
  label,
  count,
  accent,
  onInc,
  onDec,
}: {
  label: string;
  count: number;
  accent: string;
  onInc: () => void;
  onDec: () => void;
}) {
  const active = count > 0;
  return (
    <div className="flex items-stretch gap-1.5">
      <button
        type="button"
        onClick={onInc}
        aria-label={`Increment ${label}`}
        className="flex-1 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-left transition-colors active:scale-[0.99]"
        style={{
          background: active ? `${accent}14` : "var(--flip-bg-card)",
          border: `1px solid ${active ? `${accent}55` : "var(--flip-card-border)"}`,
        }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </span>
        <span
          className="text-base font-extrabold tabular-nums min-w-[1.5rem] text-right"
          style={{ color: active ? accent : "var(--text-muted)" }}
        >
          {count}
        </span>
      </button>
      <button
        type="button"
        onClick={onDec}
        disabled={count === 0}
        aria-label={`Decrement ${label}`}
        className="w-9 flex items-center justify-center rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: "var(--flip-bg-card)",
          border: "1px solid var(--flip-card-border)",
          color: "var(--text-muted)",
        }}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onInc}
        aria-label={`Add ${label}`}
        className="w-9 flex items-center justify-center rounded-xl transition-colors active:scale-[0.96]"
        style={{
          background: `${accent}14`,
          border: `1px solid ${accent}55`,
          color: accent,
        }}
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ── Tally section card ──────────────────────────────────────────────────────
function TallySection({
  title,
  subtitle,
  items,
  data,
  accent,
  onInc,
  onDec,
}: {
  title: string;
  subtitle: string;
  items: readonly string[];
  data: Counts;
  accent: string;
  onInc: (key: string) => void;
  onDec: (key: string) => void;
}) {
  const total = sum(data);
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h2 className="text-base font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
        <span
          className="text-sm font-extrabold tabular-nums"
          style={{ color: total > 0 ? accent : "var(--text-muted)" }}
        >
          {total}
        </span>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        {subtitle}
      </p>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <TallyRow
            key={item}
            label={item}
            count={data[item] ?? 0}
            accent={accent}
            onInc={() => onInc(item)}
            onDec={() => onDec(item)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Summary chip ────────────────────────────────────────────────────────────
function SummaryStat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p
        className="text-2xl font-extrabold tabular-nums tracking-tight"
        style={{ color: accent ?? "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function MatchAnalysisPage() {
  const [ueData, setUeData]     = useState<Counts>(initFromList(UE_ITEMS));
  const [feData, setFeData]     = useState<Counts>(initFromList(FE_ITEMS));
  const [winData, setWinData]   = useState<Counts>(initFromList(WIN_ITEMS));
  const [notes, setNotes]       = useState("");
  const [coach, setCoach]       = useState<CoachId>("mentor");
  const [output, setOutput]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auth session — null when signed out, email string when signed in.
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setAuthEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const ueTotal      = sum(ueData);
  const feTotal      = sum(feData);
  const totalErrors  = ueTotal + feTotal;
  const winnersTotal = sum(winData);
  const ratio        = computeRatio(winnersTotal, totalErrors);

  const mkInc = (setter: React.Dispatch<React.SetStateAction<Counts>>) => (key: string) =>
    setter((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
  const mkDec = (setter: React.Dispatch<React.SetStateAction<Counts>>) => (key: string) =>
    setter((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] ?? 0) - 1) }));

  function reset() {
    setUeData(initFromList(UE_ITEMS));
    setFeData(initFromList(FE_ITEMS));
    setWinData(initFromList(WIN_ITEMS));
    setNotes("");
    setOutput("");
    setErrorMsg(null);
  }

  async function handleSaveMatch() {
    // Not signed in → bounce to /login with return path back here.
    if (!authEmail) {
      router.push(`/login?next=${encodeURIComponent("/match/analysis")}`);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const ratioNum =
        totalErrors === 0 && winnersTotal === 0
          ? 0
          : totalErrors === 0
            ? winnersTotal
            : winnersTotal / totalErrors;
      await saveMatchDb({
        ueData,
        feData,
        winData,
        notes,
        ueTotal,
        feTotal,
        totalErrors,
        winnersTotal,
        ratio: ratioNum,
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save match.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    setAuthEmail(null);
  }

  async function submit() {
    setLoading(true);
    setOutput("");
    setErrorMsg(null);
    try {
      const response = await fetch("/api/match-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ueData, feData, winData, notes, coach }),
      });

      if (!response.ok || !response.body) {
        // Surface the actual server-side error so missing env vars or
        // upstream API failures are visible to the user instead of being
        // swallowed by a generic "unavailable" message.
        const detail = await response.text().catch(() => "");
        setErrorMsg(detail.trim() || "Coach feedback unavailable right now. Try again in a moment.");
        return;
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setOutput(accumulated);
      }
    } catch {
      setErrorMsg("Coach feedback unavailable right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pt-[156px] pb-32" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-10 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
              Match Analysis
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
              Video Review Tally Sheet
            </h1>
            <p className="text-sm md:text-base max-w-2xl" style={{ color: "var(--text-muted)" }}>
              Tap each item as you re-watch your match film. When you&apos;re done, pick a coach style and get personalized feedback on what to work on next.
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 flex-wrap justify-end">
            {/* Auth state */}
            {authEmail ? (
              <div className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
                <span className="font-semibold truncate max-w-[140px]" style={{ color: "var(--text-primary)" }}>
                  {authEmail}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="ml-1 transition-colors hover:text-red-500"
                  style={{ color: "var(--text-muted)" }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent("/match/analysis")}`}
                className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)", color: "var(--text-primary)" }}
              >
                Sign in
              </Link>
            )}
            <Link
              href="/match/history"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              style={{
                background: "var(--flip-bg-card)",
                border: "1px solid var(--flip-card-border)",
                color: "var(--text-muted)",
              }}
            >
              <LineChart className="w-3.5 h-3.5" />
              History
            </Link>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              style={{
                background: "var(--flip-bg-card)",
                border: "1px solid var(--flip-card-border)",
                color: "var(--text-muted)",
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Tally sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <TallySection
            title="Unforced Errors"
            subtitle="Your mistakes, not forced by opponent."
            items={UE_ITEMS}
            data={ueData}
            accent="#ef4444"
            onInc={mkInc(setUeData)}
            onDec={mkDec(setUeData)}
          />
          <TallySection
            title="Forced Errors"
            subtitle="Errors caused by opponent pressure."
            items={FE_ITEMS}
            data={feData}
            accent="#f59e0b"
            onInc={mkInc(setFeData)}
            onDec={mkDec(setFeData)}
          />
          <TallySection
            title="Winners & Attacks"
            subtitle="Points you finished or attacked successfully."
            items={WIN_ITEMS}
            data={winData}
            accent="#22c55e"
            onInc={mkInc(setWinData)}
            onDec={mkDec(setWinData)}
          />
        </div>

        {/* Summary */}
        <div
          className="rounded-2xl p-5 md:p-6 mb-8"
          style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "#60a5fa" }}>
            Summary
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SummaryStat label="Unforced"     value={ueTotal}      accent="#ef4444" />
            <SummaryStat label="Forced"       value={feTotal}      accent="#f59e0b" />
            <SummaryStat label="Total Errors" value={totalErrors} />
            <SummaryStat label="Winners"      value={winnersTotal} accent="#22c55e" />
            <SummaryStat label="W : E Ratio"  value={ratio}        accent="#0a64bc" />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
            Notes <span className="font-normal opacity-70">(optional — score, opponent, context)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Lost 11-7, 9-11, 8-11 to a 4.0 player. Felt slow at the kitchen all match."
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 transition-colors resize-y"
            style={{
              background: "var(--flip-bg-card)",
              border: "1px solid var(--flip-card-border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Coach selector */}
        <div className="mb-6">
          <p className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
            Coach Style
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COACHES.map((c) => {
              const selected = coach === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCoach(c.id)}
                  className="text-left rounded-xl px-4 py-3 transition-all"
                  style={{
                    background: selected ? `${c.accent}14` : "var(--flip-bg-card)",
                    border: `1px solid ${selected ? c.accent : "var(--flip-card-border)"}`,
                  }}
                >
                  <p className="text-sm font-bold mb-0.5" style={{ color: selected ? c.accent : "var(--text-primary)" }}>
                    {c.label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {c.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit + Save row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={loading || totalErrors + winnersTotal === 0}
            className="inline-flex items-center justify-center gap-2 flex-1 font-bold text-base py-3.5 px-8 rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--btn-buy-bg)",
              color: "var(--btn-buy-text)",
              boxShadow: "var(--btn-buy-shadow)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Getting feedback…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Get coach feedback
                <Send className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Save match — requires sign-in, persists to Supabase for /match/history */}
          <button
            type="button"
            onClick={handleSaveMatch}
            disabled={saving || totalErrors + winnersTotal === 0}
            className="inline-flex items-center justify-center gap-2 font-bold text-base py-3.5 px-6 rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--flip-bg-card)",
              border: "1px solid var(--flip-card-border)",
              color: "var(--text-primary)",
            }}
            title={!authEmail ? "Sign in to save matches across devices" : undefined}
          >
            {savedFlash ? (
              <>
                <Check className="w-4 h-4" style={{ color: "#22c55e" }} />
                Saved
              </>
            ) : saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {authEmail ? "Save match" : "Sign in to save"}
              </>
            )}
          </button>
        </div>

        {/* Save error */}
        {saveError && (
          <p className="text-xs mt-2" style={{ color: "#ef4444" }}>
            {saveError}
          </p>
        )}

        {/* Output */}
        {(output || errorMsg) && (
          <div
            className="mt-6 rounded-2xl p-5 md:p-6"
            style={{
              background: "var(--flip-bg-card)",
              border: errorMsg
                ? "1px solid #ef444466"
                : `1px solid ${COACHES.find((c) => c.id === coach)!.accent}55`,
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: errorMsg ? "#ef4444" : COACHES.find((c) => c.id === coach)!.accent }}
            >
              {errorMsg ? "Error" : `${COACHES.find((c) => c.id === coach)!.label} · Coach Feedback`}
            </p>
            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
              {errorMsg ?? output}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
