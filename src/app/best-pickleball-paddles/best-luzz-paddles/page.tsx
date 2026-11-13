import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "best-luzz-paddles";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Luzz Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "Luzz shoppers",
  headline: `Best Luzz Pickleball Paddles (${currentYear()})`,
  intro:
    "Luzz makes one thing very well: high swing weight paddles at prices that undercut the competition by $50–$100. The Cannon XPP at $179 delivers SW 120.94 — a spec that other brands charge $280+ for. The Tornazo hits SW 121.89. If you want heavy-hitting elongated paddles and don't want to pay Selkirk or Bread & Butter prices, Luzz is the answer. The Glider Hybrid at $109 is the exception — their budget all-court entry.",
  trustSignals: ["High Swing Weight Value", "Lab-Measured Specs", "Elongated Power Focus", "Discount Codes Included"],
  accent: "#ef4444",
  picks: [
    {
      slug: "luzz-cannon-xpp-elongated",
      label: "Best Value High-SW Paddle",
      why: "SW 120.94 at $179 — the Cannon XPP is the most compelling value in competitive pickleball right now. No other brand puts SW 120+ in an elongated paddle for under $200. TW 6.24 is solid for the price. The power-to-dollar ratio here is genuinely unmatched. If you want a heavy-hitting elongated paddle and care about your wallet, the Cannon XPP is the pick. Code PLAYBOOK.",
    },
    {
      slug: "luzz-tornazo-elongated",
      label: "Best Overall Luzz",
      why: "SW 121.89 — the highest swing weight in the Luzz lineup and the second-highest elongated paddle SW in our entire database. The Tornazo at $229 is the definitive Luzz paddle for players who want maximum drive weight. TW 6.11 is competitive for the SW tier. For power players who are willing to spend $50 more than the Cannon XPP for an extra 1 SW point, the Tornazo is the answer. Code PLAYBOOK.",
    },
    {
      slug: "luzz-inferno-2-m1-elongated",
      label: "Best Luzz for Spin + Power",
      why: "SW 120.24 at $239 — the Inferno 2 M1 sits between the Cannon and Tornazo in price but matches the Cannon's SW within 0.7 points while adding a more refined grit surface optimized for spin. For players who want high SW and want to maximize their spin game alongside it, the Inferno 2 M1 is the most complete Luzz paddle. TW 6.31. Code PLAYBOOK.",
    },
    {
      slug: "luzz-inferno-elongated",
      label: "Best Balanced Luzz Elongated",
      why: "SW 118.52 at $229 — the original Inferno sits below the Cannon in swing weight but above the entry-level Glider. It&apos;s the pick for Luzz players who want an elongated paddle in the competitive 118–119 range without committing to the heavier feel of the Cannon or Tornazo. TW 6.02. Code PLAYBOOK.",
    },
    {
      slug: "luzz-glider-hybrid",
      label: "Best Budget Luzz / Kitchen Game",
      why: "SW 107.94 at $109 — the Glider is a completely different paddle than the rest of the Luzz lineup. It&apos;s arm-friendly, hybrid-shaped, and built for touch players or players who want a budget entry into the Luzz catalog. TW 6.21. If power drives aren&apos;t your game and the Cannon/Tornazo feel too heavy, the Glider is the Luzz answer. Code PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "Why Luzz swing weights are so high for the price",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>Luzz prices high SW specs below market rate.</strong>{" "}
        The Cannon XPP at $179 has a higher swing weight than paddles costing $279 from established brands. This
        isn&apos;t a quality tradeoff — it&apos;s a pricing strategy. Luzz is a smaller independent brand without
        the marketing overhead of Selkirk or Gearbox, which lets them price their engineered specs more aggressively.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>SW 120+ is the competitive threshold — and Luzz hits it at $179.</strong>{" "}
        For 4.5+ and open tournament play, SW 119–122 is the practical range. The Cannon XPP at SW 120.94 and
        the Tornazo at SW 121.89 are both above this threshold. At most other brands, you&apos;re paying $250–$330
        to reach this SW tier.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>The Glider is not a Cannon alternative — it&apos;s a different paddle.</strong>{" "}
        The Glider Hybrid (SW 107.94, $109) is an arm-friendly, kitchen-first paddle. If you see the Luzz name
        and assume all their paddles are heavy-hitting power tools, the Glider will surprise you. It&apos;s their
        budget all-court option, not a power paddle at a lower price.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>The Cannon XPP vs Tornazo vs Inferno 2 M1 — how to choose.</strong>{" "}
        All three are in the SW 120–122 range. The Cannon XPP ($179) is the value pick. The Tornazo ($229)
        adds 1 SW point over the Inferno 2. The Inferno 2 M1 ($239) prioritizes spin surface over raw SW delta.
        For pure SW-per-dollar, buy the Cannon.
      </p>,
    ],
  },
  faq: [
    {
      q: "What is the best Luzz pickleball paddle?",
      a: "The Luzz Tornazo Elongated (SW 121.89, $229) is the best overall Luzz paddle for power and competitive play. For the best value, the Cannon XPP (SW 120.94, $179) is the most compelling spec-to-price ratio in its category.",
    },
    {
      q: "Is Luzz a good pickleball brand?",
      a: "Yes — Luzz delivers high swing weight specs at prices that undercut established brands by $50–$100 on comparable specs. Their lab-measured swing weights are accurate and independently verified. The Cannon XPP and Tornazo are used by serious competitive players at the 4.5+ level.",
    },
    {
      q: "What swing weight do Luzz paddles have?",
      a: "Luzz paddles range from SW 107.94 (Glider Hybrid, budget) to SW 121.89 (Tornazo, power flagship). The Cannon XPP at SW 120.94 and Inferno 2 M1 at SW 120.24 both sit in the competitive 120+ tier. The original Inferno is at SW 118.52.",
    },
    {
      q: "Luzz Cannon XPP vs Tornazo — which should I buy?",
      a: "For pure value, buy the Cannon XPP at $179 — SW 120.94 for $50 less than the Tornazo. If that extra SW point (121.89 vs 120.94) matters to your game and you prefer a more refined overall build, the Tornazo at $229 is worth the premium. The spec difference is real but small.",
    },
  ],
  relatedGuides: [
    "for-competitive-players",
    "for-4.5-players",
    "power",
    "elongated",
  ],
};

export const metadata: Metadata = {
  title: `Best Luzz Pickleball Paddles (${currentYear()}) — High SW at Honest Prices`,
  description: `The best Luzz pickleball paddles ranked. Cannon XPP (SW 120.94, $179), Tornazo, Inferno 2 — high swing weight picks with discount codes.`,
  keywords: ["best Luzz pickleball paddle", "Luzz Cannon XPP review", "Luzz Tornazo review", `best Luzz paddle ${currentYear()}`],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Luzz Pickleball Paddles (${currentYear()})`, description: "5 Luzz paddles ranked — high SW at honest prices.", url: PAGE_URL, type: "article", siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best Luzz paddles" }] } : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Luzz Pickleball Paddles (${currentYear()})`, description: "5 Luzz paddles — high SW, honest prices." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
