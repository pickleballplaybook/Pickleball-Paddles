"use client";

import { useState } from "react";

// 2-question qualifier matching the in-app onboarding: Level → Focus → honest
// handoff CTA. Earlier versions returned fake drill names ("Kitchen Lock-In",
// "Third-Shot Foundation") which over-promised vs. what the app actually
// shows on day 1. The result step now just confirms the player's pick and
// hands them off to the trial — no fabricated recommendation.

type Level = "beginner" | "intermediate" | "advanced";
type Focus =
  | "dink"
  | "drive"
  | "drop"
  | "volley"
  | "reset"
  | "serve"
  | "ballmachine"
  | "wall";

const LEVELS: { value: Level; label: string; sub: string }[] = [
  { value: "beginner",     label: "Beginner",     sub: "Just getting consistent" },
  { value: "intermediate", label: "Intermediate", sub: "3.0–4.0, ready to climb" },
  { value: "advanced",     label: "Advanced",     sub: "4.5+, polishing patterns" },
];

const LEVEL_LABEL: Record<Level, string> = {
  beginner:     "Beginner",
  intermediate: "Intermediate",
  advanced:     "Advanced",
};

const FOCUSES: { value: Focus; label: string }[] = [
  { value: "dink",        label: "Dink" },
  { value: "drive",       label: "Drive" },
  { value: "drop",        label: "Drop" },
  { value: "volley",      label: "Volley" },
  { value: "reset",       label: "Reset" },
  { value: "serve",       label: "Serve" },
  { value: "ballmachine", label: "Ball Machine" },
  { value: "wall",        label: "Wall" },
];

const FOCUS_LABEL: Record<Focus, string> = {
  dink:        "Dink",
  drive:       "Drive",
  drop:        "Drop",
  volley:      "Volley",
  reset:       "Reset",
  serve:       "Serve",
  ballmachine: "Ball Machine",
  wall:        "Wall",
};

export default function DrillFinder() {
  const [step, setStep] = useState(0); // 0 = level, 1 = focus, 2 = handoff
  const [level, setLevel] = useState<Level | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);

  const progress = ((step + 1) / 3) * 100;
  const stepLabels = ["LEVEL", "FOCUS", "START"];

  function reset() {
    setStep(0);
    setLevel(null);
    setFocus(null);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
      }}
    >
      {/* Top accent bar */}
      <div className="h-1" style={{ background: "#defa32" }} />

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-3">
          {stepLabels.map((label, i) => (
            <span
              key={label}
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: i === step ? "#defa32" : "rgba(255,255,255,0.32)" }}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="h-1 rounded-full mb-7" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "#defa32" }}
          />
        </div>

        {/* Step 0 — Level */}
        {step === 0 && (
          <>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
              What level are you?
            </h3>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
              We&apos;ll match you to a starting track that meets you where you are.
            </p>
            <div className="space-y-2.5">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => { setLevel(l.value); setStep(1); }}
                  className="w-full text-left px-5 py-4 rounded-xl font-semibold transition-all"
                  style={{
                    background: level === l.value ? "rgba(60, 172, 174, 0.18)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${level === l.value ? "#3cacae" : "rgba(255,255,255,0.10)"}`,
                    color: "#fff",
                  }}
                >
                  <span className="block text-base">{l.label}</span>
                  <span className="block text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{l.sub}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 1 — Focus */}
        {step === 1 && (
          <>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
              What do you want to drill?
            </h3>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
              Pick the shot or setup you want to start with. You&apos;ll have access to all eight inside the app.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {FOCUSES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setFocus(f.value); setStep(2); }}
                  className="text-center px-3 py-4 rounded-xl font-semibold transition-all"
                  style={{
                    background: focus === f.value ? "rgba(60, 172, 174, 0.18)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${focus === f.value ? "#3cacae" : "rgba(255,255,255,0.10)"}`,
                    color: "#fff",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(0)}
              className="mt-5 text-xs font-semibold underline"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              ← Back
            </button>
          </>
        )}

        {/* Step 2 — Honest handoff. No fabricated drill name. */}
        {step === 2 && level && focus && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#3cacae" }}>
              You&apos;re set
            </p>
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
              {LEVEL_LABEL[level]} · {FOCUS_LABEL[focus]} drills
            </h3>
            <p className="text-base mb-6" style={{ color: "rgba(255,255,255,0.75)" }}>
              Open the app — your full library unlocks free, including every
              drill at your level on {FOCUS_LABEL[focus].toLowerCase()} and the
              other seven focuses.
            </p>

            <a
              href="https://pbdrills.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center font-extrabold text-base px-6 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "#defa32",
                color: "#0a1628",
                boxShadow: "0 0 32px rgba(222,250,50,0.35)",
              }}
            >
              GET STARTED →
            </a>
            <p className="text-[11px] text-center mt-3" style={{ color: "rgba(255,255,255,0.5)" }}>
              Full library access. Cancel anytime in the app.
            </p>

            <button
              onClick={reset}
              className="mt-5 w-full text-xs font-semibold underline"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              ← Start over
            </button>
          </>
        )}
      </div>
    </div>
  );
}
