import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getPaddleBySlug, paddles } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import { ChevronRight, ArrowLeft, BarChart2 } from "lucide-react";
import PaddleMiniCard from "@/components/PaddleMiniCard";
import { canonicalMatchup } from "@/app/compare/[matchup]/helpers";
import type { Paddle } from "@/types";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return paddles
    .filter((p) => !p.discontinued)
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const paddle = getPaddleBySlug(params.slug);
  if (!paddle) return {};
  const url = `${siteConfig.siteUrl}/paddles/${paddle.slug}/alternatives`;
  const title = `Best Alternatives to the ${paddle.brand} ${paddle.name} ${paddle.shape} (${new Date().getFullYear()})`;
  const description = `Looking for an alternative to the ${paddle.brand} ${paddle.name}? Here are the 6 closest alternatives ranked by specs — same shape, similar swing weight (SW ${paddle.swingWeight}), and price range with discount codes.`;
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
      ...(paddle.image ? { images: [{ url: `${siteConfig.siteUrl}${paddle.image}`, alt: `Alternatives to the ${paddle.brand} ${paddle.name}` }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// ── Similarity scoring (mirrors paddle detail page logic) ──────────────────

function getSimilarPaddles(paddle: Paddle, count = 6): Paddle[] {
  const priceVal = paddle.price ? parseFloat(paddle.price.replace(/[^0-9.]/g, "")) : 0;

  const scored = paddles
    .filter((p) => p.id !== paddle.id && !p.discontinued)
    .map((p) => {
      let score = 0;
      if (p.playStyle && p.playStyle === paddle.playStyle) score += 30;
      if (p.shape === paddle.shape) score += 20;
      if (p.thickness === paddle.thickness) score += 10;
      const pPrice = p.price ? parseFloat(p.price.replace(/[^0-9.]/g, "")) : 0;
      if (priceVal > 0 && pPrice > 0) {
        const diff = Math.abs(priceVal - pPrice);
        if (diff <= 20) score += 20;
        else if (diff <= 50) score += 12;
        else if (diff <= 80) score += 5;
      }
      if (paddle.swingWeight > 0 && p.swingWeight > 0) {
        const swDiff = Math.abs(paddle.swingWeight - p.swingWeight);
        if (swDiff <= 3) score += 15;
        else if (swDiff <= 6) score += 8;
        else if (swDiff <= 10) score += 3;
      }
      if (paddle.twistWeight > 0 && p.twistWeight > 0) {
        const twDiff = Math.abs(paddle.twistWeight - p.twistWeight);
        if (twDiff <= 0.3) score += 10;
        else if (twDiff <= 0.6) score += 5;
      }
      if (p.brand === paddle.brand) score += 5;
      if (p.image) score += 2;
      score += (p.trendingScore ?? 0) / 100;
      return { paddle: p, score };
    })
    .sort((a, b) => b.score - a.score);

  // Pick top N with brand diversity (max 2 per brand)
  const result: Paddle[] = [];
  const brandCount: Record<string, number> = {};
  for (const { paddle: p } of scored) {
    if (result.length >= count) break;
    const bc = brandCount[p.brand] ?? 0;
    if (bc >= 2) continue;
    result.push(p);
    brandCount[p.brand] = bc + 1;
  }
  return result;
}

// ── Per-alternative blurb generator ───────────────────────────────────────

function altBlurb(base: Paddle, alt: Paddle): string {
  const parts: string[] = [];

  // Price comparison
  const basePrice = base.price ? parseFloat(base.price.replace(/[^0-9.]/g, "")) : 0;
  const altPrice = alt.price ? parseFloat(alt.price.replace(/[^0-9.]/g, "")) : 0;
  if (basePrice > 0 && altPrice > 0) {
    const diff = altPrice - basePrice;
    if (diff <= -40) parts.push(`$${Math.abs(diff).toFixed(0)} cheaper`);
    else if (diff >= 40) parts.push(`premium tier at $${altPrice.toFixed(0)}`);
    else parts.push(`similar price at $${altPrice.toFixed(0)}`);
  }

  // Shape match
  if (alt.shape === base.shape) {
    parts.push(`same ${alt.shape.toLowerCase()} shape`);
  } else {
    parts.push(`${alt.shape.toLowerCase()} shape`);
  }

  // SW comparison
  if (base.swingWeight > 0 && alt.swingWeight > 0) {
    const swDiff = alt.swingWeight - base.swingWeight;
    if (Math.abs(swDiff) <= 1.5) {
      parts.push(`nearly identical SW ${alt.swingWeight}`);
    } else if (swDiff > 0) {
      parts.push(`heavier SW ${alt.swingWeight} (+${swDiff.toFixed(1)})`);
    } else {
      parts.push(`lighter SW ${alt.swingWeight} (${swDiff.toFixed(1)})`);
    }
  }

  // Thickness
  if (alt.thickness !== base.thickness) {
    parts.push(`${alt.thickness} core`);
  }

  return parts.slice(0, 3).join(" · ");
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AlternativesPage({ params }: Props) {
  const paddle = getPaddleBySlug(params.slug);
  if (!paddle || paddle.discontinued) notFound();

  const alternatives = getSimilarPaddles(paddle, 6);
  const compareLinks = alternatives.slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Best Alternatives to the ${paddle.brand} ${paddle.name} ${paddle.shape}`,
    "description": `Top 6 alternatives to the ${paddle.brand} ${paddle.name} ranked by spec similarity`,
    "url": `${siteConfig.siteUrl}/paddles/${paddle.slug}/alternatives`,
    "numberOfItems": alternatives.length,
    "itemListElement": alternatives.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": `${p.brand} ${p.name} ${p.shape}`,
      "url": `${siteConfig.siteUrl}/paddles/${p.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── PAGE WRAPPER ──────────────────────────────────────────────────── */}
      <div style={{ paddingTop: "calc(env(safe-area-inset-top) + 112px)" }}>

        {/* ── BREADCRUMB ────────────────────────────────────────────────── */}
        <div className="container-xl py-4">
          <nav className="flex items-center gap-1 text-xs" style={{ color: "var(--flip-text-muted)" }} aria-label="Breadcrumb">
            <Link href="/paddles" className="hover:underline">Paddles</Link>
            <ChevronRight size={12} />
            <Link href={`/paddles/${paddle.slug}`} className="hover:underline truncate max-w-[160px]">
              {paddle.brand} {paddle.name}
            </Link>
            <ChevronRight size={12} />
            <span style={{ color: "var(--flip-text-head)" }}>Alternatives</span>
          </nav>
        </div>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="py-12" style={{ background: "var(--flip-bg-card)" }}>
          <div className="container-xl max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>
              Paddle Alternatives
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "var(--flip-text-head)" }}>
              Best Alternatives to the {paddle.brand} {paddle.name} {paddle.shape}
            </h1>

            {/* Original paddle spec strip */}
            <div
              className="flex flex-wrap gap-3 mb-6"
            >
              {[
                { label: "Shape", value: paddle.shape },
                { label: "Swing Weight", value: `SW ${paddle.swingWeight}` },
                { label: "Twist Weight", value: `TW ${paddle.twistWeight}` },
                { label: "Thickness", value: paddle.thickness },
                ...(paddle.price ? [{ label: "Price", value: paddle.price }] : []),
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-lg px-3 py-2 text-center"
                  style={{
                    background: "var(--flip-bg)",
                    border: "1px solid var(--flip-card-border)",
                  }}
                >
                  <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--flip-text-muted)" }}>{label}</div>
                  <div className="text-sm font-bold" style={{ color: "var(--flip-text-head)" }}>{value}</div>
                </div>
              ))}
            </div>

            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--flip-text-muted)" }}>
              The {paddle.brand} {paddle.name} is a {paddle.shape.toLowerCase()} paddle at SW {paddle.swingWeight} and {paddle.thickness}.{" "}
              The six alternatives below were ranked by spec similarity — same or nearly identical shape, comparable swing weight, and similar price range.{" "}
              Each one is a genuine substitute worth considering.
            </p>

            <Link
              href={`/paddles/${paddle.slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
              style={{ color: "#60a5fa" }}
            >
              <ArrowLeft size={14} />
              Back to {paddle.brand} {paddle.name} full review
            </Link>
          </div>
        </section>

        {/* ── ALTERNATIVES GRID ─────────────────────────────────────────── */}
        <section className="py-16">
          <div className="container-xl">
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--flip-text-head)" }}>
              6 Best Alternatives
            </h2>
            <p className="text-sm mb-8" style={{ color: "var(--flip-text-muted)" }}>
              Ranked by spec similarity to the {paddle.brand} {paddle.name} — shape, swing weight, price range.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {alternatives.map((alt, i) => (
                <div
                  key={alt.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--flip-bg-card)",
                    border: "1px solid var(--flip-card-border)",
                  }}
                >
                  {/* Rank badge + paddle card */}
                  <div className="relative">
                    <div
                      className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold"
                      style={{ background: "#1e3a5f", color: "#60a5fa", border: "1px solid #2d5a9e" }}
                    >
                      {i + 1}
                    </div>
                    <PaddleMiniCard paddle={alt} />
                  </div>
                  {/* Blurb */}
                  <div className="px-4 pb-4">
                    <p className="text-xs" style={{ color: "var(--flip-text-muted)" }}>
                      {altBlurb(paddle, alt)}
                    </p>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Link
                        href={`/paddles/${alt.slug}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
                        style={{ background: "#1e3a5f", color: "#60a5fa" }}
                      >
                        View Review
                      </Link>
                      <Link
                        href={`/compare/${canonicalMatchup(paddle.slug, alt.slug)}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
                        style={{ background: "var(--flip-bg)", color: "var(--flip-text-muted)", border: "1px solid var(--flip-card-border)" }}
                      >
                        Compare vs. {paddle.name}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY CONSIDER AN ALTERNATIVE ───────────────────────────────── */}
        <section className="py-16" style={{ background: "var(--flip-bg-card)" }}>
          <div className="container-xl max-w-3xl">
            <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--flip-text-head)" }}>
              Why look for an alternative to the {paddle.brand} {paddle.name}?
            </h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: "var(--flip-text-muted)" }}>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Price.</strong>{" "}
                The {paddle.brand} {paddle.name} is listed at {paddle.price ?? "its current price"}.
                Several alternatives above offer nearly identical specs at a lower price — particularly relevant if
                you want to test a new swing-weight range without committing to a premium purchase.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Availability.</strong>{" "}
                Paddles sell out seasonally and can go on backorder. The alternatives above are all currently in stock
                and ready to ship with a discount code applied at checkout.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Brand preference.</strong>{" "}
                Some players prefer to diversify away from a single brand family. The list above deliberately
                includes paddles from at least 3 different brands so you have cross-brand options at comparable specs.
              </p>
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Playing style shift.</strong>{" "}
                If your game has evolved — adding more spin, moving toward a softer touch at the kitchen, or looking
                for a heavier drive paddle — one of the alternatives above is likely closer to your current needs
                than the {paddle.name}.
              </p>
            </div>
          </div>
        </section>

        {/* ── COMPARE HEAD-TO-HEAD LINKS ────────────────────────────────── */}
        {compareLinks.length > 0 && (
          <section className="py-16">
            <div className="container-xl">
              <div className="flex items-center gap-3 mb-2">
                <BarChart2 size={22} style={{ color: "#60a5fa" }} />
                <h2 className="text-2xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
                  Compare {paddle.brand} {paddle.name} Head-to-Head
                </h2>
              </div>
              <p className="text-sm mb-8" style={{ color: "var(--flip-text-muted)" }}>
                Side-by-side spec breakdowns — drill into price, feel, and who each paddle is for.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {compareLinks.map((p) => {
                  const matchup = canonicalMatchup(paddle.slug, p.slug);
                  return (
                    <Link
                      key={p.id}
                      href={`/compare/${matchup}`}
                      className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all hover:border-[#5a9df9]/50"
                      style={{
                        background: "var(--flip-bg-card)",
                        border: "1px solid var(--flip-card-border)",
                      }}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: "var(--flip-text-muted)" }}>vs.</p>
                        <p className="text-sm font-bold truncate group-hover:text-[#5a9df9] transition-colors" style={{ color: "var(--flip-text-head)" }}>
                          {p.brand} {p.name}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "var(--flip-text-muted)" }}>
                          {p.shape} · {p.thickness}{p.price ? ` · ${p.price}` : ""}
                        </p>
                      </div>
                      <ChevronRight size={16} className="shrink-0 group-hover:translate-x-0.5 transition-transform" style={{ color: "#60a5fa" }} />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── BACK LINK ─────────────────────────────────────────────────── */}
        <section className="py-10" style={{ background: "var(--flip-bg-card)" }}>
          <div className="container-xl text-center">
            <p className="text-sm mb-4" style={{ color: "var(--flip-text-muted)" }}>
              Want the full review, specs, and discount code for the {paddle.brand} {paddle.name}?
            </p>
            <Link
              href={`/paddles/${paddle.slug}`}
              className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors hover:opacity-90"
              style={{ background: "#1e3a5f", color: "#60a5fa", border: "1px solid #2d5a9e" }}
            >
              <ArrowLeft size={14} />
              Full {paddle.brand} {paddle.name} Review →
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}
