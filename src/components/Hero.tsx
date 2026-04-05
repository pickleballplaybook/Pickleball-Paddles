"use client";

const VALUE_PROPS = [
  "Real on-court reviews, not just spec sheets",
  "Compare any two paddles side by side",
  "Exclusive discount codes from top brands",
  "Smart filters to find your ideal paddle",
  "Honest takes from actual gameplay",
];

function CheckIcon() {
  return (
    <svg
      className="w-[15px] h-[15px] flex-shrink-0"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden
    >
      <circle cx="7.5" cy="7.5" r="7.5" fill="rgba(20,184,166,0.18)" />
      <path
        d="M4.5 7.5l2 2 4-4"
        stroke="#2dd4bf"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Hero() {
  return (
    <>
      <section
        className="relative overflow-hidden pt-28"
        style={{ background: "linear-gradient(160deg, #060d18 0%, #0b1628 100%)" }}
      >
        {/* Teal glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        >
          <div
            className="h-72 w-[56rem] opacity-[0.22] blur-3xl"
            style={{ background: "radial-gradient(ellipse at top, #14b8a6, transparent 65%)" }}
          />
        </div>

        {/* Fine dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Content */}
        <div className="relative mx-auto max-w-4xl px-6 py-11 md:py-14 text-center">

          {/* Eyebrow */}
          <div className="mb-5 flex items-center justify-center gap-2.5">
            <span className="h-px w-7 bg-teal-500/50" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-400">
              Pickleball Playbook
            </p>
            <span className="h-px w-7 bg-teal-500/50" />
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-2xl text-[1.85rem] font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-[2.65rem]">
            Real On-Court Paddle Reviews&nbsp;&amp; Discounts
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-slate-400 sm:text-[15px] sm:max-w-md">
            Stop guessing based on specs. See how paddles actually feel when played on court.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/paddles"
              className="inline-flex items-center justify-center rounded-lg bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-teal-400"
              style={{ boxShadow: "0 0 22px rgba(20,184,166,0.38)" }}
            >
              Browse Paddles
            </a>
            <a
              href="#latest-reviews"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white/70 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Latest Reviews
            </a>
          </div>

          {/* ── Value props ────────────────────────────────────────────────── */}
          <div
            className="mt-10 pt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            {VALUE_PROPS.map((text) => (
              <span key={text} className="flex items-center gap-2">
                <CheckIcon />
                <span className="text-[13px] font-medium text-slate-300 leading-none whitespace-nowrap">
                  {text}
                </span>
              </span>
            ))}
          </div>

        </div>

        {/* Bottom rule */}
        <div
          aria-hidden
          className="absolute bottom-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }}
        />
      </section>

    </>
  );
}
