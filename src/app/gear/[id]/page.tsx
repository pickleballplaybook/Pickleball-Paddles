import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { gearProducts } from "@/data/products";
import { siteConfig } from "@/config/site";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import ViewCounter from "@/components/ViewCounter";
import PaddleStarRating from "@/components/PaddleStarRating";
import ExternalReviewBadge from "@/components/ExternalReviewBadge";

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
    title: `${fullName} Review — ${product.badge || "Best Deal"} | Pickleball Playbook`,
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

  // JSON-LD
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />

      <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl py-10">

          {/* Back nav */}
          <Link
            href="/gear"
            className="inline-flex items-center gap-1.5 text-sm mb-10 transition-colors hover:text-brand-500"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            All Gear
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Image */}
            <div
              className="rounded-3xl overflow-hidden w-full"
              style={{ background: product.bg, aspectRatio: "1/1" }}
            >
              {product.imageAspect !== "none" && product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
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
                    background: "rgba(20,184,166,0.15)",
                    color: "#2dd4bf",
                    border: "1px solid rgba(20,184,166,0.35)",
                  }}
                >
                  {product.badge}
                </span>
              )}

              <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">
                {product.brand}
              </p>

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
                      <span className="text-xl font-semibold line-through" style={{ color: "var(--text-muted)" }}>
                        {product.price}
                      </span>
                      <span className="text-3xl font-extrabold" style={{ color: "#2dd4bf" }}>
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
                  background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                  boxShadow: "0 0 32px rgba(20,184,166,0.35), 0 4px 12px rgba(0,0,0,0.25)",
                }}
              >
                {product.ctaText}
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </a>

              <p className="text-[11px] mb-8" style={{ color: "var(--text-muted)" }}>
                Affiliate link. We may earn a commission — it never affects our recommendations.
              </p>

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
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#14b8a6" }}>
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

          {/* Austin's Take */}
          {product.description && (
            <div className="mt-14 max-w-3xl">
              <div
                className="rounded-2xl p-6 md:p-8"
                style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#14b8a6" }}>
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
                style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)" }}
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
                  style={{ background: "#14b8a6" }}
                >
                  {product.ctaText} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Video review */}
          {product.videoId && (
            <div className="mt-14 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#14b8a6" }}>
                Video Review
              </p>
              <YouTubeEmbed videoId={product.videoId} title={`${fullName} Review`} />
            </div>
          )}

          {/* Community reviews */}
          <div id="discussion" className="mt-14 max-w-3xl scroll-mt-40">
            <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--text-primary)" }}>
              Reviews
            </h2>
            <div id="community-reviews" />
          </div>

        </div>
      </div>
    </>
  );
}
