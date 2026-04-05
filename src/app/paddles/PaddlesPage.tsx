"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PaddleCard        from "@/components/PaddleCard";
import FilterSystem      from "@/components/FilterSystem";
import DiscountBanner    from "@/components/DiscountBanner";
import { ActiveFilters, Paddle, PriceCache } from "@/types";
import { fetchUserReactionMap, ReactionMap } from "@/hooks/useReactions";
import {
  applyFiltersAndSort,
  parseSearchParams,
  filtersToSearchParams,
  DEFAULT_FILTERS,
} from "@/lib/paddle-filter";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [20, 50];

// ── Pagination controls ───────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors"
          style={
            p === page
              ? { background: "#14b8a6", color: "#fff" }
              : { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }
          }
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Inner component (uses useSearchParams — must be inside Suspense) ──────────

function PaddlesInner({ paddles, priceCache }: { paddles: Paddle[]; priceCache: PriceCache }) {
  const searchParams = useSearchParams();
  const initialParams = Object.fromEntries(searchParams.entries());

  const [filters,   setFilters]   = useState<ActiveFilters>(() => parseSearchParams(initialParams));
  const [reactions, setReactions] = useState<ReactionMap>({});
  const [pageSize,  setPageSize]  = useState(20);
  const [page,      setPage]      = useState(1);

  useEffect(() => {
    fetchUserReactionMap().then(setReactions);
  }, []);

  // Persist applied filters to URL (no server re-render — uses replaceState)
  function handleFiltersChange(newFilters: ActiveFilters) {
    setFilters(newFilters);
    setPage(1); // reset to first page on filter change
    const params = filtersToSearchParams(newFilters);
    const qs     = params.toString();
    const url    = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }

  const filtered = useMemo(
    () => applyFiltersAndSort(paddles, filters, priceCache, reactions),
    [paddles, filters, priceCache, reactions]
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  function handlePage(p: number) {
    setPage(Math.max(1, Math.min(totalPages, p)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <FilterSystem
        filters={filters}
        onChange={handleFiltersChange}
        resultCount={filtered.length}
      />

      {filtered.length > 0 ? (
        <>
          {/* Per-page selector + count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Per page:</span>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handlePageSizeChange(s)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                  style={
                    s === pageSize
                      ? { background: "#14b8a6", color: "#fff" }
                      : { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {paginated.map((paddle) => (
              <PaddleCard key={paddle.id} paddle={paddle} />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPage={handlePage} />
        </>
      ) : (
        <div className="py-20 text-center">
          <p className="text-2xl font-bold mb-2" style={{ color: "var(--text-muted)" }}>
            No paddles match
          </p>
          <p className="mb-6" style={{ color: "var(--text-muted)" }}>
            Try adjusting or clearing your filters.
          </p>
          <button
            onClick={() => handleFiltersChange(DEFAULT_FILTERS)}
            className="btn-primary text-sm py-2 px-6"
          >
            Clear Filters
          </button>
        </div>
      )}
    </>
  );
}

// ── Exported page component ───────────────────────────────────────────────────

export default function PaddlesPage({
  paddles,
  priceCache,
}: {
  paddles:    Paddle[];
  priceCache: PriceCache;
}) {
  return (
    <div className="min-h-screen pt-24" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl">

        <div className="pt-10 pb-12 mb-10" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-brand-500">
            {paddles.length} Paddles Listed
          </p>
          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tight mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            All Paddles
          </h1>
          <p className="text-lg max-w-xl" style={{ color: "var(--text-muted)" }}>
            Filter by brand, shape, or style. Save with code{" "}
            <span className="font-mono font-semibold text-brand-600">PLAYBOOK</span>
            {" "}at checkout.
          </p>
        </div>

        {/* Suspense boundary required for useSearchParams */}
        <Suspense fallback={
          <div className="h-12 mb-8 rounded-xl animate-pulse" style={{ background: "var(--bg-section)" }} />
        }>
          <PaddlesInner paddles={paddles} priceCache={priceCache} />
        </Suspense>

        <div className="mb-20">
          <DiscountBanner variant="large" />
        </div>
      </div>
    </div>
  );
}
