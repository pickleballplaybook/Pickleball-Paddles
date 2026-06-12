// ─────────────────────────────────────────────────────────────────────────────
//  SpecBar
//  Redesigned for clarity — the previous treatment (tiny dot on a thin line,
//  min/avg/max numbers below) was hard to read at a glance, even when paused
//  on a YouTube screenshot. New treatment:
//
//    1. Big bold VALUE as the headline (paused-on-YouTube readable)
//    2. Zone chip up top (LIGHT / BALANCED / HEAD-HEAVY etc.) gives the
//       meaning in one word before they read any digits
//    3. Tri-color zone bar — clear three-zone backdrop with a glowing
//       marker pinned to where this paddle falls
//    4. One-line plain-English interpretation: what this number means on
//       the court ("More plow-through on drives, slower at the kitchen")
//
//  The Props shape is backward-compatible with the previous SpecBar — just
//  adds an optional `kind` prop that selects the spec-specific zone labels
//  and interpretations. Pass `kind="swing-weight"`, `"twist-weight"`, or
//  `"static-weight"` to get the right copy; omit it for a generic
//  Low/Average/High treatment.
// ─────────────────────────────────────────────────────────────────────────────

export type SpecKind = "swing-weight" | "twist-weight" | "static-weight" | "generic";

interface Props {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  avg: number;
  kind?: SpecKind;
  /** Optional override for the bottom interpretation if you want custom copy. */
  descriptor?: string;
}

// Per-spec copy. The three slots map to [low zone, average zone, high zone].
// Tuned for what each spec actually means on the court so a viewer reading
// the card learns something useful instead of just seeing a number.
const SPEC_META: Record<SpecKind, {
  zoneLabels: [string, string, string];
  interpretations: [string, string, string];
}> = {
  "swing-weight": {
    zoneLabels:      ["Whippy", "Balanced", "Head-Heavy"],
    interpretations: [
      "Light and fast through the air — great for hand battles and quick reactions, less plow-through on drives.",
      "Balanced feel — neither sluggish at the kitchen nor underpowered on drives. The all-court sweet spot.",
      "Head-heavy with serious plow-through on drives — slower hand speed at the kitchen, more strain on the shoulder over long sessions.",
    ],
  },
  "twist-weight": {
    zoneLabels:      ["Demanding", "Forgiving", "Very Forgiving"],
    interpretations: [
      "Smaller effective sweet spot — clean contact required, off-center hits punish.",
      "Solid sweet spot for most players — handles normal off-center contact predictably.",
      "Very large effective sweet spot — off-center hits stay stable; great for beginners and high-speed exchanges.",
    ],
  },
  "static-weight": {
    zoneLabels:      ["Light", "Average", "Heavy"],
    interpretations: [
      "Light in hand — easier on the wrist, faster reactions, less momentum on drives.",
      "Balanced weight — versatile across the court and easy to control for most players.",
      "Heavy in hand — more momentum on every swing, but more wrist and shoulder fatigue over long sessions.",
    ],
  },
  "generic": {
    zoneLabels:      ["Low", "Average", "High"],
    interpretations: ["Below average.", "Near average.", "Above average."],
  },
};

// All bars use the brand teal — the zone descriptor chip in the top-right
// of each card carries the meaning (Whippy / Balanced / Head-Heavy etc.)
// so the card color doesn't need to differentiate. Cohesive premium look
// instead of the previous indigo/teal/orange spread.
const ZONE_COLORS = {
  low:  { accent: "45, 212, 191" }, // teal-300
  avg:  { accent: "45, 212, 191" }, // teal-300
  high: { accent: "45, 212, 191" }, // teal-300
} as const;

export default function SpecBar({ label, value, unit = "", min, max, avg, kind = "generic", descriptor }: Props) {
  if (!value) return null;

  const range  = max - min || 1;
  const pct    = Math.max(0, Math.min(100, ((value - min) / range) * 100));
  const avgPct = Math.max(0, Math.min(100, ((avg - min) / range) * 100));

  // Zone splits anchored on the catalog average so paddles whose dataset
  // skews high don't all get tagged "high". 60% of the way from min → avg is
  // the low / avg boundary; 40% of the way from avg → max is the avg / high
  // boundary.
  const lowEnd  = min + (avg - min) * 0.6;
  const highEnd = avg + (max - avg) * 0.4;
  const zone: "low" | "avg" | "high" =
    value < lowEnd  ? "low"  :
    value > highEnd ? "high" : "avg";

  const meta = SPEC_META[kind];
  const zoneLabel = zone === "low" ? meta.zoneLabels[0] : zone === "high" ? meta.zoneLabels[2] : meta.zoneLabels[1];
  const interp    = descriptor ?? (zone === "low" ? meta.interpretations[0] : zone === "high" ? meta.interpretations[2] : meta.interpretations[1]);
  const accent    = ZONE_COLORS[zone].accent;

  return (
    <div
      className="rounded-2xl p-5 md:p-6 mb-3"
      style={{
        background: `linear-gradient(135deg, rgba(${accent},0.06) 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid rgba(${accent},0.20)`,
      }}
    >
      {/* Header: spec name + zone badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color: "var(--flip-text-muted)" }}>
          {label}
        </p>
        <span
          className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{ background: `rgba(${accent},0.15)`, color: `rgb(${accent})`, border: `1px solid rgba(${accent},0.35)` }}
        >
          {zoneLabel}
        </span>
      </div>

      {/* Big value — the thing people screenshot to */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl md:text-5xl font-extrabold tabular-nums leading-none" style={{ color: "var(--flip-text-head)" }}>
          {value}
        </span>
        {unit && (
          <span className="text-lg font-bold" style={{ color: "var(--flip-text-muted)" }}>
            {unit}
          </span>
        )}
        <span className="text-xs ml-auto" style={{ color: "var(--flip-text-muted)" }}>
          avg {avg}{unit ? ` ${unit}` : ""}
        </span>
      </div>

      {/* Tri-color zone bar with marker */}
      <div className="relative">
        <div
          className="relative h-2.5 rounded-full overflow-hidden flex"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div className="flex-1" style={{ background: `rgba(${ZONE_COLORS.low.accent},0.22)`  }} />
          <div className="flex-1" style={{ background: `rgba(${ZONE_COLORS.avg.accent},0.22)`  }} />
          <div className="flex-1" style={{ background: `rgba(${ZONE_COLORS.high.accent},0.22)` }} />
          {/* Average tick — subtle reference line at the catalog average */}
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{ left: `${avgPct}%`, background: "rgba(255,255,255,0.18)" }}
          />
        </div>
        {/* This paddle's marker — glow matches the zone color */}
        <div
          className="absolute -top-1.5 w-5 h-5 rounded-full border-2"
          style={{
            left: `calc(${pct}% - 10px)`,
            background: `rgb(${accent})`,
            borderColor: "#ffffff",
            boxShadow: `0 0 0 3px rgba(${accent},0.20), 0 2px 8px rgba(0,0,0,0.30)`,
          }}
        />
      </div>

      {/* Range endpoints — the only two numbers people need to read the bar */}
      <div className="flex items-center justify-between mt-2.5 mb-3 text-[11px]" style={{ color: "var(--flip-text-faint)" }}>
        <span>{min}{unit ? ` ${unit}` : ""}</span>
        <span>{max}{unit ? ` ${unit}` : ""}</span>
      </div>

      {/* Plain-English interpretation — what this means on the court. */}
      <p
        className="text-sm leading-relaxed pt-3"
        style={{ color: "var(--flip-text-body, rgba(255,255,255,0.65))", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {interp}
      </p>
    </div>
  );
}
