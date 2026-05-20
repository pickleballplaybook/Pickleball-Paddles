import { paddles, getJustAdded, getLatestPaddles, reviewDates } from "@/data/paddles";
import { gearProducts } from "@/data/products";
import { getReviewGroups } from "@/lib/youtube";
import { siteConfig } from "@/config/site";
import { getPaddleCountLabel } from "@/lib/catalogStats";
import { Paddle, ReviewGroup } from "@/types";
import { Smartphone, GraduationCap } from "lucide-react";

import Hero           from "@/components/Hero";
import LatestPaddles  from "@/components/LatestPaddles";
import Link           from "next/link";
import HottestPaddle  from "@/components/HottestPaddle";
import TrendingSection from "@/components/TrendingSection";
import LatestReviews  from "@/components/LatestReviews";
import WhatsNew, { AnnouncementItem } from "@/components/WhatsNew";
import PromoBar       from "@/components/PromoBar";
import GearScroll        from "@/components/GearScroll";
import NewsletterSignup  from "@/components/NewsletterSignup";

import { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pickleball Playbook — Best Paddle Reviews, Specs & Discount Codes (2026)",
  description:
    "Independent pickleball paddle reviews with lab-measured specs — swing weight, twist weight, and static weight on every paddle. Compare 100+ paddles, watch video reviews, and save with exclusive discount codes. Updated weekly.",
  alternates: { canonical: siteConfig.siteUrl },
  openGraph: {
    title: "Pickleball Playbook — Best Paddle Reviews & Discount Codes",
    description: "100+ paddles tested on court. Lab-measured specs, video reviews, and exclusive discount codes. Find your perfect paddle.",
    url: siteConfig.siteUrl,
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pickleball Playbook — Paddle Reviews & Deals",
    description: "100+ paddles tested. Lab-measured specs. Exclusive discount codes.",
  },
};

// ── Seeded daily shuffle ───────────────────────────────────────────────────────
// Seeded shuffle keyed to the current UTC hour — changes every hour.
// All pages (homepage, reviews, paddles) use the same seed so the full
// product list is shuffled identically, then each page draws from a
// non-overlapping slice: homepage [0,1,2], reviews [3,4], paddles [5,6].
// This guarantees no duplicate product ever appears across pages simultaneously.
function hourSeededShuffle<T>(arr: T[]): T[] {
  const seed = Math.floor(Date.now() / 3600000);
  const out = [...arr];
  let s = seed | 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 13), 0x8d7ea0c3);
    const j = (s >>> 0) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function seriesKey(g: ReviewGroup): string {
  const first = (g.paddles[0]?.name ?? "").trim().split(/\s+/).find((w) => w.length > 2) ?? g.brand;
  return `${g.brand}:${first}`;
}

function spreadGroups(items: ReviewGroup[], count: number): ReviewGroup[] {
  const result: ReviewGroup[] = [];
  const pool = [...items];
  while (result.length < count && pool.length > 0) {
    const lastKey = result.length > 0 ? seriesKey(result[result.length - 1]) : null;
    const idx = pool.findIndex((g) => seriesKey(g) !== lastKey);
    result.push(...pool.splice(idx >= 0 ? idx : 0, 1));
  }
  return result;
}

function computeAnnouncements(allPaddles: Paddle[], groups: ReviewGroup[]): AnnouncementItem[] {
  const now = Date.now();
  const daysSince = (d: string) => (now - new Date(d).getTime()) / 86400000;
  const lookup = (slug: string) => allPaddles.find((p) => p.slug === slug);
  const items: AnnouncementItem[] = [];

  // Latest Review — always show the most recent with a date
  const latestGroup = groups.find((g) => g.reviewDate);
  if (latestGroup) {
    items.push({
      tag: "Latest Review",
      title: latestGroup.title,
      desc: "Watch the full on-court breakdown.",
      href: `/paddles/${latestGroup.primarySlug}`,
    });
  }

  // New Arrival — most recently added paddle within 45 days
  const newestPaddle = [...allPaddles].sort((a, b) => b.addedAt.localeCompare(a.addedAt))[0];
  if (newestPaddle && daysSince(newestPaddle.addedAt) <= 45) {
    const discount =
      newestPaddle.amountOff && newestPaddle.amountOff !== "$0" && newestPaddle.amountOff !== ""
        ? newestPaddle.amountOff
        : null;
    items.push({
      tag: "New Arrival",
      title: `${newestPaddle.brand} ${newestPaddle.name} is live`,
      desc: discount ? `${discount} off with code PLAYBOOK.` : "Check out the latest specs.",
      href: `/paddles/${newestPaddle.slug}`,
    });
  }

  // Deal Alert — discounted paddle from a review within 60 days
  let dealPaddle: Paddle | undefined;
  for (const g of groups) {
    if (!g.reviewDate || daysSince(g.reviewDate) > 60) continue;
    for (const { slug } of g.paddles) {
      const p = lookup(slug);
      if (p?.amountOff && p.amountOff !== "$0" && p.amountOff !== "") {
        dealPaddle = p;
        break;
      }
    }
    if (dealPaddle) break;
  }
  if (dealPaddle) {
    items.push({
      tag: "Deal Alert",
      title: `${dealPaddle.brand} ${dealPaddle.name} — ${dealPaddle.amountOff} off`,
      desc: "Limited-time discount. Use code PLAYBOOK at checkout.",
      href: `/paddles/${dealPaddle.slug}`,
    });
  }

  return items;
}

