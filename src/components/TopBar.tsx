"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { X, ThumbsUp, ThumbsDown } from "lucide-react";

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
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(90deg, #060d18 0%, #0d2240 50%, #060d18 100%)",
          borderBottom: "1px solid rgba(10, 100, 188,0.30)",
        }}
      >
        {/* Sweeping teal shimmer */}
        <div
          className="banner-shimmer absolute inset-y-0 pointer-events-none"
          style={{
            width: "50%",
            background: "linear-gradient(90deg, transparent, rgba(10, 100, 188,0.25), transparent)",
          }}
        />

        <div
          className="relative mx-auto text-center"
          style={{ maxWidth: "900px", padding: "11px 48px 11px" }}
        >
          {/* Line 1 */}
          <p
            className="md:text-[15px] text-[13px]"
            style={{ margin: 0, fontWeight: 800, lineHeight: 1, letterSpacing: "0.12em", color: "#ffffff" }}
          >
            RATE PADDLES YOU&apos;VE TRIED
          </p>

          {/* Line 2 */}
          <p
            className="flex items-center justify-center gap-1.5 md:text-[13px] text-[12px]"
            style={{ margin: "5px 0 0", lineHeight: 1.1, fontWeight: 400, color: "rgba(255,255,255,0.5)" }}
          >
            Tap
            <ThumbsUp className="w-3 h-3 flex-shrink-0" fill="none" stroke="#0a64bc" strokeWidth={2} />
            or
            <ThumbsDown className="w-3 h-3 flex-shrink-0" fill="none" stroke="#fb7185" strokeWidth={2} />
            to shape the rankings
          </p>

          {/* Line 3 — CTA */}
          <div style={{ marginTop: "7px" }}>
            <Link
              href="/review-paddles"
              className="inline-flex items-center gap-1 md:text-[13px] text-[12px]"
              style={{ fontWeight: 600, color: "#60a5fa", letterSpacing: "0.01em" }}
            >
              Start Voting
              <span aria-hidden style={{ fontSize: "0.85em" }}>→</span>
            </Link>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute top-1/2 -translate-y-1/2 right-3 md:right-4"
          style={{ color: "rgba(255,255,255,0.35)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
        >
          <X className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
