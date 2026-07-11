"use client";

/**
 * NewsletterPopup
 *
 * Shows once per browser session. Three independent triggers, first one wins:
 *   1. Timer  — fires after siteConfig.newsletterPopup.delaySeconds
 *   2. Scroll — fires when user reaches siteConfig.newsletterPopup.scrollThreshold %
 *   3. Exit intent — fires when the cursor leaves the viewport from the top (desktop only)
 *
 * Toggle on/off, change delay, or change the scroll threshold in:
 *   src/config/site.ts  →  newsletterPopup
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function NewsletterPopup() {
  const { enabled, delaySeconds, scrollThreshold, storageKey } =
    siteConfig.newsletterPopup;

  const [rendered, setRendered]   = useState(false); // in the DOM?
  const [visible,  setVisible]    = useState(false); // animation active?
  const shownRef                  = useRef(false);   // guard against double-fire

  // ── Show / dismiss helpers ─────────────────────────────────────────────────

  const show = useCallback(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    setRendered(true);
    // One rAF lets the browser paint the hidden state first so the CSS
    // transition actually runs when we flip visible → true.
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    // Store a TIMESTAMP so we can re-ask engaged returners after 14 days
    // instead of silencing forever after one dismissal.
    try { localStorage.setItem(storageKey, String(Date.now())); } catch { /* private mode */ }
    // Remove from DOM after the leave transition completes.
    setTimeout(() => setRendered(false), 380);
  }, [storageKey]);

  // ── Keyboard (Escape to close) ─────────────────────────────────────────────
  useEffect(() => {
    if (!rendered) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [rendered, dismiss]);

  // ── Trigger logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    // Already dismissed within the last 14 days → do nothing. After 14 days
    // an engaged returner gets re-asked (lots of buyers research a paddle for
    // weeks before pulling the trigger).
    try {
      const ts = parseInt(localStorage.getItem(storageKey) ?? "", 10);
      if (!Number.isNaN(ts) && Date.now() - ts < 14 * 86400000) return;
    } catch { /* private mode — proceed */ }

    // ── 1. Timer ──────────────────────────────────────────────────────────────
    const timer = setTimeout(show, delaySeconds * 1000);

    // ── 2. Scroll depth ───────────────────────────────────────────────────────
    const onScroll = () => {
      const docH  = document.body.scrollHeight - window.innerHeight;
      if (docH <= 0) return;
      if ((window.scrollY / docH) * 100 >= scrollThreshold) {
        show();
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── 3. Exit intent (desktop pointer devices only, 2 s warmup) ────────────
    let exitTimer: ReturnType<typeof setTimeout>;
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10) show();
    };
    const warmup = setTimeout(() => {
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        document.addEventListener("mouseleave", onMouseLeave);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(warmup);
      clearTimeout(exitTimer!);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [enabled, delaySeconds, scrollThreshold, storageKey, show]);

  if (!rendered) return null;

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={dismiss}
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
      />

      {/* ── Centering shell — flexbox, no transform, no clipping ─────────── */}
      {/*
          Mobile   → items-end  = bottom-sheet slides up from the bottom
          Desktop  → items-center = centered modal scales in
          pointer-events:none on shell; auto on the card so backdrop click works
      */}
      <div
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Subscribe to Pickleball Playbook newsletter"
          className="w-full sm:w-auto sm:min-w-[420px] sm:max-w-[460px] sm:mx-4"
          style={{
            pointerEvents: "auto",
            // Mobile: slide up from off-screen bottom
            // Desktop: scale in from slightly smaller
            transform: visible
              ? "translateY(0) scale(1)"
              : "translateY(100%) scale(1)",
            opacity: visible ? 1 : 0,
            transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease",
          }}
        >
          {/* Apply desktop scale separately via a wrapper so mobile slide is unaffected */}
          <div
            className="hidden sm:block"
            style={{
              transform: visible ? "scale(1)" : "scale(0.96)",
              transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            <ModalCard dismiss={dismiss} />
          </div>
          {/* Mobile version — no scale, just the slide above */}
          <div className="sm:hidden">
            <ModalCard dismiss={dismiss} mobile />
          </div>
        </div>
      </div>
    </>
  );
}

// ── The card itself — shared between mobile and desktop ───────────────────────

function ModalCard({
  dismiss,
  mobile = false,
}: {
  dismiss: () => void;
  mobile?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden ${
        mobile
          ? "rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
          : "rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)]"
      }`}
      style={{ background: "#0b1628" }}
    >
      {/* Mobile drag handle */}
      {mobile && (
        <div className="flex justify-center pt-3 pb-0">
          <div className="w-9 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
      )}

      {/* ── Card body ────────────────────────────────────────────────────── */}
      <div className="relative px-7 pt-8 pb-7">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full transition-colors"
          style={{ background: "rgba(255,255,255,0.08)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          aria-label="Close popup"
        >
          <X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.6)" }} strokeWidth={2.5} />
        </button>

        {/* Headline */}
        <h2 className="text-xl font-extrabold text-white tracking-tight leading-tight mb-2">
          See the reviews before<br />everyone else.
        </h2>

        {/* Subtitle */}
        <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
          Join the insiders getting early paddle reviews and exclusive discounts.
        </p>

        {/* CTA */}
        <a
          href={siteConfig.substackUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          className="flex items-center justify-center gap-2 w-full rounded-xl font-bold text-[15px] text-white transition-all duration-200 active:scale-[0.98]"
          style={{
            height: 50,
            background: "#0a64bc",
            boxShadow: "0 4px 16px rgba(10, 100, 188,0.3)",
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 22px rgba(10, 100, 188,0.42)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(10, 100, 188,0.3)")}
        >
          Join Free
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </a>

        {/* "Or keep guessing." */}
        <p
          className="text-sm text-center mt-3 font-medium"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          Or keep guessing.
        </p>

        {/* Tiny reassurance */}
        <p
          className="text-xs text-center mt-2"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          Free. No spam. Just paddle reviews and deals.
        </p>
      </div>
    </div>
  );
}
