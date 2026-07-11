"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X, Check, Copy, ExternalLink } from "lucide-react";

export interface Deal {
  paddleSlug: string;
  brand: string;
  name: string;
  shape: string;
  thickness: string;
  image?: string;
  amountOff: string;     // "10%", "$10", or "" for gift-card style
  code: string;          // PLAYBOOK / INF-PLAYBOOK / etc
  discountLink: string;
  isGiftCard: boolean;   // true for Selkirk on selkirk.com with no $ off
}

interface Props {
  deals: Deal[];
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "var(--text-primary)",
};

function discountLabel(d: Deal): string {
  if (d.isGiftCard) return "Selkirk perks";
  if (!d.amountOff) return "Discount";
  if (d.amountOff.endsWith("%")) return `Save ${d.amountOff}`;
  return `${d.amountOff} off`;
}

export default function DiscountCodesSearch({ deals }: Props) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const brandOptions = useMemo(
    () => Array.from(new Set(deals.map((d) => d.brand))).sort(),
    [deals],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deals.filter((d) => {
      if (brand !== "all" && d.brand !== brand) return false;
      if (!q) return true;
      const hay = `${d.brand} ${d.name} ${d.code} ${d.shape}`.toLowerCase();
      return hay.includes(q);
    });
  }, [deals, query, brand]);

  async function copyCode(key: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1400);
    } catch {
      // clipboard unavailable — silently no-op
    }
  }

  function reset() {
    setQuery("");
    setBrand("all");
  }

  const hasFilters = query.trim() !== "" || brand !== "all";

  return (
    <div>
      {/* Search + brand filter */}
      <div
        className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl mb-4 sticky top-[88px] z-10"
        style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(12px)" }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by paddle, brand, or code…"
            className="w-full text-sm font-semibold rounded-xl pl-9 pr-9 py-3 focus:outline-none focus:ring-2"
            style={{ ...inputStyle, outlineColor: "#60a5fa" }}
            aria-label="Search discount codes"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10"
              aria-label="Clear search"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          aria-label="Filter by brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="text-sm font-semibold rounded-xl px-3 py-3 sm:min-w-[180px]"
          style={inputStyle}
        >
          <option value="all">All brands ({brandOptions.length})</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-1 text-sm font-semibold px-4 py-3 rounded-xl"
            style={{ color: "#60a5fa" }}
          >
            <X className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>
        Showing <span style={{ color: "var(--text-primary)" }}>{filtered.length}</span>{" "}
        {filtered.length === 1 ? "code" : "codes"}{hasFilters && deals.length !== filtered.length ? ` of ${deals.length}` : ""}
      </p>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-base mb-4" style={{ color: "var(--text-muted)" }}>No discount codes match your search.</p>
          <button onClick={reset} className="inline-flex items-center gap-1.5 font-bold text-sm px-5 py-2.5 rounded-xl text-white" style={{ background: "#0a64bc" }}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map((d) => {
            const key = d.paddleSlug;
            const copied = copiedKey === key;
            return (
              <li
                key={key}
                className="grid grid-cols-[56px_1fr] sm:grid-cols-[64px_1fr_auto_auto_auto] items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-colors hover:bg-white/5"
                style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Thumb */}
                <Link
                  href={`/paddles/${d.paddleSlug}`}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: "var(--bg-alt)" }}
                >
                  {d.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.image} alt={`${d.brand} ${d.name}`} className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-teal-500/10" />
                  )}
                </Link>

                {/* Brand + paddle name + spec */}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#60a5fa" }}>
                    {d.brand}
                  </p>
                  <Link href={`/paddles/${d.paddleSlug}`} className="block">
                    <p className="text-sm sm:text-base font-extrabold leading-tight truncate hover:text-brand-400 transition-colors" style={{ color: "var(--text-primary)" }}>
                      {d.name}
                    </p>
                  </Link>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    {d.shape} · {d.thickness} · <span style={{ color: d.isGiftCard ? "#facc15" : "#4ade80" }}>{discountLabel(d)}</span>
                  </p>
                </div>

                {/* Code — copy on click. On mobile this drops to its own row below thumb+text. */}
                <button
                  onClick={() => copyCode(key, d.code)}
                  className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-mono font-extrabold text-sm tracking-widest transition-all hover:scale-[1.02]"
                  style={{
                    background: copied ? "rgba(74,222,128,0.15)" : "rgba(10, 100, 188,0.30)",
                    border: `1px solid ${copied ? "rgba(74,222,128,0.45)" : "rgba(10, 100, 188,0.35)"}`,
                    color: copied ? "#4ade80" : "#0a64bc",
                  }}
                  aria-label={`Copy code ${d.code}`}
                  title="Click to copy"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : d.code}
                </button>

                {/* Shop link */}
                <a
                  href={d.discountLink}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="hidden sm:inline-flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-lg text-white transition-all hover:scale-[1.02]"
                  style={{ background: "#0a64bc" }}
                >
                  Shop <ExternalLink className="w-3 h-3" />
                </a>

                {/* "View paddle" subtle link */}
                <Link
                  href={`/paddles/${d.paddleSlug}`}
                  className="hidden sm:inline-flex text-xs font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  Details →
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
