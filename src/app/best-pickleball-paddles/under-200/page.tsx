import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, CheckCircle2, Wallet } from "lucide-react";
import { paddles, getPaddleBySlug } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import { getPaddlesUnder } from "@/lib/price";
import type { Paddle } from "@/types";
import PaddleBudgetGrid from "@/components/PaddleBudgetGrid";

const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/under-200`;
const ACCENT = "#60a5fa";
const MAX_PRICE = 200;

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
  seriesName?: string;
  label: string;
  why: string;
}

const PICKS: Pick[] = [
  {
    slug: "gruvn-lazr-16hd-hybrid",
    label: "Best Overall",
    why: "The Gruvn LAZR-16HD Full Foam is our favorite all-court paddle under $200. The full-foam 16mm core delivers a soft, planted feel with a huge sweet spot while still generating real pop off the baseline, and the hybrid shape splits the difference between reach and hand speed beautifully. At SW 107 it stays quick at the net without feeling weak. At $169 with 10% off using code PLAYBOOK (about $152), it's genuine premium-foam performance for well under $200.",
  },
  {
    slug: "thrive-ignite-pro-series-hybrid",
    label: "Best for Spin",
    why: "The Thrive Ignite Pro Series has one of the grippiest faces in our database — its textured 15.5mm surface bites the ball for heavy topspin on drives and serves. SW 111.16 with TW 6.44 keeps it stable and forgiving for an aggressive paddle. At $219.99 with 10% off using PLAYBOOK, it sneaks just under $200 (about $198) — a spin-and-power weapon that competes with $250 flagships.",
  },
  {
    slug: "honolulu-j2cr-crystal-blue-hybrid",
    seriesSlugs: ["honolulu-j2cr-crystal-blue-hybrid", "honolulu-j6cr-crystal-blue-elongated", "honolulu-j3cr-crystal-blue-widebody"],
    seriesName: "Honolulu Crystal Blue",
    label: "Best All-Court",
    why: "The Honolulu Crystal Blue Endurance Surface series is the complete package — and it comes in three shapes so every player can find their fit: the J2CR Hybrid (SW 109.61, TW 6.57), the J6CR Elongated for reach, and the J3CR Widebody for the biggest sweet spot. The Endurance Surface face holds its spin texture far longer than most. At $195 with 10% off using PLAYBOOK (about $176), it's an easy all-court recommendation under $200.",
  },
  {
    slug: "friday-aura-pro-elongated",
    label: "Best Power Value",
    why: "The Friday Aura Pro is one of the best power-per-dollar paddles anywhere — SW 116.33 at just $169. The elongated shape gives you leverage and reach to dictate rallies, while the 16mm core keeps enough touch for kitchen transitions. At $169 with $10 off using PLAYBOOK (about $159), it's a serious offensive paddle that leaves $40+ in your pocket versus the flagships.",
  },
  {
    slug: "bread-and-butter-loco-elongated",
    seriesSlugs: ["bread-and-butter-loco-elongated", "bread-and-butter-loco-hybrid", "bread-and-butter-loco-widebody"],
    seriesName: "Bread & Butter Loco",
    label: "Best for Pure Power",
    why: "Bread & Butter brings serious competitive credibility, and the Loco delivers it across three shapes. The Elongated (SW 118.20) is elite driving territory; the Hybrid (SW 115.46, TW 6.86) is the most stable; the Widebody (SW 108.06, TW 7.29) is the most forgiving. At $199 with 10% off using PLAYBOOK (about $179), the Loco is the most power-per-dollar you can get while staying under $200.",
  },
];

// ── FAQ ────────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "What is the best pickleball paddle under $200?",
    a: "Our top pick is the Gruvn LAZR-16HD Full Foam (about $152 with code PLAYBOOK) — the best all-court feel and sweet spot at the price. For shape options go with the Honolulu Crystal Blue series, for raw power the Friday Aura Pro or Bread & Butter Loco, and for spin the Thrive Ignite Pro Series.",
  },
  {
    q: "Is a $200 pickleball paddle worth it?",
    a: "The $150–$200 range is where you get full thermoformed and foam-core builds, premium carbon faces, and pro-level specs. For most players it's the ceiling of meaningful returns — paddles above $200 rarely outperform the best in this bracket, they just cost more.",
  },
  {
    q: "What's the difference between a $125 paddle and a $200 paddle?",
    a: "Mostly materials and face durability. $200 paddles tend to use higher-grade carbon faces, foam-injected edges, and surfaces that hold their spin texture longer. If you want to spend less, our best pickleball paddles under $125 page covers the strongest budget options.",
  },
  {
    q: "Are these paddles good for intermediate and advanced players?",
    a: "Yes — every paddle on this page has competition-level specs, and several are used by 4.5–5.5+ players. Swing weight, twist weight, and face texture in this price range are right in line with what you'll find on the pro tour.",
  },
  {
    q: "How much should you spend on a pickleball paddle?",
    a: "The $130–$200 range is the sweet spot for performance-per-dollar. Most recreational and intermediate players will never out-grow a well-specced paddle in this bracket. Spend more only once you know exactly which specs you prefer.",
  },
  {
    q: "Do the listed prices include a discount?",
    a: "The lower (green) price is what you pay after applying code PLAYBOOK at checkout on each brand's site; the crossed-out price is retail. Every paddle on this page is unsponsored — no brand pays to be ranked higher.",
  },
];

// ── Metadata ─────────────────────────────────────────────────────────────────
const topPick = getPaddleBySlug(PICKS[0].slug);

export const metadata: Metadata = {
  title: "Best Pickleball Paddles Under $200 (2026) — Tested & Ranked",
  description:
    "The best pickleball paddles under $200 in 2026, tested on court with lab-measured swing weight and twist weight. Top 5 picks plus every sub-$200 paddle, filterable by brand, shape, and play style. Unsponsored.",
  keywords: [
    "best pickleball paddles under $200",
    "best pickleball paddles under 200",
    "best mid-range pickleball paddles",
    "best pickleball paddle for the money",
    "best pickleball paddles 2026",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Best Pickleball Paddles Under $200 (2026) — Tested & Ranked",
    description:
      "Top 5 pickleball paddles under $200 plus every sub-$200 paddle on the site, ranked by a pro player with lab-measured specs. Unsponsored.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(topPick?.image ? { images: [{ url: `${siteConfig.siteUrl}${topPick.image}`, alt: "Best pickleball paddles under $200" }] } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Pickleball Paddles Under $200 (2026)",
    description: "Top 5 picks plus every sub-$200 paddle, ranked with lab-measured specs.",
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BestPaddlesUnder200Page() {
  const under200 = getPaddlesUnder(MAX_PRICE, paddles);
  const count = under200.length;
  const brandCount = new Set(under200.map((p) => p.brand)).size;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteConfig.siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Best Pickleball Paddles", "item": `${siteConfig.siteUrl}/best-pickleball-paddles` },
      { "@type": "ListItem", "position": 3, "name": "Under $200", "item": PAGE_URL },
    ],
  };

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Best Pickleball Paddles Under $200 (2026)",
    "description": "The top 5 pickleball paddles under $200, tested and ranked by Pickleball Playbook.",
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
              <li style={{ color: "var(--text-primary)" }}>Under $200</li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>
              Mid-Range Picks &middot; Updated May 2026
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5" style={{ color: "var(--text-primary)" }}>
              Best Pickleball Paddles Under $200
            </h1>
            <p className="text-lg leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
              You don&apos;t have to spend $250 for a tournament-ready paddle. We tested every paddle in our database —
              measuring swing weight, twist weight, and static weight in the lab before hitting a single ball — and pulled
              out the best that come in under $200. Below are our top 5 picks, then every sub-$200 paddle on the site,
              filterable by brand, shape, and play style. Every review is unsponsored.
            </p>
            <div className="flex flex-wrap gap-4">
              {[`${count} Paddles Under $200`, `${brandCount} Brands`, "Lab-Measured Specs", "Unsponsored Reviews"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Top 5 picks ─────────────────────────────────────────────── */}
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-8" style={{ color: "var(--text-primary)" }}>
            Top 5 Pickleball Paddles Under $200
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
                                      <img src={sp.image} alt={`${sp.brand} ${sp.name} ${sp.shape} pickleball paddle under $200`} className="w-full h-auto object-contain" style={{ maxHeight: "160px", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))" }} />
                                    )}
                                    <p className="text-[10px] font-bold text-center mt-1 truncate w-full" style={{ color: "rgba(255,255,255,0.6)" }}>{sp.shape}</p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={paddle.image ?? ""} alt={`${paddle.brand} ${paddle.name} ${paddle.shape} ${paddle.thickness} pickleball paddle under $200`} className="w-full h-full object-contain" style={{ maxHeight: "200px", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }} />
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
                          <Link href={isSeries && paddle.seriesSlug ? `/series/${paddle.seriesSlug}` : `/paddles/${pick.slug}`} className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02]" style={{ background: ACCENT, color: "#0a2540" }}>
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

          {/* ── All under $200 (filterable) ─────────────────────────────── */}
          <div className="flex items-center gap-3 mb-3">
            <Wallet className="w-6 h-6" style={{ color: ACCENT }} />
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Every Pickleball Paddle Under $200
            </h2>
          </div>
          <p className="text-base leading-relaxed mb-8 max-w-3xl" style={{ color: "var(--text-muted)" }}>
            All {count} paddles on the site that come in under $200 after the PLAYBOOK discount. Filter by brand, shape,
            or play style, and sort by price or swing weight to find the right paddle for your game and budget.
          </p>
          <PaddleBudgetGrid paddles={under200} maxPrice={MAX_PRICE} />

          {/* ── Buying guide ────────────────────────────────────────────── */}
          <div className="mt-24 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
              How to Choose a Pickleball Paddle Under $200
            </h2>
            <div className="flex flex-col gap-4 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
              <p>
                The $150–$200 range is where most players find their forever paddle. It&apos;s the price point where
                thermoformed and foam-core construction, premium carbon faces, and tour-level specs all become standard —
                without the diminishing returns of $250+ flagships.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Swing weight</strong> is the spec that shapes feel the
                most: higher numbers (115+) drive harder, lower numbers move faster at the net.
                <strong style={{ color: "var(--text-primary)" }}> Twist weight</strong> measures forgiveness on
                off-center hits, and <strong style={{ color: "var(--text-primary)" }}> face texture</strong> matters more
                in this bracket — paddles like the Thrive Ignite use surfaces that hold their grip far longer than budget
                faces do.
              </p>
              <p>
                Match the shape to your game: elongated for reach and power, hybrid for an all-around feel, widebody for
                the biggest sweet spot. On a tighter budget? See our <Link href="/best-pickleball-paddles/under-125" className="font-semibold" style={{ color: "#4ade80" }}>best pickleball paddles under $125</Link>.
                Otherwise, compare specs side by side with our <Link href="/compare" className="font-semibold" style={{ color: "#2dd4bf" }}>comparison tool</Link>, browse the
                full <Link href="/paddles" className="font-semibold" style={{ color: "#2dd4bf" }}>paddle database</Link>, or see our
                overall <Link href="/best-pickleball-paddles" className="font-semibold" style={{ color: "#2dd4bf" }}>best pickleball paddles</Link> picks across every price range.
              </p>
            </div>
          </div>

          {/* ── FAQ ─────────────────────────────────────────────────────── */}
          <div className="mt-20 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>Common Questions</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-10" style={{ color: "var(--text-primary)" }}>
              Mid-Range Paddle FAQ
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
