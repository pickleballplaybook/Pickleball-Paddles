// ─────────────────────────────────────────────────────────────────────────────
//  /admin/affiliates — single-screen admin index for every affiliate program
//  we earn through. Searchable, alphabetized, with a sticky grand-total bar
//  showing the sum of revenue you've recorded across all brands.
//
//  Admin-only by virtue of being unlinked from any public nav. Not robots-
//  blocked because there's no sensitive data on the page itself — the
//  revenue numbers live in your browser's localStorage and are never sent
//  to the server.
//
//  Multi-platform login workaround: most rows live on shared platforms
//  (Uppromote, Social Snowball, Shopify Collabs) that issue one session
//  cookie per platform domain. Logging into a second brand on the same
//  platform logs you out of the first. The fix is per-tab cookie
//  isolation — Firefox Multi-Account Containers handles this cleanly;
//  Chrome's equivalent is separate profiles. The page header surfaces
//  that tip with a link to the Firefox add-on.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search, Info } from "lucide-react";
import { affiliateBrands, type AffiliateBrand } from "@/data/affiliates";

const STORAGE_KEY = "affiliate-revenue-v1";

// Parse a user-typed string ("123.45", "$1,234", "") into a number.
// Returns 0 for unparseable input so the total stays well-defined.
function parseRevenue(input: string): number {
  if (!input) return 0;
  const n = parseFloat(input.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// Format a number as USD currency for display.
function formatUSD(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function AffiliatesAdminPage() {
  const [query,    setQuery]    = useState("");
  // Per-brand revenue strings — the input field's value. We keep the raw
  // string instead of a number so the user can type "1,234.56" naturally
  // and we coerce to number only when summing the total.
  const [revenue,  setRevenue]  = useState<Record<string, string>>({});
  const [loaded,   setLoaded]   = useState(false);

  // Hydrate from localStorage on first mount. We gate writes behind
  // `loaded` so the empty initial state doesn't clobber stored data
  // between hydration and the effect firing.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRevenue(JSON.parse(raw));
    } catch { /* corrupt JSON or no localStorage — start clean */ }
    setLoaded(true);
  }, []);

  // Persist every change. Throttling isn't worth it — the payload is
  // ~tens of bytes and writes happen at human typing speed.
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(revenue)); } catch {}
  }, [revenue, loaded]);

  // Filter on a lowercased query against name + platform so users can
  // search "uppromote" to find every brand on that platform at once.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return affiliateBrands;
    return affiliateBrands.filter((b) => {
      const hay = `${b.name} ${b.platform ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  // Total spans every brand (not just the filtered set) so the user
  // sees their true grand total even while searching for one brand.
  const total = useMemo(
    () => affiliateBrands.reduce((sum, b) => sum + parseRevenue(revenue[b.id] ?? ""), 0),
    [revenue],
  );

  function updateRevenue(id: string, value: string) {
    setRevenue((prev) => ({ ...prev, [id]: value }));
  }

  function clearAll() {
    if (!confirm("Clear all recorded revenue for every brand? This can't be undone.")) return;
    setRevenue({});
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: "#060e1a", paddingTop: "calc(var(--topbar-h, 108px) + 1rem)" }}>
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
            Admin
          </p>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3"
            style={{ color: "#fff" }}
          >
            Affiliate Programs
          </h1>
          <p className="text-base max-w-3xl" style={{ color: "rgba(255,255,255,0.55)" }}>
            Every brand we earn through. Click <strong style={{ color: "#60a5fa" }}>Open admin</strong> to jump to that brand&apos;s
            affiliate dashboard. Type the running revenue you see there into the input — the grand total at the
            bottom updates live and persists in your browser.
          </p>
        </div>

        {/* Multi-login tip */}
        <div
          className="rounded-2xl p-4 mb-8 flex items-start gap-3"
          style={{ background: "rgba(10, 100, 188,0.23)", border: "1px solid rgba(10, 100, 188,0.30)" }}
        >
          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#60a5fa" }} />
          <div className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
            <strong style={{ color: "#fff" }}>Heads up:</strong> most rows live on shared platforms (Uppromote,
            Social Snowball, Shopify Collabs) that issue one session cookie per platform — so logging into one
            brand logs you out of the others on the same platform. To stay logged into all of them at once, open
            each in its own cookie jar via{" "}
            <a
              href="https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline underline-offset-2"
              style={{ color: "#60a5fa" }}
            >
              Firefox Multi-Account Containers
            </a>
            {" "}(right-click a link → &ldquo;Open in container&rdquo;). Chrome&apos;s equivalent is separate browser profiles.
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "rgba(255,255,255,0.40)" }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by brand or platform (e.g. uppromote)…"
            className="w-full text-sm pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2"
            style={{
              background: "rgba(15,23,42,0.85)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#fff",
            }}
            aria-label="Search brands"
          />
        </div>

        {/* Brand list */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>
            {filtered.length} of {affiliateBrands.length} brands
          </p>
          <button
            onClick={clearAll}
            className="text-xs font-semibold transition-colors hover:text-rose-400"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            Clear all revenue
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {filtered.map((b) => (
            <BrandRow
              key={b.id}
              brand={b}
              value={revenue[b.id] ?? ""}
              onChange={(v) => updateRevenue(b.id, v)}
            />
          ))}
          {filtered.length === 0 && (
            <li
              className="text-sm text-center py-10 rounded-xl"
              style={{ color: "rgba(255,255,255,0.40)", background: "rgba(255,255,255,0.02)" }}
            >
              No brands match &ldquo;{query}&rdquo;.
            </li>
          )}
        </ul>

      </div>

      {/* Sticky grand total — pinned to the viewport bottom so the running
          number is always in view regardless of scroll position. */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: "linear-gradient(180deg, rgba(6,14,26,0.85) 0%, rgba(6,14,26,0.98) 50%)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid rgba(10, 100, 188,0.30)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
            Total Revenue
          </p>
          <p
            className="text-3xl md:text-4xl font-extrabold font-mono tabular-nums"
            style={{ color: "#60a5fa" }}
          >
            {formatUSD(total)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Single brand row ────────────────────────────────────────────────────────
function BrandRow({ brand, value, onChange }: {
  brand: AffiliateBrand;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <li
      className="rounded-xl px-4 py-3 grid gap-3 items-center"
      style={{
        gridTemplateColumns: "minmax(0,1fr) auto",
        background: "rgba(15,23,42,0.55)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* LEFT: brand identity + commission/discount + platform badge */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
          <h2 className="text-base font-extrabold truncate" style={{ color: "#fff" }}>
            {brand.name}
          </h2>
          {brand.platform && (
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: "rgba(10, 100, 188,0.30)", color: "#60a5fa", border: "1px solid rgba(10, 100, 188,0.30)" }}
            >
              {brand.platform}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
          {brand.discountOff && (
            <span>
              <span className="font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>Customer: </span>
              {brand.discountOff}
            </span>
          )}
          {brand.commission && (
            <span>
              <span className="font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>Commission: </span>
              {brand.commission}
            </span>
          )}
          {!brand.discountOff && !brand.commission && (
            <span style={{ color: "rgba(255,255,255,0.35)" }}>Terms TBD</span>
          )}
        </div>
      </div>

      {/* RIGHT: revenue input + Open-admin button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
            style={{ color: "rgba(255,255,255,0.40)" }}
            aria-hidden
          >
            $
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0.00"
            className="w-28 text-sm font-mono tabular-nums pl-6 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 text-right"
            style={{
              background: "rgba(15,23,42,0.85)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#fff",
            }}
            aria-label={`${brand.name} revenue`}
          />
        </div>
        {brand.adminUrl ? (
          <a
            href={brand.adminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all hover:scale-[1.03]"
            style={{ background: "rgba(10, 100, 188,0.30)", border: "1px solid rgba(10, 100, 188,0.40)", color: "#60a5fa" }}
          >
            Open admin
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span
            className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.40)" }}
            title="No admin URL on file yet"
          >
            No URL
          </span>
        )}
      </div>
    </li>
  );
}
