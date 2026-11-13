import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-4.0-players";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "4.0 Player Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "4.0 players",
  headline: `Best Pickleball Paddles for 4.0 Players (${currentYear()})`,
  intro:
    "At 4.0 your mechanics are real. You're generating your own pace, playing intentional third-shot drops, and using spin to set up attacks. At this level, paddle choice isn't about forgiveness — it's about matching the paddle's characteristics to your game style. These five picks cover the spectrum: all-court balanced, aggressive power, kitchen control, reach specialist, and best value. All five are paddles Austin has reviewed on-court at this level.",
  trustSignals: ["On-Court Tested", "Lab-Measured Specs", "Unsponsored Picks", "Discount Codes Included"],
  accent: "#0a64bc",
  picks: [
    {
      slug: "bread-and-butter-loco-2-hybrid",
      label: "Best Overall S-Tier",
      why: "Austin's review: 'Arguably the greatest pickleball paddle of all time.' Exceptional power, elite spin from the Space Dust Grit surface, and fantastic pop while maintaining tons of control. SW 111.19 keeps it fast at the kitchen while the premium build rewards your 4.0 mechanics with a complete package. At $220, it's the paddle most serious 4.0 players should own. Code PLAYBOOK.",
    },
    {
      slug: "volair-cmd-hyb-hybrid",
      label: "Best for Aggressive Players",
      why: "Austin reviewed the CMD HYB as 'the ultimate S-tier for aggressive competitive players.' Premium hex grit licensed from 11 Pickles. SW 110.66 with a build specifically designed for players who want power without sacrificing control. This paddle is NOT for passive players — it rewards the aggressive 4.0 who wants to attack from everywhere. 10% off with PLAYBOOK.",
    },
    {
      slug: "gearbox-pressure-x-8e-elongated",
      label: "Best All-Court Power",
      why: "Austin reviewed the 8E as Gearbox's 'all-court offering — versatility and balance.' SpinLock surface for elite spin and control, 16mm core, impressive forgiveness across the entire hitting surface. SW 117.78 with enough swing weight to dictate baseline rallies. The elongated shape gives reach for overhead putaways. At $279.99, it's a premium paddle with pro-level specs. Code PLAYBOOK.",
    },
    {
      slug: "honolulu-j2cr-crystal-blue-hybrid",
      seriesSlugs: ["honolulu-j2cr-crystal-blue-hybrid", "honolulu-j6cr-crystal-blue-elongated", "honolulu-j3cr-crystal-blue-widebody"],
      seriesName: "Honolulu Crystal Blue",
      label: "Best for Touch & Spin",
      why: "The Crystal Blue Endurance Surface was reviewed by Austin as genuinely solving the durable grit problem — spin holds steady or actually increases RPMs the more you use it. At 4.0 you care about spin because you're shaping balls. SW 109.61, TW 6.57 — light and fast for kitchen play, with surface grip that lasts the entire season. 10% off with PLAYBOOK.",
    },
    {
      slug: "6-0-coral-hybrid",
      label: "Best Balanced Value",
      why: "SW 110.59, TW 6.62 — the most consistent all-court paddle in the $200 range. Six Zero's build quality is exceptional and the Coral is their flagship: nothing extreme, nothing lacking. At 4.0 you want a reliable tool that doesn't punish you on off-days. The Coral is that paddle. At $200 with PLAYBOOK (10% off), it delivers pro-tier feel at a fair price.",
    },
  ],
  buyingGuide: {
    heading: "What 4.0 players actually need",
    paragraphs: [
      <p key="0">
        At 4.0 you&apos;ve outgrown the forgiveness-first mindset. Your contact is consistent enough that you can start
        tuning the paddle to your game style rather than compensating for bad mechanics. The three distinct styles at
        4.0: all-court balanced (Loco 2, Coral), aggressive power (CMD HYB, Pressure X 8E), and kitchen specialist
        (Crystal Blue, GRUVN).
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Swing weight at 4.0 is a style choice, not a forgiveness choice.</strong>{" "}
        SW 107–112 makes you faster at the kitchen and quicker in hand battles. SW 114–118 gives you more weapon on
        drives and overheads. Neither is right or wrong — it depends on how you win points.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Surface durability matters more at 4.0.</strong>{" "}
        You&apos;re hitting more balls per session. Grit surfaces wear faster when you play every day. The Honolulu
        Crystal Blue and Gearbox SpinLock are specifically designed for durability — worth paying for if you play
        4+ times per week.
      </p>,
      <p key="3">
        Pushing toward 4.5? See our{" "}
        <a href="/best-pickleball-paddles/for-advanced-players" style={{ color: "#60a5fa" }}>best paddles for advanced players</a>{" "}
        — several picks overlap, and the Loco 2 and CMD HYB both appear there.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for a 4.0 player?",
      a: "The Bread & Butter Loco 2 Hybrid is Austin's top pick for 4.0 — S-tier spin, power, and control in a complete package. For aggressive power players, the Volair CMD HYB. For touch-and-placement players, the Honolulu Crystal Blue J2CR. All three are on-court reviewed.",
    },
    {
      q: "Should a 4.0 player use a 14mm or 16mm paddle?",
      a: "Most 4.0 players should still use 16mm. The extra thickness means softer touch and more control at the kitchen — which is where most 4.0 rallies are decided. 14mm adds pop and a snappier feel that rewards 4.5+ mechanics. Worth experimenting with as a secondary paddle.",
    },
    {
      q: "What swing weight is ideal for 4.0 players?",
      a: "109–116 covers most 4.0 styles. All-court players often prefer 109–112 (fast at the kitchen, still has pop). Power players tend toward 114–118. The Loco 2 at 111 and CMD HYB at 110 are both in the balanced range; the Gearbox Pressure X 8E at 117 is the power end.",
    },
    {
      q: "Is the Bread & Butter Loco 2 worth $220 for a 4.0 player?",
      a: "Yes, if you're playing 3+ times per week. Austin reviewed it as S-tier — the Space Dust Grit surface lasts as long as premium grit surfaces, and the overall performance is best-in-class. You won't need to replace it until you're playing at 4.5+.",
    },
  ],
  relatedGuides: [
    "for-advanced-players",
    "for-3.5-players",
    "for-kitchen-game",
    "for-doubles",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for 4.0 Players (${currentYear()}) — On-Court Tested`,
  description:
    "The 5 best pickleball paddles for 4.0-rated players in 2026. On-court tested, lab-measured specs, and unsponsored picks ranked by game style: power, control, and all-court.",
  keywords: [
    "best pickleball paddle for 4.0 player",
    "best pickleball paddle 4.0",
    "pickleball paddle 4.0 rating",
    `best pickleball paddle 4.0 ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for 4.0 Players (${currentYear()})`,
    description: "5 on-court tested paddles for 4.0-rated players — power, control, and all-court picks with real specs.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for 4.0 players" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for 4.0 Players (${currentYear()})`, description: "5 on-court tested paddles for 4.0 players." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
