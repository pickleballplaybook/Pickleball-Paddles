"use client";

import { useState } from "react";
import { Play, ExternalLink } from "lucide-react";
import Image from "next/image";
import { siteConfig } from "@/config/site";

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  customThumbnail?: string;
}

export default function YouTubeEmbed({
  videoId,
  title = "Watch Full Paddle Review",
  customThumbnail,
}: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const isPlaceholder = !videoId || videoId === "REPLACE_WITH_REAL_ID";

  if (isPlaceholder) {
    return (
      <div
        className="relative aspect-video rounded-2xl overflow-hidden flex items-center justify-center"
        style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
      >
        <div className="text-center px-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(90,157,249,0.10)", border: "1px solid rgba(90,157,249,0.20)" }}
          >
            <Play className="w-6 h-6 ml-1" style={{ color: "#5a9df9" }} />
          </div>
          <p className="font-semibold text-base mb-1" style={{ color: "var(--flip-text-head)" }}>
            Review coming soon
          </p>
          <p className="text-sm max-w-xs mx-auto" style={{ color: "var(--flip-text-muted)" }}>
            We&apos;re working on a full video review for this paddle. Check back soon or{" "}
            <a
              href={siteConfig.youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:opacity-80"
              style={{ color: "#5a9df9" }}
            >
              @playbookpaddles
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  const thumbnailUrl = customThumbnail ?? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  if (isPlaying) {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-card-hover">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group shadow-card hover:shadow-card-hover transition-shadow duration-300"
      onClick={() => setIsPlaying(true)}
      role="button"
      aria-label={`Play: ${title}`}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setIsPlaying(true)}
    >
      {/* Thumbnail */}
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 1024px) 100vw, 800px"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/20 transition-colors duration-300" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-lg
                        transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
          <Play
            className="w-6 h-6 md:w-7 md:h-7 text-slate-900 ml-1"
            strokeWidth={0}
            fill="currentColor"
          />
        </div>
      </div>

      {/* Title bar */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-900/80 to-transparent">
        <div className="flex items-center justify-between">
          <p className="text-white font-semibold text-sm">{title}</p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Open on YouTube"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
