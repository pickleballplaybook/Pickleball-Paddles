"use client";

import Link from "next/link";
import { Heart, ThumbsDown } from "lucide-react";
import { Paddle } from "@/types";
import { useReactions } from "@/hooks/useReactions";

interface PaddleCardProps {
  paddle: Paddle;
  priority?: boolean;
  index?: number;
  heartCount?: number;
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

export default function PaddleCard({ paddle, index = 0, heartCount = 0 }: PaddleCardProps) {
  const { reaction, toggle } = useReactions(paddle.id);

  const hasDiscount = !!paddle.discountLink?.trim();
  const reviewLink  = paddle.reviewUrl ?? (paddle.manualVideoId ? `https://youtu.be/${paddle.manualVideoId}` : null);
  const hasReview   = !!reviewLink;

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

          <div className="absolute top-3 right-3">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                SHAPE_COLORS[paddle.shape] ?? "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {paddle.shape}
            </span>
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

        {/* Discount badge */}
        {paddle.amountOff && paddle.amountOff !== "$0" && paddle.amountOff !== "" && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded tracking-widest">
              {(paddle.brand === "Selkirk" || paddle.brand === "SLK") ? "INF-PLAYBOOK" : "PLAYBOOK"}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>·</span>
            <span className="text-xs font-semibold" style={{ color: "var(--discount-text)" }}>Save {paddle.amountOff}</span>
          </div>
        )}

        {/* ── CTAs ──────────────────────────────────────────────────────────── */}
        <div className="space-y-2">

          {/* Primary CTA + compact reactions */}
          <div className="flex items-center gap-2">

            {/* Primary */}
            {hasDiscount ? (
              <a
                href={paddle.discountLink}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex-1 inline-flex items-center justify-center gap-1.5 btn-primary text-sm py-2.5"
              >
                Buy with Discount
              </a>
            ) : hasReview ? (
              <a
                href={reviewLink!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl font-medium transition-colors"
                style={{ background: "var(--bg-alt)", color: "#cbd5e1", border: "1px solid var(--border)" }}
              >
                <span style={{ color: "#dc2626" }}><YouTubeIcon className="w-4 h-4" /></span>
                Watch Review
              </a>
            ) : (
              <button
                disabled
                className="flex-1 inline-flex items-center justify-center text-sm py-2.5 rounded-xl font-semibold cursor-not-allowed opacity-40"
                style={{ background: "var(--bg-alt)", color: "var(--text-muted)" }}
              >
                Link Coming Soon
              </button>
            )}

            {/* Compact reactions */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => toggle("heart")}
                aria-label="Save paddle"
                className="p-2 rounded-lg transition-all duration-150 active:scale-90"
                style={{ color: reaction === "heart" ? "#ef4444" : "var(--text-muted)" }}
              >
                <Heart
                  className="w-4 h-4"
                  fill={reaction === "heart" ? "currentColor" : "none"}
                  strokeWidth={2}
                />
              </button>
              {heartCount > 0 && (
                <span className="text-xs font-semibold tabular-nums mr-1" style={{ color: "var(--text-muted)" }}>
                  {heartCount}
                </span>
              )}
              <button
                onClick={() => toggle("dislike")}
                aria-label="Not for me"
                className="p-2 rounded-lg transition-all duration-150 active:scale-90"
                style={{ color: reaction === "dislike" ? "var(--text-secondary)" : "var(--text-muted)" }}
              >
                <ThumbsDown
                  className="w-4 h-4"
                  fill={reaction === "dislike" ? "currentColor" : "none"}
                  strokeWidth={2}
                />
              </button>
            </div>
          </div>

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
