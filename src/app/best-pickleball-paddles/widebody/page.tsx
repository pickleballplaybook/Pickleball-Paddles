import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { paddles, getPaddleBySlug } from "@/data/paddles";
import { forgivenessScore, paddleToPick } from "@/lib/specPicks";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "widebody";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

// Top 8 widebody paddles, ranked by twist-weight-dominant forgiveness score.
// Widebody paddles are inherently more forgiving than other shapes — this
// page ranks them against each other to find the most forgiving of the
// already-forgiving group.
const TOP_WIDEBODY = paddles
  .filter((p) => p.shape === "Widebody")
  .sort((a, b) => forgivenessScore(b) - forgivenessScore(a))
  .slice(0, 8);

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Widebody Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "widebody players",
  headline: `Best Widebody Pickleball Paddles (${currentYear()})`,
  intro:
    "Widebody paddles have the largest sweet spot in pickleball — the wider face geometry means off-center hits get punished less than any other shape. This is the right shape for anyone who values forgiveness over reach: beginners, recreational players, doubles specialists who live at the kitchen, and anyone managing arm pain. Below are the 8 best widebody paddles, ranked by measured twist weight (forgiveness) and swing weight (ease of use).",
  trustSignals: ["Lab-Measured Specs", "Twist-Weight Ranked", "All Widebody Shapes", "Discount Codes Included"],
  accent: "#22d3ee",
  picks: TOP_WIDEBODY.map((p, i) => paddleToPick(p, {
    label: i === 0 ? "Best Overall Widebody" : i === 1 ? "Biggest Sweet Spot" : `#${i + 1} Widebody`,
    angle: "forgiveness",
  })),
  buyingGuide: {
    heading: "Why widebody — and when to pick a different shape",
    paragraphs: [
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Widebody = biggest sweet spot.</strong> The wider face
        geometry means more of the paddle is &quot;in play&quot; on any given swing. Mishits toward the edges still
        carry — instead of dying or sailing off-target the way they would on a thin elongated face.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Widebody trades reach for forgiveness.</strong> You give
        up about an inch of reach versus an elongated paddle. That matters less than most players think — reach
        is rarely the limiting factor in a typical rally. Forgiveness is.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Best for: beginners, kitchen-heavy doubles players, anyone with elbow pain.</strong>{" "}
        If your contact point is still inconsistent, or you play 80% of your points at the non-volley line, or
        you&apos;re managing tennis elbow — widebody is the right shape, full stop.
      </p>,
      <p key="4">
        <strong style={{ color: "var(--text-primary)" }}>Skip widebody if: you played tennis and want reach, or you&apos;re a singles-heavy power player.</strong>{" "}
        See our <a href="/best-pickleball-paddles/elongated" style={{ color: "#22d3ee" }}>best elongated paddles</a> page
        — that shape will fit your game better.
      </p>,
      <p key="5">
        Compare against the other shapes in <a href="/best-pickleball-paddles/hybrid" style={{ color: "#22d3ee" }}>best hybrid paddles</a>{" "}
        (middle ground), or browse all paddles in our <a href="/paddles" style={{ color: "#22d3ee" }}>full paddle database</a>.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best widebody pickleball paddle?",
      a: `Based on our measured forgiveness score (which weighs twist weight + ideal swing weight + trending engagement), the ${TOP_WIDEBODY[0]?.brand} ${TOP_WIDEBODY[0]?.name} is currently the top widebody pick. It combines elite twist weight with a swing weight in the easy-to-handle 110–115 range.`,
    },
    {
      q: "Is a widebody paddle good for beginners?",
      a: "Yes — widebody is the right shape for almost every beginner. The wider face has the biggest sweet spot in pickleball, which is the single most important property when your contact point is still developing.",
    },
    {
      q: "Widebody vs hybrid: which is more forgiving?",
      a: "Widebody. Hybrid sits between widebody and elongated — slightly more reach, slightly smaller sweet spot. If forgiveness is your top priority, widebody wins every time.",
    },
    {
      q: "Do pros use widebody paddles?",
      a: "Some do, especially at the kitchen-heavy doubles level. Most singles-focused pros prefer elongated for the extra reach. Shape preference is highly individual at the pro level — at the recreational level, widebody is almost always the easier paddle to play with.",
    },
    {
      q: "What's the trade-off of a widebody paddle?",
      a: "You lose about an inch of reach compared to an elongated paddle, and the longer handle of an elongated is missed if you played tennis. For most everyday players, forgiveness gained > reach lost.",
    },
  ],
};

export const metadata: Metadata = {
  title: `Best Widebody Pickleball Paddles (${currentYear()}) — Ranked by Forgiveness`,
  description:
    "The 8 best widebody pickleball paddles, ranked by measured twist weight and swing weight. Widebody = biggest sweet spot in pickleball = most forgiving shape for everyday play. Lab-measured specs, discount codes included.",
  keywords: [
    "best widebody pickleball paddle",
    "most forgiving pickleball paddle",
    "widebody pickleball paddle",
    `widebody paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Widebody Pickleball Paddles (${currentYear()})`,
    description: "8 widebody paddles ranked by forgiveness — biggest sweet spot in pickleball.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(TOP_WIDEBODY[0]?.slug ?? "")?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(TOP_WIDEBODY[0].slug)?.image}`, alt: "Best widebody pickleball paddles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Widebody Pickleball Paddles (${currentYear()})`, description: "8 widebody paddles ranked by forgiveness." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
