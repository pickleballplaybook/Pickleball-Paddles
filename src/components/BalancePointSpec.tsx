import type { Paddle } from "@/types";
import { getCatalogStats } from "@/lib/catalogStats";

// ─────────────────────────────────────────────────────────────────────────────
//  BalancePointSpec
//  Renders the balance-point visualization on the paddle detail page:
//   - paddle image with a horizontal balance line overlaid at the right vertical
//     position, plus a dashed "CENTER" reference line for comparison
//   - horizontal range bar from head-light → head-heavy with a position marker
//   - verdict row: category label + tagline (left), measurement + category (right)
//
//  Only rendered when `paddle.balancePoint` is defined; the parent guards on
//  that, but we still defensively return null below so the component is safe
//  to import anywhere.
// ─────────────────────────────────────────────────────────────────────────────

// Bar range is driven by the actual measured spread across the catalog —
// pulled from getCatalogStats().balancePoint. We pad ~0.3 cm on each end so
// the marker for min/max paddles doesn't pin to the absolute edge. As more
// paddles get measured the range expands automatically; nothing to update
// here. The labeled HEAD-LIGHT / HEAD-HEAVY endpoints are the raw min/max
// (not padded) so the visible numbers reflect the actual catalog spread.

// Geometric paddle center estimate, used to draw the dashed "CENTER" line
// on the paddle image. A 16.5" elongated is ~41.91 cm tall → center at
// ~20.95 cm from the butt; widebodies sit a touch lower. We use a single
// canonical value for the visual reference instead of looking up paddle
// length — the visual is comparative, not measurement-accurate.
const GEOMETRIC_CENTER_CM = 21.0;

// Approximate full paddle height for the % positioning math. Same caveat:
// this is a visual reference, not a per-paddle measurement.
const PADDLE_HEIGHT_CM = 41.0;

interface BalanceCategory {
  label: string;
  tagline: string;
  // RGB triplet for the category accent — the card background, balance line,
  // position marker, and verdict label all derive from this single value
  // so every shade in the card stays consistent.
  accentRgb: string;
}

// All three categories use the brand teal — the LABEL carries the meaning
// (HEAD-LIGHT / AVERAGE / HEAD-HEAVY) so the card stays cohesive with the
// rest of the SpecBar treatments on the paddle page instead of swapping
// colors per category. The 'AVERAGE' middle band intentionally avoids
// 'Neutral Balance' or 'Perfectly Balanced' — it just means 'sits in the
// typical band of pickleball paddles', which is what an average paddle is.
const TEAL_RGB = "45, 212, 191";

function categorize(bp: number): BalanceCategory {
  if (bp < 23.5) {
    return {
      label: "HEAD-LIGHT",
      tagline: "Faster hand speed — quicker through the air.",
      accentRgb: TEAL_RGB,
    };
  }
  if (bp <= 24.5) {
    return {
      label: "AVERAGE",
      tagline: "Sits in the typical balance band — versatile across the court.",
      accentRgb: TEAL_RGB,
    };
  }
  return {
    label: "HEAD-HEAVY",
    tagline: "More plow-through — extra mass behind the ball.",
    accentRgb: TEAL_RGB,
  };
}

function clampPct(n: number): number {
  return Math.max(2, Math.min(98, n));
}

interface Props {
  paddle: Paddle;
}

