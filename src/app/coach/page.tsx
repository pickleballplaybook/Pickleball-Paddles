"use client";

import { useState } from "react";
import { CheckCircle2, MapPin, Users, Zap } from "lucide-react";

const PERKS = [
  "Students in your area are sent directly to your inbox — no marketing, no chasing leads",
  "Sign up once and we do the work of finding you clients automatically",
  "We cap coaches per city, so every inquiry that comes in is exclusively yours",
  "Set your own rates, schedule, and location — you stay in control",
];

export default function CoachWaitlistPage() {
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/coach-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, area }),
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
            <Users className="w-7 h-7" style={{ color: "#60a5fa" }} />
          </div>

          {/* Headline */}
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Students come to you.<br />Your calendar fills itself.
          </h1>
          <p className="text-lg mb-2" style={{ color: "var(--text-muted)" }}>
            PlayPro automatically matches players in your area to coaches like you. No cold outreach, no paid ads — just sign up and we send students straight to your inbox.
          </p>
          <p className="text-base font-semibold mb-8" style={{ color: "#60a5fa" }}>
            ⚡ We cap coaches per city — limited spots available.
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
                You&apos;re in. As soon as we go live in your area, student requests will start coming to you automatically. Spots fill fast — you&apos;re ahead of the line.
              </p>
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                  City / Area
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. New York, NY"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full rounded-xl pl-9 pr-4 py-3 text-base outline-none transition-all"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
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
                {status === "loading" ? "Joining…" : "Start Getting Students →"}
              </button>

              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                No spam. We&apos;ll only contact you about the launch.
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
              {PERKS.map((perk) => (
                <div key={perk} className="flex items-start gap-3">
                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#60a5fa" }} />
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>{perk}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Student link */}
          <p className="text-sm text-center mt-8" style={{ color: "var(--text-muted)" }}>
            Looking to find a coach instead?{" "}
            <a href="/student" className="font-semibold" style={{ color: "#60a5fa" }}>
              Join the student waitlist →
            </a>
          </p>

        </div>
      </div>
    </div>
  );
}
