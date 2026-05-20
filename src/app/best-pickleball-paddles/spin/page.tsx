import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import CategoryPage from "../CategoryPage";

const URL = `${siteConfig.siteUrl}/best-pickleball-paddles/spin`;

export const metadata: Metadata = {
  title: "Best Spin Pickleball Paddles of 2026 — Tested & Ranked | Pickleball Playbook",
  description:
    "The best spin pickleball paddles of 2026, tested on court with lab-measured specs. Ranked by surface texture, dwell time, and RPM generation. Every pick is unsponsored.",
  alternates: { canonical: URL },
  openGraph: {
    title: "Best Spin Pickleball Paddles of 2026 — Tested & Ranked",
    description: "Top 3 spin paddles tested and ranked. Surface texture, dwell time, and RPM generation analyzed.",
    url: URL,
    type: "article",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Spin Pickleball Paddles of 2026",
    description: "Top 3 spin paddles ranked by a pro player with lab-measured specs.",
  },
};

const PICKS = [
  {
    slug: "honolulu-j6cr-crystal-blue-elongated",
    seriesSlugs: [
      "honolulu-j2cr-crystal-blue-hybrid",
      "honolulu-j3cr-crystal-blue-widebody",
      "honolulu-j6cr-crystal-blue-elongated",
    ],
    why: "The Honolulu Crystal Blue Endurance Surface series is the spin king of 2026. The Endurance Surface face generates RPMs that stay consistent over time — something most paddles can't claim. Three shapes cover every preference, and the textured face grabs the ball exceptionally well on serves, drives, and dinks. At $195 with 10–15% off using PLAYBOOK, the series offers genuine quality at an honest price.",
  },
  {
    slug: "11six24-vapor-power-2-hybrid",
    seriesSlugs: [
      "11six24-vapor-power-2-hybrid",
      "11six24-hurache-power-2-elongated",
      "11six24-pegasus-power-2-widebody",
    ],
    why: "The 11SIX24 Power 2's HexGrit surface is one of the best for spin generation. The Vapor Hybrid leads with SW 113.77 and TW 6.73, giving you the stability and power to put heavy topspin on every drive. Three shapes let you choose your ideal balance of reach, sweet spot, and maneuverability. Premium build quality rounds out a complete spin platform.",
  },
  {
    slug: "thrive-ignite-pro-series-hybrid",
    why: "The Thrive Ignite Pro Series brings a textured 15.5mm face that grabs the ball exceptionally well. SW 111.16 with TW 6.44 provides a balanced platform for spin-heavy play, and the hybrid shape keeps things maneuverable at the kitchen. At $219.99 with 10% off using PLAYBOOK, it's a spin-forward paddle with enough control for all-court play.",
  },
];

export default function BestSpinPaddlesPage() {
  return (
    <CategoryPage
      category="Spin"
      accent="#f97316"
      headline="Best Spin Pickleball Paddles of 2026"
      intro="These paddles were selected for their surface texture, dwell time, and ability to generate heavy topspin consistently. Every paddle was tested on court with lab-measured specs by a 5.5+ player."
      picks={PICKS}
    />
  );
}
