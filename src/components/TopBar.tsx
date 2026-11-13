"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

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
            style={{ margin: 0, fontWeight: 400, lineHeight: 1.3, color: "rgba(255,255,255,0.85)" }}
          >
            The most effective app for leveling up your pickleball game.
          </p>

          {/* CTA */}
          <div style={{ marginTop: "7px" }}>
            <a
              href="https://pbdrills.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 md:text-[13px] text-[12px]"
              style={{ fontWeight: 600, color: "#60a5fa", letterSpacing: "0.01em" }}
            >
              Try the app
              <span aria-hidden style={{ fontSize: "0.85em" }}>→</span>
            </a>
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
