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
const PICKS = [
  {
    slug: "11six24-vapor-power-2-hybrid",
    category: "Best Overall",
    accent: "#f59e0b",
    why: "The Vapor Power 2 checks every box — explosive power off the baseline, a HexGrit surface that holds its spin RPMs over hundreds of games, and spec consistency that makes it easy to fit into any play style. If we had to put one paddle in every player's hands right now, this would be near the top of the list.",
  },
  {
    slug: "bread-and-butter-loco-elongated",
    category: "Best for Power Players",
    accent: "#ef4444",
    why: "One of the highest swing-weight paddles we've tested. The Loco Elongated generates serious pace with minimal effort — the extended shape stretches your reach at the baseline and the live 16mm core keeps pop high without going dead. This is the paddle for players who want to dictate every rally from the back of the court.",
  },
  {
    slug: "friday-aura-elongated",
    category: "Best for Control",
    accent: "#818cf8",
    why: "The Friday Aura is built for players who win with placement, not pace. The 16mm core is exceptionally soft off the face — dwell time is among the best we've tested at this price — and the elongated shape gives you extra reach without sacrificing feel at the kitchen. Resets, dinks, and third-shot drops all feel locked in. At $129 with $10 off, it's one of the most honest value plays in the control category.",
  },
  {
    slug: "gruvn-lazr-16hd-hybrid",
    category: "Best All-Court",
    accent: "#14b8a6",
    why: "The Lazr-16hd earns the all-court pick because it genuinely doesn't ask you to compromise. The full-foam 16mm core keeps touch and kitchen feel dialed in while still generating real pop off the baseline. The hybrid shape sits between elongated and widebody — a bigger sweet spot without losing reach. At swing weight 107 it maneuvers quickly enough for fast hands at the net, and the 10% discount makes it easy to justify.",
  },
  {
    slug: "enhance-banger-elongated",
    category: "Best Value",
    accent: "#4ade80",
    why: "Under $80 after discount, the Banger punches well above its price tag. Solid construction, real pop, and a performance ceiling that competes with paddles in the $150 range. If you're not sure how much to spend, start here — you won't be disappointed.",
  },
  {
    slug: "bread-and-butter-fat-boy-widebody",
    category: "Best for Beginners",
    accent: "#c084fc",
    why: "The widebody shape gives you the largest sweet spot of any paddle in this list — ideal for players still building consistent form. The lower swing weight (109.52) makes it fast and easy to maneuver, and the 16mm core forgives mishits far better than thinner alternatives.",
  },
];

// ── FAQ ────────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "What is the best pickleball paddle for beginners?",
    a: "For beginners, look for a widebody shape (larger sweet spot), a 16mm core (more forgiving on mishits), and a lower swing weight (easier to maneuver). Our top beginner pick is the Bread & Butter Fat Boy Widebody — big sweet spot, great feel, and a core that rewards players who are still developing consistency.",
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
    a: "Good paddles start around $80 and top out near $300. The sweet spot for performance-to-dollar ratio is $130–$200. That said, our best value pick — the Enhance Banger — comes in under $80 after discount and plays like a $150 paddle. Don't overspend until you know what specs you prefer.",
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
  const picks = PICKS.map((pick) => ({
    ...pick,
    paddle: getPaddleBySlug(pick.slug),
  })).filter((p) => !!p.paddle);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl py-16">

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#14b8a6" }}>
              Editor&apos;s Picks · Updated April 2026
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
              {[`${getPaddleCountLabel()} Paddles Tested`, "Unsponsored Reviews", "Lab-Measured Specs", "Updated April 2026"].map((t) => (
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
                key={p.slug}
                href={`#${p.slug}`}
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
            {picks.map(({ paddle, category, accent, why, slug }) => {
              if (!paddle) return null;
              const priceNum = paddle.price ? parseFloat(paddle.price.replace(/[^0-9.]/g, "")) : null;
              return (
                <div key={slug} id={slug} className="scroll-mt-40">
                  {/* Section label */}
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                      style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}50` }}
                    >
                      {category}
                    </span>
                    <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
                  </div>

                  {/* Card */}
                  <div
                    className="rounded-3xl overflow-hidden"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div
                        className="md:w-[38%] flex-shrink-0 flex items-center justify-center p-10"
                        style={{ background: "var(--bg-alt)", minHeight: "280px" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={paddle.image ?? ""}
                          alt={`${paddle.brand} ${paddle.name}`}
                          className="w-full h-full object-contain"
                          style={{ maxHeight: "220px", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }}
                        />
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
                          {paddle.name}
                        </h2>
                        <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.38)" }}>
                          {paddle.shape} · {paddle.thickness}
                          {priceNum ? ` · $${priceNum.toFixed(2)}` : ""}
                          {paddle.amountOff && paddle.amountOff !== "$0" ? ` (${paddle.amountOff} off)` : ""}
                        </p>
                        <p
                          className="text-base leading-relaxed mb-7"
                          style={{ color: "var(--text-muted)", maxWidth: "52ch" }}
                        >
                          {why}
                        </p>

                        {/* Spec pills */}
                        <div className="flex flex-wrap gap-2 mb-7">
                          {[
                            `SW ${paddle.swingWeight}`,
                            `TW ${paddle.twistWeight}`,
                            paddle.weight,
                          ].map((s) => (
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
                            href={`/paddles/${slug}`}
                            className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all duration-200 hover:scale-[1.02]"
                            style={{
                              background: "linear-gradient(135deg, #0d9488, #14b8a6)",
                              boxShadow: "0 0 24px rgba(20,184,166,0.3)",
                            }}
                          >
                            Full Review
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
