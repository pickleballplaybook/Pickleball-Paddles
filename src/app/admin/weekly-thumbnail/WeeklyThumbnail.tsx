"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { Paddle } from "@/types";

interface Props {
  paddles: Paddle[]; // up to 3 — middle paddle gets the elevated hero slot
}

const W = 1280;
const H = 720;

function monthYear(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
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
        width: W,
        height: H,
      };
      await toPng(thumbRef.current, opts); // warm-up
      const dataUrl = await toPng(thumbRef.current, opts);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `new-launches-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch (err) {
      console.error("Thumbnail export failed:", err);
      alert("Thumbnail export failed. See console for details.");
    } finally {
      setBusy(false);
    }
  }

  const launchMonth = monthYear();

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
          {busy ? "Building…" : `Download PNG (${W}×${H} @ 2×)`}
        </button>
        <p className="text-xs text-gray-500">
          Featuring: <span className="text-gray-300 font-semibold">
            {paddles.map((p) => `${p.brand} ${p.name}`).join(" · ")}
          </span>
        </p>
      </div>

      {/* Live preview — scaled to fit the screen */}
      <div
        className="rounded-2xl overflow-hidden border border-gray-800"
        style={{ width: "min(100%, 1100px)", aspectRatio: `${W} / ${H}` }}
      >
        <div
          style={{
            width: W,
            height: H,
            transform: "scale(calc(min(100%, 1100px) / 1280))",
            transformOrigin: "top left",
          }}
        >
          <ThumbDesign paddles={paddles} launchMonth={launchMonth} />
        </div>
      </div>

      {/* The capture source — full-size, off-screen */}
      <div aria-hidden style={{ position: "fixed", top: 0, left: -99999, pointerEvents: "none" }}>
        <div ref={thumbRef} style={{ width: W, height: H }}>
          <ThumbDesign paddles={paddles} launchMonth={launchMonth} />
        </div>
      </div>
    </div>
  );
}

// ── The thumbnail design ─────────────────────────────────────────────────────
// Premium editorial: navy + champagne gold + teal palette.
// 3 paddles fanned center-stage (middle = elevated hero), Austin headshot
// badge bottom-left, "NEW LAUNCHES" headline upper-right.

function ThumbDesign({ paddles, launchMonth }: { paddles: Paddle[]; launchMonth: string }) {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: [
          "radial-gradient(ellipse 70% 60% at 25% -10%, rgba(20,184,166,0.22) 0%, transparent 65%)",
          "radial-gradient(ellipse 60% 55% at 105% 110%, rgba(212,163,90,0.14) 0%, transparent 60%)",
          "linear-gradient(160deg, #0a1628 0%, #0c1e35 35%, #0d2a3a 60%, #08182a 100%)",
        ].join(", "),
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.06)",
          "inset 0 0 0 1px rgba(255,255,255,0.03)",
          "inset 0 -80px 140px rgba(0,0,0,0.35)",
        ].join(", "),
      }}
    >
      {/* Top branding bar */}
      <div style={{ position: "absolute", top: 36, left: 60, right: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ display: "inline-block", width: 32, height: 1.5, background: "linear-gradient(90deg, transparent, #d4a574)" }} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.35em",
            color: "rgba(212,163,90,0.85)",
            textTransform: "uppercase",
          }}
        >
          Playbook Paddles
        </span>
        <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(212,163,90,0.18), transparent)" }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
          }}
        >
          {launchMonth}
        </span>
      </div>

      {/* NEW LAUNCHES headline — upper right */}
      <div style={{ position: "absolute", top: 110, right: 60, textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginBottom: 14 }}>
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
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.32em",
              color: "rgba(244,210,138,0.95)",
              textTransform: "uppercase",
            }}
          >
            New Launches
          </span>
        </div>
        <h2
          style={{
            fontSize: 84,
            fontWeight: 900,
            lineHeight: 0.93,
            letterSpacing: "-0.025em",
            color: "#ffffff",
            margin: 0,
            textShadow: "0 6px 30px rgba(0,0,0,0.5)",
          }}
        >
          Fresh Drops
        </h2>
        <p
          style={{
            margin: "10px 0 0 0",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "rgba(94,234,212,0.95)",
          }}
        >
          {paddles.map((p) => p.brand).join(" · ")}
        </p>
      </div>

      {/* 3 paddles fanned — center stage, middle paddle elevated */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 110,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 0,
          perspective: "800px",
        }}
      >
        {paddles.map((p, i) => {
          const isCenter = i === 1 && paddles.length >= 3;
          const isLeft = i === 0 && paddles.length >= 2;
          const isRight = i === paddles.length - 1 && paddles.length >= 2 && !isCenter;
          const rotate = isLeft ? 6 : isRight ? -6 : 0;
          const translateY = isCenter ? -36 : 0;
          const z = isCenter ? 3 : 1;
          const widthPx = isCenter ? 260 : 220;
          return (
            <div
              key={p.slug}
              style={{
                position: "relative",
                width: widthPx,
                marginLeft: i > 0 ? -28 : 0,
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
                    maxHeight: isCenter ? 460 : 410,
                    objectFit: "contain",
                    filter: `drop-shadow(0 ${isCenter ? 30 : 22}px ${isCenter ? 50 : 40}px rgba(0,0,0,0.65)) drop-shadow(0 8px 16px rgba(0,0,0,0.4))`,
                  }}
                />
              )}
              {/* Pedestal glow under each paddle */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  bottom: -8,
                  width: "70%",
                  height: 10,
                  borderRadius: 999,
                  background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 75%)",
                  filter: "blur(8px)",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Austin badge — bottom left */}
      <div style={{ position: "absolute", bottom: 92, left: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 86,
            height: 86,
            borderRadius: 20,
            overflow: "hidden",
            border: "2.5px solid rgba(45,212,191,0.55)",
            boxShadow: "0 8px 24px rgba(20,184,166,0.28), inset 0 1px 0 rgba(255,255,255,0.10)",
            background: "#0a1628",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/Austin-head-shot.png"
            alt="Austin Hardy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(45,212,191,0.9)",
            }}
          >
            Reviewed By
          </span>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
            Austin Hardy
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
            Founder · Pickleball Playbook
          </span>
        </div>
      </div>

      {/* Bottom footer rule + URL */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 60,
          right: 60,
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
            letterSpacing: "0.32em",
            color: "rgba(94,234,212,0.85)",
            textTransform: "uppercase",
          }}
        >
          PlaybookPaddles.com
        </span>
        <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.30), transparent)" }} />
      </div>
    </div>
  );
}
