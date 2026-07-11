import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type NewsletterPost = {
  slug: string;
  substack_url: string;
  title: string;
  excerpt: string | null;
  content_html: string;
  featured_image: string | null;
  published_at: string;
  category: string | null;
};

const SELECT = "slug, substack_url, title, excerpt, content_html, featured_image, published_at, category";

/**
 * Newsletter posts, newest first. Optional category filter. Read from
 * Supabase — mirrored from Substack RSS by the sync-substack cron.
 */
export async function listNewsletterPosts(
  limit = 50,
  category?: string | null,
): Promise<NewsletterPost[]> {
  const supabase = getSupabaseAdmin();
  let q = supabase
    .from("newsletter_posts")
    .select(SELECT)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) {
    console.error("[newsletterPosts.list]", error.message);
    return [];
  }
  return (data ?? []) as NewsletterPost[];
}

export async function getNewsletterPost(slug: string): Promise<NewsletterPost | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("newsletter_posts")
    .select(SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[newsletterPosts.get]", error.message);
    return null;
  }
  return data as NewsletterPost | null;
}
