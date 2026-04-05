import { ArrowRight, GraduationCap } from "lucide-react";
import { Metadata } from "next";
import { gearProducts } from "@/data/products";

export const metadata: Metadata = {
  title: "Gear | Pickleball Playbook",
  description: "Top pickleball gear, clothing, accessories, and equipment — handpicked for serious players.",
};

const titan = gearProducts.find((p) => p.id === "titan")!;
const rest  = gearProducts.filter((p) => p.id !== "titan");

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

        {/* ── Titan hero card ────────────────────────────────────────────────── */}
        <div className="rounded-3xl overflow-hidden mb-8" style={{ background: titan.bg }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">

            <div
              className="flex items-center justify-center p-10 lg:p-16"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={titan.image}
                alt={`${titan.brand} ${titan.name}`}
                className="w-full max-w-sm h-auto object-contain drop-shadow-2xl"
              />
            </div>

            <div className="p-10 lg:p-16">
              {titan.badge && (
                <span
                  className="inline-block mb-4 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ background: "rgba(20,184,166,0.2)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.3)" }}
                >
                  {titan.badge}
                </span>
              )}
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                {titan.brand}
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
                {titan.name}
              </h2>
              <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.65)" }}>
                {titan.subtitle}
              </p>
              <a
                href={titan.link}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3.5 rounded-xl text-white transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                  boxShadow: "0 0 24px rgba(20,184,166,0.3)",
                }}
              >
                {titan.ctaText}
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </a>
            </div>
          </div>
        </div>

        {/* ── Product grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rest.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              {/* Image area */}
              {p.imageAspect === "wide" && (
                <div className="aspect-video overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={`${p.brand} ${p.name}`} className="w-full h-full object-cover" />
                </div>
              )}
              {p.imageAspect === "square" && (
                <div
                  className="aspect-video flex items-center justify-center p-6 flex-shrink-0"
                  style={{ background: "var(--bg-alt)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={`${p.brand} ${p.name}`} className="max-w-full max-h-full object-contain" />
                </div>
              )}
              {p.imageAspect === "none" && (
                <div
                  className="aspect-video flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-alt)" }}
                >
                  <GraduationCap className="w-16 h-16" style={{ color: "#14b8a6", opacity: 0.6 }} strokeWidth={1.5} />
                </div>
              )}

              {/* Card body */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#14b8a6" }}>
                    {p.brand}
                  </p>
                  {p.badge && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                      style={{
                        background: "rgba(20,184,166,0.15)",
                        color: "#2dd4bf",
                        border: "1px solid rgba(20,184,166,0.25)",
                      }}
                    >
                      {p.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold mb-1 leading-snug" style={{ color: "var(--text-primary)" }}>
                  {p.name}
                </h3>
                <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "var(--text-muted)" }}>
                  {p.subtitle}
                </p>

                <div className="flex items-center justify-between gap-3 mt-auto">
                  {p.price && p.price !== "Free" && (
                    <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                      {p.price}
                    </span>
                  )}
                  {p.price === "Free" && (
                    <span className="text-sm font-bold" style={{ color: "#14b8a6" }}>Free</span>
                  )}
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl text-white transition-all duration-200 active:scale-[0.98] ml-auto whitespace-nowrap"
                    style={{ background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)" }}
                  >
                    {p.ctaText}
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
