"use client";

import { useState } from "react";

interface Props {
  heroAlt: string;
  gallery: string[];
  bg?: string;
}

export default function GearGallery({ heroAlt, gallery, bg }: Props) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="rounded-3xl overflow-hidden w-full flex items-center justify-center"
        style={{
          background:
            bg ??
            "radial-gradient(circle at 50% 35%, var(--product-bg-spotlight) 0%, var(--product-bg-base) 100%)",
          aspectRatio: "1/1",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gallery[active]}
          alt={`${heroAlt} — photo ${active + 1}`}
          className="w-full h-full object-contain transition-opacity duration-200"
          style={{ padding: "12px" }}
        />
      </div>

      {/* Thumbnail strip */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {gallery.map((src, i) => (
          <button
            key={src}
            onClick={() => setActive(i)}
            className="flex-shrink-0 rounded-xl overflow-hidden transition-all duration-150"
            style={{
              width: "72px",
              height: "72px",
              border: i === active
                ? "2px solid #5a9df9"
                : "2px solid rgba(255,255,255,0.08)",
              background: "var(--bg-card)",
              boxShadow: i === active ? "0 0 12px rgba(90,157,249,0.4)" : "none",
              opacity: i === active ? 1 : 0.6,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${heroAlt} thumbnail ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
