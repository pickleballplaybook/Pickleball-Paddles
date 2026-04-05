"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Search, ArrowRight, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Paddle } from "@/types";
import { getSimilarPaddles } from "@/lib/trending";

const MAX_PADDLES   = 4;
const BROWSE_SIZES  = [20, 50];

// ── Helpers ───────────────────────────────────────────────────────────────────

function RatingBar({ value }: { value: number }) {
  const pct = Math.round((value / 10) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#14b8a6" }} />
      </div>
      <span className="text-xs font-semibold w-6 text-right" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td
        className="py-3 pr-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap w-32"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </td>
      {children}
    </tr>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <td className="py-3 px-2 text-sm text-center align-middle" style={{ color: "var(--text-primary)" }}>
      {children ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
    </td>
  );
}

// ── Browse grid pagination ────────────────────────────────────────────────────

function BrowsePagination({
  page, totalPages, onPage,
}: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30 transition-colors"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors"
          style={p === page
            ? { background: "#14b8a6", color: "#fff" }
            : { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30 transition-colors"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ComparePage({ paddles }: { paddles: Paddle[] }) {
  const [selected,   setSelected]   = useState<Paddle[]>([]);
  const [query,      setQuery]      = useState("");
  const [browseSize, setBrowseSize] = useState(20);
  const [browsePage, setBrowsePage] = useState(1);

  // Search dropdown results
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return paddles
      .filter(
        (p) =>
          !selected.find((s) => s.id === p.id) &&
          (p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.shape.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query, selected, paddles]);

  // Browse list — filtered by query if typed, otherwise all paddles
  const browseList = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? paddles.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.shape.toLowerCase().includes(q)
        )
      : paddles;
    return base.filter((p) => !selected.find((s) => s.id === p.id));
  }, [query, selected, paddles]);

  const browseTotalPages = Math.ceil(browseList.length / browseSize);
  const browsePaged      = browseList.slice((browsePage - 1) * browseSize, browsePage * browseSize);

  const similar = useMemo(() => {
    if (selected.length === 0) return [];
    return getSimilarPaddles(selected[0].id, paddles, 4).filter(
      (p) => !selected.find((s) => s.id === p.id)
    );
  }, [selected, paddles]);

  function add(paddle: Paddle) {
    if (selected.length >= MAX_PADDLES) return;
    setSelected((prev) => [...prev, paddle]);
    setQuery("");
  }

  function remove(id: string) {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  }

  function handleBrowsePage(p: number) {
    setBrowsePage(Math.max(1, Math.min(browseTotalPages, p)));
  }

  function handleBrowseSize(s: number) {
    setBrowseSize(s);
    setBrowsePage(1);
  }

  const canAdd = selected.length < MAX_PADDLES;

  return (
    <div className="min-h-screen" style={{ paddingTop: "calc(var(--topbar-h) + 96px)", background: "var(--bg-page)" }}>
      <div className="container-xl">

        {/* Header */}
        <div className="pt-10 pb-12 mb-10" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-brand-500">
            Side-by-Side
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
            Compare Paddles
          </h1>
          <p className="text-lg max-w-xl" style={{ color: "var(--text-muted)" }}>
            Select up to {MAX_PADDLES} paddles to compare specs, ratings, and pricing.
          </p>
        </div>

        {/* Search + Selected pills */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 mb-4">
            {selected.map((p) => (
              <div
                key={p.id}
                className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl text-sm font-semibold"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                {p.brand} {p.name}
                <button
                  onClick={() => remove(p.id)}
                  className="w-5 h-5 rounded-md flex items-center justify-center hover:text-red-400 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  aria-label={`Remove ${p.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {selected.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No paddles selected yet. Search or pick from the list below.</p>
            )}
          </div>

          {canAdd && (
            <div className="relative max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                placeholder="Search by brand or name…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setBrowsePage(1); }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              {searchResults.length > 0 && (
                <div
                  className="absolute z-20 top-full mt-1 w-full rounded-xl overflow-hidden shadow-xl"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => add(p)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:text-brand-500 transition-colors"
                      style={{ borderBottom: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide block" style={{ color: "var(--text-muted)" }}>
                          {p.brand}
                        </span>
                        <span className="text-sm font-bold">{p.name}</span>
                        <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>{p.shape} · {p.thickness}</span>
                      </div>
                      <Plus className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {!canAdd && (
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              Maximum of {MAX_PADDLES} paddles selected. Remove one to add another.
            </p>
          )}
        </div>

        {/* ── Comparison table (1+ paddles) ───────────────────────────────── */}
        {selected.length >= 1 && (
          <div className="mb-12">
            {/* Single-paddle state */}
            {selected.length === 1 && (
              <div
                className="rounded-2xl p-6 mb-6 flex items-center gap-4"
                style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)" }}
              >
                {selected[0].image && (
                  <div className="w-12 h-12 flex-shrink-0 relative">
                    <Image src={selected[0].image} alt={selected[0].name} fill className="object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#14b8a6" }}>{selected[0].brand}</p>
                  <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>{selected[0].name}</p>
                </div>
                <p className="text-sm font-semibold" style={{ color: "#2dd4bf" }}>
                  What would you like to compare it to?
                </p>
              </div>
            )}

            {/* Full comparison table (2+ paddles) */}
            {selected.length >= 2 && (
              <div className="overflow-x-auto rounded-2xl mb-6" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}>
                      <th className="py-4 pr-4 text-left w-32" />
                      {selected.map((p) => (
                        <th key={p.id} className="py-4 px-2 text-center">
                          <div className="flex flex-col items-center gap-2">
                            {p.image && (
                              <div className="w-16 h-16 relative flex-shrink-0">
                                <Image src={p.image} alt={p.name} fill className="object-contain" />
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                                {p.brand}
                              </p>
                              <p className="text-sm font-extrabold leading-snug" style={{ color: "var(--text-primary)" }}>
                                {p.name}
                              </p>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ background: "var(--bg-card)" }}>
                    <Row label="Shape">
                      {selected.map((p) => <Cell key={p.id}>{p.shape}</Cell>)}
                    </Row>
                    <Row label="Thickness">
                      {selected.map((p) => <Cell key={p.id}>{p.thickness}</Cell>)}
                    </Row>
                    <Row label="Weight">
                      {selected.map((p) => <Cell key={p.id}>{p.weight}</Cell>)}
                    </Row>
                    <Row label="Swing Wt">
                      {selected.map((p) => <Cell key={p.id}>{p.swingWeight}</Cell>)}
                    </Row>
                    <Row label="Twist Wt">
                      {selected.map((p) => <Cell key={p.id}>{p.twistWeight}</Cell>)}
                    </Row>
                    <Row label="Price">
                      {selected.map((p) => (
                        <Cell key={p.id}>{p.price ?? "—"}</Cell>
                      ))}
                    </Row>
                    <Row label="Discount">
                      {selected.map((p) => (
                        <Cell key={p.id}>
                          {p.amountOff && p.amountOff !== "$0" && p.amountOff !== "" && p.discountLink ? (
                            <a
                              href={p.discountLink}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="inline-block text-xs font-bold px-2 py-0.5 rounded-lg font-mono transition-opacity hover:opacity-80"
                              style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.2)" }}
                            >
                              {p.amountOff} off
                            </a>
                          ) : "—"}
                        </Cell>
                      ))}
                    </Row>
                    <Row label="Play Style">
                      {selected.map((p) => <Cell key={p.id}>{p.playStyle ?? "—"}</Cell>)}
                    </Row>
                    <Row label="Sweet Spot">
                      {selected.map((p) => <Cell key={p.id}>{p.sweetSpot ?? "—"}</Cell>)}
                    </Row>

                    {selected.some((p) => p.ratings) && (
                      <>
                        <Row label="Power">
                          {selected.map((p) => (
                            <Cell key={p.id}>
                              {p.ratings ? <RatingBar value={p.ratings.power} /> : "—"}
                            </Cell>
                          ))}
                        </Row>
                        <Row label="Spin">
                          {selected.map((p) => (
                            <Cell key={p.id}>
                              {p.ratings ? <RatingBar value={p.ratings.spin} /> : "—"}
                            </Cell>
                          ))}
                        </Row>
                        <Row label="Control">
                          {selected.map((p) => (
                            <Cell key={p.id}>
                              {p.ratings ? <RatingBar value={p.ratings.control} /> : "—"}
                            </Cell>
                          ))}
                        </Row>
                        <Row label="Hand Speed">
                          {selected.map((p) => (
                            <Cell key={p.id}>
                              {p.ratings ? <RatingBar value={p.ratings.handSpeed} /> : "—"}
                            </Cell>
                          ))}
                        </Row>
                      </>
                    )}

                    <tr>
                      <td className="py-4 pr-4" />
                      {selected.map((p) => (
                        <td key={p.id} className="py-4 px-2 text-center">
                          <Link
                            href={`/paddles/${p.slug}`}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-brand-400"
                            style={{ color: "#2dd4bf" }}
                          >
                            View <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {selected.length === 0 && (
          <div
            className="rounded-2xl p-10 text-center mb-10"
            style={{ background: "var(--bg-section)", border: "1px solid var(--border)" }}
          >
            <p className="text-xl font-bold mb-1" style={{ color: "var(--text-muted)" }}>
              Pick a paddle to get started
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Search above or browse the list below.
            </p>
          </div>
        )}

        {/* ── Browse all paddles ───────────────────────────────────────────── */}
        {canAdd && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {selected.length === 1 ? "What would you like to compare it to?" : "Browse All Paddles"}
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Per page:</span>
                {BROWSE_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleBrowseSize(s)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                    style={
                      s === browseSize
                        ? { background: "#14b8a6", color: "#fff" }
                        : { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {browseList.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>No paddles match your search.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {browsePaged.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => add(p)}
                      className="group text-left rounded-2xl p-4 transition-all hover:shadow-md active:scale-[0.98]"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                    >
                      {p.image && (
                        <div className="relative h-28 mb-3">
                          <Image src={p.image} alt={p.name} fill className="object-contain" />
                        </div>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#14b8a6" }}>
                        {p.brand}
                      </p>
                      <p className="text-sm font-extrabold leading-snug group-hover:text-brand-500 transition-colors" style={{ color: "var(--text-primary)" }}>
                        {p.name}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {p.shape} · {p.thickness} · {p.price ?? "—"}
                      </p>
                      <div
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                        style={{ background: "rgba(20,184,166,0.1)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.15)" }}
                      >
                        <Plus className="w-3 h-3" /> Add to compare
                      </div>
                    </button>
                  ))}
                </div>
                <BrowsePagination page={browsePage} totalPages={browseTotalPages} onPage={handleBrowsePage} />
              </>
            )}
          </div>
        )}

        {/* ── Similar paddles ──────────────────────────────────────────────── */}
        {similar.length > 0 && (
          <div className="mb-20">
            <h2 className="text-2xl font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
              Similar Paddles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similar.map((p) => (
                <Link
                  key={p.id}
                  href={`/paddles/${p.slug}`}
                  className="group rounded-2xl p-4 transition-shadow hover:shadow-lg"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  {p.image && (
                    <div className="relative h-32 mb-3">
                      <Image src={p.image} alt={p.name} fill className="object-contain" />
                    </div>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--text-muted)" }}>
                    {p.brand}
                  </p>
                  <p className="text-sm font-extrabold group-hover:text-brand-500 transition-colors" style={{ color: "var(--text-primary)" }}>
                    {p.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {p.shape} · {p.thickness} · SW {p.swingWeight}
                  </p>
                  <button
                    onClick={(e) => { e.preventDefault(); add(p); }}
                    disabled={!canAdd}
                    className="mt-3 text-xs font-semibold transition-colors hover:text-brand-500 disabled:opacity-40"
                    style={{ color: "var(--text-muted)" }}
                  >
                    + Add to compare
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
