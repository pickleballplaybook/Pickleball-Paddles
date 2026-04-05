"use client";

import { Tag, Copy, Check } from "lucide-react";
import { useState } from "react";
import { siteConfig } from "@/config/site";

interface DiscountBannerProps {
  variant?: "default" | "large";
}

export default function DiscountBanner({ variant = "default" }: DiscountBannerProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(siteConfig.discountCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (variant === "large") {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-8 md:p-10 text-white shadow-glow">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Tag className="w-4 h-4 text-brand-200" />
              <span className="text-brand-200 text-sm font-semibold uppercase tracking-widest">
                Exclusive Discount
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold mb-1">
              Use Code{" "}
              <span className="font-mono bg-white/15 border border-white/20 px-3 py-1 rounded-xl">
                {siteConfig.discountCode}
              </span>{" "}
              at Checkout
            </h3>
            <p className="text-brand-100 text-sm font-light">
              Works on all paddles listed on this site. No minimum spend.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className={`flex-shrink-0 inline-flex items-center gap-2.5 font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-200
              ${copied
                ? "bg-white text-brand-600 shadow-lg scale-105"
                : "bg-white/10 border border-white/20 text-white hover:bg-white hover:text-brand-600 hover:shadow-lg hover:scale-105"
              }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Code
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Tag className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-brand-600 font-semibold uppercase tracking-widest mb-0.5">
            Save at checkout
          </p>
          <p className="text-sm font-bold text-brand-800">
            Use Code{" "}
            <span className="font-mono bg-brand-100 px-1.5 py-0.5 rounded">
              {siteConfig.discountCode}
            </span>{" "}
            to Save
          </p>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 flex-shrink-0
          ${copied
            ? "bg-brand-600 text-white"
            : "bg-white text-brand-700 border border-brand-200 hover:bg-brand-600 hover:text-white hover:border-brand-600"
          }`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            Copy Code
          </>
        )}
      </button>
    </div>
  );
}
