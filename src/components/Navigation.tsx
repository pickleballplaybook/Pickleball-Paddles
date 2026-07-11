"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search, Sun, Moon, BookOpen, FileText, Tag } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useTheme } from "@/components/ThemeProvider";
import { paddles } from "@/data/paddles";
import { blogPosts } from "@/data/blogPosts";
import { guides, GUIDE_CATEGORIES } from "@/data/guides";
import { brands } from "@/data/brands";
import PaddleQuiz from "@/components/PaddleQuiz";

// Primary nav — high-intent, conversion-driving destinations only. Compare
// and Guides moved to footer-only to slim the hamburger; both still reachable
// from every page via Footer.tsx's main column.
const navLinks = [
  { label: "Paddles",        href: "/paddles" },
  { label: "Best Paddles",   href: "/best-pickleball-paddles" },
  { label: "Reviews",        href: "/reviews" },
  { label: "Pickleball 101", href: "/pickleball-101" },
  { label: "Gear",           href: "/gear"    },
  { label: "Discount Codes", href: "/discount-codes" },
];

// ── Global Search ─────────────────────────────────────────────────────────────

// All-terms-match scoring. The query "selkirk omni" splits into
// ["selkirk", "omni"] and a paddle qualifies only if BOTH tokens hit
// somewhere in the haystack — which is "brand name shape thickness slug"
// concatenated. So the brand match on "selkirk" + name match on "omni"
// counts as a hit even though no single field contains the full phrase.
// This is the fix for the "I can only search one word at a time" bug.
function matchesAllTerms(haystack: string, terms: string[]): boolean {
  for (const t of terms) {
    if (!haystack.includes(t)) return false;
  }
  return true;
}

// Optional ranking helper — paddles that match in the brand or name get
// a small boost over paddles that only match in the slug. Keeps the
// most-obviously-relevant results at the top of each section.
function termScore(primary: string, secondary: string, terms: string[]): number {
  let score = 0;
  for (const t of terms) {
    if (primary.includes(t)) score += 2;
    else if (secondary.includes(t)) score += 1;
  }
  return score;
}

interface SearchResults {
  paddleResults: typeof paddles;
  reviewResults: typeof blogPosts;
  guideResults: typeof guides;
  brandResults: typeof brands;
  totalCount: number;
}

