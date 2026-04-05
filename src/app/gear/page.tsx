import { ArrowRight, GraduationCap } from "lucide-react";
import { Metadata } from "next";
import { gearProducts, GearProduct } from "@/data/products";

export const metadata: Metadata = {
  title: "Gear | Pickleball Playbook",
  description: "Top pickleball gear, clothing, accessories, and equipment — handpicked for serious players.",
};

const titan = gearProducts.find((p) => p.id === "titan")!;
const rest  = gearProducts.filter((p) => p.id !== "titan");

// ── CTA button ────────────────────────────────────────────────────────────────
function Cta({ href, text, large }: { href: string; text: string; large?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`inline-flex items-center gap-2 font-bold text-white rounded-2xl transition-all duration-200 active:scale-[0.97] self-start flex-shrink-0 ${large ? "text-base px-8 py-4" : "text-sm px-7 py-3.5"}`}
      style={{
        background: "linear-gradient(135deg,#0d9488,#14b8a6)",
        boxShadow: "0 0 40px rgba(20,184,166,0.35), 0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {text}
      <ArrowRight className={large ? "w-5 h-5" : "w-4 h-4"} strokeWidth={2.5} />
    </a>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ text }: { text: string }) {
  return (
    <span
      className="self-start inline-block text-[11px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full mb-5"
      style={{
        background: "rgba(20,184,166,0.15)",
        color: "#2dd4bf",
        border: "1px solid rgba(20,184,166,0.4)",
        boxShadow: "0 0 12px rgba(20,184,166,0.15)",
      }}
    >
      {text}
    </span>
  );
}

// ── Wide feature card ─────────────────────────────────────────────────────────
// Fix: image column has EXPLICIT pixel heights (h-[320px] mobile, lg:h-[620px] desktop)
// so the absolute-positioned img always has a defined parent height to fill.
function WideCard({ p }: { p: GearProduct }) {
  return (
    <div
      className="col-span-full rounded-3xl overflow-hidden"
      style={{
        background: p.bg,
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex flex-col lg:flex-row">

        {/* Image — explicit heights ensure absolute fill always works */}
        <div className="relative overflow-hidden flex-shrink-0 w-full lg:w-[62%] h-[320px] lg:h-[620px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt={`${p.brand} ${p.name}`}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* right-edge blend — desktop */}
          <div
            className="absolute inset-y-0 right-0 hidden lg:block pointer-events-none"
            style={{ width: "220px", background: `linear-gradient(90deg,transparent 0%,${p.bg} 100%)` }}
          />
          {/* bottom-edge blend — mobile */}
          <div
            className="absolute inset-x-0 bottom-0 lg:hidden pointer-events-none"
            style={{ height: "120px", background: `linear-gradient(180deg,transparent 0%,${p.bg} 100%)` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10 lg:px-14 lg:py-16">
          {p.badge && <Badge text={p.badge} />}

          <p
            className="font-bold uppercase mb-2"
            style={{ fontSize: "0.6875rem", letterSpacing: "0.22em", color: "rgba(255,255,255,0.35)" }}
          >
            {p.brand}
          </p>

          <h3
            className="font-extrabold text-white tracking-tight leading-none mb-4"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.75rem)" }}
          >
            {p.name}
          </h3>

          {p.price && p.price !== "Free" && (
            <p className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.38)" }}>
              {p.price}
            </p>
          )}

          <p className="text-base leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.62)", maxWidth: "34ch" }}>
            {p.subtitle}
          </p>

          <Cta href={p.link} text={p.ctaText} />
        </div>
      </div>
    </div>
  );
}

// ── Square card ───────────────────────────────────────────────────────────────
function SquareCard({ p }: { p: GearProduct }) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "var(--bg-card)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
      }}
    >
      {p.imageAspect === "square" && (
        <div
          className="w-full flex items-center justify-center flex-shrink-0 p-14"
          style={{ background: p.bg, aspectRatio: "1/1" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt={`${p.brand} ${p.name}`}
            className="w-full h-full object-contain"
            style={{ filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.55))" }}
          />
        </div>
      )}
      {p.imageAspect === "none" && (
        <div
          className="w-full flex items-center justify-center flex-shrink-0"
          style={{ background: p.bg, aspectRatio: "1/1" }}
        >
          <GraduationCap className="w-24 h-24" style={{ color: "#14b8a6", opacity: 0.65 }} strokeWidth={1.5} />
        </div>
      )}

      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#14b8a6" }}>
            {p.brand}
          </span>
          {p.badge && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
              style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.3)" }}
            >
              {p.badge}
            </span>
          )}
        </div>

        <h3 className="text-xl font-extrabold leading-tight mb-2" style={{ color: "var(--text-primary)" }}>
          {p.name}
        </h3>
        <p className="text-sm leading-relaxed flex-1 mb-7" style={{ color: "var(--text-muted)" }}>
          {p.subtitle}
        </p>

        <div className="flex items-center justify-between gap-3 mt-auto">
          {p.price && p.price !== "Free" && (
            <span className="text-base font-semibold" style={{ color: "var(--text-secondary)" }}>{p.price}</span>
          )}
          {p.price === "Free" && (
            <span className="text-base font-bold" style={{ color: "#14b8a6" }}>Free</span>
          )}
          <Cta href={p.link} text={p.ctaText} />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GearPage() {
  return (
    <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-16">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>Equipment</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Gear</h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-muted)" }}>
            Top-rated gear, clothing, and accessories for serious pickleball players.
          </p>
        </div>

        {/* ── Titan hero ─────────────────────────────────────────────────────── */}
        <div
          className="rounded-3xl overflow-hidden mb-10"
          style={{
            background: titan.bg,
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex flex-col lg:flex-row">

            {/* Image — centered object-contain since Titan is a square product photo */}
            <div
              className="flex-shrink-0 flex items-center justify-center relative w-full lg:w-1/2 h-[340px] lg:h-[640px]"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 65% 60% at 50% 50%, rgba(20,184,166,0.12) 0%, transparent 70%)" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={titan.image}
                alt={`${titan.brand} ${titan.name}`}
                className="relative z-10 w-full h-full object-contain"
                style={{
                  maxWidth: "480px",
                  maxHeight: "480px",
                  padding: "2.5rem",
                  filter: "drop-shadow(0 24px 64px rgba(0,0,0,0.65))",
                }}
              />
            </div>

            {/* Copy */}
            <div className="flex-1 flex flex-col justify-center px-10 py-12 lg:px-16 lg:py-20">
              {titan.badge && <Badge text={titan.badge} />}
              <p className="font-bold uppercase mb-2" style={{ fontSize: "0.6875rem", letterSpacing: "0.22em", color: "rgba(255,255,255,0.35)" }}>
                {titan.brand}
              </p>
              <h2
                className="font-extrabold text-white tracking-tight leading-none mb-5"
                style={{ fontSize: "clamp(2.5rem, 5vw, 3.75rem)" }}
              >
                {titan.name}
              </h2>
              <p className="text-lg leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.62)", maxWidth: "38ch" }}>
                {titan.subtitle}
              </p>
              <Cta href={titan.link} text={titan.ctaText} large />
            </div>
          </div>
        </div>

        {/* ── Product grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {rest.map((p) =>
            p.imageAspect === "wide"
              ? <WideCard key={p.id} p={p} />
              : <SquareCard key={p.id} p={p} />
          )}
        </div>

      </div>
    </div>
  );
}
