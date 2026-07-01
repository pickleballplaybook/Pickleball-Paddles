import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { Fragment } from "react";
import type { BlogPost, BlogSection } from "@/data/blogPosts";
import { siteConfig } from "@/config/site";

// Layout for guide-category posts (training, drills, gear comparisons). The
// CTA story is the Pickleball Drills app, not a paddle. Renders FAQPage
// schema from `post.faqs` so the post is eligible for Google rich results.

const PBDRILLS_URL = "https://pbdrills.com";
const CHARTREUSE = "#defa32";
const TEAL = "#3cacae";

type CTAConfig = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  buttonText: string;
  href: string;
  footnote?: string;
};

const DEFAULT_CTA: CTAConfig = {
  eyebrow: "The App That Replaces Guesswork",
  title: "Pickleball Drills",
  description:
    "Hundreds of pro-built drills sorted by shot, level, and time available — with a free 7-day trial of the full library.",
  bullets: [
    "200+ drills, every level",
    "Built by APP & PPA tour pros",
    "Solo · partner · wall · ball machine",
    "7 days free, cancel anytime",
  ],
  buttonText: "Start Free 7-Day Trial →",
  href: PBDRILLS_URL,
  footnote: "Or read more at /pbdrills",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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
          className="text-2xl md:text-3xl font-extrabold mt-12 mb-4 scroll-mt-32"
          style={{ color: "var(--flip-text-head)" }}
        >
          {section.text}
        </h2>
      );
    case "p":
      return (
        <p
          className="text-base md:text-[17px] leading-relaxed mb-4"
          style={{ color: "var(--flip-text-body, var(--text-primary))" }}
        >
          {section.text}
        </p>
      );
    case "ul":
      return (
        <ul className="mb-5 space-y-2 pl-1">
          {section.items?.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-base"
              style={{ color: "var(--flip-text-body, var(--text-primary))" }}
            >
              <span
                className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: TEAL }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "verdict":
      return (
        <div
          className="rounded-2xl p-5 my-6"
          style={{
            background: "rgba(60,172,174,0.10)",
            border: `1px solid ${TEAL}`,
          }}
        >
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] mb-2" style={{ color: TEAL }}>
            Bottom Line
          </p>
          <p className="text-base md:text-lg font-bold leading-relaxed" style={{ color: "var(--flip-text-head)" }}>
            {section.text}
          </p>
        </div>
      );
    case "quick-take":
      return (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: "rgba(222,250,50,0.08)",
            border: `1px solid ${CHARTREUSE}`,
          }}
        >
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] mb-2" style={{ color: CHARTREUSE }}>
            Quick Take
          </p>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--flip-text-head)" }}>
            {section.text}
          </p>
        </div>
      );
    default:
      return null;
  }
}

function AppCTACard({
  size = "md",
  config,
}: {
  size?: "md" | "lg";
  config?: CTAConfig;
}) {
  const c = config ?? DEFAULT_CTA;
  const padding = size === "lg" ? "p-7" : "p-5";
  const titleSize = size === "lg" ? "text-2xl" : "text-xl";
  return (
    <div
      className={`rounded-2xl ${padding}`}
      style={{
        background: "linear-gradient(160deg, #0a1628 0%, #0d1e3a 100%)",
        border: `1px solid ${CHARTREUSE}`,
        boxShadow: "0 20px 60px -20px rgba(0,0,0,0.5)",
      }}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] mb-2" style={{ color: CHARTREUSE }}>
        {c.eyebrow}
      </p>
      <h3 className={`${titleSize} font-extrabold text-white mb-2 leading-tight`}>
        {c.title}
      </h3>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
        {c.description}
      </p>
      <ul className="space-y-1.5 mb-5 text-[13px]" style={{ color: "rgba(255,255,255,0.85)" }}>
        {c.bullets.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span
              className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold"
              style={{ background: CHARTREUSE, color: "#0a1628" }}
              aria-hidden
            >
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <a
        href={c.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center font-extrabold text-sm px-5 py-3 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: CHARTREUSE,
          color: "#0a1628",
          boxShadow: "0 0 24px rgba(222,250,50,0.30)",
        }}
      >
        {c.buttonText}
      </a>
      {c.footnote && (
        <p className="text-[11px] text-center mt-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
          {c.footnote}
        </p>
      )}
    </div>
  );
}

