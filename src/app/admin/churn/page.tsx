import Link from "next/link";
import {
  Download,
  TrendingDown,
  MessageSquare,
  Sparkles,
  Clock,
} from "lucide-react";
import { AdminNav } from "../_components/AdminNav";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import ChurnReasonGroup from "./ChurnReasonGroup";

// 60-second per-window cache for the combined cancellations + reasons data.
type CacheEntry = { rows: Row[]; cachedAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /admin/churn
 * ------------
 * Source of truth = Supabase `subscription_mirror` (the same data
 * /admin/email uses). Every Stripe `customer.subscription.deleted` event
 * lands here via webhook, so the counts include cancellations that
 * happened OUTSIDE the in-app cancel flow (Apple App Store, Stripe
 * portal, admin-issued, failed-payment auto-cancel, etc.) — not just
 * users who clicked "Cancel" inside the app.
 *
 * Each canceled sub gets classified as:
 *   canceled — canceled_at < trial_end (bailed during the free trial)
 *   churned  — canceled_at ≥ trial_end (paid at least once then left)
 *
 * Feedback (reason + comment) gets joined in from Firestore
 * `cancellation_reasons` when available — only the subset of users who
 * went through the in-app cancel UI. Most cancellations won't have a
 * reason, which is itself informative.
 */

// Raw shape coming back from Firestore (before classification).
type RawRow = {
  id: string;
  userId: string | null;
  email: string | null;
  name: string | null;
  reason: string;
  comment: string | null;
  plan: string | null;
  platform: string | null;
  createdAt: string | null;
};

// Classified shape used by the rest of the page.
export type ChurnKind = "canceled" | "churned" | "unknown";
type Row = RawRow & { kind: ChurnKind };

const WINDOWS: Record<string, { label: string; days: number | null }> = {
  "7":  { label: "Last 7 days",  days: 7 },
  "30": { label: "Last 30 days", days: 30 },
  "90": { label: "Last 90 days", days: 90 },
  all:  { label: "All time",     days: null },
};

const KIND_META: Record<ChurnKind, { label: string; color: string; bg: string; border: string }> = {
  canceled: { label: "Canceled (trial)", color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.35)" },
  churned:  { label: "Churned (paid)",   color: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.35)" },
  unknown:  { label: "Unknown",          color: "#94a3b8", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.30)" },
};

type FilterKind = "all" | "canceled" | "churned";

// Fetch ALL subscription_mirror rows (paginates around Supabase's 1000-row
// default cap). Returns a map keyed by lowercased email → array of subs
// (a customer can have multiple subs, e.g. canceled then resubscribed).
async function loadStripeMirror(): Promise<Map<string, Array<{
  canceled_at: string | null;
  trial_end: string | null;
  created_at: string;
}>>> {
  const supabase = getSupabaseAdmin();
  const byEmail = new Map<string, Array<{
    canceled_at: string | null;
    trial_end: string | null;
    created_at: string;
  }>>();
  const PAGE_SIZE = 1000;
  const MAX_ROWS = 100_000;
  let offset = 0;
  while (offset < MAX_ROWS) {
    const { data, error } = await supabase
      .from("subscription_mirror")
      .select("email, canceled_at, trial_end, subscription_created_at")
      .order("subscription_created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error || !data || data.length === 0) break;
    for (const r of data as Array<{
      email: string;
      canceled_at: string | null;
      trial_end: string | null;
      subscription_created_at: string;
    }>) {
      const key = r.email.toLowerCase().trim();
      const list = byEmail.get(key) ?? [];
      list.push({
        canceled_at: r.canceled_at,
        trial_end: r.trial_end,
        created_at: r.subscription_created_at,
      });
      byEmail.set(key, list);
    }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return byEmail;
}

// For a given cancellation event (email + cancel timestamp), find the
// best-matching Stripe sub and classify trial vs paid. "Best match" =
// the subscription whose canceled_at is closest to the reason's
// createdAt (cancellations happen seconds-to-minutes apart usually).
function classifyCancellation(
  row: RawRow,
  mirror: Map<string, Array<{
    canceled_at: string | null;
    trial_end: string | null;
    created_at: string;
  }>>,
): ChurnKind {
  if (!row.email) return "unknown";
  const subs = mirror.get(row.email.toLowerCase().trim());
  if (!subs || subs.length === 0) return "unknown";

  // Pick the sub whose Stripe canceled_at is closest in time to the reason's
  // createdAt. Falls back to the newest sub if none have canceled_at.
  let best: typeof subs[number] | null = null;
  if (row.createdAt) {
    const target = new Date(row.createdAt).getTime();
    let bestDiff = Infinity;
    for (const s of subs) {
      if (!s.canceled_at) continue;
      const diff = Math.abs(new Date(s.canceled_at).getTime() - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = s;
      }
    }
  }
  if (!best) best = subs[0]; // newest sub fallback

  // No trial recorded on the sub = sub created without trial = any cancel
  // is a churn (they paid right out the gate).
  if (!best.trial_end) return "churned";
  if (!best.canceled_at) return "unknown";

  // Canceled before trial ended = bailed during trial. After = churned.
  return new Date(best.canceled_at) <= new Date(best.trial_end)
    ? "canceled"
    : "churned";
}

export default async function ChurnAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string; kind?: string }>;
}) {
  const sp = await searchParams;
  const winKey = sp.window && WINDOWS[sp.window] ? sp.window : "30";
  const win = WINDOWS[winKey];
  const filterKind: FilterKind =
    sp.kind === "canceled" || sp.kind === "churned" ? sp.kind : "all";

  let allRows: Row[] = [];
  let loadError: string | null = null;

  const cacheKey = winKey;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    allRows = cached.rows.map((r) => ({ ...r, kind: r.kind ?? "unknown" })) as Row[];
  } else {
    try {
      // 1. Pull every canceled subscription from subscription_mirror in
      //    the window. THIS is the source of truth — captures every
      //    cancellation regardless of where it came from (in-app cancel,
      //    App Store, Stripe portal, admin-issued, etc.).
      const supabase = getSupabaseAdmin();
      const cutoffIso = win.days !== null
        ? new Date(Date.now() - win.days * 86_400_000).toISOString()
        : null;
      let cancelQuery = supabase
        .from("subscription_mirror")
        .select("email, canceled_at, trial_end, subscription_created_at, plan_label")
        .eq("status", "canceled")
        .order("canceled_at", { ascending: false })
        .limit(10_000);
      if (cutoffIso) {
        cancelQuery = cancelQuery.gte("canceled_at", cutoffIso);
      }
      const { data: cancels, error: cancelErr } = await cancelQuery;
      if (cancelErr) throw new Error(`subscription_mirror query failed: ${cancelErr.message}`);

      // 2. Pull in-app cancel-flow feedback for the same window (to join).
      const db = getFirebaseFirestore();
      let reasonsQ = db
        .collection("cancellation_reasons")
        .orderBy("createdAt", "desc")
        .limit(2000);
      if (win.days !== null) {
        const cutoff = new Date(Date.now() - win.days * 86_400_000);
        reasonsQ = db
          .collection("cancellation_reasons")
          .where("createdAt", ">=", cutoff)
          .orderBy("createdAt", "desc")
          .limit(2000);
      }
      const reasonsSnap = await reasonsQ.get();
      type ReasonData = {
        userId: string | null;
        email: string | null;
        name: string | null;
        reason: string;
        comment: string | null;
        plan: string | null;
        platform: string | null;
        createdAt: string | null;
      };
      const reasonByEmail = new Map<string, ReasonData>();
      for (const d of reasonsSnap.docs) {
        const data = d.data();
        const email = (data.email as string | null)?.toLowerCase()?.trim();
        if (!email) continue;
        // Keep the most recent reason per email (docs are ordered desc).
        if (reasonByEmail.has(email)) continue;
        reasonByEmail.set(email, {
          userId: (data.userId as string | null) ?? null,
          email,
          name: (data.name as string | null) ?? null,
          reason: (data.reason as string) ?? "(no reason given)",
          comment: (data.comment as string | null) ?? null,
          plan: (data.plan as string | null) ?? null,
          platform: (data.platform as string | null) ?? null,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        });
      }

      // 3. Build unified rows. Each canceled sub becomes one row,
      //    classified as canceled/churned by canceled_at vs trial_end.
      allRows = (cancels || []).map((sub, idx) => {
        const email = (sub.email || "").toLowerCase().trim();
        const reason = reasonByEmail.get(email);
        const kind: ChurnKind = (() => {
          if (!sub.trial_end) return "churned"; // no trial = direct purchase, any cancel is churn
          if (!sub.canceled_at) return "unknown";
          return new Date(sub.canceled_at) <= new Date(sub.trial_end) ? "canceled" : "churned";
        })();
        return {
          id: `${email}_${idx}`,
          userId: reason?.userId ?? null,
          email: sub.email,
          name: reason?.name ?? null,
          reason: reason?.reason ?? "(no reason given)",
          comment: reason?.comment ?? null,
          plan: reason?.plan ?? sub.plan_label ?? null,
          platform: reason?.platform ?? null,
          createdAt: sub.canceled_at,
          kind,
        };
      });

      cache.set(cacheKey, { rows: allRows, cachedAt: Date.now() });
    } catch (e) {
      loadError = e instanceof Error ? e.message : "Failed to load cancellations.";
    }
  }

  // Tab filter.
  const filteredRows: Row[] =
    filterKind === "all" ? allRows : allRows.filter((r) => r.kind === filterKind);

  const total = filteredRows.length;
  const countByKind: Record<ChurnKind, number> = { canceled: 0, churned: 0, unknown: 0 };
  for (const r of allRows) countByKind[r.kind]++;

  const byReason = new Map<string, number>();
  for (const r of filteredRows) {
    if (r.reason === "(no reason given)") continue;
    byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + 1);
  }
  const sortedReasons = Array.from(byReason.entries()).sort((a, b) => b[1] - a[1]);
  const maxReasonCount = sortedReasons[0]?.[1] ?? 1;
  const commented = filteredRows.filter((r) => r.comment && r.comment.trim().length > 0);
  const topReason = sortedReasons[0];

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-page)", paddingTop: "calc(var(--topbar-h, 108px) + 1rem)" }}>
      <div className="container-xl py-10 max-w-6xl mx-auto">
        <AdminNav />

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#ef4444" }}>
            Admin · Churn analysis
          </p>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Why people leave.
          </h1>
        </div>

        {/* Time window */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {Object.entries(WINDOWS).map(([key, w]) => {
            const isActive = key === winKey;
            return (
              <Link
                key={key}
                href={`/admin/churn?window=${key}${filterKind !== "all" ? `&kind=${filterKind}` : ""}`}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: isActive ? "var(--text-primary)" : "transparent",
                  color: isActive ? "var(--bg-page)" : "var(--text-muted)",
                  border: `1px solid ${isActive ? "var(--text-primary)" : "var(--flip-card-border)"}`,
                }}
              >
                {w.label}
              </Link>
            );
          })}
        </div>

        {loadError && (
          <div
            className="rounded-2xl px-5 py-4 mb-6 text-sm flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}
          >
            <TrendingDown className="w-4 h-4 mt-0.5" />
            <div>{loadError}</div>
          </div>
        )}

        {/* Hero stats — split out canceled vs churned with prominence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <HeroStat
            label="Total cancellations"
            value={allRows.length}
            color="var(--text-primary)"
            icon={<TrendingDown />}
            iconColor="#94a3b8"
            subtitle={`${commented.length} included a comment`}
            highlight={false}
          />
          <HeroStat
            label="Canceled during trial"
            value={countByKind.canceled}
            color="#f59e0b"
            icon={<Clock />}
            iconColor="#f59e0b"
            subtitle="Never paid — pre-paywall objections"
            highlight={filterKind === "canceled"}
            href={`/admin/churn?window=${winKey}&kind=canceled`}
          />
          <HeroStat
            label="Churned (paid then left)"
            value={countByKind.churned}
            color="#ef4444"
            icon={<TrendingDown />}
            iconColor="#ef4444"
            subtitle="Lost MRR — retention problem"
            highlight={filterKind === "churned"}
            href={`/admin/churn?window=${winKey}&kind=churned`}
          />
        </div>

        {/* Kind toggle */}
        <div
          className="inline-flex p-1 rounded-xl mb-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--flip-card-border)",
          }}
        >
          {([
            { key: "all",      label: "All",      color: "var(--text-primary)" },
            { key: "canceled", label: "Canceled · trial", color: "#f59e0b" },
            { key: "churned",  label: "Churned · paid",   color: "#ef4444" },
          ] as const).map((tab) => {
            const isActive = filterKind === tab.key;
            const href =
              tab.key === "all"
                ? `/admin/churn?window=${winKey}`
                : `/admin/churn?window=${winKey}&kind=${tab.key}`;
            return (
              <Link
                key={tab.key}
                href={href}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                style={{
                  background: isActive ? tab.color : "transparent",
                  color: isActive
                    ? tab.key === "all"
                      ? "var(--bg-page)"
                      : "#0a1628"
                    : "var(--text-muted)",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <a
            href={`/api/admin/churn/export?window=${winKey}`}
            className="inline-flex items-center gap-2 font-bold text-sm py-3 px-5 rounded-xl transition-all active:scale-[0.98] hover:scale-[1.01]"
            style={{
              background: "var(--btn-buy-bg)",
              color: "var(--btn-buy-text)",
              boxShadow: "var(--btn-buy-shadow)",
            }}
          >
            <Download className="w-4 h-4" />
            Export CSV ({allRows.length} rows)
          </a>
          {topReason && (
            <div
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--flip-card-border)",
                color: "var(--text-muted)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#defa32" }} />
              Top reason:{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                {topReason[0]}
              </span>
              <span className="opacity-60">
                · {topReason[1]} of {total}
              </span>
            </div>
          )}
        </div>

        {/* Reasons breakdown — always shows BOTH canceled and churned charts
            side-by-side so you can spot the difference between "people who
            bailed before paying" and "people who paid then quit" without
            clicking a tab. The right one is the actionable lever for pricing,
            product, and retention decisions. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <ReasonsChart
            title="Why they canceled (trial)"
            subtitle="Pre-paywall objections · never paid"
            color="#f59e0b"
            rows={allRows.filter((r) => r.kind === "canceled")}
            emptyMessage="No trial cancellations in this window."
          />
          <ReasonsChart
            title="Why they churned (paid)"
            subtitle="Lost MRR · most actionable for pricing & product"
            color="#ef4444"
            rows={allRows.filter((r) => r.kind === "churned")}
            emptyMessage="No churned subscribers in this window."
            highlight
          />
        </div>

        {/* Grouped recent feed */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
              Recent — by reason
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Top reason auto-expanded · 3 newest visible · arrows page through older
            </p>
          </div>
          {filteredRows.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
            >
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No cancellations in this window.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedReasons.map(([reason], i) => {
                const groupRows = filteredRows.filter((r) => r.reason === reason);
                return (
                  <ChurnReasonGroup
                    key={reason}
                    reason={reason}
                    rows={groupRows}
                    total={total}
                    defaultOpen={i === 0}
                  />
                );
              })}
            </div>
          )}
        </div>

        {filteredRows.length === 2000 && (
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            Showing 2000 most-recent rows. CSV export contains all rows in this window.
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function HeroStat({
  label,
  value,
  color,
  icon,
  iconColor,
  subtitle,
  highlight,
  href,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  iconColor: string;
  subtitle: string;
  highlight: boolean;
  href?: string;
}) {
  const content = (
    <div
      className="rounded-2xl p-6 h-full transition-all"
      style={{
        background: highlight
          ? `linear-gradient(160deg, ${iconColor}25, ${iconColor}08)`
          : "linear-gradient(160deg, var(--flip-bg-card), rgba(0,0,0,0.10))",
        border: `1px solid ${highlight ? iconColor : "var(--flip-card-border)"}`,
        boxShadow: highlight
          ? `0 0 32px ${iconColor}20, 0 12px 32px -12px rgba(0,0,0,0.30)`
          : "0 4px 16px -4px rgba(0,0,0,0.15)",
        cursor: href ? "pointer" : "default",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4"
          style={{
            background: `${iconColor}15`,
            color: iconColor,
          }}
        >
          {icon}
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-4xl font-extrabold tabular-nums leading-none mb-2" style={{ color }}>
        {value}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {subtitle}
      </p>
    </div>
  );
  if (href) return <Link href={href} className="block hover:scale-[1.01] transition-transform">{content}</Link>;
  return content;
}

function ReasonsChart({
  title,
  subtitle,
  color,
  rows,
  emptyMessage,
  highlight,
}: {
  title: string;
  subtitle: string;
  color: string;
  rows: Row[];
  emptyMessage: string;
  highlight?: boolean;
}) {
  // % is computed against rows-with-a-reason only, not all rows.
  // Including "(no reason given)" in the denominator made every real
  // reason look like a 1-2% rounding blip.
  const rowsWithReason = rows.filter((r) => r.reason !== "(no reason given)");
  const total = rowsWithReason.length;
  const byReason = new Map<string, number>();
  for (const r of rowsWithReason) byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + 1);
  const sorted = Array.from(byReason.entries()).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;
  const isPricing = (reason: string) => /price|expensive|cost|afford/i.test(reason);

  return (
    <div
      className="rounded-2xl p-6 h-full"
      style={{
        background: highlight
          ? `linear-gradient(180deg, ${color}10, ${color}03)`
          : "linear-gradient(180deg, var(--flip-bg-card), rgba(0,0,0,0.05))",
        border: `1px solid ${highlight ? `${color}40` : "var(--flip-card-border)"}`,
        boxShadow: highlight ? `0 8px 24px -8px ${color}25` : "0 4px 16px -4px rgba(0,0,0,0.15)",
      }}
    >
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-base font-extrabold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        <span className="text-xs tabular-nums font-bold" style={{ color }}>
          {total}
        </span>
      </div>
      <p className="text-[11px] mb-5" style={{ color: "var(--text-muted)" }}>
        {subtitle}
      </p>

      {sorted.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map(([reason, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const bar = Math.round((count / max) * 100);
            const pricingFlag = highlight && isPricing(reason);
            return (
              <div key={reason}>
                <div className="flex items-baseline justify-between mb-1.5 gap-2">
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--text-primary)" }}
                    title={reason}
                  >
                    {reason}
                    {pricingFlag && (
                      <span
                        className="ml-2 text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ background: "#defa3220", color: "#defa32" }}
                      >
                        pricing signal
                      </span>
                    )}
                  </span>
                  <span className="text-xs tabular-nums font-medium flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {count} · {pct}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${bar}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                      boxShadow: `0 0 10px ${color}40`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
