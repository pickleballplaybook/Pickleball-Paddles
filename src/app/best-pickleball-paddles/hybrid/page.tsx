import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { paddles, getPaddleBySlug } from "@/data/paddles";
import { forgivenessScore, paddleToPick } from "@/lib/specPicks";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "hybrid";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

// Top 10 hybrid paddles, ranked by forgiveness score (TW + balanced SW).
// Hybrid is the middle ground — picks here favor balanced specs that
// deliver some of what makes both widebody and elongated work.
const TOP_HYBRID = paddles
  .filter((p) => p.shape === "Hybrid")
  .sort((a, b) => forgivenessScore(b) - forgivenessScore(a))
  .slice(0, 10);

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Hybrid Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "hybrid players",
  headline: `Best Hybrid Pickleball Paddles (${currentYear()})`,
  intro:
    "Hybrid paddles split the difference between widebody (max forgiveness) and elongated (max reach). The result is a shape that handles every part of the game without specializing — equally usable for dinks at the kitchen, drives from the baseline, and reach shots in transition. The right shape for intermediate players, indecisive buyers, and anyone who plays both singles and doubles. Below are the 10 best hybrid paddles, ranked by measured twist weight and balanced swing weight.",
  trustSignals: ["Lab-Measured Specs", "Most Versatile Shape", "Balanced Forgiveness + Reach", "Discount Codes Included"],
  accent: "#a78bfa",
  picks: TOP_HYBRID.map((p, i) => paddleToPick(p, {
    label: i === 0 ? "Best Overall Hybrid" : i === 1 ? "Most Versatile" : `#${i + 1} Hybrid`,
    angle: "forgiveness",
  })),
  buyingGuide: {
    heading: "Why hybrid — and when to pick a different shape",
    paragraphs: [
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Hybrid = best of both worlds.</strong> The shape is
        designed to give you a meaningful chunk of widebody&apos;s forgiveness AND a meaningful chunk of
        elongated&apos;s reach. You give up some of the extreme of each — but you can play every shot type
        without compromise.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Hybrid is the most popular shape in 2026 for a reason.</strong>{" "}
        Most catalogs offer more hybrid SKUs than any other shape. It&apos;s also the shape recommended for most
        intermediate players — versatile enough to handle whatever the rally throws at you.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Best for: intermediate players, indecisive buyers, anyone playing both singles and doubles.</strong>{" "}
        If you don&apos;t know which shape you want, hybrid is the safe answer. You won&apos;t love it as much as
        the perfect widebody or perfect elongated would — but you also won&apos;t hate it on any shot.
      </p>,
      <p key="4">
        <strong style={{ color: "var(--text-primary)" }}>Skip hybrid if: you want the extreme of one trait.</strong>{" "}
        If forgiveness is your #1 priority, go <a href="/best-pickleball-paddles/widebody" style={{ color: "#a78bfa" }}>widebody</a>.
        If reach and power matter most, go <a href="/best-pickleball-paddles/elongated" style={{ color: "#a78bfa" }}>elongated</a>.
      </p>,
      <p key="5">
        Browse all paddles in our <a href="/paddles" style={{ color: "#a78bfa" }}>full paddle database</a>, or
        compare hybrids head-to-head with our <a href="/compare" style={{ color: "#a78bfa" }}>paddle comparison tool</a>.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best hybrid pickleball paddle?",
      a: `Based on our forgiveness score (twist weight + ideal swing weight balance), the ${TOP_HYBRID[0]?.brand} ${TOP_HYBRID[0]?.name} is the current top hybrid pick. It balances stable off-center performance with the maneuverability hybrid players want.`,
    },
    {
      q: "Hybrid vs widebody vs elongated: which should I pick?",
      a: "Widebody for maximum forgiveness (beginners, kitchen players). Elongated for maximum reach and power (tennis converts, singles). Hybrid for everyone in between — and most players are in between.",
    },
    {
      q: "Are hybrid paddles good for beginners?",
      a: "Hybrid is workable for beginners, but widebody is better. The hybrid sweet spot is smaller than widebody and unforgiving on mishits early in your development. Most beginners should start widebody and graduate to hybrid as their consistency improves.",
    },
    {
      q: "Do pros use hybrid paddles?",
      a: "Many do — especially mixed doubles specialists. Hybrid is increasingly the default at the pro level for players who want a single paddle that handles every situation.",
    },
    {
      q: "What's the trade-off of a hybrid paddle?",
      a: "You give up some of the extreme advantage that widebody (forgiveness) or elongated (reach + power) offer. A specialist widebody will always be more forgiving; a specialist elongated will always reach further.",
    },
  ],
  relatedGuides: [
    "what-is-a-hybrid-pickleball-paddle",
    "elongated-vs-widebody-pickleball-paddles",
    "how-to-choose-a-pickleball-paddle",
    "pickleball-paddle-thickness-explained",
  ],
};

export const metadata: Metadata = {
  title: `Best Hybrid Pickleball Paddles (${currentYear()}) — Most Versatile Shape, Ranked`,
  description:
    "The 10 best hybrid pickleball paddles, ranked by measured twist weight and swing weight balance. Hybrid = best of widebody + elongated = the most versatile shape in pickleball. Discount codes included.",
  keywords: [
    "best hybrid pickleball paddle",
    "hybrid pickleball paddle",
    "versatile pickleball paddle",
    `hybrid paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Hybrid Pickleball Paddles (${currentYear()})`,
    description: "10 hybrid paddles ranked by forgiveness + balance — the most versatile shape.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(TOP_HYBRID[0]?.slug ?? "")?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(TOP_HYBRID[0].slug)?.image}`, alt: "Best hybrid pickleball paddles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Hybrid Pickleball Paddles (${currentYear()})`, description: "10 hybrid paddles ranked by forgiveness + balance." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
