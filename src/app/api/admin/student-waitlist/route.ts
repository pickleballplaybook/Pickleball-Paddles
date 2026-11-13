import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("student_waitlist")
    .select("email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((r) => ({
    email: r.email,
    signed_up_at: r.created_at,
  }));

  const header = "email,signed_up_at\n";
  const csv = header + rows.map((r) => `${r.email},"${r.signed_up_at}"`).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="student-waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
