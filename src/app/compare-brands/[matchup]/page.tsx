import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, BarChart2 } from "lucide-react";
import { getBrandBySlug } from "@/data/brands";
import { siteConfig } from "@/config/site";
import PaddleMiniCard from "@/components/PaddleMiniCard";
import {
  parseBrandMatchup,
  canonicalBrandMatchup,
  getBrandStats,
  buildBrandMatchups,
  COMPARISON_BRAND_SLUGS,
} from "./helpers";

interface Props {
  params: { matchup: string };
}

export const dynamicParams = true;

export function generateStaticParams() {
  return buildBrandMatchups().map((m) => ({ matchup: m }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = parseBrandMatchup(params.matchup);
  if (!parsed) return {};
  const [slugA, slugB] = parsed;
  const brandA = getBrandBySlug(slugA);
  const brandB = getBrandBySlug(slugB);
  if (!brandA || !brandB) return {};

  const url = `${siteConfig.siteUrl}/compare-brands/${canonicalBrandMatchup(slugA, slugB)}`;
  const title = `${brandA.name} vs ${brandB.name} Pickleball Paddles (${new Date().getFullYear()}) — Which Brand Wins?`;
  const description = `${brandA.name} vs ${brandB.name}: side-by-side brand comparison of top paddles, average swing weights, price ranges, and who each brand is best for. Lab-measured specs.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: siteConfig.name,
      images: [{ url: `${siteConfig.siteUrl}${brandA.logo}`, alt: `${brandA.name} vs ${brandB.name} pickleball` }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// ── Choose-if blurb generator ─────────────────────────────────────────────

function chooseIfLines(brandName: string, avgSW: number, minPrice: number, maxPrice: number, shapes: string[]): string[] {
  const lines: string[] = [];

  if (maxPrice <= 140) {
    lines.push("Budget is a priority — top specs without a premium price");
  } else if (minPrice >= 200) {
    lines.push("You want the best-built tools regardless of price");
  } else {
    lines.push("Mid-range pricing with strong performance specs");
  }

  if (avgSW >= 120) {
    lines.push("Power and heavy drives are central to your game");
  } else if (avgSW >= 116) {
    lines.push("A balanced power-to-control ratio matters");
  } else if (avgSW <= 112) {
    lines.push("Arm-friendly weight and fast hand speed at the NVZ");
  }

  if (shapes.length >= 3) {
    lines.push("You want shape options — widebody, hybrid, and elongated in one family");
  } else if (shapes.includes("Elongated")) {
    lines.push("You prefer elongated paddles with more reach");
  } else if (shapes.includes("Widebody")) {
    lines.push("A large forgiving sweet spot is more important than reach");
  }

  // Brand-specific signals
  if (brandName === "Selkirk" || brandName === "Joola") {
    lines.push("Brand recognition and warranty support matter to you");
  }
  if (brandName === "Enhance") {
    lines.push("Getting professional foam-core technology under $120");
  }
  if (brandName === "Bread & Butter") {
    lines.push("You follow competitive pickleball trends closely");
  }
  if (brandName === "Luzz") {
    lines.push("High swing weight at a below-market price");
  }
  if (brandName === "Mint") {
    lines.push("A thick-core (18mm+) ultra-soft touch-forward feel");
  }
  if (brandName === "Gearbox") {
    lines.push("Engineering-focused design with SpinLock surface technology");
  }
  if (brandName === "11SIX24") {
    lines.push("A smaller independent brand with serious competitive credentials");
  }
  if (brandName === "Honolulu") {
    lines.push("Durable Endurance Surface that holds grit over hundreds of hours");
  }
  if (brandName === "CRBN") {
    lines.push("TruFoam core technology for a planted, dwell-heavy feel");
  }

  return lines.slice(0, 4);
}

// ── Intro prose generator ──────────────────────────────────────────────────

function generateIntro(brandAName: string, brandBName: string, statsA: ReturnType<typeof getBrandStats>, statsB: ReturnType<typeof getBrandStats>): string {
  const sentences: string[] = [];

  // Price tier framing
  const aAvgPrice = statsA.minPrice > 0 && statsA.maxPrice > 0 ? (statsA.minPrice + statsA.maxPrice) / 2 : 0;
  const bAvgPrice = statsB.minPrice > 0 && statsB.maxPrice > 0 ? (statsB.minPrice + statsB.maxPrice) / 2 : 0;

  if (aAvgPrice > 0 && bAvgPrice > 0) {
    const priceDiff = Math.abs(aAvgPrice - bAvgPrice);
    if (priceDiff >= 50) {
      const cheaper = aAvgPrice < bAvgPrice ? brandAName : brandBName;
      const pricier = aAvgPrice < bAvgPrice ? brandBName : brandAName;
      sentences.push(`${cheaper} consistently underprices ${pricier} on comparable specs — a meaningful difference if budget is part of your decision.`);
    } else {
      sentences.push(`${brandAName} and ${brandBName} operate in a similar price range, making this a spec-first comparison rather than a budget decision.`);
    }
  }

  // SW comparison
  if (statsA.avgSwingWeight > 0 && statsB.avgSwingWeight > 0) {
    const swDiff = Math.abs(statsA.avgSwingWeight - statsB.avgSwingWeight);
    if (swDiff >= 3) {
      const heavier = statsA.avgSwingWeight > statsB.avgSwingWeight ? brandAName : brandBName;
      const lighter = statsA.avgSwingWeight > statsB.avgSwingWeight ? brandBName : brandAName;
      sentences.push(`${heavier} builds heavier across the lineup (avg SW ${Math.max(statsA.avgSwingWeight, statsB.avgSwingWeight)}) vs ${lighter} (avg SW ${Math.min(statsA.avgSwingWeight, statsB.avgSwingWeight)}) — a real difference in how the paddle feels on drives.`);
    } else {
      sentences.push(`Their average swing weights are within ${swDiff.toFixed(1)} points of each other, so the choice comes down to playing style and build quality rather than raw mass.`);
    }
  }

  // Shape diversity
  const aShapeCount = statsA.shapes.length;
  const bShapeCount = statsB.shapes.length;
  if (aShapeCount !== bShapeCount) {
    const broader = aShapeCount > bShapeCount ? brandAName : brandBName;
    const narrower = aShapeCount > bShapeCount ? brandBName : brandAName;
    sentences.push(`${broader} offers more shape variety (${Math.max(aShapeCount, bShapeCount)} shapes) compared to ${narrower}'s more focused lineup.`);
  }

  return sentences.join(" ");
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function BrandMatchupPage({ params }: Props) {
  const parsed = parseBrandMatchup(params.matchup);
  if (!parsed) notFound();

  const [slugA, slugB] = parsed;
  const canonical = canonicalBrandMatchup(slugA, slugB);

  // Enforce canonical URL
  if (params.matchup !== canonical) {
    redirect(`/compare-brands/${canonical}`);
  }

  const brandA = getBrandBySlug(slugA);
  const brandB = getBrandBySlug(slugB);
  if (!brandA || !brandB) notFound();

  const statsA = getBrandStats(brandA.name);
  const statsB = getBrandStats(brandB.name);
  const intro = generateIntro(brandA.name, brandB.name, statsA, statsB);

  const linesA = chooseIfLines(brandA.name, statsA.avgSwingWeight, statsA.minPrice, statsA.maxPrice, statsA.shapes);
  const linesB = chooseIfLines(brandB.name, statsB.avgSwingWeight, statsB.minPrice, statsB.maxPrice, statsB.shapes);

  // Related brand matchups — other pairs involving either brand, excluding this one
  const relatedMatchups = buildBrandMatchups()
    .filter((m) => m !== canonical && (m.includes(slugA) || m.includes(slugB)))
    .slice(0, 6)
    .map((m) => {
      const p = parseBrandMatchup(m);
      if (!p) return null;
      const ba = getBrandBySlug(p[0]);
      const bb = getBrandBySlug(p[1]);
      if (!ba || !bb) return null;
      return { matchup: m, nameA: ba.name, nameB: bb.name };
    })
    .filter(Boolean) as { matchup: string; nameA: string; nameB: string }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `${brandA.name} vs ${brandB.name}: which brand makes better pickleball paddles?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${brandA.name} and ${brandB.name} target different playing styles. ${brandA.name} averages SW ${statsA.avgSwingWeight} across its lineup; ${brandB.name} averages SW ${statsB.avgSwingWeight}. The best brand depends on your game — power-first players typically prefer higher-SW lineups, while touch players favor brands with lower average swing weights and softer cores.`,
        },
      },
      {
        "@type": "Question",
        "name": `How does ${brandA.name} pricing compare to ${brandB.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": statsA.minPrice > 0 && statsB.minPrice > 0
            ? `${brandA.name} paddles range from $${statsA.minPrice} to $${statsA.maxPrice}. ${brandB.name} paddles range from $${statsB.minPrice} to $${statsB.maxPrice}. Both brands offer discount codes — use code PLAYBOOK at checkout for savings on most paddles.`
            : `Both brands offer paddles at competitive price points. Use code PLAYBOOK at checkout for savings.`,
        },
      },
      {
        "@type": "Question",
        "name": `What shapes does ${brandA.name} offer compared to ${brandB.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${brandA.name} offers paddles in ${statsA.shapes.join(", ")} shapes. ${brandB.name} offers paddles in ${statsB.shapes.join(", ")} shapes.`,
        },
      },
      {
        "@type": "Question",
        "name": `Is ${brandA.name} or ${brandB.name} better for competitive players?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `For competitive play (4.5+), swing weight above 119 is the practical benchmark. ${statsA.avgSwingWeight >= statsB.avgSwingWeight ? brandA.name : brandB.name} averages a higher swing weight across its lineup (SW ${Math.max(statsA.avgSwingWeight, statsB.avgSwingWeight)}), which is the better fit for power-oriented competitive play. ${statsA.avgSwingWeight < statsB.avgSwingWeight ? brandA.name : brandB.name} (avg SW ${Math.min(statsA.avgSwingWeight, statsB.avgSwingWeight)}) is better suited for touch-focused and kitchen-game players.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ paddingTop: "calc(env(safe-area-inset-top) + 112px)" }}>

        {/* ── BREADCRUMB ──────────────────────────────────────────────── */}
        <div className="container-xl py-4">
          <nav className="flex items-center gap-1 text-xs" style={{ color: "var(--flip-text-muted)" }} aria-label="Breadcrumb">
            <Link href="/brands" className="hover:underline">Brands</Link>
            <ChevronRight size={12} />
            <span style={{ color: "var(--flip-text-head)" }}>{brandA.name} vs {brandB.name}</span>
          </nav>
        </div>

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section className="py-12" style={{ background: "var(--flip-bg-card)" }}>
          <div className="container-xl max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>
              Brand Comparison
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "var(--flip-text-head)" }}>
              {brandA.name} vs {brandB.name}
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: "var(--flip-text-muted)" }}>
              {intro}
            </p>

            {/* Brand logo cards */}
            <div className="grid grid-cols-2 gap-4 max-w-md">
              {[
                { brand: brandA, stats: statsA, slug: slugA },
                { brand: brandB, stats: statsB, slug: slugB },
              ].map(({ brand, stats, slug }) => (
                <Link
                  key={slug}
                  href={`/brands/${slug}`}
                  className="group rounded-2xl p-5 flex flex-col items-center gap-3 transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)" }}
                >
                  <div className="w-16 h-16 relative">
                    <Image
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-sm" style={{ color: "var(--flip-text-head)" }}>{brand.name}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--flip-text-muted)" }}>
                      {stats.paddleCount} paddle{stats.paddleCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS COMPARISON TABLE ───────────────────────────────────── */}
        <section className="py-16">
          <div className="container-xl max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <BarChart2 size={22} style={{ color: "#60a5fa" }} />
              <h2 className="text-2xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
                Side-by-Side Stats
              </h2>
            </div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--flip-card-border)" }}
            >
              {/* Header */}
              <div className="grid grid-cols-3 text-xs font-bold uppercase tracking-wider px-4 py-3"
                style={{ background: "var(--flip-bg-card)", borderBottom: "1px solid var(--flip-card-border)" }}>
                <span style={{ color: "var(--flip-text-muted)" }}>Spec</span>
                <span className="text-center" style={{ color: "#60a5fa" }}>{brandA.name}</span>
                <span className="text-center" style={{ color: "#a78bfa" }}>{brandB.name}</span>
              </div>

              {[
                {
                  label: "Paddles in Catalog",
                  a: `${statsA.paddleCount}`,
                  b: `${statsB.paddleCount}`,
                },
                {
                  label: "Avg Swing Weight",
                  a: statsA.avgSwingWeight > 0 ? `SW ${statsA.avgSwingWeight}` : "—",
                  b: statsB.avgSwingWeight > 0 ? `SW ${statsB.avgSwingWeight}` : "—",
                },
                {
                  label: "Price Range",
                  a: statsA.minPrice > 0 ? `$${statsA.minPrice}–$${statsA.maxPrice}` : "—",
                  b: statsB.minPrice > 0 ? `$${statsB.minPrice}–$${statsB.maxPrice}` : "—",
                },
                {
                  label: "Available Shapes",
                  a: statsA.shapes.join(", ") || "—",
                  b: statsB.shapes.join(", ") || "—",
                },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className="grid grid-cols-3 px-4 py-3 text-sm"
                  style={{
                    background: i % 2 === 0 ? "var(--flip-bg)" : "var(--flip-bg-card)",
                    borderBottom: "1px solid var(--flip-card-border)",
                  }}
                >
                  <span style={{ color: "var(--flip-text-muted)" }}>{row.label}</span>
                  <span className="text-center font-semibold" style={{ color: "var(--flip-text-head)" }}>{row.a}</span>
                  <span className="text-center font-semibold" style={{ color: "var(--flip-text-head)" }}>{row.b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TOP PADDLES: BRAND A ─────────────────────────────────────── */}
        {statsA.topPaddles.length > 0 && (
          <section className="py-16" style={{ background: "var(--flip-bg-card)" }}>
            <div className="container-xl">
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--flip-text-head)" }}>
                Top {brandA.name} Paddles
              </h2>
              <p className="text-sm mb-8" style={{ color: "var(--flip-text-muted)" }}>
                {brandA.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {statsA.topPaddles.map((p) => (
                  <PaddleMiniCard key={p.id} paddle={p} />
                ))}
              </div>
              <div className="mt-6 text-sm" style={{ color: "var(--flip-text-muted)" }}>
                <Link href={`/brands/${slugA}`} className="font-bold hover:text-[#5a9df9]" style={{ color: "#60a5fa" }}>
                  Browse all {brandA.name} paddles →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── TOP PADDLES: BRAND B ─────────────────────────────────────── */}
        {statsB.topPaddles.length > 0 && (
          <section className="py-16">
            <div className="container-xl">
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--flip-text-head)" }}>
                Top {brandB.name} Paddles
              </h2>
              <p className="text-sm mb-8" style={{ color: "var(--flip-text-muted)" }}>
                {brandB.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {statsB.topPaddles.map((p) => (
                  <PaddleMiniCard key={p.id} paddle={p} />
                ))}
              </div>
              <div className="mt-6 text-sm" style={{ color: "var(--flip-text-muted)" }}>
                <Link href={`/brands/${slugB}`} className="font-bold hover:text-[#5a9df9]" style={{ color: "#a78bfa" }}>
                  Browse all {brandB.name} paddles →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── CHOOSE IF ────────────────────────────────────────────────── */}
        <section className="py-16" style={{ background: "var(--flip-bg-card)" }}>
          <div className="container-xl max-w-4xl">
            <h2 className="text-2xl font-extrabold mb-8" style={{ color: "var(--flip-text-head)" }}>
              Which brand should you choose?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { brand: brandA, lines: linesA, color: "#60a5fa", bg: "#0f2744" },
                { brand: brandB, lines: linesB, color: "#a78bfa", bg: "#1e0b4b" },
              ].map(({ brand, lines, color, bg }) => (
                <div
                  key={brand.slug}
                  className="rounded-2xl p-6"
                  style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color }}>
                    Choose {brand.name} if…
                  </p>
                  <ul className="space-y-2">
                    {lines.map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--flip-text-muted)" }}>
                        <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                        {line}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/brands/${brand.slug}`}
                    className="mt-5 inline-flex items-center gap-1 text-xs font-bold hover:underline"
                    style={{ color }}
                  >
                    See all {brand.name} paddles <ChevronRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="py-16">
          <div className="container-xl max-w-3xl">
            <h2 className="text-2xl font-extrabold mb-8" style={{ color: "var(--flip-text-head)" }}>
              {brandA.name} vs {brandB.name} — FAQ
            </h2>
            <div className="space-y-6">
              {(jsonLd.mainEntity as { "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }[]).map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5"
                  style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
                >
                  <p className="font-bold text-sm mb-2" style={{ color: "var(--flip-text-head)" }}>
                    {item.name}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-muted)" }}>
                    {item.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RELATED BRAND MATCHUPS ───────────────────────────────────── */}
        {relatedMatchups.length > 0 && (
          <section className="py-16" style={{ background: "var(--flip-bg-card)" }}>
            <div className="container-xl">
              <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--flip-text-head)" }}>
                More Brand Comparisons
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {relatedMatchups.map(({ matchup, nameA, nameB }) => (
                  <Link
                    key={matchup}
                    href={`/compare-brands/${matchup}`}
                    className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all hover:border-[#5a9df9]/50"
                    style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)" }}
                  >
                    <span className="text-sm font-semibold group-hover:text-[#5a9df9] transition-colors" style={{ color: "var(--flip-text-head)" }}>
                      {nameA} vs {nameB}
                    </span>
                    <ChevronRight size={14} className="shrink-0 group-hover:translate-x-0.5 transition-transform" style={{ color: "#60a5fa" }} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── EXPLORE BRANDS ───────────────────────────────────────────── */}
        <section className="py-10">
          <div className="container-xl text-center">
            <Link
              href="/brands"
              className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors hover:opacity-90"
              style={{ background: "var(--flip-bg-card)", color: "#60a5fa", border: "1px solid var(--flip-card-border)" }}
            >
              Browse All Brands →
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}
