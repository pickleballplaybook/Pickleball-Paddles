import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface PaddleHeart {
  paddle_id:  string;
  user_key:   string;
  created_at: string; // ISO timestamp
}
