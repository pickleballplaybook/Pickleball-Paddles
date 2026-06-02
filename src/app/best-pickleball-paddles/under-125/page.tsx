import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, CheckCircle2, Wallet } from "lucide-react";
import { paddles, getPaddleBySlug } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import { getPaddlesUnder } from "@/lib/price";
import type { Paddle } from "@/types";
import PaddleBudgetGrid from "@/components/PaddleBudgetGrid";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import InlineNewsletterCTA from "@/components/InlineNewsletterCTA";
import { currentYear } from "@/lib/year";

const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/under-125`;
const ACCENT = "#4ade80";
const MAX_PRICE = 125;

// ── Discount code helper ──────────────────────────────────────────────────────
function getCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

// ── Editorial top 5 ───────────────────────────────────────────────────────────
interface Pick {
  slug: string;
  seriesSlugs?: string[];
  seriesName?: string; // explicit display name for the series heading
  label: string;       // short superlative shown on the rank chip
  why: string;
}

const PICKS: Pick[] = [
  {
    slug: "enhance-turbo-mpp-elongated",
    seriesSlugs: ["enhance-turbo-mpp-elongated", "enhance-turbo-mpp-hybrid"],
    seriesName: "Enhance Turbo MPP",
    label: "Best Overall",
    why: "MPP stands for Max Power Polymer, and the Turbo MPP delivers exactly that — but it earns the #1 spot because the rest of the spec sheet keeps up. A floating foam core and SW 116.06 (Elongated) put real heat on drives and serves, while the Hybrid (SW 114.24, TW 6.48) trades a little power for added stability. At $119.99 with $20 off using PLAYBOOK — under $100 — it's the most paddle-for-the-money in this bracket.",
  },
  {
    slug: "beyond-measure-ronin-hybrid",
    seriesSlugs: ["beyond-measure-ronin-hybrid", "beyond-measure-ronin-elongated"],
    seriesName: "Beyond Measure Ronin",
    label: "Best All-Court",
    why: "The Beyond Measure Ronin pairs a genuinely high swing weight (Hybrid 115.65, Elongated 114.98) with the kind of twist weight (6.36–6.53) that keeps off-center hits stable — numbers you'd normally pay $200+ for. The thermoformed 16mm build feels premium in hand, with enough pop to drive and enough touch to reset. At $117 with 10% off using code PLAYBOOK (about $105), nothing all-court in this bracket matches its spec sheet.",
  },
  {
    slug: "luzz-cannon-elongated",
    label: "Best for Power",
    why: "The Luzz Cannon lives up to its name with a SW of 119.19 — among the highest in our entire database — at the lowest price of any pick here. If you want to overpower opponents from the baseline and don't mind a heavier swing, nothing else under $125 hits this hard. At $109 with 15% off using PLAYBOOK (about $93), it's the budget power play.",
  },
  {
    slug: "friday-aura-elongated",
    seriesSlugs: ["friday-aura-elongated", "friday-aura-hybrid"],
    seriesName: "Friday Aura",
    label: "Best Control",
    why: "If you win points with placement instead of pace, the Friday Aura is the budget touch king. The soft 16mm core has some of the best dwell time we've measured under $125 — resets, dinks, and third-shot drops feel locked in. The Elongated (SW 114.73) gives you reach at the kitchen; the Hybrid (SW 108.60) is quicker in the hands for fast exchanges. At $129 with $10 off using PLAYBOOK (about $119), it's a control paddle that punches well above its price.",
  },
  {
    slug: "ronbus-quanta-r3-elongated",
    seriesSlugs: ["ronbus-quanta-r3-elongated", "ronbus-quanta-r4-hybrid"],
    seriesName: "Ronbus Quanta",
    label: "Best Under $100",
    why: "Ronbus built its reputation on absurd value, and the Quanta proves it. The R3 Elongated (SW 115.40) brings real driving power, while the R4 Hybrid (SW 105.00) is maneuverable and forgiving for all-court play — both on a clean 16mm thermoformed build. At $119.99 with $20 off using PLAYBOOK, you're getting genuine sub-$100 performance that competes with paddles at twice the price.",
  },
];

// ── FAQ ────────────────────────────────────────────────────────────────────────
// Snippet-optimized: direct answer in sentence 1, reason in sentence 2,
// optional alternative in sentence 3. Target 40–80 words per answer.
const FAQ = [
  {
    q: "What is the best pickleball paddle under $125?",
    a: "The best pickleball paddle under $125 is the Enhance Turbo MPP — about $99.99 with code PLAYBOOK, with a floating foam core, SW 116.06 in the elongated shape, and tour-level specs for under $100. For all-court versatility the Beyond Measure Ronin leads the spec sheet at this price; for control the Friday Aura is the budget touch king; for pure power the Luzz Cannon delivers the highest swing weight in the bracket.",
  },
  {
    q: "Are cheap pickleball paddles any good?",
    a: "Yes — the gap between budget and premium pickleball paddles has narrowed dramatically since 2024. Brands like Ronbus, Enhance, Beyond Measure, and Friday now sell thermoformed and foam-core paddles with swing weights and twist weights that rival $200+ models. With code PLAYBOOK, several picks on this page land under $100 with no meaningful compromise.",
  },
  {
    q: "Can you get a good pickleball paddle under $100?",
    a: "Yes — the Ronbus Quanta and Enhance Turbo MPP both drop to $99.99 with code PLAYBOOK, and the Luzz Cannon is around $93. All three are full thermoformed or foam-core builds with competition-level specs. Build quality starts dropping rapidly below $80, so $90–$100 is the realistic floor for a serious paddle.",
  },
  {
    q: "What should I look for in a budget pickleball paddle?",
    a: "Look for three specs first: swing weight (110–118 is the easy-to-handle sweet spot), twist weight (6.0+ for forgiveness on mishits), and core thickness (16mm for control, 14mm for pop). Then pick a shape — widebody for the biggest sweet spot, elongated for reach and power, hybrid for the middle ground.",
  },
  {
    q: "How much should you spend on a pickleball paddle?",
    a: "Spend $100–$150 for the best performance-per-dollar in pickleball. Most recreational and intermediate players will never out-grow a well-specced ~$120 paddle. Spend more only once you know which specs you prefer — and several paddles on this page hold up against $250 flagships in measured testing.",
  },
  {
    q: "Do the listed prices include the PLAYBOOK discount?",
    a: "Yes. The lower (green) price is what you pay after applying code PLAYBOOK at checkout on the brand's official site. The crossed-out price is retail. Every paddle on this page is unsponsored — no brand pays to be featured or ranked higher on Pickleball Playbook.",
  },
];

// ── Metadata ─────────────────────────────────────────────────────────────────
const topPick = getPaddleBySlug(PICKS[0].slug);

export const metadata: Metadata = {
  title: `Best Pickleball Paddles Under $125 (${currentYear()}) — Tested & Ranked`,
  description:
    "The best pickleball paddles under $125 in 2026, tested on court with lab-measured swing weight and twist weight. Top 5 budget picks plus every sub-$125 paddle, filterable by brand, shape, and play style. Unsponsored.",
  keywords: [
    "best pickleball paddles under $125",
    "best budget pickleball paddles",
    "cheap pickleball paddles",
    "best pickleball paddle under 100",
    "affordable pickleball paddles 2026",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles Under $125 (${currentYear()}) — Tested & Ranked`,
    description:
      "Top 5 budget pickleball paddles plus every sub-$125 paddle on the site, ranked by a pro player with lab-measured specs. Unsponsored.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(topPick?.image ? { images: [{ url: `${siteConfig.siteUrl}${topPick.image}`, alt: "Best pickleball paddles under $125" }] } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Pickleball Paddles Under $125 (2026)",
    description: "Top 5 budget picks plus every sub-$125 paddle, ranked with lab-measured specs.",
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BestPaddlesUnder125Page() {
  const under125 = getPaddlesUnder(MAX_PRICE, paddles);
  const count = under125.length;
  const brandCount = new Set(under125.map((p) => p.brand)).size;

  // ── JSON-LD ──────────────────────────────────────────────────────────────
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteConfig.siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Best Pickleball Paddles", "item": `${siteConfig.siteUrl}/best-pickleball-paddles` },
      { "@type": "ListItem", "position": 3, "name": "Under $125", "item": PAGE_URL },
    ],
  };

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Best Pickleball Paddles Under $125 (2026)",
    "description": "The top 5 pickleball paddles under $125, tested and ranked by Pickleball Playbook.",
    "url": PAGE_URL,
    "numberOfItems": PICKS.length,
    "itemListElement": PICKS.map((pick, i) => {
      const p = getPaddleBySlug(pick.slug);
      return {
        "@type": "ListItem",
        "position": i + 1,
        "name": p ? `${p.brand} ${p.name}` : pick.slug,
        "url": `${siteConfig.siteUrl}/paddles/${pick.slug}`,
        ...(p?.image ? { "image": `${siteConfig.siteUrl}${p.image}` } : {}),
      };
    }),
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl py-16">

          {/* Breadcrumbs */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <li><Link href="/" className="transition-colors hover:text-brand-400" style={{ color: "var(--text-muted)" }}>Home</Link></li>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <li><Link href="/best-pickleball-paddles" className="transition-colors hover:text-brand-400" style={{ color: "var(--text-muted)" }}>Best Paddles</Link></li>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <li style={{ color: "var(--text-primary)" }}>Under $125</li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>
              Budget Picks &middot; Updated May 2026
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5" style={{ color: "var(--text-primary)" }}>
              Best Pickleball Paddles Under $125
            </h1>
            <p className="text-lg leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
              The best paddles don&apos;t have to cost $250. We tested every paddle in our database — measuring swing
              weight, twist weight, and static weight in the lab before hitting a single ball — and pulled out the ones
              that deliver real performance for under $125. Below are our top 5 budget picks, then every sub-$125 paddle
              on the site, filterable by brand, shape, and play style. Every review is unsponsored.
            </p>
            <div className="flex flex-wrap gap-4">
              {[`${count} Paddles Under $125`, `${brandCount} Brands`, "Lab-Measured Specs", "Unsponsored Reviews"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Featured video ───────────────────────────────────────────── */}
          <div className="mb-16 max-w-3xl">
            <YouTubeEmbed videoId="CkrJVwTKk94" title="Best Pickleball Paddles Under $125 — Video Review" />
          </div>

          {/* ── Top 5 picks ─────────────────────────────────────────────── */}
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-8" style={{ color: "var(--text-primary)" }}>
            Top 5 Pickleball Paddles Under $125
          </h2>
          <div className="flex flex-col gap-10 mb-20">
            {PICKS.map((pick, i) => {
              const paddle = getPaddleBySlug(pick.slug);
              if (!paddle) return null;
              const seriesPaddles = pick.seriesSlugs
                ? (pick.seriesSlugs.map(getPaddleBySlug).filter(Boolean) as Paddle[])
                : null;
              const priceNum = paddle.price ? parseFloat(paddle.price.replace(/[^0-9.]/g, "")) : null;
              const code = getCode(paddle.brand, paddle.discountLink);
              const noDiscount = !paddle.amountOff || paddle.amountOff === "$0";
              const isSeries = !!(seriesPaddles && seriesPaddles.length > 1);

              return (
                <div key={pick.slug}>
                  {/* Rank label */}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}50` }}>
                      #{i + 1} · {pick.label}
                    </span>
                    <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
                  </div>

                  {/* Card */}
                  <div className="rounded-3xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: i === 0 ? "0 16px 48px rgba(0,0,0,0.3)" : undefined }}>
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="md:w-[38%] flex-shrink-0 flex items-center justify-center p-10" style={{ background: "var(--bg-alt)", minHeight: "260px" }}>
                        {isSeries ? (
                          <div className="flex items-end" style={{ perspective: "800px" }}>
                            {seriesPaddles!.map((sp, si) => {
                              const translateY = si === 1 ? -12 : 0;
                              const rotate = si === 0 ? 5 : si === seriesPaddles!.length - 1 ? -5 : 0;
                              return (
                                <Link key={sp.slug} href={`/paddles/${sp.slug}`} className="relative transition-transform duration-300 hover:scale-105 hover:z-10" style={{ transform: `translateY(${translateY}px) rotate(${rotate}deg)`, marginLeft: si > 0 ? "-16px" : "0", zIndex: si === 1 ? 3 : 1 }}>
                                  <div className="flex flex-col items-center" style={{ width: "100px" }}>
                                    {sp.image && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={sp.image} alt={`${sp.brand} ${sp.name} ${sp.shape} pickleball paddle under $125`} className="w-full h-auto object-contain" style={{ maxHeight: "160px", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))" }} />
                                    )}
                                    <p className="text-[10px] font-bold text-center mt-1 truncate w-full" style={{ color: "rgba(255,255,255,0.6)" }}>{sp.shape}</p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={paddle.image ?? ""} alt={`${paddle.brand} ${paddle.name} ${paddle.shape} ${paddle.thickness} pickleball paddle under $125`} className="w-full h-full object-contain" style={{ maxHeight: "200px", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{paddle.brand}</p>
                        <h3 className="text-2xl font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
                          {isSeries ? `${pick.seriesName ?? `${paddle.brand} ${paddle.name}`} Series` : `${paddle.brand} ${paddle.name}`}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.38)" }}>
                          {isSeries ? `${seriesPaddles!.map((sp) => sp.shape).join(", ")} · ${paddle.thickness}` : `${paddle.shape} · ${paddle.thickness}`}
                          {priceNum ? ` · $${priceNum.toFixed(2)}` : ""}
                          {!noDiscount ? ` (${paddle.amountOff} off)` : ""}
                        </p>
                        <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-muted)", maxWidth: "56ch" }}>{pick.why}</p>

                        {/* Spec pills */}
                        <div className="flex flex-wrap gap-2 mb-6">
                          {[paddle.swingWeight ? `SW ${paddle.swingWeight}` : null, paddle.twistWeight ? `TW ${paddle.twistWeight}` : null, paddle.weight || null].filter(Boolean).map((s) => (
                            <span key={s as string} className="text-xs font-bold px-3 py-1.5 rounded-full font-mono" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}>{s}</span>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Link href={isSeries && paddle.seriesSlug ? `/series/${paddle.seriesSlug}` : `/paddles/${pick.slug}`} className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all duration-200 hover:scale-[1.02]" style={{ background: ACCENT, color: "#06281a" }}>
                            {isSeries ? "View Paddles" : "Full Review"}
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                          {paddle.discountLink && (
                            <a href={paddle.discountLink} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02]" style={{ border: `1.5px solid ${ACCENT}66`, color: ACCENT }}>
                              {noDiscount ? "Buy Now" : `Get Discount · ${code}`}
                              <ExternalLink className="w-3.5 h-3.5" />
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

          {/* ── All under $125 (filterable) ─────────────────────────────── */}
          <div className="flex items-center gap-3 mb-3">
            <Wallet className="w-6 h-6" style={{ color: ACCENT }} />
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Every Pickleball Paddle Under $125
            </h2>
          </div>
          <p className="text-base leading-relaxed mb-8 max-w-3xl" style={{ color: "var(--text-muted)" }}>
            All {count} paddles on the site that come in under $125 after the PLAYBOOK discount. Filter by brand, shape,
            or play style, and sort by price or swing weight to find the right budget paddle for your game.
          </p>
          <PaddleBudgetGrid paddles={under125} maxPrice={MAX_PRICE} />

          {/* ── Newsletter CTA — peak-intent placement between grid and guide */}
          <InlineNewsletterCTA
            headline="Want budget picks like these in your inbox?"
            subline="Get exclusive sub-$125 discount codes + new value paddles before they hit the site."
          />

          {/* ── Buying guide ────────────────────────────────────────────── */}
          <div className="mt-24 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
              How to Choose a Pickleball Paddle Under $125
            </h2>
            <div className="flex flex-col gap-4 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
              <p>
                Budget paddles have come a long way. A few years ago, spending under $125 meant compromising on materials
                and performance. Today, brands like Ronbus, Enhance, Beyond Measure, and Friday build thermoformed and
                foam-core paddles with swing weights and twist weights that rival models costing twice as much.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Swing weight</strong> is the single most important spec:
                higher numbers (115+) generate more power but feel heavier to swing, while lower numbers move faster at
                the net. <strong style={{ color: "var(--text-primary)" }}>Twist weight</strong> measures forgiveness — a
                higher value means off-center hits stay on target. <strong style={{ color: "var(--text-primary)" }}>Core
                thickness</strong> rounds it out: 16mm cores lean toward control and a soft feel, while 14mm cores add pop.
              </p>
              <p>
                Match the shape to your game: <Link href="/best-pickleball-paddles/power" className="font-semibold" style={{ color: "#2dd4bf" }}>elongated paddles</Link> give
                you reach and power, hybrids balance maneuverability and stability, and widebodies offer the largest sweet
                spot. Not sure where to start? Compare specs side by side with our <Link href="/compare" className="font-semibold" style={{ color: "#2dd4bf" }}>paddle comparison tool</Link>,
                browse the full <Link href="/paddles" className="font-semibold" style={{ color: "#2dd4bf" }}>paddle database</Link>, or see our
                overall <Link href="/best-pickleball-paddles" className="font-semibold" style={{ color: "#2dd4bf" }}>best pickleball paddles</Link> picks across every price range. Got a bit more to spend? See the <Link href="/best-pickleball-paddles/under-200" className="font-semibold" style={{ color: "#60a5fa" }}>best pickleball paddles under $200</Link>.
              </p>
            </div>
          </div>

          {/* ── FAQ ─────────────────────────────────────────────────────── */}
          <div className="mt-20 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>Common Questions</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-10" style={{ color: "var(--text-primary)" }}>
              Budget Paddle FAQ
            </h2>
            <div className="flex flex-col gap-4">
              {FAQ.map(({ q, a }) => (
                <div key={q} className="p-6 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 className="font-bold text-base mb-2" style={{ color: "var(--text-primary)" }}>{q}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA ─────────────────────────────────────────────────────── */}
          <div className="mt-20 flex flex-col items-center text-center gap-5">
            <p className="text-base" style={{ color: "var(--text-muted)" }}>Looking for picks at every price point?</p>
            <Link href="/best-pickleball-paddles" className="inline-flex items-center gap-2 font-bold text-base px-10 py-4 rounded-2xl text-white transition-all duration-200 hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)", boxShadow: "0 0 40px rgba(20,184,166,0.4)" }}>
              See All Best Pickleball Paddles <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
