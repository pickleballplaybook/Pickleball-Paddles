import { Download, Users } from "lucide-react";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { DeleteButton } from "../_components/DeleteButton";

export const dynamic = "force-dynamic";

async function deleteStudentSignup(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const supabase = getSupabaseAdmin();
  await supabase.from("student_waitlist").delete().eq("id", id);
  revalidatePath("/admin/student-waitlist");
}

export default async function StudentWaitlistAdminPage() {
  let rows: { id: number; email: string; created_at: string }[] = [];
  let loadError: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("student_waitlist")
      .select("id, email, created_at")
      .order("created_at", { ascending: false });

    if (error) loadError = error.message;
    else rows = data ?? [];
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load.";
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-page)", paddingTop: "calc(var(--topbar-h, 108px) + 1rem)" }}>
      <div className="container-xl py-10 max-w-3xl mx-auto">

        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
          Admin · Waitlists
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
          Student Waitlist
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Students who signed up at playbookpaddles.com/student
        </p>

        <div className="flex items-center gap-4 mb-8">
          <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
            <Users className="w-5 h-5" style={{ color: "#60a5fa" }} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Total signups</p>
              <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{rows.length}</p>
            </div>
          </div>

          <a
            href="/api/admin/student-waitlist"
            className="inline-flex items-center gap-2 font-bold text-sm py-3 px-5 rounded-xl transition-all active:scale-[0.98]"
            style={{ background: "var(--btn-buy-bg)", color: "var(--btn-buy-text)", boxShadow: "var(--btn-buy-shadow)" }}
          >
            <Download className="w-4 h-4" />
            Download CSV
          </a>
        </div>

        {loadError ? (
          <div className="rounded-2xl px-5 py-4 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}>
            {loadError}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No signups yet.</p>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--flip-card-border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--flip-bg-card)", borderBottom: "1px solid var(--flip-card-border)" }}>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Email</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Signed Up</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      background: i % 2 === 0 ? "var(--bg-page)" : "var(--flip-bg-card)",
                      borderBottom: "1px solid var(--flip-card-border)",
                    }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{r.email}</td>
                    <td className="px-5 py-3 tabular-nums text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(r.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Denver" })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DeleteButton action={deleteStudentSignup} id={r.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8">
          <a href="/admin/coach-waitlist" className="text-sm font-semibold" style={{ color: "#60a5fa" }}>
            → View Coach Waitlist
          </a>
        </div>

      </div>
    </div>
  );
}
