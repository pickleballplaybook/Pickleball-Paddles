import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Star, ExternalLink, ChevronRight } from "lucide-react";
import { gearProducts } from "@/data/products";
import { siteConfig } from "@/config/site";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import AutoCutVideo from "@/components/AutoCutVideo";
import ViewCounter from "@/components/ViewCounter";
import PaddleStarRating from "@/components/PaddleStarRating";
import ExternalReviewBadge from "@/components/ExternalReviewBadge";
import gearContent from "@/data/gear-content.json";

type GearLongFormContent = {
  overview: string;
  useCases: { title: string; description: string }[];
};

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return gearProducts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = gearProducts.find((p) => p.id === params.id);
  if (!product) return {};
  const url = `${siteConfig.siteUrl}/gear/${product.id}`;
  const fullName = `${product.brand ? product.brand + " " : ""}${product.name}`;
  return {
    title: `${fullName} Review — ${product.badge || "Best Deal"}`,
    description: `${fullName} review — ${product.subtitle} ${product.price !== "Free" ? `Currently ${product.price}${product.badge ? ` with ${product.badge}` : ""}.` : ""} Independently reviewed by Pickleball Playbook.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${fullName} — ${product.badge || "Gear Review"}`,
      description: product.subtitle,
      url,
      type: "article",
      siteName: siteConfig.name,
      ...(product.image ? { images: [{ url: `${siteConfig.siteUrl}${product.image}`, alt: fullName }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullName} — ${product.badge || "Review"}`,
      description: product.subtitle,
    },
  };
}

function calcDiscountedPrice(price: string, badge: string): string | null {
  if (!price || price === "Free" || !badge) return null;
  const base = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (isNaN(base) || base <= 0) return null;

  // "$250 Off" style
  const dollarMatch = badge.match(/\$(\d[\d,]*)/);
  if (dollarMatch) {
    const off = parseFloat(dollarMatch[1].replace(/,/g, ""));
    if (!isNaN(off) && off > 0) {
      const discounted = base - off;
      return discounted > 0 ? `$${discounted.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : null;
    }
  }

  // "20% Off" style
  const pctMatch = badge.match(/(\d+)%/);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    if (!isNaN(pct) && pct > 0) {
      const discounted = base * (1 - pct / 100);
      return discounted > 0 ? `$${discounted.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : null;
    }
  }

  return null;
}

export default function GearProductPage({ params }: Props) {
  const product = gearProducts.find((p) => p.id === params.id);
  if (!product) notFound();

  const fullName = `${product.brand ? product.brand + " " : ""}${product.name}`;
  const discountedPrice = calcDiscountedPrice(product.price, product.badge);
  const hasPrice = product.price && product.price !== "Free";

  // Long-form SEO content — overview + use cases. Populated by
  // scripts/generate-gear-content.ts. Missing entries render nothing.
  const longForm = (gearContent as Record<string, GearLongFormContent>)[product.id] as GearLongFormContent | undefined;

  // JSON-LD — Product, Breadcrumb, FAQ (when present). Browsers ignore;
  // Google reads them to enable rich results (price + review snippets,
  // breadcrumb trail in SERPs, FAQ accordion under the listing).
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": fullName,
    ...(product.brand ? { "brand": { "@type": "Brand", "name": product.brand } } : {}),
    "description": product.subtitle,
    "image": product.image ? `${siteConfig.siteUrl}${product.image}` : undefined,
    ...(hasPrice ? {
      "offers": {
        "@type": "Offer",
        "priceCurrency": "USD",
        "price": parseFloat(product.price.replace(/[^0-9.]/g, "")).toFixed(2),
        "availability": "https://schema.org/InStock",
        "url": product.link,
      },
    } : {}),
    "review": {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Austin Hardy" },
      "publisher": { "@type": "Organization", "name": "Pickleball Playbook" },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteConfig.siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Gear", "item": `${siteConfig.siteUrl}/gear` },
      { "@type": "ListItem", "position": 3, "name": fullName, "item": `${siteConfig.siteUrl}/gear/${product.id}` },
    ],
  };

  const faqSchema = product.faqs && product.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": product.faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  } : null;

  // Article JSON-LD — emitted whenever long-form overview content exists.
  // Tells Google this page is a substantive editorial review, not just a
  // product listing, which unlocks article-type rich results.
  const articleSchema = longForm?.overview ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${fullName} Review and Buying Guide`,
    "author": { "@type": "Person", "name": "Austin Hardy", "url": `${siteConfig.siteUrl}/about` },
    "publisher": {
      "@type": "Organization",
      "name": siteConfig.name,
      "url": siteConfig.siteUrl,
    },
    "image": product.image ? `${siteConfig.siteUrl}${product.image}` : undefined,
    "articleBody": longForm.overview,
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${siteConfig.siteUrl}/gear/${product.id}` },
  } : null;

  const reviewsHost = product.reviewsUrl ? (() => {
    try { return new URL(product.reviewsUrl).hostname.replace(/^www\./, ""); } catch { return null; }
  })() : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      {articleSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      )}

      <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl py-10">

          {/* Breadcrumb nav — matches the JSON-LD breadcrumb so users and
              search engines see the same path. */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="inline-flex flex-wrap items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
              <li>
                <Link href="/" className="transition-colors hover:text-brand-500">Home</Link>
              </li>
              <li aria-hidden><ChevronRight className="w-3.5 h-3.5" /></li>
              <li>
                <Link href="/gear" className="inline-flex items-center gap-1 transition-colors hover:text-brand-500">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  All Gear
                </Link>
              </li>
              <li aria-hidden><ChevronRight className="w-3.5 h-3.5" /></li>
              <li aria-current="page" style={{ color: "var(--text-primary)" }} className="font-semibold">
                {fullName}
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Image — renders as-is so manufacturer shots with baked-in
                white backgrounds keep their intended look. Transparent PNGs
                sit on the radial-gradient backdrop. */}
            <div
              className="rounded-3xl overflow-hidden w-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 35%, var(--product-bg-spotlight) 0%, var(--product-bg-base) 100%)",
                aspectRatio: "1/1",
              }}
            >
              {product.imageAspect !== "none" && (product.featuredImage || product.image) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.featuredImage ?? product.image}
                  alt={`${fullName} for pickleball`}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                    No image
                  </p>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">

              {product.badge && (
                <span
                  className="self-start text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
                  style={{
                    background: "rgba(10, 100, 188,0.30)",
                    color: "#60a5fa",
                    border: "1px solid rgba(10, 100, 188,0.35)",
                  }}
                >
                  {product.badge}
                </span>
              )}

              <div className="flex items-center gap-2 flex-wrap mb-2">
                <p
                  className="inline-block text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded"
                  style={{ background: "#DC2626", color: "#ffffff", border: "2px solid #ffffff", boxShadow: "0 0 0 1px #DC2626" }}
                >
                  {product.brand}
                </p>
              </div>

              <h1
                className="font-extrabold tracking-tight leading-tight mb-3"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--text-primary)" }}
              >
                {product.name}
              </h1>

              {/* Price with strikethrough + discounted */}
              {hasPrice && (
                <div className="flex items-baseline gap-3 mb-5">
                  {discountedPrice ? (
                    <>
                      <span className="text-2xl font-semibold line-through" style={{ color: "var(--text-muted)" }}>
                        {product.price}
                      </span>
                      <span className="text-3xl font-extrabold" style={{ color: "#60a5fa" }}>
                        {discountedPrice}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                      {product.price}
                    </span>
                  )}
                </div>
              )}

              <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
                {product.subtitle}
              </p>

              {/* "Best for" callout — one-line audience targeting that
                  helps the right shopper self-identify in seconds. */}
              {product.bestFor && (
                <div
                  className="rounded-xl px-4 py-3 mb-5 flex items-start gap-3"
                  style={{ background: "rgba(10, 100, 188,0.28)", border: "1px solid rgba(10, 100, 188,0.30)" }}
                >
                  <Star className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#60a5fa" }} />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#60a5fa" }}>
                      Best For
                    </p>
                    <p className="text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                      {product.bestFor}
                    </p>
                  </div>
                </div>
              )}

              {/* Star ratings */}
              <div className="flex items-center gap-4 mb-1">
                <PaddleStarRating paddleId={`gear-${product.id}`} />
              </div>

              {/* External review badge */}
              <div className="mb-2">
                <ExternalReviewBadge paddleSlug={`gear-${product.id}`} />
              </div>

              <div className="mb-6">
                <ViewCounter slug={product.id} type="gear" />
              </div>

              <a
                href={product.link}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="self-start inline-flex items-center gap-2 font-bold text-base px-8 py-4 rounded-2xl text-white transition-all duration-200 active:scale-[0.97] mb-2"
                style={{
                  background: "#0a64bc",
                  border: "2px solid #ffffff",
                  boxShadow: "0 0 0 1px #0a64bc, 0 0 32px rgba(10,100,188,0.35), 0 4px 12px rgba(0,0,0,0.25)",
                }}
              >
                {product.ctaText}
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </a>

              <p className="text-[11px] mb-8" style={{ color: "var(--text-muted)" }}>
                Affiliate link. We may earn a commission — it never affects our recommendations.
              </p>

              {/* Highlights — quick-scan bullet list of standout benefits. */}
              {product.highlights && product.highlights.length > 0 && (
                <div
                  className="rounded-2xl p-5 mb-8"
                  style={{ background: "var(--bg-section)", border: "1px solid var(--border)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#60a5fa" }}>
                    Why We Recommend It
                  </p>
                  <ul className="flex flex-col gap-3">
                    {product.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#60a5fa" }} />
                        <span className="text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.features && (
                <pre
                  className="text-sm leading-relaxed mb-8 whitespace-pre-wrap font-sans p-5 rounded-2xl"
                  style={{
                    color: "var(--text-secondary)",
                    background: "var(--bg-section)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {product.features}
                </pre>
              )}

              {/* Specs table */}
              {product.specs && product.specs.length > 0 && (
                <div
                  className="rounded-2xl p-5 mb-8"
                  style={{ background: "var(--bg-section)", border: "1px solid var(--border)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#60a5fa" }}>
                    Specifications
                  </p>
                  {product.specs.map((spec, i) => (
                    <div
                      key={spec.label}
                      className={`flex items-center justify-between py-3 ${i < product.specs!.length - 1 ? "border-b" : ""}`}
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{spec.label}</span>
                      <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* Overview & Buying Guide — long-form AI-generated SEO content.
              Targets the high-intent "<product name> review" query. */}
          {longForm?.overview && (
            <section className="mt-14 max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-6" style={{ color: "var(--text-primary)" }}>
                {fullName} Review &amp; Buying Guide
              </h2>
              <div
                className="rounded-2xl p-6 md:p-8"
                style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {longForm.overview.split("\n\n").map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-base leading-relaxed mb-4 last:mb-0"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Use cases — "Who is this for?" card grid. Each card targets a
              long-tail search intent like "best <category> for <player type>". */}
          {longForm?.useCases && longForm.useCases.length > 0 && (
            <section className="mt-14 max-w-4xl">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-6" style={{ color: "var(--text-primary)" }}>
                Who Is the {fullName} For?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {longForm.useCases.map((uc, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-5"
                    style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
                      {uc.title}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {uc.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Austin's Take */}
          {product.description && (
            <div className="mt-14 max-w-3xl">
              <div
                className="rounded-2xl p-6 md:p-8"
                style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#60a5fa" }}>
                  Austin&apos;s Take
                </p>
                {product.description.split("\n\n").map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-sm leading-relaxed mb-4 last:mb-0"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Second CTA — conversion nudge after reading Austin's Take */}
          {product.badge && (
            <div className="mt-10 max-w-3xl">
              <div
                className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
                style={{ background: "rgba(10, 100, 188,0.23)", border: "1px solid rgba(10, 100, 188,0.30)" }}
              >
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    Ready to level up your game?
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Get {product.badge.toLowerCase()} through our exclusive link. Limited time offer.
                  </p>
                </div>
                <a
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:scale-[1.02] flex-shrink-0"
                  style={{ background: "#0a64bc", border: "2px solid #ffffff", boxShadow: "0 0 0 1px #0a64bc" }}
                >
                  {product.ctaText} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Video review — YouTube first, then local MP4 as fallback. */}
          {product.videoId ? (
            <div className="mt-14 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#60a5fa" }}>
                Video Review
              </p>
              <YouTubeEmbed videoId={product.videoId} title={`${fullName} Review`} />
            </div>
          ) : product.videoUrl ? (
            <div className="mt-14 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#60a5fa" }}>
                On-Court Video
              </p>
              <AutoCutVideo
                src={product.videoUrl}
                poster={product.image}
                className="w-full rounded-2xl"
                style={{ aspectRatio: "16 / 9", background: "#000" }}
              />
            </div>
          ) : null}

          {/* FAQ — surfaced before reviews so shoppers find common
              answers fast. Mirrors the FAQPage JSON-LD above for SEO. */}
          {product.faqs && product.faqs.length > 0 && (
            <div className="mt-14 max-w-3xl">
              <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--text-primary)" }}>
                Frequently Asked Questions
              </h2>
              <div className="flex flex-col gap-3">
                {product.faqs.map((f, i) => (
                  <details
                    key={i}
                    className="group rounded-2xl px-5 py-4"
                    style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                      <span className="text-base font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
                        {f.q}
                      </span>
                      <ChevronRight
                        className="w-4 h-4 mt-1 flex-shrink-0 transition-transform group-open:rotate-90"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </summary>
                    <p className="text-sm leading-relaxed mt-3" style={{ color: "var(--text-muted)" }}>
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Community reviews — plus an outbound link to the brand's own
              customer reviews page when provided (non-affiliate, so shoppers
              can vet feedback independently before clicking through the
              discount link). */}
          <div id="discussion" className="mt-14 max-w-3xl scroll-mt-40">
            <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
              <h2 className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                Reviews
              </h2>
              {product.reviewsUrl && reviewsHost && (
                <a
                  href={product.reviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-brand-500"
                  style={{ color: "#60a5fa" }}
                >
                  Customer reviews on {reviewsHost}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            <div id="community-reviews" />
          </div>

        </div>
      </div>
    </>
  );
}
