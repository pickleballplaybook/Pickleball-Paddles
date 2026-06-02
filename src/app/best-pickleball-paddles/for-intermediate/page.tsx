import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-intermediate";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Intermediate Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "intermediate players",
  headline: `Best Pickleball Paddles for Intermediate Players (${currentYear()})`,
  intro:
    "Intermediate players (3.5–4.5) are at the level where spec choice actually starts to change your game. You're past needing maximum forgiveness, but not yet ready for the brutal swing weights pros play with. These five paddles hit the sweet spot — real spec sheets at fair prices.",
  trustSignals: ["Lab-Measured Specs", "Tour-Level Builds", "Unsponsored Reviews", "Discount Codes Included"],
  accent: "#60a5fa",
  picks: [
    {
      slug: "gruvn-lazr-16hd-hybrid",
      label: "Best Overall",
      why: "Full-foam 16mm core with a soft, planted feel — easily the best all-court paddle in this price bracket. SW 107 keeps it quick at the kitchen while still generating real pop off the baseline. The hybrid shape gives you reach without sacrificing hand speed. At $169 with PLAYBOOK ($152), it's the paddle most intermediate players should buy first.",
    },
    {
      slug: "honolulu-j2cr-crystal-blue-hybrid",
      seriesSlugs: ["honolulu-j2cr-crystal-blue-hybrid", "honolulu-j6cr-crystal-blue-elongated", "honolulu-j3cr-crystal-blue-widebody"],
      seriesName: "Honolulu Crystal Blue",
      label: "Best Spec Sheet for the Price",
      why: "The J2CR hybrid pairs SW 109.61 with TW 6.57 in a build that holds its surface grip far longer than most carbon faces. Three shapes in the series means there's a match for your game. At $195 with 10% off via PLAYBOOK (~$176), this is pro spec data for less than a flagship.",
    },
    {
      slug: "6-0-coral-hybrid",
      label: "Best Balanced All-Court",
      why: "Nothing extreme, nothing lacking. SW 110.59 with TW 6.62 is exactly the sweet spot for an intermediate all-court player who wants a reliable everyday paddle. The Coral isn't flashy, but it's a paddle that will quietly make you better.",
    },
    {
      slug: "friday-aura-pro-elongated",
      label: "Best for Power Players",
      why: "Ready to lean into a power game? SW 116.33 is real driving territory, and the elongated shape gives you reach to dictate rallies. The 16mm core keeps enough touch for the kitchen. At $169 with PLAYBOOK, it's outstanding power-per-dollar.",
    },
    {
      slug: "beyond-measure-ronin-hybrid",
      seriesSlugs: ["beyond-measure-ronin-hybrid", "beyond-measure-ronin-elongated"],
      seriesName: "Beyond Measure Ronin",
      label: "Best Value",
      why: "If your budget is tighter, the Ronin is the spec leader under $125. Both shapes pair high swing weight with stable twist weight that competes with paddles at twice the price. At ~$105 with PLAYBOOK, you can pocket the difference and still play with a paddle that's tournament-ready.",
    },
  ],
  buyingGuide: {
    heading: "What changes for intermediate players",
    paragraphs: [
      <p key="1">
        At 3.5+ you start to feel which specs match your game. Power players want higher swing weights (114+). Control
        players want softer 16mm cores and more dwell time. All-court players want the balanced middle. The picks above
        cover all three lanes.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Your stroke is consistent enough now to benefit from a thinner core if you want one.</strong>{" "}
        13mm paddles add pop and a livelier feel that 16mm can&apos;t match. Worth experimenting with as a secondary
        paddle if you have one paddle you love already.
      </p>,
      <p key="3">
        Looking at every option in this price tier? See our <a href="/best-pickleball-paddles/under-200" style={{ color: "#60a5fa" }}>best paddles under $200</a> —
        every paddle on this list lives there, plus the full filterable grid of sub-$200 options.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for an intermediate player?",
      a: "The GRUVN LAZR-16HD Full Foam (about $152 with PLAYBOOK) is the cleanest single pick — it's a real foam-core, all-court paddle with specs that compete with $250 flagships. For power, the Friday Aura Pro. For all-court value, the Beyond Measure Ronin.",
    },
    {
      q: "Should an intermediate player switch to a 13mm paddle?",
      a: "Worth trying as a secondary, not your only paddle. 13mm adds pop and a livelier feel, but plays stiffer and demands more consistent contact. Keep your 16mm for control days, try a 13mm for matches where you want more pace.",
    },
    {
      q: "What swing weight is best for intermediate players?",
      a: "108–116 is the sweet spot for most. Higher than 118 starts to slow your hand speed at the kitchen. Lower than 108 and you'll feel like you're working too hard to generate pace. The specific number depends on whether you play more power or control.",
    },
    {
      q: "How much should an intermediate player spend?",
      a: "$140–$200 is the sweet spot for spec-quality per dollar. Above $200 is mostly diminishing returns — premium materials and brand prestige, but not necessarily a better paddle for your game.",
    },
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Intermediate Players (${currentYear()}) — Tested & Ranked`,
  description:
    "The 5 best pickleball paddles for intermediate (3.5–4.5) players in 2026. Real spec sheets, lab-measured swing weight + twist weight, and discount codes for each.",
  keywords: [
    "best pickleball paddle for intermediate",
    "best intermediate pickleball paddle",
    "best pickleball paddle for 4.0 player",
    "best pickleball paddle for 3.5 player",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Intermediate Players (${currentYear()})`,
    description: "5 paddles tuned for 3.5–4.5 players with lab-measured specs and discount codes.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for intermediate players" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Intermediate Players (${currentYear()})`, description: "5 paddles tuned for 3.5–4.5 players." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
