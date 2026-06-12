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
      className="paddle-card animate-slide-up card group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
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
          {/* Shape + play-style chips moved out of the image and into the
              content block below — they no longer crowd the paddle. */}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">

        <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-1">
          {paddle.brand}
        </p>

        <Link href={`/paddles/${paddle.slug}`}>
          <h3
            className="text-lg font-bold leading-snug mb-2 hover:text-brand-500 transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            {paddle.name}
          </h3>
        </Link>

        {/* Shape + play-style chips — small inline classifiers under the
            paddle name. Moved out of the image so the paddle photo reads
            cleanly without overlapping decoration. */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
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

        {paddle.tagline && (
          <p className="text-sm leading-relaxed mb-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>
            {paddle.tagline}
          </p>
        )}

        {/* Price row — bigger now that the card has more horizontal real
            estate, with the Save % chip pinned to the right of the line. */}
        {paddle.price && (() => {
          const discounted = calcDiscountedPrice(paddle.price!, paddle.amountOff);
          const hasSavings = !!paddle.amountOff && paddle.amountOff !== "$0" && paddle.amountOff !== "";
          return (
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <div className="flex items-baseline gap-2 min-w-0">
                <span
                  className={discounted ? "text-sm font-semibold" : "text-2xl font-extrabold"}
                  style={{
                    color: discounted ? "var(--text-muted)" : "var(--text-primary)",
                    textDecoration: discounted ? "line-through" : "none",
                  }}
                >
                  {paddle.price}
                </span>
                {discounted && (
                  <span className="text-2xl font-extrabold tabular-nums" style={{ color: "#14b8a6" }}>
                    {discounted}
                  </span>
                )}
              </div>
              {hasSavings && (
                <span
                  className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0"
                  style={{
                    background: "rgba(222,250,50,0.10)",
                    color: "var(--discount-text)",
                    border: "1px solid rgba(222,250,50,0.30)",
                  }}
                >
                  Save {paddle.amountOff}
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

        {/* Specs — single inline line. Uses swing weight (the spec people
            actually shop on) when available, falling back to twist weight
            only if SW isn't measured yet. Half the height of the old 3-col
            boxed strip with a clearer scan rhythm. */}
        {(paddle.weight || paddle.swingWeight || paddle.thickness) && (() => {
          const bits: string[] = [];
          if (paddle.weight && paddle.weight.trim()) bits.push(paddle.weight);
          if (paddle.swingWeight && paddle.swingWeight > 0) {
            bits.push(`SW ${paddle.swingWeight.toFixed(1)}`);
          } else if (paddle.twistWeight && paddle.twistWeight > 0) {
            bits.push(`TW ${paddle.twistWeight.toFixed(2)}`);
          }
          if (paddle.thickness) bits.push(paddle.thickness);
          if (bits.length === 0) return null;
          return (
            <p
              className="text-xs font-medium mb-3 mt-auto pt-3"
              style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}
            >
              {bits.join(" · ")}
            </p>
          );
        })()}

        {/* Vote pill — Save % moved up to the price row, so this stays
            single-purpose. */}
        <div className="mb-3">
          <VotePill paddleId={paddle.id} upCount={heartCount} downCount={dislikeCount} size="sm" />
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
              {/* Shows the launch date when known (e.g. 'Coming June 14'),
                  falls back to 'Coming Soon' if launchAt isn't set or has
                  already passed in this render's clock. */}
              {paddle.launchAt
                ? `Coming ${new Date(paddle.launchAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
                : "Coming Soon"}
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
          {/* 'No review yet' text removed — empty state added more noise
              than signal. Paddles without a review just show nothing. */}

        </div>
      </div>
    </article>
  );
}
