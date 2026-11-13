import { MetadataRoute } from "next";
import { paddles } from "@/data/paddles";
import { blogPosts } from "@/data/blogPosts";
import { brands } from "@/data/brands";
import { guides } from "@/data/guides";
import { gearProducts } from "@/data/products";
import { siteConfig } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Fetch weekly ranking dates from Supabase ─────────────────────────────
  let latestWeekDate: Date | null = null;
  let weeklyPages: MetadataRoute.Sitemap = [];

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("weekly_rankings")
      .select("week_date")
      .order("week_date", { ascending: false });

    if (data && data.length > 0) {
      const uniqueWeeks = Array.from(new Set(data.map((d) => d.week_date)));
      latestWeekDate = new Date(uniqueWeeks[0] + "T12:00:00Z");

      weeklyPages = uniqueWeeks.map((date) => ({
        url: `${siteConfig.siteUrl}/best-pickleball-paddles/weekly/${date}`,
        lastModified: new Date(date + "T12:00:00Z"),
        changeFrequency: "weekly" as const,
        priority: 0.85,
      }));
    }
  } catch {
    // Supabase not available at build time — skip weekly pages
  }

  // Use latest weekly ranking date for best-paddles pages, fallback to now
  const bestPaddlesLastMod = latestWeekDate ?? now;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteConfig.siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.siteUrl}/paddles`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles`, lastModified: bestPaddlesLastMod, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/spin`, lastModified: bestPaddlesLastMod, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/power`, lastModified: bestPaddlesLastMod, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/control`, lastModified: bestPaddlesLastMod, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/under-125`, lastModified: bestPaddlesLastMod, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/under-200`, lastModified: bestPaddlesLastMod, changeFrequency: "weekly", priority: 0.85 },
    // Real 200 page now (was a redirect). lastmod tracks the latest week_date;
    // priority raised to 0.9 — it's a primary, frequently-refreshed landing page.
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/weekly`, lastModified: bestPaddlesLastMod, changeFrequency: "weekly", priority: 0.9 },
    // Audience pillar pages — long-tail intent magnets.
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-beginners`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-intermediate`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-tennis-players`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-women`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-elbow-pain`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-seniors`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-3.0-players`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-3.5-players`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-4.0-players`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-5.0-players`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-advanced-players`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-recreational-players`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-doubles`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-singles`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-bangers`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-kitchen-game`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-two-handed-backhand`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-outdoor-play`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/lightweight`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/most-forgiving`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/under-100`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/thermoformed`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/raw-carbon-fiber`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-4.5-players`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-spin-players`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-competitive-players`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/foam-core`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/for-lefties`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    // Best-brand pillar pages — target "best [brand] pickleball paddle" searches.
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/best-selkirk-paddles`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/best-joola-paddles`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/best-bread-and-butter-paddles`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/best-luzz-paddles`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/best-gearbox-paddles`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/best-11six24-paddles`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/best-enhance-paddles`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/best-honolulu-paddles`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    // Spec-driven collection pages — programmatic SEO targeting shape, core
    // thickness, budget tier, and play style. All ranked from real catalog
    // data; refresh as catalog changes.
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/widebody`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/elongated`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/hybrid`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/16mm`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/14mm`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/13mm`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/under-150`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/best-pickleball-paddles/all-court`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.siteUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    // Topical pillar page for the keyword "pickleball drills". Highest-priority
    // SEO asset on the site — hub/spoke structure with the 10 guide blog posts
    // as spokes. Daily change frequency because it should be re-crawled often.
    { url: `${siteConfig.siteUrl}/pickleball-drills`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${siteConfig.siteUrl}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteConfig.siteUrl}/series`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteConfig.siteUrl}/gear`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteConfig.siteUrl}/trending`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteConfig.siteUrl}/discounts`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/discount-codes`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/newsletter`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteConfig.siteUrl}/pickleball-drills-reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${siteConfig.siteUrl}/brands`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    // Trust / E-E-A-T pages — referenced from JSON-LD author and editorial
    // schemas, so they need to be crawlable for Google to associate authorship
    // and methodology with every review on the site.
    { url: `${siteConfig.siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteConfig.siteUrl}/how-we-test`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  // All paddle pages
  const paddlePages: MetadataRoute.Sitemap = paddles.map((p) => ({
    url: `${siteConfig.siteUrl}/paddles/${p.slug}`,
    lastModified: new Date(p.addedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // All gear product detail pages — each is a long-form, SEO-rich page
  // targeting product-name + "review" queries.
  const gearPages: MetadataRoute.Sitemap = gearProducts.map((g) => ({
    url: `${siteConfig.siteUrl}/gear/${g.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  // All blog posts
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteConfig.siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishDate),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Series pages (deduplicated)
  const seriesSlugs = Array.from(new Set(paddles.map((p) => p.seriesSlug).filter(Boolean)));
  const seriesPages: MetadataRoute.Sitemap = seriesSlugs.map((slug) => ({
    url: `${siteConfig.siteUrl}/series/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Brand pages
  const brandPages: MetadataRoute.Sitemap = brands.map((b) => ({
    url: `${siteConfig.siteUrl}/brands/${b.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  // Programmatic head-to-head comparison pages — shares the exact same builder
  // as /compare/[matchup]/generateStaticParams so sitemap stays in sync.
  const { buildStaticMatchups } = await import("./compare/[matchup]/helpers");
  const comparePages: MetadataRoute.Sitemap = buildStaticMatchups().map((matchup) => ({
    url: `${siteConfig.siteUrl}/compare/${matchup}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Brand vs Brand comparison pages
  const { buildBrandMatchups } = await import("./compare-brands/[matchup]/helpers");
  const brandMatchupPages: MetadataRoute.Sitemap = [
    { url: `${siteConfig.siteUrl}/compare-brands`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.75 },
    ...buildBrandMatchups().map((matchup) => ({
      url: `${siteConfig.siteUrl}/compare-brands/${matchup}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.72,
    })),
  ];

  // Paddle alternatives pages — one per active (non-discontinued) paddle.
  const alternativesPages: MetadataRoute.Sitemap = paddles
    .filter((p) => !p.discontinued)
    .map((p) => ({
      url: `${siteConfig.siteUrl}/paddles/${p.slug}/alternatives`,
      lastModified: new Date(p.addedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    }));

  // Guides hub + every individual guide page. Priority 0.8 — these are
  // dedicated informational pages targeting evergreen Google queries; we
  // want them crawled as eagerly as our paddle pages.
  const guidesHub: MetadataRoute.Sitemap = [
    { url: `${siteConfig.siteUrl}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
  ];
  const guidePages: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${siteConfig.siteUrl}/guides/${g.slug}`,
    lastModified: new Date(g.updatedDate ?? g.publishDate),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    ...staticPages,
    ...paddlePages,
    ...alternativesPages,
    ...brandMatchupPages,
    ...gearPages,
    ...blogPages,
    ...seriesPages,
    ...brandPages,
    ...weeklyPages,
    ...comparePages,
    ...guidesHub,
    ...guidePages,
  ];
}
