import Link from "next/link";
import { ArrowRight, Play, Youtube } from "lucide-react";
import { siteConfig } from "@/config/site";
import { ReviewGroup } from "@/types";
import { paddles } from "@/data/paddles";

interface LatestReviewsProps {
  items: ReviewGroup[];
  featuredGroup?: ReviewGroup;
}

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

function relativeDate(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

export default function LatestReviews({ items, featuredGroup }: LatestReviewsProps) {
  if (!items.length && !featuredGroup) return null;

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
              @playbookpaddles
            </a>
            <Link href="/reviews" className="btn-secondary text-sm">
              All Reviews <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Featured hero + two stacked cards */}
        {featuredGroup && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            {/* Featured — takes 2/3 */}
            {(() => {
              const sLink = getSeriesLink(featuredGroup);
              const href = sLink ?? `/paddles/${featuredGroup.primarySlug}`;
              const rel = relativeDate(featuredGroup.reviewDate);
              return (
                <Link
                  href={href}
                  className="card group overflow-hidden flex flex-col lg:col-span-2"
                  style={{ boxShadow: "0 0 0 2px rgba(90,157,249,0.35), 0 4px 32px rgba(0,0,0,0.22)" }}
                >
                  <div
                    className="relative aspect-video overflow-hidden rounded-t-2xl"
                    style={{ background: "var(--bg-alt)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${featuredGroup.videoId}/maxresdefault.jpg`}
                      alt={featuredGroup.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl transition-transform duration-200 group-hover:scale-110">
                        <Play className="w-6 h-6 text-slate-900 ml-0.5" strokeWidth={0} fill="currentColor" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full"
                        style={{ background: "#5a9df9", color: "#fff" }}
                      >
                        Latest
                      </span>
                    </div>
                    {rel && (
                      <div className="absolute bottom-3 right-3">
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}
                        >
                          {rel}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col gap-1 flex-1">
                    <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">
                      {featuredGroup.brand}
                    </p>
                    <h3
                      className="text-xl font-extrabold group-hover:text-brand-500 transition-colors leading-snug"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {featuredGroup.title}
                    </h3>
                    {featuredGroup.paddles.length > 1 && (
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        {featuredGroup.paddles.map((p) => p.name).join(" · ")}
                      </p>
                    )}
                    <div className="flex items-center mt-auto pt-2">
                      <p className="text-sm font-semibold flex items-center gap-1.5 text-brand-500">
                        <Play className="w-3.5 h-3.5" strokeWidth={2} />
                        Watch full review
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })()}

            {/* Next 2 reviews stacked */}
            <div className="flex flex-col gap-5">
              {items.slice(0, 2).map((group) => {
                const sLink = getSeriesLink(group);
                const href = sLink ?? `/paddles/${group.primarySlug}`;
                const rel = relativeDate(group.reviewDate);
                return (
                  <Link key={group.videoId} href={href} className="card group overflow-hidden flex flex-col flex-1">
                    <div
                      className="relative overflow-hidden rounded-t-2xl"
                      style={{ background: "var(--bg-alt)", aspectRatio: "16/9" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${group.videoId}/hqdefault.jpg`}
                        alt={group.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 group-hover:bg-slate-900/10 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-110">
                          <Play className="w-3.5 h-3.5 text-slate-900 ml-0.5" strokeWidth={0} fill="currentColor" />
                        </div>
                      </div>
                      {rel && (
                        <div className="absolute bottom-2 right-2">
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}
                          >
                            {rel}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-0.5 flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">
                        {group.brand}
                      </p>
                      <h3
                        className="text-xs font-bold line-clamp-2 group-hover:text-brand-500 transition-colors leading-snug"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {group.title}
                      </h3>
                      <p className="text-[10px] mt-auto pt-1 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                        <Play className="w-3 h-3 inline" strokeWidth={2} />
                        Watch full review
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Remaining reviews in 4-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(featuredGroup ? items.slice(2) : items).map((group) => {
            const thumbnail = `https://img.youtube.com/vi/${group.videoId}/hqdefault.jpg`;
            const seriesLink = getSeriesLink(group);
            const href = seriesLink ?? `/paddles/${group.primarySlug}`;
            const rel = relativeDate(group.reviewDate);

            return (
              <Link
                key={group.videoId}
                href={href}
                className="card group overflow-hidden flex flex-col"
              >
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
                  <div className="absolute inset-0 group-hover:bg-slate-900/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-110">
                      <Play className="w-4 h-4 text-slate-900 ml-0.5" strokeWidth={0} fill="currentColor" />
                    </div>
                  </div>
                  {rel && (
                    <div className="absolute bottom-2 right-2">
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}
                      >
                        {rel}
                      </span>
                    </div>
                  )}
                </div>

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
                    <p className="text-xs flex items-center gap-1 text-brand-500 font-semibold">
                      <Play className="w-3 h-3" strokeWidth={2} />
                      Watch review
                    </p>
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
            @playbookpaddles
          </a>
        </div>
      </div>
    </section>
  );
}
