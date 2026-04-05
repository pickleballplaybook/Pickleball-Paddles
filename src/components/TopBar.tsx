"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";

export default function TopBar() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="relative flex items-center justify-center gap-3 px-10 py-2 text-center"
      style={{ background: "#0b1628", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <p className="text-xs sm:text-sm leading-none">
        <span className="font-semibold text-white">Become a paddle reviewer</span>
        <span
          className="hidden sm:inline ml-2"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          · Share your feedback and help shape what&apos;s trending
        </span>
      </p>

      <Link
        href="/review-paddles"
        className="flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-lg transition-colors whitespace-nowrap"
        style={{
          background: "rgba(20,184,166,0.15)",
          color: "#2dd4bf",
          border: "1px solid rgba(20,184,166,0.25)",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(20,184,166,0.25)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(20,184,166,0.15)"; }}
      >
        Start Reviewing
      </Link>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity"
        style={{ color: "rgba(255,255,255,0.3)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"; }}
      >
        <X className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
