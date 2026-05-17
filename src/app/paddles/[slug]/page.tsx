import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getPaddleBySlug, paddles } from "@/data/paddles";
import { fetchPlaylistVideos, getVideoForPaddle } from "@/lib/youtube";
import { getCatalogStats } from "@/lib/catalogStats";
import { siteConfig } from "@/config/site";
import PerformanceBar from "@/components/PerformanceBar";
import SpecBar from "@/components/SpecBar";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import SubstackCard from "@/components/SubstackCard";
import PaddleCard from "@/components/PaddleCard";
import PaddleDetailTabs from "@/components/PaddleDetailTabs";
import WhoItsFor from "@/components/WhoItsFor";
import StickyBottomBar from "@/components/StickyBottomBar";
import { gearProducts } from "@/data/products";
import { ArrowLeft, ArrowRight, BarChart2, ExternalLink, BookOpen, ChevronRight, User } from "lucide-react";
import ReactionButtons from "@/components/ReactionButtons";
import DiscountCodeBox from "@/components/DiscountCodeBox";
import PaddleStarRating from "@/components/PaddleStarRating";
import ViewCounter from "@/components/ViewCounter";
import { getBlogPostForPaddle, BlogSection } from "@/data/blogPosts";

interface Props {
  params: { slug: string };
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return paddles.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const paddle = getPaddleBySlug(params.slug);
  if (!paddle) return {};
  const code = getDiscountCode(paddle.brand, paddle.discountLink);
  return {
    title: `${paddle.brand} ${paddle.name} ${paddle.thickness} Review | Pickleball Playbook`,
    description: `${paddle.brand} ${paddle.name} pickleball paddle review — ${paddle.shape} shape, ${paddle.thickness} core, ${paddle.weight}, Swing Weight ${paddle.swingWeight}. Specs, who it's for, video review & discount code ${code}.`,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDiscountCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

function isSelkirkGiftCard(brand: string, amountOff: string, discountLink?: string): boolean {
  // Only show gift card treatment for Selkirk paddles linked to selkirk.com (not third-party affiliates)
  if (!(brand === "Selkirk" || brand === "SLK")) return false;
  if (!(amountOff === "$0" || amountOff === "" || !amountOff)) return false;
  if (discountLink?.includes("lockerroompickleball.com")) return false;
  return true;
}

function savingsDisplay(amountOff: string): string {
  if (!amountOff || amountOff === "$0") return "";
  return `Save ${amountOff}`;
}

function calcDiscountedPrice(price: string, amountOff: string): string | null {
  if (!price || !amountOff || amountOff === "$0" || amountOff === "") return null;
  const base = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (isNaN(base)) return null;
  let discounted: number;
  if (amountOff.endsWith("%")) {
    discounted = base * (1 - parseFloat(amountOff) / 100);
  } else {
    discounted = base - parseFloat(amountOff.replace(/[^0-9.]/g, ""));
  }
  if (discounted <= 0) return null;
  return `$${discounted.toFixed(2)}`;
}

// ── Spec row ──────────────────────────────────────────────────────────────────

function SpecRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string | number | undefined;
  last?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div
      className={`flex items-center justify-between py-3.5 ${!last ? "border-b" : ""}`}
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <span className="text-sm font-medium" style={{ color: "var(--flip-text-muted)" }}>
        {label}
      </span>
      <span className="text-sm font-bold font-mono" style={{ color: "var(--flip-text-head)" }}>
        {value}
      </span>
    </div>
  );
}

// ── Play style labels ─────────────────────────────────────────────────────────

const STYLE_LABELS: Record<string, string> = {
  power:       "Power",
  control:     "Control",
  "all-court": "All-Court",
  spin:        "Spin",
};

// ─────────────────────────────────────────────────────────────────────────────

