"use client";

import { paddles } from "@/data/paddles";
import { siteConfig } from "@/config/site";

const VALUE_PROPS = [
  "Real on-court reviews, not just spec sheets",
  "Compare any two paddles side by side",
  "Exclusive discount codes from top brands",
  "Smart filters to find your ideal paddle",
  "Honest takes from actual gameplay",
];

const featuredPaddle = paddles.find((p) => p.slug === siteConfig.hottestPaddleSlug);

function CheckIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="10" fill="rgba(20,184,166,0.18)" />
      <path d="M6 10l2.5 2.5 5.5-5" stroke="#2dd4bf" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="#14b8a6" aria-hidden>
      <path d="M10 1l2.39 7.26H19l-5.81 4.22 2.22 6.85L10 15.27l-5.41 4.06 2.22-6.85L1 8.26h6.61z" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #060d18 0%, #0b1628 100%)", paddingTop: "var(--shell-offset, 128px)" }}
    >
      {/* Teal glow */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <div
          className="h-96 w-[60rem] opacity-[0.18] blur-3xl"
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
      <div className="relative container-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[480px] lg:min-h-[560px]">

          {/* ── LEFT: copy ───────────────────────────────────────────────── */}
          <div className="flex flex-col py-12 lg:py-16">

            {/* Eyebrow */}
            <div className="flex items-center gap-2.5 mb-5">
              <span className="h-px w-6 bg-teal-500/50" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-400">
                Pickleball Playbook
              </p>
              <span className="h-px w-6 bg-teal-500/50" />
            </div>

            {/* Headline */}
            <h1
              className="font-extrabold text-white tracking-tight leading-[1.08]"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
            >
              Real On-Court Paddle Reviews&nbsp;&amp; Discounts
            </h1>

            {/* Subheadline */}
            <p className="mt-5 text-lg leading-relaxed max-w-lg" style={{ color: "rgba(255,255,255,0.55)" }}>
              Stop guessing based on specs. See how paddles actually feel when played on court.
            </p>

            {/* Stacked bullet list */}
            <ul className="mt-8 space-y-3.5">
              {VALUE_PROPS.map((text) => (
                <li key={text} className="flex items-center gap-3">
                  <CheckIcon />
                  <span className="text-[15px] sm:text-base font-medium" style={{ color: "rgba(255,255,255,0.78)" }}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <a
                href="/paddles"
                className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-8 py-3.5 text-base font-bold text-white transition-all duration-200 hover:bg-teal-400"
                style={{ boxShadow: "0 0 28px rgba(20,184,166,0.40)" }}
              >
                Browse Paddles
              </a>
              <a
                href="#latest-reviews"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold text-white/70 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                Latest Reviews
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-6 flex items-center gap-2.5">
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} />)}
              </div>
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                Trusted by 10,000+ pickleball players
              </span>
            </div>

          </div>

          {/* ── RIGHT: hero image ──────────────────────────────────────────── */}
          <div className="relative hidden lg:flex items-center justify-center py-10">
            {/* Glow behind image */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 70% 65% at 50% 55%, rgba(20,184,166,0.13) 0%, transparent 70%)" }}
            />
            {featuredPaddle?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featuredPaddle.image}
                alt={`${featuredPaddle.brand} ${featuredPaddle.name}`}
                className="relative z-10 w-full max-w-[440px]"
                style={{
                  objectFit: "contain",
                  filter: "drop-shadow(0 32px 72px rgba(0,0,0,0.7))",
                }}
              />
            )}
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
