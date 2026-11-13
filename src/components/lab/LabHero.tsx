"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LabGrid from "./LabGrid";
import PaddleCanvas from "./PaddleCanvas";
import type { Paddle } from "@/types";

// ── Animated count-up number ──────────────────────────────────────────────────
function CountUp({
  target,
  duration = 1400,
  suffix = "",
}: {
  target: number;
  duration?: number;
  suffix?: string;
}) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (target === 0) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const fps = 60;
          const totalFrames = Math.round((duration / 1000) * fps);
          let frame = 0;
          const timer = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const val = Math.round(eased * target);
            setCurrent(val);
            if (frame >= totalFrames) {
              setCurrent(target);
              clearInterval(timer);
            }
          }, 1000 / fps);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {current}
      {suffix}
    </span>
  );
}

// ── Trust metric pill ─────────────────────────────────────────────────────────
function TrustMetric({
  value,
  label,
  isText = false,
}: {
  value: number | string;
  label: string;
  isText?: boolean;
}) {
  return (
    <div className="flex flex-col items-center sm:items-start gap-0.5">
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "clamp(1.3rem, 3vw, 1.75rem)",
          fontWeight: 700,
          lineHeight: 1,
          color: "var(--lab-text-primary)",
          letterSpacing: "-0.025em",
        }}
      >
        {isText ? (
          value
        ) : (
          <CountUp target={typeof value === "number" ? value : parseInt(String(value), 10)} />
        )}
      </div>
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "9px",
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--lab-text-muted)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface LabHeroProps {
  totalPaddles: number;
  reviewedCount: number;
  brandCount: number;
  featuredPaddle?: Paddle | null;
}

export default function LabHero({
  totalPaddles,
  reviewedCount,
  brandCount,
  featuredPaddle,
}: LabHeroProps) {
  return (
    <section
      className="lab-section relative w-full overflow-hidden"
      style={{
        paddingTop: "var(--topbar-h, 112px)",
        paddingBottom: "clamp(2rem, 4vh, 3rem)",
      }}
      aria-label="Paddle Lab hero"
    >
      {/* Background grid + glows */}
      <LabGrid />

      {/* Bottom fade to next section */}
      <div
        className="absolute bottom-0 inset-x-0 pointer-events-none"
        style={{
          height: 180,
          background: "linear-gradient(to top, var(--lab-bg) 0%, transparent 100%)",
          zIndex: 2,
        }}
        aria-hidden
      />

      {/* Page content */}
      <div
        className="container-xl relative z-10 flex flex-col lg:grid lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_540px] gap-10 xl:gap-16 items-center"
        style={{
          paddingTop: "clamp(1.25rem, 2vh, 2rem)",
          paddingBottom: "clamp(1.5rem, 3vh, 2.5rem)",
        }}
      >
        {/* ── LEFT: copy ────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left order-2 lg:order-1">
          {/* Eyebrow */}
          <div
            className="lab-eyebrow flex items-center gap-3 mb-6"
            aria-label={`Playbook Lab — ${totalPaddles} paddles`}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--lab-green)",
                animation: "lab-glow-pulse 2s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
            PLAYBOOK LAB
            <span style={{ color: "var(--lab-text-muted)", margin: "0 2px" }}>//</span>
            {totalPaddles} PADDLES
          </div>

          {/* H1 */}
          <h1
            className="lab-headline mb-5"
            style={{
              fontSize: "clamp(2.6rem, 6vw, 5.2rem)",
              maxWidth: "14ch",
            }}
          >
            Know how it plays
            <br />
            <span style={{ color: "var(--lab-green-cta)" }}>before you buy it.</span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)",
              lineHeight: 1.6,
              color: "var(--lab-text-body)",
              maxWidth: "46ch",
              marginBottom: "clamp(1.75rem, 4vh, 2.5rem)",
            }}
          >
            Power, spin, control, pop, and speed — we test every category on court before writing a word. Other reviewers tell you what&apos;s inside the paddle. We tell you how it actually plays.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10 sm:mb-12 w-full sm:w-auto">
            <Link
              href="/paddles"
              className="inline-flex items-center justify-center gap-2 font-bold rounded-xl px-8 py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: "var(--lab-green-cta)",
                color: "var(--lab-cta-text)",
                fontSize: "0.9375rem",
                letterSpacing: "0.02em",
                boxShadow: "0 0 32px var(--lab-green-glow), 0 4px 16px rgba(0,0,0,0.3)",
                // focus ring color
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ["--tw-ring-color" as any]: "var(--lab-green)",
              }}
            >
              Find My Paddle
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/best-pickleball-paddles/weekly"
              className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-8 py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: "var(--lab-green-dim)",
                color: "var(--lab-text-primary)",
                border: "1px solid var(--lab-border-accent)",
                fontSize: "0.9375rem",
                backdropFilter: "blur(8px)",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ["--tw-ring-color" as any]: "var(--lab-green)",
              }}
            >
              This Week&apos;s Rankings
            </Link>
          </div>

          {/* Trust metrics */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5 w-full"
            style={{
              borderTop: "1px solid var(--lab-border)",
              paddingTop: "clamp(1.25rem, 3vh, 1.75rem)",
            }}
          >
            <TrustMetric value={totalPaddles} label="Paddles Measured" />
            <TrustMetric value={reviewedCount} label="Video Reviews" />
            <TrustMetric value={brandCount} label="Partner Brands" />
            <TrustMetric value="PPR" label="Certified Coach" isText />
          </div>
        </div>

        {/* ── RIGHT: paddle showcase ─────────────────────────────── */}
        <div
          className="relative order-1 lg:order-2 w-full flex-shrink-0"
          style={{
            height: "clamp(280px, 50vw, 580px)",
            maxHeight: "60vh",
          }}
        >
          <PaddleCanvas featuredPaddle={featuredPaddle} />
        </div>
      </div>

      {/* Bottom rule */}
      <div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, var(--lab-border-accent) 30%, var(--lab-border-accent) 70%, transparent)",
          zIndex: 3,
        }}
        aria-hidden
      />
    </section>
  );
}
