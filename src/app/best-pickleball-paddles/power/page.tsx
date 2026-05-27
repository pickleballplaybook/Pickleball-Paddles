import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import CategoryPage from "../CategoryPage";

const URL = `${siteConfig.siteUrl}/best-pickleball-paddles/power`;

export const metadata: Metadata = {
  title: "Best Power Pickleball Paddles of 2026 — Tested & Ranked",
  description:
    "The best power pickleball paddles of 2026, tested on court with lab-measured swing weight and specs. Ranked for driving power, serve pace, and offensive play. Every pick is unsponsored.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Best Power Pickleball Paddles of 2026 — Tested & Ranked",
    description: "Top 3 power paddles tested and ranked by swing weight, drive power, and offensive performance.",
    url: URL,
    type: "article",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Power Pickleball Paddles of 2026",
    description: "Top 3 power paddles ranked by a pro player with lab-measured specs.",
  },
};

const PICKS = [
  {
    slug: "friday-aura-pro-elongated",
    why: "The Friday Aura Pro earns the #1 power pick with a SW of 116.33 at just $169 — one of the best power-per-dollar ratios in our database. The 16mm core keeps enough touch for kitchen transitions, but this paddle's strength is on drives, serves, and putaways from the transition zone. The elongated shape gives you leverage and reach to dictate rallies. At $169 with $10 off using PLAYBOOK, it's a no-brainer for offensive players.",
  },
  {
    slug: "gherkin-draco-hybrid",
    seriesSlugs: [
      "gherkin-draco-hybrid",
      "gherkin-draco-elongated",
      "gherkin-draco-widebody",
    ],
    why: "The Gherkin Draco series offers power in three shapes — each with its own personality. The Hybrid at SW 108.27 is compact power for quick exchanges. The Elongated at SW 112.13 adds reach. The Widebody at SW 105.94 with TW 6.74 provides a big sweet spot with excellent stability. At $179.99 with 10% off using PLAYBOOK, the Draco gives power-oriented players genuine shape choices.",
  },
  {
    slug: "bread-and-butter-loco-elongated",
    seriesSlugs: [
      "bread-and-butter-loco-elongated",
      "bread-and-butter-loco-hybrid",
      "bread-and-butter-loco-widebody",
    ],
    why: "SW 118.20 on the Loco Elongated is elite driving territory — among the highest in our database. The extended shape stretches your reach at the baseline and the 16mm core keeps pop high without going dead. The Hybrid at SW 115.46 with TW 6.86 is the most stable shape. The Widebody at SW 108.06 with TW 7.29 is the most forgiving. At $199 with 10% off using PLAYBOOK, B&B delivers serious competitive credibility.",
  },
];

export default function BestPowerPaddlesPage() {
  return (
    <CategoryPage
      category="Power"
      accent="#ef4444"
      headline="Best Power Pickleball Paddles of 2026"
      intro="These paddles were selected for their swing weight, driving ability, and offensive performance. Every paddle was tested on court with lab-measured specs by a 5.5+ player."
      picks={PICKS}
    />
  );
}