export default function GuidePostLayout({ post }: { post: BlogPost }) {
  const url = `${siteConfig.siteUrl}/blog/${post.slug}`;
  // Per-post CTA override (e.g. Titan on the ball-machine post) falls back
  // to the default Pickleball Drills app card.
  const cta = post.ctaOverride ?? DEFAULT_CTA;

  const tocItems = post.sections
    .filter((s) => s.type === "h2" && s.text)
    .map((s) => ({ id: slugifyHeading(s.text!), text: s.text! }));

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishDate,
    dateModified: post.publishDate,
    author: { "@type": "Person", name: "Austin Hardy", url: siteConfig.siteUrl },
    publisher: {
      "@type": "Organization",
      name: "Pickleball Playbook",
      url: siteConfig.siteUrl,
      logo: { "@type": "ImageObject", url: `${siteConfig.siteUrl}/images/Logo.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: post.thumbnail ? `${siteConfig.siteUrl}${post.thumbnail}` : undefined,
  };

  const faqSchema =
    post.faqs && post.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <div className="min-h-screen pt-[156px] pb-24 md:pb-16" style={{ background: "var(--bg-page)" }}>
        {/* Top tag strip — uses chartreuse to signal "this is a guide, not a paddle review" */}
        <div className="w-full" style={{ background: CHARTREUSE }}>
          <div className="container-xl">
            <p className="text-[11px] md:text-xs font-extrabold uppercase tracking-[0.2em] py-2.5" style={{ color: "#0a1628" }}>
              {post.guideTag || "Pickleball Guide"} · Pickleball Playbook
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
              <ArrowLeft className="w-4 h-4" /> All Articles
            </Link>
          </div>

          <header className="max-w-6xl mx-auto mb-8">
            {post.guideTag && (
              <div className="mb-3">
                <span
                  className="inline-block text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded"
                  style={{ background: "#0a1628", color: CHARTREUSE, border: `1px solid ${CHARTREUSE}` }}
                >
                  {post.guideTag}
                </span>
              </div>
            )}
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-4"
              style={{ color: "var(--flip-text-head)" }}
            >
              {post.title}
            </h1>
            <p
              className="text-base md:text-lg leading-relaxed mb-4 max-w-3xl"
              style={{ color: "var(--flip-text-body, var(--text-primary))" }}
            >
              {post.excerpt}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              By <strong style={{ color: "var(--flip-text-head)" }}>Austin Hardy</strong> · Published{" "}
              {formatDate(post.publishDate)} · 5.4 Rated · PPR Certified Coach
            </p>
          </header>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
            {/* Article column */}
            <div className="min-w-0">
              {tocItems.length > 1 && (
                <nav
                  className="rounded-2xl p-5 mb-8"
                  aria-label="On this page"
                  style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
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
                          <ChevronRight className="w-3.5 h-3.5 opacity-70" /> {t.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              <article className="mb-12">
                {post.sections.map((section, i) => (
                  <Fragment key={i}>
                    <RenderSection section={section} />
                    {/* Mid-article CTA — inject after the 3rd h2 so readers get
                        a natural break + a chance to convert before the FAQ. */}
                    {section.type === "h2" &&
                      post.sections.slice(0, i).filter((s) => s.type === "h2").length === 2 && (
                        <div className="my-8 lg:hidden">
                          <AppCTACard config={cta} />
                        </div>
                      )}
                  </Fragment>
                ))}
              </article>

              {/* FAQ */}
              {post.faqs && post.faqs.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-extrabold mb-5" style={{ color: "var(--flip-text-head)" }}>
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-3">
                    {post.faqs.map((f, i) => (
                      <details
                        key={i}
                        className="group rounded-xl p-5"
                        style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
                      >
                        <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-base md:text-lg font-bold" style={{ color: "var(--flip-text-head)" }}>
                          <span>{f.q}</span>
                          <span
                            className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center transition-transform group-open:rotate-45 text-lg font-bold"
                            style={{ background: "rgba(60,172,174,0.15)", color: TEAL, border: `1px solid ${TEAL}` }}
                            aria-hidden
                          >
                            +
                          </span>
                        </summary>
                        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--flip-text-body, var(--text-primary))" }}>
                          {f.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {/* Closing CTA */}
              <div className="mb-8">
                <AppCTACard size="lg" config={cta} />
              </div>
            </div>

            {/* Sticky sidebar (desktop) */}
            <aside className="hidden lg:block">
              <div className="sticky top-[180px]">
                <AppCTACard config={cta} />
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile floating CTA */}
        <div
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden p-3"
          style={{
            background: "linear-gradient(180deg, transparent 0%, #0a1628 25%)",
          }}
        >
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full font-extrabold text-sm px-5 py-3.5 rounded-2xl"
            style={{
              background: CHARTREUSE,
              color: "#0a1628",
              boxShadow: "0 12px 28px rgba(222,250,50,0.30)",
            }}
          >
            {cta.buttonText} <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </>
  );
}
