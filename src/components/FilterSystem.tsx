"use client";

import { useState, useEffect } from "react";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { brands, shapes, thicknesses } from "@/data/paddles";
import { ActiveFilters, SortOption } from "@/types";
import { DEFAULT_FILTERS, countActiveFilters, getPriceRangeLabel } from "@/lib/paddle-filter";

export { DEFAULT_FILTERS };

// ── Option constants ──────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "popular-month", label: "Most Popular"        },
  { value: "newest",        label: "Newest First"        },
  { value: "price-low",     label: "Price: Low → High"   },
  { value: "price-high",    label: "Price: High → Low"   },
  { value: "power",         label: "Highest Power"       },
  { value: "control",       label: "Highest Control"     },
  { value: "spin",          label: "Highest Spin"        },
  { value: "twist-weight",  label: "Best Twist Weight"   },
  { value: "most-hearts",   label: "Most Saved"          },
];

const PRICE_RANGES = [
  { value: "all",       label: "All Prices"   },
  { value: "under-100", label: "Under $100"   },
  { value: "100-149",   label: "$100–$149"    },
  { value: "150-199",   label: "$150–$199"    },
  { value: "200-249",   label: "$200–$249"    },
  { value: "250-plus",  label: "$250+"        },
];

const PLAY_STYLES = [
  { value: "all",       label: "All Styles"  },
  { value: "power",     label: "Power"       },
  { value: "control",   label: "Control"     },
  { value: "all-court", label: "All-Court"   },
  { value: "spin",      label: "Spin"        },
];

const SWEET_SPOTS = [
  { value: "all",    label: "All"    },
  { value: "large",  label: "Large"  },
  { value: "medium", label: "Medium" },
  { value: "small",  label: "Small"  },
];

// ── Subcomponents ─────────────────────────────────────────────────────────────

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
      style={{
        background: "rgba(20,184,166,0.10)",
        color:      "#2dd4bf",
        border:     "1px solid rgba(20,184,166,0.25)",
      }}
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="transition-colors hover:text-white"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

const labelClass = "text-[11px] font-bold uppercase tracking-widest block mb-1.5";
const selectClass =
  "w-full text-sm font-medium appearance-none cursor-pointer rounded-xl px-3 py-2.5 " +
  "focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow";

// ── Main component ────────────────────────────────────────────────────────────

