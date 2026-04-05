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
      className="relative flex items-center justify-center gap-3 px-10 py-2 text-center"
      style={{ background: "#3cacae", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
    >
      <p className="text-xs sm:text-sm leading-none">
        <span className="font-semibold" style={{ color: "#0f172a" }}>Become a paddle reviewer</span>
        <span
          className="hidden sm:inline ml-2"
          style={{ color: "rgba(0,0,0,0.55)" }}
        >
          · Share your feedback and help shape what&apos;s trending
        </span>
      </p>

      <Link
        href="/review-paddles"
        className="flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-lg transition-colors whitespace-nowrap"
        style={{
          background: "rgba(0,0,0,0.12)",
          color: "#0f172a",
          border: "1px solid rgba(0,0,0,0.18)",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.22)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.12)"; }}
      >
        Start Reviewing
      </Link>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity"
        style={{ color: "rgba(0,0,0,0.4)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.75)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"; }}
      >
        <X className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
