// ─────────────────────────────────────────────────────────────────────────────
//  TrendingCard
//  Shared IG-export-optimized 1:1 card used by /trending (top-10 weekly
//  ranking) and /specs (every paddle in the catalog). Extracted out of
//  trending/page.tsx so /specs can reuse the exact same render.
//
//  Render variants:
//    - rank > 0       → shows the podium-colored rank badge (gold/silver/bronze/teal)
//    - rank === 0     → no rank badge (used on /specs where paddles aren't ranked)
//    - totalCards > 0 → renders the bottom dot indicators
//    - totalCards = 0 → no dots (also for /specs)
//
//  Everything else — paddle image, balance-point dashed line + leader-line
//  legend, specs panel, discount-code chip, footer @PlaybookPaddles handle —
//  is identical between the two surfaces. Iterating on the card visual now
//  only touches this file.
// ─────────────────────────────────────────────────────────────────────────────

import { Paddle } from "@/types";
import { siteConfig } from "@/config/site";

// Design dimensions per export format. pixelRatio 1.8 scales each design
// canvas to its target PNG size:
//   - format "ig" (4:5 IG portrait):    600 × 750  → 1080 × 1350
//   - format "yt" (16:9 YT thumbnail): 1067 × 600  → 1920 × 1080
// Sub-pixel imprecision (1067 × 1.8 = 1920.6) collapses to whole pixels
// at capture time. Pixel-tuned measurements inside the card (font sizes,
// paddings, bar widths) were originally hand-tuned at width 600, so they
// read slightly smaller at the YT canvas's 1067 design width. The
// percentage-positioned content row (top-[20%] / bottom-[10%]) auto-
// stretches across whichever aspect the format provides.
export type CardFormat = "ig" | "yt";
export type FormatSpec = { width: number; height: number; aspect: string };
export const FORMAT_SPECS: Record<CardFormat, FormatSpec> = {
  ig: { width: 600,  height: 750, aspect: "4 / 5"  },
  yt: { width: 1067, height: 600, aspect: "16 / 9" },
};
export const EXPORT_PIXEL_RATIO = 1.8;
// Back-compat exports for /trending (always renders the IG 4:5 card).
export const EXPORT_WIDTH  = FORMAT_SPECS.ig.width;
export const EXPORT_HEIGHT = FORMAT_SPECS.ig.height;

// Returns the discount code to print on a card. Selkirk paddles use the
// influencer code ("INF-PLAYBOOK") unless the link points to Locker Room
// Pickleball, which honors the regular site-wide code.
export function getCode(brand: string, discountLink?: string): string {
  if (brand === "Selkirk" || brand === "SLK") {
    if (discountLink?.includes("lockerroompickleball.com")) return siteConfig.discountCode;
    return "INF-PLAYBOOK";
  }
  return siteConfig.discountCode;
}

// ── Stat bar ranges + zone descriptor labels ────────────────────────────────
// `zones` are read by StatBar to render a small uppercase descriptor under
// each value. Same vocabulary the SpecBar component uses on individual
// paddle pages so the language is consistent across surfaces.
//   Balance uses the user-approved trio: HEAD-LIGHT · AVERAGE · HEAD-HEAVY
//   (no 'Neutral' or 'Perfectly Balanced' since each paddle's actual
//    balance varies and 'average' just means 'sits in the typical band'.)
// `thresholds` (when present) anchors the zone boundaries to absolute values
// instead of dividing the min→max range into thirds. Each spec defines N
// zone labels and N-1 thresholds (the values where one zone ends and the
// next begins). Industry-standard cutoffs so a paddle is categorized the
// same way regardless of how the catalog's min/max shifts over time.
//   weight   (5 zones): <7.4 feather · 7.4-7.8 light · 7.81-8.19 avg ·
//                       8.2-8.4 mid-heavy · 8.41+ heavy
//   swing    (3 zones): <111 head-light · 111-118 avg · >118 head-heavy
//   twist    (5 zones): <5.0 poor · 5.0-5.49 fair · 5.5-5.89 good ·
//                       5.9-6.99 forgiving · 7.0+ elite
//   balance  (3 zones, relative): head-light / neutral / head-heavy
export const RANGES = {
  weight:       { min: 7.2, max: 9.2,  unit: "oz", zones: ["Featherweight", "Light", "Average", "Mid-Heavy", "Heavy"] as const, thresholds: [7.4, 7.81, 8.2, 8.41] as const },
  swingWeight:  { min: 95,  max: 125,  unit: "",   zones: ["Head-Light", "Average", "Head-Heavy"] as const, thresholds: [111, 118] as const },
  twistWeight:  { min: 4.5, max: 7.5,  unit: "",   zones: ["Poor", "Fair", "Good", "Forgiving", "Elite"] as const, thresholds: [5.0, 5.5, 5.9, 7.0] as const },
  balancePoint: { min: 22,  max: 26,   unit: "cm", zones: ["Head-Light", "Neutral", "Head-Heavy"] as const },
};

