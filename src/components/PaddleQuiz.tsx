"use client";

import { useState } from "react";
import Link from "next/link";
import { X, ChevronRight, RotateCcw, ExternalLink } from "lucide-react";
import { Paddle } from "@/types";
import { paddles as allPaddles } from "@/data/paddles";
import { buyAtLabel } from "@/lib/buyAtLabel";

// ── Types ─────────────────────────────────────────────────────────────────────

type SkillLevel  = "beginner" | "intermediate" | "advanced";
type Priority    = "forgiveness" | "power" | "all-around" | "control" | "spin";
type PriceRange  = "under-100" | "100-149" | "150-199" | "200-249" | "250-plus";
type HandleFeel  = "stable" | "balanced" | "precise";

interface Answers {
  skill:    SkillLevel | null;
  priority: Priority | null;
  price:    PriceRange | null;
  feel:     HandleFeel | null;
}

interface CompleteAnswers {
  skill:    SkillLevel;
  priority: Priority;
  price:    PriceRange;
  feel:     HandleFeel;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function parsePrice(price?: string): number | null {
  if (!price || price.toLowerCase() === "discontinued") return null;
  const n = parseFloat(price.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

function inPriceRange(price: number | null, range: PriceRange): boolean {
  if (price === null) return false;
  switch (range) {
    case "under-100": return price < 100;
    case "100-149":   return price >= 100 && price < 150;
    case "150-199":   return price >= 150 && price < 200;
    case "200-249":   return price >= 200 && price < 250;
    case "250-plus":  return price >= 250;
  }
}

function scorePaddle(paddle: Paddle, answers: CompleteAnswers): number {
  const price = parsePrice(paddle.price);
  if (!inPriceRange(price, answers.price)) return -Infinity;

  let score = 0;

  // ── Shape / skill / feel match ──────────────────────────────────────────
  const shapeMap: Record<HandleFeel, string> = {
    stable:   "Widebody",
    balanced: "Hybrid",
    precise:  "Elongated",
  };
  const skillShape: Record<SkillLevel, string> = {
    beginner:     "Widebody",
    intermediate: "Hybrid",
    advanced:     "Elongated",
  };
  const targetShape = shapeMap[answers.feel] || skillShape[answers.skill];
  if (paddle.shape === targetShape)                      score += 20;
  else if (paddle.shape === skillShape[answers.skill])   score += 10;

  // ── Twist weight (higher is always better) ──────────────────────────────
  // Typical range: 5.0 – 8.0 → normalize to 0–15
  const tw = paddle.twistWeight ?? 6;
  score += Math.max(0, ((tw - 5) / 3) * 15);

  // ── Swing weight (skill-adjusted) ───────────────────────────────────────
  const sw = paddle.swingWeight ?? 112;
  if (answers.skill === "beginner") {
    // Lighter is better for beginners (< 110 = best)
    if (sw < 108)       score += 12;
    else if (sw < 112)  score += 7;
    else if (sw < 116)  score += 3;
    else                score -= 5;
  } else if (answers.skill === "intermediate") {
    if (sw >= 110 && sw <= 117) score += 10;
    else                        score += 4;
  } else {
    // Advanced: higher swing weight = more power, rewarded
    if (sw >= 116)      score += 12;
    else if (sw >= 112) score += 7;
    else                score += 2;
  }

  // ── Priority bonus ───────────────────────────────────────────────────────
  if (answers.priority === "power") {
    if (sw >= 115) score += 10;
    if (paddle.shape === "Elongated") score += 5;
    if (paddle.ratings) score += paddle.ratings.power * 1.5;
  } else if (answers.priority === "control") {
    if (sw < 114) score += 8;
    const thick = parseFloat(paddle.thickness);
    if (thick >= 16) score += 6;
    if (paddle.ratings) score += paddle.ratings.control * 1.5;
  } else if (answers.priority === "spin") {
    if (paddle.ratings) score += paddle.ratings.spin * 2;
  } else if (answers.priority === "forgiveness") {
    score += tw * 2; // twist weight is the #1 forgiveness indicator
    if (paddle.shape === "Widebody") score += 8;
    const thick = parseFloat(paddle.thickness);
    if (thick >= 16) score += 5;
  } else if (answers.priority === "all-around") {
    // Balanced — moderate bonuses across the board
    if (sw >= 110 && sw <= 117) score += 8;
    if (paddle.shape === "Hybrid") score += 5;
    if (paddle.ratings) {
      score += (paddle.ratings.power + paddle.ratings.control + paddle.ratings.spin) / 3;
    }
  }

  return score;
}

function getRecommendations(answers: CompleteAnswers): Paddle[] {
  return allPaddles
    .map((p) => ({ paddle: p, score: scorePaddle(p, answers) }))
    .filter(({ score }) => score > -Infinity)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ paddle }) => paddle);
}

