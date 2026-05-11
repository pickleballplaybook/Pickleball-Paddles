"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface Props {
  name: string;
  brand: string;
  price?: string;
  discountLink?: string;
  slug: string;
}

export default function StickyBottomBar({ name, brand, price, discountLink, slug }: Props) {
  const hasLink = !!discountLink?.trim();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl"
      style={{
        background: "rgba(var(--flip-bg-rgb, 15,23,42), 0.92)",
        borderColor: "var(--flip-card-border)",
      }}
    >
      <div className="container-xl flex items-center justify-between py-3 gap-4">
        {/* Left — paddle identity */}
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--flip-text-head)" }}>
            {name}
          </p>
          <p className="text-xs" style={{ color: "var(--flip-text-muted)" }}>
            {brand}
          </p>
        </div>

        {/* Right — price + actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {price && (
            <span className="text-lg font-extrabold hidden sm:block" style={{ color: "var(--flip-text-head)" }}>
              {price}
            </span>
          )}
          <Link
            href={`/compare?paddles=${slug}`}
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
            style={{
              borderColor: "var(--flip-card-border)",
              color: "var(--flip-text-head)",
            }}
          >
            Compare
          </Link>
          {hasLink ? (
            <a
              href={discountLink}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
              style={{ background: "#14b8a6" }}
            >
              Buy at {brand} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "var(--flip-bg-card)", color: "var(--flip-text-muted)" }}
            >
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
