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
//  forExport (default false):
//    - false → themed card using CSS variables; adapts to light/dark mode on the page.
//    - true  → original hardcoded dark skin used for PNG export via html-to-image.
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
export const RANGES = {
  weight:       { min: 7.2, max: 9.2,  unit: "oz", zones: ["Featherweight", "Light", "Average", "Mid-Heavy", "Heavy"] as const, thresholds: [7.4, 7.81, 8.2, 8.41] as const },
  swingWeight:  { min: 95,  max: 125,  unit: "",   zones: ["Head-Light", "Average", "Head-Heavy"] as const, thresholds: [111, 118] as const },
  twistWeight:  { min: 4.5, max: 7.5,  unit: "",   zones: ["Poor", "Fair", "Good", "Forgiving", "Elite"] as const, thresholds: [5.0, 5.5, 5.9, 7.0] as const },
  balancePoint: { min: 22,  max: 26,   unit: "cm", zones: ["Head-Light", "Neutral", "Head-Heavy"] as const },
};

export const PADDLE_HEIGHT_CM_REF = 41.0;

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function StatBar({ label, value, displayValue, min, max, fill, glow, zones, thresholds, forExport }: {
  label: string; value: number; displayValue: string; min: number; max: number;
  fill: string; glow: string;
  zones?: readonly string[];
  thresholds?: readonly number[];
  forExport: boolean;
}) {
  const pct = normalize(value, min, max) * 100;
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

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[11px] font-bold uppercase tracking-[0.20em] whitespace-nowrap"
          style={{ color: forExport ? "rgba(186,212,228,0.50)" : "var(--text-muted)" }}
        >
          {label}
        </span>
        {descriptor && (
          <span
            className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
            style={{ color: "#5a9df9" }}
          >
            {descriptor}
          </span>
        )}
      </div>
      <span
        className="text-[26px] font-extrabold font-mono tabular-nums leading-none"
        style={{ color: forExport ? "rgba(255,255,255,0.95)" : "var(--text-primary)", letterSpacing: "0.01em" }}
      >
        {displayValue}
      </span>
      <div
        className="h-3 rounded-full overflow-hidden relative w-full"
        style={{
          background: forExport
            ? "rgba(255,255,255,0.05)"
            : "var(--bg-section)",
          boxShadow: forExport
            ? "inset 0 1px 2px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.03)"
            : "inset 0 1px 2px rgba(0,0,0,0.08)",
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: fill, boxShadow: glow }}
        />
      </div>
    </div>
  );
}

