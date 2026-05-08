"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Paddle } from "@/types";

const SCROLL = 290;

function ArrowBtn({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "left" ? "Previous" : "Next"}
      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
      style={{
        background: "var(--bg-alt)",
        border: "1px solid var(--border)",
        color: "var(--text-secondary)",
      }}
    >
      {dir === "left" ? <ChevronLeft className="w-5 h-5" strokeWidth={2} /> : <ChevronRight className="w-5 h-5" strokeWidth={2} />}
    </button>
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

function PaddleCard({ paddle }: { paddle: Paddle }) {
  return (
    <Link
      href={`/paddles/${paddle.slug}`}
      className="group flex-shrink-0 w-52 sm:w-60 rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        scrollSnapAlign: "start",
      }}
    >
      {/* Image area */}
      <div
        className="relative w-full flex items-center justify-center p-7 flex-shrink-0"
        style={{
          background: "var(--bg-alt)",
          aspectRatio: "1 / 1",
        }}
      >
        {/* subtle teal glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(20,184,166,0.10) 0%, transparent 70%)" }}
        />
        {paddle.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={paddle.image}
            alt={`${paddle.brand} ${paddle.name}`}
            className="relative z-10 w-full h-full object-contain"
            style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.38))" }}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-teal-500/10" />
        )}
        {/* PlayStyle badge */}
        {paddle.playStyle && (
          <span
            className="absolute bottom-3 left-3 z-20 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
            style={{
              background: paddle.playStyle === "power"
                ? "rgba(251,146,60,0.18)" : paddle.playStyle === "control"
                ? "rgba(99,102,241,0.18)" : "rgba(34,197,94,0.18)",
              color: paddle.playStyle === "power" ? "#fb923c"
                : paddle.playStyle === "control" ? "#818cf8" : "#4ade80",
              border: paddle.playStyle === "power"
                ? "1px solid rgba(251,146,60,0.35)" : paddle.playStyle === "control"
                ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(34,197,94,0.35)",
              backdropFilter: "blur(6px)",
            }}
          >
            {paddle.playStyle === "all-court" ? "All-Court" : paddle.playStyle === "power" ? "Power" : "Control"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#14b8a6" }}>
          {paddle.brand}
        </p>
        <p className="font-bold text-sm leading-snug mb-1" style={{ color: "var(--text-primary)" }}>
          {paddle.name}
        </p>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          {paddle.shape} · {paddle.thickness}
        </p>

        {/* Price + discount */}
        <div className="mb-3 flex flex-col gap-1">
          {paddle.price && (() => {
            const discounted = calcDiscountedPrice(paddle.price!, paddle.amountOff);
            return (
              <div className="flex items-baseline gap-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: discounted ? "var(--text-muted)" : "var(--text-primary)", textDecoration: discounted ? "line-through" : "none" }}
                >
                  {paddle.price}
                </span>
                {discounted && (
                  <span className="text-sm font-bold" style={{ color: "#14b8a6" }}>
                    {discounted}
                  </span>
                )}
              </div>
            );
          })()}
          {(() => {
            const isSelkirk = paddle.brand === "Selkirk" || paddle.brand === "SLK";
            const code = isSelkirk && !paddle.discountLink?.includes("lockerroompickleball.com") ? "INF-PLAYBOOK" : "PLAYBOOK";
            return (
              <p className="text-[11px] font-semibold" style={{ color: "var(--discount-text)" }}>
                Code <span className="font-mono tracking-wider">{code}</span>
              </p>
            );
          })()}
        </div>

        <div className="mt-auto">
          <span
            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: "rgba(20,184,166,0.12)",
              color: "#2dd4bf",
              border: "1px solid rgba(20,184,166,0.2)",
            }}
          >
            View Paddle
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function LatestPaddles({ paddles }: { paddles: Paddle[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -SCROLL : SCROLL, behavior: "smooth" });
  }

  return (
    <section style={{ background: "var(--bg-section)", borderTop: "1px solid var(--border-subtle)" }}>
      <div className="container-xl py-14">

        {/* Header row */}
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-2" style={{ color: "#14b8a6" }}>
              New Arrivals
            </p>
            <h2
              className="font-extrabold tracking-tight leading-none"
              style={{ color: "var(--text-primary)", fontSize: "clamp(1.6rem, 2.8vw, 2.25rem)" }}
            >
              Latest Paddles
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              The newest paddles added to our database.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ArrowBtn dir="left" onClick={() => scroll("left")} />
            <ArrowBtn dir="right" onClick={() => scroll("right")} />
          </div>
        </div>

        {/* Scroll track */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4"
          style={{
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {paddles.map((p) => (
            <PaddleCard key={p.id} paddle={p} />
          ))}
        </div>

      </div>
    </section>
  );
}
