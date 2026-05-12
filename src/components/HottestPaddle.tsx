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

// All three Crystal Blue paddles for the hero
const HERO_PADDLES = [
  "honolulu-j2cr-crystal-blue-hybrid",
  "honolulu-j3cr-crystal-blue-widebody",
  "honolulu-j6cr-crystal-blue-elongated",
];

export default function HottestPaddle() {
  const { hottestPaddleSlug, hottestPaddleSeries, discountCode } = siteConfig;
  const paddle = getPaddleBySlug(hottestPaddleSlug);
  const heroPaddles = HERO_PADDLES.map(getPaddleBySlug).filter(Boolean);
  const shopLink = hottestPaddleSeries.seriesLink || paddle?.discountLink || "/paddles";
  const code = (paddle?.brand === "Selkirk" || paddle?.brand === "SLK") && !paddle?.discountLink?.includes("lockerroompickleball.com") ? "INF-PLAYBOOK" : discountCode;
  const discounted = paddle?.price && paddle?.amountOff ? calcDiscountedPrice(paddle.price, paddle.amountOff) : null;

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: "92vh" }}>

      {/* ── Background — dark gradient ──────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, #0a1628 0%, #0c1e35 35%, #0d2a3a 60%, #081820 100%)",
        }}
      />

      {/* Subtle radial glow behind paddles */}
      <div
        className="absolute top-1/2 right-0 -translate-y-1/2 w-[70%] h-[80%] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(20,184,166,0.08) 0%, transparent 65%)",
        }}
      />

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 container-xl flex items-center h-full py-16 md:py-24" style={{ minHeight: "92vh" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">

          {/* Left — Copy */}
          <div className="max-w-xl">
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
                Hottest Paddles Right Now
              </div>
            </div>

            {/* Headline */}
            <h2
              className="font-extrabold tracking-tight leading-[0.93] mb-4 text-white"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
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
                    <span className="text-xl font-semibold line-through" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {paddle.price}
                    </span>
                    <span className="text-4xl font-extrabold" style={{ color: "#2dd4bf" }}>
                      {discounted}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-extrabold text-white">{paddle.price}</span>
                )}
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>each</span>
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
                BUY WITH DISCOUNT
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
              {" "}at checkout for 10% off
            </p>
          </div>

          {/* Right — 3 paddles side by side */}
          <div className="relative flex items-center justify-center">
            <div className="flex items-end gap-[-20px] relative" style={{ perspective: "800px" }}>
              {heroPaddles.map((p, i) => {
                if (!p) return null;
                // Stagger: middle paddle slightly higher
                const translateY = i === 1 ? -20 : 0;
                const rotate = i === 0 ? 5 : i === 2 ? -5 : 0;
                return (
                  <Link
                    key={p.slug}
                    href={`/paddles/${p.slug}`}
                    className="relative group transition-transform duration-300 hover:scale-105 hover:z-10"
                    style={{
                      transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
                      marginLeft: i > 0 ? "-30px" : "0",
                      zIndex: i === 1 ? 3 : 1,
                    }}
                  >
                    <div
                      className="relative rounded-2xl overflow-hidden p-4"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        backdropFilter: "blur(12px)",
                        width: "200px",
                      }}
                    >
                      {p.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt={`${p.brand} ${p.name}`}
                          className="w-full h-auto object-contain"
                          style={{
                            filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.4))",
                          }}
                        />
                      )}
                      <p className="text-center text-xs font-bold mt-3 text-white truncate">{p.name.split(" ").slice(0, 2).join(" ")}</p>
                      <p className="text-center text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{p.shape}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
