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
function CtaButton({ href, text }: { href: string; text: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="inline-flex items-center gap-2 self-start font-bold text-sm px-6 py-3.5 rounded-xl text-white transition-all duration-200 active:scale-[0.98]"
      style={{
        background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
        boxShadow: "0 0 24px rgba(20,184,166,0.25)",
      }}
    >
      {text}
      <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
    </a>
  );
}

// ── Wide-image card — full-width, large image left, copy right ────────────────
function WideCard({ p }: { p: GearProduct }) {
  return (
    <div className="col-span-full rounded-3xl overflow-hidden" style={{ background: p.bg }}>
      <div className="flex flex-col lg:flex-row" style={{ minHeight: "420px" }}>

        {/* Image — full width on mobile, 60% on desktop */}
        <div className="w-full lg:w-[60%] flex-shrink-0 overflow-hidden" style={{ minHeight: "280px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt={`${p.brand} ${p.name}`}
            className="w-full h-full object-cover"
            style={{ minHeight: "280px" }}
          />
        </div>

        {/* Copy — full width on mobile, 40% on desktop */}
        <div className="flex-1 p-8 lg:p-14 flex flex-col justify-center">
          {p.badge && (
            <span
              className="inline-block self-start mb-4 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: "rgba(20,184,166,0.2)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.3)" }}
            >
              {p.badge}
            </span>
          )}
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            {p.brand}
          </p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight mb-3">
            {p.name}
          </h3>
          {p.price && p.price !== "Free" && (
            <p className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>{p.price}</p>
          )}
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
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
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      {p.imageAspect === "square" && (
        <div
          className="w-full flex items-center justify-center flex-shrink-0 p-12"
          style={{ background: p.bg, aspectRatio: "1 / 1" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt={`${p.brand} ${p.name}`}
            className="w-full h-full object-contain drop-shadow-xl"
          />
        </div>
      )}
      {p.imageAspect === "none" && (
        <div
          className="w-full flex items-center justify-center flex-shrink-0"
          style={{ background: p.bg, aspectRatio: "1 / 1" }}
        >
          <GraduationCap className="w-24 h-24" style={{ color: "#14b8a6", opacity: 0.7 }} strokeWidth={1.5} />
        </div>
      )}

      <div className="p-7 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#14b8a6" }}>
            {p.brand}
          </p>
          {p.badge && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
              style={{ background: "rgba(20,184,166,0.15)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.25)" }}
            >
              {p.badge}
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold mb-2 leading-snug" style={{ color: "var(--text-primary)" }}>
          {p.name}
        </h3>
        <p className="text-sm leading-relaxed mb-6 flex-1" style={{ color: "var(--text-muted)" }}>
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
            className="inline-flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-xl text-white transition-all duration-200 active:scale-[0.98] ml-auto whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)" }}
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

        {/* ── Titan hero card (featured, extra large) ───────────────────────── */}
        <div className="rounded-3xl overflow-hidden mb-8" style={{ background: titan.bg }}>
          <div className="flex flex-col lg:flex-row" style={{ minHeight: "500px" }}>

            {/* Image */}
            <div
              className="w-full lg:w-1/2 flex items-center justify-center flex-shrink-0 p-12 lg:p-20"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={titan.image}
                alt={`${titan.brand} ${titan.name}`}
                className="w-full h-auto object-contain drop-shadow-2xl"
                style={{ maxHeight: "380px" }}
              />
            </div>

            {/* Copy */}
            <div className="flex-1 p-10 lg:p-16 flex flex-col justify-center">
              {titan.badge && (
                <span
                  className="inline-block self-start mb-5 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ background: "rgba(20,184,166,0.2)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.3)" }}
                >
                  {titan.badge}
                </span>
              )}
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                {titan.brand}
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
                {titan.name}
              </h2>
              <p className="text-lg mb-10" style={{ color: "rgba(255,255,255,0.65)" }}>
                {titan.subtitle}
              </p>
              <CtaButton href={titan.link} text={titan.ctaText} />
            </div>

          </div>
        </div>

        {/* ── Product grid ──────────────────────────────────────────────────── */}
        {/* Wide cards use col-span-full; square cards fill one of 2 columns */}
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
