import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-recreational-players";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Recreational Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "recreational players",
  headline: `Best Pickleball Paddles for Recreational Players (${currentYear()})`,
  intro:
    "Recreational players want a paddle that's easy to play, doesn't cost $250, and holds up over months of casual use. You're not drilling every week or tracking swing weight — you want to show up, rally, and have fun. These five picks are the easiest paddles to play with, at prices that make sense for recreational use, with builds that don't wear out in three months.",
  trustSignals: ["Easy to Play", "Durable Builds", "Fair Prices", "Discount Codes Included"],
  accent: "#4ade80",
  picks: [
    {
      slug: "enhance-turbo-epp-widebody",
      label: "Best All-Around Recreational Pick",
      why: "TW 7.07 (highly forgiving), SW 108.35, 16mm core — everything that makes a recreational paddle easy to play. $119.99 list, then $20 off with PLAYBOOK = $99.99. Austin reviewed the Turbo EPP as delivering authentic quality at a fair price. The widebody shape gives you the largest sweet spot available. For a recreational player who wants to play well without overthinking gear, this is the pick.",
    },
    {
      slug: "selkirk-amped-s2-widebody",
      label: "Best Brand-Name Recreational",
      why: "Selkirk is one of the most respected paddle brands — and the Amped S2 is their $100 entry point. SW 97.68 (lightest in our database), widebody shape, 16mm core. If you want the confidence of a top-brand paddle at a recreational price, the S2 delivers that. No discount code needed — $100 flat at selkirk.com.",
    },
    {
      slug: "vatic-pro-v-sol-tour-evergrit-widebody",
      label: "Best for Casual Competitive Play",
      why: "TW 7.06, SW 107.06, Evergrit surface — the Vatic Pro widebody is the pick for a recreational player who occasionally plays more seriously (open recreation, casual tournaments). The Evergrit surface adds spin that gives your game an extra dimension. At $109 - $10 with PLAYBOOK = $99. Great value at this price.",
    },
    {
      slug: "honolulu-j2cr-crystal-blue-hybrid",
      seriesSlugs: ["honolulu-j2cr-crystal-blue-hybrid", "honolulu-j6cr-crystal-blue-elongated", "honolulu-j3cr-crystal-blue-widebody"],
      seriesName: "Honolulu Crystal Blue",
      label: "Best Premium Recreational",
      why: "If budget allows ($195 with 10% off PLAYBOOK = ~$176), the Crystal Blue Endurance Surface is the best paddle for a recreational player who wants to play well for years without a new purchase. Austin's review: the endurance surface solves durable grit — it doesn't die after 40 hours. For a recreational player who plays 2x/week, this paddle outlasts any budget build.",
    },
    {
      slug: "6-0-coral-hybrid",
      label: "Best Feel for Recreational Play",
      why: "SW 110.59, TW 6.62 — Six Zero's Coral is known for a predictable, reliable feel that makes the game enjoyable. Nothing surprising, nothing frustrating. At $200 with PLAYBOOK (10% off = $180), it's a step up from budget options with a build that feels premium without demanding premium mechanics to enjoy it.",
    },
  ],
  buyingGuide: {
    heading: "What recreational players actually need from a paddle",
    paragraphs: [
      <p key="0">
        Recreational players need three things: large sweet spot (forgiveness), easy swing weight (arm comfort over
        multiple sessions), and a build that holds up over months rather than weeks. You don&apos;t need tour-grade
        grit surface that requires careful storage — you need a paddle that plays consistently well through casual use.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Widebody is the right shape for recreational play.</strong>{" "}
        Elongated paddles have smaller sweet spots that require deliberate mechanics to use well. Widebody paddles
        are genuinely easier to play well with — larger face, higher twist weight, more natural dwell. Every budget
        pick above is widebody or hybrid.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Budget doesn&apos;t mean bad.</strong>{" "}
        The Enhance Turbo EPP at $99.99 after discount has lab-measured specs that compete with $150 paddles. The
        Vatic Pro at $99 with PLAYBOOK has an Evergrit surface that adds real spin. You don&apos;t need to spend
        $200 to play with legitimate gear as a recreational player.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for a recreational player?",
      a: "The Enhance Turbo EPP Widebody at $99.99 after PLAYBOOK discount is the best all-around recreational pick — easy to play, forgiving, durable. For a premium option that outlasts budget builds, the Honolulu Crystal Blue hybrid at ~$176 with PLAYBOOK.",
    },
    {
      q: "How much should a recreational pickleball player spend on a paddle?",
      a: "$70–$150 is the right range for recreational players. Below $60, build quality drops fast (plastic composites, no real carbon). Above $200, you're paying for spec tuning that only benefits players with consistent mechanics. The $99–$130 sweet spot gives you real quality without over-investing.",
    },
    {
      q: "How often does a recreational player need to replace their paddle?",
      a: "A quality paddle used 1–2x per week should last 1–2 years before the surface degrades noticeably. Budget paddles with standard carbon faces may lose grit in 6–9 months. The Honolulu Crystal Blue's Endurance Surface is specifically designed to outlast normal surfaces — worth the premium if you want longevity.",
    },
    {
      q: "What's a good starter recreational paddle?",
      a: "The Selkirk Amped S2 at $100 — lightest paddle in the database, widebody shape, Selkirk brand reliability. Or the Enhance Turbo EPP Widebody at $99.99 with PLAYBOOK for a foam-core alternative with high twist weight (TW 7.07). Both are genuine quality options at $100.",
    },
  ],
  relatedGuides: [
    "for-beginners",
    "under-100",
    "for-3.0-players",
    "most-forgiving",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Recreational Players (${currentYear()}) — Easy to Play`,
  description:
    "The 5 best pickleball paddles for recreational players in 2026. Easy to play, durable, fair prices — ranked for casual players who want quality without overspending.",
  keywords: [
    "best pickleball paddle for recreational players",
    "best recreational pickleball paddle",
    "casual pickleball paddle",
    "easy to play pickleball paddle",
    `recreational pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Recreational Players (${currentYear()})`,
    description: "5 easy-to-play paddles for recreational players at fair prices with real specs.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for recreational players" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Recreational Players (${currentYear()})`, description: "5 easy-to-play paddles for recreational players." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
