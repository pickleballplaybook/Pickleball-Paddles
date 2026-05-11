interface Props {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  avg: number;
  descriptor?: string; // e.g. "Above average"
}

export default function SpecBar({ label, value, unit = "", min, max, avg, descriptor }: Props) {
  if (!value) return null;
  const range = max - min || 1;
  const pct = Math.max(0, Math.min(100, ((value - min) / range) * 100));
  const avgPct = Math.max(0, Math.min(100, ((avg - min) / range) * 100));

  const desc =
    descriptor ??
    (value > avg * 1.05 ? "Above average" : value < avg * 0.95 ? "Below average" : "Near average");

  return (
    <div className="py-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: "var(--flip-text-head)" }}>
          {label}
        </span>
        <span className="text-sm font-bold font-mono" style={{ color: "var(--flip-text-head)" }}>
          {value}{unit && ` ${unit}`}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-2 rounded-full" style={{ background: "var(--flip-card-border)" }}>
        {/* Average marker */}
        <div
          className="absolute top-0 bottom-0 w-[2px] rounded-full"
          style={{ left: `${avgPct}%`, background: "var(--flip-text-muted)", opacity: 0.6 }}
        />
        {/* Value dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
          style={{
            left: `calc(${pct}% - 6px)`,
            background: "#f97316",
            borderColor: "#f97316",
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px]" style={{ color: "var(--flip-text-muted)" }}>
          {min}{unit && ` ${unit}`}
        </span>
        <span className="text-[11px]" style={{ color: "var(--flip-text-muted)" }}>
          avg {avg}{unit && ` ${unit}`}
        </span>
        <span className="text-[11px]" style={{ color: "var(--flip-text-muted)" }}>
          {max}{unit && ` ${unit}`}
        </span>
      </div>
      <p className="text-xs mt-0.5" style={{ color: "var(--flip-text-muted)" }}>{desc}</p>
    </div>
  );
}
