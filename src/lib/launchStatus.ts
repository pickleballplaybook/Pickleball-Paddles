import type { Paddle } from "@/types";

/**
 * isPreLaunch
 * -----------
 * Returns true if the paddle has a future launch date — meaning the buy
 * buttons should render in "Coming Soon" mode and the affiliate links
 * shouldn't fire yet.
 *
 * Comparison uses the server's clock at render time. Pages with ISR
 * (`export const revalidate = 3600`) will flip from Coming Soon → live
 * within an hour of the launch moment as cached pages revalidate.
 */
export function isPreLaunch(paddle: Pick<Paddle, "launchAt">): boolean {
  if (!paddle.launchAt) return false;
  const launchTime = new Date(paddle.launchAt).getTime();
  if (Number.isNaN(launchTime)) return false;
  return launchTime > Date.now();
}

/**
 * formatLaunchButtonLabel
 * -----------------------
 * Returns the "Coming June 14th" string used on Buy buttons before launch.
 *
 * Two things this fixes vs a naive `toLocaleDateString`:
 *
 *   1. Timezone-pinned to America/New_York. launchAt strings on this site
 *      are anchored to ET (e.g. "2026-06-14T00:00:00-04:00" = midnight ET).
 *      Vercel renders server-side in UTC by default, so a naive formatter
 *      treats midnight ET as "still the 13th" in UTC and displays the
 *      wrong day. Pinning the formatter to ET fixes that.
 *
 *   2. Adds the English ordinal suffix ("14th", "1st", "22nd", "3rd"…)
 *      because that's how dates read in copy.
 *
 * Returns null if launchAt is missing or unparseable so the caller can
 * fall back to a generic "Coming Soon" string.
 */
export function formatLaunchButtonLabel(launchAt: string | undefined): string | null {
  if (!launchAt) return null;
  const d = new Date(launchAt);
  if (Number.isNaN(d.getTime())) return null;

  // Pull month + day in ET. en-US gives us "June" / "14" cleanly.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
  });
  const parts = fmt.formatToParts(d);
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const dayStr = parts.find((p) => p.type === "day")?.value ?? "";
  const day = parseInt(dayStr, 10);
  if (!month || Number.isNaN(day)) return null;

  // English ordinal suffix. 11/12/13 are always "th" regardless of last
  // digit; everything else follows the 1→st, 2→nd, 3→rd, else→th rule.
  const k = day % 100;
  const j = day % 10;
  const suffix =
    k >= 11 && k <= 13 ? "th" :
    j === 1 ? "st" :
    j === 2 ? "nd" :
    j === 3 ? "rd" :
    "th";

  return `Coming ${month} ${day}${suffix}`;
}

/**
 * formatLaunchDate
 * ----------------
 * Renders a paddle's launchAt as a human-readable string for the UI.
 * Example output: "June 15, 2026" or "Mon, Jun 15 · 12 AM ET".
 *
 * Pass `detailed: true` for the long form with time.
 */
export function formatLaunchDate(
  launchAt: string | undefined,
  opts: { detailed?: boolean } = {},
): string | null {
  if (!launchAt) return null;
  const d = new Date(launchAt);
  if (Number.isNaN(d.getTime())) return null;

  if (opts.detailed) {
    const date = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return `${date} · 12 AM ET`;
  }

  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
