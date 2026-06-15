import { Star, ArrowRight } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { gearProducts, GearProduct } from "@/data/products";

export const metadata: Metadata = {
  title: "Gear",
  description: "Top pickleball gear, clothing, accessories, and equipment — handpicked for serious players.",
};

const featured = gearProducts.find((p) => p.id === "titan")!;
const rest = gearProducts.filter((p) => p.id !== "titan");

// ── Editor's Pick hero card ────────────────────────────────────────────────────
function EditorPickCard({ p }: { p: GearProduct }) {
  return (
    <div
      className="rounded-3xl overflow-hidden mb-12"
      style={{
        background: "var(--bg-card)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}
    >
      <div className="flex flex-col md:flex-row">

        {/* Image — sits on the card's own dark background so PNGs with a
            transparent background blend in instead of getting a white frame. */}
        <div className="relative md:w-[42%] flex-shrink-0">
          <div
            className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ background: "#f59e0b" }}
          >
            <Star className="w-3 h-3 fill-white" />
            Editor&apos;s Pick
          </div>
          <div
            className="w-full flex items-center justify-center p-8"
            style={{ minHeight: "300px", height: "100%" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image}
              alt={`${p.brand} ${p.name}`}
              className="w-full h-full object-contain"
              style={{ maxHeight: "260px", mixBlendMode: "multiply" }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.25em] mb-2"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            {p.brand}
          </p>
          <h2
            className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight"
            style={{ color: "#2dd4bf" }}
          >
            {p.name}
          </h2>
          <p
            className="text-base leading-relaxed mb-5"
            style={{ color: "var(--text-muted)", maxWidth: "46ch" }}
          >
            {p.subtitle}
          </p>
          {p.price && p.price !== "Free" && (() => {
            const priceNum = parseFloat(p.price!.replace(/[^0-9.]/g, ""));
            const badgeNum = p.badge ? parseFloat(p.badge.replace(/[^0-9.]/g, "")) : 0;
            const salePrice = badgeNum > 0 ? `$${(priceNum - badgeNum).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : null;
            return (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {salePrice ? (
                  <>
                    <span className="text-2xl font-extrabold" style={{ color: "#2dd4bf" }}>{salePrice}</span>
                    <span className="text-xl font-semibold line-through" style={{ color: "rgba(255,255,255,0.45)" }}>{p.price}</span>
                  </>
                ) : (
                  <span className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>{p.price}</span>
                )}
                {p.badge && (
                  <span
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      color: "#4ade80",
                      border: "1px solid rgba(34,197,94,0.3)",
                    }}
                  >
                    {p.badge}
                  </span>
                )}
              </div>
            );
          })()}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/gear/${p.id}`}
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #0d9488, #14b8a6)",
                boxShadow: "0 0 24px rgba(20,184,166,0.35)",
              }}
            >
              Read Full Review
            </Link>
            <a
              href={p.link}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                border: "1.5px solid rgba(45,212,191,0.45)",
                color: "#2dd4bf",
              }}
            >
              Buy Now
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Grid card ──────────────────────────────────────────────────────────────────
function GridCard({ p }: { p: GearProduct }) {
  return (
    <Link href={`/gear/${p.id}`} className="block group">
      <div
        className="rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-200 group-hover:scale-[1.01]"
        style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        }}
      >
        {/* Image area — uses the card's own dark background so transparent
            PNGs blend in instead of getting a white frame. */}
        <div
          className="w-full flex items-center justify-center p-6"
          style={{ aspectRatio: "4/3" }}
        >
          {p.imageAspect !== "none" && p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.image}
              alt={`${p.brand} ${p.name}`}
              className="w-full h-full object-contain"
              style={{ maxHeight: "170px", mixBlendMode: "multiply" }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(20,184,166,0.12)" }}
            >
              <span className="text-2xl">🎾</span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-5 flex flex-col flex-1">
          {p.brand && (
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: "rgba(255,255,255,0.32)" }}
            >
              {p.brand}
            </p>
          )}
          <h3
            className="text-sm font-extrabold leading-snug mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            {p.name}
          </h3>

          <div className="mt-auto flex items-center justify-between gap-2">
            <span
              className="text-base font-bold"
              style={{ color: p.price === "Free" ? "#14b8a6" : "var(--text-primary)" }}
            >
              {p.price || ""}
            </span>
            {p.badge && (
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{
                  background: "rgba(34,197,94,0.14)",
                  color: "#4ade80",
                  border: "1px solid rgba(34,197,94,0.28)",
                }}
              >
                {p.badge}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GearPage() {
  return (
    <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-16">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#14b8a6" }}>
            Equipment & Accessories
          </p>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Best Pickleball Gear — Tested & Ranked
          </h1>
          <p className="text-lg max-w-2xl" style={{ color: "var(--text-muted)" }}>
            Every product below has been personally tested and used in real play. We only recommend gear that makes a genuine difference on the court — no filler, no pay-to-rank.
          </p>
        </div>

        {/* Editor's Pick featured card */}
        <EditorPickCard p={featured} />

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {rest.map((p) => <GridCard key={p.id} p={p} />)}
        </div>

      </div>
    </div>
  );
}
