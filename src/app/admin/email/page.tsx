import { Download, Users, Mail, AlertTriangle } from "lucide-react";
import { AdminNav } from "../_components/AdminNav";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /admin/email
 * ------------
 * Admin-gated by the shorts_auth cookie (see src/middleware.ts).
 *
 * Phase 1: trial signup list + CSV export. The trial-drip schedule
 * (Day 0/1/3/5/6) is sent from functions/trial_emails.js based on the
 * `trialStartAt` field on each Firestore user doc; this page is the
 * marketing-list copy that Austin exports.
 *
 * Phase 2 (todo): FAQ auto-reply tab (Gmail watcher for austin@pbdrills.com)
 * and a drip-log viewer showing each (user, day, sent/skipped) record.
 */
type Row = {
  email: string;
  source: string;
  trial_start_at: string;
  unsubscribed_at: string | null;
  bounced_at: string | null;
};

export default async function EmailAdminPage() {
  let rows: Row[] = [];
  let loadError: string | null = null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("trial_signups")
      .select("email, source, trial_start_at, unsubscribed_at, bounced_at")
      .order("trial_start_at", { ascending: false })
      .limit(500);

    if (error) loadError = error.message;
    else rows = (data ?? []) as Row[];
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to read trial_signups.";
  }

  const total = rows.length;
  const unsubscribed = rows.filter((r) => r.unsubscribed_at).length;
  const bounced = rows.filter((r) => r.bounced_at).length;

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-10 max-w-5xl mx-auto">
        <AdminNav />

        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
          Admin · Email
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
          Trial signups
        </h1>
        <p className="text-sm md:text-base mb-8" style={{ color: "var(--text-muted)" }}>
          Every email captured on the Pickleball Drills onboarding screen. The Day 0/1/3/5/6 drip
          fires from Firebase Functions; this list is for exporting to your marketing-email list.
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
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Total signups</p>
                <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{total}</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
                <Mail className="w-4 h-4 mb-2" style={{ color: "#f59e0b" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Unsubscribed</p>
                <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{unsubscribed}</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
                <AlertTriangle className="w-4 h-4 mb-2" style={{ color: "#ef4444" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Bounced</p>
                <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{bounced}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <a
                href="/api/admin/email/export"
                className="inline-flex items-center gap-2 font-bold text-sm py-3 px-6 rounded-xl transition-all active:scale-[0.98]"
                style={{ background: "var(--btn-buy-bg)", color: "var(--btn-buy-text)", boxShadow: "var(--btn-buy-shadow)" }}
              >
                <Download className="w-4 h-4" />
                Download CSV ({total} rows)
              </a>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Columns: <code>email, source, trial_start_at, flutter_user_id, unsubscribed_at, bounced_at</code>
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--flip-card-border)" }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Email</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Source</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Trial start</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center" style={{ color: "var(--text-muted)" }}>
                        No trial signups yet.
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.email} style={{ borderTop: "1px solid var(--flip-card-border)" }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>{r.email}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{r.source}</td>
                      <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {r.trial_start_at ? new Date(r.trial_start_at).toLocaleDateString() : ""}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {r.bounced_at ? (
                          <span style={{ color: "#ef4444" }}>bounced</span>
                        ) : r.unsubscribed_at ? (
                          <span style={{ color: "#f59e0b" }}>unsub</span>
                        ) : (
                          <span style={{ color: "#22c55e" }}>active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length === 500 && (
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                Showing 500 most-recent rows. The CSV export contains all rows.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
