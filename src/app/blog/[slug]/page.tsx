import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { blogPosts, getBlogPostBySlug, BlogSection } from "@/data/blogPosts";
import { getPaddleBySlug } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import YouTubeEmbed from "@/components/YouTubeEmbed";

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
      ...(imageUrl ? { images: [{ url: imageUrl, alt: `${post.brand} ${post.paddleName} review` }] } : {}),
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

function RenderSection({ section }: { section: BlogSection }) {
  switch (section.type) {
    case "h2":
      return (
        <h2
          className="text-xl font-extrabold mt-8 mb-3"
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
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#14b8a6" }} />
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
            background: "rgba(20,184,166,0.08)",
            border: "1px solid rgba(20,184,166,0.25)",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
            Verdict
          </p>
          <p className="text-base font-semibold leading-relaxed" style={{ color: "var(--flip-text-head)" }}>
            {section.text}
          </p>
        </div>
      );
    default:
      return null;
  }
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) notFound();

  const linkedPaddles = post.paddleSlugs
    .map((s) => getPaddleBySlug(s))
    .filter(Boolean) as NonNullable<ReturnType<typeof getPaddleBySlug>>[];

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

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
    <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-16">

        <div className="max-w-3xl mx-auto">

          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors hover:text-teal-500"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" /> All Reviews
          </Link>

          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
              {post.brand}
            </p>
            <h1
              className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-3"
              style={{ color: "var(--flip-text-head)" }}
            >
              {post.title}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {formatDate(post.publishDate)}
            </p>
          </div>

          {/* YouTube embed */}
          {post.videoId && (
            <div className="mb-8 rounded-2xl overflow-hidden">
              <YouTubeEmbed videoId={post.videoId} title={post.title} />
            </div>
          )}

          {/* Article body */}
          <article className="mb-10">
            {post.sections.map((section, i) => (
              <RenderSection key={i} section={section} />
            ))}
          </article>

          {/* Discount code callout */}
          <div
            className="rounded-2xl p-6 mb-10 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{
              background: "var(--flip-bg-card)",
              border: "1px solid var(--flip-card-border)",
            }}
          >
            <div className="flex-1">
              <p className="font-bold text-base mb-1" style={{ color: "var(--flip-text-head)" }}>
                Save on {post.brand} paddles
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Use code{" "}
                <span className="font-mono font-bold" style={{ color: "#2dd4bf" }}>
                  {discountCode}
                </span>{" "}
                at checkout for a discount.
              </p>
            </div>
            {linkedPaddles[0] && (
              <Link
                href={linkedPaddles[0].discountLink || `/paddles/${linkedPaddles[0].slug}`}
                target={linkedPaddles[0].discountLink ? "_blank" : undefined}
                rel={linkedPaddles[0].discountLink ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:opacity-90 flex-shrink-0"
                style={{
                  background: "rgba(20,184,166,0.12)",
                  color: "#2dd4bf",
                  border: "1px solid rgba(20,184,166,0.25)",
                }}
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Linked paddle cards */}
          {linkedPaddles.length > 0 && (
            <div className="mb-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                Reviewed Paddles
              </p>
              <div className="flex flex-col gap-3">
                {linkedPaddles.map((paddle) => (
                  <Link
                    key={paddle.slug}
                    href={`/paddles/${paddle.slug}`}
                    className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:border-teal-500/40"
                    style={{
                      background: "var(--flip-bg-card)",
                      border: "1px solid var(--flip-card-border)",
                    }}
                  >
                    {paddle.image && (
                      <div
                        className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                        style={{ background: "var(--bg-alt)" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={paddle.image}
                          alt={paddle.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#14b8a6" }}>
                        {paddle.brand}
                      </p>
                      <p className="font-bold text-sm truncate" style={{ color: "var(--flip-text-head)" }}>
                        {paddle.name}
                      </p>
                      {paddle.price && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {paddle.price}
                        </p>
                      )}
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
                      style={{
                        background: "rgba(20,184,166,0.12)",
                        color: "#2dd4bf",
                        border: "1px solid rgba(20,184,166,0.2)",
                      }}
                    >
                      View Paddle <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to blog */}
          <div className="border-t pt-8" style={{ borderColor: "var(--border)" }}>
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
    </div>
    </>
  );
}
