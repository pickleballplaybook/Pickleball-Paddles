import Link from "next/link";
import { Download, Megaphone, MessageSquare } from "lucide-react";
import { AdminNav } from "../_components/AdminNav";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import DeleteSignupButton from "./DeleteSignupButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /admin/acquisition
 * ------------------
 * Reads `acquisitionSource` + `acquisitionDetail` off the Pickleball Drills
 * Firestore `users` collection (set by lib/pages/onboarding/onboarding_flow.dart
 * via the new "How'd you find us?" screen → user_pod.dart writes to the doc
 * when the account is first created).
 *
 * Gated by the shorts_auth cookie (see src/middleware.ts).
 */

type Row = {
  id: string;
  email: string | null;
  name: string | null;
  source: string;
  detail: string | null;
  capturedAt: string | null;
};

// Diagnostic row used by the "Recent signups (debug)" section so we can
// see WHO signed up recently and whether the acquisition write fired.
// Helps us tell apart "users are skipping the screen" from "the write
// is broken end-to-end".
type DebugRow = {
  id: string;
  email: string | null;
  trialStartAt: string | null;
  acquisitionSource: string | null;
};

const WINDOWS: Record<string, { label: string; days: number | null }> = {
  "7": { label: "Last 7 days", days: 7 },
  "30": { label: "Last 30 days", days: 30 },
  "90": { label: "Last 90 days", days: 90 },
  all: { label: "All time", days: null },
};

// In-memory caching removed so DeleteSignupButton's router.refresh() shows
// the new state immediately. Admin tool is low-traffic; the two extra
// Firestore reads per page load are not worth the staleness pain.

