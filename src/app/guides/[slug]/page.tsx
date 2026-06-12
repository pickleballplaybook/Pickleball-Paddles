import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  guides,
  getGuideBySlug,
  getRelatedGuides,
  GUIDE_CATEGORIES,
  GuideSection,
} from "@/data/guides";
import { getPaddleBySlug } from "@/data/paddles";
import { siteConfig } from "@/config/site";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const guide = getGuideBySlug(params.slug);
  if (!guide) return {};
  const url = `${siteConfig.siteUrl}/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
      type: "article",
      publishedTime: guide.publishDate,
      modifiedTime: guide.updatedDate ?? guide.publishDate,
      authors: ["Austin Hardy"],
      url,
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.metaDescription,
    },
  };
}

// ── Section renderer ─────────────────────────────────────────────────────────
// Mirrors the blog renderer's vocabulary (p / h2 / ul / verdict) and adds
// h3, ol, table, and callout. Guides lean harder on tables and lists than
// reviews do, because the format is genuinely Q&A-shaped.
function RenderSection({ section }: { section: GuideSection }) {
  switch (section.type) {
    case "h2":
      return (
        <h2
          className="text-2xl font-extrabold mt-10 mb-4 tracking-tight"
          style={{ color: "var(--flip-text-head)" }}
        >
          {section.text}
        </h2>
      );
    case "h3":
      return (
        <h3
          className="text-lg font-bold mt-6 mb-2"
          style={{ color: "var(--flip-text-head)" }}
        >
          {section.text}
        </h3>
      );
    case "p":
      return (
        <p
          className="text-base leading-relaxed mb-4"
          style={{ color: "var(--flip-text-body, var(--text-primary))" }}
        >
          {section.text}
        </p>
      );
    case "ul":
      return (
        <ul className="mb-5 space-y-1.5 pl-1">
          {section.items?.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-base"
              style={{ color: "var(--flip-text-body, var(--text-primary))" }}
            >
              <span
                className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "#14b8a6" }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mb-5 space-y-2 list-decimal pl-6">
          {section.items?.map((item, i) => (
            <li
              key={i}
              className="text-base pl-1"
              style={{ color: "var(--flip-text-body, var(--text-primary))" }}
            >
              {item}
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="overflow-x-auto mb-6 rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(20,184,166,0.10)" }}>
                {section.headers?.map((h, i) => (
                  <th
                    key={i}
                    className="text-left font-extrabold uppercase text-xs tracking-wider px-4 py-3"
                    style={{ color: "rgba(45,212,191,0.95)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows?.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`px-4 py-3 align-top ${j === 0 ? "font-bold" : ""}`}
                      style={{ color: j === 0 ? "var(--flip-text-head)" : "var(--flip-text-body, var(--text-primary))" }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout": {
      const v = section.variant ?? "info";
      const colors = {
        info:    { bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.30)", label: "Note" },
        tip:     { bg: "rgba(20,184,166,0.10)", border: "rgba(20,184,166,0.30)", label: "Tip" },
        warning: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)", label: "Heads up" },
      }[v];
      return (
        <div
          className="rounded-xl p-4 my-5"
          style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
        >
          <p className="text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: colors.border }}>
            {colors.label}
          </p>
          <p className="text-base leading-relaxed" style={{ color: "var(--flip-text-body, var(--text-primary))" }}>
            {section.text}
          </p>
        </div>
      );
    }
    case "verdict":
      return (
        <div
          className="rounded-2xl p-5 my-8"
          style={{
            background: "linear-gradient(135deg, rgba(20,184,166,0.18) 0%, rgba(20,184,166,0.05) 100%)",
            border: "1px solid rgba(45,212,191,0.30)",
          }}
        >
          <p className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color: "#5eead4" }}>
            Bottom Line
          </p>
          <p className="text-base leading-relaxed" style={{ color: "var(--flip-text-body, var(--text-primary))" }}>
            {section.text}
          </p>
        </div>
      );
    case "paddle-ref":
      // Reuses the same small card the bottom-of-page "Paddles to Consider"
      // block uses. Wrapped in a tiny margin so it reads as a callout pinned
      // to the paragraph that mentions it, not as a section of its own.
      if (!section.slug) return null;
      return (
        <div className="my-4">
          <PaddleRecCard slug={section.slug} />
        </div>
      );
  }
}

// ── Paddle recommendation card ───────────────────────────────────────────────
function PaddleRecCard({ slug }: { slug: string }) {
  const paddle = getPaddleBySlug(slug);
  if (!paddle) return null;
  const hasDiscount =
    !!paddle.discountLink?.trim() &&
    !!paddle.amountOff &&
    paddle.amountOff !== "$0" &&
    paddle.amountOff !== "";
  return (
    <Link
      href={`/paddles/${paddle.slug}`}
      className="flex items-center gap-4 p-4 rounded-xl transition hover:scale-[1.01]"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        {paddle.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={paddle.image} alt={paddle.name} className="w-full h-full object-contain p-1" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "rgba(45,212,191,0.9)" }}>
          {paddle.brand}
        </p>
        <p className="text-base font-bold leading-tight" style={{ color: "var(--flip-text-head)" }}>
          {paddle.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--flip-text-muted)" }}>
          {paddle.shape} · {paddle.thickness} · {paddle.weight}
        </p>
      </div>
      {hasDiscount && (
        <span
          className="text-[10px] font-extrabold font-mono px-2 py-1 rounded-md flex-shrink-0"
          style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}
        >
          {paddle.amountOff} OFF
        </span>
      )}
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function GuidePage({ params }: Props) {
  const guide = getGuideBySlug(params.slug);
  if (!guide) notFound();

  const related = getRelatedGuides(guide.slug);
  const category = GUIDE_CATEGORIES[guide.category];
  const url = `${siteConfig.siteUrl}/guides/${guide.slug}`;

  // JSON-LD: Article + FAQPage. Article gives Google the publish/modified
  // dates and author; FAQPage is what unlocks the expanded SERP cards that
  // dramatically improve click-through on long-tail informational queries.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.metaDescription,
      datePublished: guide.publishDate,
      dateModified: guide.updatedDate ?? guide.publishDate,
      author: { "@type": "Person", name: "Austin Hardy" },
      publisher: {
        "@type": "Organization",
        name: siteConfig.name,
        logo: { "@type": "ImageObject", url: `${siteConfig.siteUrl}${siteConfig.logoPath}` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <div className="min-h-screen pt-[156px] pb-20">
      <div className="max-w-3xl mx-auto px-4">

        {/* Back link */}
        <Link
          href="/guides"
          className="inline-flex items-center gap-1.5 text-sm font-bold mb-4 transition hover:opacity-80"
          style={{ color: "rgba(45,212,191,0.9)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          All Guides
        </Link>

        {/* Category chip */}
        <p
          className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
          style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.25)" }}
        >
          {category.label}
        </p>

        {/* H1 */}
        <h1
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 leading-tight"
          style={{ color: "var(--flip-text-head)" }}
        >
          {guide.title}
        </h1>

        {/* Excerpt as lead */}
        <p className="text-lg leading-relaxed mb-2" style={{ color: "var(--flip-text-muted)" }}>
          {guide.excerpt}
        </p>

        {/* Publish/updated meta */}
        <p className="text-xs mb-10" style={{ color: "var(--flip-text-muted)" }}>
          Published {new Date(guide.publishDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          {guide.updatedDate && guide.updatedDate !== guide.publishDate && (
            <> · Updated {new Date(guide.updatedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</>
          )}
        </p>

        {/* Body */}
        <article>
          {guide.sections.map((s, i) => <RenderSection key={i} section={s} />)}
        </article>

        {/* Paddle recommendations */}
        {guide.paddleSlugs && guide.paddleSlugs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-extrabold mb-4" style={{ color: "var(--flip-text-head)" }}>
              Paddles to Consider
            </h2>
            <div className="flex flex-col gap-2.5">
              {guide.paddleSlugs.map((slug) => <PaddleRecCard key={slug} slug={slug} />)}
            </div>
          </section>
        )}

        {/* FAQ section (visible — the JSON-LD is in <head>) */}
        {guide.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-extrabold mb-5" style={{ color: "var(--flip-text-head)" }}>
              Frequently Asked Questions
            </h2>
            <div className="flex flex-col gap-3">
              {guide.faqs.map((f, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="font-bold text-base mb-2" style={{ color: "var(--flip-text-head)" }}>
                    {f.q}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--flip-text-body, var(--text-primary))" }}>
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related guides */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-extrabold mb-4" style={{ color: "var(--flip-text-head)" }}>
              Related Guides
            </h2>
            <div className="flex flex-col gap-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/guides/${r.slug}`}
                  className="block p-4 rounded-xl transition hover:scale-[1.01]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "rgba(45,212,191,0.9)" }}>
                    {GUIDE_CATEGORIES[r.category].label}
                  </p>
                  <p className="font-bold text-base" style={{ color: "var(--flip-text-head)" }}>
                    {r.title}
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--flip-text-muted)" }}>
                    {r.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </div>
    </div>
  );
}
