import Link from "next/link";
import type { Metadata } from "next";
import { listNewsletterPosts } from "@/lib/newsletterPosts";
import { ALL_CATEGORIES } from "@/lib/substackSync";
import PlaybookSubscribeModal from "@/components/PlaybookSubscribeModal";

export const runtime = "nodejs";
export const revalidate = 600; // 10 min

export const metadata: Metadata = {
  title: "Pickleball 101 — Weekly Tips, Drills & Masterclasses",
  description:
    "Weekly pickleball tips, drills, and technique masterclasses from Austin Hardy. Sorted by shot: drops, resets, dinks, volleys, serves, and strategy.",
  alternates: { canonical: "https://playbookpaddles.com/pickleball-101" },
  openGraph: {
    title: "Pickleball 101 — Weekly Tips, Drills & Masterclasses",
    description:
      "Weekly pickleball tips, drills, and strategy from Pickleball Playbook.",
    url: "https://playbookpaddles.com/pickleball-101",
    type: "website",
  },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PickleballIndex({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  // Match category param against our known set case-insensitively so
  // pretty URLs like ?category=drops match "Drops".
  const activeCategory =
    ALL_CATEGORIES.find((c) => c.toLowerCase() === (sp.category || "").toLowerCase()) ?? null;
  const posts = await listNewsletterPosts(100, activeCategory);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--bg-page)",
        paddingTop: "calc(var(--topbar-h, 108px) + 3rem)",
      }}
    >
      <div className="container-xl py-10 max-w-6xl mx-auto px-4">
        {/* Big section title — The Dink style */}
        <h1
          className="text-5xl md:text-6xl font-extrabold uppercase tracking-tight mb-8"
          style={{ color: "var(--text-primary)" }}
        >
          Pickleball 101
        </h1>

        {/* Category tabs */}
        <div className="flex items-center gap-2 flex-wrap mb-10 border-b pb-4" style={{ borderColor: "var(--flip-card-border)" }}>
          <Link
            href="/pickleball-101"
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition ${
              activeCategory === null ? "" : "hover:opacity-80"
            }`}
            style={{
              background: activeCategory === null ? "var(--text-primary)" : "transparent",
              color: activeCategory === null ? "var(--bg-page)" : "var(--text-muted)",
            }}
          >
            All
          </Link>
          {ALL_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <Link
                key={cat}
                href={`/pickleball-101?category=${encodeURIComponent(cat.toLowerCase())}`}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition ${
                  isActive ? "" : "hover:opacity-80"
                }`}
                style={{
                  background: isActive ? "var(--text-primary)" : "transparent",
                  color: isActive ? "var(--bg-page)" : "var(--text-muted)",
                }}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {posts.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            {activeCategory
              ? `No posts in "${activeCategory}" yet. Try another category.`
              : "Posts syncing — check back in a few minutes."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/pickleball-101/${post.slug}`}
                className="group flex flex-col no-underline"
              >
                {/* Featured image */}
                {post.featured_image && (
                  <div
                    className="relative w-full mb-4 overflow-hidden rounded-md"
                    style={{ aspectRatio: "16 / 9", background: "#0a0a0f" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                )}
                {/* Category pill — dark bg, uppercase, The Dink style */}
                <span
                  className="inline-block self-start px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest mb-3"
                  style={{
                    background: "var(--text-primary)",
                    color: "var(--bg-page)",
                  }}
                >
                  {post.category ?? "Tips"}
                </span>
                {/* Title */}
                <h2
                  className="text-2xl font-extrabold leading-tight mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {post.title}
                </h2>
                {/* Byline */}
                <p
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  by Austin Hardy on {fmtDate(post.published_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <PlaybookSubscribeModal />
    </div>
  );
}
