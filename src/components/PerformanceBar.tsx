"use client";

import { useEffect, useId, useRef, useState } from "react";

interface PerformanceBarProps {
  label: string;
  value: number; // 1–10
}

// ── Pickleball marker SVG ─────────────────────────────────────────────────────
function PickleballMarker({ uid, alive }: { uid: string; alive: boolean }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        display: "block",
        transform: alive ? "scale(1)" : "scale(0.5)",
        opacity: alive ? 1 : 0,
        transition: alive
          ? "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease"
          : "none",
        filter:
          "drop-shadow(0 2px 6px rgba(0,0,0,0.22)) drop-shadow(0 1px 2px rgba(0,0,0,0.12))",
      }}
    >
      <defs>
        <radialGradient id={`pb-base-${uid}`} cx="42%" cy="38%" r="62%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#eef83a" />
          <stop offset="55%"  stopColor="#d6e020" />
          <stop offset="100%" stopColor="#b8c010" />
        </radialGradient>
        <radialGradient id={`pb-shine-${uid}`} cx="34%" cy="28%" r="52%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="white" stopOpacity="0.62" />
          <stop offset="60%"  stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`pb-clip-${uid}`}>
          <circle cx="14" cy="14" r="11.5" />
        </clipPath>
      </defs>
      <circle cx="14" cy="14" r="13.8" fill="white" />
      <circle cx="14" cy="14" r="11.5" fill={`url(#pb-base-${uid})`} />
      <g clipPath={`url(#pb-clip-${uid})`} fill="#a8b80e">
        <circle cx="10.0" cy="9.5"  r="1.4" />
        <circle cx="14.0" cy="8.2"  r="1.4" />
        <circle cx="18.0" cy="9.5"  r="1.4" />
        <circle cx="7.0"  cy="14.2" r="1.4" />
        <circle cx="12.0" cy="14.8" r="1.4" />
        <circle cx="16.5" cy="14.8" r="1.4" />
        <circle cx="21.5" cy="14.2" r="1.4" />
        <circle cx="10.0" cy="19.5" r="1.4" />
        <circle cx="14.0" cy="20.5" r="1.4" />
        <circle cx="18.0" cy="19.5" r="1.4" />
      </g>
      <circle cx="14" cy="14" r="11.5" fill={`url(#pb-shine-${uid})`} />
      <circle cx="14" cy="14" r="13.2" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="0.8" />
    </svg>
  );
}

// ── Rating word labels ────────────────────────────────────────────────────────
const RATING_LABELS: Record<string, string[]> = {
  Power:        ["Soft",    "Moderate", "High",    "Explosive"],
  Spin:         ["Low",     "Medium",   "High",    "Elite"],
  Control:      ["Erratic", "Average",  "Precise", "Surgical"],
  Pop:          ["Muted",   "Balanced", "Lively",  "Explosive"],
  "Hand Speed": ["Slow",    "Average",  "Fast",    "Lightning"],
};

function getRatingWord(label: string, value: number): string {
  const labels = RATING_LABELS[label] ?? ["Low", "Medium", "High", "Elite"];
  if (value < 4.0) return labels[0];
  if (value < 6.5) return labels[1];
  if (value < 8.5) return labels[2];
  return labels[3];
}

// ── Bar gradient — green (control) → yellow (balanced) → red (power/spin) ────
const BAR_GRADIENT =
  "linear-gradient(to right, #10b981 0%, #84cc16 28%, #f59e0b 62%, #ef4444 100%)";

// ─────────────────────────────────────────────────────────────────────────────

export default function PerformanceBar({ label, value }: PerformanceBarProps) {
  const uid      = useId().replace(/:/g, "");
  const [alive, setAlive] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setAlive(true), 80);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pct  = Math.min(98, Math.max(2, (value / 10) * 100));
  const word = getRatingWord(label, value);

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: "var(--flip-text-head)" }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium tabular-nums" style={{ color: "var(--flip-text-muted)" }}>
            {word}
          </span>
          <span className="text-sm font-bold tabular-nums" style={{ color: "var(--flip-text-head)" }}>
            {value.toFixed(1)}
            <span className="font-normal text-xs" style={{ color: "var(--flip-text-muted)" }}> /10</span>
          </span>
        </div>
      </div>

      {/* Track + pickleball marker */}
      <div ref={trackRef} style={{ position: "relative", height: 14, overflow: "visible" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 9999,
            background: BAR_GRADIENT,
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.10), inset 0 -1px 1px rgba(255,255,255,0.15)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: alive ? `${pct}%` : "2%",
            transform: "translate(-50%, -50%)",
            transition: alive ? "left 1.25s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
            zIndex: 10,
            lineHeight: 0,
          }}
        >
          <PickleballMarker uid={uid} alive={alive} />
        </div>
      </div>

      {/* Scale ticks */}
      <div
        className="flex justify-between text-[10px] font-medium select-none px-px"
        style={{ color: "var(--flip-text-faint)" }}
      >
        <span>0</span>
        <span>2.5</span>
        <span>5</span>
        <span>7.5</span>
        <span>10</span>
      </div>
    </div>
  );
}
