import type { SupabaseClient } from "@supabase/supabase-js";

export type ConnectionRow = {
  id: string;
  platform: "instagram" | "facebook" | "youtube";
  account_id: string;
  account_name: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  page_id: string | null;
  metadata: Record<string, any>;
  is_active: boolean;
};

/**
 * Look up the active connection for a given platform.
 * For now: assumes ONE account per platform (single-tenant - just you).
 * If we later sell this to other creators, this becomes multi-tenant.
 */
export async function getConnection(
  supabase: SupabaseClient,
  platform: "instagram" | "facebook" | "youtube"
): Promise<ConnectionRow | null> {
  const { data, error } = await supabase
    .from("social_connections")
    .select("*")
    .eq("platform", platform)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error(`[connections] failed to load ${platform}:`, error);
    return null;
  }
  return (data?.[0] as ConnectionRow) || null;
}
