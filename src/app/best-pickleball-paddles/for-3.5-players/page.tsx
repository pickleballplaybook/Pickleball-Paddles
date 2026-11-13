import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-3.5-players";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "3.5 Player Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "3.5 players",
  headline: `Best Pickleball Paddles for 3.5 Players (${currentYear()})`,
  intro:
    "At 3.5 you're competitive — you're rallying, playing smart dinks, and starting to win matches with strategy. The gear question becomes real: you need a paddle that rewards your developing mechanics without punishing the mishits you still make. These five picks all sit in the 107–115 swing weight range: fast enough for kitchen battles, heavy enough to drive with intent. Every pick has real specs, not marketing.",
  trustSignals: ["Lab-Measured Specs", "Real On-Court Reviews", "Unsponsored Picks", "Discount Codes Included"],
  accent: "#60a5fa",
  picks: [
    {
      slug: "gruvn-lazr-16hd-hybrid",
      label: "Best Overall for 3.5",
      why: "Full foam 16mm core with SW 107 — the most balanced all-court pick for a player stepping into competitive 3.5 play. It's quick at the kitchen, generates real pop on drives, and the soft foam feel makes resets and dinks intuitive. At $169 with PLAYBOOK (~$152), it's the best spec-per-dollar paddle at this skill level. Most 3.5 players who try it don't upgrade until they reach 4.0.",
    },
    {
      slug: "honolulu-j2cr-crystal-blue-hybrid",
      seriesSlugs: ["honolulu-j2cr-crystal-blue-hybrid", "honolulu-j6cr-crystal-blue-elongated", "honolulu-j3cr-crystal-blue-widebody"],
      seriesName: "Honolulu Crystal Blue",
      label: "Best Spin & Grip Retention",
      why: "Austin reviewed the Crystal Blue Endurance Surface as one of the only surfaces in pickleball that actually solves the durable grit problem — spin holds or increases with use instead of dying. At SW 109.61, TW 6.57, it's easy to play for a 3.5 while still giving you elite spin data that matters at 3.5+ play. At $195 with 10% off via PLAYBOOK (~$176), it's a paddle you won't outgrow.",
    },
    {
      slug: "6-0-coral-hybrid",
      label: "Best Balanced All-Court",
      why: "SW 110.59, TW 6.62 — nothing extreme, nothing lacking. The Six Zero Coral is the most predictable all-court paddle in this range. If your game is about consistency and shot placement more than raw power, the Coral will feel immediately right. Six Zero's build quality is consistently excellent, and the hybrid shape gives you a bit more reach than a widebody without sacrificing too much forgiveness.",
    },
    {
      slug: "bread-and-butter-loco-2-hybrid",
      label: "Best S-Tier Step-Up",
      why: "Austin called the Loco 2 'arguably the greatest pickleball paddle of all time.' SW 111.19 with S-tier spin, power, and pop — it's a paddle that rewards you as your game grows. At 3.5 you'll benefit from its exceptional feel and premium Space Dust Grit surface. At $220, it's the investment pick for a 3.5 player ready to commit to their gear. Use code PLAYBOOK.",
    },
    {
      slug: "enhance-turbo-mpp-armorgrit-elongated",
      label: "Best Value Pick",
      why: "At $119.99 with PLAYBOOK ($20 off = ~$100), the Turbo MPP ArmorGrit is the best-value paddle for a 3.5 player who doesn't want to overspend yet. SW 114.48, TW 6.45 — legitimate specs that compete with paddles twice the price. ArmorGrit surface adds durable texture for spin. Austin reviewed the ArmorGrit version as an absolute game-changer for the price.",
    },
  ],
  buyingGuide: {
    heading: "What changes at 3.5",
    paragraphs: [
      <p key="0">
        At 3.5 you're past needing maximum forgiveness — your contact point is reasonably consistent. The spec questions
        that start to matter: Is my paddle quick enough for hand battles? Is my swing weight generating enough pace on
        drives? Do I want more pop or more control?
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Swing weight 107–115 is the 3.5 sweet spot.</strong>{" "}
        Below 107 you&apos;re working too hard to generate pace. Above 115 you start to lose hand speed at the kitchen.
        The GRUVN at 107 is on the lighter end (fast, nimble); the Loco 2 at 111 is in the middle (balanced); the
        ArmorGrit at 114 is toward the power end of the range.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Stick with 16mm at 3.5.</strong> Thinner 13mm or 14mm cores
        have a livelier feel but punish inconsistent contact. Your mechanics at 3.5 aren&apos;t locked in enough to
        take advantage of a thinner core. Every pick above is 16mm.
      </p>,
      <p key="3">
        Ready to move up in skill? See our{" "}
        <a href="/best-pickleball-paddles/for-4.0-players" style={{ color: "#60a5fa" }}>best paddles for 4.0 players</a>{" "}
        — the overlap is real, and some picks here (like the Loco 2) carry through to 4.0 and beyond.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for a 3.5 player?",
      a: "The GRUVN LAZR-16HD Full Foam (SW 107, ~$152 with PLAYBOOK) is the cleanest all-around pick for a 3.5 player — balanced, fast at the kitchen, and easy to dink with. For a step-up investment, the Bread & Butter Loco 2 Hybrid is what Austin calls 'arguably the greatest pickleball paddle of all time' — it'll carry you through 4.0 and beyond.",
    },
    {
      q: "Should a 3.5 player use an elongated or hybrid paddle?",
      a: "Hybrid is generally the right call at 3.5. Elongated paddles have smaller sweet spots that reward consistent contact — which comes more at 4.0+. Hybrid gives you slightly more reach than widebody with a larger sweet spot than elongated. It's the transitional shape.",
    },
    {
      q: "How much should a 3.5 player spend on a paddle?",
      a: "$100–$180 is the right range for most 3.5 players. The Enhance Turbo MPP ArmorGrit is ~$100 with PLAYBOOK and provides real specs. The GRUVN at ~$152 is the value sweet spot. At $195–$220 (Honolulu, Loco 2), you're buying paddles that won't need replacing until 4.5+.",
    },
    {
      q: "What swing weight should a 3.5 player use?",
      a: "107–115 is the 3.5 sweet spot. Under 107 is arm-friendly but can feel underpowered for baseline drives. Over 115 starts to slow your hand speed at the kitchen. Start in the 107–112 range and adjust from there based on whether you feel underpowered or sluggish at the net.",
    },
  ],
  relatedGuides: [
    "for-4.0-players",
    "for-intermediate",
    "most-forgiving",
    "under-100",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for 3.5 Players (${currentYear()}) — Tested & Ranked`,
  description:
    "The 5 best pickleball paddles for 3.5-rated players in 2026. Lab-measured swing weight, real on-court reviews, and discount codes for each pick.",
  keywords: [
    "best pickleball paddle for 3.5 player",
    "best pickleball paddle 3.5",
    "pickleball paddle for 3.5 rating",
    `best pickleball paddle 3.5 player ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for 3.5 Players (${currentYear()})`,
    description: "5 paddles ranked for 3.5-rated players — lab specs, real reviews, and discount codes.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for 3.5 players" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for 3.5 Players (${currentYear()})`, description: "5 paddles ranked for 3.5-rated players." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