// ── Card component ────────────────────────────────────────────────────────────
export default function TrendingCard({ paddle, rank, code, totalCards, bareBackground = false, format = "ig", forExport = false }: {
  paddle: Paddle; rank: number; code: string; totalCards: number;
  bareBackground?: boolean;
  format?: CardFormat;
  /** When true, renders the original hardcoded dark skin for PNG export.
   *  When false (default), adapts to the page's light/dark theme. */
  forExport?: boolean;
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
  const pc = playColors[paddle.playStyle as keyof typeof playColors] ?? { dot: "#5a9df9", text: "rgba(90,157,249,0.95)" };

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
      bg:     "linear-gradient(135deg, rgba(90,157,249,0.55) 0%, rgba(42,100,200,0.30) 100%)",
      border: "rgba(90,157,249,0.55)",
      shadow: "0 6px 20px rgba(90,157,249,0.30), inset 0 1px 0 rgba(255,255,255,0.18)",
      num:    "#fff",
    },
  };
  const podium = rank === 1 ? rankStyles.gold
    : rank === 2 ? rankStyles.silver
    : rank === 3 ? rankStyles.bronze
    : rankStyles.teal;
  const isTopRank = rank === 1;

  // Bar fill: slightly brighter blue in page mode so it reads on light bg
  const BAR_FILL = forExport
    ? "linear-gradient(90deg, #11295f 0%, #0a64bc 50%, #0a64bc 100%)"
    : "linear-gradient(90deg, #3a8bf0 0%, #5a9df9 100%)";
  const BAR_GLOW = forExport
    ? "0 0 8px rgba(10, 100, 188,0.40)"
    : "0 0 8px rgba(90,157,249,0.40)";

  const BARS = {
    weight:  { fill: BAR_FILL, glow: BAR_GLOW },
    swing:   { fill: BAR_FILL, glow: BAR_GLOW },
    twist:   { fill: BAR_FILL, glow: BAR_GLOW },
    balance: { fill: BAR_FILL, glow: BAR_GLOW },
  };

  const balancePct = paddle.balancePoint
    ? Math.max(8, Math.min(92, (paddle.balancePoint / PADDLE_HEIGHT_CM_REF) * 100))
    : null;
  void balancePct;

  // ── Card background ─────────────────────────────────────────────────────────
  const cardBackground = forExport
    ? [
        "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(10, 100, 188,0.30) 0%, transparent 65%)",
        "radial-gradient(ellipse 70% 50% at 95% 95%, rgba(212,163,90,0.05) 0%, transparent 60%)",
        "linear-gradient(160deg, #0a1628 0%, #0c1e35 35%, #0d2a3a 60%, #08182a 100%)",
      ].join(", ")
    : "var(--bg-card)";

  const cardBoxShadow = forExport
    ? [
        "inset 0 1px 0 rgba(255,255,255,0.08)",
        "inset 0 0 0 1px rgba(255,255,255,0.04)",
        "inset 0 -60px 100px rgba(0,0,0,0.35)",
        "0 20px 50px rgba(0,0,0,0.45)",
      ].join(", ")
    : "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)";

  // ── Text colors ─────────────────────────────────────────────────────────────
  const siteBannerColor   = forExport ? "rgba(255,255,255,0.85)" : "var(--text-muted)";
  const paddleNameColor   = forExport ? "#ffffff" : "var(--text-primary)";
  const subtitleColor     = forExport ? "rgba(186,212,228,0.60)" : "var(--text-muted)";
  const footerHandleColor = forExport ? "rgba(255,255,255,0.80)" : "var(--text-muted)";
  const inactiveDotColor  = forExport ? "rgba(255,255,255,0.18)" : "var(--border)";

  // ── Panel / chip backgrounds ─────────────────────────────────────────────────
  const specPanelBg = forExport
    ? "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)"
    : "var(--bg-section)";
  const specPanelBorder  = forExport ? "1px solid rgba(255,255,255,0.09)" : "1px solid var(--border)";
  const specPanelShadow  = forExport
    ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 24px rgba(0,0,0,0.25)"
    : "0 2px 8px rgba(0,0,0,0.06)";

  const playBadgeBg     = forExport ? "rgba(8,18,32,0.7)"      : "var(--bg-section)";
  const playBadgeBorder = forExport ? "rgba(255,255,255,0.10)" : "var(--border)";

  const chipBg     = forExport
    ? "linear-gradient(180deg, rgba(6,14,26,0.85) 0%, rgba(10,22,40,0.85) 100%)"
    : "var(--bg-section)";
  const chipBorder = forExport ? "rgba(10, 100, 188,0.65)" : "rgba(90,157,249,0.45)";
  const chipShadow = forExport
    ? "0 0 22px rgba(10, 100, 188,0.30), inset 0 1px 0 rgba(255,255,255,0.05)"
    : "0 0 16px rgba(90,157,249,0.15)";
  const chipLabelColor = forExport ? "rgba(255,255,255,0.55)" : "var(--text-muted)";

  // Horizontal rule lines flanking the site banner
  const hrColor = forExport
    ? undefined  // uses inline gradient below
    : "var(--border)";

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        aspectRatio: FORMAT_SPECS[format].aspect,
        background: cardBackground,
        border: forExport ? undefined : "1px solid var(--border)",
        boxShadow: cardBoxShadow,
      }}
    >
      {/* Rank badge */}
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

      {/* Header */}
      <div className="absolute top-5 left-0 right-0 flex flex-col items-center gap-1.5 pointer-events-none z-10 px-16">
        <div className="flex items-center gap-3">
          {forExport ? (
            <span className="h-px w-6" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25))" }} />
          ) : (
            <span className="h-px w-6" style={{ background: hrColor }} />
          )}
          <p className="text-[14px] font-extrabold uppercase tracking-[0.35em]" style={{ color: siteBannerColor }}>
            PlaybookPaddles.com
          </p>
          {forExport ? (
            <span className="h-px w-6" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.25), transparent)" }} />
          ) : (
            <span className="h-px w-6" style={{ background: hrColor }} />
          )}
        </div>
        {!bareBackground && (
          <>
            <h2
              className={`${format === "yt" ? "text-xl" : "text-3xl md:text-4xl"} font-extrabold leading-tight text-center`}
              style={{ color: paddleNameColor, letterSpacing: "-0.015em" }}
            >
              {paddle.brand} {paddle.name}
            </h2>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.20em]"
              style={{ color: subtitleColor }}
            >
              {paddle.shape} · {paddle.thickness}
            </p>
          </>
        )}
      </div>

      {/* Main content row — leaves bottom 20% for the code strip */}
      {!bareBackground && (
      <div className="absolute inset-x-0 top-[20%] bottom-[20%] flex items-stretch gap-3 px-5">

        {/* LEFT: paddle — upright, fills the left column */}
        <div className="relative flex-[0.50]" style={{ overflow: "visible" }}>
          {paddle.image && (() => {
            // Explicit pixel dimensions on both axes — width:"auto" collapses
            // to 0 inside a CSS contain:inline-size ancestor (the /specs page
            // containerType wrapper), so we set width === height since all
            // paddle images are normalized 1000×1000 squares.
            const contentH = FORMAT_SPECS[format].height * 0.60;
            const imgH     = Math.round(contentH * (format === "ig" ? 1.45 : 1.60));
            const imgTopPx = -Math.round(contentH * (format === "ig" ? 0.23 : 0.18));
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={paddle.image}
                alt={`${paddle.brand} ${paddle.name}`}
                style={{
                  position: "absolute",
                  top: `${imgTopPx}px`,
                  left: "55%",
                  height: `${imgH}px`,
                  width: `${imgH}px`,
                  objectFit: "contain",
                  transform: "translateX(-50%)",
                  filter: forExport
                    ? "drop-shadow(0 22px 44px rgba(0,0,0,0.65)) drop-shadow(0 4px 14px rgba(0,0,0,0.45))"
                    : "drop-shadow(0 12px 28px rgba(0,0,0,0.20)) drop-shadow(0 2px 8px rgba(0,0,0,0.12))",
                }}
              />
            );
          })()}
        </div>

        {/* RIGHT: specs panel */}
        <div className="relative flex-[0.50] flex flex-col gap-3 self-center" style={{ zIndex: 2 }}>
          <div
            className="rounded-2xl px-5 py-4 flex flex-col gap-3"
            style={{
              background: specPanelBg,
              border: specPanelBorder,
              boxShadow: specPanelShadow,
            }}
          >
            <div className="flex flex-col gap-4">
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
                forExport={forExport}
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
                  forExport={forExport}
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
                  forExport={forExport}
                />
              )}
              {paddle.balancePoint && (
                <StatBar
                  label="Bal Pt"
                  value={paddle.balancePoint}
                  displayValue={`${paddle.balancePoint.toFixed(1)} cm`}
                  min={RANGES.balancePoint.min}
                  max={RANGES.balancePoint.max}
                  fill={BARS.balance.fill}
                  glow={BARS.balance.glow}
                  zones={RANGES.balancePoint.zones}
                  forExport={forExport}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* PLAYBOOK code — big, gold, centered just below the content row */}
      {!bareBackground && showCodeChip && (
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center pointer-events-none z-10">
          <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.40em", textTransform: "uppercase", color: forExport ? "rgba(255,255,255,0.30)" : "var(--text-muted)", marginBottom: "4px" }}>
            Discount Code
          </p>
          <div
            className="flex items-baseline gap-2"
            style={forExport ? undefined : {
              background: "var(--bg-section)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "4px 14px",
            }}
          >
            <span style={{ fontSize: "28px", fontWeight: 900, fontFamily: "ui-monospace, monospace", letterSpacing: "0.05em", color: forExport ? "#f4d28a" : "var(--text-primary)" }}>
              {code}
            </span>
            {hasRealDiscount && (
              <span style={{ fontSize: "14px", fontWeight: 700, color: forExport ? "rgba(255,255,255,0.55)" : "var(--text-muted)" }}>
                · {paddle.amountOff} off
              </span>
            )}
            {isSelkirkGiftCard && !hasRealDiscount && (
              <span style={{ fontSize: "14px", fontWeight: 700, color: forExport ? "rgba(255,255,255,0.55)" : "var(--text-muted)" }}>
                · Free gift
              </span>
            )}
          </div>
        </div>
      )}

      {/* Play badge — bottom-right corner */}
      {!bareBackground && (
        <div className="absolute bottom-4 right-5 pointer-events-none z-10">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full"
            style={{
              background: playBadgeBg,
              border: `1px solid ${playBadgeBorder}`,
              color: pc.text,
              boxShadow: forExport ? "inset 0 1px 0 rgba(255,255,255,0.06)" : undefined,
              whiteSpace: "nowrap",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc.dot, boxShadow: `0 0 6px ${pc.dot}` }} />
            {playLabel}
          </span>
        </div>
      )}

      {/* Dot indicators */}
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
                  ? (isTopRank ? "linear-gradient(90deg, #f4d28a, #d4a35a)" : "linear-gradient(90deg, #5a9df9, #3a8bf0)")
                  : inactiveDotColor,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
