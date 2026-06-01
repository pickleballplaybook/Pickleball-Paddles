import { paddles } from "@/data/paddles";

/** Returns a rounded paddle count label like "120+" based on the total paddle count.
 *  Rounds DOWN so the label is always conservative (never claims more than we have):
 *  - Under 500: rounds down to nearest 10 (123 → "120+")
 *  - 500–999: rounds down to nearest 50
 *  - 1000+: rounds down to nearest 100
 */
export function getPaddleCountLabel(): string {
  const count = paddles.length;
  let step: number;
  if (count >= 1000) step = 100;
  else if (count >= 500) step = 50;
  else step = 10;
  const rounded = Math.floor(count / step) * step;
  return `${rounded}+`;
}

export interface CatalogStats {
  swingWeight: { min: number; max: number; avg: number };
  twistWeight: { min: number; max: number; avg: number };
  weight:      { min: number; max: number; avg: number };
}

let cache: CatalogStats | null = null;

export function getCatalogStats(): CatalogStats {
  if (cache) return cache;

  const sws = paddles.map((p) => p.swingWeight).filter((v) => v > 0);
  const tws = paddles.map((p) => p.twistWeight).filter((v) => v > 0);
  const wts = paddles
    .map((p) => parseFloat(p.weight))
    .filter((v) => !isNaN(v) && v > 0);

  const stats = (arr: number[]) =>
    arr.length
      ? {
          min: Math.round(Math.min(...arr) * 100) / 100,
          max: Math.round(Math.max(...arr) * 100) / 100,
          avg: Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100,
        }
      : { min: 0, max: 0, avg: 0 };

  cache = {
    swingWeight: stats(sws),
    twistWeight: stats(tws),
    weight: stats(wts),
  };
  return cache;
}
