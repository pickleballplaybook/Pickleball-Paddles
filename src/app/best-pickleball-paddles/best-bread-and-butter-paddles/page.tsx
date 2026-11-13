import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "best-bread-and-butter-paddles";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Bread & Butter Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "Bread & Butter shoppers",
  headline: `Best Bread & Butter Pickleball Paddles (${currentYear()})`,
  intro:
    "Bread & Butter has become one of the hottest brands in competitive pickleball. Every paddle they make is elongated-first — they don't do widebody. Their Space Dust Grit surface is one of the most durable premium grit coatings in the game, and every paddle in the lineup sits in the SW 111–120 range with measured lab specs to back it up. The Loco 2 Elongated is Austin's S-tier pick for 2026. Here are the five Bread & Butter paddles worth buying.",
  trustSignals: ["Space Dust Grit Surface", "Lab-Measured Swing Weight", "All Elongated/Hybrid", "Discount Codes Included"],
  accent: "#f97316",
  picks: [
    {
      slug: "bread-and-butter-loco-2-elongated",
      label: "Best Overall (S-Tier)",
      why: "Austin's S-tier pick for 2026 — SW 119.14 with Space Dust Grit generates elite topspin, and the 16mm core gives enough softness for kitchen resets. TW 6.20 is directional enough for competitive play. The Loco 2 Elongated is the most complete Bread & Butter paddle: it wins on drives, works at the kitchen, and holds its grit surface longer than most. $220 with code PLAYBOOK.",
    },
    {
      slug: "bread-and-butter-loco-elongated",
      label: "Best Value Loco",
      why: "The original Loco Elongated at $199 — SW 118.20 is nearly identical to the Loco 2 at a $21 savings. If you want the Bread & Butter elongated experience and the Loco 2 is sold out or the $20 difference matters, the Loco is the pick. Same Space Dust Grit surface, same 16mm core, 1 SW point lighter. Code PLAYBOOK.",
    },
    {
      slug: "bread-and-butter-shogun-elongated",
      label: "Best for Control-First Play",
      why: "SW 117.53 with TW 5.96 — the Shogun sits slightly lower on both metrics than the Loco line, which translates to faster hand speed at the NVZ and a more precise, controlled feel on dinks. For Bread & Butter players who prioritize control and kitchen touch over raw drive power, the Shogun at $189.99 is the right choice. Code PLAYBOOK.",
    },
    {
      slug: "bread-and-butter-filth-elongated",
      label: "Best Budget Bread & Butter",
      why: "SW 116.53 at $165 — the Filth Elongated is the most affordable Bread & Butter paddle with full Space Dust Grit. It delivers the brand's signature surface at a lower price point, which makes it the right entry if you want to try the Bread & Butter feel before committing to the Loco 2's $220 price tag. TW 5.91. Code PLAYBOOK.",
    },
    {
      slug: "bread-and-butter-loco-2-hybrid",
      label: "Best Bread & Butter for Kitchen Game",
      why: "SW 111.19 with TW 6.63 — the Loco 2 Hybrid is a fundamentally different paddle than the elongated version. Lower swing weight means faster hand speed and lighter feel; TW 6.63 is the highest in the Loco 2 family, making it more forgiving on off-center kitchen shots. If your game is built around the NVZ and resets, the Hybrid version of the Loco 2 at $220 is the better fit. Code PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "Loco vs. Loco 2 — what's the difference?",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>Loco 2 vs Loco — it&apos;s 1 SW point and $21.</strong>{" "}
        The Loco Elongated (SW 118.20, $199) and Loco 2 Elongated (SW 119.14, $220) are the same paddle family
        with iterative improvements. The Loco 2 is the current production model with updated Space Dust Grit
        application and slightly higher swing weight. Unless the $21 savings is meaningful, buy the Loco 2 —
        it&apos;s the current generation.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Elongated vs Hybrid in the Loco 2 line — a play-style split.</strong>{" "}
        The Loco 2 Elongated (SW 119.14, TW 6.20) is built for power and spin. The Loco 2 Hybrid (SW 111.19,
        TW 6.63) is built for kitchen control and forgiveness. They&apos;re the same price ($220) — choose based
        on whether your game wins at the baseline (elongated) or the NVZ (hybrid).
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>All Bread & Butter paddles use Space Dust Grit.</strong>{" "}
        Every paddle in the lineup uses their proprietary Space Dust Grit surface. This is a meaningful advantage
        over generic &quot;raw carbon fiber&quot; surfaces — Space Dust Grit maintains texture over time rather than
        smoothing out after heavy use. Bread & Butter&apos;s durability claims on this surface have held up in
        extended real-world testing.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Bread & Butter doesn&apos;t make widebody paddles.</strong>{" "}
        If you want a widebody or forgiving shape, look elsewhere. Every Bread & Butter paddle is either
        elongated or hybrid — they&apos;re a brand for players who want reach and power as their starting point.
        If arm-friendly weight or large sweet spot is the priority, see the{" "}
        <a href="/best-pickleball-paddles/most-forgiving" style={{ color: "#f97316" }}>most forgiving paddles guide</a>.
      </p>,
    ],
  },
  faq: [
    {
      q: "What is the best Bread & Butter pickleball paddle?",
      a: "The Bread & Butter Loco 2 Elongated (SW 119.14, Space Dust Grit, $220) is Austin's S-tier pick for 2026 — the best all-around Bread & Butter paddle for competitive play. For value, the original Loco Elongated at $199 delivers nearly identical specs at $21 less.",
    },
    {
      q: "Is Bread & Butter a good pickleball brand?",
      a: "Yes — Bread & Butter has become one of the most talked-about brands in competitive pickleball. Their Space Dust Grit surface is one of the most durable in the market, and their swing weight specs are publicly lab-measured. The Loco 2 is used by serious players from 4.0 to 5.0+.",
    },
    {
      q: "What makes Bread & Butter paddles different?",
      a: "Space Dust Grit is the key differentiator — a proprietary textured surface engineered to maintain its spin-generating texture over hundreds of hours of play, unlike standard raw carbon that smooths out over time. Every paddle in the lineup also has lab-measured swing weight, which is relatively rare in the industry.",
    },
    {
      q: "Bread & Butter Loco 2 vs Loco — which should I buy?",
      a: "Buy the Loco 2. It's the current generation with updated Space Dust Grit and SW 119.14 vs 118.20 on the original Loco. The $21 price difference is worth the current-gen construction. If the Loco 2 is on backorder, the original Loco at $199 is a solid substitute.",
    },
  ],
  relatedGuides: [
    "for-competitive-players",
    "for-4.5-players",
    "for-spin-players",
    "raw-carbon-fiber",
  ],
};

export const metadata: Metadata = {
  title: `Best Bread & Butter Pickleball Paddles (${currentYear()}) — Loco 2 & More`,
  description: `The best Bread & Butter pickleball paddles ranked. Loco 2, Loco, Shogun, Filth — with lab-measured swing weights and discount codes.`,
  keywords: ["best Bread and Butter pickleball paddle", "Bread Butter Loco 2 review", "B&B pickleball paddle", `best Bread and Butter paddle ${currentYear()}`],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Bread & Butter Pickleball Paddles (${currentYear()})`, description: "5 Bread & Butter paddles ranked — Loco 2, Loco, Shogun, Filth.", url: PAGE_URL, type: "article", siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best Bread and Butter paddles" }] } : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Bread & Butter Pickleball Paddles (${currentYear()})`, description: "5 B&B paddles ranked." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