export default async function AcquisitionAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const sp = await searchParams;
  const winKey = sp.window && WINDOWS[sp.window] ? sp.window : "30";
  const win = WINDOWS[winKey];

  let rows: Row[] = [];
  let loadError: string | null = null;

  try {
    const db = getFirebaseFirestore();
    let q = db
      .collection("users")
      .where("acquisitionSource", "!=", null)
      .orderBy("acquisitionSource")
      .orderBy("acquisitionCapturedAt", "desc")
      .limit(1000);
    if (win.days !== null) {
      const cutoff = new Date(Date.now() - win.days * 86_400_000);
      q = db
        .collection("users")
        .where("acquisitionCapturedAt", ">=", cutoff)
        .orderBy("acquisitionCapturedAt", "desc")
        .limit(1000);
    }
    const snap = await q.get();
    rows = snap.docs.map((d) => {
      const data = d.data();
      const captured = data.acquisitionCapturedAt?.toDate?.();
      return {
        id: d.id,
        email: (data.email as string | null) ?? null,
        name: (data.name as string | null) ?? null,
        source: (data.acquisitionSource as string) ?? "(unknown)",
        detail: (data.acquisitionDetail as string | null) ?? null,
        capturedAt: captured ? captured.toISOString() : null,
      };
    });
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to read acquisition data.";
  }

  // ── Debug section: pull the 30 most-recent signups (by trialStartAt)
  // and show whether each one has an acquisitionSource. Lets us tell
  // apart "users are skipping the screen" from "the write is broken".
  let debugRows: DebugRow[] = [];
  let debugError: string | null = null;
  try {
    const db = getFirebaseFirestore();
    const debugSnap = await db
      .collection("users")
      .where("trialStartAt", "!=", null)
      .orderBy("trialStartAt", "desc")
      .limit(30)
      .get();
    debugRows = debugSnap.docs.map((d) => {
      const data = d.data();
      const tsa = data.trialStartAt?.toDate?.();
      return {
        id: d.id,
        email: (data.email as string | null) ?? null,
        trialStartAt: tsa ? tsa.toISOString() : null,
        acquisitionSource: (data.acquisitionSource as string | null) ?? null,
      };
    });
  } catch (e) {
    debugError = e instanceof Error ? e.message : "Failed to read recent signups.";
  }
  const debugTotal = debugRows.length;
  const debugWithSource = debugRows.filter((d) => d.acquisitionSource).length;
  const debugWithoutSource = debugTotal - debugWithSource;

  const total = rows.length;
  const bySource = new Map<string, number>();
  for (const r of rows) bySource.set(r.source, (bySource.get(r.source) ?? 0) + 1);
  const sorted = Array.from(bySource.entries()).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;
  const withDetail = rows.filter((r) => r.detail && r.detail.trim().length > 0);

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-page)", paddingTop: "calc(var(--topbar-h, 108px) + 1rem)" }}>
      <div className="container-xl py-10 max-w-5xl mx-auto">
        <AdminNav />

        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#60a5fa" }}>
          Admin · Acquisition
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
          How players find Pickleball Drills
        </h1>
        <p className="text-sm md:text-base mb-8" style={{ color: "var(--text-muted)" }}>
          Captured on the onboarding "How'd you find us?" screen. Skippable, so this is a
          sample of trial signups — not 100% — but useful for channel attribution.
        </p>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {Object.entries(WINDOWS).map(([key, w]) => {
            const active = key === winKey;
            return (
              <Link
                key={key}
                href={`/admin/acquisition?window=${key}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  active ? "bg-accent-500 text-black" : "text-gray-400 hover:text-white"
                }`}
                style={{
                  background: active ? undefined : "var(--flip-bg-card)",
                  border: "1px solid var(--flip-card-border)",
                }}
              >
                {w.label}
              </Link>
            );
          })}
        </div>

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
                <Megaphone className="w-4 h-4 mb-2" style={{ color: "#60a5fa" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Responses</p>
                <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{total}</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
                <MessageSquare className="w-4 h-4 mb-2" style={{ color: "#f59e0b" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>With detail</p>
                <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{withDetail.length}</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Top channel</p>
                <p className="text-lg font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>
                  {sorted[0]?.[0] ?? "—"}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {sorted[0] ? `${sorted[0][1]} of ${total}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <a
                href={`/api/admin/acquisition/export?window=${winKey}`}
                className="inline-flex items-center gap-2 font-bold text-sm py-3 px-6 rounded-xl transition-all active:scale-[0.98]"
                style={{ background: "var(--btn-buy-bg)", color: "var(--btn-buy-text)", boxShadow: "var(--btn-buy-shadow)" }}
              >
                <Download className="w-4 h-4" />
                Download CSV ({total} rows)
              </a>
            </div>

            <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                Channel breakdown
              </h2>
              {sorted.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No acquisition data in this window yet.</p>
              ) : (
                <div className="space-y-3">
                  {sorted.map(([src, count]) => {
                    const pct = Math.round((count / total) * 100);
                    const bar = Math.round((count / max) * 100);
                    return (
                      <div key={src}>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{src}</span>
                          <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                            {count} · {pct}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${bar}%`, background: "#60a5fa" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl p-5" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                Recent details
              </h2>
              {withDetail.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No free-text details yet.</p>
              ) : (
                <ul className="space-y-4">
                  {withDetail.slice(0, 50).map((r) => (
                    <li key={r.id} style={{ borderTop: "1px solid var(--flip-card-border)", paddingTop: 12 }}>
                      <p className="text-sm" style={{ color: "var(--text-primary)" }}>&ldquo;{r.detail}&rdquo;</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {r.source}
                        {r.email ? ` · ${r.email}` : ""}
                        {r.capturedAt ? ` · ${new Date(r.capturedAt).toLocaleDateString()}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {rows.length === 1000 && (
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                Showing 1000 most-recent rows. CSV export contains all rows in this window.
              </p>
            )}

            {/* Debug section — surfaces the 30 most-recent signups regardless
                of whether they captured an acquisition source. Lets us tell
                apart "users are skipping the screen" from "the write is
                broken end-to-end". */}
            <div
              className="rounded-2xl p-5 mt-4"
              style={{
                background: "rgba(96, 165, 250, 0.05)",
                border: "1px dashed rgba(96, 165, 250, 0.4)",
              }}
            >
              <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#60a5fa" }}>
                  Debug · Recent signups
                </h2>
                <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{debugTotal}</span> signups
                  </span>
                  <span>
                    <span style={{ color: "#22c55e", fontWeight: 700 }}>{debugWithSource}</span> captured source
                  </span>
                  <span>
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>{debugWithoutSource}</span> missing
                  </span>
                </div>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                The 30 most-recent signups (by <code>trialStartAt</code>). If most have <code>(missing)</code>, users
                are skipping the screen — make it required. If they signed up on iOS app version &lt;= 10.3.10, they
                won&apos;t have the new acquisition screen yet.
              </p>
              {debugError ? (
                <p className="text-sm" style={{ color: "#ef4444" }}>{debugError}</p>
              ) : debugTotal === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No recent signups yet.</p>
              ) : (
                <ul className="space-y-2">
                  {debugRows.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg flex-wrap"
                      style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <span className="text-xs font-mono" style={{ color: "var(--text-primary)" }}>
                        {d.email || "(no email)"}
                      </span>
                      <div className="flex items-center gap-3 text-xs">
                        {d.acquisitionSource ? (
                          <span
                            className="px-2 py-0.5 rounded"
                            style={{
                              background: "rgba(34, 197, 94, 0.15)",
                              color: "#22c55e",
                              fontWeight: 600,
                            }}
                          >
                            {d.acquisitionSource}
                          </span>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded"
                            style={{
                              background: "rgba(239, 68, 68, 0.12)",
                              color: "#ef4444",
                              fontWeight: 600,
                              fontStyle: "italic",
                            }}
                          >
                            (missing)
                          </span>
                        )}
                        <span style={{ color: "var(--text-muted)" }}>
                          {d.trialStartAt
                            ? new Date(d.trialStartAt).toLocaleString("en-US", {
                                timeZone: "America/Denver",
                                month: "numeric",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                                timeZoneName: "short",
                              })
                            : "—"}
                        </span>
                        <DeleteSignupButton uid={d.id} email={d.email} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
