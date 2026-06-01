"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Mail, X, Loader2, Check, ArrowRight } from "lucide-react";

// ── Behavior knobs ───────────────────────────────────────────────────────────
const STORAGE_DISMISS = "ppb_stickynl_dismissed";
const STORAGE_SUBSCRIBED = "ppb_subscribed";
const DISMISS_DAYS = 14;
const SHOW_DELAY_MS = 8000;          // show after 8s on page
const SHOW_SCROLL_PCT = 25;          // OR after 25% scroll, whichever fires first

// Routes where this bar should NEVER render (already-converting pages, admin,
// paddle detail pages that already use StickyBottomBar, the newsletter page itself).
const HIDDEN_PREFIXES = ["/admin", "/newsletter", "/paddles/", "/contact"];

type State = "idle" | "loading" | "success" | "error";

function nowExpired(key: string, days: number): boolean {
  try {
    const v = localStorage.getItem(key);
    if (!v) return true;
    const ts = parseInt(v, 10);
    if (Number.isNaN(ts)) return true;
    return Date.now() - ts > days * 86400000;
  } catch { return true; }
}

function markStorage(key: string) {
  try { localStorage.setItem(key, String(Date.now())); } catch { /* private mode */ }
}

export default function StickyNewsletterBar() {
  const pathname = usePathname();
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const triggeredRef = useRef(false);

  // Hide on certain routes regardless of trigger state
  const isHidden = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p));

  const open = useCallback(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    setRendered(true);
    // Two rAF so the CSS transition runs.
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    markStorage(STORAGE_DISMISS);
    setTimeout(() => setRendered(false), 320);
  }, []);

  // Trigger logic — fires once per page session, only if not dismissed/subscribed recently.
  useEffect(() => {
    if (isHidden) return;
    // Already subscribed or recently dismissed → never show.
    if (!nowExpired(STORAGE_SUBSCRIBED, 365) || !nowExpired(STORAGE_DISMISS, DISMISS_DAYS)) return;

    const t = setTimeout(open, SHOW_DELAY_MS);
    function onScroll() {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if (docH <= 0) return;
      const pct = (window.scrollY / docH) * 100;
      if (pct >= SHOW_SCROLL_PCT) open();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname, isHidden, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = inputRef.current?.value?.trim() ?? "";
    if (!email) return;
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        markStorage(STORAGE_SUBSCRIBED);
        setState("success");
        setTimeout(() => { setVisible(false); setTimeout(() => setRendered(false), 320); }, 2400);
      } else if (data.fallbackUrl) {
        // Substack direct subscribe failed — open prefilled signup page so the
        // user can finish in one click. Treat as success on our side.
        markStorage(STORAGE_SUBSCRIBED);
        window.open(data.fallbackUrl, "_blank", "noopener");
        setState("success");
        setTimeout(() => { setVisible(false); setTimeout(() => setRendered(false), 320); }, 2400);
      } else {
        setErrorMsg(data.error ?? "Couldn't subscribe — please try again.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error — please try again.");
      setState("error");
    }
  }

  if (isHidden || !rendered) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300"
      style={{
        transform: visible ? "translateY(0)" : "translateY(100%)",
        background: "linear-gradient(180deg, rgba(8,18,32,0.96) 0%, rgba(10,22,40,0.98) 100%)",
        borderTop: "1px solid rgba(45,212,191,0.30)",
        boxShadow: "0 -12px 40px rgba(0,0,0,0.45), 0 -1px 0 rgba(255,255,255,0.06) inset",
        backdropFilter: "blur(14px)",
      }}
      role="region"
      aria-label="Newsletter signup"
    >
      <div className="container-xl py-3 sm:py-3.5 flex items-center gap-3 sm:gap-4">
        {/* Icon + headline (hides on small screens to save room) */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.30)" }}
          >
            <Mail className="w-4 h-4" style={{ color: "#2dd4bf" }} strokeWidth={2} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-white">Get this week&apos;s paddle picks + discount codes</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              Free · Weekly · Unsubscribe anytime
            </p>
          </div>
        </div>

        {/* Form (or success state) */}
        {state === "success" ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-sm font-bold" style={{ color: "#4ade80" }}>
            <Check className="w-4 h-4" strokeWidth={2.5} /> You&apos;re in — check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 min-w-0" noValidate>
            <input
              ref={inputRef}
              type="email"
              required
              autoComplete="email"
              disabled={state === "loading"}
              placeholder="your@email.com"
              aria-label="Email address"
              className="flex-1 min-w-0 h-10 px-3.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 disabled:opacity-60"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
              }}
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="h-10 inline-flex items-center gap-1.5 font-extrabold text-xs sm:text-sm px-4 sm:px-5 rounded-lg text-white whitespace-nowrap transition-all hover:scale-[1.02] disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                boxShadow: "0 0 20px rgba(20,184,166,0.30)",
                letterSpacing: "0.04em",
              }}
            >
              {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>JOIN FREE <ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </form>
        )}

        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Dismiss newsletter bar"
          className="flex-shrink-0 p-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inline error */}
      {state === "error" && errorMsg && (
        <div className="container-xl pb-2 -mt-1">
          <p className="text-xs font-medium text-red-400">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
