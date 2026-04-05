import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Youtube } from "lucide-react";
import { paddles, reviewDates } from "@/data/paddles";
import { getReviewGroups } from "@/lib/youtube";
import { siteConfig } from "@/config/site";
import YouTubeEmbed from "@/components/YouTubeEmbed";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "YouTube Reviews",
  description: `Watch full video reviews for every pickleball paddle listed on ${siteConfig.name}.`,
};

export default async function ReviewsPage() {
  // Groups are deduped by video ID and sorted newest-first by publish date
  const groups = await getReviewGroups(paddles, reviewDates);

  return (
    <div className="min-h-screen pt-16" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-20">

        {/* Header */}
        <div className="mb-14">
          <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">
            Video Reviews
          </p>
          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tight mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            YouTube Reviews
          </h1>
          <p className="text-lg max-w-xl mb-6" style={{ color: "var(--text-muted)" }}>
            Watch full in-depth reviews for every paddle before you buy. Then use code{" "}
            <span className="font-mono font-semibold text-brand-600">{siteConfig.discountCode}</span>{" "}
            to save.
          </p>
          <a
            href={siteConfig.youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl transition-all hover:bg-red-100"
          >
            <Youtube className="w-4 h-4" />
            @pickleballplaybook on YouTube
          </a>
        </div>

        {/* Review grid — one card per unique video */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {groups.map((group) => (
            <div key={group.videoId} className="space-y-4">

              {/* Card header */}
              <div>
                <p className="text-xs font-semibold text-brand-500 uppercase tracking-wide mb-0.5">
                  {group.brand}
                </p>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {group.title}
                </h2>

                {/* Paddle chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {group.paddles.map(({ name, slug }) => (
                    <Link
                      key={slug}
                      href={`/paddles/${slug}`}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
                      style={{
                        background: "var(--bg-alt)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {name}
                      <ArrowRight className="w-3 h-3 opacity-50" />
                    </Link>
                  ))}
                </div>
              </div>

              <YouTubeEmbed videoId={group.videoId} title={group.title} />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
