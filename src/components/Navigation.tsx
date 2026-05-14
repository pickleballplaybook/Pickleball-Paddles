"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search, Sun, Moon } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useTheme } from "@/components/ThemeProvider";
import { paddles } from "@/data/paddles";
import PaddleQuiz from "@/components/PaddleQuiz";

const navLinks = [
  { label: "Paddles",     href: "/paddles" },
  { label: "Best Paddles", href: "/best-pickleball-paddles" },
  { label: "Series",      href: "/series" },
  { label: "Reviews",     href: "/reviews" },
  { label: "Compare",     href: "/compare" },
  { label: "Gear",        href: "/gear"    },
];

// ── Global Search ─────────────────────────────────────────────────────────────

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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return paddles
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.shape.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query]);

  function go(slug: string) {
    router.push(`/paddles/${slug}`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="mx-auto w-full max-w-xl mt-20 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.5)" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search paddles…"
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

        {/* Results */}
        {query.trim() === "" ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Start typing to search paddles by brand or name.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>No paddles found for &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          <div>
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => go(p.slug)}
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
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#14b8a6" }}>{p.brand}</p>
                  <p className="text-sm font-bold truncate">{p.name}</p>
                </div>
                <p className="text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {p.shape} · {p.thickness}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
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
                <span className="font-extrabold text-brand-500 text-[14px] tracking-tight leading-tight">
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
                <span className="font-extrabold text-brand-500 text-[14px] tracking-tight leading-tight">
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
                className="btn-primary text-sm py-2 px-5"
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