export default function FilterSystem({
  filters,
  onChange,
  resultCount,
  loadingHearts = false,
}: {
  filters:     ActiveFilters;
  onChange:    (f: ActiveFilters) => void;
  resultCount: number;
  loadingHearts?: boolean;
}) {
  const [isOpen, setIsOpen]   = useState(false);
  const [staged, setStaged]   = useState<ActiveFilters>(filters);

  // Sync staged to current applied state whenever the panel is opened
  useEffect(() => {
    if (isOpen) setStaged(filters);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount  = countActiveFilters(filters);
  const stagedCount  = countActiveFilters(staged);
  const hasPending   = JSON.stringify(staged) !== JSON.stringify(filters);

  const sel = (key: keyof ActiveFilters, val: string) =>
    setStaged((prev) => ({ ...prev, [key]: val }));

  function handleApply() {
    onChange(staged);
    setIsOpen(false);
  }

  function handleClear() {
    setStaged(DEFAULT_FILTERS);
    onChange(DEFAULT_FILTERS);
    setIsOpen(false);
  }

  const labelStyle  = { color: "var(--text-muted)" };
  const selectStyle = {
    color:      "var(--text-primary)",
    background: "var(--bg-card)",
    border:     "1px solid var(--border)",
  };

  return (
    <div className="mb-8">

      {/* ── Toolbar row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-3">

        {/* Filters toggle button */}
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          style={{
            background: isOpen ? "var(--bg-section)" : "var(--bg-card)",
            border: `1px solid ${isOpen ? "var(--border-strong, var(--border))" : "var(--border)"}`,
            color: "var(--text-primary)",
          }}
          aria-expanded={isOpen}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-extrabold"
              style={{ background: "#14b8a6", color: "#fff" }}
            >
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--text-muted)" }}
          />
        </button>

        {/* Sort — always visible, applies immediately */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-widest whitespace-nowrap" style={labelStyle}>
            Sort
          </label>
          <div className="relative">
            <select
              className="text-sm font-medium appearance-none cursor-pointer rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
              style={selectStyle}
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOption })}
              disabled={loadingHearts}
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {loadingHearts && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-transparent border-t-brand-500 rounded-full animate-spin" />
            )}
          </div>
        </div>

        {/* Result count */}
        <p className="text-sm ml-auto" style={{ color: "var(--text-muted)" }}>
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {resultCount}
          </span>{" "}
          {resultCount === 1 ? "paddle" : "paddles"}
        </p>
      </div>

      {/* ── Collapsible filter panel ─────────────────────────────────────────── */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? "640px" : "0px" }}
      >
        <div
          className="rounded-2xl p-5 mt-4"
          style={{ background: "var(--bg-section)", border: "1px solid var(--border)" }}
        >
          {/* Row 1: Brand | Shape | Price | Thickness */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className={labelClass} style={labelStyle}>Brand</label>
              <select className={selectClass} style={selectStyle}
                value={staged.brand} onChange={(e) => sel("brand", e.target.value)}>
                <option value="All">All Brands</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass} style={labelStyle}>Shape</label>
              <select className={selectClass} style={selectStyle}
                value={staged.shape} onChange={(e) => sel("shape", e.target.value)}>
                <option value="All">All Shapes</option>
                {shapes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass} style={labelStyle}>Price Range</label>
              <select className={selectClass} style={selectStyle}
                value={staged.priceRange} onChange={(e) => sel("priceRange", e.target.value)}>
                {PRICE_RANGES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} style={labelStyle}>Thickness</label>
              <select className={selectClass} style={selectStyle}
                value={staged.thickness} onChange={(e) => sel("thickness", e.target.value)}>
                <option value="all">All Thicknesses</option>
                {thicknesses.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Play Style | Sweet Spot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div>
              <label className={labelClass} style={labelStyle}>Play Style</label>
              <select className={selectClass} style={selectStyle}
                value={staged.playStyle} onChange={(e) => sel("playStyle", e.target.value)}>
                {PLAY_STYLES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} style={labelStyle}>Sweet Spot</label>
              <select className={selectClass} style={selectStyle}
                value={staged.sweetSpot} onChange={(e) => sel("sweetSpot", e.target.value)}>
                {SWEET_SPOTS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div
            className="flex items-center gap-3 pt-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button onClick={handleApply} className="btn-primary text-sm py-2 px-6">
              Apply{hasPending && stagedCount > 0 ? ` Filters (${stagedCount})` : " Filters"}
            </button>

            {(activeCount > 0 || hasPending) && (
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-brand-500"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}

            {hasPending && (
              <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
                Unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Active filter pills ───────────────────────────────────────────────── */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.brand !== "All" && (
            <FilterPill
              label={`Brand: ${filters.brand}`}
              onRemove={() => onChange({ ...filters, brand: "All" })}
            />
          )}
          {filters.shape !== "All" && (
            <FilterPill
              label={`Shape: ${filters.shape}`}
              onRemove={() => onChange({ ...filters, shape: "All" })}
            />
          )}
          {filters.priceRange !== "all" && (
            <FilterPill
              label={`Price: ${getPriceRangeLabel(filters.priceRange)}`}
              onRemove={() => onChange({ ...filters, priceRange: "all" })}
            />
          )}
          {filters.playStyle !== "all" && (
            <FilterPill
              label={`Style: ${filters.playStyle}`}
              onRemove={() => onChange({ ...filters, playStyle: "all" })}
            />
          )}
          {filters.thickness !== "all" && (
            <FilterPill
              label={`Thickness: ${filters.thickness}`}
              onRemove={() => onChange({ ...filters, thickness: "all" })}
            />
          )}
          {filters.sweetSpot !== "all" && (
            <FilterPill
              label={`Sweet Spot: ${filters.sweetSpot}`}
              onRemove={() => onChange({ ...filters, sweetSpot: "all" })}
            />
          )}
        </div>
      )}
    </div>
  );
}
