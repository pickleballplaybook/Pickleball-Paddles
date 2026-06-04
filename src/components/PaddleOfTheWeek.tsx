import Link from "next/link";
import { ExternalLink, Tag, Gift, Award } from "lucide-react";
import { Paddle } from "@/types";
import { siteConfig } from "@/config/site";
import PerformanceBar from "@/components/PerformanceBar";
import { buyAtLabel } from "@/lib/buyAtLabel";

interface Props {
  paddle: Paddle;
}

// ── Real ratings bars — only populated when paddle.ratings data exists ─────────
function ratingBars(paddle: Paddle) {
  const r = paddle.ratings;
  const candidates = [
    { label: "Power",      value: r?.power     },
    { label: "Pop",        value: r?.pop       },
    { label: "Hand Speed", value: r?.handSpeed },
  ];
  return candidates.filter((b): b is { label: string; value: number } =>
    b.value !== undefined && b.value !== null
  );
}

// ── Discount helpers ──────────────────────────────────────────────────────────
function getCode(brand: string, discountLink?: string) {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

function isGiftCard(brand: string, amountOff: string) {
  return brand === "Selkirk" && (amountOff === "$0" || !amountOff);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PaddleOfTheWeek({ paddle }: Props) {
  const bars     = ratingBars(paddle);
  const code     = getCode(paddle.brand, paddle.discountLink);
  const giftCard = isGiftCard(paddle.brand, paddle.amountOff);
  const hasLink  = !!paddle.discountLink?.trim();

  return (
    <section className="section-y" style={{ background: "var(--flip-bg-alt)" }}>
      <div className="container-xl">

        {/* Section header */}
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.25)" }}
          >
            <Award className="w-4 h-4" style={{ color: "#14b8a6" }} strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#14b8a6" }}>
              Editor&apos;s Pick
            </p>
            <h2
              className="text-3xl md:text-4xl font-extrabold tracking-tight"
              style={{ color: "var(--flip-text-head)" }}
            >
              Paddle of the Week
            </h2>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">

          {/* Left — paddle image */}
          <div
            className="rounded-3xl flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden"
            style={{
              background: "var(--flip-bg-card)",
              border: "1px solid var(--flip-card-border)",
            }}
          >
            {/* Background glow */}
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle at 50% 45%, rgba(20,184,166,0.1) 0%, transparent 65%)",
              }}
            />

            {paddle.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={paddle.image}
                alt={paddle.name}
                className="relative z-10 w-48 h-48 object-contain"
              />
            ) : (
              <svg
                viewBox="0 0 200 280"
                fill="none"
                className="relative z-10 w-44 h-auto"
                aria-hidden="true"
              >
                <rect x="8" y="8" width="184" height="196" rx="92" fill="url(#potw-head)" />
                <rect x="78" y="200" width="44" height="72" rx="22" fill="url(#potw-handle)" />
                {[55,90,125].map(y =>
                  [55,100,145].map(x => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="#0f766e" opacity="0.45" />
                  ))
                )}
                <ellipse cx="72" cy="55" rx="28" ry="40" fill="white" opacity="0.07" />
                <defs>
                  <linearGradient id="potw-head" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1d4ed8" />
                    <stop offset="100%" stopColor="#1e3a8a" />
                  </linearGradient>
                  <linearGradient id="potw-handle" x1="0" y1="0" x2="0" y2="72" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1e3a8a" />
                    <stop offset="100%" stopColor="#172554" />
                  </linearGradient>
                </defs>
              </svg>
            )}

            {/* Name overlay at bottom */}
            <div className="relative z-10 mt-6 text-center px-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#2dd4bf" }}>
                {paddle.brand}
              </p>
              <p className="text-lg font-extrabold leading-tight" style={{ color: "var(--flip-text-head)" }}>
                {paddle.name}
              </p>
              <p className="text-sm mt-0.5" style={{ color: "var(--flip-text-muted)" }}>
                {paddle.shape} · {paddle.thickness}
              </p>
            </div>
          </div>

          {/* Right — info panel */}
          <div className="flex flex-col gap-5">

            {/* Play Style Match — only rendered when real ratings exist */}
            {bars.length > 0 && (
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--flip-bg-card)",
                border: "1px solid var(--flip-card-border)",
              }}
            >
              <h3
                className="text-sm font-bold uppercase tracking-widest mb-5"
                style={{ color: "var(--flip-text-muted)" }}
              >
                Play Style Match
              </h3>

              <div className="space-y-6">
                {bars.map(({ label, value }) => (
                  <PerformanceBar key={label} label={label} value={value} />
                ))}
              </div>
            </div>
            )}

            {/* Specs row */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "var(--flip-bg-card)",
                border: "1px solid var(--flip-card-border)",
              }}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Weight",    value: paddle.weight      },
                  { label: "Swing Wt.", value: String(paddle.swingWeight) },
                  { label: "Twist Wt.", value: String(paddle.twistWeight) },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                      style={{ color: "var(--flip-text-muted)" }}
                    >
                      {label}
                    </p>
                    <p className="text-sm font-bold font-mono" style={{ color: "var(--flip-text-head)" }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount box */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(20,184,166,0.07)",
                border: "1px solid rgba(20,184,166,0.2)",
              }}
            >
              {giftCard ? (
                <div className="flex items-start gap-3">
                  <Gift className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#14b8a6" }} strokeWidth={1.75} />
                  <div>
                    <p className="font-bold text-sm mb-0.5" style={{ color: "var(--flip-text-head)" }}>
                      Free e-Gift Card with Purchase
                    </p>
                    <p className="text-xs" style={{ color: "var(--flip-text-body)" }}>
                      Use code{" "}
                      <span className="font-mono font-bold" style={{ color: "#2dd4bf" }}>{code}</span>
                      {" "}at checkout.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 flex-shrink-0" style={{ color: "#14b8a6" }} strokeWidth={1.75} />
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
                        style={{ color: "var(--flip-text-muted)" }}
                      >
                        Your Code
                      </p>
                      <p className="font-mono font-extrabold tracking-widest" style={{ color: "#2dd4bf" }}>
                        {code}
                      </p>
                    </div>
                  </div>
                  {paddle.amountOff && paddle.amountOff !== "$0" && (
                    <span className="text-lg font-extrabold" style={{ color: "#2dd4bf" }}>
                      Save {paddle.amountOff}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {hasLink ? (
                <a
                  href={paddle.discountLink}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex-1 flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-2xl text-white transition-all duration-200 active:scale-[0.98]"
                  style={{ background: "#14b8a6" }}
                >
                  {buyAtLabel(paddle.brand)}
                  <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
                </a>
              ) : (
                <button
                  disabled
                  className="flex-1 flex items-center justify-center font-bold text-sm py-3.5 rounded-2xl cursor-not-allowed"
                  style={{
                    background: "var(--flip-bg-card)",
                    color: "var(--flip-text-muted)",
                    border: "1px solid var(--flip-card-border)",
                  }}
                >
                  Link Coming Soon
                </button>
              )}
              <Link
                href={`/paddles/${paddle.slug}`}
                className="flex items-center justify-center font-semibold text-sm py-3.5 px-5 rounded-2xl transition-all duration-200"
                style={{
                  background: "var(--flip-bg-card)",
                  color: "var(--flip-text-body)",
                  border: "1px solid var(--flip-card-border)",
                }}
              >
                Full Review
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
