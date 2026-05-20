import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUp, ArrowDown, Heart, Star, Eye, ExternalLink } from "lucide-react";
import { getPaddleBySlug } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateNarrative, formatWeekDate, RankedPaddle } from "@/lib/weeklyNarrative";

export const revalidate = 3600;
export const dynamicParams = true;

interface Props {
  params: { date: string };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

// ── Data fetching ────────────────────────────────────────────────────────────

async function getWeeklyRankings(weekDate: string): Promise<RankedPaddle[] | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("weekly_rankings")
      .select("*")
      .eq("week_date", weekDate)
      .order("rank", { ascending: true });

    if (error || !data || data.length === 0) return null;

    return data.map((row) => {
      const paddle = getPaddleBySlug(row.paddle_slug);
      if (!paddle) return null;
      return {
        rank: row.rank,
        paddle,
        hearts: row.hearts,
        ratings: row.ratings,
        avgRating: row.avg_rating,
        views: row.views,
        composite: row.composite,
        prevRank: row.prev_rank,
      };
    }).filter(Boolean) as RankedPaddle[];
  } catch {
    return null;
  }
}

// ── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("weekly_rankings")
      .select("week_date")
      .order("week_date", { ascending: false });

    if (!data) return [];
    const weeks = Array.from(new Set(data.map((d) => d.week_date)));
    return weeks.map((date) => ({ date }));
  } catch {
    return [];
  }
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
  let rankings: RankedPaddle[] | null = null;
  try {
    rankings = await getWeeklyRankings(params.date);
  } catch {
    // Supabase error — fall through to notFound
  }
  if (!rankings || rankings.length === 0) notFound();

  const dateFormatted = formatWeekDate(params.date);
  const topPaddle = rankings[0].paddle;
  const narrative = generateNarrative(rankings);

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
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${siteConfig.siteUrl}/best-pickleball-paddles/weekly/${params.date}`,
    },
    "image": rankings
      .filter((r) => r.paddle.image)
      .map((r) => `${siteConfig.siteUrl}${r.paddle.image}`),
  };

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Best Pickleball Paddles — ${dateFormatted}`,
    "description": `Top 10 pickleball paddles ranked by community engagement for the week of ${dateFormatted}.`,
    "url": `${siteConfig.siteUrl}/best-pickleball-paddles/weekly/${params.date}`,
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

      <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
        <div className="container-xl">

          {/* ── Header ────────────────────────────────────────────────── */}
          <div className="mb-6">
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
            <h1
              className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Best Pickleball Paddles — {dateFormatted}
            </h1>
            <p className="text-lg font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
              {topPaddle.brand} {topPaddle.name} Takes #1
            </p>
          </div>

          {/* ── Paddle image strip (Google image carousel) ────────────── */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {rankings.map((r) => (
              <Link
                key={r.paddle.slug}
                href={`/paddles/${r.paddle.slug}`}
                className="flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center transition-transform hover:scale-105"
                style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {r.paddle.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.paddle.image}
                    alt={`#${r.rank} ${r.paddle.brand} ${r.paddle.name}`}
                    className="w-full h-full object-contain p-1.5"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* ── Narrative ─────────────────────────────────────────────── */}
          <div
            className="rounded-2xl p-6 mb-10"
            style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {narrative}
            </p>
          </div>

          {/* ── Rankings ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {rankings.map((r) => {
              const hasLink = !!r.paddle.discountLink?.trim();
              const code = getCode(r.paddle.brand, r.paddle.discountLink);
              const noDiscount = !r.paddle.amountOff || r.paddle.amountOff === "$0";
              const priceNum = r.paddle.price ? parseFloat(r.paddle.price.replace(/[^0-9.]/g, "")) : null;

              let movement: React.ReactNode = null;
              if (r.prevRank === null) {
                movement = (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-brand-500/20 text-brand-400">
                    New
                  </span>
                );
              } else if (r.prevRank > r.rank) {
                movement = (
                  <span className="flex items-center gap-0.5 text-xs font-bold text-green-400">
                    <ArrowUp className="w-3 h-3" /> {r.prevRank - r.rank}
                  </span>
                );
              } else if (r.prevRank < r.rank) {
                movement = (
                  <span className="flex items-center gap-0.5 text-xs font-bold text-red-400">
                    <ArrowDown className="w-3 h-3" /> {r.rank - r.prevRank}
                  </span>
                );
              } else {
                movement = (
                  <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>—</span>
                );
              }

              return (
                <div
                  key={r.paddle.slug}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Rank + image */}
                    <div className="flex items-center gap-4 p-5 sm:w-[35%]">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-extrabold"
                          style={{ background: r.rank === 1 ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.06)", color: r.rank === 1 ? "#2dd4bf" : "var(--text-muted)" }}
                        >
                          {r.rank}
                        </span>
                        {movement}
                      </div>
                      <Link
                        href={`/paddles/${r.paddle.slug}`}
                        className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        {r.paddle.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.paddle.image}
                            alt={`${r.paddle.brand} ${r.paddle.name}`}
                            className="w-full h-full object-contain p-1"
                          />
                        )}
                      </Link>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#14b8a6" }}>
                          {r.paddle.brand}
                        </p>
                        <Link href={`/paddles/${r.paddle.slug}`}>
                          <h2 className="text-base font-extrabold leading-tight hover:text-brand-400 transition-colors" style={{ color: "var(--text-primary)" }}>
                            {r.paddle.name}
                          </h2>
                        </Link>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {r.paddle.shape} · {r.paddle.thickness}
                        </p>
                      </div>
                    </div>

                    {/* Specs + engagement + CTA */}
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 pt-0 sm:pt-5">
                      {/* Specs */}
                      <div className="flex flex-wrap gap-1.5">
                        {r.paddle.weight && (
                          <span className="text-[11px] font-bold font-mono px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
                            {r.paddle.weight}
                          </span>
                        )}
                        {r.paddle.swingWeight > 0 && (
                          <span className="text-[11px] font-bold font-mono px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
                            SW {r.paddle.swingWeight}
                          </span>
                        )}
                        {r.paddle.twistWeight > 0 && (
                          <span className="text-[11px] font-bold font-mono px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
                            TW {r.paddle.twistWeight}
                          </span>
                        )}
                      </div>

                      {/* Engagement stats */}
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                          <Eye className="w-3 h-3" /> {r.views}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: "#f87171" }}>
                          <Heart className="w-3 h-3" fill="currentColor" /> {r.hearts}
                        </span>
                        {r.ratings > 0 && (
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: "#facc15" }}>
                            <Star className="w-3 h-3" fill="currentColor" strokeWidth={0} /> {r.avgRating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {/* Price + CTA */}
                      <div className="flex items-center gap-2 sm:ml-auto">
                        {priceNum && (
                          <span className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                            {r.paddle.price}
                          </span>
                        )}
                        {!noDiscount && (
                          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md" style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}>
                            {code}
                          </span>
                        )}
                        {hasLink && (
                          <a
                            href={r.paddle.discountLink}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:scale-105"
                            style={{ background: "#14b8a6" }}
                          >
                            Buy <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Footer CTA ────────────────────────────────────────────── */}
          <div className="mt-12 text-center">
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Rankings update every Monday based on community engagement.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/paddles"
                className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
                style={{ background: "#14b8a6" }}
              >
                Browse All Paddles <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/best-pickleball-paddles"
                className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-[1.02]"
                style={{ border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-primary)" }}
              >
                Editor&apos;s Picks
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
