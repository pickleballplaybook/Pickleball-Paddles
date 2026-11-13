"use client";

import { useState } from "react";
import { CheckCircle2, Star, Target, TrendingUp } from "lucide-react";

const PERKS = [
  "Browse multiple certified coaches in your area and pick the one that fits your game",
  "Filter by skill level, play style, availability, and location",
  "Book private or group lessons directly through the app",
  "Be first in line when we launch near you",
];

export default function StudentWaitlistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/student-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-16">
        <div className="max-w-xl mx-auto">

          {/* Icon */}
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: "rgba(10,100,188,0.15)", border: "1px solid rgba(10,100,188,0.3)" }}
          >
            <Target className="w-7 h-7" style={{ color: "#60a5fa" }} />
          </div>

          {/* Headline */}
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Find the Right Coach<br />for Your Game.
          </h1>
          <p className="text-lg mb-2" style={{ color: "var(--text-muted)" }}>
            We&apos;re building an app that connects you with certified local pickleball coaches — so you can browse real options, pick the one that fits your style and schedule, and start improving fast.
          </p>
          <p className="text-base font-semibold mb-8" style={{ color: "#60a5fa" }}>
            Join the waitlist and we&apos;ll notify you the moment we launch in your area.
          </p>

          {status === "success" ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: "#22c55e" }} />
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>
                You&apos;re on the list!
              </h2>
              <p style={{ color: "var(--text-muted)" }}>
                You&apos;re on the list. When we launch in your area, we&apos;ll match you with a coach automatically — no extra steps needed.
              </p>
              <a
                href="/paddles"
                className="inline-block mt-5 text-sm font-semibold"
                style={{ color: "#60a5fa" }}
              >
                Browse paddles while you wait →
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-base outline-none transition-all"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {errorMsg && (
                <p className="text-sm" style={{ color: "#ef4444" }}>{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3.5 rounded-xl font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                style={{ background: "#0a64bc", color: "#fff" }}
              >
                {status === "loading" ? "Joining…" : "Notify Me When We Launch →"}
              </button>

              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                No spam. One email when we launch in your area.
              </p>
            </form>
          )}

          {/* Perks */}
          <div
            className="rounded-2xl p-6 mt-10"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#60a5fa" }}>
              How It Works
            </p>
            <div className="flex flex-col gap-3">
              {PERKS.map((perk, i) => {
                const icons = [Star, Target, TrendingUp, CheckCircle2];
                const Icon = icons[i % icons.length];
                return (
                  <div key={perk} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#60a5fa" }} />
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>{perk}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coach link */}
          <p className="text-sm text-center mt-8" style={{ color: "var(--text-muted)" }}>
            Are you a coach?{" "}
            <a href="/coach" className="font-semibold" style={{ color: "#60a5fa" }}>
              Apply to be a Playbook Coach →
            </a>
          </p>

        </div>
      </div>
    </div>
  );
}
