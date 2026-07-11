import { NextRequest } from "next/server";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/admin/winback-diagnostic
 * ---------------------------------
 * Answers "is the admin Win-backs tab actually tracking?" without
 * requiring anyone to eyeball the tab. Returns three side-by-side counts:
 *
 *   - churn_email_log docs with sent=true (in last 30d)
 *     → what the "recipients per step" column reads from
 *   - churn+comeback patterns in subscription_mirror (in last 30d)
 *     → what "attributed winbacks" and "organic comebacks" read from
 *   - abandoned_email_log docs (paywall-abandonment drip, NOT churn)
 *     → parallel drip that fires for a different audience; conversions
 *       here show up in the Signups funnel (Captured → Trial), not in
 *       the Win-backs tab
 *
 * Admin-gated upstream via the shorts_auth cookie in middleware.ts.
 */

export async function GET(_req: NextRequest) {
  const db = getFirebaseFirestore();
  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const windowStartMs = now - 30 * 86_400_000;
  const windowStartIso = new Date(windowStartMs).toISOString();

  // ── churn_email_log (what Win-backs tab uses for "recipients") ──
  const churnLog = {
    total: 0,
    sent_true: 0,
    in_last_30d: 0,
    by_step: { 1: 0, 2: 0, 3: 0 } as Record<number, number>,
    recent_5: [] as Array<{ email: string; step: number; sentAt: string; tag: string }>,
  };
  try {
    const snap = await db.collection("churn_email_log").get();
    const rows: Array<{ email: string; step: number; sentAt: Date; tag: string; sent: boolean }> = [];
    snap.docs.forEach((d) => {
      const data = d.data() as {
        email?: string;
        step?: number;
        sentAt?: { toDate?: () => Date };
        tag?: string;
        sent?: boolean;
      };
      const sentAt = data.sentAt?.toDate?.();
      if (!data.email || !sentAt || typeof data.step !== "number") return;
      rows.push({
        email: data.email.toLowerCase(),
        step: data.step,
        sentAt,
        tag: data.tag ?? "",
        sent: data.sent ?? false,
      });
    });
    churnLog.total = snap.docs.length;
    churnLog.sent_true = rows.filter((r) => r.sent).length;
    const inWindow = rows.filter((r) => r.sent && r.sentAt.getTime() >= windowStartMs);
    churnLog.in_last_30d = inWindow.length;
    for (const r of inWindow) {
      if (churnLog.by_step[r.step] !== undefined) churnLog.by_step[r.step]++;
    }
    churnLog.recent_5 = rows
      .filter((r) => r.sent)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, 5)
      .map((r) => ({
        email: r.email,
        step: r.step,
        sentAt: r.sentAt.toISOString(),
        tag: r.tag,
      }));
  } catch (e) {
    return Response.json({ error: `churn_email_log read failed: ${e instanceof Error ? e.message : e}` });
  }

  // ── abandoned_email_log (paywall-abandonment drip — different audience) ──
  const abandonedLog = {
    total: 0,
    sent_true: 0,
    in_last_30d: 0,
  };
  try {
    const snap = await db.collection("abandoned_email_log").get();
    let sentTrue = 0;
    let inWindow = 0;
    snap.docs.forEach((d) => {
      const data = d.data() as { sent?: boolean; sentAt?: { toDate?: () => Date } };
      if (data.sent) sentTrue++;
      const sentAt = data.sentAt?.toDate?.();
      if (data.sent && sentAt && sentAt.getTime() >= windowStartMs) inWindow++;
    });
    abandonedLog.total = snap.docs.length;
    abandonedLog.sent_true = sentTrue;
    abandonedLog.in_last_30d = inWindow;
  } catch {
    // Collection may not exist yet — non-fatal.
  }

  // ── subscription_mirror: detect churn → comeback patterns ──
  type MirrorRow = {
    email: string;
    status: string;
    subscription_created_at: string;
    canceled_at: string | null;
  };
  const allRows: MirrorRow[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (offset < 100_000) {
    const { data, error } = await supabase
      .from("subscription_mirror")
      .select("email, status, subscription_created_at, canceled_at")
      .order("subscription_created_at", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error || !data || data.length === 0) break;
    allRows.push(...(data as MirrorRow[]));
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  const byEmail = new Map<string, MirrorRow[]>();
  for (const r of allRows) {
    const e = (r.email || "").toLowerCase().trim();
    if (!e) continue;
    const list = byEmail.get(e) ?? [];
    list.push(r);
    byEmail.set(e, list);
  }
  const winbacks: Array<{ email: string; canceledAt: string; wonBackAt: string }> = [];
  byEmail.forEach((list, email) => {
    list.sort(
      (a, b) =>
        new Date(a.subscription_created_at).getTime() -
        new Date(b.subscription_created_at).getTime(),
    );
    let lastCancel: Date | null = null;
    for (const row of list) {
      if (row.status === "canceled" && row.canceled_at) {
        const cd = new Date(row.canceled_at);
        if (!isNaN(cd.getTime())) {
          if (!lastCancel || cd > lastCancel) lastCancel = cd;
        }
      }
      if (row.status === "active" || row.status === "trialing") {
        const created = new Date(row.subscription_created_at);
        if (lastCancel && !isNaN(created.getTime()) && created > lastCancel) {
          winbacks.push({
            email,
            canceledAt: lastCancel.toISOString(),
            wonBackAt: created.toISOString(),
          });
          lastCancel = null;
        }
      }
    }
  });
  const winbacksInWindow = winbacks.filter((w) => w.wonBackAt >= windowStartIso);
  // Attribution: does the winback's email exist in churn_email_log?
  const churnedEmails = new Set(churnLog.recent_5.map((r) => r.email));
  const _sample = winbacksInWindow.slice(-10).map((w) => ({
    ...w,
    was_in_churn_drip: churnedEmails.has(w.email.toLowerCase()),
  }));

  return Response.json({
    window: "last 30 days",
    churn_email_log: churnLog,
    abandoned_email_log: abandonedLog,
    mirror_winbacks: {
      total_all_time: winbacks.length,
      in_last_30d: winbacksInWindow.length,
      recent_10: _sample,
    },
    interpretation: {
      if_churn_email_log_in_last_30d_is_0:
        "The churn drip either isn't sending, or it's sending but not writing sent=true to Firestore. Emails may be firing via Resend but the admin can't see it.",
      if_mirror_winbacks_in_last_30d_is_0:
        "Nobody who paid and canceled has come back. This is a real-world result, not a tracking bug. Try a better offer or subject line.",
      if_churn_email_log_has_recipients_but_mirror_winbacks_is_0:
        "Tracking is fine. Emails send but nobody re-subscribes. Offer/copy is the lever, not the code.",
      abandoned_note:
        "abandoned_email_log conversions (e.g. almeo@icloud.com with comeback50) do NOT show up in Win-backs — they surface in the Signups funnel as Captured → Trial → Active.",
    },
  });
}
