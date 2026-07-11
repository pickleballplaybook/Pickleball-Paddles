"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type SkillOption    = { value: string; label: string };
type StyleOption    = { value: string; label: string };
type BudgetOption   = { value: string; label: string };

const SKILLS: SkillOption[] = [
  { value: "beginner",     label: "Beginner"     },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced",     label: "Advanced"     },
];

const STYLES: StyleOption[] = [
  { value: "power",     label: "Power"     },
  { value: "control",   label: "Control"   },
  { value: "all-court", label: "All-Court" },
  { value: "spin",      label: "Spin"      },
];

const BUDGETS: BudgetOption[] = [
  { value: "under-100", label: "Under $100" },
  { value: "100-150",   label: "$100–$150"  },
  { value: "150-plus",  label: "$150+"      },
];

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150 active:scale-[0.97]"
      style={
        selected
          ? { background: "#163a6a", borderColor: "#163a6a", color: "#fff" }
          : { background: "#fff", borderColor: "#e2e8f0", color: "#475569" }
      }
    >
      {label}
    </button>
  );
}

export default function PaddleFinder() {
  const router = useRouter();
  const [skill,  setSkill]  = useState("");
  const [style,  setStyle]  = useState("");
  const [budget, setBudget] = useState("");

  function handleFind() {
    const params = new URLSearchParams();
    if (skill)  params.set("skill",  skill);
    if (style)  params.set("style",  style);
    if (budget) params.set("budget", budget);
    router.push(`/paddles?${params.toString()}`);
  }

  return (
    <section className="section-y bg-white">
      <div className="container-xl">
        <div className="max-w-3xl mx-auto">

          {/* Heading */}
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>
              Paddle Finder
            </p>
            <h2
              className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3"
              style={{ color: "#163a6a" }}
            >
              Find the Right Paddle for Your Game
            </h2>
            <p className="text-slate-500 text-lg">
              Answer three quick questions and we&apos;ll show you the best matches.
            </p>
          </div>

          {/* Filter groups */}
          <div className="space-y-8">

            {/* Skill Level */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">
                1. What&apos;s your skill level?
              </p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((s) => (
                  <OptionButton
                    key={s.value}
                    label={s.label}
                    selected={skill === s.value}
                    onClick={() => setSkill(skill === s.value ? "" : s.value)}
                  />
                ))}
              </div>
            </div>

            {/* Play Style */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">
                2. How do you like to play?
              </p>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <OptionButton
                    key={s.value}
                    label={s.label}
                    selected={style === s.value}
                    onClick={() => setStyle(style === s.value ? "" : s.value)}
                  />
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">
                3. What&apos;s your budget?
              </p>
              <div className="flex flex-wrap gap-2">
                {BUDGETS.map((b) => (
                  <OptionButton
                    key={b.value}
                    label={b.label}
                    selected={budget === b.value}
                    onClick={() => setBudget(budget === b.value ? "" : b.value)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={handleFind}
              className="inline-flex items-center gap-2 font-bold text-base px-8 py-4 rounded-xl text-white transition-all duration-200 active:scale-[0.98] shadow-sm"
              style={{ background: "#163a6a" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#0f2848")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#163a6a")}
            >
              <Search className="w-4 h-4" strokeWidth={2.5} />
              Find My Paddle
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
