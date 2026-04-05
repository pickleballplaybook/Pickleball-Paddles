"use client";

import { useState, useRef } from "react";
import { ArrowRight, Check, Loader2, Mail, ShieldCheck, Users, Zap } from "lucide-react";

type State = "idle" | "loading" | "success" | "error";

export default function NewsletterSignup() {
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

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setState("error");
      } else {
        setState("success");
      }
    } catch {
      setErrorMsg("Network error — please check your connection and try again.");
      setState("error");
    }
  }

  return (
    <section className="relative overflow-hidden bg-white py-24 md:py-32">
      {/* Subtle brand-tinted radial glow — sits behind everything */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(16,185,129,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="container-xl relative z-10">
        <div className="max-w-2xl mx-auto text-center">

          {/* ── Icon chip ────────────────────────────────────────────────── */}
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-50 border border-brand-100 rounded-2xl mb-8 shadow-sm">
            <Mail className="w-6 h-6 text-brand-500" strokeWidth={1.75} />
          </div>

          {/* ── Headline ─────────────────────────────────────────────────── */}
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.08] mb-5 text-balance">
            Never Miss the Best{" "}
            <span className="text-brand-500">Pickleball Deals</span> Again{" "}
            <span aria-label="tennis ball" role="img">🎾</span>
          </h2>

          {/* ── Sub-copy ─────────────────────────────────────────────────── */}
          <p className="text-lg text-slate-500 leading-relaxed mb-3 max-w-lg mx-auto">
            Get the biggest paddle discounts, limited-time deals, and new paddle
            releases sent straight to your inbox.
          </p>
          <p className="text-sm font-semibold text-slate-700 mb-10">
            Most deals disappear fast —{" "}
            <span className="text-brand-600">subscribers get them first.</span>
          </p>

          {/* ── Form ─────────────────────────────────────────────────────── */}
          {state === "success" ? (
            <div className="flex flex-col items-center gap-4 py-6 animate-fade-up">
              <div className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center shadow-glow">
                <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-900 mb-1">
                  You&apos;re in!
                </p>
                <p className="text-slate-400 text-sm">
                  Check your inbox — we&apos;ll send deals as soon as they drop.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Unified input + button pill */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center max-w-md mx-auto mb-4">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    required
                    disabled={state === "loading"}
                    className="
                      w-full h-14 pl-5 pr-4 text-sm font-medium text-slate-800
                      placeholder:text-slate-300 bg-white
                      border border-slate-200 rounded-2xl sm:rounded-r-none sm:rounded-l-2xl
                      focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                      transition-shadow disabled:opacity-60
                    "
                  />
                </div>
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="
                    h-14 inline-flex items-center justify-center gap-2
                    bg-brand-500 hover:bg-brand-600 active:scale-[0.98]
                    text-white text-sm font-bold px-6
                    rounded-2xl sm:rounded-l-none sm:rounded-r-2xl
                    transition-all duration-200 disabled:opacity-70
                    whitespace-nowrap shadow-sm hover:shadow-md
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-brand-500 focus-visible:ring-offset-2
                  "
                >
                  {state === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining…
                    </>
                  ) : (
                    <>
                      Get the Deals
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Error message */}
              {state === "error" && (
                <p className="text-sm text-red-500 font-medium mb-4 animate-fade-up">
                  {errorMsg}
                </p>
              )}
            </form>
          )}

          {/* ── Social proof row ─────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-8">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Users className="w-3.5 h-3.5 text-brand-400" />
              Join thousands of players saving money on gear
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              Deals before anyone else
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              No spam. Just the best deals in pickleball.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
