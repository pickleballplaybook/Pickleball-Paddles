import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 3600;

export default async function WeeklyLatestPage() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("weekly_rankings")
      .select("week_date")
      .order("week_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.week_date) {
      redirect(`/best-pickleball-paddles/weekly/${data.week_date}`);
    }
  } catch {
    // Supabase not available or table doesn't exist yet
  }

  redirect("/best-pickleball-paddles");
}
