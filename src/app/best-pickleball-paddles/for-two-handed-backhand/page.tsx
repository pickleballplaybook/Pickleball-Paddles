import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-two-handed-backhand";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Two-Handed Backhand Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "tennis converts with two-handed backhand",
  headline: `Best Pickleball Paddles for Two-Handed Backhand (${currentYear()})`,
  intro:
    "Tennis converts who play a two-handed backhand need a longer handle — most paddles have a 5\" handle, but elongated-shape paddles typically run 5.5\" or longer. That extra handle length is what enables a proper two-handed grip without finger crowding. Every pick below has an elongated shape, a longer handle, and the swing weight range that rewards the full backswing mechanics that tennis players bring to pickleball.",
  trustSignals: ["Long Handle Builds", "Elongated Shape", "On-Court Tennis Convert Testing", "Discount Codes Included"],
  accent: "#0a64bc",
  picks: [
    {
      slug: "11six24-hurache-x-jelly-bean-2-elongated",
      label: "Best for Two-Handed Backhand",
      why: "Austin's review: 'Reach-and-power specialist. Extra leverage on groundstrokes. Longer handle optimized for two-handed backhands. Favorite for tennis converts transitioning to pickleball. Rewards players who take full, deliberate swings.' SW 116.37, HexGrit surface, UPA-A approved. The Hurache-X JB2 was specifically designed with tennis converts in mind. At $169.99 with $10 off via PLAYBOOK = $159.99.",
    },
    {
      slug: "bread-and-butter-loco-2-elongated",
      label: "Best Premium Two-Handed Backhand",
      why: "SW 119.14 with Austin's S-tier rating — the Loco 2 Elongated has the higher swing weight that rewards a full two-handed backhand swing. Longer handle for two-handed grip, Space Dust Grit for elite spin on groundstrokes. Tennis converts who want an S-tier tool for their two-handed game will feel immediately at home. $220 with PLAYBOOK.",
    },
    {
      slug: "holbrook-mav-elongated",
      label: "Best Value Two-Handed Backhand",
      why: "SW 118.43 at $99.99 — elongated shape with a long handle at an exceptional price. The Holbrook Mav is the pick for tennis converts who want a proper two-handed backhand tool without overspending. TW 6.49 keeps off-center groundstrokes directional. Code PLAYBOOK applies.",
    },
    {
      slug: "gearbox-pressure-x-8e-elongated",
      label: "Best All-Court Two-Handed Backhand",
      why: "The Pressure X 8E — SW 117.78 with Austin's review: 'all-court versatility and balance, impressive forgiveness across the entire hitting surface.' Tennis converts rely on their backhand as a weapon; the 8E's consistent sweet spot rewards the bigger swing mechanics of a two-hander. SpinLock surface for topspin. $279.99 with PLAYBOOK.",
    },
    {
      slug: "head-radical-elongated",
      label: "Best Brand Familiarity Pick",
      why: "Head is synonymous with tennis — if you're a tennis convert who already trusts the Head brand, the Radical Elongated is a natural bridge paddle. SW 118.67, elongated shape, 16mm core. At $169 with PLAYBOOK (10% off = ~$152), it's a familiar brand with pickleball-specific engineering. Good starting point for tennis players who want to stay in their equipment ecosystem.",
    },
  ],
  buyingGuide: {
    heading: "What tennis converts need to know about paddle handles",
    paragraphs: [
      <p key="0">
        Most pickleball paddles have a 5&quot; handle — fine for one-handed play, but cramped for two-handed grips.
        Elongated-shape paddles typically have 5.5&quot;–5.75&quot; handles. The paddles above all have elongated shapes
        with handles that accommodate two hands without finger crowding. Check the handle length spec before buying.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Heavier swing weight rewards tennis backhand mechanics.</strong>{" "}
        Two-handed backhands generate power through a full shoulder-rotation swing — bigger swing = more swing weight
        needed to transfer energy to the ball. SW 115+ is the zone for two-handed backhand power. SW 107–112 feels
        underpowered for a player with full tennis mechanics.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>The kitchen game is the adjustment, not the backhand.</strong>{" "}
        Most tennis converts struggle with dinking and the NVZ game, not their groundstrokes. Consider pairing a
        power-spec elongated paddle (for when you&apos;re at the baseline) with practice sessions focused on
        drop shots and dinking. The paddle won&apos;t fix the adjustment — but the right tool helps.
      </p>,
      <p key="3">
        New to pickleball from tennis? See our{" "}
        <a href="/best-pickleball-paddles/for-tennis-players" style={{ color: "#60a5fa" }}>best paddles for tennis players</a>{" "}
        — a broader guide covering all the spec considerations for the tennis-to-pickleball transition.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for a two-handed backhand?",
      a: "The 11SIX24 Hurache-X Jelly Bean 2 — Austin reviewed it specifically as optimized for two-handed backhands and tennis converts. The longer handle and elongated shape with SW 116.37 reward full swing mechanics. For premium S-tier, the Bread & Butter Loco 2 Elongated (SW 119.14).",
    },
    {
      q: "How long should a pickleball handle be for a two-handed backhand?",
      a: "5.5\" or longer. Elongated-shape paddles typically have 5.5\"–5.75\" handles. Standard pickleball paddles (widebody, hybrid) often have 5\" handles — fine for one hand, tight for two. Every pick on this page is elongated with a longer handle.",
    },
    {
      q: "Can I use my tennis mechanics in pickleball?",
      a: "Groundstroke mechanics transfer directly — the two-handed backhand, flat forehand, and topspin game all work in pickleball. The adjustment is the kitchen game: shorter swings, soft hands, and dinking are very different from tennis net play. The right paddle helps with groundstrokes; the adjustment is mostly skill development.",
    },
    {
      q: "Should a tennis convert use an elongated or hybrid pickleball paddle?",
      a: "Elongated for the two-handed backhand — longer handle, more reach, higher swing weight from head-heavy balance. If you're also working on your kitchen game, a hybrid is a reasonable compromise (slightly shorter handle but less extreme). Most dedicated tennis converts prefer elongated.",
    },
  ],
  relatedGuides: [
    "for-tennis-players",
    "for-singles",
    "for-bangers",
    "for-4.0-players",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Two-Handed Backhand (${currentYear()}) — Long Handle`,
  description:
    "The 5 best pickleball paddles for players with a two-handed backhand in 2026. Long handle elongated builds reviewed for tennis converts transitioning to pickleball.",
  keywords: [
    "best pickleball paddle for two handed backhand",
    "pickleball paddle long handle",
    "pickleball paddle tennis convert",
    "elongated pickleball paddle handle",
    `pickleball paddle two handed backhand ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Two-Handed Backhand (${currentYear()})`,
    description: "5 long-handle elongated paddles for tennis converts with two-handed backhands.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for two-handed backhand" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Two-Handed Backhand (${currentYear()})`, description: "5 long-handle paddles for tennis converts and two-handed backhand players." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
