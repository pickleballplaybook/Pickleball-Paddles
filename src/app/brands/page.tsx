import { Metadata } from "next";
import Link from "next/link";
import { brands } from "@/data/brands";
import { paddles } from "@/data/paddles";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Pickleball Paddle Brands — All Brands Reviewed",
  description: "Browse all pickleball paddle brands with independent reviews, lab-measured specs, and exclusive discount codes. Find the best brand for your game.",
  alternates: { canonical: `${siteConfig.siteUrl}/brands` },
  openGraph: {
    title: "Pickleball Paddle Brands — All Brands Reviewed",
    description: "Browse all brands with independent reviews and exclusive discount codes.",
    url: `${siteConfig.siteUrl}/brands`,
    type: "website",
    siteName: siteConfig.name,
  },
};

export default function BrandsPage() {
  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-16">

        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
            All Brands
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
            Pickleball Paddle Brands
          </h1>
          <p className="text-lg" style={{ color: "var(--text-muted)" }}>
            {brands.length} brands independently reviewed with lab-measured specs.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands
            .sort((a, b) => {
              const countA = paddles.filter((p) => p.brand === a.name).length;
              const countB = paddles.filter((p) => p.brand === b.name).length;
              return countB - countA;
            })
            .map((brand) => {
              const count = paddles.filter((p) => p.brand === brand.name).length;
              return (
                <Link
                  key={brand.slug}
                  href={`/brands/${brand.slug}`}
                  className="rounded-2xl p-5 flex flex-col items-center text-center gap-3 group transition-all hover:scale-[1.02]"
                  style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={brand.logo} alt={`${brand.name} logo`} className="w-full h-full object-contain p-2" />
                  </div>
                  <div>
                    <p className="text-sm font-bold group-hover:text-teal-400 transition-colors" style={{ color: "var(--text-primary)" }}>
                      {brand.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {count} paddle{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
        </div>

      </div>
    </div>
  );
}