// Reference paddle length used to position the balance-point indicator line
// on the trending card. Same constant the BalancePointSpec component uses on
// individual paddle pages — kept as a single canonical reference instead of
// trying to derive it per paddle (which would require accurate per-paddle
// length data we don't have for most paddles yet).
export const PADDLE_HEIGHT_CM_REF = 41.0;

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function StatBar({ label, value, displayValue, min, max, fill, glow, zones, thresholds }: {
  label: string; value: number; displayValue: string; min: number; max: number;
  fill: string; glow: string;
  zones?: readonly string[];
  thresholds?: readonly number[];
}) {
  const pct = normalize(value, min, max) * 100;
  // Zone descriptor — if explicit thresholds are provided, use absolute
  // cutoffs. The number of zones is unbounded: N thresholds define N+1
  // zones (e.g. 4 thresholds for static weight produce 5 zones:
  // featherweight / light / average / mid-heavy / heavy). Without
  // thresholds we fall back to an even split of the min→max range across
  // however many labels `zones` contains, so the language stays consistent
  // with SpecBar on individual paddle pages.
  let zoneIdx: number;
  if (thresholds && thresholds.length > 0) {
    const idx = thresholds.findIndex((t) => value < t);
    zoneIdx = idx === -1 ? thresholds.length : idx;
  } else if (zones && zones.length > 0) {
    zoneIdx = Math.min(zones.length - 1, Math.floor((pct / 100) * zones.length));
  } else {
    zoneIdx = 1;
  }
  const descriptor = zones?.[zoneIdx];

  // Stacked layout: label + value on the top row (left/right), bar running
  // the full panel width underneath. The previous 3-column horizontal
  // layout starved the bar of width once the label and value got bigger,
  // making it impossible to tell where the fill landed.
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span
          className="text-[12px] font-bold uppercase tracking-[0.18em] whitespace-nowrap flex-shrink-0"
          style={{ color: "rgba(186,212,228,0.65)" }}
        >
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span
            className="text-[20px] font-extrabold font-mono tabular-nums leading-none"
            style={{ color: "rgba(255,255,255,0.94)", letterSpacing: "0.02em" }}
          >
            {displayValue}
          </span>
          {descriptor && (
            <span
              className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
              style={{ color: "rgba(45,212,191,0.85)", letterSpacing: "0.12em" }}
            >
              {descriptor}
            </span>
          )}
        </div>
      </div>
      <div
        className="h-2.5 rounded-full overflow-hidden relative w-full"
        style={{
          background: "rgba(255,255,255,0.04)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: fill,
            boxShadow: glow,
          }}
        />
      </div>
    </div>
  );
}

