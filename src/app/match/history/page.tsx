"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { getMatches, deleteMatch, aggregate, totals, type SavedMatch } from "@/lib/matchHistory";

// ── Hand-rolled HorizontalBar ─────────────────────────────────────────────
function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs sm:text-sm flex-shrink-0 w-32 sm:w-44 truncate" style={{ color: "var(--text-primary)" }}>
        {label}
      </span>
      <div
        className="flex-1 h-2.5 rounded-full overflow-hidden"
        style={{ background: "var(--flip-bg)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="text-sm font-extrabold tabular-nums w-8 text-right"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Hand-rolled Donut chart ───────────────────────────────────────────────
function Donut({ slices, centerLabel, centerValue }: {
  slices: { label: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const R = 40;
  const C = 2 * Math.PI * R; // ≈ 251.327
  let cumulativePct = 0;

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0" aria-hidden>
        {/* Track */}
        <circle r={R} cx="50" cy="50" fill="none" stroke="var(--flip-bg)" strokeWidth="14" />
        {/* Slices */}
        {total > 0 && slices.map((s, i) => {
          const pct = s.value / total;
          const dash = pct * C;
          const offset = -cumulativePct * C;
          cumulativePct += pct;
          return (
            <circle
              key={i}
              r={R}
              cx="50"
              cy="50"
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${C}`}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
              strokeLinecap="butt"
            />
          );
        })}
        {/* Center text */}
        {centerValue !== undefined && (
          <text
            x="50" y="48"
            textAnchor="middle"
            className="font-extrabold"
            style={{ fontSize: "16px", fill: "var(--text-primary)" }}
          >
            {centerValue}
          </text>
        )}
        {centerLabel && (
          <text
            x="50" y="62"
            textAnchor="middle"
            style={{ fontSize: "7px", fill: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            {centerLabel}
          </text>
        )}
      </svg>

      <div className="flex flex-col gap-2 min-w-0">
        {slices.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{s.label}</span>
              <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                {s.value} · {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Hand-rolled Ratio trend (mini line chart) ──────────────────────────────
function RatioTrend({ matches }: { matches: SavedMatch[] }) {
  // Show last 20 matches in chronological (oldest → newest) order
  const ordered = [...matches]
    .sort((a, b) => +new Date(a.savedAt) - +new Date(b.savedAt))
    .slice(-20);
  if (ordered.length < 2) {
    return (
      <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
        Save at least 2 matches to see your ratio trend.
      </p>
    );
  }
  const W = 480;
  const H = 120;
  const padX = 8;
  const padY = 10;
  const max = Math.max(2, ...ordered.map((m) => m.ratio));
  const stepX = (W - padX * 2) / (ordered.length - 1);
  const points = ordered.map((m, i) => {
    const x = padX + i * stepX;
    const y = H - padY - (m.ratio / max) * (H - padY * 2);
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${path} L${points[points.length - 1][0].toFixed(1)},${H - padY} L${padX},${H - padY} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-hidden>
        {/* Gridline at 1.0 ratio (parity) */}
        {max >= 1 && (
          <line
            x1={padX} x2={W - padX}
            y1={H - padY - (1 / max) * (H - padY * 2)}
            y2={H - padY - (1 / max) * (H - padY * 2)}
            stroke="var(--flip-card-border)" strokeDasharray="3 3"
          />
        )}
        {/* Area fill */}
        <path d={areaPath} fill="rgba(20,184,166,0.12)" />
        {/* Line */}
        <path d={path} fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinejoin="round" />
        {/* Dots */}
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#2dd4bf" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
        <span>Earliest of last {ordered.length}</span>
        <span>Most recent</span>
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p
        className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight"
        style={{ color: accent ?? "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function MatchHistoryPage() {
  const [matches, setMatches] = useState<SavedMatch[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMatches(getMatches());
    setMounted(true);
  }, []);

  // Refetch if the user saves a match in another tab
  useEffect(() => {
    const onChange = () => setMatches(getMatches());
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);

  function handleDelete(id: string) {
    if (!window.confirm("Delete this match? This can't be undone.")) return;
    deleteMatch(id);
    setMatches(getMatches());
  }

  if (!mounted) {
    return <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }} />;
  }

  const t = totals(matches);
  const ueAgg  = aggregate(matches, "ueData").slice(0, 8);
  const feAgg  = aggregate(matches, "feData").slice(0, 8);
  const winAgg = aggregate(matches, "winData").slice(0, 8);

  const ueMax  = ueAgg[0]?.total  ?? 0;
  const feMax  = feAgg[0]?.total  ?? 0;
  const winMax = winAgg[0]?.total ?? 0;

  return (
    <div className="min-h-screen pt-[156px] pb-20" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-10 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-10 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#14b8a6" }}>
              Match History
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
              Where you&apos;re winning and losing
            </h1>
            <p className="text-sm md:text-base max-w-2xl" style={{ color: "var(--text-muted)" }}>
              {matches.length === 0
                ? "Save a match from the tally sheet to start tracking patterns across your film."
                : `Aggregated across ${matches.length} saved match${matches.length === 1 ? "" : "es"} — data lives in this browser only.`}
            </p>
          </div>
          <Link
            href="/match/analysis"
            className="inline-flex items-center gap-2 font-bold text-sm py-2.5 px-5 rounded-xl transition-all active:scale-[0.98]"
            style={{
              background: "var(--btn-buy-bg)",
              color: "var(--btn-buy-text)",
              boxShadow: "var(--btn-buy-shadow)",
            }}
          >
            <Plus className="w-4 h-4" />
            Add a match
          </Link>
        </div>

        {/* Empty state */}
        {matches.length === 0 ? (
          <div
            className="rounded-3xl p-12 text-center"
            style={{ background: "var(--flip-bg-card)", border: "1px dashed var(--flip-card-border)" }}
          >
            <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: "#14b8a6" }} />
            <h2 className="text-lg font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
              No matches yet
            </h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
              Head to the tally sheet, log a match by tallying each rally as you re-watch your film,
              then hit &quot;Save match&quot; at the bottom. Charts and trends populate here automatically.
            </p>
            <Link
              href="/match/analysis"
              className="inline-flex items-center gap-2 font-bold text-sm py-2.5 px-5 rounded-xl transition-all active:scale-[0.98]"
              style={{
                background: "var(--btn-buy-bg)",
                color: "var(--btn-buy-text)",
                boxShadow: "var(--btn-buy-shadow)",
              }}
            >
              Open the tally sheet <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <StatCard label="Matches"        value={matches.length} />
              <StatCard label="Unforced"       value={t.ue}  accent="#ef4444" />
              <StatCard label="Forced"         value={t.fe}  accent="#f59e0b" />
              <StatCard label="Winners"        value={t.wins} accent="#22c55e" />
              <StatCard label="Avg W : E"      value={t.ratio.toFixed(2)} accent="#14b8a6" />
            </div>

            {/* Row 1: Donut + Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
              <div className="rounded-2xl p-5 md:p-6" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                  Error breakdown
                </p>
                <Donut
                  slices={[
                    { label: "Unforced", value: t.ue, color: "#ef4444" },
                    { label: "Forced",   value: t.fe, color: "#f59e0b" },
                  ]}
                  centerValue={t.errors}
                  centerLabel="errors"
                />
              </div>
              <div className="rounded-2xl p-5 md:p-6" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
                <div className="flex items-baseline justify-between gap-2 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    Winners : Errors ratio trend
                  </p>
                  <TrendingUp className="w-4 h-4" style={{ color: "#14b8a6" }} />
                </div>
                <RatioTrend matches={matches} />
              </div>
            </div>

            {/* Row 2: Top errors / winners bar charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
              {[
                { title: "Top unforced errors", data: ueAgg,  max: ueMax,  color: "#ef4444" },
                { title: "Top forced errors",   data: feAgg,  max: feMax,  color: "#f59e0b" },
                { title: "Top winners",         data: winAgg, max: winMax, color: "#22c55e" },
              ].map(({ title, data, max, color }) => (
                <div key={title} className="rounded-2xl p-5 md:p-6" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                    {title}
                  </p>
                  {data.length === 0 ? (
                    <p className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>
                      None recorded yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {data.map((d) => (
                        <BarRow key={d.label} label={d.label} value={d.total} max={max} color={color} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Match list */}
            <div className="rounded-2xl p-5 md:p-6" style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                Saved matches
              </p>
              <div className="flex flex-col divide-y" style={{ borderColor: "var(--flip-card-border)" }}>
                {matches.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0" style={{ borderColor: "var(--flip-card-border)" }}>
                    <div className="min-w-0">
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                        {new Date(m.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        <span className="font-normal opacity-60">
                          {"  ·  "}
                          {new Date(m.savedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                        <span style={{ color: "#22c55e" }}>{m.winnersTotal} W</span>
                        {" · "}
                        <span style={{ color: "#ef4444" }}>{m.ueTotal} UE</span>
                        {" · "}
                        <span style={{ color: "#f59e0b" }}>{m.feTotal} FE</span>
                        {" · ratio "}
                        <span style={{ color: "#14b8a6" }}>{m.ratio.toFixed(2)}</span>
                        {m.notes ? `  ·  ${m.notes}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      aria-label="Delete match"
                      className="flex-shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-lg transition-colors hover:text-red-500"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
