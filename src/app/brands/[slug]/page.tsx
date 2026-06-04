import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { brands, getBrandBySlug } from "@/data/brands";
import { paddles } from "@/data/paddles";
import { blogPosts } from "@/data/blogPosts";
import { siteConfig } from "@/config/site";
import { effectivePrice } from "@/lib/price";
import BrandPaddleGrid from "@/components/BrandPaddleGrid";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return brands.map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const brand = getBrandBySlug(params.slug);
  if (!brand) return {};
  const brandPaddles = paddles.filter((p) => p.brand === brand.name);
  const url = `${siteConfig.siteUrl}/brands/${brand.slug}`;
  return {
    title: `${brand.name} Pickleball Paddles — Reviews, Specs & Discounts`,
    description: `${brand.description} Browse all ${brandPaddles.length} ${brand.name} paddles with lab-measured specs, video reviews, and exclusive discount codes.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${brand.name} Pickleball Paddles — Reviews & Specs`,
      description: `Browse all ${brandPaddles.length} ${brand.name} paddles. Lab-measured specs and exclusive discount codes.`,
      url,
      type: "website",
      siteName: siteConfig.name,
      images: [{ url: `${siteConfig.siteUrl}${brand.logo}`, alt: `${brand.name} logo` }],
    },
    twitter: {
      card: "summary",
      title: `${brand.name} Pickleball Paddles`,
      description: `${brandPaddles.length} paddles reviewed with lab-measured specs.`,
    },
  };
}

