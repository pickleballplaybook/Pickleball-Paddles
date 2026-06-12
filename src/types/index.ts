// ─────────────────────────────────────────────────────────────────────────────
//  Core paddle types — sourced from CSV columns:
//  Brand | Paddle Name | Shape | Weight | Swing Weight | Twist Weight |
//  Thickness | Amount off | Discount link
// ─────────────────────────────────────────────────────────────────────────────

export interface PaddleRatings {
  power: number;      // 1–10
  spin: number;       // 1–10
  control: number;    // 1–10
  pop: number;        // 1–10 (legacy)
  handSpeed: number;  // 1–10
}

export type SkillLevel    = "beginner" | "intermediate" | "advanced" | "all";
export type PlayStyle     = "power" | "control" | "all-court" | "spin";
export type BudgetCategory = "under-100" | "100-150" | "150-plus";

export interface Paddle {
  // ── Required CSV fields ───────────────────────────────────────────────────
  id: string;
  slug: string;         // derived from Brand + Paddle Name + Shape (unique)
  brand: string;        // CSV: Brand
  name: string;         // CSV: Paddle Name
  shape: string;        // CSV: Shape
  weight: string;       // CSV: Weight  (e.g. "8.0 oz")
  swingWeight: number;  // CSV: Swing Weight
  twistWeight: number;  // CSV: Twist Weight
  // Balance point in cm, measured from the butt of the handle. Optional —
  // the BalancePointSpec component on the paddle detail page renders only
  // when a value is set, so populating these can be a rolling effort.
  // Typical pickleball range: 22–26 cm. Below ~23.5 = head-light;
  // 23.5–24.0 = balanced; above ~24.0 = head-heavy.
  balancePoint?: number;
  thickness: string;    // CSV: Thickness (e.g. "16mm")
  amountOff: string;    // CSV: Amount off — "$10", "10%", "$0", or ""
  discountLink: string; // CSV: Discount link — empty string means no link

  // ── Optional enrichment fields (added when a full review is published) ────
  tagline?: string;
  description?: string;
  image?: string;
  price?: string;
  badge?: string;
  ratings?: PaddleRatings;
  reviewUrl?: string;        // CSV: Review column — full YouTube URL
  // Optional secondary featured review — used for head-to-head or special
  // crossover videos that should appear ALONGSIDE the primary review, not
  // replace it. Renders below the main review with a "Featured" label.
  featuredReviewUrl?: string;
  manualVideoId?: string;

  // ── Categorisation ────────────────────────────────────────────────────────
  skillLevel?: SkillLevel;
  playStyle?: PlayStyle;
  budgetCategory?: BudgetCategory;
  sweetSpot?: "large" | "medium" | "small";

  // ── Series / family grouping ──────────────────────────────────────────────
  seriesSlug?: string;    // paddles with same seriesSlug are shown together on /series/[slug]

  // ── Extended dimensions (optional; populated as measured) ─────────────────
  // These power the "Specifications" card on the paddle detail page. Each
  // is a free-form string so unit/format stays consistent with how brands
  // publish ("16.5\"", "4 1/4\"", etc.). Skipped rows just don't render.
  paddleLength?: string;
  paddleWidth?: string;
  handleLength?: string;
  gripSize?: string;

  // ── Categories / certifications ───────────────────────────────────────────
  // Free-form so brands' inconsistent generation labels still fit
  // ("Gen 3", "Gen 4", "Pro IV"). yearReleased is the calendar year the
  // paddle launched. usapApproved drives a green checkmark on the
  // Specifications card.
  generation?: string;
  yearReleased?: string;
  usapApproved?: boolean;

  // ── Catalog metadata ──────────────────────────────────────────────────────
  addedAt: string;        // ISO date — powers "Just Added"
  trendingScore: number;  // 0–100 — powers "What's Trending"

  // Optional launch date. When set AND in the future, the buy buttons swap
  // to a "Coming Soon" state. Use a full ISO string with timezone offset
  // (e.g. "2026-06-15T00:00:00-04:00" for midnight ET). Helper: isPreLaunch().
  launchAt?: string;
}

// ── Filter types ──────────────────────────────────────────────────────────────

export type SortOption =
  | "default"
  | "price-high"
  | "price-low"
  | "newest"
  | "oldest"
  | "most-hearts"
  | "popular-month"
  | "power"
  | "control"
  | "spin"
  | "twist-weight";

// ── Price cache — populated by server-side sync ────────────────────────────────

export type PriceStatus = "active" | "unavailable" | "failed" | "pending";

export interface PriceCacheEntry {
  currentPrice:  number | null;
  originalPrice: number | null;
  currency:      string;
  lastChecked:   string | null;   // ISO timestamp
  status:        PriceStatus;
  retailer:      string | null;
}

export type PriceCache = Record<string, PriceCacheEntry>;

export interface ActiveFilters {
  brand: string;
  shape: string;
  priceRange: string;
  playStyle: string;
  thickness: string;
  sweetSpot: string;
  sort: SortOption;
}

// ── Reaction types ─────────────────────────────────────────────────────────────

export type Reaction      = "heart" | "dislike" | null;
export type ReactionEntry = { r: "heart" | "dislike"; ts: number };
export type ReactionMap   = Record<string, ReactionEntry>;

// ── Review group — one card per unique review video ────────────────────────────

export interface ReviewGroup {
  videoId: string;
  brand: string;
  title: string;                       // e.g. "11SIX24 Power 2 Review"
  paddles: { name: string; slug: string }[]; // all paddles in this review
  primarySlug: string;                 // highest-trending paddle's page
  reviewDate: string;                  // ISO "YYYY-MM-DD" or ""
  viewCount?: number;                  // fetched from YouTube Statistics API
}

// ── YouTube types ─────────────────────────────────────────────────────────────

export interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
}
