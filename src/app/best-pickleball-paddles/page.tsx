import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getPaddleBySlug } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import { getPaddleCountLabel } from "@/lib/catalogStats";
import YouTubeEmbed from "@/components/YouTubeEmbed";

export const metadata: Metadata = {
  title: "Best Pickleball Paddles of 2026 — Tested & Ranked | Pickleball Playbook",
  description:
    "We tested 100+ pickleball paddles on a real court in 2026 and ranked the best by category — power, control, all-court, value, and beginners. Every pick is unsponsored.",
  openGraph: {
    title: "Best Pickleball Paddles of 2026 — Tested & Ranked",
    description:
      "100+ paddles tested. Ranked by a PPR-certified pro player with 12+ years coaching. Find the best paddle for your game.",
    url: `${siteConfig.siteUrl}/best-pickleball-paddles`,
  },
};

// ── Editorial picks ────────────────────────────────────────────────────────────
interface Pick {
  slug: string;
  seriesSlugs?: string[]; // when set, show all paddles in a series layout
  category: string;
  anchor: string;
  accent: string;
  why: string;
  runnerUps?: { slug: string; why: string }[];
}

const PICKS: Pick[] = [
  {
    slug: "honolulu-j2cr-crystal-blue-hybrid",
    seriesSlugs: [
      "honolulu-j2cr-crystal-blue-hybrid",
      "honolulu-j3cr-crystal-blue-widebody",
      "honolulu-j6cr-crystal-blue-elongated",
    ],
    category: "Best Overall",
    anchor: "best-overall",
    accent: "#f59e0b",
    why: "The Honolulu Crystal Blue Endurance Surface series is the complete package. The J2CR Hybrid leads the line with a SW of 109.61, TW of 6.57, and an Endurance Surface face that maintains its spin generation long after other paddles degrade. Three shapes cover every preference. At $195 with 10–15% off using PLAYBOOK, the series offers genuine quality at an honest price. This is what a best-overall paddle looks like in 2026.",
    runnerUps: [],
  },
  {
    slug: "honolulu-j6cr-crystal-blue-elongated",
    category: "Best for Spin",
    anchor: "best-spin",
    accent: "#f97316",
    why: "The Honolulu J6CR Crystal Blue with Endurance Surface is the spin king. The textured face generates RPMs that stay consistent over time — something most paddles can't claim. The elongated shape and 16mm core give you the leverage and dwell time to maximize spin on serves, drives, and dinks. If spin is your primary weapon, this is the paddle to reach for.",
    runnerUps: [
      {
        slug: "11six24-vapor-power-2-hybrid",
        why: "The Vapor Power 2's HexGrit surface is one of the best for spin generation. SW 113.77 with TW 6.73 gives you the stability and power to put heavy topspin on every drive.",
      },
      {
        slug: "thrive-ignite-pro-series-hybrid",
        why: "The Thrive Ignite Pro Series brings a textured 15.5mm face that grabs the ball exceptionally well. At $219.99 with 10% off, it's a spin-forward paddle with enough control for all-court play.",
      },
    ],
  },
  {
    slug: "friday-aura-pro-elongated",
    category: "Best for Power",
    anchor: "best-power",
    accent: "#ef4444",
    why: "The Friday Aura Pro earns the power pick with a SW of 116.33 at just $169 — one of the best power-per-dollar ratios in our database. The 16mm core keeps enough touch for kitchen transitions, but this paddle's strength is on drives, serves, and putaways from the transition zone. The elongated shape gives you leverage and reach to dictate rallies.",
    runnerUps: [
      {
        slug: "gherkin-draco-widebody",
        why: "The Draco Widebody is the forgiving power option — SW 105.94 with TW 6.74 means you get a big sweet spot and excellent stability while still playing with a power-classified paddle. Great for players who want to hit hard but value consistency.",
      },
      {
        slug: "bread-and-butter-loco-elongated",
        why: "SW 118.20 on the Loco Elongated is elite driving territory. This is the paddle for players who want to impose pace on every rally from the back of the court. At $199 with 10% off, the B&B name carries serious competitive credibility.",
      },
    ],
  },
  {
    slug: "friday-aura-elongated",
    category: "Best for Control",
    anchor: "best-control",
    accent: "#818cf8",
    why: "The Friday Aura is built for players who win with placement, not pace. The 16mm core is exceptionally soft off the face — dwell time is among the best we've tested at this price — and the elongated shape gives you extra reach without sacrificing feel at the kitchen. Resets, dinks, and third-shot drops all feel locked in. At $129 with $10 off, it's one of the most honest value plays in the control category.",
    runnerUps: [
      {
        slug: "mint-mon-ami-elongated",
        why: "The Mon Ami's 18mm core delivers a SW of 123.47 — but the extra-thick foam absorbs pace so effectively that it's a true control weapon. Resets feel effortless, and the elongated shape gives you reach at the NVZ. A unique paddle for touch-first players.",
      },
      {
        slug: "gruvn-muvn-16-hd-full-foam-hybrid",
        why: "The Muvn 16hd Full Foam Hybrid is the kitchen specialist. Quick, maneuverable, and soft off the face — the full-foam construction rewards players who build points through consistency and placement rather than power.",
      },
    ],
  },
  {
    slug: "gruvn-lazr-16hd-hybrid",
    category: "Best All-Court",
    anchor: "best-all-court",
    accent: "#14b8a6",
    why: "The Lazr-16hd Full Foam earns the all-court pick because it genuinely doesn't ask you to compromise. The full-foam 16mm core keeps touch and kitchen feel dialed in while still generating real pop off the baseline. The hybrid shape sits between elongated and widebody — a bigger sweet spot without losing reach. At SW 107 it maneuvers quickly enough for fast hands at the net, and the 10% discount makes it easy to justify.",
    runnerUps: [
      {
        slug: "honolulu-j2cr-crystal-blue-hybrid",
        why: "The J2CR Crystal Blue Endurance Surface Hybrid combines SW 109.61, TW 6.57, and a long-lasting face texture into one of the most well-rounded all-court paddles available. Three shape options in the series means every player can find their fit.",
      },
      {
        slug: "6-0-coral-hybrid",
        why: "The SixZero Coral Hybrid at SW 110.59 with TW 6.62 delivers balanced performance at $200. Nothing extreme, nothing lacking — just honest all-court play with good stability and a comfortable feel.",
      },
    ],
  },
  {
    slug: "enhance-turbo-mpp-elongated",
    category: "Best Value",
    anchor: "best-value",
    accent: "#4ade80",
    why: "The Enhance Turbo MPP delivers a SW of 116.06 at $119.99 — and with code PLAYBOOK, you're paying under $100 for a power elongated that competes with paddles at twice the price. That spec-to-dollar ratio is hard to beat anywhere in pickleball right now. If you want real power without the real price tag, this is it.",
    runnerUps: [
      {
        slug: "ronbus-quanta-r3-elongated",
        why: "The Quanta R3 at SW 115.40 for $119.99 ($99.99 with PLAYBOOK) is a spec anomaly — elongated power paddle performance at a budget price. Ronbus consistently over-delivers on value.",
      },
      {
        slug: "beyond-measure-ronin-hybrid",
        why: "The Ronin Hybrid at SW 115.65 for $117 ($105 with PLAYBOOK) delivers all-court specs that match paddles at $200+. Great stability with TW 6.36 and a balanced feel that works everywhere on the court.",
      },
    ],
  },
  {
    slug: "selkirk-boomstik-elongated",
    category: "Best for Beginners",
    anchor: "best-beginners",
    accent: "#c084fc",
    why: "The Selkirk Boomstik might seem like an unusual beginner pick at SW 120.09, but that's exactly the point — beginners who start with a paddle that generates natural power don't have to over-swing to keep up. The TW of 6.84 is among the highest for any elongated, meaning off-center hits are far more forgiving. Add Selkirk's premium build quality and you have a paddle that grows with the player.",
    runnerUps: [
      {
        slug: "nox-jc6-elongated",
        why: "The Nox JC6 at SW 114.68 with X-Foam technology provides a soft, forgiving feel that's great for developing touch. European build quality and a well-balanced all-court design make it an excellent paddle to learn on.",
      },
      {
        slug: "flik-f3-triple-core-elongated",
        why: "The Flik F3 Triple Core's unique three-layer construction gives it a versatile feel — soft enough for learning touch shots, responsive enough for developing a drive game. At $190 with 10% off, it's a smart first serious paddle.",
      },
    ],
  },
];

