export type Platform = "instagram" | "facebook" | "youtube";

export type Campaign = {
  id: string;
  name: string;
  keywords: string[];
  platforms: Platform[];
  target_mode: "all" | "specific";
  target_post_ids: string[];
  reply_text: string;
  dm_text: string | null;
  cta_link: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  match_once_per_user: boolean;
  created_at: string;
  // mock-only stats for the card
  triggers_count?: number;
  last_triggered_at?: string | null;
};

export type SocialConnection = {
  id: string;
  platform: Platform;
  account_name: string;
  is_active: boolean;
  connected_at: string;
};
