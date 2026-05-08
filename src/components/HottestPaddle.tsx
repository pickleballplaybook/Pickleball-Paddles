import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getPaddleBySlug } from "@/data/paddles";

function calcDiscountedPrice(price: string, amountOff: string): string | null {
  if (!amountOff || amountOff === "$0") return null;
  const base = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (isNaN(base) || base <= 0) return null;
  let discounted: number;
  if (amountOff.endsWith("%")) {
    const pct = parseFloat(amountOff);
    if (isNaN(pct)) return null;
    discounted = base * (1 - pct / 100);
  } else {
    const off = parseFloat(amountOff.replace(/[^0-9.]/g, ""));
    if (isNaN(off)) return null;
    discounted = base - off;
  }
  if (discounted <= 0) return null;
  return `$${discounted.toFixed(2)}`;
}

export default function HottestPaddle() {
  const { hottestPaddleSlug, hottestPaddleSeries, discountCode } = siteConfig;
  const paddle = getPaddleBySlug(hottestPaddleSlug);
  const shopLink = hottestPaddleSeries.seriesLink || paddle?.discountLink || "/paddles";
  const code = (paddle?.brand === "Selkirk" || paddle?.brand === "SLK") && !paddle?.discountLink?.includes("lockerroompickleball.com") ? "INF-PLAYBOOK" : discountCode;
  const discounted = paddle?.price && paddle?.amountOff ? calcDiscountedPrice(paddle.price, paddle.amountOff) : null;

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: "92vh" }}>

      {/* ── Full-bleed hero image ──────────────────────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/11six24-Power-2-Hero.png"
        alt="11SIX24 Power 2 Series"
        className="absolute inset-0 w-full h-full object-cover object-center"
        aria-hidden="true"
      />

      {/* ── Gradient overlays ─────────────────────────────────────────────── */}
      {/* Bottom-to-top dark fade for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.15) 70%, transparent 100%)",
        }}
      />
      {/* Left fade so copy stands out */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
        }}
      />
      {/* Subtle teal tint at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(13,148,136,0.18) 0%, transparent 100%)",
        }}
      />

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 container-xl flex flex-col justify-end h-full py-16 md:py-24" style={{ minHeight: "92vh" }}>
        <div className="max-w-2xl">

          {/* Badge */}
          <div className="flex items-center gap-2 mb-5">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{
                background: "rgba(20,184,166,0.18)",
                border: "1px solid rgba(20,184,166,0.45)",
                color: "#2dd4bf",
                backdropFilter: "blur(8px)",
              }}
            >
              <Flame className="w-3 h-3" />
              Hottest Paddle Right Now
            </div>
          </div>

          {/* Headline */}
          <h2
            className="font-extrabold tracking-tight leading-[0.93] mb-4 text-white"
            style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
          >
            {hottestPaddleSeries.headline}
          </h2>

          {/* Subheadline */}
          <p
            className="text-lg md:text-xl leading-relaxed mb-6 font-light"
            style={{ color: "rgba(255,255,255,0.78)", maxWidth: "52ch" }}
          >
            {hottestPaddleSeries.subheadline}
          </p>

          {/* Bullets */}
          <ul className="flex flex-wrap gap-2 mb-8">
            {hottestPaddleSeries.bullets.map((bullet) => (
              <li
                key={bullet}
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {bullet}
              </li>
            ))}
          </ul>

          {/* Price */}
          {paddle?.price && (
            <div className="flex items-baseline gap-3 mb-8">
              {discounted ? (
                <>
                  <span
                    className="text-xl font-semibold line-through"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {paddle.price}
                  </span>
                  <span className="text-4xl font-extrabold" style={{ color: "#2dd4bf" }}>
                    {discounted}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-extrabold text-white">{paddle.price}</span>
              )}
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <a
              href={shopLink}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center justify-center gap-2 font-extrabold text-base px-9 py-4 rounded-2xl text-white tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                boxShadow: "0 0 40px rgba(20,184,166,0.45), 0 4px 16px rgba(0,0,0,0.4)",
                letterSpacing: "0.05em",
              }}
            >
              SHOP NOW
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </a>
            <Link
              href={`/paddles/${hottestPaddleSlug}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-6 py-4 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(8px)",
              }}
            >
              Full Review
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Discount code note */}
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
            Use code{" "}
            <span className="font-mono font-bold" style={{ color: "rgba(45,212,191,0.9)" }}>
              {code}
            </span>
            {" "}at checkout for savings
          </p>

        </div>

        {/* Floating spec chips — bottom right */}
        {paddle && (
          <div className="absolute bottom-10 right-6 md:right-10 flex flex-col gap-2 items-end">
            <div
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{
                background: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(20,184,166,0.35)",
                color: "#2dd4bf",
                backdropFilter: "blur(12px)",
              }}
            >
              {paddle.thickness} Core
            </div>
            <div className="flex gap-2">
              <div
                className="px-4 py-2 rounded-xl text-xs font-bold"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(12px)",
                }}
              >
                SW {paddle.swingWeight}
              </div>
              <div
                className="px-4 py-2 rounded-xl text-xs font-bold"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(12px)",
                }}
              >
                TW {paddle.twistWeight}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