// ── FAQ ────────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "What is the best pickleball paddle for beginners?",
    a: "For beginners, look for a paddle with a forgiving sweet spot and solid build quality. Our top beginner pick is the Selkirk Boomstik — the high TW of 6.84 forgives off-center hits, the SW of 120.09 generates natural power without over-swinging, and Selkirk's build quality ensures it lasts. The Nox JC6 and Flik F3 Triple Core are also excellent starter paddles.",
  },
  {
    q: "Should I get a 13mm or 16mm paddle?",
    a: "16mm paddles are softer and more forgiving, with better control and touch — great for kitchen play and resets. 13mm paddles have a livelier feel with more power and pop off drives. Most players should start with 16mm. Once you have consistent mechanics, a 13mm is worth exploring for added pop.",
  },
  {
    q: "What's the difference between a power and control paddle?",
    a: "Power paddles have higher swing weights and an aggressive surface texture, generating more pace and spin on drives. Control paddles are softer with more dwell time — easier to reset, dink, and place the ball precisely. All-court paddles sit in the middle and work well for most recreational and intermediate players.",
  },
  {
    q: "How much should I spend on a pickleball paddle?",
    a: "Good paddles start around $100 and top out near $300. The sweet spot for performance-to-dollar ratio is $130–$200. That said, our best value pick — the Enhance Turbo MPP — comes in under $100 after discount with a SW of 116.06 that competes with paddles at twice the price. Don't overspend until you know what specs you prefer.",
  },
  {
    q: "What is swing weight and why does it matter?",
    a: "Swing weight measures how heavy a paddle feels when you swing it — not just its static weight. A higher swing weight generates more power but is slower to move. A lower swing weight is easier to control and maneuver at the kitchen. We measure every paddle with standardized lab equipment before writing a single word of review.",
  },
  {
    q: "Are these reviews sponsored?",
    a: "No. Every paddle in our database was purchased or obtained independently. No brand pays to be featured or ranked higher. Austin tests each paddle on a real court, measures the specs himself, and writes honest assessments — including what a paddle doesn't do well.",
  },
];

