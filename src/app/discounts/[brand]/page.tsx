import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Tag, ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import { brands, getBrandBySlug } from "@/data/brands";
import { paddles } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import DiscountCodeBox from "@/components/DiscountCodeBox";
import AffiliateBuyButton from "@/components/AffiliateBuyButton";

interface Props {
  params: { brand: string };
}

function getCode(brandName: string, discountLink?: string): string {
  if (brandName === "Selkirk" || brandName === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

function getBrandPaddles(brandName: string) {
  return paddles
    .filter((p) => p.brand === brandName && p.discountLink?.trim())
    .sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));
}

function getBestDiscount(brandPaddles: ReturnType<typeof getBrandPaddles>): string {
  const amounts = brandPaddles
    .map((p) => p.amountOff)
    .filter((a): a is string => !!a && a !== "$0" && a !== "");
  if (!amounts.length) return "";
  // Prefer percentage discounts, then dollar amounts
  const pct = amounts.find((a) => a.includes("%"));
  return pct ?? amounts[0];
}

export function generateStaticParams() {
  const brandsWithDeals = new Set(
    paddles
      .filter((p) => p.discountLink?.trim())
      .map((p) => p.brand)
  );
  return brands
    .filter((b) => brandsWithDeals.has(b.name))
    .map((b) => ({ brand: b.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const brand = getBrandBySlug(params.brand);
  if (!brand) return {};
  const bp = getBrandPaddles(brand.name);
  const discount = getBestDiscount(bp);
  const code = getCode(brand.name, bp[0]?.discountLink);
  const url = `${siteConfig.siteUrl}/discounts/${brand.slug}`;
  const title = discount
    ? `${brand.name} Discount Code — ${discount} Off Pickleball Paddles`
    : `${brand.name} Discount Code — Pickleball Paddles`;
  const description = `Use code ${code} to save ${discount ? `${discount} ` : ""}on ${brand.name} pickleball paddles. ${bp.length} paddle${bp.length === 1 ? "" : "s"} available with exclusive Playbook Reviews discount.`;

  return {
    title,
    description,
    keywords: [
      `${brand.name} discount code`,
      `${brand.name} pickleball promo code`,
      `${brand.name} pickleball coupon`,
      `${brand.name} pickleball discount`,
      `${brand.name} paddle sale`,
      "pickleball discount code",
      "PLAYBOOK discount",
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: siteConfig.name,
      images: brand.logo ? [{ url: `${siteConfig.siteUrl}${brand.logo}`, alt: `${brand.name} logo` }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function BrandDiscountPage({ params }: Props) {
  const brand = getBrandBySlug(params.brand);
  if (!brand) notFound();

  const bp = getBrandPaddles(brand.name);
  if (!bp.length) notFound();

  const discount = getBestDiscount(bp);
  const code = getCode(brand.name, bp[0]?.discountLink);
  const isSelkirk = brand.name === "Selkirk" || brand.name === "SLK";
  const pageUrl = `${siteConfig.siteUrl}/discounts/${brand.slug}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.siteUrl },
      { "@type": "ListItem", position: 2, name: "Discounts", item: `${siteConfig.siteUrl}/discounts` },
      { "@type": "ListItem", position: 3, name: `${brand.name} Discount Code`, item: pageUrl },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the ${brand.name} pickleball discount code?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Use code ${code} at checkout on ${brand.name}'s website to save${discount ? ` ${discount}` : ""} on pickleball paddles. The code is negotiated exclusively through Playbook Reviews.`,
        },
      },
      {
        "@type": "Question",
        name: `Does ${brand.name} offer pickleball paddle discounts?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes — ${brand.name} offers${discount ? ` ${discount} off` : " a discount"} when you use code ${code} at checkout. This applies to their current paddle lineup including ${bp.slice(0, 3).map((p) => p.name).join(", ")}.`,
        },
      },
      {
        "@type": "Question",
        name: `How do I use the ${brand.name} promo code?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Click any "Shop" button on this page — it opens ${brand.name}'s website with the discount link pre-applied. At checkout, make sure the code ${code} appears in the promo/discount field. If it doesn't apply automatically, enter it manually.`,
        },
      },
      {
        "@type": "Question",
        name: `Which ${brand.name} paddles have a discount?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `All ${bp.length} ${brand.name} paddle${bp.length === 1 ? "" : "s"} listed on this page are eligible for the discount code. This includes: ${bp.map((p) => p.name).join(", ")}.`,
        },
      },
    ],
  };

  const offersSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brand.name} Pickleball Paddles with Discount`,
    description: `${brand.name} pickleball paddles available with code ${code}`,
    numberOfItems: bp.length,
    itemListElement: bp.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: `${p.brand} ${p.name}`,
        url: `${siteConfig.siteUrl}/paddles/${p.slug}`,
        image: p.image ? `${siteConfig.siteUrl}${p.image}` : undefined,
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: p.price ? parseFloat(p.price.replace(/[^0-9.]/g, "")).toFixed(2) : undefined,
          availability: "https://schema.org/InStock",
          url: p.discountLink,
        },
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offersSchema) }} />

      <div className="min-h-screen pt-[156px] pb-24" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl py-12 max-w-5xl mx-auto">

          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <li><Link href="/" className="hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>Home</Link></li>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <li><Link href="/discounts" className="hover:opacity-70 transition-opacity" style={{ color: "var(--text-muted)" }}>Discounts</Link></li>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <li style={{ color: "var(--text-primary)" }}>{brand.name}</li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="rounded-3xl p-8 md:p-12 mb-10" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex flex-col md:flex-row md:items-center gap-8">

              {/* Brand logo */}
              <div className="flex-shrink-0 flex items-center justify-center w-32 h-32 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {brand.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.logo} alt={`${brand.name} logo`} className="max-h-16 max-w-[100px] object-contain" />
                ) : (
                  <Tag className="w-10 h-10" style={{ color: "#60a5fa" }} />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4" style={{ color: "#60a5fa" }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#60a5fa" }}>
                    Exclusive Discount
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
                  {brand.name} Discount Code{discount ? ` — ${discount} Off` : ""}
                </h1>
                <p className="text-base mb-6 max-w-xl" style={{ color: "var(--text-muted)" }}>
                  {brand.description}
                </p>

                {/* Code + CTA row */}
                <div className="flex flex-wrap items-center gap-4">
                  <DiscountCodeBox code={code} savings={discount || undefined} />
                  <AffiliateBuyButton
                    href={brand.storeLink ?? bp[0].discountLink!}
                    code={code}
                    className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
                    style={{ background: "#0a64bc" }}
                  >
                    Shop {brand.name} <ExternalLink className="w-4 h-4" />
                  </AffiliateBuyButton>
                </div>

                {isSelkirk && (
                  <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    Note: code <strong style={{ color: "var(--text-primary)" }}>INF-PLAYBOOK</strong> applies at selkirk.com — paddles sold via Locker Room Pickleball use <strong style={{ color: "var(--text-primary)" }}>PLAYBOOK</strong> instead.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {[
              { step: "1", label: "Copy the code", desc: `Tap the code chip above to copy ${code} to your clipboard.` },
              { step: "2", label: "Click any paddle below", desc: "The Shop button opens the brand site with your discount pre-applied." },
              { step: "3", label: "Paste at checkout", desc: "If the code didn't auto-apply, paste it in the promo code field and save." },
            ].map(({ step, label, desc }) => (
              <div key={step} className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold mb-3" style={{ background: "rgba(10,100,188,0.25)", color: "#60a5fa" }}>
                  {step}
                </div>
                <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{label}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Paddle grid */}
          <div className="mb-16">
            <h2 className="text-xl font-extrabold mb-6" style={{ color: "var(--text-primary)" }}>
              {brand.name} Paddles — All {bp.length} Eligible for Discount
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {bp.map((p) => {
                const paddleCode = getCode(p.brand, p.discountLink);
                return (
                  <div
                    key={p.slug}
                    className="rounded-2xl overflow-hidden flex flex-col"
                    style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {/* Image */}
                    <Link href={`/paddles/${p.slug}`} className="block">
                      <div className="flex items-center justify-center p-6" style={{ background: "rgba(255,255,255,0.02)", minHeight: "160px" }}>
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image}
                            alt={`${p.brand} ${p.name}`}
                            className="max-h-32 w-auto object-contain"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl" style={{ background: "rgba(10,100,188,0.15)" }} />
                        )}
                      </div>
                    </Link>

                    <div className="p-5 flex flex-col flex-1">
                      <Link href={`/paddles/${p.slug}`} className="hover:opacity-80 transition-opacity">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                          {p.shape} · {p.thickness}
                        </p>
                        <h3 className="font-extrabold text-base mb-1" style={{ color: "var(--text-primary)" }}>
                          {p.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 mb-4 mt-1">
                        {p.price && (
                          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{p.price}</span>
                        )}
                        {p.amountOff && p.amountOff !== "$0" && p.amountOff !== "" && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>
                            {p.amountOff} off
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex gap-2">
                        <AffiliateBuyButton
                          href={p.discountLink!}
                          code={paddleCode}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 font-bold text-sm py-2.5 rounded-xl text-white transition-all hover:scale-[1.02]"
                          style={{ background: "#0a64bc" }}
                        >
                          Shop <ArrowRight className="w-3.5 h-3.5" />
                        </AffiliateBuyButton>
                        <Link
                          href={`/paddles/${p.slug}`}
                          className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                          style={{ border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-muted)" }}
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-xl font-extrabold mb-6" style={{ color: "var(--text-primary)" }}>
              {brand.name} Discount Code — FAQ
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: `What is the ${brand.name} pickleball discount code?`,
                  a: `The current ${brand.name} discount code is ${code}. Enter it at checkout on ${brand.name}'s website to save${discount ? ` ${discount}` : ""}. This code is negotiated exclusively through Playbook Reviews and works on all ${bp.length} eligible paddle${bp.length === 1 ? "" : "s"} listed above.`,
                },
                {
                  q: `Does ${brand.name} have a promo code?`,
                  a: `Yes. Use code ${code} at ${brand.name}'s checkout. Many of our affiliate links above will apply the discount automatically — if yours didn't, paste ${code} manually in the promo field at checkout.`,
                },
                {
                  q: `How much can I save on ${brand.name} paddles?`,
                  a: discount
                    ? `Using code ${code}, you save ${discount} on ${brand.name} paddles. That applies to all ${bp.length} paddle${bp.length === 1 ? "" : "s"} listed on this page.`
                    : `Use code ${code} at checkout to see your savings on ${brand.name} paddles.`,
                },
                {
                  q: `Are ${brand.name} pickleball paddles worth buying?`,
                  a: `${brand.description} Read full lab-measured reviews for each paddle on the individual review pages — every spec (swing weight, twist weight, balance point) is independently measured.`,
                },
              ].map(({ q, a }) => (
                <div key={q} className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 className="font-bold text-sm mb-2" style={{ color: "var(--text-primary)" }}>{q}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <Link
              href={`/brands/${brand.slug}`}
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:opacity-80"
              style={{ border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-primary)" }}
            >
              All {brand.name} paddles & reviews
            </Link>
            <Link
              href="/discounts"
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:opacity-80"
              style={{ border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-muted)" }}
            >
              All brand discounts
            </Link>
            <Link
              href="/discount-codes"
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
              style={{ background: "#0a64bc" }}
            >
              Search all discount codes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