function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query,   setQuery]   = useState("");
  const inputRef              = useRef<HTMLInputElement>(null);
  const router                = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results: SearchResults | null = useMemo(() => {
    const raw = query.trim().toLowerCase();
    if (!raw) return null;
    const terms = raw.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return null;

    // ── Paddles ─────────────────────────────────────────────────────
    const paddleResults = paddles
      .map((p) => {
        const primary = `${p.brand} ${p.name}`.toLowerCase();
        const all = `${primary} ${p.shape} ${p.thickness} ${p.slug.replace(/-/g, " ")}`;
        return { p, hit: matchesAllTerms(all, terms), s: termScore(primary, all, terms) };
      })
      .filter((r) => r.hit)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map((r) => r.p);

    // ── Reviews (blog posts) ────────────────────────────────────────
    const reviewResults = blogPosts
      .map((b) => {
        const primary = `${b.brand} ${b.paddleName}`.toLowerCase();
        const all = `${primary} ${b.title.toLowerCase()} ${b.excerpt.toLowerCase()}`;
        return { b, hit: matchesAllTerms(all, terms), s: termScore(primary, all, terms) };
      })
      .filter((r) => r.hit)
      .sort((a, b) => b.s - a.s)
      .slice(0, 4)
      .map((r) => r.b);

    // ── Guides ──────────────────────────────────────────────────────
    const guideResults = guides
      .map((g) => {
        const primary = g.title.toLowerCase();
        const all = `${primary} ${g.excerpt.toLowerCase()} ${GUIDE_CATEGORIES[g.category].label.toLowerCase()} ${g.slug.replace(/-/g, " ")}`;
        return { g, hit: matchesAllTerms(all, terms), s: termScore(primary, all, terms) };
      })
      .filter((r) => r.hit)
      .sort((a, b) => b.s - a.s)
      .slice(0, 4)
      .map((r) => r.g);

    // ── Brands ──────────────────────────────────────────────────────
    const brandResults = brands
      .filter((b) => matchesAllTerms(`${b.name} ${b.slug.replace(/-/g, " ")}`.toLowerCase(), terms))
      .slice(0, 3);

    const totalCount = paddleResults.length + reviewResults.length + guideResults.length + brandResults.length;
    return { paddleResults, reviewResults, guideResults, brandResults, totalCount };
  }, [query]);

  function go(href: string) {
    router.push(href);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="mx-auto w-full max-w-xl mt-20 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", maxHeight: "calc(100vh - 120px)" }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.5)" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search paddles, reviews, guides, brands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:text-red-400 flex-shrink-0"
            style={{ color: "rgba(255,255,255,0.5)" }}
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results — scrolls if long. Empty / no-results states pinned. */}
        <div className="overflow-y-auto">
          {results === null ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Try a brand and a name together — like &ldquo;selkirk omni&rdquo; or &ldquo;honolulu j6cr&rdquo;.
              </p>
            </div>
          ) : results.totalCount === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <>
              {/* ── Paddles ─────────────────────────────────────────── */}
              {results.paddleResults.length > 0 && (
                <>
                  <SectionHeader label="Paddles" count={results.paddleResults.length} />
                  {results.paddleResults.map((p) => (
                    <button
                      key={`paddle-${p.id}`}
                      onClick={() => go(`/paddles/${p.slug}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:text-brand-500"
                      style={{ borderBottom: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      {p.image && (
                        <div className="w-9 h-9 flex-shrink-0 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#60a5fa" }}>{p.brand}</p>
                        <p className="text-sm font-bold truncate">{p.name}</p>
                      </div>
                      <p className="text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {p.shape} · {p.thickness}
                      </p>
                    </button>
                  ))}
                </>
              )}

              {/* ── Reviews ────────────────────────────────────────── */}
              {results.reviewResults.length > 0 && (
                <>
                  <SectionHeader label="Reviews" count={results.reviewResults.length} />
                  {results.reviewResults.map((b) => (
                    <button
                      key={`review-${b.slug}`}
                      onClick={() => go(`/blog/${b.slug}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:text-brand-500"
                      style={{ borderBottom: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      <div
                        className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(10, 100, 188,0.30)" }}
                      >
                        <FileText className="w-4 h-4" style={{ color: "#60a5fa" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#60a5fa" }}>
                          {b.brand} Review
                        </p>
                        <p className="text-sm font-bold truncate">{b.title.replace(/ Review:.*$/, "")}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* ── Guides ─────────────────────────────────────────── */}
              {results.guideResults.length > 0 && (
                <>
                  <SectionHeader label="Guides" count={results.guideResults.length} />
                  {results.guideResults.map((g) => (
                    <button
                      key={`guide-${g.slug}`}
                      onClick={() => go(`/guides/${g.slug}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:text-brand-500"
                      style={{ borderBottom: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      <div
                        className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(10, 100, 188,0.30)" }}
                      >
                        <BookOpen className="w-4 h-4" style={{ color: "#60a5fa" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#60a5fa" }}>
                          {GUIDE_CATEGORIES[g.category].label}
                        </p>
                        <p className="text-sm font-bold truncate">{g.title}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* ── Brands ─────────────────────────────────────────── */}
              {results.brandResults.length > 0 && (
                <>
                  <SectionHeader label="Brands" count={results.brandResults.length} />
                  {results.brandResults.map((b) => (
                    <button
                      key={`brand-${b.slug}`}
                      onClick={() => go(`/brands/${b.slug}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:text-brand-500"
                      style={{ borderBottom: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      <div
                        className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(10, 100, 188,0.30)" }}
                      >
                        <Tag className="w-4 h-4" style={{ color: "#60a5fa" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#60a5fa" }}>Brand</p>
                        <p className="text-sm font-bold truncate">{b.name}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Small visual divider that introduces each result group.
function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2 sticky top-0 z-[1]"
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
        {label}
      </p>
      <p className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>{count}</p>
    </div>
  );
}

// ── Main Navigation ───────────────────────────────────────────────────────────

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quizOpen,   setQuizOpen]   = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className="relative transition-all duration-300"
        style={{
          background: isScrolled ? "rgba(0,0,0,0.96)" : "#000000",
          borderBottom: `1px solid ${isScrolled ? "rgba(255,255,255,0.08)" : "transparent"}`,
          boxShadow: isScrolled ? "0 1px 3px rgba(0,0,0,0.5)" : "none",
          backdropFilter: isScrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: isScrolled ? "blur(12px)" : "none",
        }}
      >
        <div className="container-xl">
            {/* ── Mobile header: hamburger | centered logo | search ──────── */}
          <div className="flex md:hidden items-center h-16 relative">
            {/* Left: hamburger */}
            <button
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ color: "rgba(255,255,255,0.5)" }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Center: logo + brand name (truly centered via absolute) */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 flex-shrink-0"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={siteConfig.logoPath}
                  alt={siteConfig.name}
                  width={siteConfig.logoWidth}
                  height={siteConfig.logoHeight}
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-[14px] tracking-tight leading-tight" style={{ color: "#e2e8f0" }}>
                  Pickleball
                </span>
                <span className="font-extrabold text-[14px] tracking-tight leading-tight" style={{ color: "#60a5fa" }}>
                  Playbook
                </span>
              </div>
            </Link>

            {/* Right: search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="ml-auto p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ color: "rgba(255,255,255,0.5)" }}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* ── Desktop header ───────────────────────────────────────────── */}
          <div className="hidden md:flex items-center justify-between h-16">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group flex-shrink-0"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={siteConfig.logoPath}
                  alt={siteConfig.name}
                  width={siteConfig.logoWidth}
                  height={siteConfig.logoHeight}
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-[14px] tracking-tight leading-tight" style={{ color: "#e2e8f0" }}>
                  Pickleball
                </span>
                <span className="font-extrabold text-[14px] tracking-tight leading-tight" style={{ color: "#60a5fa" }}>
                  Playbook
                </span>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-150 hover:text-brand-500"
                  style={{ color: "#e2e8f0" }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search paddles"
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:text-brand-500"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <Search className="w-4 h-4" strokeWidth={2} />
              </button>
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:text-brand-500"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {theme === "dark"
                  ? <Sun className="w-4 h-4" strokeWidth={2} />
                  : <Moon className="w-4 h-4" strokeWidth={2} />}
              </button>
              <button
                onClick={() => setQuizOpen(true)}
                className="inline-flex items-center gap-2 font-semibold text-sm py-2 px-5 rounded-xl transition-all duration-200 active:scale-[0.98]"
                style={{ background: "#ffffff", color: "#0a64bc" }}
              >
                Find My Paddle Quiz
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile drawer ────────────────────────────────────────────────── */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            isMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "#000000" }}
        >
          <div className="container-xl py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium px-4 py-3 rounded-xl transition-all hover:text-brand-500"
                style={{ color: "#e2e8f0" }}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={toggle}
                className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl transition-all hover:text-brand-500"
                style={{ color: "#e2e8f0" }}
              >
                {theme === "dark"
                  ? <><Sun className="w-4 h-4" strokeWidth={2} /> Light Mode</>
                  : <><Moon className="w-4 h-4" strokeWidth={2} /> Dark Mode</>}
              </button>
              <Link
                href="/paddles"
                className="btn-primary justify-center w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse All Paddles
              </Link>
            </div>
          </div>
        </div>
      </header>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      {quizOpen   && <PaddleQuiz   onClose={() => setQuizOpen(false)}   />}
    </>
  );
}
