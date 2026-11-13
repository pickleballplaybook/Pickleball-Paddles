import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-4.5-players";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "4.5 Player Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "4.5-rated players",
  headline: `Best Pickleball Paddles for 4.5 Players (${currentYear()})`,
  intro:
    "At the 4.5 level, you've outgrown beginner-friendly forgiveness — you need a paddle that rewards fast hands, generates consistent spin, and holds up under full-swing power rallies. Swing weight is the defining spec: 4.5 players benefit from paddles in the SW 117–122 range, where there's enough mass behind the head to drive through contact without losing control. Every pick below was chosen for its ability to compete in hard-rallying 4.5 and 5.0 environments with lab-measured specs to back it up.",
  trustSignals: ["Lab-Measured Swing Weight", "4.5+ Level Tested", "Spin-Surface Verified", "Discount Codes Included"],
  accent: "#f59e0b",
  picks: [
    {
      slug: "bread-and-butter-loco-2-elongated",
      label: "Best Overall 4.5 Paddle",
      why: "Austin's S-tier pick — SW 119.14 with Space Dust Grit that generates elite spin without sacrificing dwell or control at the kitchen. The Loco 2 Elongated sits squarely in the 4.5–5.0 swing-weight sweet spot: heavy enough to drive through hard-hit balls, balanced enough for reset dinks at the NVZ. TW 6.20 is tight for an elongated paddle, keeping off-center shots honest. At $220 with PLAYBOOK, it's the strongest all-around 4.5 option in the lineup.",
    },
    {
      slug: "selkirk-boomstik-elongated",
      label: "Best Premium 4.5 Paddle",
      why: "SW 120.09 with TW 6.84 — the highest twist weight on this list, meaning the Boomstik resists rotation on off-center hits better than anything else here. For 4.5 players who live at the kitchen and play aggressive third-shot attacks, that stability margin is meaningful. Selkirk's build quality is the best in pickleball. At $332.99 (code PLAYBOOK), it's a genuine best-in-class tool for players committed to competing at 4.5 and above.",
    },
    {
      slug: "luzz-cannon-xpp-elongated",
      label: "Best Value 4.5 Paddle",
      why: "SW 120.94 is the highest swing weight on this page, and at $179.00 the Cannon XPP delivers it at a price that no comparable paddle can match. Luzz builds premium elongated paddles at a price point most 4.5 players will find refreshing. TW 6.24 keeps it directional at the kitchen. If you want high-power specs at a mid-range price, the Cannon XPP is the answer.",
    },
    {
      slug: "gearbox-pressure-x-8e-elongated",
      label: "Best All-Court 4.5 Paddle",
      why: "SW 117.78 with Gearbox's SpinLock surface — Austin's review highlights 'all-court versatility and impressive forgiveness across the entire hitting surface.' For 4.5 players who move between power baseline rallies and kitchen patience, the 8E transitions smoothly between both. The lower SW (relative to the others here) means faster hand speed on quick exchanges at the NVZ. $279.99 with PLAYBOOK.",
    },
    {
      slug: "crbn-trufoam-barrage-1-elongated",
      label: "Best for Touch at 4.5",
      why: "The TruFoam core changes the feel profile entirely — SW 117.97 but with a softer, more planted contact that advanced players use to hold the ball longer and direct with precision. 4.5 players who win with their reset game and third-shot control will find the Barrage 1's foam-cushioned feel more workable than a traditional composite core at the same swing weight. 14mm thickness adds pop without sacrificing that control feel. $279.99 with PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "What specs matter most at the 4.5 level",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>Swing weight 117–122 is the 4.5 player&apos;s range.</strong>{" "}
        Below 115, paddles feel quick but lack mass behind hard-hit drives. Above 123, hand speed suffers at the
        kitchen. The SW 117–122 window gives you enough weight to punch through fast-paced rally balls while still
        recovering for NVZ exchanges. Every pick on this page falls in that range.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Surface texture is more important at 4.5 than at lower levels.</strong>{" "}
        Beginners and intermediate players rarely manipulate spin the way 4.5+ players do. Space Dust Grit, ArmorGrit,
        VantaGrit — these durable textured surfaces let you generate spin on demand rather than relying on the ball
        rebounding off a flat face. Grit durability matters too; cheap surfaces wear smooth within 6 months.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Twist weight determines your margin on wide shots.</strong>{" "}
        At 4.5, opponents target your body and the corners. Higher twist weight (above 6.5) means the paddle resists
        rotation when you reach wide or get jammed — your shot still goes where you aimed it. The Selkirk Boomstik at
        TW 6.84 is the standout here.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>16mm vs 14mm at the 4.5 level comes down to playing style.</strong>{" "}
        16mm is softer, better for touch and reset play. 14mm has a crisper pop, rewards attackers. Most 4.5 players
        benefit from 16mm unless they win primarily with speed-up attacks and drives. The CRBN Barrage 1 (14mm) is
        the exception here — its TruFoam core counterbalances the crispness with a softer contact feel.
      </p>,
      <p key="4">
        See the{" "}
        <a href="/best-pickleball-paddles/for-competitive-players" style={{ color: "#f59e0b" }}>best paddles for competitive players</a>{" "}
        if you&apos;re playing 5.0+ level or open tournament brackets — that list skews higher on swing weight
        and premium build quality.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for 4.5 players?",
      a: "The Bread & Butter Loco 2 Elongated (SW 119.14) is Austin's S-tier pick for 4.5 play — it balances elite spin, power, and kitchen control in one package. For a premium upgrade with added stability on wide shots, the Selkirk Boomstik (TW 6.84) is the best-built paddle in this category.",
    },
    {
      q: "What swing weight should a 4.5 player use?",
      a: "SW 117–122 is the practical range for 4.5 players. Below 115, you lose the mass needed to drive through hard-hit balls. Above 123, hand speed at the NVZ starts to suffer. The ideal depends on your style: power-first players can go to 121–122 (Cannon XPP, Boomstik); kitchen-first players should stay at 117–119.",
    },
    {
      q: "Is an elongated paddle better for 4.5 players?",
      a: "Generally yes — elongated paddles give more reach on wide shots, a longer sweet spot for full swings, and higher swing weight (more mass in the head). At 4.5 and above, the longer shape is standard. The only tradeoff is slightly reduced hand speed versus a widebody; this rarely matters at the 4.5 level where players have developed fast-twitch control.",
    },
    {
      q: "What's the difference between 4.5 and 5.0 paddle needs?",
      a: "The gap is smaller than most people think. 5.0 players typically prefer SW 120–124 and prioritize premium surface longevity over price. At 4.5, the SW 117–121 range is perfectly suited to the game. The Selkirk Boomstik and Luzz Tornazo are used by both cohorts.",
    },
  ],
  relatedGuides: [
    "for-competitive-players",
    "for-spin-players",
    "for-5.0-players",
    "power",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for 4.5 Players (${currentYear()}) — High Swing Weight & Spin`,
  description:
    "The 5 best pickleball paddles for 4.5-rated players. Lab-measured swing weights in the 117–121 range, premium spin surfaces, and discount codes included.",
  keywords: [
    "best pickleball paddle for 4.5 players",
    "pickleball paddle 4.5 rating",
    "4.5 pickleball paddle",
    "advanced pickleball paddle",
    `best pickleball paddle for 4.5 players ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for 4.5 Players (${currentYear()}) — High SW, Premium Grit`,
    description: "5 paddles ranked for 4.5+ level play — lab-measured swing weights, spin surfaces, and discount codes.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for 4.5 players" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for 4.5 Players (${currentYear()})`, description: "5 paddles ranked for 4.5 level play." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
