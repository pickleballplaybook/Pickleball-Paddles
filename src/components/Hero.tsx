"use client";

import { siteConfig } from "@/config/site";
import { getPaddleCountLabel } from "@/lib/catalogStats";

export default function Hero() {
  return (
    <section
      className="relative w-full overflow-x-hidden"
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
        style={{ minHeight: "100vh", paddingTop: "calc(var(--topbar-h, 108px) + 3rem)", paddingBottom: "clamp(3rem, 8vh, 6rem)" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-end">

          {/* Left — copy */}
          <div>
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
              Find Your Perfect
              <br />
              <span style={{ color: "#2dd4bf" }}>Pickleball Paddle.</span>
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

            {/* TEMP limited-edition promo button — remove when the Joola Pro V Perseus promo ends */}
            <a
              href="/paddles/joola-pro-v-perseus-elongated"
              className="group inline-flex items-center gap-3 mt-5 pl-2 pr-4 py-2 rounded-full self-start transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "rgba(4,10,20,0.6)",
                border: "1px solid rgba(45,212,191,0.45)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 0 24px rgba(20,184,166,0.18)",
              }}
            >
              <span
                className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/limited-edition/Joola-Pro-V-Perseus-16mm.png"
                  alt="Joola Pro V Perseus limited edition"
                  className="w-full h-full object-contain p-0.5"
                />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "#2dd4bf" }}>
                  Limited Edition
                </span>
                <span className="text-xs font-semibold text-white">Joola Pro V Perseus</span>
              </span>
              <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden style={{ color: "#2dd4bf" }}>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

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

            {/* Credential stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
              {[
                { num: getPaddleCountLabel(), label: "Paddles Reviewed" },
                { num: "30+", label: "Video Reviews" },
                { num: "12+", label: "Years Coaching" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold text-white tracking-tight leading-none">{num}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Reviewer profile card */}
          <div
            className="rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: "rgba(4,10,20,0.7)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header band */}
            <div
              className="relative px-6 pt-7 pb-12"
              style={{
                background: "linear-gradient(135deg, rgba(13,148,136,0.28) 0%, rgba(4,10,20,0.55) 100%)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.35em] mb-5"
                style={{ color: "#2dd4bf" }}
              >
                Your Reviewer
              </p>
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/Austin-head-shot.png"
                  alt="Austin Hardy"
                  className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                  style={{ border: "2px solid rgba(45,212,191,0.45)" }}
                />
                <div>
                  <p className="text-xl font-extrabold text-white leading-tight">Austin Hardy</p>
                  <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Founder &amp; Lead Reviewer
                  </p>
                </div>
              </div>
            </div>

            {/* Credential chips */}
            <div className="px-6 -mt-5 flex flex-wrap gap-2">
              {["Pro Player", "12+ Yrs Coaching"].map((c) => (
                <span
                  key={c}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                  style={{
                    background: "rgba(4,10,20,0.9)",
                    border: "1px solid rgba(45,212,191,0.35)",
                    color: "#2dd4bf",
                  }}
                >
                  {c}
                </span>
              ))}
            </div>

            {/* Review process — numbered steps */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {[
                { n: "01", label: "Precision-measured specs on every paddle — swing weight, twist weight & static weight logged before we hit a single ball" },
                { n: "02", label: "Every paddle is properly broken in on court before evaluation begins — the way you'd actually play it" },
                { n: "03", label: "Full filmed review with a drilling partner — power off the baseline, touch at the kitchen, and resets under pressure" },
              ].map(({ n, label }) => (
                <div key={n} className="flex items-start gap-3">
                  <span
                    className="text-[11px] font-extrabold tabular-nums mt-0.5 flex-shrink-0 w-6"
                    style={{ color: "rgba(45,212,191,0.5)" }}
                  >
                    {n}
                  </span>
                  <span className="text-sm leading-snug" style={{ color: "rgba(255,255,255,0.68)" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <div className="px-6 pb-6 mt-1">
              <a
                href="/about"
                className="flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl text-white transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                  boxShadow: "0 0 28px rgba(20,184,166,0.4)",
                }}
              >
                Learn More About My Review Process
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
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
