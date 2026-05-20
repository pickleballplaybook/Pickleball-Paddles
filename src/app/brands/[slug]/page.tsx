import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { brands, getBrandBySlug } from "@/data/brands";
import { paddles } from "@/data/paddles";
import { blogPosts } from "@/data/blogPosts";
import { siteConfig } from "@/config/site";
import PaddleCard from "@/components/PaddleCard";

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
    title: `${brand.name} Pickleball Paddles — Reviews, Specs & Discounts | Pickleball Playbook`,
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
  const shapes = Array.from(new Set(brandPaddles.map((p) => p.shape)));
  const hasDiscount = brandPaddles.some((p) => p.amountOff && p.amountOff !== "$0");
  const code = getCode(brand.name, brandPaddles[0]?.discountLink);

  // JSON-LD
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl">

          {/* Breadcrumbs */}
          <nav className="pt-6 pb-4" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <li>
                <Link href="/paddles" className="transition-colors hover:text-brand-400" style={{ color: "var(--text-muted)" }}>
                  Paddles
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
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}>
                  {brandPaddles.length} Paddle{brandPaddles.length !== 1 ? "s" : ""}
                </span>
                <span className="px-3 py-1.5 rounded-full font-semibold" style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}>
                  {shapes.join(", ")}
                </span>
                {hasDiscount && (
                  <span className="px-3 py-1.5 rounded-full font-bold font-mono" style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.25)" }}>
                    Code: {code}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* All paddles */}
          <section className="mb-16">
            <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--text-primary)" }}>
              All {brand.name} Paddles
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {brandPaddles.map((p) => (
                <PaddleCard key={p.id} paddle={p} />
              ))}
            </div>
          </section>

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
              Best Paddles 2026
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
