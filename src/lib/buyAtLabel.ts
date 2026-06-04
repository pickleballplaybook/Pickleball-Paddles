/**
 * buyAtLabel
 * ----------
 * Returns the "Buy at X" CTA label for a paddle's brand.
 *
 * Just "Buy at {brand}" — no suffix, same for every brand. Kept as a single-
 * line helper so future label changes are one edit instead of 12.
 */
export function buyAtLabel(brand: string): string {
  return `Buy at ${brand}`;
}