// ── JSON-LD schemas ────────────────────────────────────────────────────────────
const listSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Best Pickleball Paddles of 2026",
  "description": "The best pickleball paddles of 2026 tested and ranked by category by Austin Hardy at Pickleball Playbook.",
  "url": `${siteConfig.siteUrl}/best-pickleball-paddles`,
  "numberOfItems": PICKS.length,
  "itemListElement": PICKS.map((p, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "name": p.category,
    "url": `${siteConfig.siteUrl}/paddles/${p.slug}`,
  })),
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQ.map(({ q, a }) => ({
    "@type": "Question",
    "name": q,
    "acceptedAnswer": { "@type": "Answer", "text": a },
  })),
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BestPaddlesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl py-16">

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#14b8a6" }}>
              Editor&apos;s Picks · Updated May 2026
            </p>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
              style={{ color: "var(--text-primary)" }}
            >
              Best Pickleball Paddles of 2026
            </h1>
            <p className="text-lg leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
              We&apos;ve tested over 100 paddles on a real court — measuring swing weight, twist weight, and static
              weight before hitting a single ball. Here are the best picks by category, ranked by a pro player with
              12+ years of coaching experience. Every review is unsponsored.
            </p>
            {/* Trust signals */}
            <div className="flex flex-wrap gap-4">
              {[`${getPaddleCountLabel()} Paddles Tested`, "Unsponsored Reviews", "Lab-Measured Specs", "Updated May 2026"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#14b8a6" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Featured video ─────────────────────────────────────────── */}
          <div className="mb-16 max-w-3xl">
            <YouTubeEmbed videoId="kOONExGr-s0" title="Best Pickleball Paddle of 2026" />
          </div>

          {/* ── Jump links ────────────────────────────────────────────────── */}
          <div
            className="flex flex-wrap gap-2 mb-16 pb-12"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            {PICKS.map((p) => (
              <a
                key={p.anchor}
                href={`#${p.anchor}`}
                className="text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${p.accent}44`,
                  color: p.accent,
                }}
              >
                {p.category}
              </a>
            ))}
          </div>

          {/* ── Picks ─────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-16">
            {PICKS.map((pick) => {
              const paddle = getPaddleBySlug(pick.slug);
              if (!paddle) return null;
              const priceNum = paddle.price ? parseFloat(paddle.price.replace(/[^0-9.]/g, "")) : null;
              const seriesPaddles = pick.seriesSlugs
                ? pick.seriesSlugs.map(getPaddleBySlug).filter(Boolean)
                : null;

              const runnerUpPaddles = (pick.runnerUps ?? [])
                .map((ru) => ({ ...ru, paddle: getPaddleBySlug(ru.slug) }))
                .filter((ru) => !!ru.paddle);

              return (
                <div key={pick.anchor} id={pick.anchor} className="scroll-mt-40">
                  {/* Section label */}
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                      style={{ background: `${pick.accent}20`, color: pick.accent, border: `1px solid ${pick.accent}50` }}
                    >
                      {pick.category}
                    </span>
                    <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
                  </div>

                  {/* Main pick card */}
                  <div
                    className="rounded-3xl overflow-hidden"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image — series layout or single */}
                      <div
                        className="md:w-[38%] flex-shrink-0 flex items-center justify-center p-10"
                        style={{ background: "var(--bg-alt)", minHeight: "280px" }}
                      >
                        {seriesPaddles && seriesPaddles.length > 1 ? (
                          <div className="flex items-end gap-[-10px]" style={{ perspective: "800px" }}>
                            {seriesPaddles.map((sp, si) => {
                              if (!sp) return null;
                              const translateY = si === 1 ? -12 : 0;
                              const rotate = si === 0 ? 5 : si === 2 ? -5 : 0;
                              return (
                                <Link
                                  key={sp.slug}
                                  href={`/paddles/${sp.slug}`}
                                  className="relative group transition-transform duration-300 hover:scale-105 hover:z-10"
                                  style={{
                                    transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
                                    marginLeft: si > 0 ? "-16px" : "0",
                                    zIndex: si === 1 ? 3 : 1,
                                  }}
                                >
                                  <div className="flex flex-col items-center" style={{ width: "110px" }}>
                                    {sp.image && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={sp.image}
                                        alt={`${sp.brand} ${sp.name}`}
                                        className="w-full h-auto object-contain"
                                        style={{ maxHeight: "180px", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))" }}
                                      />
                                    )}
                                    <p className="text-[10px] font-bold text-center mt-1.5 truncate w-full" style={{ color: "rgba(255,255,255,0.6)" }}>
                                      {sp.shape}
                                    </p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={paddle.image ?? ""}
                            alt={`${paddle.brand} ${paddle.name}`}
                            className="w-full h-full object-contain"
                            style={{ maxHeight: "220px", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                        <p
                          className="text-[11px] font-bold uppercase tracking-[0.22em] mb-1"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          {paddle.brand}
                        </p>
                        <h2
                          className="text-2xl font-extrabold mb-1"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {seriesPaddles ? "Crystal Blue Endurance Surface" : paddle.name}
                        </h2>
                        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.38)" }}>
                          {seriesPaddles
                            ? `${seriesPaddles.map((sp) => sp!.shape).join(", ")} · ${paddle.thickness}`
                            : `${paddle.shape} · ${paddle.thickness}`}
                          {priceNum ? ` · $${priceNum.toFixed(2)}` : ""}
                          {paddle.amountOff && paddle.amountOff !== "$0" ? ` (${paddle.amountOff} off)` : ""}
                        </p>
                        <p
                          className="text-base leading-relaxed mb-7"
                          style={{ color: "var(--text-muted)", maxWidth: "52ch" }}
                        >
                          {pick.why}
                        </p>

                        {/* Spec pills */}
                        <div className="flex flex-wrap gap-2 mb-7">
                          {[
                            paddle.swingWeight ? `SW ${paddle.swingWeight}` : null,
                            paddle.twistWeight ? `TW ${paddle.twistWeight}` : null,
                            paddle.weight,
                          ].filter(Boolean).map((s) => (
                            <span
                              key={s}
                              className="text-xs font-bold px-3 py-1.5 rounded-full font-mono"
                              style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.55)",
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Link
                            href={seriesPaddles ? `/series/${paddle.seriesSlug ?? pick.slug}` : `/paddles/${pick.slug}`}
                            className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all duration-200 hover:scale-[1.02]"
                            style={{
                              background: "linear-gradient(135deg, #0d9488, #14b8a6)",
                              boxShadow: "0 0 24px rgba(20,184,166,0.3)",
                            }}
                          >
                            {seriesPaddles ? "View Series" : "Full Review"}
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                          {paddle.discountLink && (
                            <a
                              href={paddle.discountLink}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                              style={{
                                border: "1.5px solid rgba(45,212,191,0.4)",
                                color: "#2dd4bf",
                              }}
                            >
                              Get Discount
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Runner-ups */}
                  {runnerUpPaddles.length > 0 && (
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {runnerUpPaddles.map(({ slug: ruSlug, why: ruWhy, paddle: ruPaddle }, i) => {
                        if (!ruPaddle) return null;
                        const ruPrice = ruPaddle.price ? parseFloat(ruPaddle.price.replace(/[^0-9.]/g, "")) : null;
                        return (
                          <div
                            key={ruSlug}
                            className="rounded-2xl p-6 flex gap-5"
                            style={{
                              background: "var(--bg-card)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            {/* Thumbnail */}
                            <div
                              className="w-20 h-20 flex-shrink-0 rounded-xl flex items-center justify-center"
                              style={{ background: "var(--bg-alt)" }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={ruPaddle.image ?? ""}
                                alt={`${ruPaddle.brand} ${ruPaddle.name}`}
                                className="w-full h-full object-contain p-1.5"
                                style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-[10px] font-bold uppercase tracking-widest"
                                  style={{ color: pick.accent }}
                                >
                                  Runner-Up {i + 1}
                                </span>
                              </div>
                              <p className="text-sm font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
                                {ruPaddle.brand} {ruPaddle.name}
                              </p>
                              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                                {ruPaddle.shape} · {ruPaddle.thickness}
                                {ruPrice ? ` · $${ruPrice.toFixed(2)}` : ""}
                                {ruPaddle.amountOff && ruPaddle.amountOff !== "$0" ? ` (${ruPaddle.amountOff} off)` : ""}
                              </p>
                              <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>
                                {ruWhy}
                              </p>
                              <Link
                                href={`/paddles/${ruSlug}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                                style={{ color: "#14b8a6" }}
                              >
                                View Paddle <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── FAQ ───────────────────────────────────────────────────────── */}
          <div className="mt-24 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#14b8a6" }}>
              Common Questions
            </p>
            <h2
              className="text-3xl md:text-4xl font-extrabold tracking-tight mb-10"
              style={{ color: "var(--text-primary)" }}
            >
              Pickleball Paddle FAQ
            </h2>
            <div className="flex flex-col gap-4">
              {FAQ.map(({ q, a }) => (
                <div
                  key={q}
                  className="p-6 rounded-2xl"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <h3 className="font-bold text-base mb-2" style={{ color: "var(--text-primary)" }}>
                    {q}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA ───────────────────────────────────────────────────────── */}
          <div className="mt-20 flex flex-col items-center text-center gap-5">
            <p className="text-base" style={{ color: "var(--text-muted)" }}>
              Want to explore all {getPaddleCountLabel()} paddles in our database?
            </p>
            <Link
              href="/paddles"
              className="inline-flex items-center gap-2 font-bold text-base px-10 py-4 rounded-2xl text-white transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                boxShadow: "0 0 40px rgba(20,184,166,0.4)",
              }}
            >
              Browse All Paddles
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
