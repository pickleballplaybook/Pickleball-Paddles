import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { paddles, getPaddleBySlug } from "@/data/paddles";
import { powerScore, paddleToPick } from "@/lib/specPicks";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "14mm";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

// 14mm sits between 13mm (max pop) and 16mm (default). Power-leaning sort
// reflects that buyers reaching for 14mm are usually optimizing for liveliness.
const TOP_14MM = paddles
  .filter((p) => p.thickness === "14mm")
  .sort((a, b) => powerScore(b) - powerScore(a))
  .slice(0, 8);

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "14mm Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "14mm players",
  headline: `Best 14mm Pickleball Paddles (${currentYear()})`,
  intro:
    "14mm cores sit between 13mm (max pop, max stiffness) and 16mm (the default soft-feel option). The result is a paddle that still gives you a meaningful chunk of the lively pop that thinner cores deliver — but with slightly more dwell time and forgiveness than going all the way to 13mm. Best for intermediate-to-advanced power players who want pop without giving up all touch. Below are the 8 best 14mm paddles, ranked by power-leaning score.",
  trustSignals: ["Lab-Measured Specs", "Power-Leaning Ranking", "All Shapes", "Discount Codes Included"],
  accent: "#f97316",
  picks: TOP_14MM.map((p, i) => paddleToPick(p, {
    label: i === 0 ? "Best Overall 14mm" : i === 1 ? "Best Power 14mm" : `#${i + 1} Best 14mm`,
    angle: "power",
  })),
  buyingGuide: {
    heading: "Why 14mm — and when 13mm or 16mm makes more sense",
    paragraphs: [
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>14mm = lively without going all-in.</strong> Thinner
        than 16mm means more pop off the face. Thicker than 13mm means slightly better forgiveness and a hair
        more dwell time. The result is a popular middle ground for players who want to lean toward power
        without abandoning touch entirely.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Go thinner (13mm) if: you want maximum pop and a stiff, lively feel.</strong>{" "}
        See our <a href="/best-pickleball-paddles/13mm" style={{ color: "#f97316" }}>13mm paddle picks</a> — the
        thinnest production cores in the catalog.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Go thicker (16mm) if: you want plush dwell time and maximum forgiveness.</strong>{" "}
        See our <a href="/best-pickleball-paddles/16mm" style={{ color: "#f97316" }}>16mm paddle picks</a> — the
        default thickness for control and touch play.
      </p>,
      <p key="4">
        <strong style={{ color: "var(--text-primary)" }}>Best for: intermediate-to-advanced power players who want pop without losing all touch.</strong>{" "}
        If you can already hit center consistently and you want more liveliness than 16mm offers, 14mm is the
        right step.
      </p>,
      <p key="5">
        Browse all paddles in our <a href="/paddles" style={{ color: "#f97316" }}>full paddle database</a>, or
        compare 14mm vs 16mm head-to-head with our <a href="/compare" style={{ color: "#f97316" }}>comparison tool</a>.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best 14mm pickleball paddle?",
      a: `Based on our power-leaning score (swing weight + trending engagement), the ${TOP_14MM[0]?.brand} ${TOP_14MM[0]?.name} is currently the top 14mm pick.`,
    },
    {
      q: "Is a 14mm paddle better than 16mm?",
      a: "Different, not better. 14mm gives you more pop and a livelier feel; 16mm gives you more dwell time, forgiveness, and touch. The right answer depends on your play style — power players lean toward 14mm, control players toward 16mm.",
    },
    {
      q: "Should beginners use 14mm paddles?",
      a: "Not usually. 14mm is less forgiving on off-center hits than 16mm, and beginners mishit more often. Start at 16mm and consider 14mm later once your contact is consistent.",
    },
    {
      q: "Is 14mm a popular thickness?",
      a: "Yes — increasingly. It's become the go-to for many intermediate-to-advanced power players who find 13mm too stiff and 16mm too muted. The catalog grows in this thickness every release cycle.",
    },
  ],
  relatedGuides: [
    "pickleball-paddle-thickness-explained",
    "13mm-vs-14mm-vs-16mm-paddles",
    "how-to-choose-a-pickleball-paddle",
    "what-is-swing-weight",
  ],
};

export const metadata: Metadata = {
  title: `Best 14mm Pickleball Paddles (${currentYear()}) — Power Without the Tradeoff`,
  description:
    "The 8 best 14mm pickleball paddles, ranked by measured swing weight and trending engagement. 14mm sits between 13mm (max pop) and 16mm (default touch) — best for power players who want liveliness without giving up all forgiveness.",
  keywords: [
    "best 14mm pickleball paddle",
    "14mm pickleball paddle",
    `14mm paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best 14mm Pickleball Paddles (${currentYear()})`,
    description: "8 14mm paddles ranked by power and pop.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(TOP_14MM[0]?.slug ?? "")?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(TOP_14MM[0].slug)?.image}`, alt: "Best 14mm pickleball paddles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best 14mm Pickleball Paddles (${currentYear()})`, description: "8 14mm paddles ranked by power and pop." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
