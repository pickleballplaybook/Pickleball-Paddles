"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Tag, ArrowUpDown } from "lucide-react";
import { paddles } from "@/data/paddles";
import { brands } from "@/data/brands";
import { siteConfig } from "@/config/site";

interface BrandDeal {
  name: string;
  logo: string;
  discount: string;
  code: string;
  shopLink: string;
  paddleCount: number;
  slug: string;
  trendingScore: number;
}

function getDeals(): BrandDeal[] {
  const brandMap = new Map<string, { discount: string; link: string; count: number; topScore: number }>();

  for (const p of paddles) {
    if (!p.discountLink || !p.amountOff || p.amountOff === "$0" || p.amountOff === "") continue;
    const existing = brandMap.get(p.brand);
    if (!existing) {
      brandMap.set(p.brand, { discount: p.amountOff, link: p.discountLink, count: 1, topScore: p.trendingScore });
    } else {
      existing.count += 1;
      if (p.trendingScore > existing.topScore) existing.topScore = p.trendingScore;
      const currentPct = parseFloat(existing.discount);
      const newPct = parseFloat(p.amountOff);
      if (!isNaN(newPct) && !isNaN(currentPct) && newPct > currentPct) {
        existing.discount = p.amountOff;
        existing.link = p.discountLink;
      }
    }
  }

  const deals: BrandDeal[] = [];
  for (const [brandName, data] of Array.from(brandMap.entries())) {
    const brandData = brands.find((b) => b.name === brandName);
    if (!brandData) continue;

    let code = "PLAYBOOK";
    if (brandName === "Selkirk" || brandName === "SLK") {
      if (!data.link.includes("lockerroompickleball.com")) code = "INF-PLAYBOOK";
    }

    // Use the Radiance link for Rev
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
      trendingScore: data.topScore,
    });
  }

  return deals;
}

type SortMode = "trending" | "a-z" | "z-a";

export default function DiscountsPage() {
  const [sort, setSort] = useState<SortMode>("trending");
  const deals = getDeals();

  const sorted = [...deals].sort((a, b) => {
    if (sort === "a-z") return a.name.localeCompare(b.name);
    if (sort === "z-a") return b.name.localeCompare(a.name);
    // trending: by trendingScore desc, then paddle count
    return b.trendingScore - a.trendingScore || b.paddleCount - a.paddleCount;
  });

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-16">

        {/* Hero */}
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.3)" }}>
            <Tag className="w-4 h-4" style={{ color: "#2dd4bf" }} />
            <span className="text-sm font-bold" style={{ color: "#2dd4bf" }}>{deals.length} Brands with Discounts</span>
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
            style={{ color: "var(--text-primary)" }}
          >
            Pickleball Paddle Discount Codes
          </h1>
          <p className="text-xl mb-3" style={{ color: "var(--text-muted)" }}>
            Use code <span className="font-mono font-extrabold" style={{ color: "#2dd4bf" }}>&quot;PLAYBOOK&quot;</span> to
            save on almost every brand.
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Every link below supports Playbook Reviews. We may earn a commission — it never affects our ratings.
          </p>
        </div>

        {/* Sort toggle */}
        <div className="flex items-center justify-end mb-6">
          <div
            className="inline-flex items-center gap-1 rounded-xl p-0.5"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ArrowUpDown className="w-3.5 h-3.5 ml-2" style={{ color: "var(--text-muted)" }} />
            {(["trending", "a-z", "z-a"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSort(mode)}
                className="text-xs font-bold px-3 py-1.5 rounded-[10px] transition-all"
                style={
                  sort === mode
                    ? { background: "#14b8a6", color: "#fff" }
                    : { color: "var(--text-muted)" }
                }
              >
                {mode === "trending" ? "Trending" : mode === "a-z" ? "A → Z" : "Z → A"}
              </button>
            ))}
          </div>
        </div>

        {/* Brand grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((deal) => (
            <div
              key={deal.name}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Logo */}
              <div className="flex items-center justify-center p-6" style={{ background: "rgba(255,255,255,0.03)", minHeight: "120px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={deal.logo}
                  alt={`${deal.name} logo`}
                  className="max-h-16 w-auto object-contain"
                  style={{ filter: "brightness(1.1)" }}
                />
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col flex-1">
                <h2 className="text-lg font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
                  {deal.name}
                </h2>
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                  Use code <span className="font-mono font-bold" style={{ color: "#2dd4bf" }}>&quot;{deal.code}&quot;</span> for{" "}
                  <span className="font-bold" style={{ color: "#2dd4bf" }}>{deal.discount} off</span>
                </p>

                <div className="mt-auto flex items-center gap-3">
                  <a
                    href={deal.shopLink}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="flex-1 inline-flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
                    style={{ background: "#14b8a6" }}
                  >
                    Shop {deal.name} <ArrowRight className="w-4 h-4" />
                  </a>
                  <Link
                    href={`/brands/${deal.slug}`}
                    className="inline-flex items-center justify-center px-3 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                    style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-muted)" }}
                  >
                    Reviews
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Don&apos;t see your brand? Browse all paddles to find more deals.
          </p>
          <Link
            href="/paddles"
            className="inline-flex items-center gap-2 font-bold text-sm px-8 py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
            style={{ background: "#14b8a6" }}
          >
            Browse All Paddles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
