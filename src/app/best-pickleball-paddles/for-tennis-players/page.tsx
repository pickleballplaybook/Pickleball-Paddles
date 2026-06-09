import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-tennis-players";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Tennis Player Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "tennis players",
  headline: `Best Pickleball Paddles for Tennis Players (${currentYear()})`,
  intro:
    "Tennis players want a paddle that swings like a racket — longer reach, higher swing weight, real drive power. The wrong paddle feels light and twitchy. These five all have swing weights above 116, elongated shapes, and the racket-like feel that lets you skip the awkward conversion phase entirely.",
  trustSignals: ["Highest Swing Weights", "Elongated Shapes", "Lab-Measured Specs", "Discount Codes Included"],
  accent: "#ef4444",
  picks: [
    {
      slug: "selkirk-boomstik-elongated",
      label: "Best Overall for Tennis Players",
      why: "SW 120 with TW 6.84 is closest you'll get to a racket's natural plow-through. The Boomstik rewards a long, smooth stroke and a relaxed grip — exactly what tennis training reinforces. Selkirk's build quality is best-in-class; this is the pickleball paddle most tennis pros pick up first.",
    },
    {
      slug: "bread-and-butter-loco-elongated",
      seriesSlugs: ["bread-and-butter-loco-elongated", "bread-and-butter-loco-hybrid", "bread-and-butter-loco-widebody"],
      seriesName: "Bread & Butter Loco",
      label: "Best for Driving Power",
      why: "SW 118.20 on the Loco Elongated is elite driving territory. If your tennis game is built on heavy topspin groundstrokes, this paddle translates that swing path directly. B&B has serious tour credibility — many pros use it.",
    },
    {
      slug: "friday-aura-pro-elongated",
      label: "Best Value",
      why: "Tennis players don't need to spend $250. The Aura Pro at SW 116.33 and $169 (with $10 off via PLAYBOOK) is one of the best power-per-dollar paddles anywhere. Elongated shape, 16mm core, plenty of leverage on drives — same playing experience as paddles at twice the price.",
    },
    {
      slug: "luzz-tornazo-elongated",
      label: "Highest Power",
      why: "SW 121.89 is among the highest in our entire database. If you came from tennis with a heavy, deliberate stroke and you want a paddle that punishes weak returns, the Tornazo is it. At $229 with 15% off via PLAYBOOK, it's still cheaper than most flagships.",
    },
    {
      slug: "gearbox-pro-ultimate-elongated",
      label: "The Ultimate Plow Paddle",
      why: "Among the highest swing weights of any paddle ever measured — this is racket-like territory. Gearbox is known for engineering excellence, and the Pro Ultimate is designed for exactly this player: someone who wants the paddle to do the work after a smooth, controlled stroke.",
    },
  ],
  buyingGuide: {
    heading: "How to pick a paddle if you're coming from tennis",
    paragraphs: [
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Swing weight is the number that matters most.</strong> Tennis
        rackets have a natural plow-through that lets you generate pace without effort. Pickleball paddles below SW 110
        feel twitchy and unfamiliar. Aim for 115+ to keep the familiar feel — every paddle on this list qualifies.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Choose elongated shape over hybrid/widebody.</strong> Elongated
        gives you the closest reach profile to a tennis racket, plus the leverage you&apos;re used to on groundstrokes.
        Widebodies feel weird in a tennis player&apos;s hand — you&apos;ll miss the extra inch of length immediately.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>You&apos;ll need to learn the dink and reset.</strong> No paddle
        fixes this — it&apos;s a feel/touch thing your tennis brain has to unlearn. The paddles above are powerful but
        also have soft 16mm cores, so they don&apos;t punish you when you start working on the kitchen game.
      </p>,
      <p key="4">
        Compare any two paddles head-to-head with our <a href="/compare" style={{ color: "#ef4444" }}>comparison tool</a> —
        we have 400+ matchups for the top-trending paddles already built out.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for a former tennis player?",
      a: "The Selkirk Boomstik Elongated is the cleanest single pick — SW 120 and TW 6.84 give you the closest feel to a tennis racket. For raw power, the Luzz Tornazo (SW 122) or Gearbox Pro Ultimate. For value, the Friday Aura Pro at $169.",
    },
    {
      q: "Should tennis players choose elongated or widebody?",
      a: "Elongated, almost always. Tennis players are used to a longer hitting surface and the leverage that comes with it. Widebodies feel cramped to a tennis player — you'll miss the reach within the first session.",
    },
    {
      q: "What swing weight should a tennis player look for?",
      a: "115 minimum, ideally 117–122. Below 115 the paddle will feel twitchy and unfamiliar — you'll over-swing trying to generate pace. The Boomstik, Loco, Aura Pro, Tornazo, and Pro Ultimate all live in this range.",
    },
    {
      q: "Will a heavy pickleball paddle hurt my elbow?",
      a: "It can if the paddle is also stiff. The picks above all use 16mm cores with some softness built in. But if you have any elbow history, also check our paddles for elbow pain page — softer foam cores are the real elbow-friendly choice regardless of swing weight.",
    },
    {
      q: "How long does the tennis-to-pickleball transition take?",
      a: "Power game transfers in days. Dinking and kitchen game takes weeks-to-months — there's no muscle memory for it from tennis. Buy a paddle that supports both (every pick above has a 16mm core for the soft game) and play with intentional drills.",
    },
  ],
  relatedGuides: [
    "what-is-an-elongated-pickleball-paddle",
    "elongated-vs-widebody-pickleball-paddles",
    "pickleball-paddle-grip-size-guide",
    "what-is-swing-weight",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Tennis Players (${currentYear()}) — Tested & Ranked`,
  description:
    "The 5 best pickleball paddles for tennis players in 2026 — high swing weight, elongated shapes, racket-like feel. Lab-measured specs and discount codes included.",
  keywords: [
    "best pickleball paddle for tennis players",
    "pickleball paddle that feels like tennis racket",
    "best elongated pickleball paddle",
    "high swing weight pickleball paddle",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Tennis Players (${currentYear()})`,
    description: "5 high-SW elongated paddles tuned for the tennis-to-pickleball transition.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for tennis players" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Tennis Players (${currentYear()})`, description: "5 high-SW elongated paddles for the tennis-to-pickleball transition." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
