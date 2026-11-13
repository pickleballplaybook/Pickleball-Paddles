import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-5.0-players";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Pro-Level Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "5.0+ pro-level players",
  headline: `Best Pickleball Paddles for 5.0 Players (${currentYear()})`,
  intro:
    "At 5.0 your mechanics are elite — consistent contact, deliberate shot selection, and the ability to extract maximum performance from any paddle. At this level the spec question becomes very specific to game style: do you win by spin attacks, by pace, by kitchen dominance, or by all-court variety? These five picks are Austin's S-tier selections for the elite competitive player, each tuned to a different winning style.",
  trustSignals: ["S-Tier Only", "Pro-Level Testing", "Unsponsored Reviews", "Discount Codes Included"],
  accent: "#0a64bc",
  picks: [
    {
      slug: "bread-and-butter-loco-2-hybrid",
      label: "Best All-Around Pro Paddle",
      why: "Austin's review: 'Arguably the greatest pickleball paddle of all time. S-tier. Exceptional power, elite spin, fantastic pop while maintaining tons of control.' At 5.0 you need a paddle that doesn't limit any part of your game — the Loco 2 hybrid doesn't. Space Dust Grit surface lasts a full competitive season. SW 111.19 for kitchen speed with enough pop for baseline attacks. $220 with PLAYBOOK.",
    },
    {
      slug: "volair-cmd-hyb-hybrid",
      label: "Best for 5.0 Aggressive Attack",
      why: "Austin: 'Ultimate S-tier for aggressive competitive players. Premium hex grit licensed from 11 Pickles. NOT designed for beginners or passive players — built for aggressive players who want power without sacrificing control.' At 5.0 you have the footwork and mechanics to maximize the CMD HYB's aggressive profile. SW 110.66, premium hex grit. 10% off with PLAYBOOK.",
    },
    {
      slug: "selkirk-boomstik-elongated",
      label: "Best for Pro Power Game",
      why: "SW 120.09 with TW 6.84 — the Boomstik is a pro-grade power weapon. At 5.0 you can handle SW 120 without losing kitchen speed (trained reaction time compensates). TW 6.84 is unusually high for an elongated power paddle, meaning off-angle attacks stay directional. For competitive players who win by pace and attacking, the Boomstik is built for this level. $332.99.",
    },
    {
      slug: "gearbox-pressure-x-8e-elongated",
      label: "Best Pro All-Court",
      why: "Austin: 'All-court offering — versatility and balance. SpinLock surface for elite spin and control. Impressive forgiveness across the entire hitting surface.' SW 117.78 with pro-grade spin and a durable surface. At 5.0 you cycle through paddles faster — SpinLock's durability means a consistent feel for a full tournament run. $279.99 with PLAYBOOK.",
    },
    {
      slug: "luzz-tornazo-elongated",
      label: "Best for Pro Baseline Domination",
      why: "SW 121.89 is the highest in our catalog — for a 5.0 player who wins by baseline dominance, pace control, and heavy topspin, the Tornazo is the specialist weapon. 15% off with PLAYBOOK brings $229 to ~$195. The highest swing weight in the database in a 16mm elongated build that still keeps pace in the kitchen for a trained elite player.",
    },
  ],
  buyingGuide: {
    heading: "What separates 5.0 paddle choice from 4.0",
    paragraphs: [
      <p key="0">
        At 5.0 you&apos;ve essentially eliminated the spec limitations — your mechanics handle whatever paddle you
        choose. The spec decision becomes pure style optimization: maximize your strongest attribute and don&apos;t
        introduce weaknesses. Aggressive player? CMD HYB. Power + pace? Tornazo. Complete game? Loco 2.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Surface wear is a real concern at 5.0.</strong>{" "}
        Elite players hit more balls per session and with more force — surfaces wear 2–3x faster. Budget grit
        surfaces aren&apos;t viable at this level. Space Dust Grit (Loco 2), hex grit (CMD HYB), SpinLock (Gearbox),
        and Crystal Blue Endurance are the surfaces that hold up through full competitive seasons.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Most 5.0 players own 2–3 paddles.</strong>{" "}
        A heavy singles paddle (SW 118–122) and a kitchen doubles paddle (SW 108–112) optimize both formats.
        Some players add a training paddle or backup. The investment is justified at this level of commitment.
      </p>,
    ],
  },
  faq: [
    {
      q: "What pickleball paddles do 5.0 players use?",
      a: "Austin's picks for 5.0: Bread & Butter Loco 2 Hybrid for all-court, Volair CMD HYB for aggressive attack, Selkirk Boomstik for power, Gearbox Pressure X 8E for all-court pro play, Luzz Tornazo for baseline domination. All are S-tier or best-in-category.",
    },
    {
      q: "What swing weight do pro pickleball players use?",
      a: "Pro players use a wide range — some prefer SW 108–113 for kitchen speed (especially doubles specialists), others go SW 116–122 for power. The ability to handle higher swing weight without losing hand speed comes from years of trained reaction. Most pros have different paddles for singles vs. doubles.",
    },
    {
      q: "Is there a difference between 4.5 and 5.0 paddle choice?",
      a: "Marginally. At 5.0, surface durability matters more (higher hitting frequency), and higher swing weights become accessible (trained speed compensates). The actual paddles overlap significantly — the Loco 2, CMD HYB, and Gearbox 8E are used at both levels. The difference is in how specifically you tune the spec to your game style.",
    },
    {
      q: "Do pro players use custom or stock paddles?",
      a: "Most competitive 5.0 players use stock paddles from these brands, often adding lead tape for custom swing weight tuning. Lead tape at the 3 and 9 o'clock positions adds twist weight; at 12 o'clock adds swing weight. The stock specs above are the starting point — pro-level customization adds small incremental adjustments.",
    },
  ],
  relatedGuides: [
    "for-advanced-players",
    "for-4.0-players",
    "for-bangers",
    "for-kitchen-game",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for 5.0 Players (${currentYear()}) — Pro-Level S-Tier`,
  description:
    "The 5 best pickleball paddles for 5.0-rated players in 2026. Pro-level S-tier picks reviewed by Austin — all-court, aggressive attack, power, and baseline dominance.",
  keywords: [
    "best pickleball paddle for 5.0 player",
    "best pro pickleball paddle",
    "best pickleball paddle 5.0",
    "pro level pickleball paddle",
    `best pickleball paddle 5.0 ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for 5.0 Players (${currentYear()}) — Pro S-Tier`,
    description: "5 pro-level S-tier paddles for 5.0 players — all-court, aggressive, and power specialists.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for 5.0 players" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for 5.0 Players (${currentYear()})`, description: "5 pro S-tier paddles for 5.0 competitive players." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
