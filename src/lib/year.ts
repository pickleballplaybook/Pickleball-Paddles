// Auto-current year for "Best of [year]" titles and similar copy.
// Updates on each deploy — no manual edits each January.
export function currentYear(): number {
  return new Date().getUTCFullYear();
}
