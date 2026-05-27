"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Paddle } from "@/types";
import PaddleCard from "@/components/PaddleCard";
import { effectivePrice } from "@/lib/price";

type SortOption = "price-low" | "price-high" | "swing-high" | "newest";

const STYLE_LABELS: Record<string, string> = {
  power: "Power",
  control: "Control",
  "all-court": "All-Court",
  spin: "Spin",
};

const selectStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "var(--text-primary)",
};

interface Props {
  paddles: Paddle[];
  maxPrice: number;
}

export default function PaddleBudgetGrid({ paddles, maxPrice }: Props) {
  const [brand, setBrand] = useState("all");
  const [shape, setShape] = useState("all");
  const [style, setStyle] = useState("all");
  const [sort, setSort] = useState<SortOption>("price-low");

  const brandOptions = useMemo(() => Array.from(new Set(paddles.map((p) => p.brand))).sort(), [paddles]);
  const shapeOptions = useMemo(() => Array.from(new Set(paddles.map((p) => p.shape))).sort(), [paddles]);
  const styleOptions = useMemo(
    () => Array.from(new Set(paddles.map((p) => p.playStyle).filter(Boolean))) as string[],
    [paddles],
  );

  const filtered = useMemo(() => {
    const list = paddles.filter(
      (p) =>
        (brand === "all" || p.brand === brand) &&
        (shape === "all" || p.shape === shape) &&
        (style === "all" || p.playStyle === style),
    );
    return [...list].sort((a, b) => {
      switch (sort) {
        case "price-low": return effectivePrice(a) - effectivePrice(b);
        case "price-high": return effectivePrice(b) - effectivePrice(a);
        case "swing-high": return b.swingWeight - a.swingWeight;
        case "newest": return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        default: return 0;
      }
    });
  }, [paddles, brand, shape, style, sort]);

  const hasFilters = brand !== "all" || shape !== "all" || style !== "all";

  function reset() {
    setBrand("all");
    setShape("all");
    setStyle("all");
  }

  return (
    <div>
      {/* Filter bar */}
      <div
        className="flex flex-wrap items-center gap-3 mb-8 p-4 rounded-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2 mr-1" style={{ color: "var(--text-muted)" }}>
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm font-bold">Filter</span>
        </div>

        <select aria-label="Filter by brand" value={brand} onChange={(e) => setBrand(e.target.value)} className="text-sm font-semibold rounded-xl px-3 py-2" style={selectStyle}>
          <option value="all">All brands</option>
          {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        <select aria-label="Filter by shape" value={shape} onChange={(e) => setShape(e.target.value)} className="text-sm font-semibold rounded-xl px-3 py-2" style={selectStyle}>
          <option value="all">All shapes</option>
          {shapeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select aria-label="Filter by play style" value={style} onChange={(e) => setStyle(e.target.value)} className="text-sm font-semibold rounded-xl px-3 py-2" style={selectStyle}>
          <option value="all">All play styles</option>
          {styleOptions.map((s) => <option key={s} value={s}>{STYLE_LABELS[s] ?? s}</option>)}
        </select>

        <select aria-label="Sort paddles" value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="text-sm font-semibold rounded-xl px-3 py-2 sm:ml-auto" style={selectStyle}>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="swing-high">Swing Weight: High to Low</option>
          <option value="newest">Newest</option>
        </select>

        {hasFilters && (
          <button onClick={reset} className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-xl transition-colors" style={{ color: "#2dd4bf" }}>
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      <p className="text-sm font-semibold mb-6" style={{ color: "var(--text-muted)" }}>
        Showing <span style={{ color: "var(--text-primary)" }}>{filtered.length}</span> {filtered.length === 1 ? "paddle" : "paddles"} under ${maxPrice}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-base mb-4" style={{ color: "var(--text-muted)" }}>No paddles match those filters.</p>
          <button onClick={reset} className="inline-flex items-center gap-1.5 font-bold text-sm px-5 py-2.5 rounded-xl text-white" style={{ background: "#14b8a6" }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((paddle, i) => (
            <PaddleCard key={paddle.id} paddle={paddle} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
