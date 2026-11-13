import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getBrandBySlug } from "@/data/brands";
import { siteConfig } from "@/config/site";
import { buildBrandMatchups, parseBrandMatchup, COMPARISON_BRAND_SLUGS } from "./[matchup]/helpers";

export const metadata: Metadata = {
  title: `Pickleball Brand Comparisons — Which Brand is Best? (${new Date().getFullYear()})`,
  description: "Side-by-side pickleball brand comparisons. See how Selkirk, JOOLA, Bread & Butter, Luzz, and more stack up on swing weight, price range, and paddle variety.",
  alternates: { canonical: `${siteConfig.siteUrl}/compare-brands` },
  openGraph: {
    title: "Pickleball Brand Comparisons",
    description: "Compare top pickleball brands side-by-side on specs, pricing, and who each is best for.",
    url: `${siteConfig.siteUrl}/compare-brands`,
    type: "website",
    siteName: siteConfig.name,
  },
};

export default function CompareBrandsIndexPage() {
  const matchups = buildBrandMatchups();

  // Group by first brand for layout
  const byBrand: Record<string, { matchup: string; nameA: string; nameB: string }[]> = {};
  for (const matchup of matchups) {
    const parsed = parseBrandMatchup(matchup);
    if (!parsed) continue;
    const ba = getBrandBySlug(parsed[0]);
    const bb = getBrandBySlug(parsed[1]);
    if (!ba || !bb) continue;
    const key = parsed[0];
    if (!byBrand[key]) byBrand[key] = [];
    byBrand[key].push({ matchup, nameA: ba.name, nameB: bb.name });
  }

  return (
    <div style={{ paddingTop: "calc(env(safe-area-inset-top) + 112px)" }}>
      <section className="py-12" style={{ background: "var(--flip-bg-card)" }}>
        <div className="container-xl max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>
            Brand Comparisons
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "var(--flip-text-head)" }}>
            Pickleball Brand Comparisons
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--flip-text-muted)" }}>
            Side-by-side comparisons of the top pickleball paddle brands — average swing weights, price ranges, available shapes, and who each brand is best for.
          </p>
        </div>
      </section>

      {/* Brand logo grid */}
      <section className="py-12">
        <div className="container-xl max-w-4xl">
          <h2 className="text-xl font-extrabold mb-6" style={{ color: "var(--flip-text-head)" }}>
            Brands Covered
          </h2>
          <div className="flex flex-wrap gap-3">
            {COMPARISON_BRAND_SLUGS.map((slug) => {
              const brand = getBrandBySlug(slug);
              if (!brand) return null;
              return (
                <Link
                  key={slug}
                  href={`/brands/${slug}`}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 hover:opacity-80 transition-opacity"
                  style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
                >
                  <div className="w-6 h-6 relative shrink-0">
                    <Image src={brand.logo} alt={brand.name} fill className="object-contain" />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--flip-text-head)" }}>{brand.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* All matchups */}
      <section className="py-12" style={{ background: "var(--flip-bg-card)" }}>
        <div className="container-xl max-w-4xl">
          <h2 className="text-xl font-extrabold mb-6" style={{ color: "var(--flip-text-head)" }}>
            All Brand Matchups
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {matchups.map((matchup) => {
              const parsed = parseBrandMatchup(matchup);
              if (!parsed) return null;
              const ba = getBrandBySlug(parsed[0]);
              const bb = getBrandBySlug(parsed[1]);
              if (!ba || !bb) return null;
              return (
                <Link
                  key={matchup}
                  href={`/compare-brands/${matchup}`}
                  className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all hover:border-[#5a9df9]/50"
                  style={{ background: "var(--flip-bg)", border: "1px solid var(--flip-card-border)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 relative shrink-0">
                      <Image src={ba.logo} alt={ba.name} fill className="object-contain" />
                    </div>
                    <span className="text-sm font-semibold truncate group-hover:text-[#5a9df9] transition-colors" style={{ color: "var(--flip-text-head)" }}>
                      {ba.name} vs {bb.name}
                    </span>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "#60a5fa" }}>Compare →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
