import type { Paddle } from "@/types";

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

// Reference range that bounds the visual bar. Real pickleball paddles cluster
// between ~22 and ~26 cm; the bar covers a touch wider so extreme values
// still plot meaningfully instead of pinning at the endpoint.
const BAR_MIN = 22.0;
const BAR_MAX = 26.0;

// "Typical range" labels shown at the bar endpoints. These mirror the
// inspiration design's anchor values, not the absolute bar bounds — so
// players see a recognizable head-light/head-heavy reference even when the
// underlying bar extends slightly further in each direction.
const HEAD_LIGHT_REF = 23.0;
const HEAD_HEAVY_REF = 25.3;

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

function categorize(bp: number): BalanceCategory {
  if (bp < 23.5) {
    return {
      label: "HEAD-LIGHT",
      tagline: "Faster hand speed — quicker through the air",
      accentRgb: "96, 165, 250",   // blue-400
    };
  }
  if (bp <= 24.5) {
    return {
      label: "NEUTRAL BALANCE",
      tagline: "Even feel — versatile across the court",
      accentRgb: "239, 68, 68",    // red-500
    };
  }
  return {
    label: "HEAD-HEAVY",
    tagline: "More plow-through — extra mass behind the ball",
    accentRgb: "244, 114, 182",  // pink-400
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

  // Bar position — % from left of the rail, clamped so the marker never
  // disappears off the edge if a paddle measures slightly outside the bar.
  const barPositionPct = clampPct(((bp - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100);

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
      {/* Header above the card — matches the inspiration treatment. */}
      <p className="text-sm mb-4" style={{ color: "var(--flip-text-muted, rgba(255,255,255,0.6))" }}>
        How heavy the paddle feels and where the mass sits.
      </p>

      <div
        className="relative rounded-3xl overflow-hidden p-6 md:p-8"
        style={{
          // Category-tinted dark background. The radial gradients use the
          // category accent at low alpha; the base layer stays nearly black
          // so the card feels at home in the site's dark surface system
          // regardless of which category the accent is.
          background: [
            `radial-gradient(ellipse 80% 60% at 50% 20%, rgba(${rgb}, 0.12) 0%, transparent 60%)`,
            `radial-gradient(ellipse 60% 50% at 50% 100%, rgba(${rgb}, 0.08) 0%, transparent 70%)`,
            `linear-gradient(180deg, rgba(${rgb}, 0.04) 0%, #0d0612 100%)`,
          ].join(", "),
          border: `1px solid rgba(${rgb}, 0.20)`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 40px rgba(0,0,0,0.40)",
        }}
      >
        {/* Section label */}
        <p
          className="text-[11px] font-extrabold uppercase tracking-[0.25em] mb-6"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          Balance Point
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
              background: "linear-gradient(90deg, rgba(96,165,250,0.35) 0%, rgba(255,255,255,0.10) 50%, rgba(244,114,182,0.40) 100%)",
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
                {HEAD_LIGHT_REF.toFixed(1)} cm
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
                {HEAD_HEAVY_REF.toFixed(1)} cm
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