export default function BalancePointSpec({ paddle }: Props) {
  const bp = paddle.balancePoint;
  if (typeof bp !== "number") return null;

  const cat = categorize(bp);

  // Bar range pulled from the actual measured catalog. As more paddles get
  // balance points filled in, the bar widens automatically without anyone
  // editing constants. ~0.3 cm padding on each end so a paddle equal to
  // min or max doesn't pin the marker to the absolute edge.
  const stats = getCatalogStats().balancePoint;
  const barMin = stats.min > 0 ? stats.min - 0.3 : 22.0;
  const barMax = stats.max > 0 ? stats.max + 0.3 : 26.0;
  // Labeled endpoints under the bar show the raw (un-padded) catalog
  // min/max so the visible 'typical range' numbers reflect the actual
  // spread of what we've measured.
  const headLightRef = stats.min > 0 ? stats.min : 22.0;
  const headHeavyRef = stats.max > 0 ? stats.max : 26.0;

  // Bar position — % from left of the rail, clamped so the marker never
  // disappears off the edge if a paddle measures slightly outside the bar.
  const barPositionPct = clampPct(((bp - barMin) / (barMax - barMin)) * 100);

  // Vertical position of the balance line on the paddle image —
  // % up from the bottom of the image. Same clamp logic.
  const balanceLineFromBottomPct = clampPct((bp / PADDLE_HEIGHT_CM) * 100);
  const centerLineFromBottomPct  = clampPct((GEOMETRIC_CENTER_CM / PADDLE_HEIGHT_CM) * 100);

  // Offset from the geometric center, displayed as "(+X.X)" or "(−X.X)"
  // next to the measurement. Matches the inspiration design's secondary
  // value and gives players a quick intuition for how head-biased the
  // paddle is in absolute cm.
  const offset = bp - GEOMETRIC_CENTER_CM;
  const offsetLabel = offset >= 0 ? `+${offset.toFixed(1)}` : offset.toFixed(1);

  // Single source of truth for the accent color; all shades below derive
  // from this so the entire card stays color-coherent for the category.
  const rgb = cat.accentRgb;
  const accent = `rgb(${rgb})`;

  return (
    <div className="w-full">
      <div
        className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{
          // Matches the Specifications card alongside it (same flip-bg-card
          // surface, same flip-card-border) so the two cards visually pair
          // up. A subtle category-accent glow at the top and a hairline
          // border tint give the Balance Point card just enough character
          // to feel intentional without breaking the surface system.
          background: [
            `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${rgb}, 0.10) 0%, transparent 70%)`,
            "var(--flip-bg-card)",
          ].join(", "),
          border: `1px solid rgba(${rgb}, 0.25)`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Heading + subtitle — styled to match the Specifications card's
            <h2 Specifications> heading directly above/below it so the two
            cards read as a coordinated pair. */}
        <h2 className="text-xl font-extrabold mb-1" style={{ color: "var(--flip-text-head)" }}>
          Balance Point
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--flip-text-muted)" }}>
          How heavy the paddle feels and where the mass sits.
        </p>

        {/* Paddle image with overlaid balance + center lines.
            Sized larger now that the section lives inside the left column
            of the specs grid — the column is narrower than a full-width
            section, so the image needs to fill more of its container to
            stay visually prominent. */}
        <div className="flex justify-center my-4 md:my-6">
          <div className="relative" style={{ width: 320, maxWidth: "78%" }}>
            {paddle.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={paddle.image}
                alt={`${paddle.brand} ${paddle.name} balance point visualization`}
                className="w-full h-auto object-contain"
                style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))" }}
              />
            ) : (
              <div className="aspect-[1/2.4] rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
            )}

            {/* Solid balance line — color-coded to category */}
            <div
              className="absolute left-[-12%] right-[-12%] pointer-events-none"
              style={{
                bottom: `${balanceLineFromBottomPct}%`,
                height: 2,
                background: accent,
                boxShadow: `0 0 12px ${accent}, 0 0 2px ${accent}`,
              }}
            />
            {/* Solid-line marker dot */}
            <div
              className="absolute pointer-events-none rounded-full"
              style={{
                bottom: `calc(${balanceLineFromBottomPct}% - 6px)`,
                left: "50%",
                transform: "translateX(-50%)",
                width: 12,
                height: 12,
                background: accent,
                boxShadow: `0 0 8px ${accent}`,
              }}
            />

            {/* Value chip — pinned to the right end of the balance line so
                the actual number sits right where the action is happening
                instead of forcing the reader to look at the bottom row. */}
            <div
              className="absolute pointer-events-none text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-md"
              style={{
                bottom: `calc(${balanceLineFromBottomPct}% - 13px)`,
                right: "-46%",
                background: "rgba(0,0,0,0.65)",
                color: accent,
                border: `1px solid rgba(${rgb}, 0.40)`,
                whiteSpace: "nowrap",
                boxShadow: `0 2px 8px rgba(0,0,0,0.30), 0 0 10px rgba(${rgb}, 0.20)`,
              }}
            >
              {bp.toFixed(1)} cm
            </div>

            {/* Dashed "CENTER" reference line */}
            <div
              className="absolute left-[-12%] right-[-12%] pointer-events-none"
              style={{
                bottom: `${centerLineFromBottomPct}%`,
                height: 0,
                borderTop: "1px dashed rgba(255,255,255,0.45)",
              }}
            />
            {/* CENTER label chip — pinned to the right end of the dashed line */}
            <div
              className="absolute pointer-events-none text-[9px] font-extrabold uppercase tracking-[0.18em] px-2 py-1 rounded-md"
              style={{
                bottom: `calc(${centerLineFromBottomPct}% - 11px)`,
                right: "-46%",
                background: "rgba(0,0,0,0.55)",
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.10)",
                whiteSpace: "nowrap",
              }}
            >
              Center
            </div>
          </div>
        </div>

        {/* Range bar */}
        <div className="mt-8 md:mt-10">
          <div
            className="relative h-2 rounded-full"
            style={{
              // Indigo → teal → orange — mirrors the three categories.
              background: "linear-gradient(90deg, rgba(129,140,248,0.32) 0%, rgba(45,212,191,0.18) 50%, rgba(251,146,60,0.32) 100%)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            {/* Position marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${barPositionPct}%`,
                transform: "translate(-50%, -50%)",
                width: 14,
                height: 16,
                background: accent,
                borderRadius: 6,
                boxShadow: `0 0 12px ${accent}, inset 0 1px 0 rgba(255,255,255,0.4)`,
              }}
            />
          </div>

          {/* Endpoint labels */}
          <div className="flex justify-between mt-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.20em]" style={{ color: "rgba(255,255,255,0.85)" }}>
                Head-Light
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                {headLightRef.toFixed(1)} cm
              </p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                (typical range)
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.20em]" style={{ color: "rgba(255,255,255,0.85)" }}>
                Head-Heavy
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                {headHeavyRef.toFixed(1)} cm
              </p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                (typical range)
              </p>
            </div>
          </div>
        </div>

        {/* Verdict row */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="min-w-0">
            <p className="text-xl md:text-2xl font-extrabold tracking-tight" style={{ color: accent }}>
              {cat.label}
            </p>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
              {cat.tagline}
            </p>
          </div>
          <div className="text-left md:text-right flex-shrink-0">
            <p className="font-extrabold tabular-nums" style={{ color: "#fff" }}>
              <span className="text-3xl md:text-4xl">{bp.toFixed(1)} cm</span>
              <span className="text-sm ml-2" style={{ color: "rgba(255,255,255,0.50)" }}>
                ({offsetLabel})
              </span>
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.20em] mt-1" style={{ color: "rgba(255,255,255,0.50)" }}>
              {cat.label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
