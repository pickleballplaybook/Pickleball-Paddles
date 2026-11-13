import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-3.0-players";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "3.0 Player Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "3.0 players",
  headline: `Best Pickleball Paddles for 3.0 Players (${currentYear()})`,
  intro:
    "At 3.0 you understand the game and you're developing consistency — you can rally, you're learning the kitchen game, and you have real shots. What you need from a paddle is maximum forgiveness (for the mishits you still make), a comfortable swing weight, and a widebody shape that rewards improving mechanics without punishing off days. Every pick below is optimized for the developing 3.0 player.",
  trustSignals: ["High Twist Weight", "Widebody Shapes", "Lab-Measured Specs", "Discount Codes Included"],
  accent: "#4ade80",
  picks: [
    {
      slug: "chorus-coda-harmony-grit-widebody",
      label: "Best Overall for 3.0",
      why: "TW 7.41 (one of the highest in the database), SW 111.81, widebody shape. The Coda Harmony hits every 3.0 requirement: maximum forgiveness, comfortable swing weight, large sweet spot, and a premium Harmony Grit surface that rewards your developing spin game. At $199.99 with PLAYBOOK, it's a paddle that will carry you through 3.5 without a replacement purchase.",
    },
    {
      slug: "bread-and-butter-fat-boy-widebody",
      label: "Biggest Sweet Spot",
      why: "TW 7.39, SW 109.52 — the Fat Boy is the most forgiving paddle in the B&B lineup. At 3.0 you benefit from the widest face available: mishits toward the edge still go where you aimed them. B&B's build quality is consistently excellent. At $189.99 with PLAYBOOK, it's a genuine premium paddle at a justified price.",
    },
    {
      slug: "enhance-turbo-epp-widebody",
      label: "Best Budget 3.0 Pick",
      why: "TW 7.07, SW 108.35, widebody at $119.99 - $20 with PLAYBOOK = $99.99. The best value 3.0 paddle: real foam-core build, highly forgiving, and easy on the arm. If you're at 3.0 and not ready to invest $200 in a paddle yet, this is the pick that won't hold you back. Austin reviewed the Turbo EPP as delivering authentic quality at its price.",
    },
    {
      slug: "engage-pursuit-pro-2-widebody",
      label: "Best Balanced Value",
      why: "TW 7.21, SW 108.79, widebody at $129.99 — the Engage Pursuit Pro 2 widebody is the best combination of forgiveness, swing weight, and price in the $130 range. Engage builds consistent paddles, and the Pursuit Pro 2 is their most accessible widebody. Code PLAYBOOK for additional savings.",
    },
    {
      slug: "vatic-pro-v-sol-tour-evergrit-widebody",
      label: "Best for Developing Spin",
      why: "TW 7.06, SW 107.06 at $109 - $10 = $99. The Vatic Pro widebody adds an Evergrit surface that starts introducing spin to your developing game. At 3.0 you're beginning to add topspin to your forehand — a grit surface helps that process by creating more RPMs on the same swing. Great budget option with a surface that rewards your improving mechanics.",
    },
  ],
  buyingGuide: {
    heading: "Why 3.0 players should prioritize forgiveness over performance",
    paragraphs: [
      <p key="0">
        At 3.0, contact consistency is still variable — some shots are hit cleanly, some aren&apos;t. That means
        twist weight (forgiveness on off-center contact) has a bigger impact on your game than any performance spec.
        A high-TW widebody paddle turns your 3.0 mishits into acceptable shots instead of unforced errors.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>All five picks are widebody — intentionally.</strong>{" "}
        Widebody paddles have the largest face area in pickleball. Elongated paddles have smaller sweet spots that
        punish inconsistent contact. At 3.0, elongated is the wrong shape — widebody covers your developing mechanics.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Every pick is 16mm.</strong>{" "}
        Thicker cores are softer, more forgiving on mishits, and easier to control at the net. 13mm paddles add pop
        but require consistent mechanics to benefit from. At 3.0, 16mm is the right choice universally.
      </p>,
      <p key="3">
        Improving to 3.5? See our{" "}
        <a href="/best-pickleball-paddles/for-3.5-players" style={{ color: "#4ade80" }}>best paddles for 3.5 players</a>{" "}
        — several picks here (especially the Coda Harmony Grit) carry through to 3.5 without replacement.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for a 3.0 player?",
      a: "The Chorus Coda Harmony Grit Widebody (TW 7.41) is the best all-around pick for a 3.0 player — maximum forgiveness, premium surface, and a build that scales to 3.5+. For budget-conscious 3.0 players, the Enhance Turbo EPP Widebody at $99.99 with PLAYBOOK is the best value.",
    },
    {
      q: "Should a 3.0 player use widebody, hybrid, or elongated?",
      a: "Widebody, hands down. At 3.0, your contact point is still developing — widebody's large sweet spot covers the variability and reduces unforced errors. Hybrid is a step up in difficulty; elongated requires consistent contact to play well. Every pick on this page is widebody for that reason.",
    },
    {
      q: "How much should a 3.0 player spend on a paddle?",
      a: "$70–$150 is the right range. The Vatic Pro and Enhance EPP are both under $100 with PLAYBOOK and are genuine quality paddles. At $129.99, the Engage Pursuit Pro 2 steps up the spec. The $199 picks (Coda Harmony, Fat Boy) are worth it if you're serious about improving — they'll last to 3.5+.",
    },
    {
      q: "Can a 3.0 player use the same paddle as a 4.0 player?",
      a: "Yes — many of the paddles above are also on the 4.0 list. The Chorus Coda Harmony Grit Widebody is excellent at both levels. What changes isn't the paddle — it's what you do with it. A 3.0 player buying a 4.0 paddle won't magically play better; the specs that benefit 3.0 play (forgiveness, soft core) happen to be in the same paddles.",
    },
  ],
  relatedGuides: [
    "for-3.5-players",
    "for-beginners",
    "most-forgiving",
    "under-100",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for 3.0 Players (${currentYear()}) — Forgiving, Easy to Play`,
  description:
    "The 5 best pickleball paddles for 3.0-rated players in 2026. High twist weight, widebody shapes, and fair prices for developing players.",
  keywords: [
    "best pickleball paddle for 3.0 player",
    "best pickleball paddle 3.0",
    "pickleball paddle 3.0 rating",
    `best pickleball paddle 3.0 player ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for 3.0 Players (${currentYear()})`,
    description: "5 forgiving widebody paddles for 3.0-rated players with lab-measured specs and discount codes.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for 3.0 players" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for 3.0 Players (${currentYear()})`, description: "5 forgiving paddles for 3.0-rated players." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
