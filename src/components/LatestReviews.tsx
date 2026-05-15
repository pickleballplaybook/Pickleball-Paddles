import Link from "next/link";
import { ArrowRight, Eye, Play, Youtube } from "lucide-react";
import { siteConfig } from "@/config/site";
import { ReviewGroup } from "@/types";
import { paddles } from "@/data/paddles";

interface LatestReviewsProps {
  items: ReviewGroup[];
}

// Check if a review group's paddles share a seriesSlug
function getSeriesLink(group: ReviewGroup): string | null {
  const slugs = group.paddles.map((p) => {
    const paddle = paddles.find((pd) => pd.slug === p.slug);
    return paddle?.seriesSlug;
  }).filter(Boolean);
  if (slugs.length >= 2 && slugs.every((s) => s === slugs[0])) {
    return `/series/${slugs[0]}`;
  }
  return null;
}

export default function LatestReviews({ items }: LatestReviewsProps) {
  if (!items.length) return null;

  return (
    <section className="section-y" style={{ background: "var(--bg-section)" }}>
      <div className="container-xl">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Youtube className="w-4 h-4 text-red-500" />
              <p className="text-xs font-bold text-brand-500 uppercase tracking-widest">
                Fresh from YouTube
              </p>
            </div>
            <h2
              className="text-4xl md:text-5xl font-extrabold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Latest Reviews
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <a
              href={siteConfig.youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              <Youtube className="w-4 h-4 text-red-500" />
              @playbookreviews
            </a>
            <Link href="/reviews" className="btn-secondary text-sm">
              All Reviews <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((group) => {
            const thumbnail = `https://img.youtube.com/vi/${group.videoId}/hqdefault.jpg`;
            const seriesLink = getSeriesLink(group);
            const href = seriesLink ?? `/paddles/${group.primarySlug}`;

            return (
              <Link
                key={group.videoId}
                href={href}
                className="card group overflow-hidden flex flex-col"
              >
                {/* Thumbnail */}
                <div
                  className="relative aspect-video overflow-hidden rounded-t-2xl"
                  style={{ background: "var(--bg-alt)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnail}
                    alt={group.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-110">
                      <Play
                        className="w-4 h-4 text-slate-900 ml-0.5"
                        strokeWidth={0}
                        fill="currentColor"
                      />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col gap-1 flex-1">
                  <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">
                    {group.brand}
                  </p>
                  <h3
                    className="text-sm font-bold line-clamp-2 group-hover:text-brand-500 transition-colors leading-snug"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {group.title}
                  </h3>
                  {group.paddles.length > 1 && (
                    <p className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>
                      {group.paddles.map((p) => p.name).join(", ")}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <Play className="w-3 h-3" strokeWidth={2} />
                      Watch full review
                    </p>
                    {group.viewCount !== undefined && (
                      <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                        <Eye className="w-3 h-3" strokeWidth={2} />
                        {group.viewCount >= 1_000_000
                          ? `${(group.viewCount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
                          : group.viewCount >= 1_000
                          ? `${(group.viewCount / 1_000).toFixed(1).replace(/\.0$/, "")}K`
                          : group.viewCount}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile CTAs */}
        <div className="mt-8 sm:hidden flex flex-col gap-3">
          <a
            href={siteConfig.youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary justify-center"
          >
            <Youtube className="w-4 h-4 text-red-500" />
            @playbookreviews
          </a>
        </div>
      </div>
    </section>
  );
}
