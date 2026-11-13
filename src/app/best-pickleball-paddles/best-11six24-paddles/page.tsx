import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "best-11six24-paddles";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "11SIX24 Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "11SIX24 shoppers",
  headline: `Best 11SIX24 Pickleball Paddles (${currentYear()})`,
  intro:
    "11SIX24 is one of the most respected independent pickleball brands among competitive players. Their Jelly Bean and Power series offer a deliberately wide spec range — from the widebody Pegasus Power 2 (SW 110, TW 7.01) to the power-oriented Ultre JB2 hybrid (SW 118.98, TW 6.60). The JB2 lineup is their value tier at $169.99; the Power 2 lineup adds premium construction at $209.99. HexGrit surface runs through both. These are the five 11SIX24 paddles worth buying in 2026.",
  trustSignals: ["HexGrit Spin Surface", "Lab-Measured Specs", "Independent Competitive Brand", "Discount Codes Included"],
  accent: "#f59e0b",
  picks: [
    {
      slug: "11six24-ultre-jelly-bean-2-hybrid",
      label: "Best Overall 11SIX24",
      why: "SW 118.98 with TW 6.60 at $169.99 — the Ultre JB2 is the highest swing-weight paddle in the JB2 value lineup with a twist weight that rivals more expensive paddles. HexGrit surface generates consistent topspin. The hybrid shape gives you more face coverage than an elongated without sacrificing swing weight. For the best 11SIX24 spec-per-dollar, the Ultre JB2 is the pick. Code PLAYBOOK.",
    },
    {
      slug: "11six24-vapor-power-2-hybrid",
      label: "Best for Touch + Stability",
      why: "TW 6.73 is the second-highest twist weight in the entire 11SIX24 catalog — the Vapor Power 2 Hybrid is the most forgiving paddle in the lineup on off-center hits. SW 113.77 is lower than the Ultre, making it faster at the NVZ. For 11SIX24 players who win at the kitchen, the Vapor Power 2 Hybrid at $209.99 delivers the highest twist weight stability in the brand. Code PLAYBOOK.",
    },
    {
      slug: "11six24-hurache-x-jelly-bean-2-elongated",
      label: "Best 11SIX24 Elongated",
      why: "SW 116.37 at $169.99 — the Hurache-X JB2 is the best-value elongated in the 11SIX24 lineup. Longer handle for two-handed grips or reach, with HexGrit surface for topspin on groundstrokes. Austin specifically cited it as optimized for tennis converts. TW 6.07. For players who need elongated reach at the JB2 price point, this is the pick. Code PLAYBOOK.",
    },
    {
      slug: "11six24-hurache-power-2-elongated",
      label: "Best Premium 11SIX24 Elongated",
      why: "SW 111.87 at $209.99 — the Hurache Power 2 is the premium elongated in the 11SIX24 lineup, with a longer handle than most paddles for two-handed backhand players. The lower SW (vs the Ultre) means faster hand speed; the premium Power 2 construction adds surface durability and build refinement. For tennis converts who want the premium 11SIX24 elongated experience. Code PLAYBOOK.",
    },
    {
      slug: "11six24-pegasus-power-2-widebody",
      label: "Best 11SIX24 Widebody",
      why: "TW 7.01 — the highest twist weight of any paddle in the 11SIX24 lineup and one of the highest in the entire database. The Pegasus Power 2 Widebody is the most forgiving 11SIX24 paddle on off-center hits, with a large sweet spot for players who need reliability over reach. SW 110.07. For 11SIX24 players who prioritize consistency at all contact points, the Pegasus is the answer. $209.99 with code PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "JB2 vs Power 2 — which 11SIX24 series should you buy?",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>JB2 ($169.99) vs Power 2 ($209.99) — the $40 difference.</strong>{" "}
        The JB2 (Jelly Bean 2) series is 11SIX24&apos;s value lineup: same HexGrit surface, same construction quality,
        $40 lower price. The Power 2 series adds premium build refinements and is 11SIX24&apos;s flagship lineup.
        For players who are price-sensitive, the JB2 doesn&apos;t feel like a compromise.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Hurache vs Vapor vs Ultre vs Pegasus — shape and style.</strong>{" "}
        Hurache = elongated, longer handle (tennis converts, two-handed backhand). Vapor = hybrid, touch-focused.
        Ultre = hybrid, power-focused (SW 118.98, highest in JB2 line). Pegasus = widebody, maximum forgiveness
        (TW 7.01). Start with shape, then pick series by budget.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>HexGrit runs through the entire lineup.</strong>{" "}
        Every 11SIX24 paddle uses the HexGrit surface — a hexagonal carbon fiber texture that generates
        topspin more efficiently than a standard carbon weave. It&apos;s consistent across both JB2 and Power 2
        series, so the surface quality doesn&apos;t vary based on which series you buy.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>The Ultre JB2 is the spec-per-dollar champion of the lineup.</strong>{" "}
        SW 118.98, TW 6.60, HexGrit, at $169.99. This combination — competitive power SW, high stability TW,
        premium grit surface, value price — makes the Ultre JB2 Hybrid the most efficient 11SIX24 paddle for
        players who shop by specs.
      </p>,
    ],
  },
  faq: [
    {
      q: "What is the best 11SIX24 pickleball paddle?",
      a: "The 11SIX24 Ultre Jelly Bean 2 Hybrid (SW 118.98, TW 6.60, $169.99) is the best value in the 11SIX24 lineup — competitive power specs with high stability at the JB2 price. For stability-first play, the Pegasus Power 2 Widebody (TW 7.01) has the highest twist weight in the catalog.",
    },
    {
      q: "Is 11SIX24 a good pickleball brand?",
      a: "Yes — 11SIX24 is one of the most respected independent brands among competitive players. Their HexGrit surface is consistently rated as one of the better spin surfaces in the industry, and their lab-measured specs are reliable. The brand has a loyal following at the 4.0–5.0 level.",
    },
    {
      q: "What does 11SIX24 mean?",
      a: "11SIX24 references the sport of pickleball: 11 points to win a game, 6.5-inch non-volley zone measurement, and 24-foot service box depth. It's a brand name built around pickleball's core court dimensions.",
    },
    {
      q: "11SIX24 JB2 vs Power 2 — which should I buy?",
      a: "The JB2 at $169.99 delivers the same HexGrit surface as the Power 2 at $40 less. The Power 2 adds premium build refinements. For most players, the JB2 is the right call unless you specifically want 11SIX24's flagship construction quality. The Ultre JB2 Hybrid in particular is exceptional value.",
    },
  ],
  relatedGuides: [
    "for-competitive-players",
    "for-4.5-players",
    "for-spin-players",
    "for-tennis-players",
  ],
};

export const metadata: Metadata = {
  title: `Best 11SIX24 Pickleball Paddles (${currentYear()}) — JB2 & Power 2 Ranked`,
  description: `The best 11SIX24 pickleball paddles ranked. Ultre JB2, Vapor Power 2, Pegasus — with HexGrit surface guide and discount codes.`,
  keywords: ["best 11SIX24 pickleball paddle", "11SIX24 Jelly Bean 2 review", "11SIX24 Power 2 review", `best 11SIX24 paddle ${currentYear()}`],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best 11SIX24 Pickleball Paddles (${currentYear()})`, description: "5 11SIX24 paddles ranked — JB2 value picks to Power 2 flagship.", url: PAGE_URL, type: "article", siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best 11SIX24 paddles" }] } : {}),
  },
  twitter: { card: "summary_large_image", title: `Best 11SIX24 Pickleball Paddles (${currentYear()})`, description: "5 11SIX24 paddles ranked by specs and value." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
