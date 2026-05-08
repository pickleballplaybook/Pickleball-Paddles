import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getPaddleBySlug, paddles } from "@/data/paddles";
import { fetchPlaylistVideos, getVideoForPaddle } from "@/lib/youtube";
import { siteConfig } from "@/config/site";
import PerformanceBar from "@/components/PerformanceBar";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import SubstackCard from "@/components/SubstackCard";
import PaddleCard from "@/components/PaddleCard";
import { ArrowLeft, ArrowRight, BarChart2, ExternalLink, BookOpen } from "lucide-react";
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
    title: `${paddle.name} (${paddle.shape}) | ${paddle.brand} | Pickleball Playbook`,
    description: `${paddle.brand} ${paddle.name} specs, review, and discount. Use code ${code} at checkout. ${paddle.thickness} core · ${paddle.weight} · Swing Weight ${paddle.swingWeight}.`,
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

function isSelkirkGiftCard(brand: string, amountOff: string): boolean {
  return (brand === "Selkirk" || brand === "SLK") && (amountOff === "$0" || amountOff === "" || !amountOff);
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
  power:       "Power Hitter",
  control:     "Control Player",
  "all-court": "All-Court",
  spin:        "Spin Specialist",
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

  const related   = paddles.filter((p) => p.id !== paddle.id).slice(0, 3);
  const blogPost  = getBlogPostForPaddle(params.slug);
  const code           = getDiscountCode(paddle.brand, paddle.discountLink);
  const giftCard       = isSelkirkGiftCard(paddle.brand, paddle.amountOff);
  const savings        = savingsDisplay(paddle.amountOff);
  const hasLink        = !!paddle.discountLink?.trim();
  const discountedPrice = paddle.price && paddle.amountOff
    ? calcDiscountedPrice(paddle.price, paddle.amountOff)
    : null;

  // ── JSON-LD Product schema (powers Google star ratings in search results) ────
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <div className="min-h-screen pt-[156px]" style={{ background: "var(--flip-bg)" }}>

      {/* Back nav */}
      <div className="container-xl pt-8 mb-6">
        <Link
          href="/paddles"
          className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-brand-500"
          style={{ color: "var(--flip-text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          All Paddles
        </Link>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="container-xl pb-16">
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
                  {paddle.playStyle === "all-court" ? "All-Court" : paddle.playStyle === "power" ? "Power" : paddle.playStyle === "control" ? "Control" : paddle.playStyle}
                </span>
              )}
            </div>

            {paddle.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={paddle.image} alt={paddle.name} className="w-full h-full object-contain p-10" />
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

            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
              {paddle.brand}
            </p>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] mb-1"
              style={{ color: "var(--flip-text-head)" }}
            >
              {paddle.name}
            </h1>

            {paddle.tagline && (
              <p className="text-lg font-light mb-6" style={{ color: "var(--flip-text-body)" }}>
                {paddle.tagline}
              </p>
            )}

            {/* Price display */}
            {paddle.price && (
              <div className="flex items-baseline gap-3 mb-5">
                {discountedPrice ? (
                  <>
                    <span
                      className="text-2xl font-semibold line-through"
                      style={{ color: "var(--flip-text-muted)" }}
                    >
                      {paddle.price}
                    </span>
                    <span className="text-4xl font-extrabold" style={{ color: "#2dd4bf" }}>
                      {discountedPrice}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
                    {paddle.price}
                  </span>
                )}
              </div>
            )}

            {/* Discount / code box */}
            <DiscountCodeBox code={code} giftCard={giftCard} savings={savings} />

            {/* Get Discount / Link Coming Soon */}
            {hasLink ? (
              <a
                href={paddle.discountLink}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full font-bold text-base py-4 rounded-2xl text-white transition-all duration-200 active:scale-[0.98] mb-6"
                style={{ background: "#14b8a6" }}
              >
                Get Discount
                <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
              </a>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 w-full font-bold text-base py-4 rounded-2xl cursor-not-allowed mb-6"
                style={{
                  background: "var(--flip-bg-card)",
                  color: "var(--flip-text-muted)",
                  border: "1px solid var(--flip-card-border)",
                }}
              >
                Link Coming Soon
              </button>
            )}

            {/* Star ratings */}
            <PaddleStarRating paddleId={paddle.id} />

            {/* View count */}
            <div className="mb-4">
              <ViewCounter slug={paddle.slug} type="paddle" />
            </div>

            {/* Specs grid */}
            <div
              className="rounded-2xl px-6 py-1 mb-6"
              style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
            >
              <SpecRow label="Brand"        value={paddle.brand}       />
              <SpecRow label="Shape"        value={paddle.shape}       />
              <SpecRow label="Weight"       value={paddle.weight}      />
              <SpecRow label="Swing Weight" value={paddle.swingWeight} />
              <SpecRow label="Twist Weight" value={paddle.twistWeight} />
              <SpecRow label="Thickness"    value={paddle.thickness}   last />
            </div>

            {/* Save / React */}
            <div className="mt-3">
              <ReactionButtons paddleId={paddle.id} />
            </div>
          </div>
        </div>
      </section>

      {/* ── PERFORMANCE METRICS ───────────────────────────────────────────── */}
      {paddle.ratings && (
        <section className="py-16" style={{ background: "var(--flip-bg-card)" }}>
          <div className="container-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

              <div>
                <div className="flex items-center gap-2 mb-8">
                  <BarChart2 className="w-5 h-5" style={{ color: "#14b8a6" }} />
                  <h2 className="text-2xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
                    Performance Metrics
                  </h2>
                </div>
                <div
                  className="rounded-2xl p-6 space-y-8"
                  style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)" }}
                >
                  <PerformanceBar label="Power"      value={paddle.ratings.power}     />
                  <PerformanceBar label="Spin"       value={paddle.ratings.spin}      />
                  <PerformanceBar label="Pop"        value={paddle.ratings.pop}       />
                  <PerformanceBar label="Hand Speed" value={paddle.ratings.handSpeed} />
                  <PerformanceBar label="Control"    value={paddle.ratings.control}   />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold mb-8" style={{ color: "var(--flip-text-head)" }}>
                  Play Style Match
                </h2>
                <div
                  className="rounded-2xl p-6 space-y-4"
                  style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)" }}
                >
                  {paddle.description && (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-body)" }}>
                      {paddle.description}
                    </p>
                  )}
                  {paddle.playStyle && (
                    <div className="pt-4 border-t" style={{ borderColor: "var(--flip-divider)" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                         style={{ color: "var(--flip-text-muted)" }}>Best for</p>
                      <span
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold"
                        style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.2)" }}
                      >
                        {STYLE_LABELS[paddle.playStyle] ?? paddle.playStyle}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Play Style Match — no ratings */}
      {!paddle.ratings && (paddle.playStyle || paddle.description) && (
        <section className="py-16" style={{ background: "var(--flip-bg-card)" }}>
          <div className="container-xl max-w-2xl">
            <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--flip-text-head)" }}>
              Play Style Match
            </h2>
            <div
              className="rounded-2xl p-6 space-y-4"
              style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)" }}
            >
              {paddle.description && (
                <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-body)" }}>
                  {paddle.description}
                </p>
              )}
              {paddle.playStyle && (
                <div className="pt-4 border-t" style={{ borderColor: "var(--flip-divider)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                     style={{ color: "var(--flip-text-muted)" }}>Best for</p>
                  <span
                    className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.2)" }}
                  >
                    {STYLE_LABELS[paddle.playStyle] ?? paddle.playStyle}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── VIDEO REVIEW ──────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container-xl max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
              Video Review
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
              {videoId ? "Watch Full Paddle Review" : "No Review Yet"}
            </h2>
          </div>
          <YouTubeEmbed
            videoId={videoId ?? ""}
            title={`${paddle.name} — Full Review`}
          />
        </div>
      </section>

      {/* ── BLOG REVIEW ───────────────────────────────────────────────────── */}
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

      {/* ── BUY CTA ───────────────────────────────────────────────────────── */}
      {hasLink && (
        <section
          className="py-12"
          style={{
            background: "rgba(20,184,166,0.06)",
            borderTop: "1px solid rgba(20,184,166,0.12)",
            borderBottom: "1px solid rgba(20,184,166,0.12)",
          }}
        >
          <div className="container-xl max-w-2xl mx-auto text-center">
            <p className="font-bold text-xl mb-2" style={{ color: "var(--flip-text-head)" }}>
              Ready to grab the{" "}
              <span style={{ color: "#2dd4bf" }}>{paddle.name}</span>?
            </p>
            <p className="mb-6 text-sm" style={{ color: "var(--flip-text-body)" }}>
              {giftCard
                ? `Use code ${code} for a free e-gift card with your purchase.`
                : `Use code ${code} at checkout${savings ? ` — ${savings}` : ""}.`}
            </p>
            <a
              href={paddle.discountLink}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-2 font-bold text-base px-10 py-4 rounded-2xl text-white transition-all duration-200 active:scale-[0.98]"
              style={{ background: "#14b8a6" }}
            >
              Get Discount
              <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
            </a>
          </div>
        </section>
      )}

      {/* ── NEWSLETTER ────────────────────────────────────────────────────── */}
      <section className="py-10">
        <div className="container-xl max-w-3xl mx-auto">
          <SubstackCard variant="banner" />
        </div>
      </section>

      {/* ── RELATED PADDLES ───────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: "var(--flip-bg-card)" }}>
        <div className="container-xl">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-extrabold" style={{ color: "var(--flip-text-head)" }}>
              More Paddles
            </h2>
            <Link
              href="/paddles"
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-brand-400"
              style={{ color: "#14b8a6" }}
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <PaddleCard key={p.id} paddle={p} />
            ))}
          </div>
        </div>
      </section>

    </div>
    </>
  );
}
