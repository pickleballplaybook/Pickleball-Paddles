"use client";

import { useState, useRef } from "react";
import { ArrowRight, Check, Loader2, Tag, PlayCircle, ShieldOff } from "lucide-react";

type State = "idle" | "loading" | "success" | "error";

const PERKS = [
  {
    icon: Tag,
    title: "Discount codes before they expire",
    desc: "Codes get shared around and stop working. Subscribers get them the moment they drop.",
  },
  {
    icon: PlayCircle,
    title: "New reviews the second they're live",
    desc: "Every paddle we test hits your inbox before it hits social. No algorithm, no delay.",
  },
  {
    icon: ShieldOff,
    title: "Which paddles to skip",
    desc: "We'll tell you straight up when a hyped paddle isn't worth your money.",
  },
];

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
    <section
      className="relative overflow-hidden py-24 md:py-32"
      style={{ background: "linear-gradient(160deg, #060d18 0%, #0b1628 100%)" }}
    >
      {/* Atmospheric teal glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
      >
        <div
          className="h-[28rem] w-[64rem] opacity-[0.14] blur-3xl"
          style={{ background: "radial-gradient(ellipse at top, #14b8a6, transparent 65%)" }}
        />
      </div>

      {/* Dot grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="container-xl relative z-10">
        <div className="max-w-4xl mx-auto">

          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-8" style={{ background: "rgba(45,212,191,0.5)" }} />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "#2dd4bf" }}>
              Free Newsletter
            </p>
            <span className="h-px w-8" style={{ background: "rgba(45,212,191,0.5)" }} />
          </div>

          {/* Headline */}
          <h2
            className="text-center font-extrabold text-white tracking-tight leading-[0.95] mb-5"
            style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}
          >
            Know Before{" "}
            <span style={{ color: "#2dd4bf" }}>You Buy.</span>
          </h2>

          {/* Sub-copy */}
          <p
            className="text-center leading-relaxed mb-14 mx-auto"
            style={{
              fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
              color: "rgba(255,255,255,0.55)",
              maxWidth: "44ch",
            }}
          >
            Every week: fresh paddle reviews, the discount codes that actually work, and honest takes on what's worth your money.
          </p>

          {/* 3-column perks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
            {PERKS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.25)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#2dd4bf" }} strokeWidth={1.75} />
                </div>
                <p className="font-bold text-white text-sm leading-snug mb-1.5">{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="max-w-lg mx-auto">
            {state === "success" ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(20,184,166,0.2)", border: "1px solid rgba(20,184,166,0.4)" }}
                >
                  <Check className="w-8 h-8" style={{ color: "#2dd4bf" }} strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <p className="text-xl font-extrabold text-white mb-1">You&apos;re in.</p>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Check your inbox — your first deal is already on its way.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    ref={inputRef}
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    required
                    disabled={state === "loading"}
                    className="flex-1 h-14 pl-5 pr-4 text-sm font-medium rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 transition-shadow"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "white",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className="h-14 inline-flex items-center justify-center gap-2 font-extrabold text-sm px-8 rounded-2xl text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 whitespace-nowrap"
                    style={{
                      background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                      boxShadow: "0 0 32px rgba(20,184,166,0.4)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {state === "loading" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
                    ) : (
                      <>JOIN FREE <ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>
                    )}
                  </button>
                </div>

                {state === "error" && (
                  <p className="text-sm text-red-400 font-medium mt-3">{errorMsg}</p>
                )}
              </form>
            )}

            {/* Trust line */}
            <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.25)" }}>
              150,000+ players already subscribed · Unsubscribe anytime · No spam, ever
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
