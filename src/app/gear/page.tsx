import { Star, ArrowRight } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { gearProducts, GearProduct } from "@/data/products";
import GearTabs from "./GearTabs";

export const metadata: Metadata = {
  title: "Gear",
  description: "Top pickleball gear, clothing, accessories, and equipment — handpicked for serious players.",
};

// titan-b is a rotation-frequency duplicate — hide it from the catalog UI
const displayProducts = gearProducts.filter((p) => p.id !== "titan-b");

const featured = displayProducts.find((p) => p.id === "titan")!;
const rest = displayProducts.filter((p) => p.id !== "titan");

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
              style={{ maxHeight: "260px" }}
            />
          </div>
        </div>

        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.25em] mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            {p.brand}
          </p>
          <h2
            className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight"
            style={{ color: "#5a9df9" }}
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
                    <span className="text-2xl font-extrabold" style={{ color: "#5a9df9" }}>{salePrice}</span>
                    <span className="text-xl font-semibold line-through" style={{ color: "var(--text-muted)" }}>{p.price}</span>
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
                background: "linear-gradient(135deg, #3a8bf0, #2066d0)",
                boxShadow: "0 0 24px rgba(90,157,249,0.35)",
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
                border: "1.5px solid rgba(90,157,249,0.45)",
                color: "#5a9df9",
              }}
            >
              Buy at {p.brand}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
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
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#5a9df9" }}>
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

        {/* Tabbed product grid */}
        <GearTabs products={rest} />

      </div>
    </div>
  );
}
