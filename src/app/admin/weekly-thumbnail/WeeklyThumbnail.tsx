"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { Paddle } from "@/types";

interface Props {
  paddles: Paddle[]; // up to 3 — middle paddle gets the elevated hero slot
}

// Square Instagram-grade format. 1080x1080 source → 2160x2160 retina PNG.
const SIZE = 1080;

// Compute the current week's Monday in UTC, matching the cron's weekDate logic.
function thisWeeksMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - ((day + 6) % 7));
  return monday.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default function WeeklyThumbnail({ paddles }: Props) {
  const thumbRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!thumbRef.current || busy) return;
    setBusy(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const opts = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#06101e",
        width: SIZE,
        height: SIZE,
      };
      await toPng(thumbRef.current, opts); // warm-up
      const dataUrl = await toPng(thumbRef.current, opts);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `weekly-top10-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch (err) {
      console.error("Thumbnail export failed:", err);
      alert("Thumbnail export failed. See console for details.");
    } finally {
      setBusy(false);
    }
  }

  const weekOf = thisWeeksMonday();

  return (
    <div className="flex flex-col gap-5">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={download}
          disabled={busy}
          className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl bg-green-500 text-black hover:bg-green-400 disabled:opacity-60 transition"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {busy ? "Building…" : `Download PNG (${SIZE}×${SIZE} @ 2×)`}
        </button>
        <p className="text-xs text-gray-500">
          Week of <span className="text-gray-300 font-semibold">{weekOf}</span> · Featuring:{" "}
          <span className="text-gray-300 font-semibold">{paddles.map((p) => `${p.brand} ${p.name}`).join(" · ")}</span>
        </p>
      </div>

      {/* Live preview — fixed 540×540 with a clean 0.5 scale of the 1080 source.
          Using a static scale instead of calc(min(100%, …) / 1080) because that
          mixed-unit calc doesn't resolve inside transform:scale() and was
          rendering the inner div at full 1080×1080 (so it got clipped). */}
      <div
        className="rounded-2xl overflow-hidden border border-gray-800"
        style={{ width: 540, height: 540 }}
      >
        <div
          style={{
            width: SIZE,
            height: SIZE,
            transform: "scale(0.5)",
            transformOrigin: "top left",
          }}
        >
          <ThumbDesign paddles={paddles} weekOf={weekOf} />
        </div>
      </div>

      {/* Capture source — full-size, off-screen */}
      <div aria-hidden style={{ position: "fixed", top: 0, left: -99999, pointerEvents: "none" }}>
        <div ref={thumbRef} style={{ width: SIZE, height: SIZE }}>
          <ThumbDesign paddles={paddles} weekOf={weekOf} />
        </div>
      </div>
    </div>
  );
}

// ── The thumbnail itself — 1080×1080 square ───────────────────────────────────
// Vertical stack: top branding bar → headline block (centered, capped width
// so no overflow) → 3 paddles fanned → Austin badge → footer URL.

function ThumbDesign({ paddles, weekOf }: { paddles: Paddle[]; weekOf: string }) {
  const PAD = 60;

  return (
    <div
      style={{
        position: "relative",
        width: SIZE,
        height: SIZE,
        overflow: "hidden",
        background: [
          // Top-center teal aurora — focuses attention on headline
          "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(20,184,166,0.28) 0%, transparent 70%)",
          // Mid-canvas champagne spotlight under paddles
          "radial-gradient(ellipse 55% 35% at 50% 62%, rgba(212,163,90,0.10) 0%, transparent 70%)",
          // Bottom-right warm vignette
          "radial-gradient(ellipse 60% 50% at 110% 110%, rgba(212,163,90,0.12) 0%, transparent 60%)",
          // Base
          "linear-gradient(160deg, #0a1628 0%, #0c1e35 35%, #0d2a3a 60%, #08182a 100%)",
        ].join(", "),
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.07)",
          "inset 0 0 0 1px rgba(255,255,255,0.04)",
          "inset 0 -120px 180px rgba(0,0,0,0.40)",
        ].join(", "),
      }}
    >
      {/* TOP — branding bar */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: PAD,
          right: PAD,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span style={{ display: "inline-block", width: 28, height: 1.5, background: "linear-gradient(90deg, transparent, #d4a574)" }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.32em",
            color: "rgba(212,163,90,0.85)",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Playbook Paddles
        </span>
        <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(212,163,90,0.18), transparent)" }} />
      </div>

      {/* HEADLINE BLOCK */}
      <div
        style={{
          position: "absolute",
          top: 88,
          left: PAD,
          right: PAD,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#f4d28a",
              boxShadow: "0 0 12px rgba(244,210,138,0.6)",
            }}
          />
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "0.32em",
              color: "rgba(244,210,138,0.95)",
              textTransform: "uppercase",
            }}
          >
            This Week&apos;s Rankings
          </span>
        </div>

        <h1
          style={{
            fontSize: 100,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: "-0.025em",
            color: "#ffffff",
            margin: 0,
            maxWidth: SIZE - PAD * 2,
            textShadow: "0 6px 36px rgba(0,0,0,0.6)",
          }}
        >
          The Top 10 Paddles
        </h1>

        <p
          style={{
            margin: "18px 0 0 0",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.10em",
            color: "rgba(94,234,212,0.95)",
            textTransform: "uppercase",
          }}
        >
          Week of {weekOf}
        </p>

        {/* Hairline gold divider under headline */}
        <span
          style={{
            display: "block",
            width: 120,
            height: 1.5,
            marginTop: 20,
            background: "linear-gradient(90deg, transparent, rgba(212,163,90,0.55), transparent)",
          }}
        />
      </div>

      {/* PADDLES — center stage, MUCH bigger, middle paddle = hero with gold #1 badge */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 360,
          bottom: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: "1100px",
        }}
      >
        {paddles.slice(0, 3).map((p, i, arr) => {
          const isCenter = i === 1 && arr.length >= 3;
          const isLeft = i === 0 && arr.length >= 2;
          const isRight = i === arr.length - 1 && arr.length >= 2 && !isCenter;
          const rotate = isLeft ? 7 : isRight ? -7 : 0;
          const translateY = isCenter ? -28 : 0;
          const z = isCenter ? 3 : 1;
          const widthPx = isCenter ? 380 : 320;
          return (
            <div
              key={p.slug}
              style={{
                position: "relative",
                width: widthPx,
                marginLeft: i > 0 ? -56 : 0,
                transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
                zIndex: z,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt={`${p.brand} ${p.name}`}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "100%",
                    objectFit: "contain",
                    filter: `drop-shadow(0 ${isCenter ? 36 : 26}px ${isCenter ? 56 : 44}px rgba(0,0,0,0.70)) drop-shadow(0 10px 18px rgba(0,0,0,0.45))`,
                  }}
                />
              )}
              {/* Pedestal glow */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  bottom: -16,
                  width: "72%",
                  height: 14,
                  borderRadius: 999,
                  background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 75%)",
                  filter: "blur(12px)",
                }}
              />
              {/* Gold #1 badge on the hero paddle */}
              {isCenter && (
                <div
                  style={{
                    position: "absolute",
                    top: -22,
                    right: -22,
                    width: 76,
                    height: 76,
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #f4d28a 0%, #d4a35a 100%)",
                    border: "2px solid rgba(244,210,138,0.85)",
                    boxShadow: "0 10px 30px rgba(212,163,90,0.50), inset 0 1px 0 rgba(255,255,255,0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 5,
                  }}
                >
                  <span
                    style={{
                      fontSize: 30,
                      fontWeight: 900,
                      color: "#1a0f00",
                      letterSpacing: "-0.04em",
                      textShadow: "0 1px 0 rgba(255,255,255,0.3)",
                      lineHeight: 1,
                    }}
                  >
                    #1
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AUSTIN BADGE — bigger, glassier, refined */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          bottom: 92,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 130,
            height: 130,
            borderRadius: 26,
            overflow: "hidden",
            border: "3px solid rgba(45,212,191,0.65)",
            boxShadow: "0 14px 36px rgba(20,184,166,0.35), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(0,0,0,0.4)",
            background: "#0a1628",
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/Austin-head-shot.png" alt="Austin Hardy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {/* Subtle inner edge highlight on the photo */}
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 23,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)",
              pointerEvents: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.30em",
              textTransform: "uppercase",
              color: "rgba(45,212,191,0.95)",
              marginBottom: 4,
            }}
          >
            Reviewed By
          </span>
          <span style={{ fontSize: 34, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.015em", lineHeight: 1.05 }}>
            Austin Hardy
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
            Founder · Pickleball Playbook
          </span>
        </div>
      </div>

      {/* FOOTER — URL with teal rules */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: PAD,
          right: PAD,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.30), transparent)" }} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.30em",
            color: "rgba(94,234,212,0.85)",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          PlaybookPaddles.com
        </span>
        <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.30), transparent)" }} />
      </div>
    </div>
  );
}
