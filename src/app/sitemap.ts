import { MetadataRoute } from "next";
import { paddles } from "@/data/paddles";
import { blogPosts } from "@/data/blogPosts";
import { brands } from "@/data/brands";
import { guides } from "@/data/guides";
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
    { url: `${siteConfig.siteUrl}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteConfig.siteUrl}/series`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteConfig.siteUrl}/gear`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteConfig.siteUrl}/trending`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteConfig.siteUrl}/discounts`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/discount-codes`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteConfig.siteUrl}/newsletter`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
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
    ...blogPages,
    ...seriesPages,
    ...brandPages,
    ...weeklyPages,
    ...comparePages,
    ...guidesHub,
    ...guidePages,
  ];
}
