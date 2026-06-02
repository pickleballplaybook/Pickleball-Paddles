// ─────────────────────────────────────────────────────────────────────────────
//  CENTRAL SITE CONFIG
//  Edit this file to update: site name, logo, YouTube settings, featured paddle
// ─────────────────────────────────────────────────────────────────────────────

export const siteConfig = {
  // ── Branding ────────────────────────────────────────────────────────────────
  name: "Pickleball Playbook",
  tagline: "Every paddle. Every review. Every discount.",
  discountCode: "PLAYBOOK",

  // ── Logo ────────────────────────────────────────────────────────────────────
  // Drop your logo file into /public/ and update the path below.
  // Supported formats: .svg (recommended), .png, .webp
  // To swap the logo: replace /public/logo.svg with your file, update path here.
  logoPath: "/images/Logo.svg",
  logoWidth: 36,   // px — display width in nav
  logoHeight: 36,  // px — display height in nav

  // ── YouTube ─────────────────────────────────────────────────────────────────
  // Channel URL — shown in footer and reviews page
  youtubeChannelUrl: "https://www.youtube.com/channel/UCikz-D2j4_jMVYZrQuPin6A",

  // Paddle Reviews Playlist URL
  // REPLACE the placeholder below with your actual playlist URL when ready.
  // Format: https://www.youtube.com/playlist?list=YOUR_PLAYLIST_ID
  youtubePlaylistUrl: "https://www.youtube.com/playlist?list=REPLACE_WITH_YOUR_PLAYLIST_ID",

  // YouTube Data API v3 key — needed for auto-matching reviews from the playlist.
  // Get one free at: https://console.developers.google.com
  // Leave empty ("") to disable auto-fetch; site will use manual video IDs only.
  youtubeApiKey: "",

  // ── Homepage — Hottest Paddle Right Now ─────────────────────────────────────
  // The paddle (or series) featured in the top hero slot.
  // Swap the slug to change the featured paddle; update the series fields below
  // when promoting a multi-variant series.
  hottestPaddleSlug: "honolulu-j2cr-crystal-blue-hybrid",
  hottestPaddleSeries: {
    // Display name shown as the headline (can be a series or single paddle name)
    headline: "Honolulu Crystal Blue Series",
    subheadline: "The Crystal Blue Endurance Surface lineup — three shapes, one mission: outlast and outplay.",
    bullets: [
      "Crystal Blue Endurance Surface",
      "J2CR Hybrid · J3CR Widebody · J6CR Elongated",
      "All-court performance at $195",
    ],
    // Affiliate link for the SHOP NOW button — uses the paddle's discountLink if blank
    seriesLink: "https://808pickle.com/discount/PLAYBOOK?redirect=/products/j2cr-crystal-blue-endurance-surface%E2%84%A2-pre-order",
  },

  // ── Homepage — Paddle of the Week ───────────────────────────────────────────
  // Set to any paddle slug. Swap weekly to feature a new paddle.
  paddleOfTheWeekSlug: "holbrook-mav-elongated",

  // ── Homepage — Paddle of the Month (legacy, still used by PaddleOfTheMonth) ──
  paddleOfTheMonth: "holbrook-mav-elongated",

  // ── Homepage — Just Added ────────────────────────────────────────────────────
  justAddedCount: 4,

  // ── Homepage — What's Trending ───────────────────────────────────────────────
  trendingCount: 5,

  // ── Homepage — Latest Reviews ────────────────────────────────────────────────
  latestReviewsCount: 6,

  // ── Newsletter / Substack ────────────────────────────────────────────────────
  // Primary newsletter destination. Used by the popup and SubstackCard.
  substackUrl: "https://pickleballplaybook.substack.com/",

  // ── Newsletter popup ─────────────────────────────────────────────────────────
  newsletterPopup: {
    // Set to false to disable the popup entirely without touching any other code.
    enabled: true,

    // Seconds after page load before the popup is shown (if scroll hasn't fired first).
    // Cut to 3s so every visitor gets a shot well within the first minute on any page.
    delaySeconds: 3,

    // Scroll depth (0–100) that triggers the popup, whichever comes first.
    scrollThreshold: 25,

    // localStorage key — changing this resets "already seen" for all visitors.
    storageKey: "ppb_popup_v1",
  },

  // ── SEO ─────────────────────────────────────────────────────────────────────
  siteUrl: "https://playbookpaddles.com",
  twitterHandle: "@pickleballplaybook",
};
