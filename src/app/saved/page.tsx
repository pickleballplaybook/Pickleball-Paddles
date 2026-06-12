"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bookmark, ArrowLeft, ArrowRight, GitCompareArrows, Bell, CheckCircle2,
  Trash2, Sparkles,
} from "lucide-react";
import { fetchSavedPaddleIds, useReactions } from "@/hooks/useReactions";
import { paddles } from "@/data/paddles";
import { Paddle } from "@/types";
import { canonicalMatchup } from "@/app/compare/[matchup]/helpers";

// ─────────────────────────────────────────────────────────────────────────────
//  /saved
//  Personal shortlist for paddles the visitor has bookmarked. Purpose-built
//  to make saving feel useful so people actually do it:
//   - Quick stats up top (count, avg price, dominant play style)
//   - When 2+ paddles are saved, a prominent Compare Top 2 CTA →
//     /compare/<a>-vs-<b>
//   - Price-drop alert opt-in (newsletter signup gated by the saved list)
//   - Empty state routes to either the paddle list or the Quiz
// ─────────────────────────────────────────────────────────────────────────────

// Per-card actions live in this small subcomponent so the click handler
// re-runs the parent's `load()` after a successful un-save.
function SavedCard({ paddle, onRemoved }: { paddle: Paddle; onRemoved: () => void }) {
  const { toggle } = useReactions(paddle.id);
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4 transition-colors"
      style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)" }}
    >
      {/* Image / placeholder */}
      <Link href={`/paddles/${paddle.slug}`} className="flex-shrink-0">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center"
          style={{ background: "var(--bg-alt)" }}
        >
          {paddle.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={paddle.image} alt={paddle.name} className="w-12 h-12 object-contain" />
          ) : (
            <svg viewBox="0 0 60 80" fill="none" className="w-7 h-auto opacity-30" aria-hidden>
              <rect x="2" y="2" width="56" height="58" rx="28" fill="#14b8a6" />
              <rect x="22" y="58" width="16" height="20" rx="8" fill="#0d9488" />
            </svg>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#14b8a6" }}>
          {paddle.brand}
        </p>
        <Link
          href={`/paddles/${paddle.slug}`}
          className="text-sm font-bold truncate block hover:text-brand-500 transition-colors"
          style={{ color: "var(--text-primary)" }}
        >
          {paddle.name}
        </Link>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {paddle.shape} · {paddle.thickness}
          {paddle.price && <> · <span style={{ color: "var(--text-secondary)" }}>{paddle.price}</span></>}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Link
          href={`/paddles/${paddle.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:text-brand-500"
          style={{ color: "var(--text-muted)", border: "1px solid var(--card-border)" }}
        >
          View <ArrowRight className="w-3 h-3" />
        </Link>
        <button
          onClick={(e) => { e.stopPropagation(); toggle("heart"); onRemoved(); }}
          aria-label="Remove from saved"
          title="Remove from saved"
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <Trash2 className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// Inline price-drop alert opt-in. Posts to /api/newsletter-subscribe just
// like the SubstackCard does, but uses a different label so the user
// understands they're opting in specifically to alerts for these paddles.
function PriceDropOptIn({ count }: { count: number }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "submitting") return;
    setStatus("submitting");
    try {
      // /api/newsletter is the canonical subscribe endpoint — same one the
      // SubstackCard uses. Substack doesn't accept arbitrary `source` fields
      // so we don't pass one (the route's existing telemetry tags by referrer).
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div
        className="rounded-2xl p-5 flex items-center gap-3"
        style={{
          background: "rgba(20,184,166,0.08)",
          border: "1px solid rgba(20,184,166,0.25)",
        }}
      >
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#2dd4bf" }} />
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>You&apos;re on the list.</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            We&apos;ll email you when any of your saved paddles go on sale or drop in price.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl p-5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--card-border)",
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)" }}
        >
          <Bell className="w-4 h-4" style={{ color: "#2dd4bf" }} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-base leading-snug" style={{ color: "var(--text-primary)" }}>
            Get a price-drop alert
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Get an email if any of your {count} saved {count === 1 ? "paddle goes" : "paddles go"} on sale.
            One email per drop. Unsubscribe anytime.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          className="flex-1 px-4 py-2.5 text-sm rounded-xl outline-none focus:ring-2"
          style={{
            background: "var(--bg-alt)",
            border: "1px solid var(--card-border)",
            color: "var(--text-primary)",
          }}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="px-5 py-2.5 text-sm font-bold rounded-xl text-black transition-all disabled:opacity-60"
          style={{ background: "#2dd4bf" }}
        >
          {status === "submitting" ? "…" : "Notify me"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs mt-2" style={{ color: "#fb7185" }}>
          Something went wrong. Try again in a moment.
        </p>
      )}
    </form>
  );
}

export default function SavedPage() {
  const [savedPaddles, setSavedPaddles] = useState<Paddle[]>([]);
  const [loading, setLoading]           = useState(true);

  async function load() {
    const ids = await fetchSavedPaddleIds();
    setSavedPaddles(paddles.filter((p) => ids.includes(p.id)));
    setLoading(false);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Summary stats — cheap to compute on the client, no extra fetch.
  const stats = useMemo(() => {
    if (savedPaddles.length === 0) return null;
    const withPrice = savedPaddles
      .map((p) => parseFloat((p.price || "").replace(/[^0-9.]/g, "")))
      .filter((n) => n > 0);
    const avgPrice = withPrice.length > 0
      ? Math.round(withPrice.reduce((a, b) => a + b, 0) / withPrice.length)
      : null;
    // Dominant play style (mode). Skips paddles without a style set.
    const styleCounts: Record<string, number> = {};
    for (const p of savedPaddles) {
      if (p.playStyle) styleCounts[p.playStyle] = (styleCounts[p.playStyle] || 0) + 1;
    }
    const topStyle = Object.entries(styleCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
    return { count: savedPaddles.length, avgPrice, topStyle };
  }, [savedPaddles]);

  // Top 2 saved paddles → /compare/<a>-vs-<b>. Sorted by trendingScore desc
  // so the most-discussed pair is what the CTA actually compares.
  const compareUrl = useMemo(() => {
    if (savedPaddles.length < 2) return null;
    const top = [...savedPaddles]
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 2);
    return `/compare/${canonicalMatchup(top[0].slug, top[1].slug)}`;
  }, [savedPaddles]);

  return (
    <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-12 max-w-3xl">

        <Link
          href="/paddles"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-brand-500"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" /> All Paddles
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <Bookmark className="w-6 h-6" style={{ color: "#2dd4bf" }} fill="currentColor" />
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Your Shortlist
            </h1>
          </div>
          {stats && (
            <span
              className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full mt-1.5"
              style={{ background: "rgba(20,184,166,0.10)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.20)" }}
            >
              {stats.count} saved
            </span>
          )}
        </div>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          Your saved paddles in one place. Compare, get price-drop alerts, or jump back to any paddle&apos;s detail page.
        </p>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--bg-section)" }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && savedPaddles.length === 0 && (
          <div
            className="rounded-2xl p-10 text-center"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--card-border)",
            }}
          >
            <Bookmark className="w-12 h-12 mx-auto mb-5 opacity-20" style={{ color: "var(--text-muted)" }} />
            <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>
              Nothing saved yet
            </p>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
              Tap the bookmark on any paddle to add it here. Then compare, share, or get notified when prices drop.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <Link
                href="/paddles"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-bold rounded-xl text-black"
                style={{ background: "#2dd4bf" }}
              >
                Browse Paddles <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/review-paddles"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-bold rounded-xl"
                style={{ color: "var(--text-primary)", border: "1px solid var(--card-border)" }}
              >
                <Sparkles className="w-4 h-4" style={{ color: "#2dd4bf" }} /> Take the Paddle Quiz
              </Link>
            </div>
          </div>
        )}

        {/* Populated state */}
        {!loading && savedPaddles.length > 0 && (
          <>
            {/* Stat strip */}
            {stats && (
              <div
                className="grid grid-cols-3 gap-2 rounded-2xl p-3 mb-5"
                style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)" }}
              >
                <div className="text-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Saved</p>
                  <p className="text-xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{stats.count}</p>
                </div>
                <div className="text-center border-l border-r" style={{ borderColor: "var(--card-border)" }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Avg Price</p>
                  <p className="text-xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {stats.avgPrice ? `$${stats.avgPrice}` : "—"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Top Style</p>
                  <p className="text-xl font-extrabold capitalize" style={{ color: "var(--text-primary)" }}>
                    {stats.topStyle?.replace("-", " ") ?? "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Compare CTA — only when 2+ saved */}
            {compareUrl && (
              <Link
                href={compareUrl}
                className="rounded-2xl p-4 flex items-center justify-between gap-3 mb-5 transition-all hover:scale-[1.005]"
                style={{
                  background: "linear-gradient(135deg, rgba(20,184,166,0.10) 0%, rgba(20,184,166,0.03) 100%)",
                  border: "1px solid rgba(20,184,166,0.25)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(20,184,166,0.18)" }}
                  >
                    <GitCompareArrows className="w-5 h-5" style={{ color: "#2dd4bf" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                      Compare your top 2 picks
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Side-by-side specs, ratings, and verdicts
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "#2dd4bf" }} />
              </Link>
            )}

            {/* Cards */}
            <div className="flex flex-col gap-3 mb-8">
              {savedPaddles.map((p) => (
                <SavedCard key={p.id} paddle={p} onRemoved={load} />
              ))}
            </div>

            {/* Price-drop alert */}
            <PriceDropOptIn count={savedPaddles.length} />
          </>
        )}

      </div>
    </div>
  );
}
