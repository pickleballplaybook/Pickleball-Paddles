"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTrending, paddles as allPaddles } from "@/data/paddles";
import { isTrendingExcluded, takeTopBySeriesDedup } from "@/lib/trending";
import type { Paddle } from "@/types";

// ── Catalog distributions (computed once at module load) ──────────────────────
const SW_ALL = allPaddles.map((p) => p.swingWeight).filter((v) => v > 0);
const TW_ALL = allPaddles.map((p) => p.twistWeight).filter((v) => v > 0);
const WT_ALL = allPaddles.map((p) => parseFloat(p.weight)).filter((v) => !isNaN(v) && v > 0);
const BP_ALL = allPaddles.map((p) => p.balancePoint ?? 0).filter((v) => v > 0);

function buildBins(values: number[], binCount = 10): number[] {
  if (values.length === 0) return Array(binCount).fill(0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const bins = Array(binCount).fill(0);
  for (const v of values) {
    const i = Math.min(binCount - 1, Math.floor(((v - min) / range) * binCount));
    bins[i]++;
  }
  return bins;
}

function valueToBin(value: number, values: number[], binCount = 10): number {
  if (values.length === 0) return -1;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return Math.min(binCount - 1, Math.floor(((value - min) / range) * binCount));
}

// ── Mini histogram ─────────────────────────────────────────────────────────────
function MiniHistogram({
  values,
  currentValue,
}: {
  values: number[];
  currentValue: number;
}) {
  const BIN_COUNT = 10;
  const bins = buildBins(values, BIN_COUNT);
  const activeBin = currentValue > 0 ? valueToBin(currentValue, values, BIN_COUNT) : -1;
  const maxBin = Math.max(...bins, 1);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 1.5,
        height: 20,
        marginBottom: 4,
        marginTop: 2,
      }}
    >
      {bins.map((count, i) => {
        const isActive = i === activeBin;
        const isAdjacent = Math.abs(i - activeBin) === 1;
        const heightPct = (count / maxBin) * 100;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(8, heightPct)}%`,
              borderRadius: 1.5,
              background: isActive
                ? "#0a64bc"
                : isAdjacent
                ? "rgba(10,100,188,0.4)"
                : "rgba(10,100,188,0.15)",
              transition: "height 0.3s ease",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Spec chip ─────────────────────────────────────────────────────────────────
function SpecChip({
  label,
  value,
  unit,
  align = "left",
  allValues,
}: {
  label: string;
  value: number | string | undefined;
  unit: string;
  align?: "left" | "right";
  allValues: number[];
}) {
  let numericValue = 0;
  let display: string;

  if (typeof value === "number") {
    numericValue = value;
    display = value > 0 ? value.toFixed(value >= 10 ? 1 : 2) : "—";
  } else if (typeof value === "string") {
    const n = parseFloat(value);
    numericValue = !isNaN(n) ? n : 0;
    display = !isNaN(n) && n > 0 ? String(n) : (value || "—");
  } else {
    display = "—";
  }

  return (
    <div
      className="lab-hud-chip"
      style={{ textAlign: align === "right" ? "right" : "left" }}
    >
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "9px",
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          color: "var(--lab-text-muted)",
          marginBottom: 1,
        }}
      >
        {label}
      </div>
      <MiniHistogram values={allValues} currentValue={numericValue} />
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "clamp(14px, 1.8vw, 18px)",
          fontWeight: 600,
          lineHeight: 1,
          color: display === "—" ? "var(--lab-text-muted)" : "#60a5fa",
          letterSpacing: "-0.02em",
        }}
      >
        {display}
      </div>
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "8px",
          color: "var(--lab-text-muted)",
          marginTop: 2,
          letterSpacing: "0.1em",
        }}
      >
        {unit}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PaddleCanvas({ featuredPaddle: _ignored }: { featuredPaddle?: Paddle | null }) {
  const candidates = getTrending(100)
    .filter((p) => p.image && p.swingWeight > 0 && !isTrendingExcluded(p.slug));
  const list: Paddle[] = takeTopBySeriesDedup(
    candidates.map((p) => ({ paddle: p })),
    10,
  ).map((t) => t.paddle);

  const [idx, setIdx]         = useState(0);
  const [opacity, setOpacity] = useState(1);
  const timer1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((next: number) => {
    if (timer1.current) clearTimeout(timer1.current);
    if (timer2.current) clearTimeout(timer2.current);
    setOpacity(0);
    timer1.current = setTimeout(() => setIdx(next), 200);
    timer2.current = setTimeout(() => setOpacity(1), 220);
  }, []);

  // Auto-advance every 20 seconds
  useEffect(() => {
    const t = setInterval(() => goTo((idx + 1) % list.length), 20_000);
    return () => clearInterval(t);
  }, [idx, list.length, goTo]);

  if (list.length === 0) return null;

  const paddle = list[idx];
  const weightVal = parseFloat(paddle.weight);

  return (
    <div
      className="relative w-full h-full"
      role="region"
      aria-label="Featured paddles showcase"
    >
      {/* ── HUD spec chips — 4 corners ──────────────────────────── */}
      <div className="hidden sm:block absolute z-10" style={{ top: "8%", left: "5%" }}>
        <SpecChip label="Swing Wt" value={paddle.swingWeight} unit="SW" align="left" allValues={SW_ALL} />
      </div>
      <div className="hidden sm:block absolute z-10" style={{ top: "8%", right: "5%" }}>
        <SpecChip label="Twist Wt" value={paddle.twistWeight} unit="TW" align="right" allValues={TW_ALL} />
      </div>
      <div className="hidden sm:block absolute z-10" style={{ bottom: "12%", left: "5%" }}>
        <SpecChip label="Weight" value={!isNaN(weightVal) ? weightVal : paddle.weight} unit="oz" align="left" allValues={WT_ALL} />
      </div>
      <div className="hidden sm:block absolute z-10" style={{ bottom: "12%", right: "5%" }}>
        <SpecChip label="Balance" value={paddle.balancePoint} unit="cm BP" align="right" allValues={BP_ALL} />
      </div>

      {/* ── Paddle image — centred, floating ───────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity,
          transition: "opacity 0.22s ease",
          pointerEvents: opacity < 0.5 ? "none" : undefined,
        }}
      >
        {/* Float wrapper */}
        <div
          style={{
            width: "82%",
            aspectRatio: "1 / 1",
            animation: "lab-paddle-float 4s ease-in-out infinite",
            position: "relative",
          }}
        >
          {/* Radial spotlight glow behind the paddle */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 50% 60%, rgba(163,230,53,0.1) 0%, transparent 68%)",
              pointerEvents: "none",
            }}
            aria-hidden
          />
          {/* Enter animation wrapper — remounts on each paddle, plays scale-in */}
          <Link
            key={paddle.slug}
            href={`/paddles/${paddle.slug}`}
            style={{
              display: "block",
              position: "relative",
              width: "100%",
              height: "100%",
              animation: "lab-paddle-enter 0.4s ease-out both",
              filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.55)) drop-shadow(0 4px 16px rgba(163,230,53,0.1))",
            }}
            tabIndex={-1}
            aria-label={`${paddle.brand} ${paddle.name}`}
          >
            <Image
              src={paddle.image!}
              alt={`${paddle.brand} ${paddle.name}`}
              fill
              style={{ objectFit: "contain" }}
              sizes="(max-width: 768px) 70vw, 420px"
              priority
            />
          </Link>
        </div>
      </div>

      {/* ── Paddle name ─────────────────────────────────────────── */}
      <div
        className="absolute bottom-2 left-0 right-0 flex justify-center"
        style={{ opacity, transition: "opacity 0.22s ease" }}
      >
        <Link
          href={`/paddles/${paddle.slug}`}
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--lab-text-muted)",
            textDecoration: "none",
          }}
        >
          {paddle.brand} · {paddle.name}
          {paddle.shape ? ` · ${paddle.shape}` : ""}
        </Link>
      </div>

      {/* ── Lab frame border — cosmetic ────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: "1px solid rgba(163,230,53,0.08)",
          borderRadius: 24,
          boxShadow: "inset 0 0 60px rgba(163,230,53,0.03)",
        }}
        aria-hidden
      />
    </div>
  );
}
