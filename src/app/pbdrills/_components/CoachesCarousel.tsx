"use client";

import { useState } from "react";

const CHARTREUSE = "#defa32";
const TEAL = "#3cacae";

type Coach = {
  name: string;
  title: string;
  rating: string;
  image: string;
};

const COACHES: Coach[] = [
  {
    name: "Jack Munro",
    title: "APP WORLD #1",
    rating: "6.67 RATED",
    image: "/images/pbdrills-coaches/Jack-Munro.png",
  },
  {
    name: "Augie Ge",
    title: "PPA SIGNED PRO",
    rating: "6.32 RATED",
    image: "/images/pbdrills-coaches/Augie-Ge.png",
  },
  {
    name: "Judit Castillo",
    title: "PPA SIGNED PRO",
    rating: "5.71 RATED",
    image: "/images/pbdrills-coaches/Judit-Castillo.png",
  },
  {
    name: "Austin Hardy",
    title: "PPR CERTIFIED COACH",
    rating: "5.4 RATED",
    image: "/images/pbdrills-coaches/Austin-Hardy.png",
  },
];

export default function CoachesCarousel() {
  const [index, setIndex] = useState(0);
  const coach = COACHES[index];
  const hasPrev = index > 0;
  const hasNext = index < COACHES.length - 1;

  return (
    <div className="flex flex-col items-center">
      <p
        className="text-[10px] font-extrabold uppercase tracking-[0.22em] mb-4"
        style={{ color: TEAL }}
      >
        Drills Built By
      </p>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 30px 80px -20px rgba(60,172,174,0.35)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={coach.image}
            src={coach.image}
            alt={`${coach.name} — ${coach.title}`}
            className="w-full aspect-square object-cover transition-opacity"
          />
          <div
            className="p-5 text-center"
            style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
          >
            <p className="text-2xl font-extrabold text-white mb-1 leading-none">
              {coach.name}
            </p>
            <p
              className="text-xs font-bold"
              style={{ color: CHARTREUSE, letterSpacing: "0.05em" }}
            >
              {coach.title} · {coach.rating}
            </p>
          </div>
        </div>

        {/* Prev arrow — hidden on first coach */}
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={!hasPrev}
          aria-label="Previous coach"
          className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-6 w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
          style={{
            background: "#0a1628",
            color: CHARTREUSE,
            border: `2px solid ${CHARTREUSE}`,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          <span aria-hidden className="text-xl font-bold leading-none pb-0.5">
            ←
          </span>
        </button>

        {/* Next arrow — hidden on last coach */}
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(COACHES.length - 1, i + 1))}
          disabled={!hasNext}
          aria-label="Next coach"
          className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-6 w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
          style={{
            background: "#0a1628",
            color: CHARTREUSE,
            border: `2px solid ${CHARTREUSE}`,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          <span aria-hidden className="text-xl font-bold leading-none pb-0.5">
            →
          </span>
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {COACHES.map((c, i) => (
          <button
            key={c.name}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show ${c.name}`}
            className="transition-all"
            style={{
              width: i === index ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background:
                i === index ? CHARTREUSE : "rgba(255,255,255,0.20)",
            }}
          />
        ))}
      </div>

      <p
        className="text-[12px] text-center mt-4 max-w-xs leading-relaxed"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        Every drill built by APP &amp; PPA tour pros and PPR-certified coaches —
        players you already watch on tour.
      </p>
    </div>
  );
}
