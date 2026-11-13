"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Target, Layers, Compass } from "lucide-react";
import PaddleQuiz from "@/components/PaddleQuiz";

const STYLES = [
  {
    label: "Power Game",
    headline: "Baseline Dominator",
    desc: "High swing weight, max pop, and a surface that punishes every opportunity.",
    href: "/paddles?style=power",
    cta: "See power paddles",
    icon: Zap,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.28)",
    iconBg: "rgba(245,158,11,0.18)",
    iconBorder: "rgba(245,158,11,0.35)",
  },
  {
    label: "Kitchen Specialist",
    headline: "Touch & Control",
    desc: "Soft feel, thick core, and the precision to win every dink battle at the net.",
    href: "/paddles?style=control",
    cta: "See control paddles",
    icon: Target,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.10)",
    border: "rgba(167,139,250,0.28)",
    iconBg: "rgba(167,139,250,0.18)",
    iconBorder: "rgba(167,139,250,0.35)",
  },
  {
    label: "All-Court Athlete",
    headline: "Balanced & Versatile",
    desc: "Handles everything — power from the baseline, soft touch at the kitchen.",
    href: "/paddles?style=all-court",
    cta: "See all-court paddles",
    icon: Layers,
    color: "#5a9df9",
    bg: "rgba(90,157,249,0.10)",
    border: "rgba(90,157,249,0.28)",
    iconBg: "rgba(90,157,249,0.18)",
    iconBorder: "rgba(90,157,249,0.35)",
  },
  {
    label: "New to Pickleball",
    headline: "Start Right",
    desc: "Don't overspend on your first paddle. Find the perfect starter pick without the confusion.",
    href: "/guides/how-to-choose-a-pickleball-paddle",
    cta: "Read the buyer's guide",
    icon: Compass,
    color: "#34d399",
    bg: "rgba(52,211,153,0.10)",
    border: "rgba(52,211,153,0.28)",
    iconBg: "rgba(52,211,153,0.18)",
    iconBorder: "rgba(52,211,153,0.35)",
  },
];

export default function PlayStyleFinder() {
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <>
      <section className="section-y" style={{ background: "var(--bg-alt)" }}>
        <div className="container-xl">
          {/* Header */}
          <div className="text-center mb-10">
            <p
              className="text-xs font-bold uppercase tracking-[0.25em] mb-3"
              style={{ color: "#5a9df9" }}
            >
              Find Your Gear
            </p>
            <h2
              className="text-3xl md:text-4xl font-extrabold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              What Kind of Player Are You?
            </h2>
            <p
              className="text-base mt-3 max-w-lg mx-auto"
              style={{ color: "var(--text-muted)" }}
            >
              Skip the scroll. Go straight to paddles built for your game.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STYLES.map(({ label, headline, desc, href, cta, icon: Icon, color, bg, border, iconBg, iconBorder }) => (
              <Link
                key={label}
                href={href}
                className="group flex flex-col gap-4 rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: iconBg, border: `1px solid ${iconBorder}` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1"
                    style={{ color }}
                  >
                    {label}
                  </p>
                  <p
                    className="font-extrabold text-base leading-snug"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {headline}
                  </p>
                  <p
                    className="text-sm mt-1.5 leading-snug"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {desc}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1 text-xs font-bold"
                  style={{ color }}
                >
                  {cta}
                  <svg
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          {/* Quiz CTA */}
          <div className="mt-8 text-center">
            <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
              Still not sure? Answer 5 quick questions and we&rsquo;ll match you.
            </p>
            <button
              onClick={() => setQuizOpen(true)}
              className="inline-flex items-center gap-2 font-bold text-sm px-7 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "#0a64bc",
                color: "#ffffff",
                boxShadow: "0 0 28px rgba(10,100,188,0.35)",
              }}
            >
              Take the Paddle Quiz
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {quizOpen && <PaddleQuiz onClose={() => setQuizOpen(false)} />}
    </>
  );
}