function getCode(brandName: string, discountLink?: string): string {
  if (brandName === "Selkirk" || brandName === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

export default function BrandPage({ params }: Props) {
  const brand = getBrandBySlug(params.slug);
  if (!brand) notFound();

  const brandPaddles = paddles.filter((p) => p.brand === brand.name);
  const brandBlogPosts = blogPosts.filter((post) => post.brand === brand.name);
  // Shapes in display order — most-stocked first
  const shapes = Array.from(new Set(brandPaddles.map((p) => p.shape)))
    .sort((a, b) =>
      brandPaddles.filter((p) => p.shape === b).length -
      brandPaddles.filter((p) => p.shape === a).length,
    );
  const hasDiscount = brandPaddles.some((p) => p.amountOff && p.amountOff !== "$0");
  const code = getCode(brand.name, brandPaddles[0]?.discountLink);

  // ── Featured paddle ─────────────────────────────────────────────────────
  // The highest-trending paddle in the brand. Skipped for tiny brand lineups
  // (1 paddle) since the featured hero just duplicates the grid below.
  const featured = brandPaddles.length >= 2
    ? [...brandPaddles].sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0))[0]
    : null;

  // ── Price stats for FAQ + meta ─────────────────────────────────────────
  const pricePoints = brandPaddles
    .map((p) => effectivePrice(p))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const minPrice = pricePoints[0];
  const maxPrice = pricePoints[pricePoints.length - 1];

  // ── FAQ (used both as schema and as rendered section) ──────────────────
  const faqs = [
    {
      q: `What's the best ${brand.name} pickleball paddle?`,
      a: featured
        ? `Based on engagement and measured specs, the ${featured.brand} ${featured.name} is currently the most popular ${brand.name} paddle. It's a ${featured.thickness} ${featured.shape.toLowerCase()} build${featured.swingWeight > 0 ? ` with a swing weight of ${featured.swingWeight}` : ""}${featured.twistWeight > 0 ? ` and twist weight of ${featured.twistWeight}` : ""}.`
        : `Browse the full ${brand.name} lineup above to compare specs and find the right paddle for your game.`,
    },
    {
      q: `How many ${brand.name} pickleball paddles are reviewed on Pickleball Playbook?`,
      a: `Pickleball Playbook has independently reviewed ${brandPaddles.length} ${brand.name} paddle${brandPaddles.length === 1 ? "" : "s"} across ${shapes.length} shape${shapes.length === 1 ? "" : "s"}${shapes.length > 0 ? ` (${shapes.join(", ")})` : ""}. Every paddle is measured on calibrated lab equipment before testing.`,
    },
    ...(minPrice && maxPrice ? [{
      q: `What's the price range for ${brand.name} paddles?`,
      a: minPrice === maxPrice
        ? `${brand.name} paddles on Pickleball Playbook are priced at $${minPrice.toFixed(2)} after discount code ${code}.`
        : `${brand.name} paddles on Pickleball Playbook range from $${minPrice.toFixed(2)} to $${maxPrice.toFixed(2)} after discount code ${code} is applied at checkout.`,
    }] : []),
    ...(hasDiscount ? [{
      q: `Is there a ${brand.name} discount code?`,
      a: `Yes — code ${code} works on ${brand.name}'s official site. Apply it at checkout for the price shown on each paddle's detail page. The exact percentage or dollar discount varies by paddle.`,
    }] : []),
  ];

  // ── JSON-LD schemas ────────────────────────────────────────────────────
  const brandSchema = {
    "@context": "https://schema.org",
    "@type": "Brand",
    "name": brand.name,
    "description": brand.description,
    "logo": `${siteConfig.siteUrl}${brand.logo}`,
    "url": `${siteConfig.siteUrl}/brands/${brand.slug}`,
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${brand.name} Pickleball Paddles`,
    "description": `All ${brand.name} paddles reviewed by Pickleball Playbook.`,
    "numberOfItems": brandPaddles.length,
    "itemListElement": brandPaddles.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": `${p.brand} ${p.name}`,
      "url": `${siteConfig.siteUrl}/paddles/${p.slug}`,
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl">

          {/* Breadcrumbs */}
          <nav className="pt-6 pb-4" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <li>
                <Link href="/brands" className="transition-colors hover:text-brand-400" style={{ color: "var(--text-muted)" }}>
                  Brands
                </Link>
              </li>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <li style={{ color: "var(--text-primary)" }}>{brand.name}</li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-12">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.logo} alt={`${brand.name} logo`} className="w-full h-full object-contain p-2" />
            </div>
            <div>
              <h1
                className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                {brand.name} Pickleball Paddles
              </h1>
              <p className="text-lg leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
                {brand.description}
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}>
                  {brandPaddles.length} Paddle{brandPaddles.length !== 1 ? "s" : ""}
                </span>
                {/* Shape breakdown — one chip per shape with count, instead of */}
                {/* the previous single chip listing all shapes. */}
                {shapes.map((shape) => {
                  const count = brandPaddles.filter((p) => p.shape === shape).length;
                  return (
                    <span
                      key={shape}
                      className="px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}
                    >
                      {count} {shape}
                    </span>
                  );
                })}
                {minPrice && maxPrice && (
                  <span className="px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>
                    {minPrice === maxPrice ? `$${minPrice.toFixed(0)}` : `$${minPrice.toFixed(0)}–$${maxPrice.toFixed(0)}`}
                  </span>
                )}
                {hasDiscount && (
                  <span className="px-3 py-1.5 rounded-full font-bold font-mono" style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.25)" }}>
                    Code: {code}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Featured paddle ─────────────────────────────────────────── */}
          {featured && (
            <section className="mb-16">
              <Link
                href={`/paddles/${featured.slug}`}
                className="group block rounded-3xl overflow-hidden transition-all hover:scale-[1.005]"
                style={{ background: "var(--bg-card)", border: "1px solid rgba(20,184,166,0.25)" }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Image */}
                  <div
                    className="relative flex items-center justify-center aspect-[5/4] md:aspect-auto md:min-h-[320px] p-8"
                    style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(20,184,166,0.02) 100%)" }}
                  >
                    {featured.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featured.image}
                        alt={`${featured.brand} ${featured.name}`}
                        className="max-h-[280px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <span
                      className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
                      style={{ background: "rgba(20,184,166,0.95)", color: "#0a1628" }}
                    >
                      <Sparkles className="w-3 h-3" strokeWidth={3} />
                      Featured
                    </span>
                  </div>
                  {/* Details */}
                  <div className="p-6 md:p-10 flex flex-col justify-center">
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#2dd4bf" }}>
                      Most Popular {brand.name}
                    </p>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3 group-hover:text-teal-400 transition-colors" style={{ color: "var(--text-primary)" }}>
                      {featured.brand} {featured.name}
                    </h2>
                    {featured.tagline && (
                      <p className="text-base mb-5" style={{ color: "var(--text-muted)" }}>
                        {featured.tagline}
                      </p>
                    )}
                    {/* Spec strip */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { label: "Shape",   value: featured.shape },
                        { label: "Core",    value: featured.thickness },
                        { label: "Weight",  value: featured.weight },
                        ...(featured.swingWeight > 0 ? [{ label: "Swing Wt", value: featured.swingWeight.toString() }] : []),
                        ...(featured.twistWeight > 0 ? [{ label: "Twist Wt", value: featured.twistWeight.toString() }] : []),
                        ...(featured.price        ? [{ label: "Price",    value: featured.price }] : []),
                      ].slice(0, 6).map((s) => (
                        <div key={s.label}>
                          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                            {s.label}
                          </p>
                          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-bold transition-colors" style={{ color: "#2dd4bf" }}>
                      Read the full review
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* ── All brand paddles, with sort + shape filter ──────────────── */}
          <section className="mb-16">
            <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--text-primary)" }}>
              All {brand.name} Paddles
            </h2>
            <BrandPaddleGrid paddles={brandPaddles} shapes={shapes} />
          </section>

          {/* ── FAQ ───────────────────────────────────────────────────────── */}
          {faqs.length > 0 && (
            <section className="mb-16 max-w-3xl">
              <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--text-primary)" }}>
                {brand.name} FAQ
              </h2>
              <div className="flex flex-col gap-3">
                {faqs.map((f) => (
                  <div
                    key={f.q}
                    className="rounded-2xl p-5"
                    style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <h3 className="text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                      {f.q}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {f.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Blog posts */}
          {brandBlogPosts.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--text-primary)" }}>
                {brand.name} Reviews
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {brandBlogPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="rounded-2xl overflow-hidden group transition-all hover:scale-[1.01]"
                    style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {(post.thumbnail || post.videoId) && (
                      <div className="aspect-video relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.thumbnail ?? `https://img.youtube.com/vi/${post.videoId}/hqdefault.jpg`}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#14b8a6" }}>
                        {post.brand}
                      </p>
                      <h3 className="text-sm font-bold line-clamp-2 group-hover:text-teal-400 transition-colors" style={{ color: "var(--text-primary)" }}>
                        {post.title}
                      </h3>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/paddles"
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
              style={{ background: "#14b8a6" }}
            >
              Browse All Paddles <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/best-pickleball-paddles"
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-[1.02]"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-primary)" }}
            >
              Best Paddles
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
