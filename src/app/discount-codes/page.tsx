import { Metadata } from "next";
import Link from "next/link";
import { Tag, CheckCircle2, ArrowRight } from "lucide-react";
import { paddles } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import DiscountCodesSearch, { Deal } from "./DiscountCodesSearch";

const PAGE_URL = `${siteConfig.siteUrl}/discount-codes`;

// ── Discount code helper (mirrors logic used across the app) ──────────────────
function getCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

function isSelkirkGiftCard(brand: string, amountOff: string, discountLink?: string): boolean {
  if (!(brand === "Selkirk" || brand === "SLK")) return false;
  if (!(amountOff === "$0" || amountOff === "" || !amountOff)) return false;
  if (discountLink?.includes("lockerroompickleball.com")) return false;
  return true;
}

// ── Build the deals list ───────────────────────────────────────────────────
function buildDeals(): Deal[] {
  const out: Deal[] = [];
  for (const p of paddles) {
    if (!p.discountLink?.trim()) continue;
    const realDiscount = p.amountOff && p.amountOff !== "$0" && p.amountOff !== "";
    const giftCard = isSelkirkGiftCard(p.brand, p.amountOff, p.discountLink);
    if (!realDiscount && !giftCard) continue;
    out.push({
      paddleSlug: p.slug,
      brand: p.brand,
      name: p.name,
      shape: p.shape,
      thickness: p.thickness,
      image: p.image,
      amountOff: realDiscount ? p.amountOff : "",
      code: getCode(p.brand, p.discountLink),
      discountLink: p.discountLink,
      isGiftCard: giftCard,
    });
  }
  // Sort: brand A→Z, then paddle name
  return out.sort((a, b) =>
    a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name),
  );
}

// ── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Pickleball Paddle Discount Codes — Searchable List for Every Paddle",
  description:
    "The complete searchable list of pickleball paddle discount codes — every paddle, every brand, one place. Find the code for any paddle in seconds. Code PLAYBOOK works on most brands.",
  keywords: [
    "pickleball paddle discount codes",
    "pickleball discount code",
    "PLAYBOOK discount code",
    "pickleball paddle coupon",
    "pickleball brand promo codes",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Pickleball Paddle Discount Codes — Every Paddle in One Searchable List",
    description: "Search every paddle for its current discount code. Code PLAYBOOK works on most brands.",
    url: PAGE_URL,
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pickleball Paddle Discount Codes",
    description: "Search every paddle for its current discount code.",
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DiscountCodesPage() {
  const deals = buildDeals();
  const brandCount = new Set(deals.map((d) => d.brand)).size;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteConfig.siteUrl },
      { "@type": "ListItem", "position": 2, "name": "Discount Codes", "item": PAGE_URL },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl py-12">

          {/* Breadcrumbs */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <li><Link href="/" className="transition-colors hover:text-brand-400" style={{ color: "var(--text-muted)" }}>Home</Link></li>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <li style={{ color: "var(--text-primary)" }}>Discount Codes</li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="mb-10 max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4" style={{ color: "#60a5fa" }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#60a5fa" }}>
                Codes for Every Paddle
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5" style={{ color: "var(--text-primary)" }}>
              Pickleball Paddle Discount Codes
            </h1>
            <p className="text-lg leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
              Every active discount we&apos;ve negotiated, in one searchable list. Look up any paddle by name or brand
              and grab its code in one click — most brands accept{" "}
              <code className="font-mono font-bold px-2 py-0.5 rounded" style={{ background: "rgba(10, 100, 188,0.30)", color: "#60a5fa" }}>PLAYBOOK</code>,
              {" "}while Selkirk on selkirk.com uses{" "}
              <code className="font-mono font-bold px-2 py-0.5 rounded" style={{ background: "rgba(10, 100, 188,0.30)", color: "#60a5fa" }}>INF-PLAYBOOK</code>.
              Tap any code to copy it.
            </p>
            <div className="flex flex-wrap gap-4">
              {[`${deals.length} Active Codes`, `${brandCount} Brands`, "One-Click Copy", "Always Up to Date"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#60a5fa" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Searchable list */}
          <DiscountCodesSearch deals={deals} />

          {/* Footer note + CTA */}
          <div className="mt-16 max-w-3xl">
            <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="text-base font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>
                How the codes work
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Click any code chip to copy it, then click <strong style={{ color: "var(--text-primary)" }}>Shop</strong> on
                the same row to open the brand&apos;s site in a new tab — many of our affiliate links apply the code
                automatically at checkout. For Selkirk paddles bought directly from selkirk.com, the code is{" "}
                <strong style={{ color: "var(--text-primary)" }}>INF-PLAYBOOK</strong>; Selkirk paddles sold via
                Locker Room Pickleball use <strong style={{ color: "var(--text-primary)" }}>PLAYBOOK</strong>. Every
                other brand also uses <strong style={{ color: "var(--text-primary)" }}>PLAYBOOK</strong>.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/discounts"
                className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-[1.02]"
                style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-primary)" }}
              >
                Shop by brand
              </Link>
              <Link
                href="/paddles"
                className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
                style={{ background: "#0a64bc" }}
              >
                Browse all paddles <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
