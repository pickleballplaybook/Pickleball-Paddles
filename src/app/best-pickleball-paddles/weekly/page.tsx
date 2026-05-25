import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { generateNarrative, formatWeekDate } from "@/lib/weeklyNarrative";
import WeeklyRankingsView from "./WeeklyRankingsView";
import { getLatestWeek } from "./rankingsData";

// ISR: regenerate hourly. The Monday cron also revalidatePath()s this route on
// each fresh snapshot, so new rankings appear without waiting for the window.
export const revalidate = 3600;

const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/weekly`;

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const latest = await getLatestWeek();
  const monthYear = (latest ? new Date(latest.weekDate + "T12:00:00Z") : new Date())
    .toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const topPaddle = latest?.rankings[0]?.paddle;

  const title = `This Week's Top 10 Pickleball Paddles — Updated ${monthYear}`;
  const description =
    "A data-driven ranking of the top 10 pickleball paddles, refreshed every Monday based on the last 7 days of real player engagement — hearts, ratings, and page views. See who's trending right now.";

  return {
    title,
    description,
    // Self-canonical: this page is the canonical "current rankings" URL, NOT the
    // dated archive snapshot at /weekly/[date].
    alternates: { canonical: PAGE_URL },
    openGraph: {
      title,
      description,
      url: PAGE_URL,
      type: "website",
      siteName: siteConfig.name,
      ...(topPaddle?.image ? {
        images: [{ url: `${siteConfig.siteUrl}${topPaddle.image}`, alt: `${topPaddle.brand} ${topPaddle.name} pickleball paddle` }],
      } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: "This Week's Top 10 Pickleball Paddles",
      description: "Updated every Monday, ranked by the last 7 days of player engagement.",
    },
  };
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl">
        <Link
          href="/best-pickleball-paddles"
          className="inline-flex items-center gap-1 text-sm font-semibold mb-4 transition-colors hover:text-brand-400"
          style={{ color: "#2dd4bf" }}
        >
          &larr; Best Paddles
        </Link>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
          Weekly Rankings
        </p>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
          This Week&apos;s Rankings
        </h1>
        <div
          className="rounded-2xl p-8 mt-6 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-base mb-6" style={{ color: "var(--text-muted)" }}>
            Rankings update every Monday — check back soon.
          </p>
          <Link
            href="/best-pickleball-paddles"
            className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
            style={{ background: "#14b8a6" }}
          >
            Browse Editor&apos;s Picks <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function WeeklyLatestPage() {
  const latest = await getLatestWeek();

  // No data yet — render an empty state, never redirect (avoids the GSC error).
  if (!latest || latest.rankings.length === 0) {
    return <EmptyState />;
  }

  const { weekDate, rankings } = latest;
  const dateFormatted = formatWeekDate(weekDate);
  const narrative = generateNarrative(rankings);

  // JSON-LD — same structure as /weekly/[date] but @id points at /weekly.
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `This Week's Top 10 Pickleball Paddles — Week of ${dateFormatted}`,
    "description": narrative,
    "datePublished": weekDate,
    "dateModified": weekDate,
    "author": { "@type": "Person", "name": "Austin Hardy", "url": siteConfig.siteUrl },
    "publisher": {
      "@type": "Organization",
      "name": "Pickleball Playbook",
      "url": siteConfig.siteUrl,
      "logo": { "@type": "ImageObject", "url": `${siteConfig.siteUrl}/images/Logo.svg` },
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": PAGE_URL },
    "image": rankings
      .filter((r) => r.paddle.image)
      .map((r) => `${siteConfig.siteUrl}${r.paddle.image}`),
  };

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `This Week's Top 10 Pickleball Paddles — Week of ${dateFormatted}`,
    "description": `The top 10 pickleball paddles ranked by the last 7 days of community engagement, updated weekly.`,
    "url": PAGE_URL,
    "numberOfItems": rankings.length,
    "itemListElement": rankings.map((r) => ({
      "@type": "ListItem",
      "position": r.rank,
      "name": `${r.paddle.brand} ${r.paddle.name}`,
      "url": `${siteConfig.siteUrl}/paddles/${r.paddle.slug}`,
      "image": r.paddle.image ? `${siteConfig.siteUrl}${r.paddle.image}` : undefined,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }} />

      <WeeklyRankingsView
        rankings={rankings}
        heading={`This Week's Rankings — Week of ${dateFormatted}`}
        subheading="Updated weekly"
      />
    </>
  );
}
