"use client";

import { siteConfig } from "@/config/site";

export default function Hero() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        minHeight: "100vh",
        paddingTop: "var(--topbar-h, 108px)",
      }}
    >
      {/* ── Full-bleed background image ───────────────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/Hero-image.png"
        alt="Pickleball Playbook hero"
        className="absolute inset-0 w-full h-full object-cover object-center"
        aria-hidden="true"
      />

      {/* ── Gradient overlays ─────────────────────────────────────────────── */}
      {/* Dark bottom fade — keeps text crisp */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(4,10,20,0.96) 0%, rgba(4,10,20,0.65) 38%, rgba(4,10,20,0.2) 65%, transparent 100%)",
        }}
      />
      {/* Left column darkening for copy */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to right, rgba(4,10,20,0.82) 0%, rgba(4,10,20,0.45) 55%, transparent 100%)",
        }}
      />
      {/* Teal atmospheric glow at bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[320px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at bottom left, rgba(13,148,136,0.22) 0%, transparent 70%)",
        }}
      />

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 container-xl flex flex-col justify-end"
        style={{ minHeight: "100vh", paddingBottom: "clamp(3rem, 8vh, 6rem)" }}
      >
        <div className="max-w-3xl">

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5">
            <span className="h-px w-10" style={{ background: "rgba(45,212,191,0.6)" }} />
            <p
              className="text-[10px] font-bold uppercase tracking-[0.35em]"
              style={{ color: "#2dd4bf" }}
            >
              Pickleball Playbook
            </p>
          </div>

          {/* Headline */}
          <h1
            className="font-extrabold text-white tracking-tight leading-[0.93] mb-6"
            style={{
              fontSize: "clamp(3.2rem, 8vw, 7rem)",
              textShadow: "0 4px 40px rgba(0,0,0,0.6)",
            }}
          >
            The Last Paddle&nbsp;Guide
            <br />
            <span style={{ color: "#2dd4bf" }}>You'll Ever Need.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="font-light leading-relaxed mb-10"
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              color: "rgba(255,255,255,0.65)",
              maxWidth: "48ch",
            }}
          >
            Real on-court reviews, side-by-side comparisons, and exclusive discounts — everything you need to find the right paddle.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/paddles"
              className="inline-flex items-center justify-center font-extrabold text-base px-10 py-4 rounded-2xl text-white tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                boxShadow: "0 0 48px rgba(20,184,166,0.5), 0 4px 20px rgba(0,0,0,0.4)",
                letterSpacing: "0.05em",
              }}
            >
              BROWSE PADDLES
            </a>
            <a
              href="#latest-reviews"
              className="inline-flex items-center justify-center font-semibold text-base px-10 py-4 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(12px)",
              }}
            >
              Latest Reviews
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex gap-0.5">
              {[0,1,2,3,4].map((i) => (
                <svg key={i} className="w-4 h-4" viewBox="0 0 20 20" fill="#14b8a6" aria-hidden>
                  <path d="M10 1l2.39 7.26H19l-5.81 4.22 2.22 6.85L10 15.27l-5.41 4.06 2.22-6.85L1 8.26h6.61z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Trusted by 150,000+ pickleball players
            </span>
          </div>

        </div>
      </div>

      {/* Bottom rule */}
      <div
        aria-hidden
        className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.3), transparent)" }}
      />
    </section>
  );
}