export default async function HomePage() {
  const justAdded = getJustAdded(siteConfig.justAddedCount);
  const latestPaddles = getLatestPaddles(12);
  const allGroups = await getReviewGroups(paddles, reviewDates);
  const latestReviewItems = spreadGroups(allGroups, siteConfig.latestReviewsCount);
  const announcements = computeAnnouncements(paddles, allGroups);

  // Pick 3 distinct products from the full gear pool, changing each day
  const [promoA, promoB, promoC] = hourSeededShuffle(gearProducts);

  return (
    <>
      <Hero />

      <div id="latest-reviews">
        <LatestReviews
          items={latestReviewItems}
          featuredVideo={{
            videoId: "kOONExGr-s0",
            title: "Best Pickleball Paddle of 2026",
            href: "/best-pickleball-paddles",
          }}
        />
      </div>

      <TrendingSection paddles={paddles} />

      <div id="paddles"><HottestPaddle /></div>

      <LatestPaddles paddles={latestPaddles} />

      {/* Drills App */}
      <PromoBar
        title="Pickleball Drills App"
        subtitle="Start your free trial."
        ctaText="Try It Free"
        ctaHref="https://onelink.to/cyrk57"
        icon={<Smartphone className="w-5 h-5" strokeWidth={2} />}
        bg="#0c1a2e"
      />

      <GearScroll />

      {/* Rotating gear promo A */}
      <PromoBar
        title={`${promoA.brand} ${promoA.name}`}
        subtitle={promoA.subtitle}
        ctaText={promoA.ctaText}
        ctaHref={promoA.link}
        image={promoA.image || undefined}
        imageAlt={`${promoA.brand} ${promoA.name}`}
        badge={promoA.badge || undefined}
        icon={!promoA.image ? <GraduationCap className="w-5 h-5" strokeWidth={2} /> : undefined}
        bg={promoA.bg}
      />

      {/* Best Paddles 2026 banner */}
      <section className="container-xl py-6">
        <Link
          href="/best-pickleball-paddles"
          className="group flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl px-8 py-6 transition-all duration-200 hover:scale-[1.01]"
          style={{
            background: "linear-gradient(135deg, rgba(13,148,136,0.18) 0%, rgba(4,10,20,0.6) 100%)",
            border: "1px solid rgba(20,184,166,0.3)",
            boxShadow: "0 0 40px rgba(20,184,166,0.08)",
          }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#14b8a6" }}>
              Updated May 2026
            </p>
            <p className="text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
              Best Pickleball Paddles of 2026 — Tested &amp; Ranked
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {getPaddleCountLabel()} paddles tested. 6 categories. Every pick is unsponsored.
            </p>
          </div>
          <span
            className="flex-shrink-0 inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all duration-200 group-hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)", boxShadow: "0 0 24px rgba(20,184,166,0.35)" }}
          >
            See the List
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </Link>
      </section>

      {/* Rotating gear promo B */}
      <PromoBar
        title={`${promoB.brand} ${promoB.name}`}
        subtitle={promoB.subtitle}
        ctaText={promoB.ctaText}
        ctaHref={promoB.link}
        image={promoB.image || undefined}
        imageAlt={`${promoB.brand} ${promoB.name}`}
        badge={promoB.badge || undefined}
        icon={!promoB.image ? <GraduationCap className="w-5 h-5" strokeWidth={2} /> : undefined}
        bg={promoB.bg}
      />

      <WhatsNew announcements={announcements} justAdded={justAdded} />

      <NewsletterSignup />

      {/* Rotating gear promo C */}
      <PromoBar
        title={`${promoC.brand} ${promoC.name}`}
        subtitle={promoC.subtitle}
        ctaText={promoC.ctaText}
        ctaHref={promoC.link}
        image={promoC.image || undefined}
        imageAlt={`${promoC.brand} ${promoC.name}`}
        badge={promoC.badge || undefined}
        icon={!promoC.image ? <GraduationCap className="w-5 h-5" strokeWidth={2} /> : undefined}
        bg={promoC.bg}
      />
    </>
  );
}
