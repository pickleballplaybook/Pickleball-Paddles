"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTrending } from "@/data/paddles";
import type { Paddle } from "@/types";

// ── Spec chip ─────────────────────────────────────────────────────────────────
function SpecChip({
  label,
  value,
  unit,
  align = "left",
}: {
  label: string;
  value: number | string | undefined;
  unit: string;
  align?: "left" | "right";
}) {
  let display: string;
  if (typeof value === "number") {
    display = value > 0 ? value.toFixed(value >= 10 ? 1 : 2) : "—";
  } else if (typeof value === "string") {
    const n = parseFloat(value);
    display = !isNaN(n) && n > 0 ? String(n) : (value || "—");
  } else {
    display = "—";
  }

  return (
    <div className="lab-hud-chip" style={{ textAlign: align === "right" ? "right" : "left" }}>
      <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "var(--lab-text-muted)", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "clamp(15px, 2vw, 20px)", fontWeight: 600, lineHeight: 1, color: display === "—" ? "var(--lab-text-muted)" : "var(--lab-text-mono)", letterSpacing: "-0.02em" }}>
        {display}
      </div>
      <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "8px", color: "var(--lab-text-muted)", marginTop: 2, letterSpacing: "0.1em" }}>
        {unit}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PaddleCanvas({ featuredPaddle }: { featuredPaddle?: Paddle | null }) {
  // Build rotation list: featured paddle first, then fill with top trending
  const topTen = getTrending(12);
  const list: Paddle[] = (() => {
    if (!featuredPaddle) return topTen.slice(0, 10);
    const rest = topTen.filter((p) => p.slug !== featuredPaddle.slug);
    return [featuredPaddle, ...rest].slice(0, 10);
  })();

  const [idx, setIdx]       = useState(0);
  const [visible, setVisible] = useState(true);

  const goTo = useCallback((next: number) => {
    setVisible(false);
    setTimeout(() => {
      setIdx(next);
      setVisible(true);
    }, 350);
  }, []);

  // Auto-advance every 20 seconds
  useEffect(() => {
    const t = setInterval(() => goTo((idx + 1) % list.length), 20_000);
    return () => clearInterval(t);
  }, [idx, list.length, goTo]);

  const paddle = list[idx];
  const weightVal = parseFloat(paddle.weight);

  return (
    <div
      className="relative w-full h-full"
      role="region"
      aria-label="Featured paddles showcase"
    >
      {/* ── HUD spec chips — 4 corners ──────────────────────────── */}
      <div className="hidden sm:block absolute z-10" style={{ top: "8%", left: "2%" }}>
        <SpecChip label="Swing Wt" value={paddle.swingWeight} unit="SW" align="left" />
      </div>
      <div className="hidden sm:block absolute z-10" style={{ top: "8%", right: "2%" }}>
        <SpecChip label="Twist Wt" value={paddle.twistWeight} unit="TW" align="right" />
      </div>
      <div className="hidden sm:block absolute z-10" style={{ bottom: "16%", left: "2%" }}>
        <SpecChip label="Weight" value={!isNaN(weightVal) ? weightVal : paddle.weight} unit="oz" align="left" />
      </div>
      <div className="hidden sm:block absolute z-10" style={{ bottom: "16%", right: "2%" }}>
        <SpecChip label="Balance" value={paddle.balancePoint} unit="cm BP" align="right" />
      </div>

      {/* ── Paddle image — centred, floating ───────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      >
        <Link
          href={`/paddles/${paddle.slug}`}
          style={{ position: "relative", display: "block", width: "55%", aspectRatio: "1 / 1", animation: "lab-paddle-float 4s ease-in-out infinite" }}
          tabIndex={-1}
          aria-label={`${paddle.brand} ${paddle.name}`}
        >
          <Image
            src={paddle.image}
            alt={`${paddle.brand} ${paddle.name}`}
            fill
            style={{ objectFit: "contain" }}
            sizes="(max-width: 768px) 50vw, 300px"
            priority
          />
        </Link>
      </div>

      {/* ── Paddle name + pagination dots ──────────────────────── */}
      <div
        className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-2"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.35s ease" }}
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

        {/* Dot nav */}
        <div className="flex gap-1" role="tablist" aria-label="Paddle rotation">
          {list.map((p, i) => (
            <button
              key={p.slug}
              role="tab"
              aria-selected={i === idx}
              aria-label={`Show ${p.brand} ${p.name}`}
              onClick={() => goTo(i)}
              style={{
                width: i === idx ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === idx ? "var(--lab-green)" : "rgba(163,230,53,0.2)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
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
