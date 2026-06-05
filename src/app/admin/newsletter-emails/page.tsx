import { Download, Users, Mail, CheckCircle2 } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * /admin/newsletter-emails
 * ------------------------
 * Admin-gated by the shorts_auth cookie (see src/middleware.ts).
 * Shows a count of opted-in profiles + a Download CSV button that hits
 * the sibling API route.
 *
 * Service-role read happens server-side so we can show the numbers
 * without exposing the underlying query to the client.
 */
export default async function NewsletterEmailsAdminPage() {
  let total = 0;
  let confirmed = 0;
  let unconfirmed = 0;
  let loadError: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("newsletter_subscribed_at")
      .eq("newsletter_opt_in", true);

    if (error) {
      loadError = error.message;
    } else {
      total = data?.length ?? 0;
      confirmed = data?.filter((p) => p.newsletter_subscribed_at).length ?? 0;
      unconfirmed = total - confirmed;
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to read profiles.";
  }

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-10 max-w-2xl mx-auto">

        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
          Admin · Newsletter
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
          Newsletter sign-ups
        </h1>
        <p className="text-sm md:text-base mb-8" style={{ color: "var(--text-muted)" }}>
          Every user who opted in at sign-up. Download the CSV and upload to Substack monthly
          (Substack Dashboard → Subscribers → Import → Paste/Upload).
        </p>

        {loadError ? (
          <div
            className="rounded-2xl px-5 py-4 mb-6 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}
          >
            {loadError}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-2xl p-5" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
                <Users className="w-4 h-4 mb-2" style={{ color: "#14b8a6" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                  Total opted-in
                </p>
                <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{total}</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
                <CheckCircle2 className="w-4 h-4 mb-2" style={{ color: "#22c55e" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                  Already confirmed
                </p>
                <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{confirmed}</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
                <Mail className="w-4 h-4 mb-2" style={{ color: "#f59e0b" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                  Awaiting import
                </p>
                <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{unconfirmed}</p>
              </div>
            </div>

            <a
              href="/api/admin/newsletter-emails"
              className="inline-flex items-center gap-2 font-bold text-sm py-3 px-6 rounded-xl transition-all active:scale-[0.98]"
              style={{ background: "var(--btn-buy-bg)", color: "var(--btn-buy-text)", boxShadow: "var(--btn-buy-shadow)" }}
            >
              <Download className="w-4 h-4" />
              Download CSV ({total} rows)
            </a>

            <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
              File format: <code>email,opted_in_at,confirmed_subscribed</code>. Substack&apos;s import
              accepts the email column; the other columns are for your own tracking.
            </p>
          </>
        )}

      </div>
    </div>
  );
}
