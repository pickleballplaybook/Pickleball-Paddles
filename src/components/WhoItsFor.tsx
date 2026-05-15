import type { Paddle } from "@/types";
import { CheckCircle2, XCircle } from "lucide-react";

// ── Auto-generate Buy-if / Skip-if bullets from paddle data ──────────────────

function generateBuyIf(p: Paddle): string[] {
  const bullets: string[] = [];
  const sw = p.swingWeight;
  const tw = p.twistWeight;

  // Play style
  if (p.playStyle === "power")
    bullets.push("You want raw power and pop on drives and serves");
  if (p.playStyle === "control")
    bullets.push("You prioritize control, resets, and touch at the kitchen");
  if (p.playStyle === "all-court")
    bullets.push("You want a balanced paddle that does a little of everything");
  if (p.playStyle === "spin")
    bullets.push("You rely on heavy spin to control rallies");

  // Shape
  if (p.shape === "Elongated")
    bullets.push("You like extra reach and leverage on groundstrokes");
  if (p.shape === "Hybrid")
    bullets.push("You want a balanced sweet spot with decent reach");
  if (p.shape === "Widebody")
    bullets.push("You want the largest sweet spot and most forgiveness");

  // Swing weight
  if (sw > 0) {
    if (sw >= 118) bullets.push(`High swing weight (${sw}) gives you serious plow-through power`);
    else if (sw >= 112) bullets.push(`Medium swing weight (${sw}) offers a good balance of power and maneuverability`);
    else bullets.push(`Low swing weight (${sw}) means fast hands at the kitchen`);
  }

  // Thickness
  if (p.thickness === "16mm")
    bullets.push("You prefer the soft, forgiving feel of a 16mm core");
  if (p.thickness === "14mm")
    bullets.push("You want a snappier, more responsive 14mm core");

  // Twist weight
  if (tw > 0 && tw >= 5.75)
    bullets.push(`Good twist weight (${tw}) keeps off-center shots stable`);

  return bullets.slice(0, 4);
}

function generateSkipIf(p: Paddle): string[] {
  const bullets: string[] = [];
  const sw = p.swingWeight;
  const tw = p.twistWeight;

  // Shape trade-offs
  if (p.shape === "Elongated")
    bullets.push("You prefer a wider face for easier contact on fast exchanges");
  if (p.shape === "Widebody")
    bullets.push("You want more reach and leverage on groundstrokes");

  // Swing weight trade-offs
  if (sw > 0) {
    if (sw >= 118) bullets.push("You need fast hand speed at the net — this is a heavy swinger");
    else if (sw < 112) bullets.push("You want more power and plow-through on drives");
  }

  // Twist weight trade-offs
  if (tw > 0 && tw < 5.75)
    bullets.push(`Low twist weight (${tw}) means off-center hits lose more pace`);

  // Thickness trade-offs
  if (p.thickness === "16mm")
    bullets.push("You want maximum pop — thinner cores are snappier");
  if (p.thickness === "14mm")
    bullets.push("You want a softer, more cushioned feel on dinks and resets");

  // Price
  const price = p.price ? parseFloat(p.price.replace(/[^0-9.]/g, "")) : 0;
  if (price >= 250)
    bullets.push("You're on a tight budget — more affordable options exist");
  if (price > 0 && price < 120)
    bullets.push("You want premium materials and build quality");

  // Play style trade-offs
  if (p.playStyle === "power")
    bullets.push("You're a touch-first player who rarely drives");
  if (p.playStyle === "control")
    bullets.push("You want to overpower opponents with pace");

  return bullets.slice(0, 4);
}

export default function WhoItsFor({ paddle }: { paddle: Paddle }) {
  const buyIf = generateBuyIf(paddle);
  const skipIf = generateSkipIf(paddle);

  return (
    <div
      className="rounded-2xl p-6 md:p-8"
      style={{ background: "var(--flip-bg-card)", border: "1px solid var(--flip-card-border)" }}
    >
      <h2 className="text-2xl font-extrabold mb-6" style={{ color: "var(--flip-text-head)" }}>
        Who {paddle.name} Is For
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buy if */}
        <div
          className="rounded-xl p-5"
          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="font-bold text-green-400">Buy if</span>
          </div>
          <ul className="space-y-3">
            {buyIf.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--flip-text-body)" }}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Skip if */}
        <div
          className="rounded-xl p-5"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="font-bold text-red-400">Skip if</span>
          </div>
          <ul className="space-y-3">
            {skipIf.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--flip-text-body)" }}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
