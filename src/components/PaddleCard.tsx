"use client";

import Link from "next/link";
import { Paddle } from "@/types";
import { buyAtLabel } from "@/lib/buyAtLabel";
import { isPreLaunch } from "@/lib/launchStatus";
import VotePill from "@/components/VotePill";
import CopyableCode from "@/components/CopyableCode";

interface PaddleCardProps {
  paddle: Paddle;
  priority?: boolean;
  index?: number;
  /** Renamed in usage to upCount but kept this name to avoid touching callers. */
  heartCount?: number;
  /** Live thumbs-down count. Defaults to 0 if not passed. */
  dislikeCount?: number;
}

const BADGE_STYLES: Record<string, string> = {
  "Best for Power": "badge-amber",
  "Most Popular":   "badge-blue",
  "Power Beast":    "badge-amber",
  "Pro Endorsed":   "badge-green",
};

const SHAPE_COLORS: Record<string, string> = {
  Elongated: "bg-navy-50 text-navy-700 border-navy-200",
  Hybrid:    "bg-brand-50 text-brand-700 border-brand-200",
  Widebody:  "bg-blue-50 text-blue-700 border-blue-200",
  Sweetspot: "bg-amber-50 text-amber-700 border-amber-200",
};

const BARS = [
  { key: "power"   as const, label: "Power"   },
  { key: "spin"    as const, label: "Spin"    },
  { key: "control" as const, label: "Control" },
];

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function calcDiscountedPrice(price: string, amountOff: string): string | null {
  if (!amountOff || amountOff === "$0") return null;
  const base = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (isNaN(base) || base <= 0) return null;
  let discounted: number;
  if (amountOff.endsWith("%")) {
    const pct = parseFloat(amountOff);
    if (isNaN(pct)) return null;
    discounted = base * (1 - pct / 100);
  } else {
    const off = parseFloat(amountOff.replace(/[^0-9.]/g, ""));
    if (isNaN(off)) return null;
    discounted = base - off;
  }
  if (discounted <= 0) return null;
  return `$${discounted.toFixed(2)}`;
}

