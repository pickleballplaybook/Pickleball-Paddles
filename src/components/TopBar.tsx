"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function TopBar() {
  const [dismissed, setDismissed] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

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
      className="relative px-8 py-3 text-center"
      style={{ background: "#DEFA32", borderBottom: "1px solid rgba(0,0,0,0.12)" }}
    >
      {/* Row 1 — all caps, bold, larger */}
      <p
        className="font-extrabold uppercase tracking-tight leading-snug text-sm sm:text-[15px]"
        style={{ color: "#0B1A2B" }}
      >
        Become a Paddle Reviewer.
      </p>

      {/* Row 2 */}
      <p
        className="text-xs sm:text-sm leading-snug mt-1"
        style={{ color: "#2A3A4A" }}
      >
        Give paddles a ❤️ that you like.
      </p>

      {/* Row 3 — inline "Start Reviewing" link */}
      <p
        className="text-xs sm:text-sm leading-snug mt-1"
        style={{ color: "#2A3A4A" }}
      >
        Leave a 👎 on paddles you dislike.{" "}
        <Link
          href="/review-paddles"
          className="font-bold underline underline-offset-2 transition-opacity hover:opacity-70"
          style={{ color: "#0B1A2B" }}
        >
          Start Reviewing
        </Link>
      </p>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-3 top-3 p-1 rounded transition-opacity"
        style={{ color: "#0B1A2B", opacity: 0.75 }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
      >
        <X className="w-[16px] h-[16px]" strokeWidth={2} />
      </button>
    </div>
  );
}
