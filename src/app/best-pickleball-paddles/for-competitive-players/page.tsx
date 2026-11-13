import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-competitive-players";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Competitive Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "competitive players",
  headline: `Best Pickleball Paddles for Competitive Players (${currentYear()})`,
  intro:
    "Competitive play — 5.0+, open tournament brackets, pro-am events — demands a different set of specs than recreational or club-level 4.0 play. Swing weight above 119, premium grit that holds up through multi-day events, and twist weights that hold the line on off-center attacks are the benchmarks. These are the paddles used by players who play to win, not just to improve. Every pick below is verified by Austin's hands-on testing with lab-measured numbers to match.",
  trustSignals: ["5.0+ Level Tested", "Lab-Measured SW > 119", "Tournament-Grade Build", "Discount Codes Included"],
  accent: "#ef4444",
  picks: [
    {
      slug: "mint-mon-ami-elongated",
      label: "Highest Swing Weight in the Database",
      why: "SW 123.47 is the highest swing weight we've measured in the entire database — period. The Mon Ami's 18mm core is unusual at this price ($179.99), and the combination of extreme swing weight with a softer 18mm feel creates a paddle that punishes attackers and absorbs pace simultaneously. For competitive players who win by dictating tempo with heavy groundstrokes, the Mon Ami delivers a unique physical advantage no other paddle currently matches.",
    },
    {
      slug: "luzz-tornazo-elongated",
      label: "Best All-Court Competitor",
      why: "SW 121.89 in a 16mm elongated build — the Tornazo balances the high swing weight of a power paddle with the touch-friendly 16mm core that competitive players need to convert half-volleys and reset under pressure. TW 6.11 is competitive. Luzz paddles are built for the upper-level game and priced without the brand premium you'd pay at Selkirk or JOOLA. At $229.00 with PLAYBOOK, the Tornazo is the best value at the competitive price point.",
    },
    {
      slug: "selkirk-boomstik-elongated",
      label: "Best for NVZ Dominance",
      why: "TW 6.84 is the standout competitive spec — the Boomstik resists rotation on off-center hits better than every other paddle on this page. In competitive play, opponents constantly attack your body and corners to generate paddle-twist errors. The Boomstik eliminates that vulnerability. SW 120.09 gives you the mass to handle pace without deflecting. This is Selkirk's most tournament-competitive elongated build. $332.99 with PLAYBOOK.",
    },
    {
      slug: "bread-and-butter-loco-2-elongated",
      label: "Best Premium All-Around",
      why: "Austin's S-tier pick for advanced play. SW 119.14 with Space Dust Grit puts the Loco 2 in the conversation for any competitive format — baseline drives, spin third shots, kitchen resets. It's versatile in a way that single-dimension paddles aren't. TW 6.20 is accurate enough for competitive play. At $220 with code PLAYBOOK, it sits at the intersection of top-tier performance and reasonable tournament-level investment.",
    },
    {
      slug: "holbrook-fuze-vantagrit-elongated",
      label: "Best Competitive Spin Weapon",
      why: "For players whose competitive edge is spin manipulation — heavy topspin serves, slice approaches, roll volleys — the Fuze Vantagrit at SW 119.71 with VantaGrit surface is the most purpose-built spin weapon in the competitive tier. VantaGrit maintains its texture through a multi-day tournament, which matters when your grit-dependent game faces three to five rounds. $229.99 with PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "What separates competitive paddles from club paddles",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>Swing weight above 119 is the competitive threshold.</strong>{" "}
        At 5.0+ and open brackets, rally pace is fast enough that lower-SW paddles feel deflected by incoming balls.
        A paddle at SW 121+ holds its line on fast-paced exchanges and absorbs pace without the head bouncing off the
        ball. This isn&apos;t a marginal difference — it&apos;s the reason most tournament players gravitate toward
        SW 119–124.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Surface durability is a tournament requirement, not a preference.</strong>{" "}
        Club-level players replace paddles every year or two. Competitive players can burn through a grit surface in
        months of hard hitting. VantaGrit and Space Dust Grit are the standout surfaces for durability under
        high-volume play. Avoid paddles with unspecified &quot;raw carbon&quot; surfaces if you play more than 4 times
        per week.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Twist weight determines error rate under pressure.</strong>{" "}
        In competitive play, you get fewer &quot;easy&quot; contact points than at the recreational level. Opponents
        attack your body, force awkward reaches, and target the edges of your sweet spot. Higher twist weight (6.5+)
        dramatically reduces the variance on these shots. The Selkirk Boomstik at TW 6.84 is the most forgiving
        competitive paddle in this specific metric.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>USAP approval matters for sanctioned events.</strong>{" "}
        If you&apos;re playing APP, PPA, or USAP-sanctioned tournaments, you need an approved paddle. Every pick
        on this page is USAP-approved except the Mint Mon Ami — verify the current approval list at usa.org before
        your next tournament.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for competitive players?",
      a: "The Selkirk Boomstik (TW 6.84, SW 120.09) is the most tournament-ready paddle on this list for NVZ consistency and off-center error reduction. For raw power, the Mint Mon Ami (SW 123.47, highest in the database) is unmatched. Austin's versatile S-tier pick for competitive all-around play is the Bread & Butter Loco 2 Elongated.",
    },
    {
      q: "What swing weight do competitive pickleball players use?",
      a: "Most competitive players (5.0+, open bracket) play with SW 119–124. Below 117, paddles feel light against fast-paced incoming balls. Above 124, hand speed at the NVZ begins to suffer even for elite players. The 119–123 range is the practical competitive window.",
    },
    {
      q: "Should competitive players use 14mm or 16mm paddles?",
      a: "Both work at the competitive level. 16mm is preferred for players who rely on touch, resets, and kitchen control — the softer core gives more dwell time. 14mm is preferred for attackers who want a crisper, faster pop and are willing to sacrifice a bit of feel. Most 5.0 players gravitate toward 16mm for its versatility.",
    },
    {
      q: "What paddle does a 5.0 pickleball player use?",
      a: "5.0 players tend to use elongated paddles in the SW 119–124 range with premium grit surfaces (raw carbon, ArmorGrit, VantaGrit). The Selkirk Boomstik, Bread & Butter Loco 2, and Luzz Tornazo are all used at 5.0 and open tournament level. Budget is less of a concern — these players invest in their equipment.",
    },
  ],
  relatedGuides: [
    "for-4.5-players",
    "for-5.0-players",
    "for-spin-players",
    "power",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Competitive Players (${currentYear()}) — 5.0+ Tournament Picks`,
  description:
    "The 5 best pickleball paddles for competitive players in 2026. SW 119–124 tournament-tested picks with premium grit surfaces, lab-measured specs, and discount codes.",
  keywords: [
    "best pickleball paddle for competitive players",
    "tournament pickleball paddle",
    "5.0 pickleball paddle",
    "competitive pickleball paddle",
    `best competitive pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Competitive Players (${currentYear()}) — Tournament-Grade`,
    description: "5 tournament-tested paddles ranked for 5.0+ competitive play — lab-measured specs and discount codes.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for competitive players" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Competitive Players (${currentYear()})`, description: "5 tournament-grade paddles for 5.0+ play." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
