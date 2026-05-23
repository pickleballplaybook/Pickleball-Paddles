import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { paddles } from "@/data/paddles";
import { brands } from "@/data/brands";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Pickleball Paddle Discount Codes — Save on Every Brand | Pickleball Playbook",
  description:
    "Use code PLAYBOOK to save on 30+ pickleball paddle brands. Exclusive discount codes for 11SIX24, Selkirk, Joola, CRBN, Bread & Butter, and more. Updated daily.",
  alternates: { canonical: `${siteConfig.siteUrl}/discounts` },
  openGraph: {
    title: "Pickleball Paddle Discount Codes — Save on Every Brand",
    description: "Use code PLAYBOOK at checkout. Exclusive discounts on 30+ brands.",
    url: `${siteConfig.siteUrl}/discounts`,
    type: "website",
    siteName: siteConfig.name,
  },
};

interface BrandDeal {
  name: string;
  logo: string;
  discount: string;
  code: string;
  shopLink: string;
  paddleCount: number;
  slug: string;
}

function getDeals(): BrandDeal[] {
  // Group paddles by brand, find the best discount and a representative link
  const brandMap = new Map<string, { discount: string; link: string; count: number }>();

  for (const p of paddles) {
    if (!p.discountLink || !p.amountOff || p.amountOff === "$0" || p.amountOff === "") continue;
    const existing = brandMap.get(p.brand);
    if (!existing) {
      brandMap.set(p.brand, { discount: p.amountOff, link: p.discountLink, count: 1 });
    } else {
      existing.count += 1;
      // Prefer higher percentage discounts
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

    // Determine the code
    let code = "PLAYBOOK";
    if (brandName === "Selkirk" || brandName === "SLK") {
      if (!data.link.includes("lockerroompickleball.com")) code = "INF-PLAYBOOK";
    }

    deals.push({
      name: brandName,
      logo: brandData.logo,
      discount: data.discount,
      code,
      shopLink: data.link,
      paddleCount: data.count,
      slug: brandData.slug,
    });
  }

  // Sort by discount value (percentages first, then dollar amounts)
  deals.sort((a, b) => {
    const aPct = a.discount.endsWith("%") ? parseFloat(a.discount) : 0;
    const bPct = b.discount.endsWith("%") ? parseFloat(b.discount) : 0;
    if (aPct !== bPct) return bPct - aPct;
    return b.paddleCount - a.paddleCount;
  });

  return deals;
}

export default function DiscountsPage() {
  const deals = getDeals();

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

        {/* Brand grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {deals.map((deal) => (
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
