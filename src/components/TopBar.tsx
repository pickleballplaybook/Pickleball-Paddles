"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { X, Heart } from "lucide-react";

export default function TopBar() {
  const [dismissed, setDismissed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Measure the full wrapper (status-bar fix + banner) so --topbar-h is always correct
  useEffect(() => {
    function sync() {
      const h = dismissed ? 0 : (wrapperRef.current?.offsetHeight ?? 0);
      document.documentElement.style.setProperty("--topbar-h", `${h}px`);
    }
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div ref={wrapperRef}>
      {/* Announcement banner */}
      <div
        className="relative"
        style={{ background: "#DEFA32", borderBottom: "1px solid rgba(0,0,0,0.12)" }}
      >
        <div
          className="mx-auto text-center"
          style={{ maxWidth: "900px", padding: "12px 48px 10px" }}
        >
          {/* Line 1 — all caps, extrabold */}
          <p
            className="md:text-lg text-[15px]"
            style={{ margin: 0, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", color: "#0B1A2B" }}
          >
            BECOME A PADDLE REVIEWER.
          </p>

          {/* Line 2 — heart icon (same lucide Heart used across the site) */}
          <p
            className="flex items-center justify-center gap-1 md:text-base text-[13px]"
            style={{ margin: "4px 0 0", lineHeight: 1.1, fontWeight: 500, color: "#2A3A4A" }}
          >
            Give paddles a
            <Heart className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="#ff4f7a" strokeWidth={2} />
            that you like.
          </p>

          {/* Line 3 — Start Reviewing CTA only */}
          <div style={{ marginTop: "6px" }}>
            <Link
              href="/review-paddles"
              className="md:text-base text-sm"
              style={{ fontWeight: 700, color: "#0B1A2B", textDecoration: "underline", textUnderlineOffset: "2px" }}
            >
              Start Reviewing
            </Link>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute top-1/2 -translate-y-1/2 right-3 md:right-3.5"
          style={{ color: "#0B1A2B", opacity: 0.75, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
        >
          <X className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