export default async function PaddleDetailPage({ params }: Props) {
  const paddle = getPaddleBySlug(params.slug);
  if (!paddle) notFound();

  const playlistVideos = await fetchPlaylistVideos();
  const { videoId }    = await getVideoForPaddle(
    { ...paddle, manualVideoId: paddle.manualVideoId ?? "" } as Parameters<typeof getVideoForPaddle>[0],
    playlistVideos
  );

  const blogPost       = getBlogPostForPaddle(params.slug);
  const code           = getDiscountCode(paddle.brand, paddle.discountLink);
  const giftCard       = isSelkirkGiftCard(paddle.brand, paddle.amountOff, paddle.discountLink);
  const savings        = savingsDisplay(paddle.amountOff);
  const hasLink        = !!paddle.discountLink?.trim();
  // No code applies when there's no discount AND it's not a Selkirk gift card
  const noCode         = (!paddle.amountOff || paddle.amountOff === "$0" || paddle.amountOff === "") && !giftCard;
  const discountedPrice = paddle.price && paddle.amountOff
    ? calcDiscountedPrice(paddle.price, paddle.amountOff)
    : null;

  const catalog = getCatalogStats();

  // ── Smart similarity scoring ─────────────────────────────────────────────
  // Score each paddle by how similar it is across multiple dimensions.
  // Higher score = more similar. Each paddle page gets a unique comparison set.
  const priceVal = paddle.price ? parseFloat(paddle.price.replace(/[^0-9.]/g, "")) : 0;
  const scored = paddles
    .filter((p) => p.id !== paddle.id)
    .map((p) => {
      let score = 0;

      // Same play style (strong signal)
      if (p.playStyle && p.playStyle === paddle.playStyle) score += 30;

      // Same shape
      if (p.shape === paddle.shape) score += 15;

      // Same thickness
      if (p.thickness === paddle.thickness) score += 10;

      // Similar price range (within $50)
      const pPrice = p.price ? parseFloat(p.price.replace(/[^0-9.]/g, "")) : 0;
      if (priceVal > 0 && pPrice > 0) {
        const diff = Math.abs(priceVal - pPrice);
        if (diff <= 20) score += 20;
        else if (diff <= 50) score += 12;
        else if (diff <= 80) score += 5;
      }

      // Similar swing weight (within 5)
      if (paddle.swingWeight > 0 && p.swingWeight > 0) {
        const swDiff = Math.abs(paddle.swingWeight - p.swingWeight);
        if (swDiff <= 3) score += 15;
        else if (swDiff <= 6) score += 8;
        else if (swDiff <= 10) score += 3;
      }

      // Similar twist weight (within 0.5)
      if (paddle.twistWeight > 0 && p.twistWeight > 0) {
        const twDiff = Math.abs(paddle.twistWeight - p.twistWeight);
        if (twDiff <= 0.3) score += 10;
        else if (twDiff <= 0.6) score += 5;
      }

      // Same brand gets a small bonus (variants are comparable)
      if (p.brand === paddle.brand) score += 5;

      // Prefer paddles with images
      if (p.image) score += 2;

      // Tiebreak by trending score
      score += (p.trendingScore ?? 0) / 100;

      return { paddle: p, score };
    })
    .sort((a, b) => b.score - a.score);

  // Pick top 4, but ensure brand diversity (max 2 from same brand)
  const related: typeof paddles = [];
  const brandCount: Record<string, number> = {};
  for (const { paddle: p } of scored) {
    if (related.length >= 4) break;
    const bc = brandCount[p.brand] ?? 0;
    if (bc >= 2) continue;
    related.push(p);
    brandCount[p.brand] = bc + 1;
  }

  // Rotate gear products per paddle so each page shows different items
  const gearPool = gearProducts.filter((g) => g.id !== "academy");
  const gearOffset = parseInt(paddle.id, 10) || 0;
  const featuredGear = Array.from({ length: 3 }, (_, i) => gearPool[(gearOffset + i) % gearPool.length]);

  // ── JSON-LD schemas ─────────────────────────────────────────────────────────
  const priceNum = paddle.price ? parseFloat(paddle.price.replace(/[^0-9.]/g, "")) : null;
  const starRating = (paddle.trendingScore ?? 60) >= 70 ? "4.8"
    : (paddle.trendingScore ?? 60) >= 60 ? "4.5" : "4.3";

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${paddle.brand} ${paddle.name}`,
    "brand": { "@type": "Brand", "name": paddle.brand },
    "image": `${siteConfig.siteUrl}${paddle.image ?? ""}`,
    "description": `${paddle.brand} ${paddle.name} — ${paddle.shape} shape, ${paddle.thickness} core, ${paddle.weight}. Swing weight ${paddle.swingWeight}. Independently reviewed by Austin Hardy at Pickleball Playbook.`,
    ...(priceNum ? {
      "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": priceNum.toFixed(2),
        "availability": "https://schema.org/InStock",
        "url": paddle.discountLink || `${siteConfig.siteUrl}/paddles/${paddle.slug}`,
        "priceValidUntil": "2027-01-01",
      },
    } : {}),
    "review": {
      "@type": "Review",
      "reviewRating": { "@type": "Rating", "ratingValue": starRating, "bestRating": "5", "worstRating": "1" },
      "author": { "@type": "Person", "name": "Austin Hardy" },
      "publisher": { "@type": "Organization", "name": "Pickleball Playbook" },
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": starRating,
      "reviewCount": "1",
      "bestRating": "5",
      "worstRating": "1",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Paddles", "item": `${siteConfig.siteUrl}/paddles` },
      ...(paddle.playStyle ? [{
        "@type": "ListItem", "position": 2,
        "name": STYLE_LABELS[paddle.playStyle] ?? paddle.playStyle,
        "item": `${siteConfig.siteUrl}/paddles?playStyle=${paddle.playStyle}`,
      }] : []),
      { "@type": "ListItem", "position": paddle.playStyle ? 3 : 2, "name": `${paddle.brand} ${paddle.name}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What is the swing weight of the ${paddle.brand} ${paddle.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": paddle.swingWeight > 0
            ? `The ${paddle.brand} ${paddle.name} has a swing weight of ${paddle.swingWeight}, which is ${paddle.swingWeight > catalog.swingWeight.avg ? "above" : "near"} the catalog average of ${catalog.swingWeight.avg}.`
            : `Swing weight data for the ${paddle.brand} ${paddle.name} is not yet available.`,
        },
      },
      {
        "@type": "Question",
        "name": `Who should buy the ${paddle.brand} ${paddle.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `The ${paddle.brand} ${paddle.name} is a ${paddle.shape.toLowerCase()} ${paddle.thickness} paddle best suited for ${paddle.playStyle === "all-court" ? "all-court players who want balance" : paddle.playStyle === "power" ? "power-oriented players" : paddle.playStyle === "control" ? "control-focused players" : "spin-heavy players"}.`,
        },
      },
      {
        "@type": "Question",
        "name": `Is there a discount code for the ${paddle.brand} ${paddle.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": paddle.amountOff && paddle.amountOff !== "$0"
            ? `Yes! Use code ${code} at checkout to save ${paddle.amountOff} on the ${paddle.brand} ${paddle.name}.`
            : `Check Pickleball Playbook for the latest deals on the ${paddle.brand} ${paddle.name}.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen pt-[156px] pb-16" style={{ background: "var(--flip-bg)" }}>

      {/* ── BREADCRUMBS ─────────────────────────────────────────────────── */}
      <nav className="container-xl pt-6 pb-4" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider flex-wrap">
          <li>
            <Link href="/paddles" className="transition-colors hover:text-brand-400" style={{ color: "var(--flip-text-muted)" }}>
              Paddles
            </Link>
          </li>
          {paddle.playStyle && (
            <>
              <ChevronRight className="w-3 h-3" style={{ color: "var(--flip-text-muted)" }} />
              <li>
                <Link
                  href={`/paddles?playStyle=${paddle.playStyle}`}
                  className="transition-colors hover:text-brand-400"
                  style={{ color: "var(--flip-text-muted)" }}
                >
                  {STYLE_LABELS[paddle.playStyle] ?? paddle.playStyle}
                </Link>
              </li>
            </>
          )}
          <ChevronRight className="w-3 h-3" style={{ color: "var(--flip-text-muted)" }} />
          <li style={{ color: "var(--flip-text-head)" }}>{paddle.name}</li>
        </ol>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="container-xl pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Left — image */}
          <div
            className="relative rounded-3xl aspect-square flex flex-col items-center justify-center border"
            style={{
              background: "var(--flip-bg-card)",
              borderColor: "var(--flip-card-border)",
            }}
          >
            {/* Shape + Thickness + PlayStyle badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
              <span
                className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(20,184,166,0.15)",
                  color: "#2dd4bf",
                  border: "1px solid rgba(20,184,166,0.3)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {paddle.shape}
              </span>
              <span
                className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(20,184,166,0.15)",
                  color: "#2dd4bf",
                  border: "1px solid rgba(20,184,166,0.3)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {paddle.thickness}
              </span>
              {paddle.playStyle && (
                <span
                  className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                  style={{
                    background: paddle.playStyle === "power"
                      ? "rgba(251,146,60,0.15)"
                      : paddle.playStyle === "control"
                      ? "rgba(99,102,241,0.15)"
                      : "rgba(34,197,94,0.15)",
                    color: paddle.playStyle === "power"
                      ? "#fb923c"
                      : paddle.playStyle === "control"
                      ? "#818cf8"
                      : "#4ade80",
                    border: paddle.playStyle === "power"
                      ? "1px solid rgba(251,146,60,0.35)"
                      : paddle.playStyle === "control"
                      ? "1px solid rgba(99,102,241,0.35)"
                      : "1px solid rgba(34,197,94,0.35)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {STYLE_LABELS[paddle.playStyle] ?? paddle.playStyle}
                </span>
              )}
            </div>

            {paddle.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={paddle.image} alt={`${paddle.brand} ${paddle.name} ${paddle.shape} ${paddle.thickness} pickleball paddle`} className="w-full h-full object-contain p-10" />
            ) : (
              <>
                <svg viewBox="0 0 120 160" fill="none" className="w-32 h-auto mb-4 opacity-20" aria-hidden="true">
                  <rect x="5" y="5" width="110" height="115" rx="55" fill="#14b8a6" />
                  <rect x="45" y="116" width="30" height="40" rx="15" fill="#0d9488" />
                </svg>
                <p className="text-sm font-medium" style={{ color: "var(--flip-text-muted)" }}>
                  Image coming soon
                </p>
              </>
            )}
            {paddle.badge && (
              <span className="mt-4 badge badge-amber text-sm px-3 py-1">{paddle.badge}</span>
            )}
          </div>

          {/* Right — info panel */}
          <div className="lg:pt-2">

            {/* Reviewer line */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(20,184,166,0.15)" }}>
                <User className="w-4 h-4" style={{ color: "#14b8a6" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--flip-text-head)" }}>
                  Tested by <span style={{ color: "#2dd4bf" }}>Austin Hardy</span>
                </p>
                <p className="text-xs" style={{ color: "var(--flip-text-muted)" }}>
                  5.5+ player &middot; Independent reviewer
                </p>
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
              {paddle.brand}
            </p>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] mb-1"
              style={{ color: "var(--flip-text-head)" }}
            >
              {paddle.name} {paddle.thickness} Pickleball Paddle Review
            </h1>

            {paddle.tagline && (
              <p className="text-lg font-light mb-4" style={{ color: "var(--flip-text-body)" }}>
                {paddle.tagline}
              </p>
            )}

            {/* Star ratings + views */}
            <div className="flex items-center gap-4 mb-2 flex-wrap">
              <PaddleStarRating paddleId={paddle.id} />
              <ViewCounter slug={paddle.slug} type="paddle" />
            </div>

            {/* Hearts / reactions */}
            <div className="mb-4">
              <ReactionButtons paddleId={paddle.id} />
            </div>

            {/* Price + promo code box */}
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
            >
              {/* Price row with code on the right */}
              <div className="flex items-start justify-between gap-4 mb-4">
                {/* Left: price */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest font-mono mb-1" style={{ color: "var(--flip-text-muted)" }}>
                    Retail Price
                  </p>
                  {paddle.price && (
                    <div className="flex items-baseline gap-2">
                      {discountedPrice ? (
                        <>
                          <span className="text-3xl font-extrabold" style={{ color: "#2dd4bf" }}>
                            {discountedPrice}
                          </span>
                          <span className="text-lg font-semibold line-through" style={{ color: "var(--flip-text-muted)" }}>
                            {paddle.price}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
                          {paddle.price}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: promo code */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold uppercase tracking-widest font-mono mb-1" style={{ color: "var(--flip-text-muted)" }}>
                    Promo Code
                  </p>
                  {noCode ? (
                    <div
                      className="inline-flex items-center px-3 py-2 rounded-lg"
                      style={{ border: "2px dashed rgba(148,195,215,0.25)", background: "rgba(148,195,215,0.04)" }}
                    >
                      <span className="font-mono font-bold text-sm tracking-wide" style={{ color: "rgba(148,195,215,0.5)" }}>
                        No Code Use Link
                      </span>
                    </div>
                  ) : (
                    <DiscountCodeBox code={code} giftCard={giftCard} savings={savings} compact />
                  )}
                </div>
              </div>

              {/* Buy button */}
              {hasLink ? (
                <a
                  href={paddle.discountLink}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex items-center justify-between w-full font-bold text-base py-4 px-6 rounded-2xl transition-all duration-200 active:scale-[0.98]"
                  style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)", color: "var(--flip-text-head)" }}
                >
                  {noCode ? `Buy at ${paddle.brand}` : `Buy with Discount`}
                  <ArrowRight className="w-5 h-5" />
                </a>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 w-full font-bold text-base py-4 rounded-2xl cursor-not-allowed"
                  style={{
                    background: "var(--flip-bg-card)",
                    color: "var(--flip-text-muted)",
                    border: "1px solid var(--flip-card-border)",
                  }}
                >
                  Link Coming Soon
                </button>
              )}
              <p className="text-[11px] mt-2 text-center" style={{ color: "var(--flip-text-muted)" }}>
                Affiliate links. We may earn a commission — it never affects our ratings.
              </p>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/compare?paddles=${paddle.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:border-brand-400"
                style={{ borderColor: "var(--flip-card-border)", color: "var(--flip-text-head)" }}
              >
                Compare
              </Link>
              {videoId && (
                <button
                  onClick={undefined}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
                  style={{ borderColor: "var(--flip-card-border)", color: "var(--flip-text-head)" }}
                >
                  Watch Review
                </button>
              )}
              {paddle.seriesSlug && (
                <Link
                  href={`/series/${paddle.seriesSlug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.2)" }}
                >
                  View All Shapes <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── TAB NAVIGATION ─────────────────────────────────────────────── */}
      <PaddleDetailTabs />

      {/* ── PERFORMANCE & SPECS (tab: specs) ───────────────────────────── */}
      <section id="specs" className="py-16">
        <div className="container-xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Main content — 2 cols */}
            <div className="lg:col-span-2 space-y-10">

              {/* Austin's Take */}
              {blogPost && (
                <div
                  className="rounded-2xl p-6 md:p-8"
                  style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--flip-text-muted)" }}>
                    Austin&apos;s Take
                  </p>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(20,184,166,0.15)" }}>
                      <User className="w-4 h-4" style={{ color: "#14b8a6" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--flip-text-head)" }}>Austin Hardy</p>
                    </div>
                  </div>
                  {/* Show first paragraph or verdict as summary */}
                  {blogPost.sections.slice(0, 3).map((section: BlogSection, i: number) => {
                    if (section.type === "p") return (
                      <p key={i} className="text-sm leading-relaxed mb-3" style={{ color: "var(--flip-text-body)" }}>
                        {section.text}
                      </p>
                    );
                    if (section.type === "verdict") return (
                      <div
                        key={i}
                        className="rounded-xl p-4 mt-4"
                        style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)" }}
                      >
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#14b8a6" }}>
                          Verdict
                        </p>
                        <p className="text-sm font-semibold leading-relaxed" style={{ color: "var(--flip-text-head)" }}>
                          {section.text}
                        </p>
                      </div>
                    );
                    return null;
                  })}
                  <Link
                    href={`/blog/${blogPost.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold mt-4 transition-colors hover:text-teal-400"
                    style={{ color: "#2dd4bf" }}
                  >
                    Read full review <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Performance ratings */}
              {paddle.ratings && (
                <div
                  className="rounded-2xl p-6 md:p-8"
                  style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart2 className="w-5 h-5" style={{ color: "#14b8a6" }} />
                    <h2 className="text-xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
                      Performance Profile
                    </h2>
                  </div>
                  <div className="space-y-6">
                    <PerformanceBar label="Power"      value={paddle.ratings.power}     />
                    <PerformanceBar label="Spin"       value={paddle.ratings.spin}      />
                    <PerformanceBar label="Pop"        value={paddle.ratings.pop}       />
                    <PerformanceBar label="Hand Speed" value={paddle.ratings.handSpeed} />
                    <PerformanceBar label="Control"    value={paddle.ratings.control}   />
                  </div>
                </div>
              )}

              {/* Weight & Balance — spec bars vs catalog avg */}
              <div
                className="rounded-2xl p-6 md:p-8"
                style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
              >
                <h2 className="text-xl font-extrabold mb-2" style={{ color: "var(--flip-text-head)" }}>
                  Weight & Balance
                </h2>
                <p className="text-xs mb-4" style={{ color: "var(--flip-text-muted)" }}>
                  How this paddle compares to {paddles.length}+ paddles in our database.
                </p>

                {paddle.swingWeight > 0 ? (
                  <SpecBar
                    label="Swing Weight"
                    value={paddle.swingWeight}
                    min={catalog.swingWeight.min}
                    max={catalog.swingWeight.max}
                    avg={catalog.swingWeight.avg}
                  />
                ) : (
                  <div className="flex items-center justify-between py-4">
                    <span className="text-sm font-semibold" style={{ color: "var(--flip-text-head)" }}>Swing Weight</span>
                    <span className="text-sm font-bold" style={{ color: "var(--flip-text-muted)" }}>TBD</span>
                  </div>
                )}
                {paddle.twistWeight > 0 ? (
                  <SpecBar
                    label="Twist Weight"
                    value={paddle.twistWeight}
                    min={catalog.twistWeight.min}
                    max={catalog.twistWeight.max}
                    avg={catalog.twistWeight.avg}
                  />
                ) : (
                  <div className="flex items-center justify-between py-4">
                    <span className="text-sm font-semibold" style={{ color: "var(--flip-text-head)" }}>Twist Weight</span>
                    <span className="text-sm font-bold" style={{ color: "var(--flip-text-muted)" }}>TBD</span>
                  </div>
                )}
                {parseFloat(paddle.weight) > 0 && (
                  <SpecBar
                    label="Static Weight"
                    value={parseFloat(paddle.weight)}
                    unit="oz"
                    min={catalog.weight.min}
                    max={catalog.weight.max}
                    avg={catalog.weight.avg}
                  />
                )}

                {/* Play style */}
                {paddle.playStyle && (
                  <div className="flex items-center justify-between pt-4 mt-2 border-t" style={{ borderColor: "var(--flip-divider)" }}>
                    <span className="text-sm font-semibold" style={{ color: "var(--flip-text-head)" }}>Play Style</span>
                    <span
                      className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                      style={{
                        background: paddle.playStyle === "power" ? "rgba(251,146,60,0.15)" : paddle.playStyle === "control" ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.15)",
                        color: paddle.playStyle === "power" ? "#fb923c" : paddle.playStyle === "control" ? "#818cf8" : "#4ade80",
                      }}
                    >
                      {STYLE_LABELS[paddle.playStyle] ?? paddle.playStyle}
                    </span>
                  </div>
                )}
              </div>

              {/* Specifications table */}
              <div
                className="rounded-2xl p-6 md:p-8"
                style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
              >
                <h2 className="text-xl font-extrabold mb-6" style={{ color: "var(--flip-text-head)" }}>
                  Specifications
                </h2>

                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--flip-text-muted)" }}>
                  Dimensions
                </p>
                <div className="mb-6">
                  <SpecRow label="Core Thickness" value={paddle.thickness} />
                  <SpecRow label="Shape"          value={paddle.shape} />
                  <SpecRow label="Weight"         value={paddle.weight} />
                  <SpecRow label="Swing Weight"   value={paddle.swingWeight || undefined} />
                  <SpecRow label="Twist Weight"   value={paddle.twistWeight || undefined} last />
                </div>

                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--flip-text-muted)" }}>
                  Classification
                </p>
                <div>
                  <SpecRow label="Brand"      value={paddle.brand} />
                  <SpecRow label="Play Style" value={STYLE_LABELS[paddle.playStyle ?? ""] ?? paddle.playStyle} last />
                </div>
              </div>
            </div>

            {/* Sidebar — sticky, hidden on mobile (price already in hero) */}
            <div className="hidden lg:block space-y-6 lg:sticky lg:top-[140px] self-start">
              {/* Price card */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--flip-text-muted)" }}>Price</p>
                <p className="text-3xl font-extrabold mb-3" style={{ color: "var(--flip-text-head)" }}>
                  {discountedPrice ?? paddle.price ?? "TBD"}
                </p>
                {!noCode && <DiscountCodeBox code={code} giftCard={giftCard} savings={savings} />}
                {hasLink && (
                  <a
                    href={paddle.discountLink}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="flex items-center justify-center gap-2 w-full font-bold text-sm py-3 rounded-xl text-white mt-3 transition-all active:scale-[0.98]"
                    style={{ background: "#14b8a6" }}
                  >
                    {noCode ? `Buy at ${paddle.brand}` : "Apply Discount"} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Featured in guides */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--flip-text-muted)" }}>
                  Featured In Our Guides
                </p>
                <Link
                  href="/best-pickleball-paddles"
                  className="text-sm font-semibold transition-colors hover:text-teal-400"
                  style={{ color: "#2dd4bf" }}
                >
                  Best Pickleball Paddles (2026) &rarr;
                </Link>
              </div>

              {/* Recommended Gear */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#14b8a6" }}>
                  Recommended Gear
                </p>
                <div className="space-y-4">
                  {featuredGear.map((gear) => (
                    <a
                      key={gear.id}
                      href={gear.link}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="flex items-center gap-3 group"
                    >
                      {gear.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={gear.image}
                          alt={gear.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          style={{ background: gear.bg }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate group-hover:text-teal-400 transition-colors" style={{ color: "var(--flip-text-head)" }}>
                          {gear.brand ? `${gear.brand} ` : ""}{gear.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--flip-text-muted)" }}>
                          {gear.price}{gear.badge ? ` · ${gear.badge}` : ""}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
                <Link
                  href="/gear"
                  className="inline-flex items-center gap-1 text-xs font-semibold mt-4 transition-colors hover:text-teal-400"
                  style={{ color: "#2dd4bf" }}
                >
                  View all gear <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Newsletter */}
              <SubstackCard variant="inline" />
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR (tab: who) ──────────────────────────────────────── */}
      <section id="who" className="py-16" style={{ background: "var(--flip-bg-card)" }}>
        <div className="container-xl max-w-3xl mx-auto">
          <WhoItsFor paddle={paddle} />

          {/* Buy CTA */}
          {hasLink && (
            <div
              className="rounded-2xl p-5 mt-8 flex items-center justify-between flex-wrap gap-4"
              style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--flip-text-head)" }}>
                {noCode
                  ? "Ready to buy? Use our link to support Playbook Reviews."
                  : <>Ready to buy? Use code <strong style={{ color: "#2dd4bf" }}>{code}</strong> for a discount.</>}
              </p>
              <a
                href={paddle.discountLink}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
                style={{ background: "#14b8a6" }}
              >
                Buy at {paddle.brand}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURED GEAR ──────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
              Gear We Recommend
            </h2>
            <Link
              href="/gear"
              className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:text-teal-400"
              style={{ color: "#2dd4bf" }}
            >
              All Gear <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {featuredGear.map((gear) => (
              <a
                key={gear.id}
                href={gear.link}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
                style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
              >
                {gear.image && (
                  <div className="aspect-[16/10] relative overflow-hidden" style={{ background: gear.bg }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gear.image}
                      alt={gear.name}
                      className="w-full h-full object-contain p-4"
                    />
                    {gear.badge && (
                      <span
                        className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
                        style={{ background: "#14b8a6" }}
                      >
                        {gear.badge}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm font-bold group-hover:text-teal-400 transition-colors" style={{ color: "var(--flip-text-head)" }}>
                    {gear.brand ? `${gear.brand} ` : ""}{gear.name}
                  </p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--flip-text-muted)" }}>
                    {gear.subtitle}
                  </p>
                  {gear.price && (
                    <p className="text-sm font-bold mt-2" style={{ color: "#2dd4bf" }}>
                      {gear.price}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT COMPARES ───────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container-xl">
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--flip-text-head)" }}>
            How {paddle.name} Compares
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--flip-text-muted)" }}>
            Paddles in the same category and price range.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <PaddleCard key={p.id} paddle={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEEL (tab: feel) ──────────────────────────────────────────────── */}
      <section id="feel" className="py-16" style={{ background: "var(--flip-bg-card)" }}>
        <div className="container-xl max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-8" style={{ color: "var(--flip-text-head)" }}>
            Playing Feel
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left — paddle image + play style badge */}
              <div
                className="relative flex items-center justify-center p-8"
                style={{ background: "var(--flip-bg-card)" }}
              >
                {paddle.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={paddle.image}
                    alt={`${paddle.brand} ${paddle.name} feel`}
                    className="w-full max-w-[220px] h-auto object-contain"
                  />
                )}
                {paddle.playStyle && (
                  <span
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full"
                    style={{
                      background: "rgba(20,184,166,0.15)",
                      color: "#2dd4bf",
                      border: "1px solid rgba(20,184,166,0.3)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {STYLE_LABELS[paddle.playStyle] ?? paddle.playStyle}
                  </span>
                )}
              </div>

              {/* Right — feel description + mini spec bars */}
              <div className="p-6 md:p-8 space-y-5">
                {paddle.description ? (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-body)" }}>
                    {paddle.description}
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-body)" }}>
                    The {paddle.brand} {paddle.name} is a {paddle.thickness} {paddle.shape.toLowerCase()} paddle
                    weighing {paddle.weight}{paddle.swingWeight > 0 ? ` with a swing weight of ${paddle.swingWeight}` : ""}{paddle.twistWeight > 0 ? ` and twist weight of ${paddle.twistWeight}` : ""}.
                    {paddle.playStyle === "power" && " Expect a firm, powerful feel with pop on drives and serves. The higher swing weight delivers momentum through contact, rewarding full swings."}
                    {paddle.playStyle === "control" && " Expect a soft, controlled feel that shines at the kitchen line. Dinks and resets feel plush, with excellent touch on drop shots."}
                    {paddle.playStyle === "all-court" && " Expect a balanced feel that handles dinks, drives, and everything in between. Neither too stiff nor too soft — it adapts to your game."}
                    {paddle.playStyle === "spin" && " Expect a textured surface with heavy bite on the ball. Topspin drives and angled dinks are where this paddle excels."}
                  </p>
                )}

                {/* Mini spec summary */}
                <div className="space-y-3 pt-3 border-t" style={{ borderColor: "var(--flip-divider)" }}>
                  {paddle.swingWeight > 0 && (
                    <SpecBar
                      label="Swing Weight"
                      value={paddle.swingWeight}
                      min={catalog.swingWeight.min}
                      max={catalog.swingWeight.max}
                      avg={catalog.swingWeight.avg}
                    />
                  )}
                  {paddle.twistWeight > 0 && (
                    <SpecBar
                      label="Twist Weight"
                      value={paddle.twistWeight}
                      min={catalog.twistWeight.min}
                      max={catalog.twistWeight.max}
                      avg={catalog.twistWeight.avg}
                    />
                  )}
                </div>

                {/* Key feel attributes */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "var(--flip-bg-card)", color: "var(--flip-text-head)", border: "1px solid var(--flip-card-border)" }}>
                    {paddle.thickness} Core
                  </span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "var(--flip-bg-card)", color: "var(--flip-text-head)", border: "1px solid var(--flip-card-border)" }}>
                    {paddle.shape}
                  </span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "var(--flip-bg-card)", color: "var(--flip-text-head)", border: "1px solid var(--flip-card-border)" }}>
                    {paddle.weight}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO REVIEW (tab: video) ──────────────────────────────────── */}
      <section id="video" className="py-16">
        <div className="container-xl max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--flip-text-head)" }}>
            Video Review
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--flip-card-border)" }}
          >
            <YouTubeEmbed
              videoId={videoId ?? ""}
              title={`${paddle.brand} ${paddle.name} — Full Review`}
            />
          </div>
          {!videoId && (
            <p className="text-sm mt-4 text-center" style={{ color: "var(--flip-text-muted)" }}>
              Video review coming soon. Subscribe to be notified.
            </p>
          )}
        </div>
      </section>

      {/* ── BLOG REVIEW (full) ──────────────────────────────────────────── */}
      {blogPost && (
        <section className="py-16" style={{ background: "var(--flip-bg-card)" }}>
          <div className="container-xl max-w-3xl mx-auto">

            <div className="flex items-center gap-2 mb-8">
              <BookOpen className="w-5 h-5" style={{ color: "#14b8a6" }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#14b8a6" }}>
                Written Review
              </p>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6" style={{ color: "var(--flip-text-head)" }}>
              {blogPost.title}
            </h2>

            <article>
              {blogPost.sections.map((section: BlogSection, i: number) => {
                if (section.type === "h2") return (
                  <h3 key={i} className="text-lg font-extrabold mt-7 mb-3" style={{ color: "var(--flip-text-head)" }}>
                    {section.text}
                  </h3>
                );
                if (section.type === "p") return (
                  <p key={i} className="text-base leading-relaxed mb-4" style={{ color: "var(--flip-text-body, var(--text-primary))" }}>
                    {section.text}
                  </p>
                );
                if (section.type === "ul") return (
                  <ul key={i} className="mb-4 space-y-1.5 pl-1">
                    {section.items?.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm" style={{ color: "var(--flip-text-body, var(--text-primary))" }}>
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#14b8a6" }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                );
                if (section.type === "verdict") return (
                  <div
                    key={i}
                    className="rounded-2xl p-5 my-6"
                    style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)" }}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
                      Verdict
                    </p>
                    <p className="text-base font-semibold leading-relaxed" style={{ color: "var(--flip-text-head)" }}>
                      {section.text}
                    </p>
                  </div>
                );
                return null;
              })}
            </article>

            <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--flip-divider)" }}>
              <Link
                href={`/blog/${blogPost.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-teal-400"
                style={{ color: "#2dd4bf" }}
              >
                Read full review post <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── DISCUSSION (tab: discussion) ──────────────────────────────── */}
      <section id="discussion" className="py-16">
        <div className="container-xl max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--flip-text-head)" }}>
            Discussion
          </h2>

          {/* Community reviews portal target */}
          <div id="community-reviews" className="mb-6" />

          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
          >
            <p className="text-sm mb-4" style={{ color: "var(--flip-text-body)" }}>
              Have questions or thoughts about the {paddle.brand} {paddle.name}? Join the conversation.
            </p>
            <ReactionButtons paddleId={paddle.id} />
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION (SEO) ──────────────────────────────────────────── */}
      <section className="py-16" style={{ background: "var(--flip-bg-card)" }}>
        <div className="container-xl max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-8" style={{ color: "var(--flip-text-head)" }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold mb-2" style={{ color: "var(--flip-text-head)" }}>
                What is the swing weight of the {paddle.brand} {paddle.name}?
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-body)" }}>
                {paddle.swingWeight > 0
                  ? `The ${paddle.brand} ${paddle.name} has a swing weight of ${paddle.swingWeight}, which is ${paddle.swingWeight > catalog.swingWeight.avg ? "above" : paddle.swingWeight < catalog.swingWeight.avg * 0.97 ? "below" : "near"} the catalog average of ${catalog.swingWeight.avg}.`
                  : `Swing weight data for the ${paddle.brand} ${paddle.name} is not yet available. Check back soon.`}
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2" style={{ color: "var(--flip-text-head)" }}>
                Who should buy the {paddle.brand} {paddle.name}?
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-body)" }}>
                The {paddle.brand} {paddle.name} is a {paddle.shape.toLowerCase()} {paddle.thickness} paddle best suited for {paddle.playStyle === "all-court" ? "all-court players who want a versatile, balanced paddle" : paddle.playStyle === "power" ? "power-oriented players who want pop and drive on their shots" : paddle.playStyle === "control" ? "control-focused players who want touch and precision at the kitchen" : "spin-heavy players who rely on surface texture and paddle angle"}.
              </p>
            </div>
            <div>
              <h3 className="text-base font-bold mb-2" style={{ color: "var(--flip-text-head)" }}>
                Is there a discount code for the {paddle.brand} {paddle.name}?
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-body)" }}>
                {paddle.amountOff && paddle.amountOff !== "$0"
                  ? `Yes! Use code ${code} at checkout to save ${paddle.amountOff} on the ${paddle.brand} ${paddle.name}. This code is verified and active.`
                  : `Check Pickleball Playbook regularly for the latest deals and discount codes for the ${paddle.brand} ${paddle.name}.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ────────────────────────────────────────────────────── */}
      <section className="py-10">
        <div className="container-xl max-w-3xl mx-auto">
          <SubstackCard variant="banner" />
        </div>
      </section>

    </div>

    {/* ── STICKY BOTTOM BAR ─────────────────────────────────────────────── */}
    <StickyBottomBar
      name={paddle.name}
      brand={paddle.brand}
      price={discountedPrice ?? paddle.price}
      discountLink={paddle.discountLink}
      slug={paddle.slug}
    />
    </>
  );
}
