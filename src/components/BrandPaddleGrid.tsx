"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, Filter, X } from "lucide-react";
import PaddleCard from "@/components/PaddleCard";
import { effectivePrice } from "@/lib/price";
import type { Paddle } from "@/types";

type SortKey = "featured" | "price-asc" | "price-desc" | "swing-desc" | "twist-desc";

interface Props {
  paddles: Paddle[];
  shapes: string[];   // available shapes for this brand — drives the filter pills
}

const SORT_LABEL: Record<SortKey, string> = {
  "featured":    "Featured",
  "price-asc":   "Price: Low to High",
  "price-desc":  "Price: High to Low",
  "swing-desc":  "Power (Swing Weight)",
  "twist-desc":  "Forgiveness (Twist Weight)",
};

/**
 * BrandPaddleGrid
 * ---------------
 * Sort + shape-filter UI for a single brand's paddle list. Server component
 * computes the paddle set once; this client component handles all interaction
 * (no extra fetches, no URL state — keep it simple).
 */
export default function BrandPaddleGrid({ paddles, shapes }: Props) {
  const [sortKey,    setSortKey]    = useState<SortKey>("featured");
  const [shapeFilter, setShapeFilter] = useState<string | null>(null);

  const filteredSorted = useMemo(() => {
    const filtered = shapeFilter
      ? paddles.filter((p) => p.shape === shapeFilter)
      : paddles;

    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "price-asc": {
          const pa = effectivePrice(a) || Number.POSITIVE_INFINITY;
          const pb = effectivePrice(b) || Number.POSITIVE_INFINITY;
          return pa - pb;
        }
        case "price-desc": {
          const pa = effectivePrice(a);
          const pb = effectivePrice(b);
          return pb - pa;
        }
        case "swing-desc":
          return (b.swingWeight ?? 0) - (a.swingWeight ?? 0);
        case "twist-desc":
          return (b.twistWeight ?? 0) - (a.twistWeight ?? 0);
        case "featured":
        default:
          return (b.trendingScore ?? 0) - (a.trendingScore ?? 0);
      }
    });

    return sorted;
  }, [paddles, shapeFilter, sortKey]);

  return (
    <div>
      {/* Controls row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {/* Shape filter pills */}
        {shapes.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Filter className="w-3.5 h-3.5" /> Shape
            </span>
            <button
              onClick={() => setShapeFilter(null)}
              className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: shapeFilter === null ? "rgba(20,184,166,0.18)" : "transparent",
                border: `1px solid ${shapeFilter === null ? "rgba(20,184,166,0.45)" : "var(--border)"}`,
                color: shapeFilter === null ? "#2dd4bf" : "var(--text-muted)",
              }}
            >
              All
            </button>
            {shapes.map((shape) => {
              const active = shapeFilter === shape;
              const count = paddles.filter((p) => p.shape === shape).length;
              return (
                <button
                  key={shape}
                  onClick={() => setShapeFilter(active ? null : shape)}
                  className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors inline-flex items-center gap-1.5"
                  style={{
                    background: active ? "rgba(20,184,166,0.18)" : "transparent",
                    border: `1px solid ${active ? "rgba(20,184,166,0.45)" : "var(--border)"}`,
                    color: active ? "#2dd4bf" : "var(--text-muted)",
                  }}
                >
                  {shape}
                  <span className="text-[10px] font-bold opacity-70">{count}</span>
                  {active && <X className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Sort dropdown */}
        <label className="inline-flex items-center gap-2 text-xs font-bold">
          <span className="uppercase tracking-widest inline-flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort
          </span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-transparent transition-colors cursor-pointer focus:outline-none focus:border-teal-400"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              // Native select arrow positioning — leave room for it
              paddingRight: "2rem",
              appearance: "none",
              backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'><polyline points='6 9 12 15 18 9'/></svg>\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.6rem center",
            }}
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Result count when filtered */}
      {shapeFilter && (
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Showing {filteredSorted.length} {shapeFilter.toLowerCase()} {filteredSorted.length === 1 ? "paddle" : "paddles"}.
        </p>
      )}

      {/* Grid */}
      {filteredSorted.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          No paddles match this filter.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSorted.map((p) => (
            <PaddleCard key={p.id} paddle={p} />
          ))}
        </div>
      )}
    </div>
  );
}
