"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Paddle } from "@/types";

const ROTATE_MS = 15000;
const LABEL = { text: "TRENDING", color: "#fb923c", rgb: "251,146,60" };

interface Props {
  paddles: Paddle[];
  showProgress?: boolean;
}

export default function PaddleAdSidebar({ paddles, showProgress = true }: Props) {
  const [idx, setIdx] = useState(0);
  const [pct, setPct] = useState(0);
  const total = paddles.length;

  const next = useCallback(() => {
    setIdx(i => (i + 1) % total);
    setPct(0);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      setPct(p => {
        if (p >= 100) { next(); return 0; }
        return p + (100 / (ROTATE_MS / 100));
      });
    }, 100);
    return () => clearInterval(id);
  }, [next, total]);

  if (!total) return null;

  const paddle = paddles[idx];
  const label  = LABEL;
  const hasDeal = !!paddle.discountLink?.trim();
  const hasSave = hasDeal && !!paddle.amountOff && paddle.amountOff !== "$0";

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="text-[10px] font-extrabold uppercase tracking-[0.22em] whitespace-nowrap"
          style={{ color: "var(--flip-text-muted, rgba(255,255,255,0.40))" }}
        >
          Featured Gear
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--flip-card-border, rgba(255,255,255,0.08))" }} />
      </div>

      {/* Thumbnail card */}
      <Link
        href={`/paddles/${paddle.slug}`}
        className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
        style={{
          background: `linear-gradient(155deg, rgba(${label.rgb},0.12) 0%, var(--flip-bg-card) 55%)`,
          border: `1px solid rgba(${label.rgb},0.24)`,
          boxShadow: `0 4px 28px rgba(${label.rgb},0.08), inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
      >
        {/* Badge */}
        <div className="px-4 pt-4">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
            style={{
              background: `rgba(${label.rgb},0.16)`,
              color: label.color,
              border: `1px solid rgba(${label.rgb},0.28)`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: label.color }}
            />
            {label.text}
          </span>
        </div>

        {/* Image */}
        <div
          className="mx-3 mt-3 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ height: 190, background: "var(--bg-section, rgba(255,255,255,0.03))" }}
        >
          {paddle.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={paddle.image}
              alt={paddle.name}
              className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.06]"
              style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.45))" }}
            />
          ) : (
            <div className="w-full h-full" style={{ background: `rgba(${label.rgb},0.06)` }} />
          )}
        </div>

        {/* Info */}
        <div className="p-4 pt-3">
          <p
            className="text-[9px] font-extrabold uppercase tracking-[0.22em] mb-0.5"
            style={{ color: label.color }}
          >
            {paddle.brand}
          </p>
          <p
            className="font-extrabold text-sm leading-snug mb-2 line-clamp-2"
            style={{ color: "var(--flip-text-head, #fff)" }}
          >
            {paddle.name}
          </p>

          {paddle.price && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-lg font-extrabold tabular-nums" style={{ color: "var(--flip-text-head, #fff)" }}>
                {paddle.price}
              </span>
              {hasSave && (
                <span
                  className="text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
                >
                  SAVE {paddle.amountOff}
                </span>
              )}
            </div>
          )}

          <div
            className="w-full text-center text-[11px] font-bold py-2.5 rounded-xl transition-all duration-200 group-hover:brightness-110"
            style={{
              background: hasDeal ? `rgba(${label.rgb},0.20)` : "rgba(255,255,255,0.05)",
              color: hasDeal ? label.color : "var(--flip-text-muted, rgba(255,255,255,0.4))",
              border: `1px solid rgba(${label.rgb},${hasDeal ? "0.35" : "0.12"})`,
            }}
          >
            {hasDeal ? "See Deal →" : "View Paddle →"}
          </div>
        </div>
      </Link>

      {/* Progress + dots */}
      {total > 1 && (
        <div className="mt-3 px-1">
          {showProgress && (
            <div className="h-0.5 rounded-full mb-2.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: label.color,
                  transition: "width 0.1s linear",
                  boxShadow: `0 0 6px ${label.color}`,
                }}
              />
            </div>
          )}
          <div className="flex items-center justify-center gap-1.5">
            {paddles.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setIdx(i); setPct(0); }}
                className="rounded-full transition-all duration-300"
                aria-label={`Go to featured paddle ${i + 1}`}
                style={{
                  width: i === idx ? 20 : 6,
                  height: 6,
                  background: i === idx ? label.color : "rgba(255,255,255,0.18)",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
