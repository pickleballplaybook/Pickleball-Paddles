import { Fragment } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { blogPosts, getBlogPostBySlug, BlogSection } from "@/data/blogPosts";
import { getPaddleBySlug, paddles } from "@/data/paddles";
import { gearProducts, GearProduct } from "@/data/products";
import { siteConfig } from "@/config/site";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import RelatedGuidesBlock from "@/components/RelatedGuidesBlock";
import SpecBar from "@/components/SpecBar";
import BalancePointSpec from "@/components/BalancePointSpec";
import { getCatalogStats } from "@/lib/catalogStats";
import type { Paddle } from "@/types";
import GuidePostLayout from "./GuidePostLayout";

// Pick 4 guides for a review post based on the reviewed paddle's specs
// (shape + thickness). Falls back to evergreens when the paddle data is
// missing. Every review links into the guides — that's hundreds of
// internal links pointing into the new informational pages.
function guidesForReview(paddleSlug: string | undefined): string[] {
  const paddle = paddleSlug ? getPaddleBySlug(paddleSlug) : undefined;
  const out: string[] = [];
  const shape = (paddle?.shape || "").toLowerCase();
  if (shape.includes("elongated"))     out.push("what-is-an-elongated-pickleball-paddle");
  else if (shape.includes("hybrid"))   out.push("what-is-a-hybrid-pickleball-paddle");
  else if (shape.includes("widebody")) out.push("what-is-a-widebody-pickleball-paddle");
  const thick = (paddle?.thickness || "").toLowerCase();
  if (thick.includes("13") || thick.includes("14") || thick.includes("16")) {
    out.push("pickleball-paddle-thickness-explained");
  }
  out.push("how-to-choose-a-pickleball-paddle");
  out.push("how-long-do-pickleball-paddles-last");
  return Array.from(new Set(out)).slice(0, 4);
}

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getBlogPostBySlug(params.slug);
  if (!post) return {};
  const url = `${siteConfig.siteUrl}/blog/${post.slug}`;
  const imageUrl = post.thumbnail
    ? `${siteConfig.siteUrl}${post.thumbnail}`
    : post.videoId
    ? `https://img.youtube.com/vi/${post.videoId}/hqdefault.jpg`
    : undefined;
  return {
    title: post.title,
    description: post.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.publishDate,
      authors: ["Austin Hardy"],
      url,
      siteName: siteConfig.name,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: post.brand && post.paddleName ? `${post.brand} ${post.paddleName} review` : post.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Slugify h2 headings so the "On this page" links can anchor to them.
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function RenderSection({ section }: { section: BlogSection }) {
  switch (section.type) {
    case "h2":
      return (
        <h2
          id={section.text ? slugifyHeading(section.text) : undefined}
          className="text-xl font-extrabold mt-10 mb-3 scroll-mt-32"
          style={{ color: "var(--flip-text-head)" }}
        >
          {section.text}
        </h2>
      );
    case "p":
      return (
        <p className="text-base leading-relaxed mb-4" style={{ color: "var(--flip-text-body, var(--text-primary))" }}>
          {section.text}
        </p>
      );
    case "ul":
      return (
        <ul className="mb-4 space-y-1.5 pl-1">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--flip-text-body, var(--text-primary))" }}>
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#0a64bc" }} />
              {item}
            </li>
          ))}
        </ul>
      );
    case "verdict":
      return (
        <div
          className="rounded-2xl p-5 my-6"
          style={{
            background: "rgba(10, 100, 188,0.28)",
            border: "1px solid rgba(10, 100, 188,0.30)",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
            Verdict
          </p>
          <p className="text-base font-semibold leading-relaxed" style={{ color: "var(--flip-text-head)" }}>
            {section.text}
          </p>
        </div>
      );
    case "quick-take":
      return (
        <div
          className="rounded-2xl p-5 my-6"
          style={{
            background: "rgba(10, 100, 188,0.23)",
            border: "1px solid rgba(10, 100, 188,0.30)",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
            Quick Take
          </p>
          <p className="text-base leading-relaxed" style={{ color: "var(--flip-text-head)" }}>
            {section.text}
          </p>
        </div>
      );
    case "spec-line":
      return (
        <p
          className="text-sm font-semibold mb-6 inline-block px-3 py-1.5 rounded-lg"
          style={{
            background: "var(--bg-alt, rgba(0,0,0,0.04))",
            color: "var(--flip-text-head)",
            border: "1px solid var(--flip-card-border)",
          }}
        >
          {section.text}
        </p>
      );
    case "comparison": {
      const other = section.paddleSlug ? getPaddleBySlug(section.paddleSlug) : undefined;
      if (!other) {
        // Fall through to paragraph rendering when the linked paddle is
        // missing — better than rendering an empty card.
        return (
          <p className="text-base leading-relaxed mb-4" style={{ color: "var(--flip-text-body, var(--text-primary))" }}>
            {section.text}
          </p>
        );
      }
      // Hero-style comparison card. Big paddle image, brand/name, spec strip,
      // and TWO actions: detail page + direct buy link to the brand. The
      // direct buy is the high-intent action so it gets the brand-red.
      const buyHref = other.discountLink || `/paddles/${other.slug}`;
      const buyExternal = !!other.discountLink;
      return (
        <div
          className="rounded-2xl my-6 overflow-hidden grid grid-cols-1 md:grid-cols-[360px_1fr]"
          style={{
            background: "var(--flip-bg-card)",
            border: "1px solid var(--flip-card-border)",
          }}
        >
          {/* Image panel — bigger so the paddle reads as a hero in each
              comparison, not a thumbnail. */}
          {other.image && (
            <div
              className="flex items-center justify-center p-6 md:p-8 md:border-r"
              style={{
                background: "linear-gradient(135deg, rgba(10,100,188,0.04) 0%, var(--bg-alt) 100%)",
                borderColor: "var(--flip-card-border)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={other.image}
                alt={`${other.brand} ${other.name}`}
                className="w-full max-w-[320px] h-auto object-contain"
                style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.18))" }}
              />
            </div>
          )}
          {/* Content panel */}
          <div className="p-5">
            <p
              className="inline-block text-[10px] font-bold uppercase tracking-widest mb-1 px-2 py-0.5 rounded"
              style={{
                color: "#fff",
                background: "#DC2626",
                border: "2px solid #ffffff",
                boxShadow: "0 0 0 1px #DC2626",
              }}
            >
              {other.brand}
            </p>
            <h3 className="font-extrabold text-lg mt-1 mb-2" style={{ color: "var(--flip-text-head)" }}>
              {other.name}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {[other.shape, other.thickness, other.weight, other.price].filter(Boolean).map((s, i) => (
                <span
                  key={i}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded"
                  style={{
                    background: "var(--bg-alt, rgba(0,0,0,0.04))",
                    color: "var(--flip-text-head)",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
            {section.text && (
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--flip-text-body, var(--text-primary))" }}>
                {section.text}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Link
                href={buyHref}
                target={buyExternal ? "_blank" : undefined}
                rel={buyExternal ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg transition-all hover:opacity-90"
                style={{ background: "#0a64bc", color: "#fff", border: "2px solid #ffffff", boxShadow: "0 0 0 1px #0a64bc" }}
              >
                {buyExternal ? "Shop this paddle" : "View details"} <ArrowRight className="w-4 h-4" />
              </Link>
              {buyExternal && (
                <Link
                  href={`/paddles/${other.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  style={{
                    background: "transparent",
                    color: "var(--text-muted)",
                    border: "1px solid var(--flip-card-border)",
                  }}
                >
                  Full specs
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) notFound();

  // Guide posts (training, drills, gear comparisons) use a separate layout
  // that promotes the Pickleball Drills app instead of a paddle.
  if (post.category === "guide") {
    return <GuidePostLayout post={post} />;
  }

  // Past this point it's a paddle review — the schema marks paddle fields
  // optional to support guides, but every paddle review post has them set.
  const linkedPaddles = (post.paddleSlugs ?? [])
    .map((s) => getPaddleBySlug(s))
    .filter(Boolean) as NonNullable<ReturnType<typeof getPaddleBySlug>>[];

  // Methodology stat — rounded down to a friendly number so it doesn't read
  // like a counter ("87+" feels manual; "85+" feels rounded). Updates
  // automatically as you add paddles to paddles.csv.
  const paddlesTestedCount = Math.floor(paddles.length / 5) * 5;

  // Auto-generate the "On this page" TOC from the post's h2 sections so we
  // don't have to hand-maintain a nav. Anchor IDs match slugifyHeading() in
  // RenderSection.
  const tocItems = post.sections
    .filter((s) => s.type === "h2" && s.text)
    .map((s) => ({ id: slugifyHeading(s.text!), text: s.text! }));

  const isSelkirk = post.brand === "Selkirk" || post.brand === "SLK";
  const discountCode = isSelkirk ? "INF-PLAYBOOK" : "PLAYBOOK";

  const verdict = post.sections.find((s) => s.type === "verdict")?.text ?? post.excerpt;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.metaDescription,
    "datePublished": post.publishDate,
    "dateModified": post.publishDate,
    "author": { "@type": "Person", "name": "Austin Hardy", "url": siteConfig.siteUrl },
    "publisher": {
      "@type": "Organization",
      "name": "Pickleball Playbook",
      "url": siteConfig.siteUrl,
      "logo": { "@type": "ImageObject", "url": `${siteConfig.siteUrl}/images/Logo.svg` },
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${siteConfig.siteUrl}/blog/${post.slug}` },
    "image": post.thumbnail ? `${siteConfig.siteUrl}${post.thumbnail}` : undefined,
    "articleBody": verdict,
  };

  // The main paddle (first linked) is the focal product for the page —
  // hero image, sticky buy CTA, inline product callouts all use it.
  const mainPaddle = linkedPaddles[0];

  // Catalog stats for the SpecBar visualizations. Auto-injected below the
  // spec-line section so review-template posts always show the data graphic
  // matching what's on /specs and /paddles/[slug] — no per-post wiring.
  const catalog = getCatalogStats();
  let specsInjectAfterIdx = -1;
  post.sections.forEach((s, i) => {
    if (s.type === "spec-line") specsInjectAfterIdx = i;
  });

  // Scatter brand product photos across the article — one inline hero image
  // before the first N h2 sections (where N = number of brandImages). No
  // cycling: each photo shows up at most once, so longer articles than
  // gallery sizes just stop injecting after the last image. Curators are
  // expected to pass only lifestyle/in-context shots (court, drilling, etc.)
  // rather than plain studio cutouts — those read as small floating paddles
  // inside a big empty frame.
  const inlineBrandImageByIdx = new Map<number, { src: string; alt?: string }>();
  if (post.brandImages && post.brandImages.length > 0) {
    let h2Order = 0;
    post.sections.forEach((s, i) => {
      if (s.type !== "h2") return;
      if (h2Order < post.brandImages!.length) {
        inlineBrandImageByIdx.set(i, post.brandImages![h2Order]);
      }
      h2Order++;
    });
  }
  const buyHref = mainPaddle?.discountLink || (mainPaddle ? `/paddles/${mainPaddle.slug}` : "#");
  const buyExternal = !!mainPaddle?.discountLink;

  // Gear cross-sell callouts auto-inject between sections so the page surfaces
  // complementary products (ball machine, grips, etc.) without manually
  // placing them per post. The injection points are picked to feel natural —
  // mid-article and pre-verdict. The picks are stable so repeat visitors see
  // the same callouts (vs. random rotation which would be confusing on share).
  const gearCalloutIds = ["titan", "grips"];
  const inlineGearByAfterIdx = new Map<number, GearProduct>();
  const headingMatches = (text: string, needles: string[]) =>
    needles.some((n) => text.includes(n));
  let injectCursor = 0;
  post.sections.forEach((s, i) => {
    if (s.type !== "h2" || !s.text) return;
    const t = s.text.toLowerCase();
    // Pre-verdict and pre-comparisons feel like natural read pauses.
    if (
      headingMatches(t, ["played-in", "head-to-head", "final verdict"]) &&
      i > 0 &&
      injectCursor < gearCalloutIds.length
    ) {
      const gear = gearProducts.find((g) => g.id === gearCalloutIds[injectCursor]);
      if (gear) {
        inlineGearByAfterIdx.set(i - 1, gear);
        injectCursor++;
      }
    }
  });
  // Closing CTA features a third gear product — different from the inline
  // callouts so the page doesn't repeat the same product three times.
  const closingGear = gearProducts.find((g) => g.id === "court-ranger")
    || gearProducts.find((g) => !gearCalloutIds.includes(g.id))
    || null;

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
    {/* SVG color-matrix filter for dark-mode white-bg removal on brand
        product photos. The last row of the matrix computes alpha as
        new_a = -R - G - B + 2.6, so near-white pixels (R+G+B near 3) get
        knocked to transparent while the dark paddle pixels stay opaque.
        Referenced via `filter: url(#brand-photo-key)` in globals.css. */}
    <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }} aria-hidden="true">
      <defs>
        <filter id="brand-photo-key" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    -1 -1 -1 0 2.6"
          />
        </filter>
      </defs>
    </svg>
    <div className="min-h-screen pt-[156px] pb-24 md:pb-16" style={{ background: "var(--bg-page)" }}>

      {/* Brand strip — distinctive horizontal band that signals the brand
          and frames the hero. Brand red+white outline matches the brand
          badges throughout the page and the YouTube thumbnail palette. */}
      <div className="w-full" style={{ background: "#DC2626" }}>
        <div className="container-xl">
          <p className="text-[11px] md:text-xs font-extrabold uppercase tracking-[0.2em] py-2.5" style={{ color: "#fff" }}>
            {post.brand} Review · Pickleball Playbook
          </p>
        </div>
      </div>

      <div className="container-xl py-10 md:py-14">

        {/* Back link */}
        <div className="max-w-6xl mx-auto mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-teal-500"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" /> All Reviews
          </Link>
        </div>

        {/* Slim header — title + meta only. The buy intent is carried by the
            desktop sticky sidebar and the mobile floating footer, so the
            page-top doesn't need a giant hero card duplicating that CTA. */}
        <header className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className="inline-block text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded"
              style={{ background: "#DC2626", color: "#fff", border: "2px solid #fff", boxShadow: "0 0 0 1px #DC2626" }}
            >
              {post.brand}
            </span>
            {mainPaddle?.shape && (
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded"
                style={{ background: "var(--bg-alt, rgba(0,0,0,0.04))", color: "var(--flip-text-head)" }}>
                {mainPaddle.shape}
              </span>
            )}
            {mainPaddle?.thickness && (
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded"
                style={{ background: "var(--bg-alt, rgba(0,0,0,0.04))", color: "var(--flip-text-head)" }}>
                {mainPaddle.thickness}
              </span>
            )}
          </div>
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-3"
            style={{ color: "var(--flip-text-head)" }}
          >
            {post.title}
          </h1>
          <p className="text-base leading-relaxed mb-3 max-w-3xl" style={{ color: "var(--flip-text-body, var(--text-primary))" }}>
            {post.excerpt}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            By <strong style={{ color: "var(--flip-text-head)" }}>Austin Hardy</strong> · Published{" "}
            {formatDate(post.publishDate)} · Independent review
          </p>
        </header>

        {/* Main content grid — article body on the left, sticky paddle card
            on the right (desktop). Mobile collapses to a single column with a
            fixed bottom buy bar. */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">

          {/* ── Article column ───────────────────────────────────────────── */}
          <div className="min-w-0">

            {/* Methodology + disclosure compact strip */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div
                className="inline-flex items-center gap-2 text-sm font-bold px-3.5 py-2 rounded-full"
                style={{
                  background: "var(--flip-bg-card)",
                  border: "1px solid var(--flip-card-border)",
                  color: "var(--flip-text-head)",
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: "#DC2626" }} />
                {paddlesTestedCount}+ paddles tested
              </div>
              <div
                className="inline-flex items-center gap-2 text-sm font-bold px-3.5 py-2 rounded-full"
                style={{
                  background: "var(--flip-bg-card)",
                  border: "1px solid var(--flip-card-border)",
                  color: "var(--flip-text-head)",
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: "#0a64bc" }} />
                Hands-on testing
              </div>
              <p className="text-xs uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>
                Independent — no brand paid for or approved this article
              </p>
            </div>

            {/* On this page — auto-generated from h2 sections */}
            {tocItems.length > 1 && (
              <nav
                className="rounded-2xl p-5 mb-8"
                aria-label="On this page"
                style={{
                  background: "var(--flip-bg-card)",
                  border: "1px solid var(--flip-card-border)",
                }}
              >
                <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "var(--text-muted)" }}>
                  On this page
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tocItems.map((t) => (
                    <li key={t.id}>
                      <a
                        href={`#${t.id}`}
                        className="inline-flex items-center gap-1.5 text-base font-medium hover:text-teal-500 transition-colors"
                        style={{ color: "var(--flip-text-head)" }}
                      >
                        <ArrowRight className="w-3.5 h-3.5 opacity-70" /> {t.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {/* YouTube embed */}
            {post.videoId && (
              <div className="mb-8 rounded-2xl overflow-hidden">
                <YouTubeEmbed videoId={post.videoId} title={post.title} />
              </div>
            )}

            {/* Article body — with inline product callouts injected after
                specific section indices to keep the buy intent live. */}
            <article className="mb-10">
              {post.sections.map((section, i) => (
                <Fragment key={i}>
                  {/* Brand product photo BEFORE the h2 so the shot frames
                      each section visually, matching the magazine layout
                      pattern of leading a section with a hero image. */}
                  {inlineBrandImageByIdx.has(i) && (
                    <InlineBrandImage
                      image={inlineBrandImageByIdx.get(i)!}
                      brand={post.brand ?? ""}
                      paddleName={post.paddleName ?? ""}
                    />
                  )}
                  <RenderSection section={section} />
                  {specsInjectAfterIdx === i && mainPaddle && (
                    <PaddleSpecsPanel paddle={mainPaddle} catalog={catalog} />
                  )}
                  {inlineGearByAfterIdx.has(i) && (
                    <InlineGearCallout gear={inlineGearByAfterIdx.get(i)!} />
                  )}
                </Fragment>
              ))}
            </article>

            {/* Closing gear cross-sell — instead of repeating the paddle CTA
                (already in hero/sidebar/floating-footer), we promote a
                complementary product from the Gear tab. */}
            {closingGear && (
              <div
                className="rounded-3xl p-6 md:p-8 mb-10 grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-6"
                style={{
                  background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                  color: "#fff",
                }}
              >
                <div className="flex items-center gap-5">
                  {closingGear.image && (
                    <div
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.18)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={closingGear.image}
                        alt={closingGear.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest mb-1.5 opacity-90">
                      Round out your kit
                    </p>
                    <p className="text-xl md:text-2xl font-extrabold leading-tight mb-1">
                      {closingGear.brand ? `${closingGear.brand} ` : ""}{closingGear.name}
                    </p>
                    <p className="text-sm opacity-90 line-clamp-2">
                      {closingGear.subtitle}
                    </p>
                  </div>
                </div>
                <Link
                  href={closingGear.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-base font-extrabold px-6 py-3.5 rounded-xl whitespace-nowrap"
                  style={{
                    background: "#fff",
                    color: "#DC2626",
                    border: "2px solid #fff",
                  }}
                >
                  {closingGear.ctaText || "Shop now"} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* ── Sticky sidebar (desktop) ──────────────────────────────────── */}
          {mainPaddle && (
            <aside className="hidden lg:block">
              <div className="sticky top-32 space-y-4">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--flip-bg-card)",
                    border: "1px solid var(--flip-card-border)",
                  }}
                >
                  {mainPaddle.image && (
                    <div
                      className="flex items-center justify-center p-6"
                      style={{
                        background: "linear-gradient(135deg, rgba(220,38,38,0.05) 0%, var(--bg-alt) 100%)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mainPaddle.image}
                        alt={mainPaddle.name}
                        className="w-full max-w-[220px] h-auto object-contain"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <p
                      className="inline-block text-[10px] font-extrabold uppercase tracking-widest mb-2 px-2 py-0.5 rounded"
                      style={{ background: "#DC2626", color: "#fff", border: "2px solid #fff", boxShadow: "0 0 0 1px #DC2626" }}
                    >
                      {mainPaddle.brand}
                    </p>
                    <p className="font-extrabold text-base mb-1" style={{ color: "var(--flip-text-head)" }}>
                      {mainPaddle.name}
                    </p>
                    {mainPaddle.price && (
                      <p className="text-sm mb-3" style={{ color: "var(--flip-text-body, var(--text-muted))" }}>
                        {mainPaddle.price}{mainPaddle.amountOff ? ` · ${mainPaddle.amountOff} off with code ${discountCode}` : ""}
                      </p>
                    )}
                    <Link
                      href={buyHref}
                      target={buyExternal ? "_blank" : undefined}
                      rel={buyExternal ? "noopener noreferrer" : undefined}
                      className="block w-full text-center text-sm font-extrabold px-4 py-3 rounded-xl"
                      style={{
                        background: "#0a64bc",
                        color: "#fff",
                        border: "2px solid #fff",
                        boxShadow: "0 0 0 1px #0a64bc",
                      }}
                    >
                      Buy this paddle
                    </Link>
                    <Link
                      href={`/paddles/${mainPaddle.slug}`}
                      className="block w-full text-center text-sm font-semibold px-4 py-2.5 mt-2 rounded-xl"
                      style={{
                        color: "var(--flip-text-body)",
                        border: "1px solid var(--flip-card-border)",
                      }}
                    >
                      Full specs page
                    </Link>
                  </div>
                </div>

                {/* Compare promo card — drives traffic to the comparison tool
                    (which is no longer in the hamburger). */}
                <Link
                  href="/compare"
                  className="block rounded-2xl p-5 transition-colors hover:border-teal-500/40"
                  style={{
                    background: "var(--flip-bg-card)",
                    border: "1px solid var(--flip-card-border)",
                  }}
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "#60a5fa" }}>
                    Tool
                  </p>
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--flip-text-head)" }}>
                    Compare this paddle
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Stack its specs against any other paddle on the site.
                  </p>
                </Link>
              </div>
            </aside>
          )}
        </div>

        {/* Related guides + back link, full-width under the grid */}
        <div className="max-w-6xl mx-auto mt-12">
          <RelatedGuidesBlock
            slugs={guidesForReview((post.paddleSlugs ?? [])[0])}
            eyebrow="Learn"
            title="Helpful Guides"
          />
          <div className="border-t pt-8 mt-10" style={{ borderColor: "var(--border)" }}>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-teal-500"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to all reviews
            </Link>
          </div>
        </div>

      </div>

      {/* Sticky mobile buy bar — fixed bottom, only visible below lg. Always
          shows the affiliate action so the buy intent is one tap away from
          anywhere in the article. */}
      {mainPaddle && (
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-4 py-3 flex items-center gap-3"
          style={{
            background: "var(--bg-page)",
            borderTop: "1px solid var(--flip-card-border)",
            boxShadow: "0 -8px 24px -12px rgba(0,0,0,0.18)",
          }}
        >
          {mainPaddle.image && (
            <div
              className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
              style={{ background: "var(--bg-alt)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mainPaddle.image} alt={mainPaddle.name} className="w-full h-full object-contain p-1" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ background: "#DC2626", color: "#fff", border: "2px solid #fff", boxShadow: "0 0 0 1px #DC2626" }}
            >
              {mainPaddle.brand}
            </p>
            <p className="text-xs font-bold truncate" style={{ color: "var(--flip-text-head)" }}>
              {mainPaddle.name}
            </p>
          </div>
          <Link
            href={buyHref}
            target={buyExternal ? "_blank" : undefined}
            rel={buyExternal ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-1 text-sm font-extrabold px-4 py-2.5 rounded-xl flex-shrink-0"
            style={{ background: "#0a64bc", color: "#fff", border: "2px solid #fff", boxShadow: "0 0 0 1px #0a64bc" }}
          >
            Buy <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
    </>
  );
}

// Performance Snapshot panel — reuses the SpecBar / BalancePointSpec
// components that drive /specs and /paddles/[slug] so the visual is
// identical across the site. Renders SpecBars for every dimension the
// paddle has data for, then BalancePointSpec when balancePoint is set.
function PaddleSpecsPanel({
  paddle,
  catalog,
}: {
  paddle: Paddle;
  catalog: ReturnType<typeof getCatalogStats>;
}) {
  const staticWeight = parseFloat(paddle.weight);
  const hasAnySpec =
    paddle.swingWeight > 0 ||
    paddle.twistWeight > 0 ||
    staticWeight > 0 ||
    typeof paddle.balancePoint === "number";
  if (!hasAnySpec) return null;
  return (
    <section className="my-10" aria-label="Performance snapshot">
      <h2
        id="performance-snapshot"
        className="text-xl font-extrabold mt-2 mb-1 scroll-mt-32"
        style={{ color: "var(--flip-text-head)" }}
      >
        Performance Snapshot
      </h2>
      <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
        How the {paddle.name} measures against {paddles.length}+ paddles in our database.
      </p>
      <div className="space-y-3">
        {paddle.swingWeight > 0 && (
          <SpecBar
            label="Swing Weight"
            kind="swing-weight"
            value={paddle.swingWeight}
            min={catalog.swingWeight.min}
            max={catalog.swingWeight.max}
            avg={catalog.swingWeight.avg}
          />
        )}
        {paddle.twistWeight > 0 && (
          <SpecBar
            label="Twist Weight"
            kind="twist-weight"
            value={paddle.twistWeight}
            min={catalog.twistWeight.min}
            max={catalog.twistWeight.max}
            avg={catalog.twistWeight.avg}
          />
        )}
        {staticWeight > 0 && (
          <SpecBar
            label="Static Weight"
            kind="static-weight"
            value={staticWeight}
            unit="oz"
            min={catalog.weight.min}
            max={catalog.weight.max}
            avg={catalog.weight.avg}
          />
        )}
        {typeof paddle.balancePoint === "number" && <BalancePointSpec paddle={paddle} />}
      </div>
    </section>
  );
}

// Single brand product photo, dropped inline between article sections so a
// hero shot leads each h2. Card surface follows the theme (white in light,
// dark in dark), and in dark mode an SVG color-matrix filter (defined once
// at the top of the page) knocks the near-white pixels of the photo to
// transparent — so the paddle "floats" on the dark card instead of sitting
// inside a glaring white block.
function InlineBrandImage({
  image,
  brand,
  paddleName,
}: {
  image: { src: string; alt?: string };
  brand: string;
  paddleName: string;
}) {
  return (
    // Cap the card at ~380px so a portrait paddle shot doesn't sit inside a
    // wide letterboxed frame. Most brand product photos are vertical (paddle
    // shape), so this is the right target. Landscape lifestyle shots (court
    // backdrop, drilling photos) still fill the card edge-to-edge because
    // the image itself drives the height via aspect ratio.
    <div className="my-8 flex justify-center">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--flip-bg-card)",
          border: "1px solid var(--flip-card-border)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          width: "100%",
          maxWidth: "380px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt ?? `${brand} ${paddleName} product photo`}
          loading="lazy"
          className="brand-photo block object-contain"
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "520px",
          }}
        />
      </div>
    </div>
  );
}

// Brand-page gallery — colorways and detail shots pulled from the
// manufacturer's product page. Hotlinked so the brand serves the bytes (and
// stays in sync if they swap the photography). Renders as a 2-up grid that
// goes 3-up on wide viewports. Kept for any post that wants a centralized
// gallery, but the review template now scatters images inline via
// InlineBrandImage instead.
function BrandImageGallery({
  images,
  brand,
  paddleName,
}: {
  images: { src: string; alt?: string }[];
  brand: string;
  paddleName: string;
}) {
  if (!images.length) return null;
  return (
    <section
      className="my-10 rounded-2xl p-5 md:p-6"
      style={{
        background: "var(--flip-bg-card)",
        border: "1px solid var(--flip-card-border)",
      }}
      aria-label={`${brand} ${paddleName} colorways and product shots`}
    >
      <p className="text-[11px] uppercase tracking-widest font-bold mb-5" style={{ color: "var(--text-muted)" }}>
        Colorways &amp; Detail Shots
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {images.map((img, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: "var(--flip-bg)",
              border: "1px solid var(--flip-card-border)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt ?? `${brand} ${paddleName} product photo ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-contain p-3 md:p-4"
              style={{
                // mix-blend-mode: multiply makes the white background of the
                // brand product photo blend into the card surface, so only
                // the paddle "floats" on the dark card. Works for any photo
                // shot on a near-white background — no per-image processing.
                mixBlendMode: "multiply",
                filter: "contrast(1.08) brightness(1.05)",
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// Inline cross-sell callout — drops a hero-image card for a Gear-tab
// product between sections. The eyebrow varies by product type so the page
// doesn't read "Shop Now" four times in a row.
function InlineGearCallout({ gear }: { gear: GearProduct }) {
  const eyebrow = gear.badge || "Editor's pick";
  return (
    <div
      className="my-10 rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-[140px_1fr]"
      style={{
        background: "linear-gradient(135deg, rgba(220,38,38,0.05) 0%, var(--flip-bg-card) 100%)",
        border: "1px solid var(--flip-card-border)",
      }}
    >
      {gear.image && (
        <div
          className="flex items-center justify-center p-4 sm:border-r"
          style={{ borderColor: "var(--flip-card-border)", background: gear.bg || undefined }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gear.image} alt={gear.name} className="w-full max-w-[110px] h-auto object-contain" />
        </div>
      )}
      <div className="p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "#DC2626" }}>
          {eyebrow}
        </p>
        <p className="font-extrabold text-base mb-1.5" style={{ color: "var(--flip-text-head)" }}>
          {gear.brand ? `${gear.brand} ` : ""}{gear.name}
        </p>
        {gear.subtitle && (
          <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-muted)" }}>
            {gear.subtitle}
          </p>
        )}
        <Link
          href={gear.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-extrabold px-4 py-2 rounded-lg"
          style={{ background: "#DC2626", color: "#fff", border: "2px solid #fff", boxShadow: "0 0 0 1px #DC2626" }}
        >
          {gear.ctaText || "Shop now"} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
