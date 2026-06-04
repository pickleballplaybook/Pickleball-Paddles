"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import AffiliateBuyButton from "@/components/AffiliateBuyButton";

interface Props {
  name: string;
  brand: string;
  price?: string;
  discountLink?: string;
  slug: string;
  code?: string;            // Discount code to auto-copy on click (omit for no-code paddles)
}

export default function StickyBottomBar({ name, brand, price, discountLink, slug, code }: Props) {
  const hasLink = !!discountLink?.trim();
  const hasCode = !!code?.trim();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl"
      style={{
        // Use theme-aware --sticky-bg-rgb so the bar is white in light mode
        // and navy in dark. Before, --flip-bg-rgb was never defined and the
        // fallback always rendered dark navy — invisible text in light mode.
        background: "rgba(var(--sticky-bg-rgb), 0.92)",
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
            <AffiliateBuyButton
              href={discountLink as string}
              code={hasCode ? code : undefined}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
              style={{ background: "#14b8a6" }}
              ariaLabel={hasCode ? `Buy ${brand} ${name} with discount code ${code}` : `Buy ${brand} ${name}`}
            >
              Apply Discount <ExternalLink className="w-3.5 h-3.5" />
            </AffiliateBuyButton>
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
