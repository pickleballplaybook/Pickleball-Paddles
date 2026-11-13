import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-advanced-players";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Advanced Player Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "advanced players",
  headline: `Best Pickleball Paddles for Advanced Players (${currentYear()})`,
  intro:
    "Advanced players (4.5+) have the mechanics to extract performance from any paddle — the question is which paddle rewards your specific strengths. At this level you're choosing between tools with meaningful tradeoffs: spin vs. power, kitchen speed vs. baseline weight, premium surface durability vs. pop. All five picks below are on-court reviewed at the 4.5+ level by Austin, and every one is either S-tier or the best in its specific category.",
  trustSignals: ["4.5+ Tested On-Court", "S-Tier Picks Only", "Unsponsored Reviews", "Discount Codes Included"],
  accent: "#0a64bc",
  picks: [
    {
      slug: "bread-and-butter-loco-2-hybrid",
      label: "Best All-Around S-Tier",
      why: "Austin's verdict: 'Arguably the greatest pickleball paddle of all time.' S-tier across every metric — exceptional power, elite spin, fantastic pop, complete control. The Space Dust Grit surface lasts as long as premium S-tier grit paddles at $220. SW 111.19 is in the kitchen-fast range while still generating serious pace on drives. The pick for advanced all-court players who want the best.",
    },
    {
      slug: "volair-cmd-hyb-hybrid",
      label: "Best for Aggressive Advanced Play",
      why: "Austin reviewed the CMD HYB as 'the ultimate S-tier for aggressive competitive players.' Premium hex grit licensed from 11 Pickles. Built specifically for advanced players who want to attack — NOT for passive or defensive players. SW 110.66 with elite grit that rewards full aggressive swings. If you win points by applying pressure from everywhere on the court, this is the tool. 10% off with PLAYBOOK.",
    },
    {
      slug: "gearbox-pressure-x-8m-elongated",
      label: "Best Power Specialist",
      why: "Austin reviewed the Pressure X 8M as Gearbox's 'power paddle with a massive sweet spot.' SpinLock surface, 16mm core, SW 116.12. At advanced level, the 8M is for players who can handle the higher swing weight and want maximum speed on the ball. The elongated shape adds reach for put-away overheads. $179.99 with PLAYBOOK discount.",
    },
    {
      slug: "gearbox-pressure-x-8e-elongated",
      label: "Best All-Court Power",
      why: "The 8E is the 'versatile all-court' sibling to the 8M — SW 117.78 with impressive forgiveness across the entire hitting surface. For advanced players who drive from the baseline AND play an aggressive net game, the 8E covers both lanes. SpinLock surface holds spin as well as any paddle in this price range. $279.99 with PLAYBOOK discount.",
    },
    {
      slug: "selkirk-boomstik-elongated",
      label: "Best for Spin Attackers",
      why: "SW 120.09 with TW 6.84 — the Boomstik is one of the highest-swing-weight paddles in the catalog with an unusually high twist weight for an elongated shape. At 4.5+ you have the wrist strength to handle SW 120, and TW 6.84 means even aggressive off-center attacks stay directional. $332.99 — premium, but built for elite-level attacking play.",
    },
  ],
  buyingGuide: {
    heading: "Choosing a paddle at the 4.5+ level",
    paragraphs: [
      <p key="0">
        At advanced level, the spec ranges that matter most shift from kitchen speed (SW) to surface durability and
        spin profile. You play more. You swing harder. Grit surfaces that last two months for a 3.5 player last three
        weeks for a 4.5+ player who hits hard every session. The Loco 2 and CMD HYB both use premium-tier surfaces
        specifically engineered for durability.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>At 4.5+ you can start using higher swing weights without sacrificing kitchen play.</strong>{" "}
        Your hand speed and reaction time are trained. SW 116–120 is accessible territory at this level in a way it
        isn&apos;t for 3.5 players. The Gearbox 8M (116) and Boomstik (120) are legitimate advanced-player tools.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>14mm cores are worth trying at 4.5+.</strong>{" "}
        Thinner cores add pop, a snappier feel, and more ball speed. Your mechanics are consistent enough to take
        advantage. Most picks above are 16mm — but the Six Zero Boulder Opal (14mm) is worth a demo for advanced
        players who want the pop of a thinner core without sacrificing too much touch.
      </p>,
    ],
  },
  faq: [
    {
      q: "What pickleball paddle do advanced players use?",
      a: "Advanced players (4.5+) gravitate toward paddles reviewed as S-tier — the Bread & Butter Loco 2 Hybrid (Austin's top pick), Volair CMD HYB (aggressive S-tier), and Gearbox Pressure X series (power specialist). All three are on-court reviewed by Austin at the advanced level.",
    },
    {
      q: "What swing weight do advanced pickleball players use?",
      a: "Most advanced players are comfortable in the SW 110–120 range depending on game style. Kitchen-focused 4.5 players often prefer SW 110–114 for faster hands. Power-attack players use SW 116–122. The Boomstik at SW 120 is a legitimate elite tool for advanced attacking players.",
    },
    {
      q: "Is 14mm or 16mm better for advanced players?",
      a: "Both are used at the 4.5+ level. 16mm (Loco 2, CMD HYB) gives more kitchen feel and control — the majority of advanced players prefer it. 14mm (Six Zero Boulder, Mint Fast Flow Pro) adds pop and is favored by players who rely on ball speed over spin and placement. Try both if possible.",
    },
    {
      q: "What's the best pickleball paddle for a 4.5+ player?",
      a: "Austin's top pick for advanced all-court is the Bread & Butter Loco 2 Hybrid — S-tier across every metric. For pure aggression, the Volair CMD HYB. For power specialists, the Gearbox Pressure X 8M. For spin attackers who want higher swing weight, the Selkirk Boomstik.",
    },
  ],
  relatedGuides: [
    "for-4.0-players",
    "for-5.0-players",
    "for-bangers",
    "for-kitchen-game",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Advanced Players (${currentYear()}) — S-Tier Picks`,
  description:
    "The 5 best pickleball paddles for advanced (4.5+) players in 2026. On-court tested by Austin at the 4.5+ level — all S-tier or best-in-category with real lab specs.",
  keywords: [
    "best pickleball paddle for advanced players",
    "best pickleball paddle 4.5",
    "advanced pickleball paddle",
    "best pickleball paddle competitive",
    `advanced pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Advanced Players (${currentYear()})`,
    description: "5 S-tier picks for 4.5+ players — on-court tested, lab-measured, and unsponsored.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for advanced players" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Advanced Players (${currentYear()})`, description: "5 S-tier picks for 4.5+ players." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
