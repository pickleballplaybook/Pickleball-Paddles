import { paddles, getJustAdded, getLatestPaddles, reviewDates } from "@/data/paddles";
import { gearProducts } from "@/data/products";
import { getReviewGroups } from "@/lib/youtube";
import { siteConfig } from "@/config/site";
import { getPaddleCountLabel } from "@/lib/catalogStats";
import { Paddle, ReviewGroup } from "@/types";
import { Smartphone, GraduationCap, Play } from "lucide-react";

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

  // Per-video exclusions for the home page Latest Reviews surface only.
  // The /reviews page still shows everything. Used for older or off-brand
  // reviews we don't want eating a homepage slot.
  const HOME_REVIEWS_EXCLUDE = new Set<string>([
    "gbTkuJsu_08",  // Paddletek Honeyfoam — older review, intentionally off home
  ]);
  const homeEligible = allGroups.filter((g) => !HOME_REVIEWS_EXCLUDE.has(g.videoId));
  const latestReviewItems = spreadGroups(homeEligible, siteConfig.latestReviewsCount);
  const announcements = computeAnnouncements(paddles, allGroups);

  // Pick 3 distinct products from the full gear pool, changing each day
  const [promoA, promoB, promoC] = hourSeededShuffle(gearProducts);

  return (
    <>
      <Hero />

      <div id="paddles"><HottestPaddle /></div>

      <div id="latest-reviews">
        <LatestReviews items={latestReviewItems} />
      </div>

      <TrendingSection paddles={paddles} />

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

      {/* Rotating gear promo A — prefer wide featuredImage for banner format */}
      <PromoBar
        title={`${promoA.brand} ${promoA.name}`}
        subtitle={promoA.subtitle}
        ctaText={promoA.ctaText}
        ctaHref={promoA.link}
        image={promoA.featuredImage || promoA.image || undefined}
        imageAlt={`${promoA.brand} ${promoA.name}`}
        badge={promoA.badge || undefined}
        icon={!promoA.image ? <GraduationCap className="w-5 h-5" strokeWidth={2} /> : undefined}
        bg={promoA.bg}
      />

      {/* Best Paddles 2026 banner — video-led hero. Took over the slot
          previously held by LatestReviews' featuredVideo prop; same
          destination, so we consolidate instead of duplicating across
          two surfaces. */}
      <section className="container-xl py-6">
        <Link
          href="/best-pickleball-paddles"
          className="group grid grid-cols-1 sm:grid-cols-5 items-center gap-6 rounded-3xl p-6 transition-all duration-200 hover:scale-[1.01]"
          style={{
            background: "linear-gradient(135deg, rgba(17, 41, 95,0.18) 0%, rgba(4,10,20,0.6) 100%)",
            border: "1px solid rgba(10, 100, 188,0.3)",
            boxShadow: "0 0 40px rgba(10, 100, 188,0.28)",
          }}
        >
          <div
            className="relative sm:col-span-2 aspect-video overflow-hidden rounded-2xl"
            style={{ background: "var(--bg-alt)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://img.youtube.com/vi/kOONExGr-s0/maxresdefault.jpg"
              alt="Best Pickleball Paddle of 2026 — full video buyer's guide"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110">
                <Play className="w-5 h-5 text-slate-900 ml-0.5" strokeWidth={0} fill="currentColor" />
              </div>
            </div>
          </div>

          <div className="sm:col-span-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#60a5fa" }}>
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
              style={{ background: "linear-gradient(135deg, #11295f, #0a64bc)", boxShadow: "0 0 24px rgba(10, 100, 188,0.35)" }}
            >
              See the List
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </div>
        </Link>
      </section>

      {/* Rotating gear promo B — prefer wide featuredImage for banner format */}
      <PromoBar
        title={`${promoB.brand} ${promoB.name}`}
        subtitle={promoB.subtitle}
        ctaText={promoB.ctaText}
        ctaHref={promoB.link}
        image={promoB.featuredImage || promoB.image || undefined}
        imageAlt={`${promoB.brand} ${promoB.name}`}
        badge={promoB.badge || undefined}
        icon={!promoB.image ? <GraduationCap className="w-5 h-5" strokeWidth={2} /> : undefined}
        bg={promoB.bg}
      />

      <WhatsNew announcements={announcements} justAdded={justAdded} />

      <NewsletterSignup />

      {/* Rotating gear promo C — prefer wide featuredImage for banner format */}
      <PromoBar
        title={`${promoC.brand} ${promoC.name}`}
        subtitle={promoC.subtitle}
        ctaText={promoC.ctaText}
        ctaHref={promoC.link}
        image={promoC.featuredImage || promoC.image || undefined}
        imageAlt={`${promoC.brand} ${promoC.name}`}
        badge={promoC.badge || undefined}
        icon={!promoC.image ? <GraduationCap className="w-5 h-5" strokeWidth={2} /> : undefined}
        bg={promoC.bg}
      />
    </>
  );
}
