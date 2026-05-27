import { Paddle } from "@/types";

// Effective price = retail price minus the PLAYBOOK discount (percent or dollar).
// Used to decide what counts as "under $125" and to sort budget paddles.
export function effectivePrice(p: Paddle): number {
  if (!p.price) return Infinity;
  const base = parseFloat(p.price.replace(/[^0-9.]/g, ""));
  if (isNaN(base)) return Infinity;

  const off = p.amountOff?.trim();
  if (off && off !== "$0" && off !== "") {
    if (off.endsWith("%")) {
      const pct = parseFloat(off);
      if (!isNaN(pct)) return +(base * (1 - pct / 100)).toFixed(2);
    } else {
      const dollars = parseFloat(off.replace(/[^0-9.]/g, ""));
      if (!isNaN(dollars)) return +(base - dollars).toFixed(2);
    }
  }
  return base;
}

// All paddles whose effective (post-discount) price is below `maxPrice`,
// cheapest first.
export function getPaddlesUnder(maxPrice: number, list: Paddle[]): Paddle[] {
  return list
    .filter((p) => effectivePrice(p) < maxPrice)
    .sort((a, b) => effectivePrice(a) - effectivePrice(b));
}
