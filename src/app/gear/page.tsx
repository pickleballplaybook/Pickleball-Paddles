import { ArrowRight, GraduationCap } from "lucide-react";
import { Metadata } from "next";
import { gearProducts, GearProduct } from "@/data/products";

export const metadata: Metadata = {
  title: "Gear | Pickleball Playbook",
  description: "Top pickleball gear, clothing, accessories, and equipment — handpicked for serious players.",
};

const titan = gearProducts.find((p) => p.id === "titan")!;
const rest  = gearProducts.filter((p) => p.id !== "titan");

// ── Shared CTA button ─────────────────────────────────────────────────────────
function CtaButton({ href, text, large = false }: { href: string; text: string; large?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`inline-flex items-center gap-2 self-start font-bold text-white transition-all duration-200 active:scale-[0.97] rounded-2xl ${large ? "text-base px-8 py-4" : "text-sm px-7 py-3.5"}`}
      style={{
        background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
        boxShadow: "0 0 40px rgba(20,184,166,0.35), 0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {text}
      <ArrowRight className={large ? "w-5 h-5" : "w-4 h-4"} strokeWidth={2.5} />
    </a>
  );
}

// ── Premium badge pill ────────────────────────────────────────────────────────
function Badge({ text }: { text: string }) {
  return (
    <span
      className="inline-block self-start text-[11px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full mb-5"
      style={{
        background: "rgba(20,184,166,0.15)",
        color: "#2dd4bf",
        border: "1px solid rgba(20,184,166,0.35)",
        boxShadow: "0 0 12px rgba(20,184,166,0.15)",
      }}
    >
      {text}
    </span>
  );
}

// ── Wide-image feature card ───────────────────────────────────────────────────
// Image fills the entire left column via absolute positioning.
// The flex row min-height drives the stretch — both columns grow to match it.
function WideCard({ p }: { p: GearProduct }) {
  return (
    <div
      className="col-span-full rounded-3xl overflow-hidden"
      style={{
        background: p.bg,
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* flex row — min-height drives both columns to the same tall height */}
      <div className="flex flex-col lg:flex-row" style={{ minHeight: "600px" }}>

        {/* ── Image column: 60% wide, absolutely filled ── */}
        <div
          className="relative overflow-hidden flex-shrink-0"
          style={{ flex: "0 0 60%", minHeight: "340px" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt={`${p.brand} ${p.name}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Right-edge gradient: bleeds the image seamlessly into the content panel */}
          <div
            className="absolute inset-y-0 right-0 w-48 hidden lg:block pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent 0%, ${p.bg} 100%)` }}
          />
          {/* Bottom-edge gradient for mobile stacked layout */}
          <div
            className="absolute inset-x-0 bottom-0 h-28 lg:hidden pointer-events-none"
            style={{ background: `linear-gradient(180deg, transparent 0%, ${p.bg} 100%)` }}
          />
        </div>

        {/* ── Content column ── */}
        <div className="flex-1 flex flex-col justify-center px-10 py-12 lg:px-14 lg:py-16">
          {p.badge && <Badge text={p.badge} />}

          <p
            className="text-[11px] font-bold uppercase mb-2"
            style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em" }}
          >
            {p.brand}
          </p>

          <h3 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-none mb-4">
            {p.name}
          </h3>

          {p.price && p.price !== "Free" && (
            <p className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              {p.price}
            </p>
          )}

          <p className="text-base leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.6)", maxWidth: "36ch" }}>
            {p.subtitle}
          </p>

          <CtaButton href={p.link} text={p.ctaText} />
        </div>

      </div>
    </div>
  );
}

// ── Square / no-image card ─────────────────────────────────────────────────────
function SquareCard({ p }: { p: GearProduct }) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "var(--bg-card)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
      }}
    >
      {/* Image area — square aspect, full brand bg */}
      {p.imageAspect === "square" && (
        <div
          className="w-full flex items-center justify-center flex-shrink-0 p-14"
          style={{ background: p.bg, aspectRatio: "1 / 1" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt={`${p.brand} ${p.name}`}
            className="w-full h-full object-contain"
            style={{ filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.5))" }}
          />
        </div>
      )}
      {p.imageAspect === "none" && (
        <div
          className="w-full flex items-center justify-center flex-shrink-0"
          style={{ background: p.bg, aspectRatio: "1 / 1" }}
        >
          <GraduationCap className="w-24 h-24" style={{ color: "#14b8a6", opacity: 0.6 }} strokeWidth={1.5} />
        </div>
      )}

      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#14b8a6" }}>
            {p.brand}
          </p>
          {p.badge && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
              style={{
                background: "rgba(20,184,166,0.12)",
                color: "#2dd4bf",
                border: "1px solid rgba(20,184,166,0.3)",
              }}
            >
              {p.badge}
            </span>
          )}
        </div>

        <h3 className="text-xl font-extrabold mb-2 leading-tight" style={{ color: "var(--text-primary)" }}>
          {p.name}
        </h3>
        <p className="text-sm leading-relaxed mb-7 flex-1" style={{ color: "var(--text-muted)" }}>
          {p.subtitle}
        </p>

        <div className="flex items-center justify-between gap-3 mt-auto">
          {p.price && p.price !== "Free" && (
            <span className="text-base font-semibold" style={{ color: "var(--text-secondary)" }}>{p.price}</span>
          )}
          {p.price === "Free" && (
            <span className="text-base font-bold" style={{ color: "#14b8a6" }}>Free</span>
          )}
          <a
            href={p.link}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl text-white transition-all duration-200 active:scale-[0.97] ml-auto whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
              boxShadow: "0 0 24px rgba(20,184,166,0.25)",
            }}
          >
            {p.ctaText}
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function GearPage() {
  return (
    <div className="min-h-screen pt-16" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-16">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
            Equipment
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Gear
          </h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-muted)" }}>
            Top-rated gear, clothing, and accessories for serious pickleball players.
          </p>
        </div>

        {/* ── Titan — featured hero (square image, premium centered treatment) ── */}
        <div
          className="rounded-3xl overflow-hidden mb-10"
          style={{
            background: titan.bg,
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex flex-col lg:flex-row" style={{ minHeight: "600px" }}>

            {/* Image — centered in left half with subtle inner glow */}
            <div
              className="flex-shrink-0 flex items-center justify-center relative overflow-hidden"
              style={{
                flex: "0 0 50%",
                minHeight: "340px",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {/* radial glow behind product */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(20,184,166,0.1) 0%, transparent 70%)",
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={titan.image}
                alt={`${titan.brand} ${titan.name}`}
                className="relative z-10 w-full h-auto object-contain"
                style={{
                  maxHeight: "440px",
                  maxWidth: "440px",
                  filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.6))",
                }}
              />
            </div>

            {/* Copy */}
            <div className="flex-1 flex flex-col justify-center px-10 py-12 lg:px-16 lg:py-20">
              {titan.badge && <Badge text={titan.badge} />}

              <p
                className="text-[11px] font-bold uppercase mb-2"
                style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em" }}
              >
                {titan.brand}
              </p>

              <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-none mb-5">
                {titan.name}
              </h2>

              <p className="text-lg leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.6)", maxWidth: "38ch" }}>
                {titan.subtitle}
              </p>

              <CtaButton href={titan.link} text={titan.ctaText} large />
            </div>

          </div>
        </div>

        {/* ── Product grid — wide cards full-width, square cards 2-col ── */}
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
