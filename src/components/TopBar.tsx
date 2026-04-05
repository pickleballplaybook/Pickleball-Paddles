"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function TopBar() {
  const [dismissed, setDismissed] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Keep --topbar-h in sync so page content padding-top accounts for this bar.
  // The bar itself is NOT fixed — it flows inside the fixed shell in layout.tsx.
  useEffect(() => {
    function sync() {
      const h = dismissed ? 0 : (barRef.current?.offsetHeight ?? 0);
      document.documentElement.style.setProperty("--topbar-h", `${h}px`);
    }
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div
      ref={barRef}
      className="relative flex items-center justify-center gap-3 px-4 sm:px-12 py-[15px] text-center"
      style={{ background: "#DEFA32", borderBottom: "1px solid rgba(0,0,0,0.08)" }}
    >
      <p className="leading-snug">
        <span
          className="font-extrabold text-xs sm:text-[15px] tracking-tight"
          style={{ color: "#0B1A2B" }}
        >
          Become a Paddle Reviewer
        </span>
        <span
          className="hidden sm:inline font-medium text-xs sm:text-sm ml-2.5"
          style={{ color: "rgba(11,26,43,0.65)" }}
        >
          · Share your feedback and help shape what&apos;s trending
        </span>
      </p>

      <Link
        href="/review-paddles"
        className="hidden sm:inline-flex flex-shrink-0 text-xs font-bold px-4 py-1.5 rounded-lg transition-all whitespace-nowrap tracking-wide"
        style={{
          background: "#ffffff",
          color: "#0B1A2B",
          border: "1px solid rgba(0,0,0,0.10)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "#f0f0f0";
          el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "#ffffff";
          el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.10)";
        }}
      >
        Start Reviewing
      </Link>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity"
        style={{ color: "#0B1A2B", opacity: 0.5 }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.5"; }}
      >
        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
