"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Tag, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { paddles } from "@/data/paddles";
import { gearProducts } from "@/data/products";
import { brands } from "@/data/brands";
import { siteConfig } from "@/config/site";

interface Deal {
  name: string;
  logo?: string;
  image?: string;
  discount: string;
  code: string;
  shopLink: string;
  paddleCount: number;
  slug: string;
  type: "paddle" | "gear";
}

function getDeals(): Deal[] {
  const deals: Deal[] = [];

  // ── Paddle brand deals ──────────────────────────────────────────────────
  const brandMap = new Map<string, { discount: string; link: string; count: number }>();

  for (const p of paddles) {
    if (!p.discountLink || !p.amountOff || p.amountOff === "$0" || p.amountOff === "") continue;
    const existing = brandMap.get(p.brand);
    if (!existing) {
      brandMap.set(p.brand, { discount: p.amountOff, link: p.discountLink, count: 1 });
    } else {
      existing.count += 1;
      const currentPct = parseFloat(existing.discount);
      const newPct = parseFloat(p.amountOff);
      if (!isNaN(newPct) && !isNaN(currentPct) && newPct > currentPct) {
        existing.discount = p.amountOff;
        existing.link = p.discountLink;
      }
    }
  }

  for (const [brandName, data] of Array.from(brandMap.entries())) {
    const brandData = brands.find((b) => b.name === brandName);
    if (!brandData) continue;

    let code = "PLAYBOOK";
    if (brandName === "Selkirk" || brandName === "SLK") {
      if (!data.link.includes("lockerroompickleball.com")) code = "INF-PLAYBOOK";
    }

    let shopLink = data.link;
    if (brandName === "Rev") {
      shopLink = "https://www.revpickleball.com/discount/PLAYBOOK?redirect=/products/radiance-foam-pickleball-paddle";
    }

    deals.push({
      name: brandName,
      logo: brandData.logo,
      discount: data.discount,
      code,
      shopLink,
      paddleCount: data.count,
      slug: brandData.slug,
      type: "paddle",
    });
  }

  // ── Gear deals ──────────────────────────────────────────────────────────
  for (const g of gearProducts) {
    if (!g.badge || !g.link) continue;
    const fullName = g.brand ? `${g.brand} ${g.name}` : g.name;
    deals.push({
      name: fullName,
      image: g.image,
      discount: g.badge,
      code: "",
      shopLink: g.link,
      paddleCount: 0,
      slug: g.id,
      type: "gear",
    });
  }

  return deals;
}

type SortMode = "popular" | "a-z" | "z-a";
const PER_PAGE = 20; // 10 rows × 2 columns

export default function DiscountsPage() {
  const [sort, setSort] = useState<SortMode>("popular");
  const [page, setPage] = useState(0);
  const deals = getDeals();

  const sorted = [...deals].sort((a, b) => {
    if (sort === "a-z") return a.name.localeCompare(b.name);
    if (sort === "z-a") return b.name.localeCompare(a.name);
    // popular: paddle brands by count first, then gear
    if (a.type !== b.type) return a.type === "paddle" ? -1 : 1;
    return b.paddleCount - a.paddleCount;
  });

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const visible = sorted.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-16">

        {/* Hero */}
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.3)" }}>
            <Tag className="w-4 h-4" style={{ color: "#2dd4bf" }} />
            <span className="text-sm font-bold" style={{ color: "#2dd4bf" }}>{deals.length} Deals Available</span>
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
            style={{ color: "var(--text-primary)" }}
          >
            Pickleball Discount Codes
          </h1>
          <p className="text-xl mb-3" style={{ color: "var(--text-muted)" }}>
            Use code <span className="font-mono font-extrabold" style={{ color: "#2dd4bf" }}>&quot;PLAYBOOK&quot;</span> to
            save on paddles, gear, and more.
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Every link below supports Playbook Reviews. We may earn a commission — it never affects our ratings.
          </p>
        </div>

        {/* Sort toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Page {page + 1} of {totalPages}
          </p>
          <div
            className="inline-flex items-center gap-1 rounded-xl p-0.5"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ArrowUpDown className="w-3.5 h-3.5 ml-2" style={{ color: "var(--text-muted)" }} />
            {(["popular", "a-z", "z-a"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setSort(mode); setPage(0); }}
                className="text-xs font-bold px-3 py-1.5 rounded-[10px] transition-all"
                style={
                  sort === mode
                    ? { background: "#14b8a6", color: "#fff" }
                    : { color: "var(--text-muted)" }
                }
              >
                {mode === "popular" ? "Popular" : mode === "a-z" ? "A → Z" : "Z → A"}
              </button>
            ))}
          </div>
        </div>

        {/* Brand + gear grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {visible.map((deal) => (
            <div
              key={`${deal.type}-${deal.slug}`}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Logo / image */}
              <div className="flex items-center justify-center p-6" style={{ background: "rgba(255,255,255,0.03)", minHeight: "120px" }}>
                {deal.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={deal.logo} alt={`${deal.name} logo`} className="max-h-16 w-auto object-contain" style={{ filter: "brightness(1.1)" }} />
                ) : deal.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={deal.image} alt={deal.name} className="max-h-20 w-auto object-contain" />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(20,184,166,0.15)" }}>
                    <Tag className="w-6 h-6" style={{ color: "#2dd4bf" }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                    {deal.name}
                  </h2>
                  {deal.type === "gear" && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}>
                      Gear
                    </span>
                  )}
                </div>
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                  {deal.code ? (
                    <>Use code <span className="font-mono font-bold" style={{ color: "#2dd4bf" }}>&quot;{deal.code}&quot;</span> for{" "}</>
                  ) : (
                    <>Get </>
                  )}
                  <span className="font-bold" style={{ color: "#2dd4bf" }}>{deal.discount}{deal.code ? " off" : ""}</span>
                </p>

                <div className="mt-auto flex items-center gap-3">
                  <a
                    href={deal.shopLink}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="flex-1 inline-flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
                    style={{ background: "#14b8a6" }}
                  >
                    Shop {deal.name.split(" ").slice(0, 2).join(" ")} <ArrowRight className="w-4 h-4" />
                  </a>
                  <Link
                    href={deal.type === "paddle" ? `/brands/${deal.slug}` : `/gear/${deal.slug}`}
                    className="inline-flex items-center justify-center px-3 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                    style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-muted)" }}
                  >
                    {deal.type === "paddle" ? "Reviews" : "Details"}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 font-bold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-30"
              style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                  style={
                    i === page
                      ? { background: "#14b8a6", color: "#fff" }
                      : { background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 font-bold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-30"
              style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