// ── Card component (1:1 square, screenshot-optimized for Instagram) ──────────
// `rank` controls the podium badge (0 = hidden, 1-3 = gold/silver/bronze, 4+ = teal).
// `totalCards` controls the bottom dot pager (0 = hidden, n > 0 = render n dots
// with the one at rank-1 highlighted). /specs passes 0 for both so the card
// reads as a clean per-paddle spec sheet.
export default function TrendingCard({ paddle, rank, code, totalCards, bareBackground = false, format = "ig" }: {
  paddle: Paddle; rank: number; code: string; totalCards: number;
  /** One-off template mode — renders only the PLAYBOOKPADDLES.COM banner
   *  on the card background so the export PNG can be used as a blank
   *  master template (paddle, specs, discount chip, footer all hidden). */
  bareBackground?: boolean;
  /** Aspect ratio to render at. "ig" = 4:5 (IG portrait 1080×1350, default),
   *  "yt" = 16:9 (YouTube thumbnail 1920×1080). The interior layout is
   *  identical between formats — header pins top, footer pins bottom, the
   *  paddle/specs row stretches percentage-positioned into whatever frame
   *  the format provides. */
  format?: CardFormat;
}) {
  const hasRealDiscount = !!paddle.discountLink?.trim() && !!paddle.amountOff && paddle.amountOff !== "$0" && paddle.amountOff !== "";
  const isSelkirk = paddle.brand === "Selkirk" || paddle.brand === "SLK";
  const isSelkirkGiftCard = isSelkirk && !hasRealDiscount && !!paddle.discountLink?.trim() && !paddle.discountLink.includes("lockerroompickleball.com");
  const showCodeChip = hasRealDiscount || isSelkirkGiftCard;
  const weightNum = parseFloat(paddle.weight) || 0;
  const playLabel = paddle.playStyle
    ? paddle.playStyle === "all-court" ? "All-Court" : paddle.playStyle.charAt(0).toUpperCase() + paddle.playStyle.slice(1)
    : paddle.shape;
  const playColors = {
    power:       { dot: "#f87171", text: "rgba(248,113,113,0.95)" },
    control:     { dot: "#4ade80", text: "rgba(74,222,128,0.95)" },
    "all-court": { dot: "#facc15", text: "rgba(250,204,21,0.95)" },
    spin:        { dot: "#fb923c", text: "rgba(251,146,60,0.95)" },
  } as const;
  const pc = playColors[paddle.playStyle as keyof typeof playColors] ?? { dot: "#2dd4bf", text: "rgba(45,212,191,0.95)" };

  // Podium colors — gold for #1, silver for #2, bronze for #3, on-brand
  // teal for everything else. Each variant tunes background, border,
  // shadow, and the numeric color inside the badge so it reads correctly
  // against the metallic gradient.
  const rankStyles: Record<"gold" | "silver" | "bronze" | "teal", {
    bg: string; border: string; shadow: string; num: string;
  }> = {
    gold: {
      bg:     "linear-gradient(135deg, #f4d28a 0%, #d4a35a 100%)",
      border: "rgba(244,210,138,0.75)",
      shadow: "0 8px 24px rgba(212,163,90,0.40), inset 0 1px 0 rgba(255,255,255,0.45)",
      num:    "#1a0f00",
    },
    silver: {
      bg:     "linear-gradient(135deg, #e5e7eb 0%, #94a3b8 100%)",
      border: "rgba(229,231,235,0.75)",
      shadow: "0 8px 24px rgba(148,163,184,0.38), inset 0 1px 0 rgba(255,255,255,0.50)",
      num:    "#0f172a",
    },
    bronze: {
      bg:     "linear-gradient(135deg, #d97a3a 0%, #92451c 100%)",
      border: "rgba(217,122,58,0.80)",
      shadow: "0 8px 24px rgba(146,69,28,0.40), inset 0 1px 0 rgba(255,255,255,0.30)",
      num:    "#1a0a05",
    },
    teal: {
      bg:     "linear-gradient(135deg, rgba(20,184,166,0.55) 0%, rgba(13,148,136,0.30) 100%)",
      border: "rgba(45,212,191,0.55)",
      shadow: "0 6px 20px rgba(20,184,166,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
      num:    "#fff",
    },
  };
  const podium = rank === 1 ? rankStyles.gold
    : rank === 2 ? rankStyles.silver
    : rank === 3 ? rankStyles.bronze
    : rankStyles.teal;
  const isTopRank = rank === 1;  // used for the gold dot indicator below

  // All bars use the brand teal — the descriptor under each value carries
  // the meaning (Light / Average / Heavy etc.) so the bar color doesn't
  // need to differentiate. Reads as a cohesive premium dashboard instead
  // of a multi-color stack.
  const TEAL_FILL = "linear-gradient(90deg, #0d9488 0%, #14b8a6 50%, #5eead4 100%)";
  const TEAL_GLOW = "0 0 8px rgba(45,212,191,0.40)";
  const BARS = {
    weight:  { fill: TEAL_FILL, glow: TEAL_GLOW },
    swing:   { fill: TEAL_FILL, glow: TEAL_GLOW },
    twist:   { fill: TEAL_FILL, glow: TEAL_GLOW },
    balance: { fill: TEAL_FILL, glow: TEAL_GLOW },
  };
  // Balance line + 'BAL PT' label use the site's yellow-green discount
  // accent (#defa32). It's the one place we let a non-teal color through
  // on the card so the line stays visible against the now all-teal stat
  // bars — the previous teal-on-teal treatment was getting lost.
  const BAL_ACCENT = "rgba(222,250,50,0.75)";

  // Vertical position (% from bottom of paddle image) where the balance
  // line should sit on the paddle. Clamped to leave a little headroom
  // top and bottom so an extreme value never pins the line into the
  // glow at the edge of the image.
  const balancePct = paddle.balancePoint
    ? Math.max(8, Math.min(92, (paddle.balancePoint / PADDLE_HEIGHT_CM_REF) * 100))
    : null;

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        aspectRatio: FORMAT_SPECS[format].aspect,
        background: [
          // Soft teal aurora top
          "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(20,184,166,0.16) 0%, transparent 65%)",
          // Subtle warm vignette bottom-right
          "radial-gradient(ellipse 70% 50% at 95% 95%, rgba(212,163,90,0.05) 0%, transparent 60%)",
          // Base gradient
          "linear-gradient(160deg, #0a1628 0%, #0c1e35 35%, #0d2a3a 60%, #08182a 100%)",
        ].join(", "),
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.08)",
          "inset 0 0 0 1px rgba(255,255,255,0.04)",
          "inset 0 -60px 100px rgba(0,0,0,0.35)",
          "0 20px 50px rgba(0,0,0,0.45)",
        ].join(", "),
      }}
    >
      {/* Rank badge — podium-colored: gold #1, silver #2, bronze #3, teal else.
          Hidden entirely when rank===0 (the /specs surface, where paddles
          aren't ranked — every paddle in the catalog gets a card). */}
      {rank > 0 && (
        <div
          className="absolute top-5 left-5 w-14 h-14 rounded-full flex items-center justify-center z-10"
          style={{
            background: podium.bg,
            border: `1.5px solid ${podium.border}`,
            boxShadow: podium.shadow,
          }}
        >
          <span
            className="text-xl font-extrabold tabular-nums"
            style={{
              color: podium.num,
              letterSpacing: "-0.02em",
              textShadow: rank <= 3 ? "0 1px 0 rgba(255,255,255,0.25)" : "none",
            }}
          >
            #{rank}
          </span>
        </div>
      )}

      {/* Header — PlaybookPaddles.com brand rule on top, then the actual
          paddle's brand + name + shape/thickness right below it. This
          frees the right-column spec panel to be a clean 'Specs' card
          with just the stat bars. */}
      <div className="absolute top-5 left-0 right-0 flex flex-col items-center gap-1.5 pointer-events-none z-10 px-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-6" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25))" }} />
          <p className="text-[14px] font-extrabold uppercase tracking-[0.35em]" style={{ color: "rgba(255,255,255,0.85)" }}>
            PlaybookPaddles.com
          </p>
          <span className="h-px w-6" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.25), transparent)" }} />
        </div>
        {!bareBackground && (
          <>
            <h2
              className="text-3xl md:text-4xl font-extrabold leading-tight text-center"
              style={{ color: "#ffffff", letterSpacing: "-0.015em" }}
            >
              {paddle.brand} {paddle.name}
            </h2>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.20em]"
              style={{ color: "rgba(186,212,228,0.60)" }}
            >
              {paddle.shape} · {paddle.thickness}
            </p>
          </>
        )}
      </div>

      {/* ── Main content row — horizontal split: paddle LEFT, specs RIGHT ──
          The header + footer keep their absolute positioning, this row fills
          the space in between. Hidden entirely in bareBackground mode so
          the export is a clean template (URL banner + background only). */}
      {!bareBackground && (
      <div className="absolute inset-x-0 top-[20%] bottom-[10%] flex items-stretch gap-3 px-5">

        {/* ── LEFT: paddle image — height-locked at 96% of the column so
                every paddle renders at the same size regardless of the
                source image's aspect ratio. Wider source images overflow
                horizontally and get clipped by overflow-hidden.
                On the 4:5 portrait card the column is much taller than on
                the old 1:1, so the paddle scales up naturally. */}
        <div className="relative flex-[0.50] flex items-center justify-center overflow-hidden">
          {/* Balance line — sits BEHIND the paddle (z-index 0 vs the
              image's z-index 1) so it's only visible on either side of
              the paddle silhouette. A small 'BAL PT' label sits just
              below the line on the right side, in the same amber tone,
              so the user knows what they're looking at without the
              diagonal leader cutting across the spec card. */}
          {balancePct !== null && (
            <>
              {/* Evenly-distributed dashes via flex + justify-between.
                  Guarantees a complete dash at BOTH the leftmost and
                  rightmost edge of the column — the previous gradient
                  approach was clipping the right-edge dash mid-stroke.
                  Flex auto-distributes the gaps to fill the column width
                  regardless of breakpoint, so every dash stays the same
                  length and both ends land on a full one. */}
              <div
                aria-hidden
                className="absolute left-0 right-0 flex justify-between items-center pointer-events-none z-[0]"
                style={{ bottom: `${balancePct}%`, height: 3, marginBottom: -1.5 }}
              >
                {Array.from({ length: 11 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 14,
                      height: 3,
                      background: BAL_ACCENT,
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              {/* Leader-line layout: small 'BAL PT' tag sits just below
                  the dashed line at balance height. A thin solid vertical
                  line runs from below that tag down to a legend block at
                  the bottom-left of the paddle column (in the open space
                  to the left of the handle), where the cm value and the
                  category word live. Keeps everything off the paddle's
                  silhouette and reads like a technical-illustration
                  callout. */}
              {(() => {
                const bp = paddle.balancePoint!;
                const bpPct = ((bp - RANGES.balancePoint.min) / (RANGES.balancePoint.max - RANGES.balancePoint.min)) * 100;
                const bpZone =
                  bpPct < 33.4 ? RANGES.balancePoint.zones[0] :
                  bpPct > 66.6 ? RANGES.balancePoint.zones[2] :
                                 RANGES.balancePoint.zones[1];
                // Connector line geometry:
                //   - vertical line at left: 12, so it visually aligns
                //     with the legend below
                //   - top: just below the dashed line (line% + 4px)
                //   - bottom: just above the legend block (~30% from
                //     the column bottom, leaving room for the legend)
                return (
                  <>
                    {/* Thin solid leader line — vertical, connects the
                        dashed BAL PT line down to the legend that sits
                        halfway up the grip. The 'BAL PT' label itself
                        lives at the top of the legend now (above the cm
                        value), so the line runs uninterrupted from the
                        dashed line straight down to the legend. */}
                    <div
                      aria-hidden
                      className="absolute pointer-events-none z-[2]"
                      style={{
                        top:    `calc(${100 - balancePct}% + 4px)`,
                        bottom: "36%",
                        left:   12,
                        width:  1,
                        background: BAL_ACCENT,
                        opacity: 0.55,
                      }}
                    />

                    {/* Legend positioned at ~22% from the column bottom
                        — visually about halfway up the paddle's grip.
                        Open margin to the left of the grip is wide
                        enough that the category word (Head-Heavy etc.)
                        never crowds the paddle silhouette. Stack order
                        top → bottom: BAL PT label · cm value · zone. */}
                    <div
                      aria-hidden
                      className="absolute pointer-events-none z-[2] flex flex-col items-start"
                      style={{
                        bottom: "22%",
                        left:   4,
                        whiteSpace: "nowrap",
                        lineHeight: 1.15,
                        textShadow: "0 1px 3px rgba(0,0,0,0.75)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          letterSpacing: "0.20em",
                          textTransform: "uppercase",
                          color: BAL_ACCENT,
                          opacity: 0.85,
                          marginBottom: 2,
                        }}
                      >
                        Bal Pt
                      </span>
                      <span
                        className="font-mono tabular-nums"
                        style={{
                          fontSize: "22px",
                          fontWeight: 800,
                          color: BAL_ACCENT,
                        }}
                      >
                        {bp.toFixed(1)} cm
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: BAL_ACCENT,
                          opacity: 0.85,
                          marginTop: 2,
                        }}
                      >
                        {bpZone}
                      </span>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {paddle.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={paddle.image}
              alt={`${paddle.brand} ${paddle.name}`}
              className="relative z-[1] h-[96%] w-auto max-w-none object-contain"
              style={{ filter: "drop-shadow(0 22px 38px rgba(0,0,0,0.60)) drop-shadow(0 4px 12px rgba(0,0,0,0.42))" }}
            />
          )}
          {/* Pedestal glow under the paddle */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-8 w-[68%] h-3 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 75%)", filter: "blur(6px)" }}
          />
          {/* Play-style badge — under the paddle, in its column.
              `whiteSpace: nowrap` prevents the hyphen in 'All-Court' from
              wrapping to a second line (which would extend the pill past
              the column's overflow-hidden bottom and clip the second word).
              Positioned a few px inside the column so the pill is fully
              visible regardless of label length. */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[2]">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full"
              style={{
                background: "rgba(8,18,32,0.7)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: pc.text,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                whiteSpace: "nowrap",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc.dot, boxShadow: `0 0 6px ${pc.dot}` }} />
              {playLabel}
            </span>
          </div>
        </div>

        {/* ── RIGHT: specs panel on top, discount-code chip directly below. */}
        <div className="relative flex-[0.50] flex flex-col gap-3 self-center">

          {/* Spec panel — glassy, contains brand/name + stat bars */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            {/* 'Specs' title only. Brand, name, shape, and thickness all
                live in the card header above the paddle image now, so
                this panel can be much shorter and lets the stat bars
                breathe. */}
            <div>
              <h2
                className="text-xl font-extrabold text-white leading-tight"
                style={{ letterSpacing: "-0.01em" }}
              >
                Specs
              </h2>
            </div>

            {/* Hairline divider */}
            <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />

            {/* Stat bars */}
            <div className="flex flex-col gap-2">
              <StatBar
                label="Weight"
                value={weightNum}
                displayValue={paddle.weight}
                min={RANGES.weight.min}
                max={RANGES.weight.max}
                fill={BARS.weight.fill}
                glow={BARS.weight.glow}
                zones={RANGES.weight.zones}
                thresholds={RANGES.weight.thresholds}
              />
              {paddle.swingWeight > 0 && (
                <StatBar
                  label="Swing Wt"
                  value={paddle.swingWeight}
                  displayValue={paddle.swingWeight.toFixed(1)}
                  min={RANGES.swingWeight.min}
                  max={RANGES.swingWeight.max}
                  fill={BARS.swing.fill}
                  glow={BARS.swing.glow}
                  zones={RANGES.swingWeight.zones}
                  thresholds={RANGES.swingWeight.thresholds}
                />
              )}
              {paddle.twistWeight > 0 && (
                <StatBar
                  label="Twist Wt"
                  value={paddle.twistWeight}
                  displayValue={paddle.twistWeight.toFixed(2)}
                  min={RANGES.twistWeight.min}
                  max={RANGES.twistWeight.max}
                  fill={BARS.twist.fill}
                  glow={BARS.twist.glow}
                  zones={RANGES.twistWeight.zones}
                  thresholds={RANGES.twistWeight.thresholds}
                />
              )}
              {/* Bal Pt row removed from the spec panel — the on-paddle
                  label ('BAL PT 24.1 cm' next to the dashed line) is now
                  the sole place the balance reading appears, so the
                  panel isn't repeating itself. */}
            </div>
          </div>

          {/* Discount-code chip — sits directly below the Specs panel.
              Center-aligned and visually distinct from the glassy Specs
              panel above: darker semi-solid backdrop, brighter teal border,
              soft teal glow so it reads as a call-to-action rather than a
              second data card. */}
          {showCodeChip && (
            <div
              className="rounded-xl px-4 py-3 text-center"
              style={{
                background: "linear-gradient(180deg, rgba(6,14,26,0.85) 0%, rgba(10,22,40,0.85) 100%)",
                border: "1.5px solid rgba(45,212,191,0.65)",
                boxShadow: "0 0 22px rgba(20,184,166,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                Discount Code
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-xl font-extrabold font-mono tracking-wider" style={{ color: "#5eead4" }}>{code}</span>
                <span className="text-[15px] font-extrabold" style={{ color: "#defa32" }}>
                  · {hasRealDiscount ? `${paddle.amountOff} off` : "Free gift card"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Footer branding — YouTube logo + @PlaybookPaddles handle on
          the bottom-left so anyone screenshotting the card can find
          the channel. Bottom-right url removed (it's already in the
          header at the top). Hidden in bareBackground mode. */}
      {!bareBackground && (
      <div className="absolute bottom-3 left-5 right-5 flex items-center pointer-events-none z-10">
        <div className="inline-flex items-center gap-2">
          {/* YouTube glyph — official red rounded-rect with white play
              triangle. Inline SVG so we don't pull a brand-asset
              dependency just for one icon. */}
          <svg width="20" height="14" viewBox="0 0 28 20" aria-hidden style={{ flexShrink: 0 }}>
            <path
              d="M27.4 3.13a3.51 3.51 0 0 0-2.47-2.49C22.74 0 14 0 14 0S5.26 0 3.07.64A3.51 3.51 0 0 0 .6 3.13C0 5.34 0 10 0 10s0 4.66.6 6.87a3.51 3.51 0 0 0 2.47 2.49C5.26 20 14 20 14 20s8.74 0 10.93-.64a3.51 3.51 0 0 0 2.47-2.49C28 14.66 28 10 28 10s0-4.66-.6-6.87z"
              fill="#FF0000"
            />
            <path d="M11.2 14.29 18.46 10 11.2 5.71v8.58z" fill="#ffffff" />
          </svg>
          <p
            className="text-[12px] font-extrabold uppercase"
            style={{ color: "rgba(255,255,255,0.80)", letterSpacing: "0.12em" }}
          >
            @PlaybookPaddles
          </p>
        </div>
      </div>
      )}

      {/* Dot indicators — refined oval shape. Skipped on /specs
          (totalCards=0) where there's no pager context for them to
          reference. */}
      {totalCards > 0 && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1 pointer-events-none z-10">
          {Array.from({ length: totalCards }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === rank - 1 ? 12 : 4,
                height: 3,
                background: i === rank - 1
                  ? (isTopRank ? "linear-gradient(90deg, #f4d28a, #d4a35a)" : "linear-gradient(90deg, #2dd4bf, #14b8a6)")
                  : "rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
