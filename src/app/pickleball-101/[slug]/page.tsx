import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNewsletterPost, listNewsletterPosts } from "@/lib/newsletterPosts";
import { AdSlot } from "@/components/AdSlot";
import PlaybookSubscribeModal from "@/components/PlaybookSubscribeModal";
import { PlaybookProductCard } from "@/components/PlaybookProductCard";

export const runtime = "nodejs";
export const revalidate = 600; // 10 min

export async function generateStaticParams() {
  const posts = await listNewsletterPosts(200);
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsletterPost(slug);
  if (!post) return { title: "Not found" };
  const url = `https://playbookpaddles.com/pickleball-101/${post.slug}`;
  return {
    title: `${post.title} — The Playbook`,
    description: post.excerpt ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url,
      type: "article",
      images: post.featured_image ? [{ url: post.featured_image }] : undefined,
      publishedTime: post.published_at,
      authors: ["Austin Hardy"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.featured_image ? [post.featured_image] : undefined,
    },
  };
}

// Splits the raw content HTML into chunks by <p> tag so we can insert
// ad slots between paragraphs. Preserves everything else (headings,
// images, YouTube embeds, buttons) inline within the content.
function splitForAdInjection(html: string): string[] {
  // Split on the closing </p> tag but keep it. Every "chunk" ends with
  // </p> so we can rejoin cleanly and insert ads at chunk boundaries.
  const parts = html.split(/(<\/p>)/g);
  const paragraphs: string[] = [];
  let buf = "";
  for (const part of parts) {
    buf += part;
    if (part === "</p>") {
      paragraphs.push(buf);
      buf = "";
    }
  }
  if (buf.trim().length > 0) paragraphs.push(buf);
  return paragraphs;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PlaybookPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getNewsletterPost(slug);
  if (!post) notFound();

  const paragraphs = splitForAdInjection(post.content_html);
  // Ad injection strategy: every 4th paragraph gets an ad slot right
  // after it. Cap at 3 slots per post (top / mid / bottom) so we don't
  // stuff the reading experience.
  const AD_EVERY = 4;
  const MAX_ADS = 3;
  const adPositions = new Set<number>();
  for (let i = AD_EVERY - 1; i < paragraphs.length && adPositions.size < MAX_ADS; i += AD_EVERY) {
    adPositions.add(i);
  }

  const url = `https://playbookpaddles.com/pickleball-101/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.featured_image ?? undefined,
    datePublished: post.published_at,
    author: { "@type": "Person", name: "Austin Hardy" },
    publisher: {
      "@type": "Organization",
      name: "Pickleball Playbook",
      logo: {
        "@type": "ImageObject",
        url: "https://playbookpaddles.com/logo.png",
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article
        className="min-h-screen"
        style={{
          background: "var(--bg-page)",
          paddingTop: "calc(var(--topbar-h, 108px) + 3rem)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
          {/* Breadcrumb */}
          <p className="text-xs mb-4">
            <Link
              href="/pickleball-101"
              className="hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              ← The Playbook
            </Link>
          </p>

          {/* Title + meta — Dink-style: category pill above, title, then byline */}
          <header className="mb-8">
            {post.category && (
              <Link
                href={`/pickleball-101?category=${encodeURIComponent(post.category.toLowerCase())}`}
                className="inline-block px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest mb-4 no-underline"
                style={{
                  background: "var(--text-primary)",
                  color: "var(--bg-page)",
                }}
              >
                {post.category}
              </Link>
            )}
            <h1
              className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {post.title}
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              by Austin Hardy on {fmtDate(post.published_at)}
            </p>
          </header>

          {/* Featured image / hero */}
          {post.featured_image && (
            <figure className="mb-8 rounded-2xl overflow-hidden shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-auto"
              />
            </figure>
          )}

          {/* Top ad slot — above the fold, right after hero */}
          <AdSlot id="top" minHeight={280} />

          {/* Article body — Substack HTML with ad + product cards
              interleaved. Product cards fire at the ~1/3 and ~2/3
              marks of the article; ad slots fill the rest of the
              cadence per adPositions above. */}
          {(() => {
            const productPositions = new Set<number>();
            if (paragraphs.length >= 4) {
              productPositions.add(Math.floor(paragraphs.length / 3));
              productPositions.add(Math.floor((paragraphs.length * 2) / 3));
            }
            let productOffset = 0;
            return (
              <div
                className="playbook-content prose prose-lg max-w-none"
                style={{ color: "var(--text-primary)" }}
              >
                {paragraphs.map((p, i) => (
                  <div key={i}>
                    <div dangerouslySetInnerHTML={{ __html: p }} />
                    {productPositions.has(i) && (
                      <PlaybookProductCard slug={post.slug} offset={productOffset++} />
                    )}
                    {adPositions.has(i) && !productPositions.has(i) && (
                      <AdSlot id={`mid-${i}`} />
                    )}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Bottom ad slot */}
          <AdSlot id="bottom" minHeight={280} />

          {/* Subscribe CTA */}
          <aside
            className="my-10 p-6 md:p-8 rounded-2xl text-center"
            style={{
              background: "linear-gradient(180deg, rgba(96,165,250,0.08), rgba(96,165,250,0.02))",
              border: "1px solid rgba(96,165,250,0.30)",
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "#60a5fa" }}
            >
              Get the next one in your inbox
            </p>
            <h2
              className="text-xl md:text-2xl font-extrabold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Subscribe to The Playbook
            </h2>
            <p
              className="text-sm max-w-md mx-auto mb-5"
              style={{ color: "var(--text-muted)" }}
            >
              Weekly pickleball tips, drills, and strategy. Free. Unsubscribe
              anytime.
            </p>
            <a
              href="https://pickleballplaybook.substack.com"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-xs font-bold py-2.5 px-5 rounded-lg transition active:scale-[0.98]"
              style={{
                background: "var(--btn-buy-bg)",
                color: "var(--btn-buy-text)",
              }}
            >
              Subscribe free
            </a>
          </aside>

          {/* Back to index */}
          <p className="text-center mt-10">
            <Link
              href="/pickleball-101"
              className="text-sm hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              ← Back to all posts
            </Link>
          </p>
        </div>
      </article>

      {/* Prose overrides — style Substack's HTML output to match your
          brand. YouTube embeds get a rounded frame, buttons get your
          accent color, headings pick up the site font weight. */}
      <style>{`
        .playbook-content p { margin: 1em 0; line-height: 1.7; font-size: 17px; }
        .playbook-content h2 { font-size: 1.6rem; font-weight: 800; margin-top: 2em; margin-bottom: 0.5em; }
        .playbook-content h3 { font-size: 1.3rem; font-weight: 800; margin-top: 1.6em; margin-bottom: 0.4em; }
        .playbook-content ul, .playbook-content ol { margin: 1em 0; padding-left: 1.5em; }
        .playbook-content li { margin: 0.35em 0; }
        .playbook-content a { color: #2563eb; text-decoration: underline; }
        .playbook-content img { border-radius: 12px; margin: 1em auto; }
        .playbook-content .youtube-wrap { margin: 1.5em 0; }
        .playbook-content .youtube-wrap iframe { width: 100%; aspect-ratio: 16/9; height: auto; border-radius: 12px; }
        .playbook-content .button-wrapper { text-align: center; margin: 2em 0; }
        .playbook-content .button.primary {
          display: inline-block;
          background: var(--btn-buy-bg);
          color: var(--btn-buy-text);
          padding: 12px 24px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
        }
        .playbook-content blockquote {
          border-left: 4px solid var(--flip-card-border);
          padding-left: 1em;
          margin: 1.5em 0;
          font-style: italic;
          color: var(--text-muted);
        }
      `}</style>
      <PlaybookSubscribeModal />
    </>
  );
}
