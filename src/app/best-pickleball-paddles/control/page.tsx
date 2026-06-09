import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import CategoryPage from "../CategoryPage";

const URL = `${siteConfig.siteUrl}/best-pickleball-paddles/control`;

export const metadata: Metadata = {
  title: "Best Control Pickleball Paddles of 2026 — Tested & Ranked",
  description:
    "The best control pickleball paddles of 2026, tested on court with lab-measured specs. Ranked for touch, dwell time, kitchen play, and shot placement. Every pick is unsponsored.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Best Control Pickleball Paddles of 2026 — Tested & Ranked",
    description: "Top 3 control paddles tested and ranked for touch, dwell time, and kitchen performance.",
    url: URL,
    type: "article",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Control Pickleball Paddles of 2026",
    description: "Top 3 control paddles ranked by a pro player with lab-measured specs.",
  },
};

const PICKS = [
  {
    slug: "gruvn-lazr-16hd-hybrid",
    why: "The Gruvn Lazr-16hd Full Foam earns the #1 control pick because it doesn't ask you to compromise. The full-foam 16mm core keeps touch and kitchen feel dialed in — resets and drops feel locked in. SW 107.07 maneuvers quickly for fast hands at the net, and TW 6.29 provides solid stability. At $169 with 10% off using PLAYBOOK, it's one of the most complete control paddles at any price.",
  },
  {
    slug: "beyond-measure-ronin-hybrid",
    seriesSlugs: [
      "beyond-measure-ronin-hybrid",
      "beyond-measure-ronin-elongated",
    ],
    why: "The Beyond Measure Ronin delivers control-oriented specs at a starter price. The Hybrid at SW 115.65 with TW 6.36 provides solid stability, while the Elongated at SW 114.98 with TW 6.53 adds reach with even better off-center forgiveness. Both have a soft 16mm core that rewards placement over pace. At $117 with 10% off using PLAYBOOK, these are among the best value control paddles available.",
  },
  {
    slug: "friday-aura-elongated",
    seriesSlugs: [
      "friday-aura-elongated",
      "friday-aura-hybrid",
    ],
    why: "The Friday Aura is built for players who win with placement, not pace. The 16mm core is exceptionally soft off the face — dwell time is among the best we've tested at this price. The Elongated at SW 114.73 gives extra reach without sacrificing feel at the kitchen. The Hybrid at SW 108.60 is the more maneuverable option for pure NVZ specialists. At $129 with $10 off using PLAYBOOK, it's one of the most honest value plays in control.",
  },
];

export default function BestControlPaddlesPage() {
  return (
    <CategoryPage
      category="Control"
      accent="#4ade80"
      headline="Best Control Pickleball Paddles of 2026"
      intro="These paddles were selected for their touch, dwell time, and kitchen play performance. Every paddle was tested on court with lab-measured specs by a 5.5+ player."
      picks={PICKS}
      relatedGuides={["power-vs-control-pickleball-paddles", "what-is-twist-weight", "pickleball-paddle-thickness-explained", "what-is-a-foam-core-pickleball-paddle"]}
    />
  );
}
