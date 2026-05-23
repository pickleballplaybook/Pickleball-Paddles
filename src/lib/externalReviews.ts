/**
 * External review data — aggregated ratings from brand product pages.
 * Fetched via Judge.me API or stored statically for Loox brands.
 */

export interface ExternalReview {
  rating: number;
  count: number;
  sourceName: string;
  sourceUrl: string;
}

export interface ReviewSource {
  paddleSlugs: string[];
  platform: "judgeme" | "loox" | "static";
  shopDomain: string;        // for Judge.me API
  productUrl: string;        // canonical product page for linking
  sourceName: string;        // display name e.g. "Flik Pickleball"
  productHandle?: string;    // Shopify product handle for Judge.me
  staticRating?: number;     // for loox/static: pre-fetched rating
  staticCount?: number;      // for loox/static: pre-fetched count
}

/**
 * Map of paddle slugs to their external review source.
 * Only paddles with detectable review platforms are listed.
 */
export const REVIEW_SOURCES: ReviewSource[] = [
  // ── 11SIX24 ─────────────────────────────────────────────────────────────
  {
    paddleSlugs: ["11six24-vapor-power-2-hybrid"],
    platform: "judgeme",
    shopDomain: "11six24.com",
    productUrl: "https://11six24.com/collections/power-2/products/vapor-power-2",
    sourceName: "11SIX24",
    productHandle: "vapor-power-2",
  },
  {
    paddleSlugs: ["11six24-hurache-power-2-elongated"],
    platform: "judgeme",
    shopDomain: "11six24.com",
    productUrl: "https://11six24.com/collections/power-2/products/hurache-x-power-2",
    sourceName: "11SIX24",
    productHandle: "hurache-x-power-2",
  },
  {
    paddleSlugs: ["11six24-pegasus-power-2-widebody"],
    platform: "judgeme",
    shopDomain: "11six24.com",
    productUrl: "https://11six24.com/collections/power-2/products/pegasus-power-2",
    sourceName: "11SIX24",
    productHandle: "pegasus-power-2",
  },

  // ── Rev ──────────────────────────────────────────────────────────────────
  {
    paddleSlugs: ["rev-aria-pro-elongated"],
    platform: "judgeme",
    shopDomain: "www.revpickleball.com",
    productUrl: "https://www.revpickleball.com/products/aria-pro",
    sourceName: "Rev Pickleball",
    productHandle: "aria-pro",
  },
  {
    paddleSlugs: ["rev-radiance-elongated"],
    platform: "judgeme",
    shopDomain: "www.revpickleball.com",
    productUrl: "https://www.revpickleball.com/products/radiance-foam-pickleball-paddle",
    sourceName: "Rev Pickleball",
    productHandle: "radiance-foam-pickleball-paddle",
  },

  // ── Bread & Butter (Loco) ───────────────────────────────────────────────
  {
    paddleSlugs: ["bread-and-butter-loco-elongated", "bread-and-butter-loco-hybrid", "bread-and-butter-loco-widebody"],
    platform: "judgeme",
    shopDomain: "www.bnbpickleball.com",
    productUrl: "https://www.bnbpickleball.com/collections/loco/products/loco-16mm-pickleball-paddle-hybrid",
    sourceName: "Bread & Butter",
    productHandle: "loco-16mm-pickleball-paddle-hybrid",
  },

  // ── Judge.me brands ─────────────────────────────────────────────────────
  {
    paddleSlugs: ["flik-f3-triple-core-elongated", "flik-f3-triple-core-hybrid"],
    platform: "judgeme",
    shopDomain: "flikpickleball.com",
    productUrl: "https://flikpickleball.com/products/f3-triple-core-paddle",
    sourceName: "Flik Pickleball",
    productHandle: "f3-triple-core-paddle",
  },
  {
    paddleSlugs: ["enhance-turbo-epp-elongated", "enhance-turbo-epp-widebody", "enhance-turbo-epp-hybrid"],
    platform: "judgeme",
    shopDomain: "enhancepickleball.com",
    productUrl: "https://enhancepickleball.com/products/epp-turbo",
    sourceName: "Enhance Pickleball",
    productHandle: "epp-turbo",
  },
  {
    paddleSlugs: ["enhance-turbo-mpp-elongated"],
    platform: "judgeme",
    shopDomain: "enhancepickleball.com",
    productUrl: "https://enhancepickleball.com/products/mpp-turbo",
    sourceName: "Enhance Pickleball",
    productHandle: "mpp-turbo",
  },
  {
    paddleSlugs: ["enhance-banger-elongated"],
    platform: "judgeme",
    shopDomain: "enhancepickleball.com",
    productUrl: "https://enhancepickleball.com/products/banger",
    sourceName: "Enhance Pickleball",
    productHandle: "banger",
  },
  {
    paddleSlugs: ["kobo-thunder-axe-infinity-elongated"],
    platform: "judgeme",
    shopDomain: "www.kobopickleball.co",
    productUrl: "https://www.kobopickleball.co/products/kobo-thunder-axe-infinity-18mm",
    sourceName: "Kobo Pickleball",
    productHandle: "kobo-thunder-axe-infinity-18mm",
  },
  {
    paddleSlugs: ["rpm-q2-elongated"],
    platform: "judgeme",
    shopDomain: "rpmpb.com",
    productUrl: "https://rpmpb.com/products/rpm-q2-16mm-elongated-pickleball-paddle",
    sourceName: "RPM Pickleball",
    productHandle: "rpm-q2-16mm-elongated-pickleball-paddle",
  },
  {
    paddleSlugs: ["rpm-q2-widebody"],
    platform: "judgeme",
    shopDomain: "rpmpb.com",
    productUrl: "https://rpmpb.com/products/rpm-q2-16mm-widebody-pickleball-paddle",
    sourceName: "RPM Pickleball",
    productHandle: "rpm-q2-16mm-widebody-pickleball-paddle",
  },

  // ── Loox brands (static — no public API) ────────────────────────────────
  {
    paddleSlugs: ["avoura-rhapsody-elongated"],
    platform: "loox",
    shopDomain: "avourapickleball.com",
    productUrl: "https://avourapickleball.com/products/rhapsody-13-pickleball-paddle",
    sourceName: "Avoura Pickleball",
    staticRating: 4.7,
    staticCount: 299,
  },
];

/**
 * Find the review source for a paddle slug, if one exists.
 */
export function getReviewSource(paddleSlug: string): ReviewSource | undefined {
  return REVIEW_SOURCES.find((s) => s.paddleSlugs.includes(paddleSlug));
}
