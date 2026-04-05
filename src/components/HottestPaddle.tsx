import Link from "next/link";
import { ArrowRight, CheckCircle2, Flame } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getPaddleBySlug } from "@/data/paddles";

/**
 * HottestPaddle — Section 1 of the homepage.
 *
 * "Hottest Paddle Right Now" launch-style hero.
 *
 * TO SWAP THE FEATURED PADDLE:
 *   1. Update siteConfig.hottestPaddleSlug
 *   2. Update siteConfig.hottestPaddleSeries (headline, subheadline, bullets, link)
 */
export default function HottestPaddle() {
  const { hottestPaddleSlug, hottestPaddleSeries, discountCode } = siteConfig;
  const paddle = getPaddleBySlug(hottestPaddleSlug);
  const shopLink = hottestPaddleSeries.seriesLink || paddle?.discountLink || "/paddles";
  const code = paddle?.brand === "Selkirk" ? "INF-PLAYBOOK" : discountCode;

  return (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden"
      style={{ background: "var(--flip-bg)" }}
    >
      {/* ── Background atmosphere ─────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
        style={{
          background: "radial-gradient(circle at 60% 50%, rgba(20,184,166,0.15) 0%, rgba(20,184,166,0.04) 40%, transparent 70%)",
          filter: "blur(1px)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 bottom-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(22,58,106,0.2) 0%, transparent 70%)",
        }}
      />
      {/* Subtle grid texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="container-xl relative z-10 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-6 items-center">

          {/* ── Left: copy ───────────────────────────────────────────────── */}
          <div className="max-w-xl">
            {/* Label */}
            <div className="flex items-center gap-2.5 mb-6">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{
                  background: "rgba(20,184,166,0.12)",
                  border: "1px solid rgba(20,184,166,0.3)",
                  color: "#2dd4bf",
                }}
              >
                <Flame className="w-3 h-3" />
                Hottest Paddle Right Now
              </div>
            </div>

            {/* Headline */}
            <h1
              className="font-extrabold tracking-tight leading-[0.95] mb-6"
              style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)", color: "var(--flip-text-head)" }}
            >
              {hottestPaddleSeries.headline}
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg md:text-xl leading-relaxed mb-8 font-light"
              style={{ color: "var(--flip-text-body)" }}
            >
              {hottestPaddleSeries.subheadline}
            </p>

            {/* Bullets */}
            <ul className="space-y-3 mb-10">
              {hottestPaddleSeries.bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-3">
                  <CheckCircle2
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: "#14b8a6" }}
                    strokeWidth={2}
                  />
                  <span className="text-base font-medium" style={{ color: "var(--flip-text-body)" }}>
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <a
                href={shopLink}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center justify-center gap-2 font-extrabold text-base px-8 py-4 rounded-2xl text-white tracking-wide transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                  boxShadow: "0 0 32px rgba(20,184,166,0.3)",
                  letterSpacing: "0.04em",
                }}
              >
                SHOP NOW
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </a>
              <Link
                href={`/paddles/${hottestPaddleSlug}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-brand-500"
                style={{ color: "var(--flip-text-muted)" }}
              >
                See full review
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Code note */}
            <p className="mt-4 text-xs font-medium" style={{ color: "var(--flip-text-faint)" }}>
              Use code{" "}
              <span className="font-mono font-bold" style={{ color: "rgba(45,212,191,0.8)" }}>
                {code}
              </span>
              {" "}for savings
            </p>
          </div>

          {/* ── Right: paddle visual ─────────────────────────────────────── */}
          <div className="relative flex items-center justify-center lg:justify-end">

            {/* Glow layer */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(20,184,166,0.2) 0%, transparent 65%)",
                filter: "blur(32px)",
                transform: "scale(1.2)",
              }}
            />

            {/* Paddle image / placeholder */}
            <div
              className="relative w-[340px] h-[340px] md:w-[460px] md:h-[460px] rounded-3xl flex flex-col items-center justify-center"
              style={{
                background: "var(--flip-bg-card)",
                border: "1px solid rgba(20,184,166,0.15)",
                boxShadow: "0 0 80px rgba(20,184,166,0.1), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {paddle?.image ? (
                /* Real paddle image */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={paddle.image}
                  alt={paddle.name}
                  className="w-52 md:w-72 h-auto object-contain drop-shadow-2xl"
                />
              ) : (
                /* Fallback SVG */
                <>
                  <svg
                    viewBox="0 0 200 280"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-48 md:w-64 h-auto"
                    aria-hidden="true"
                  >
                    <rect x="8" y="8" width="184" height="196" rx="92" fill="url(#paddle-grad)" />
                    <rect x="78" y="200" width="44" height="72" rx="22" fill="url(#handle-grad)" />
                    {[55,85,115,145].map(y =>
                      [45,80,115,150].map(x => (
                        <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill="#0f766e" opacity="0.5" />
                      ))
                    )}
                    <ellipse cx="72" cy="55" rx="28" ry="40" fill="white" opacity="0.08" />
                    <defs>
                      <linearGradient id="paddle-grad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#0d9488" />
                      </linearGradient>
                      <linearGradient id="handle-grad" x1="0" y1="0" x2="0" y2="72" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#0f766e" />
                        <stop offset="100%" stopColor="#0a5c56" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Brand label (only shown with SVG placeholder) */}
                  <p
                    className="mt-4 text-xs font-bold uppercase tracking-widest"
                    style={{ color: "rgba(45,212,191,0.7)" }}
                  >
                    {paddle?.brand ?? "11SIX24"}
                  </p>
                </>
              )}

              {/* Floating spec chips */}
              {paddle && (
                <>
                  <div
                    className="absolute top-6 right-6 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: "rgba(20,184,166,0.15)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.2)" }}
                  >
                    {paddle.thickness} Core
                  </div>
                  <div
                    className="absolute bottom-6 left-6 flex gap-2"
                  >
                    <div
                      className="px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{
                        background: "var(--flip-bg-card)",
                        color: "var(--flip-text-body)",
                        border: "1px solid var(--flip-card-border)",
                      }}
                    >
                      SW {paddle.swingWeight}
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{
                        background: "var(--flip-bg-card)",
                        color: "var(--flip-text-body)",
                        border: "1px solid var(--flip-card-border)",
                      }}
                    >
                      TW {paddle.twistWeight}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
