import { notFound } from "next/navigation";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { generateNarrative, formatWeekDate } from "@/lib/weeklyNarrative";
import WeeklyRankingsView from "../WeeklyRankingsView";
import { getWeeklyRankings, getAllWeekDates } from "../rankingsData";

export const revalidate = 3600;
export const dynamicParams = true;

interface Props {
  params: { date: string };
}

// ── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const weeks = await getAllWeekDates();
  return weeks.map((date) => ({ date }));
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rankings = await getWeeklyRankings(params.date);
  const dateFormatted = formatWeekDate(params.date);
  const topPaddle = rankings?.[0]?.paddle;
  const topName = topPaddle ? `${topPaddle.brand} ${topPaddle.name}` : "Top Paddles";
  const url = `${siteConfig.siteUrl}/best-pickleball-paddles/weekly/${params.date}`;

  const title = `Best Pickleball Paddles — ${dateFormatted} | ${topName} Takes #1`;
  const description = `This week's top 10 pickleball paddles ranked by community engagement. Updated ${dateFormatted}. See which paddles are trending, who moved up, and the best deals.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: params.date,
      siteName: siteConfig.name,
      ...(topPaddle?.image ? {
        images: [{ url: `${siteConfig.siteUrl}${topPaddle.image}`, alt: `${topName} pickleball paddle` }],
      } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `Best Pickleball Paddles — ${dateFormatted}`,
      description: `${topName} takes #1 this week. See the full top 10 rankings.`,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function WeeklyRankingPage({ params }: Props) {
  let rankings = null;
  try {
    rankings = await getWeeklyRankings(params.date);
  } catch {
    // Supabase error — fall through to notFound
  }
  if (!rankings || rankings.length === 0) notFound();

  const dateFormatted = formatWeekDate(params.date);
  const topPaddle = rankings[0].paddle;
  const narrative = generateNarrative(rankings);
  const url = `${siteConfig.siteUrl}/best-pickleball-paddles/weekly/${params.date}`;

  // JSON-LD schemas
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `Best Pickleball Paddles — ${dateFormatted} | ${topPaddle.brand} ${topPaddle.name} Takes #1`,
    "description": narrative,
    "datePublished": params.date,
    "dateModified": params.date,
    "author": { "@type": "Person", "name": "Austin Hardy", "url": siteConfig.siteUrl },
    "publisher": {
      "@type": "Organization",
      "name": "Pickleball Playbook",
      "url": siteConfig.siteUrl,
      "logo": { "@type": "ImageObject", "url": `${siteConfig.siteUrl}/images/Logo.svg` },
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
    "image": rankings
      .filter((r) => r.paddle.image)
      .map((r) => `${siteConfig.siteUrl}${r.paddle.image}`),
  };

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Best Pickleball Paddles — ${dateFormatted}`,
    "description": `Top 10 pickleball paddles ranked by community engagement for the week of ${dateFormatted}.`,
    "url": url,
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
        heading={`Best Pickleball Paddles — ${dateFormatted}`}
        subheading={`${topPaddle.brand} ${topPaddle.name} Takes #1`}
      />
    </>
  );
}