export default function PaddleCard({ paddle, index = 0, heartCount = 0, dislikeCount = 0 }: PaddleCardProps) {
  const hasDiscount = !!paddle.discountLink?.trim();
  const reviewLink  = paddle.reviewUrl ?? (paddle.manualVideoId ? `https://youtu.be/${paddle.manualVideoId}` : null);
  const hasReview   = !!reviewLink;
  const preLaunch   = isPreLaunch(paddle);

  const staggerDelay = `${Math.min(index, 10) * 50}ms`;

  return (
    <article
      className="animate-slide-up card group flex flex-col overflow-hidden"
      style={{ animationDelay: staggerDelay }}
    >

      {/* Image */}
      <Link href={`/paddles/${paddle.slug}`} tabIndex={-1} className="block">
        <div
          className="relative aspect-square overflow-hidden rounded-t-2xl flex flex-col items-center justify-center"
          style={{ background: "var(--bg-section)" }}
        >
          {paddle.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={paddle.image}
              alt={paddle.name}
              className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <>
              <svg viewBox="0 0 120 160" fill="none" className="w-20 h-auto mb-2 opacity-15" aria-hidden>
                <rect x="5" y="5" width="110" height="115" rx="55" fill="#14b8a6" />
                <rect x="45" y="116" width="30" height="40" rx="15" fill="#0d9488" />
              </svg>
              <p className="text-[10px] font-medium tracking-wide" style={{ color: "var(--text-muted)" }}>
                Image coming soon
              </p>
            </>
          )}

          {paddle.badge && (
            <div className="absolute top-3 left-3">
              <span className={BADGE_STYLES[paddle.badge] ?? "badge-green"}>{paddle.badge}</span>
            </div>
          )}

          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                SHAPE_COLORS[paddle.shape] ?? "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {paddle.shape}
            </span>
            {paddle.playStyle && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: paddle.playStyle === "power"
                    ? "rgba(251,146,60,0.18)" : paddle.playStyle === "control"
                    ? "rgba(99,102,241,0.18)" : "rgba(34,197,94,0.18)",
                  color: paddle.playStyle === "power" ? "#fb923c"
                    : paddle.playStyle === "control" ? "#818cf8" : "#4ade80",
                  border: paddle.playStyle === "power"
                    ? "1px solid rgba(251,146,60,0.35)" : paddle.playStyle === "control"
                    ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(34,197,94,0.35)",
                }}
              >
                {paddle.playStyle === "all-court" ? "All-Court" : paddle.playStyle === "power" ? "Power" : "Control"}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">

        <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-1">
          {paddle.brand}
        </p>

        <Link href={`/paddles/${paddle.slug}`}>
          <h3
            className="text-base font-bold leading-snug mb-1 hover:text-brand-500 transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            {paddle.name}
          </h3>
        </Link>

        {paddle.tagline && (
          <p className="text-sm leading-relaxed mb-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>
            {paddle.tagline}
          </p>
        )}

        {paddle.price && (() => {
          const discounted = calcDiscountedPrice(paddle.price!, paddle.amountOff);
          return (
            <div className="flex items-baseline gap-2 mb-3">
              <span
                className="text-base font-bold"
                style={{ color: discounted ? "var(--text-muted)" : "var(--text-primary)", textDecoration: discounted ? "line-through" : "none" }}
              >
                {paddle.price}
              </span>
              {discounted && (
                <span className="text-base font-bold" style={{ color: "#14b8a6" }}>
                  {discounted}
                </span>
              )}
            </div>
          );
        })()}

        {/* Performance bars */}
        {paddle.ratings && (
          <div className="space-y-2.5 mb-4">
            {BARS.map(({ key, label }) => {
              const val = paddle.ratings![key];
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
                    <span className="text-xs font-bold"   style={{ color: "var(--text-secondary)" }}>{val.toFixed(1)}</span>
                  </div>
                  <div className="perf-track">
                    <div className="perf-fill" style={{ width: `${(val / 10) * 100}%`, transition: "none" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats row — Weight / Twist Wt / Thickness */}
        <div
          className="flex items-center gap-3 mb-4 py-3 mt-auto"
          style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
        >
          {[
            { label: "Weight",    value: paddle.weight },
            { label: "Twist Wt",  value: paddle.twistWeight },
            { label: "Thickness", value: paddle.thickness },
          ].map(({ label, value }) => (
            <div key={label} className="text-center flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Vote pill + Save % — sits above the discount code so the user
            reads (votes, then deal, then buy) top-to-bottom. */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <VotePill paddleId={paddle.id} upCount={heartCount} downCount={dislikeCount} size="sm" />
          {!!paddle.amountOff && paddle.amountOff !== "$0" && paddle.amountOff !== "" && (
            <span className="text-xs font-semibold" style={{ color: "var(--discount-text)" }}>
              Save {paddle.amountOff}
            </span>
          )}
        </div>

        {/* Discount code chip — "Code: PLAYBOOK 📋", dashed teal outline,
            copy-to-clipboard. Suppressed for paddles without a usable code. */}
        {(() => {
          const hasRealDiscount = !!paddle.amountOff && paddle.amountOff !== "$0" && paddle.amountOff !== "";
          const isSelkirk = paddle.brand === "Selkirk" || paddle.brand === "SLK";
          const isSelkirkGiftCard = isSelkirk && !hasRealDiscount && !!paddle.discountLink?.trim() && !paddle.discountLink.includes("lockerroompickleball.com");
          if (!hasRealDiscount && !isSelkirkGiftCard) return null;
          const code = isSelkirk && !paddle.discountLink?.includes("lockerroompickleball.com") ? "INF-PLAYBOOK" : "PLAYBOOK";
          return (
            <div className="mb-3">
              <CopyableCode code={code} />
            </div>
          );
        })()}

        {/* ── CTAs ──────────────────────────────────────────────────────────── */}
        <div className="space-y-2">

          {/* Primary CTA — full-width now that the reactions live above
              instead of competing for the same row. */}
          {preLaunch ? (
            <span
              className="block w-full inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl text-sm py-2.5"
              style={{
                background: "var(--flip-bg-card)",
                color: "var(--flip-text-muted)",
                border: "1px dashed var(--code-border)",
              }}
            >
              Coming Soon
            </span>
          ) : hasDiscount ? (
            <a
              href={paddle.discountLink}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block w-full inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl text-sm py-2.5 transition-all active:scale-[0.98]"
              style={{ background: "var(--btn-buy-bg)", color: "var(--btn-buy-text)" }}
            >
              {buyAtLabel(paddle.brand)}
            </a>
          ) : hasReview ? (
            <a
              href={reviewLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full inline-flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl font-medium transition-colors"
              style={{ background: "var(--bg-alt)", color: "#cbd5e1", border: "1px solid var(--border)" }}
            >
              <span style={{ color: "#dc2626" }}><YouTubeIcon className="w-4 h-4" /></span>
              Watch Review
            </a>
          ) : (
            <button
              disabled
              className="block w-full inline-flex items-center justify-center text-sm py-2.5 rounded-xl font-semibold cursor-not-allowed opacity-40"
              style={{ background: "var(--bg-alt)", color: "var(--text-muted)" }}
            >
              Link Coming Soon
            </button>
          )}

          {/* Secondary — Watch Review */}
          {hasDiscount && hasReview && (
            <a
              href={reviewLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-white"
              style={{ color: "#cbd5e1" }}
            >
              <span style={{ color: "#dc2626" }}><YouTubeIcon className="w-3.5 h-3.5" /></span>
              Watch Review
            </a>
          )}
          {!hasReview && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>No review yet</span>
          )}

        </div>
      </div>
    </article>
  );
}
