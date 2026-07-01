import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { blogPosts } from "@/data/blogPosts";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Pickleball Blog: Drills, Training, Reviews & Tips",
  description: `Pickleball drills, training plans, paddle reviews, and gear guides from ${siteConfig.name}. Drill smarter, hit harder, climb your rating faster.`,
  alternates: { canonical: `${siteConfig.siteUrl}/blog` },
  openGraph: {
    title: "Pickleball Blog: Drills, Training, Reviews & Tips",
    description: "Pickleball drills, training plans, paddle reviews, and gear guides. The fastest way to move up a rating level.",
    url: `${siteConfig.siteUrl}/blog`,
    type: "website",
    siteName: siteConfig.name,
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  const sorted = [...blogPosts].sort((a, b) =>
    b.publishDate.localeCompare(a.publishDate)
  );

  return (
    <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-20">

        {/* Header */}
        <div className="mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
            Drills · Training · Reviews · Gear
          </p>
          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tight mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            The Pickleball Blog
          </h1>
          <p className="text-lg max-w-xl" style={{ color: "var(--text-muted)" }}>
            Drills, training plans, paddle reviews, and gear comparisons — built by a PPR-certified coach who tests every product before recommending it.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-1"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.14)",
              }}
            >
              {/* Thumbnail */}
              <div
                className="relative w-full flex items-center justify-center overflow-hidden"
                style={{ background: "var(--bg-alt)", aspectRatio: "16 / 9" }}
              >
                {post.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.thumbnail}
                    alt={post.paddleName ?? post.title}
                    className="w-full h-full object-contain p-6"
                    style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.3))" }}
                  />
                ) : post.videoId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://img.youtube.com/vi/${post.videoId}/hqdefault.jpg`}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="w-12 h-12 opacity-20" style={{ color: "var(--text-muted)" }} />
                )}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(10, 100, 188,0.30) 0%, transparent 70%)" }}
                />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: post.category === "guide" ? "#defa32" : "#60a5fa" }}
                >
                  {post.guideTag ?? post.brand ?? "Pickleball Guide"}
                </p>
                <h2
                  className="font-bold text-sm leading-snug mb-2 group-hover:text-teal-500 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  {post.title}
                </h2>
                <p className="text-xs mb-4 flex-1" style={{ color: "var(--text-muted)" }}>
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {formatDate(post.publishDate)}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{
                      background: "rgba(10, 100, 188,0.30)",
                      color: "#60a5fa",
                      border: "1px solid rgba(10, 100, 188,0.30)",
                    }}
                  >
                    Read Review <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
