import { MetadataRoute } from "next";
import { paddles } from "@/data/paddles";
import { blogPosts } from "@/data/blogPosts";
import { brands } from "@/data/brands";
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

  return [...staticPages, ...paddlePages, ...blogPages, ...seriesPages, ...brandPages, ...weeklyPages];
}
