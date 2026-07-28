import Link from "next/link";
import {
  Download,
  Megaphone,
  MessageSquare,
  Target,
  Calendar,
  Dumbbell,
  BarChart3,
  Zap,
  Smartphone,
} from "lucide-react";
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
  // Onboarding qualitative signals — every question the user
  // answered during onboarding is surfaced here so we can see what
  // the audience actually wants without hunting through Firestore.
  goal: string | null;
  playFrequency: string | null;
  weaknesses: string[];
  days: string[];
  trainingSetup: string[];
  level: string | null;
  signupPlatform: string | null;
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
        goal: (data.goal as string | null) ?? null,
        playFrequency: (data.playFrequency as string | null) ?? null,
        weaknesses: Array.isArray(data.onboardingWeaknesses)
          ? (data.onboardingWeaknesses as string[])
          : [],
        days: Array.isArray(data.onboardingDays)
          ? (data.onboardingDays as string[])
          : [],
        trainingSetup: Array.isArray(data.onboardingTrainingSetup)
          ? (data.onboardingTrainingSetup as string[])
          : [],
        level: (data.onboardingLevel as string | null) ?? null,
        signupPlatform: (data.signupPlatform as string | null) ?? null,
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

  // Goal + blocker distribution for the same signup cohort. Nulls
  // (users who skipped the screen or signed up on an old app version
  // that didn't have it) drop out — the % is against those who
  // actually answered so the mix reflects real preference, not the
  // capture rate.
  const byGoal = new Map<string, number>();
  for (const r of rows) if (r.goal) byGoal.set(r.goal, (byGoal.get(r.goal) ?? 0) + 1);
  const sortedGoals = Array.from(byGoal.entries()).sort((a, b) => b[1] - a[1]);
  const goalTotal = sortedGoals.reduce((sum, [, n]) => sum + n, 0);
  const goalMax = sortedGoals[0]?.[1] ?? 1;

  // Single-select summariser — same shape as goal/blocker aggregation
  // so we can reuse one render helper.
  function tally(rowValues: (string | null)[]) {
    const m = new Map<string, number>();
    let respondents = 0;
    for (const v of rowValues) {
      if (!v) continue;
      m.set(v, (m.get(v) ?? 0) + 1);
      respondents++;
    }
    const sorted = Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
    return { sorted, total: respondents, max: sorted[0]?.[1] ?? 1 };
  }

  // Multi-select summariser — each row can contribute >1 value
  // (weaknesses, days, trainingSetup are List<String> in Firestore).
  // "respondents" counts rows that answered AT LEAST one value; %
  // is against respondents, not against the total value count, so
  // "70% picked Drives" reads as expected.
  function tallyMulti(rowLists: string[][]) {
    const m = new Map<string, number>();
    let respondents = 0;
    for (const list of rowLists) {
      if (!list || list.length === 0) continue;
      respondents++;
      for (const v of list) m.set(v, (m.get(v) ?? 0) + 1);
    }
    const sorted = Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
    return { sorted, total: respondents, max: sorted[0]?.[1] ?? 1 };
  }

  // Pretty labels for the platform values written from the Flutter
  // client. Falls back to the raw value so any new platform we haven't
  // named yet still renders instead of vanishing.
  const platformLabels: Record<string, string> = {
    web: "Web (pballdrills.app)",
    ios: "iOS (App Store)",
    android: "Android",
    macos: "macOS",
    unknown: "Unknown",
  };
  const platform = tally(
    rows.map((r) => (r.signupPlatform ? platformLabels[r.signupPlatform] ?? r.signupPlatform : null)),
  );
  const playFreq = tally(rows.map((r) => r.playFrequency));
  const skillLevel = tally(rows.map((r) => r.level));
  const weaknesses = tallyMulti(rows.map((r) => r.weaknesses));
  const trainingDays = tallyMulti(rows.map((r) => r.days));
  const trainingSetup = tallyMulti(rows.map((r) => r.trainingSetup));

  // Per-user table: rows sorted newest-first, dedupe by email
  const perUserRows = [...rows]
    .sort((a, b) => (b.capturedAt ?? "").localeCompare(a.capturedAt ?? ""))
    .slice(0, 200);

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

            <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4" style={{ color: "#22c55e" }} />
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  Goals
                </h2>
                <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
                  {goalTotal} answered
                </span>
              </div>
              {sortedGoals.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No goal data yet.</p>
              ) : (
                <div className="space-y-3">
                  {sortedGoals.map(([goal, count]) => {
                    const pct = goalTotal ? Math.round((count / goalTotal) * 100) : 0;
                    const bar = Math.round((count / goalMax) * 100);
                    return (
                      <div key={goal}>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{goal}</span>
                          <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                            {count} · {pct}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${bar}%`, background: "#22c55e" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Full quiz answer breakdown — every question surfaces its
                own bar chart so we can see the audience's real distribution
                without querying Firestore. Multi-select fields use "% of
                respondents" so "70% picked Drives" reads intuitively. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <BreakdownCard
                title="Signup platform"
                icon={<Smartphone className="w-4 h-4" style={{ color: "#60a5fa" }} />}
                color="#60a5fa"
                total={platform.total}
                sorted={platform.sorted}
                max={platform.max}
              />
              <BreakdownCard
                title="Weaknesses (multi)"
                icon={<Zap className="w-4 h-4" style={{ color: "#a78bfa" }} />}
                color="#a78bfa"
                total={weaknesses.total}
                sorted={weaknesses.sorted}
                max={weaknesses.max}
              />
              <BreakdownCard
                title="Skill level"
                icon={<BarChart3 className="w-4 h-4" style={{ color: "#38bdf8" }} />}
                color="#38bdf8"
                total={skillLevel.total}
                sorted={skillLevel.sorted}
                max={skillLevel.max}
              />
              <BreakdownCard
                title="Play frequency / week"
                icon={<BarChart3 className="w-4 h-4" style={{ color: "#22d3ee" }} />}
                color="#22d3ee"
                total={playFreq.total}
                sorted={playFreq.sorted}
                max={playFreq.max}
              />
              <BreakdownCard
                title="Training days (multi)"
                icon={<Calendar className="w-4 h-4" style={{ color: "#34d399" }} />}
                color="#34d399"
                total={trainingDays.total}
                sorted={trainingDays.sorted}
                max={trainingDays.max}
              />
              <BreakdownCard
                title="Training setup (multi)"
                icon={<Dumbbell className="w-4 h-4" style={{ color: "#f472b6" }} />}
                color="#f472b6"
                total={trainingSetup.total}
                sorted={trainingSetup.sorted}
                max={trainingSetup.max}
              />
            </div>

            {/* Per-user table — email + signup platform + goal + channel */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--flip-card-border)" }}>
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  Per-user breakdown
                </h2>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {perUserRows.length} most-recent signups with acquisition data
                </p>
              </div>
              {perUserRows.length === 0 ? (
                <p className="px-5 py-6 text-sm" style={{ color: "var(--text-muted)" }}>No data yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--flip-card-border)" }}>
                        <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Email</th>
                        <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Platform</th>
                        <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Channel</th>
                        <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Goal</th>
                        <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--text-muted)" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perUserRows.map((r) => (
                        <tr key={r.id} style={{ borderTop: "1px solid var(--flip-card-border)" }}>
                          <td className="px-4 py-3 font-mono" style={{ color: "var(--text-primary)" }}>
                            {r.email ?? <span style={{ color: "var(--text-muted)" }}>(no email)</span>}
                          </td>
                          <td className="px-4 py-3">
                            {r.signupPlatform ? (
                              <span
                                className="inline-block px-2 py-0.5 rounded font-bold uppercase tracking-wide"
                                style={{
                                  background: "rgba(96,165,250,0.12)",
                                  color: "#60a5fa",
                                  fontSize: 10,
                                }}
                              >
                                {platformLabels[r.signupPlatform] ?? r.signupPlatform}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>—</span>
                            )}
                          </td>
                          <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                            <span>{r.source}</span>
                            {r.detail && (
                              <span className="block mt-0.5" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                                &ldquo;{r.detail}&rdquo;
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3" style={{ color: r.goal ? "var(--text-primary)" : "var(--text-muted)" }}>
                            {r.goal ?? "—"}
                          </td>
                          <td className="px-4 py-3 tabular-nums" style={{ color: "var(--text-muted)" }}>
                            {r.capturedAt ? new Date(r.capturedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

function BreakdownCard({
  title,
  icon,
  color,
  total,
  sorted,
  max,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  total: number;
  sorted: [string, number][];
  max: number;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {title}
        </h2>
        <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
          {total} answered
        </span>
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data yet.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(([label, count]) => {
            const pct = total ? Math.round((count / total) * 100) : 0;
            const bar = Math.round((count / max) * 100);
            return (
              <div key={label}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
                  <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {count} · {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-2 rounded-full" style={{ width: `${bar}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
