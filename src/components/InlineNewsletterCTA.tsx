"use client";

import { useRef, useState } from "react";
import { Mail, Loader2, Check, ArrowRight, Tag } from "lucide-react";

type State = "idle" | "loading" | "success" | "error";

const STORAGE_SUBSCRIBED = "ppb_subscribed";

function markStorage(key: string) {
  try { localStorage.setItem(key, String(Date.now())); } catch { /* private mode */ }
}

interface Props {
  // Headline/sub copy — defaults are great for general use, but each page can
  // override for context-specific framing (e.g. on /under-125: "Want budget
  // picks like these in your inbox?").
  headline?: string;
  subline?: string;
  // Visual variant — "card" (full-width card) or "compact" (slim banner).
  variant?: "card" | "compact";
}

export default function InlineNewsletterCTA({
  headline = "Get this week's paddle picks free",
  subline = "Exclusive discount codes, new paddle reviews, and weekly trending paddles — straight to your inbox.",
  variant = "card",
}: Props) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
      } else if (data.fallbackUrl) {
        markStorage(STORAGE_SUBSCRIBED);
        window.open(data.fallbackUrl, "_blank", "noopener");
        setState("success");
      } else {
        setErrorMsg(data.error ?? "Couldn't subscribe — please try again.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error — please try again.");
      setState("error");
    }
  }

  const isCompact = variant === "compact";

  return (
    <div
      className="relative rounded-2xl overflow-hidden my-10"
      style={{
        background: "linear-gradient(135deg, rgba(20,184,166,0.10) 0%, rgba(8,18,32,0.65) 50%, rgba(212,163,90,0.08) 100%)",
        border: "1px solid rgba(45,212,191,0.25)",
        boxShadow: "0 12px 36px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Subtle teal glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(20,184,166,0.10), transparent 70%)" }}
      />

      <div className={`relative z-10 ${isCompact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}>
        <div className={`flex ${isCompact ? "flex-col sm:flex-row sm:items-center" : "flex-col md:flex-row md:items-center"} gap-5`}>
          {/* Headline + sub */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.30)" }}
            >
              {isCompact
                ? <Mail className="w-4 h-4" style={{ color: "#2dd4bf" }} strokeWidth={2} />
                : <Tag className="w-5 h-5" style={{ color: "#2dd4bf" }} strokeWidth={2} />
              }
            </div>
            <div className="min-w-0">
              <p
                className={`font-extrabold leading-tight ${isCompact ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}
                style={{ color: "var(--text-primary, #fff)" }}
              >
                {headline}
              </p>
              <p className={`mt-1 ${isCompact ? "text-xs" : "text-sm"}`} style={{ color: "var(--text-muted, rgba(255,255,255,0.55))" }}>
                {subline}
              </p>
            </div>
          </div>

          {/* Form or success */}
          {state === "success" ? (
            <div
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm flex-shrink-0"
              style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.30)", color: "#4ade80" }}
            >
              <Check className="w-4 h-4" strokeWidth={2.5} /> You&apos;re in — check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:min-w-[380px]" noValidate>
              <input
                ref={inputRef}
                type="email"
                required
                autoComplete="email"
                disabled={state === "loading"}
                placeholder="your@email.com"
                aria-label="Email address"
                className="flex-1 h-11 px-4 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "white",
                }}
              />
              <button
                type="submit"
                disabled={state === "loading"}
                className="h-11 inline-flex items-center justify-center gap-1.5 font-extrabold text-sm px-5 rounded-xl text-white whitespace-nowrap transition-all hover:scale-[1.02] disabled:opacity-70"
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                  boxShadow: "0 0 24px rgba(20,184,166,0.32)",
                  letterSpacing: "0.04em",
                }}
              >
                {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>JOIN FREE <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </form>
          )}
        </div>

        {state === "error" && errorMsg && (
          <p className="text-xs font-medium text-red-400 mt-3">{errorMsg}</p>
        )}

        {state !== "success" && (
          <p className="text-[11px] mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Unsubscribe anytime · No spam · Free forever
          </p>
        )}
      </div>
    </div>
  );
}
