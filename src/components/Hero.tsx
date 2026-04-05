"use client";

import { paddles } from "@/data/paddles";
import { siteConfig } from "@/config/site";

const VALUE_PROPS = [
  "Real on-court reviews, not just spec sheets",
  "Compare any two paddles side by side",
  "Exclusive discount codes from top brands",
];

const featuredPaddle = paddles.find((p) => p.slug === siteConfig.hottestPaddleSlug);

function CheckIcon() {
  return (
    <svg className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="rgba(20,184,166,0.20)" />
      <path d="M7 12l3 3 7-6" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-4 h-4 lg:w-5 lg:h-5" viewBox="0 0 20 20" fill="#14b8a6" aria-hidden>
      <path d="M10 1l2.39 7.26H19l-5.81 4.22 2.22 6.85L10 15.27l-5.41 4.06 2.22-6.85L1 8.26h6.61z" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden flex flex-col"
      style={{
        background: "linear-gradient(160deg, #060d18 0%, #0b1628 100%)",
        paddingTop: "calc(var(--topbar-h, 108px) + 64px)",
        minHeight: "100vh",
      }}
    >
      {/* Teal glow */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <div
          className="h-[32rem] w-[72rem] opacity-[0.18] blur-3xl"
          style={{ background: "radial-gradient(ellipse at top, #14b8a6, transparent 65%)" }}
        />
      </div>

      {/* Fine dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Two-column content */}
      <div className="relative container-xl flex-1 flex items-start lg:items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-14 items-center w-full pb-6 lg:py-12">

          {/* ── MOBILE-FIRST: image comes first (order-1 mobile, order-2 desktop) ── */}
          <div className="flex items-center justify-center order-1 lg:order-2 mb-6 lg:mb-0">
            {/* Glow behind image — desktop only */}
            <div
              className="hidden lg:block absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 75% 70% at 50% 55%, rgba(20,184,166,0.15) 0%, transparent 70%)" }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/Hero-image.png"
              alt="Pickleball paddle hero"
              className="relative z-10 w-full max-w-[340px] lg:max-w-[520px]"
              style={{
                objectFit: "contain",
                filter: "drop-shadow(0 20px 48px rgba(0,0,0,0.7))",
              }}
            />
          </div>

          {/* ── Text content (order-2 mobile, order-1 desktop) ── */}
          <div className="flex flex-col order-2 lg:order-1">

            {/* Eyebrow */}
            <div className="flex items-center gap-2.5 mb-3 lg:mb-4">
              <span className="h-px w-8 bg-teal-500/50" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-400">
                Pickleball Playbook
              </p>
              <span className="h-px w-8 bg-teal-500/50" />
            </div>

            {/* Headline */}
            <h1
              className="font-extrabold text-white tracking-tight leading-[1.06]"
              style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
            >
              Real On-Court Paddle Reviews&nbsp;&amp; Discounts
            </h1>

            {/* Subheadline */}
            <p
              className="mt-3 lg:mt-4 leading-relaxed max-w-lg"
              style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)", color: "rgba(255,255,255,0.55)" }}
            >
              Stop guessing based on specs. See how paddles actually feel when played on court.
            </p>

            {/* Bullet list */}
            <ul className="mt-4 lg:mt-6 space-y-2 lg:space-y-3">
              {VALUE_PROPS.map((text) => (
                <li key={text} className="flex items-center gap-3 lg:gap-4">
                  <CheckIcon />
                  <span
                    className="font-semibold leading-snug"
                    style={{ fontSize: "clamp(0.875rem, 1.5vw, 1.125rem)", color: "rgba(255,255,255,0.85)" }}
                  >
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Buttons */}
            <div className="mt-6 lg:mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="/paddles"
                className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-8 py-3 lg:py-3.5 text-sm lg:text-base font-bold text-white transition-all duration-200 hover:bg-teal-400"
                style={{ boxShadow: "0 0 28px rgba(20,184,166,0.40)" }}
              >
                Browse Paddles
              </a>
              <a
                href="#latest-reviews"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 py-3 lg:py-3.5 text-sm lg:text-base font-semibold text-white/70 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                Latest Reviews
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-4 lg:mt-5 flex items-center gap-2.5">
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} />)}
              </div>
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                Trusted by 150,000+ pickleball players
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* Bottom rule */}
      <div
        aria-hidden
        className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }}
      />
    </section>
  );
}