// ── Question UI ───────────────────────────────────────────────────────────────

function QuizOption({
  label,
  sublabel,
  selected,
  onClick,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 border"
      style={
        selected
          ? { background: "rgba(20,184,166,0.15)", borderColor: "#14b8a6", color: "var(--text-primary)" }
          : { background: "var(--bg-section)", borderColor: "var(--border)", color: "var(--text-secondary)" }
      }
    >
      <span>{label}</span>
      {sublabel && (
        <span className="block text-xs font-normal mt-0.5" style={{ color: "var(--text-muted)" }}>
          {sublabel}
        </span>
      )}
    </button>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({ paddle, rank }: { paddle: Paddle; rank: number }) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl p-4"
      style={{ background: "var(--bg-section)", border: "1px solid var(--border)" }}
    >
      {/* Rank */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold flex-shrink-0"
        style={rank === 1
          ? { background: "#defa32", color: "#111" }
          : { background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
      >
        {rank}
      </div>

      {/* Image */}
      {paddle.image && (
        <div className="w-12 h-12 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={paddle.image} alt={paddle.name} className="w-full h-full object-contain" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#14b8a6" }}>{paddle.brand}</p>
        <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{paddle.name}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {paddle.shape} · {paddle.thickness} · {paddle.price ?? "—"}
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <Link
          href={`/paddles/${paddle.slug}`}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "rgba(20,184,166,0.15)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.2)" }}
        >
          View
        </Link>
        {paddle.discountLink && (
          <a
            href={paddle.discountLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors"
            style={{ background: "rgba(20,184,166,0.9)", color: "#fff" }}
          >
            {buyAtLabel(paddle.brand)} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Quiz steps ────────────────────────────────────────────────────────────────

const STEPS = 4;

// ── Main component ────────────────────────────────────────────────────────────

export default function PaddleQuiz({ onClose }: { onClose: () => void }) {
  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState<Answers>({ skill: null, priority: null, price: null, feel: null });

  const isComplete = answers.skill && answers.priority && answers.price && answers.feel;
  const results    = isComplete ? getRecommendations(answers as CompleteAnswers) : [];

  function set<K extends keyof Answers>(key: K, val: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: val }));
    // Auto-advance after a short delay
    setTimeout(() => {
      if (step < STEPS - 1) setStep((s) => s + 1);
    }, 200);
  }

  function restart() {
    setStep(0);
    setAnswers({ skill: null, priority: null, price: null, feel: null });
  }

  const progress = ((step + (isComplete ? 1 : 0)) / STEPS) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-0.5">Paddle Finder</p>
            <h2 className="text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
              {isComplete ? "Your Top Picks" : "Find Your Perfect Paddle"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:text-red-400"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close quiz"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 mb-5">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #0d9488, #14b8a6)" }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 pb-6 flex-1">

          {/* Results */}
          {isComplete ? (
            <div className="space-y-3">
              {results.length > 0 ? (
                <>
                  <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                    Based on your answers, here are the best paddles for you:
                  </p>
                  {results.map((p, i) => (
                    <ResultCard key={p.id} paddle={p} rank={i + 1} />
                  ))}
                </>
              ) : (
                <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
                  No paddles found in that price range. Try expanding your budget.
                </p>
              )}
              <button
                onClick={restart}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors"
                style={{ background: "var(--bg-section)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                <RotateCcw className="w-4 h-4" /> Retake Quiz
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Step 0 — Skill level */}
              {step === 0 && (
                <div>
                  <p className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                    What&apos;s your pickleball experience?
                  </p>
                  <div className="space-y-2">
                    <QuizOption label="Just starting out" sublabel="Beginner — under 1 year" selected={answers.skill === "beginner"} onClick={() => set("skill", "beginner")} />
                    <QuizOption label="Getting competitive" sublabel="Intermediate — 1–3 years" selected={answers.skill === "intermediate"} onClick={() => set("skill", "intermediate")} />
                    <QuizOption label="Tournament player" sublabel="Advanced — 3.5+ rating" selected={answers.skill === "advanced"} onClick={() => set("skill", "advanced")} />
                  </div>
                </div>
              )}

              {/* Step 1 — Priority */}
              {step === 1 && (
                <div>
                  <p className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                    What matters most in your game?
                  </p>
                  <div className="space-y-2">
                    <QuizOption label="Forgiveness" sublabel="Big sweet spot, easy on mishits" selected={answers.priority === "forgiveness"} onClick={() => set("priority", "forgiveness")} />
                    <QuizOption label="Power" sublabel="Drive hard, attack from the baseline" selected={answers.priority === "power"} onClick={() => set("priority", "power")} />
                    <QuizOption label="All-around" sublabel="Balance of everything" selected={answers.priority === "all-around"} onClick={() => set("priority", "all-around")} />
                    <QuizOption label="Control" sublabel="Precise placement, soft game" selected={answers.priority === "control"} onClick={() => set("priority", "control")} />
                    <QuizOption label="Spin" sublabel="Heavy topspin & slice" selected={answers.priority === "spin"} onClick={() => set("priority", "spin")} />
                  </div>
                </div>
              )}

              {/* Step 2 — Feel */}
              {step === 2 && (
                <div>
                  <p className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                    Which paddle shape sounds right for you?
                  </p>
                  <div className="space-y-2">
                    <QuizOption label="Wide Body" sublabel="Best for beginners and forgiveness. Larger sweet spot and easier control." selected={answers.feel === "stable"} onClick={() => set("feel", "stable")} />
                    <QuizOption label="Hybrid" sublabel="Balanced shape with reach and forgiveness. Great for intermediate to advanced players." selected={answers.feel === "balanced"} onClick={() => set("feel", "balanced")} />
                    <QuizOption label="Elongated" sublabel="Longer reach and more power potential. Typically preferred by advanced players." selected={answers.feel === "precise"} onClick={() => set("feel", "precise")} />
                  </div>
                </div>
              )}

              {/* Step 3 — Budget */}
              {step === 3 && (
                <div>
                  <p className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                    What&apos;s your budget?
                  </p>
                  <div className="space-y-2">
                    <QuizOption label="Under $100" selected={answers.price === "under-100"} onClick={() => set("price", "under-100")} />
                    <QuizOption label="$100 – $149" selected={answers.price === "100-149"} onClick={() => set("price", "100-149")} />
                    <QuizOption label="$150 – $199" selected={answers.price === "150-199"} onClick={() => set("price", "150-199")} />
                    <QuizOption label="$200 – $249" selected={answers.price === "200-249"} onClick={() => set("price", "200-249")} />
                    <QuizOption label="$250 and up" selected={answers.price === "250-plus"} onClick={() => set("price", "250-plus")} />
                  </div>
                </div>
              )}

              {/* Step nav */}
              <div className="flex items-center justify-between pt-2">
                {step > 0 ? (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                    style={{ color: "var(--text-muted)", background: "var(--bg-section)", border: "1px solid var(--border)" }}
                  >
                    Back
                  </button>
                ) : <div />}
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {step + 1} of {STEPS}
                </span>
                {step < STEPS - 1 && (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    style={{ background: "rgba(20,184,166,0.15)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.2)" }}
                  >
                    Skip <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
