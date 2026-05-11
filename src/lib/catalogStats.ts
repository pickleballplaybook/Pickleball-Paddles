import { paddles } from "@/data/paddles";

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
