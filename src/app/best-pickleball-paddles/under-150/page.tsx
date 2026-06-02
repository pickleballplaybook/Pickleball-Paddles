import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { paddles, getPaddleBySlug } from "@/data/paddles";
import { effectivePrice } from "@/lib/price";
import { trendingScoreOf, paddleToPick } from "@/lib/specPicks";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "under-150";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

// Top 8 paddles priced under $150 (effective price after PLAYBOOK code).
// Sorted by trending engagement — the most-loved paddles in this budget tier.
const TOP_UNDER_150 = paddles
  .filter((p) => {
    const effective = effectivePrice(p);
    return effective > 0 && effective < 150;
  })
  .sort((a, b) => trendingScoreOf(b) - trendingScoreOf(a))
  .slice(0, 8);

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Under-$150 Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "budget-conscious players",
  headline: `Best Pickleball Paddles Under $150 (${currentYear()})`,
  intro:
    "The under-$150 tier is the sweet spot for serious paddles that don't break the bank. Below this price the build quality starts dropping fast; above it you're paying for spec tuning most players can't yet take advantage of. Every paddle below sits under $150 after our discount code — and every one is a legitimate competitive paddle, not a beginner toy. Ranked by trending engagement and measured specs.",
  trustSignals: ["After-Code Pricing", "All Under $150", "Real Foam Cores", "Discount Codes Included"],
  accent: "#facc15",
  picks: TOP_UNDER_150.map((p, i) => paddleToPick(p, {
    label: i === 0 ? "Best Overall Under $150" : i === 1 ? "Best Value" : `#${i + 1} Under $150`,
    angle: "value",
  })),
  buyingGuide: {
    heading: "What to expect — and what NOT to expect — under $150",
    paragraphs: [
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>$100–$150 is the budget sweet spot.</strong> Real foam-core
        construction, legitimate spec tuning, and competitive build quality all exist in this tier. You&apos;re
        not buying a beginner toy — you&apos;re buying a paddle that can carry you all the way to 4.0+ play.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>What you DON&apos;T get under $150:</strong> exotic
        materials (Kevlar weaves, Toray T700 face sheets), bleeding-edge tech, and the marginal spec optimizations
        that justify the $250–$300 price tags on premium paddles. For 95% of players, those don&apos;t matter.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>The PLAYBOOK code matters.</strong> Most paddles on this
        page are listed above $150 at MSRP — they drop below $150 with our 10–20% discount code. The savings stack
        on top of every paddle&apos;s own brand pricing.
      </p>,
      <p key="4">
        <strong style={{ color: "var(--text-primary)" }}>Going cheaper?</strong> See our{" "}
        <a href="/best-pickleball-paddles/under-125" style={{ color: "#facc15" }}>under $125 guide</a> —
        the tier where you start trading off build quality for price, so know what you&apos;re giving up.
      </p>,
      <p key="5">
        Going higher? See <a href="/best-pickleball-paddles/under-200" style={{ color: "#facc15" }}>under $200</a> or
        the <a href="/best-pickleball-paddles" style={{ color: "#facc15" }}>full best-paddles guide</a> for the
        premium tier.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle under $150?",
      a: `Based on trending engagement and measured specs, the ${TOP_UNDER_150[0]?.brand} ${TOP_UNDER_150[0]?.name} is currently the top under-$150 pick. It delivers premium-tier specs at a real-world price after the PLAYBOOK code.`,
    },
    {
      q: "Is $150 enough to get a good pickleball paddle?",
      a: "Yes — $150 is the sweet spot for serious paddles. Real foam cores, legitimate spec tuning, and competitive build quality all exist in this tier. You're not making sacrifices that hold back your game.",
    },
    {
      q: "What's the difference between a $150 paddle and a $250 paddle?",
      a: "Mostly marginal spec optimization and exotic materials. The $250 tier tends to have more precise weight tuning, premium face sheets, and bleeding-edge construction. For most players the on-court difference is small.",
    },
    {
      q: "Do these prices include the discount code?",
      a: "The picks above all sit under $150 after our PLAYBOOK code (typically 10–20% off). MSRP varies — check each paddle's detail page for the exact code and discount amount.",
    },
    {
      q: "Should I buy a cheaper paddle and upgrade later?",
      a: "Usually not. A solid $130 paddle from this list will outperform a $75 starter for years. The cost-per-use math favors buying once at the right price tier.",
    },
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles Under $150 (${currentYear()}) — Real Competitive Paddles`,
  description:
    "The 8 best pickleball paddles under $150 — after our PLAYBOOK discount code. Real foam cores, serious spec tuning, competitive build quality. The budget sweet spot for paddles that grow with your game.",
  keywords: [
    "best pickleball paddle under $150",
    "best pickleball paddles under 150",
    "budget pickleball paddle",
    "cheap pickleball paddle",
    `pickleball paddle under $150 ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles Under $150 (${currentYear()})`,
    description: "8 paddles under $150 after PLAYBOOK code — the budget sweet spot.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(TOP_UNDER_150[0]?.slug ?? "")?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(TOP_UNDER_150[0].slug)?.image}`, alt: "Best pickleball paddles under $150" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles Under $150 (${currentYear()})`, description: "8 paddles under $150 after PLAYBOOK code." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
