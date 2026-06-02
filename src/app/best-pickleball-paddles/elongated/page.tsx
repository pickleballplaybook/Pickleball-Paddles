import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { paddles, getPaddleBySlug } from "@/data/paddles";
import { powerScore, paddleToPick } from "@/lib/specPicks";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "elongated";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

// Top 10 elongated paddles, sorted by power-leaning score (swing weight
// dominant + trending tiebreak). Elongated shape rewards reach and power;
// players who choose elongated are usually optimizing for those traits.
const TOP_ELONGATED = paddles
  .filter((p) => p.shape === "Elongated")
  .sort((a, b) => powerScore(b) - powerScore(a))
  .slice(0, 10);

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Elongated Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "elongated players",
  headline: `Best Elongated Pickleball Paddles (${currentYear()})`,
  intro:
    "Elongated paddles trade sweet-spot size for reach, leverage, and natural power. The longer face puts more mass farther from your hand — which means more pop on drives, more reach on dig shots, and a more &quot;tennis-like&quot; swing feel. Best for advanced players, former tennis players, and anyone whose game is built on power. Below are the 10 best elongated paddles, ranked by swing weight + measured trending engagement.",
  trustSignals: ["Lab-Measured Specs", "Power-First Ranking", "Pro-Player Geometry", "Discount Codes Included"],
  accent: "#ef4444",
  picks: TOP_ELONGATED.map((p, i) => paddleToPick(p, {
    label: i === 0 ? "Best Overall Elongated" : i === 1 ? "Best for Power" : `#${i + 1} Elongated`,
    angle: "power",
  })),
  buyingGuide: {
    heading: "Why elongated — and when to pick a different shape",
    paragraphs: [
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Elongated = reach + leverage + natural power.</strong>{" "}
        The longer face puts mass farther from your hand. That translates to more pop on full swings (especially
        drives and serves), more reach on stretch defensive shots, and a swing feel familiar to anyone with a
        tennis background.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Elongated trades sweet-spot size for reach.</strong>{" "}
        The narrower face means a smaller sweet spot — off-center hits are punished more than they are on a
        widebody. You need to be consistent at the contact point to get the benefit of this shape.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Best for: tennis converts, singles players, power-oriented baseline players.</strong>{" "}
        If your game is built on drives and serves rather than touch and resets, and your contact point is
        consistent, elongated is the right shape.
      </p>,
      <p key="4">
        <strong style={{ color: "var(--text-primary)" }}>Skip elongated if: you&apos;re still learning, you play touch-heavy doubles, or you mishit often.</strong>{" "}
        See our <a href="/best-pickleball-paddles/widebody" style={{ color: "#ef4444" }}>best widebody paddles</a> page —
        you&apos;ll enjoy the game more with a more forgiving shape.
      </p>,
      <p key="5">
        Looking for a middle ground? See <a href="/best-pickleball-paddles/hybrid" style={{ color: "#ef4444" }}>best hybrid paddles</a>{" "}
        — between elongated and widebody. Or browse all paddles in our <a href="/paddles" style={{ color: "#ef4444" }}>full paddle database</a>.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best elongated pickleball paddle?",
      a: `Based on our measured power score (which weighs swing weight + trending engagement), the ${TOP_ELONGATED[0]?.brand} ${TOP_ELONGATED[0]?.name} is currently the top elongated pick. It pairs a high swing weight for natural power with build quality that backs up the spec sheet.`,
    },
    {
      q: "Are elongated paddles harder to use?",
      a: "Yes — meaningfully harder than widebody for most players. The smaller sweet spot punishes off-center hits, and the heavier swing weight typical of elongated paddles requires more deliberate swing mechanics. They reward consistency; they punish inconsistency.",
    },
    {
      q: "Elongated vs hybrid: which should I pick?",
      a: "Elongated if you want maximum reach and power. Hybrid if you want some of that benefit without giving up as much sweet-spot size. Hybrid is the safer choice for an intermediate player who isn't sure.",
    },
    {
      q: "Do pros use elongated paddles?",
      a: "Most singles pros use elongated. In doubles it's more split — touch-first doubles players often prefer hybrid or widebody. At the pro level, shape is highly individual.",
    },
    {
      q: "What's the trade-off of an elongated paddle?",
      a: "Smaller sweet spot, less forgiving on mishits, and the heavier swing weight can be a problem at the kitchen for players who haven't developed quick hands yet.",
    },
  ],
};

export const metadata: Metadata = {
  title: `Best Elongated Pickleball Paddles (${currentYear()}) — Power & Reach Ranked`,
  description:
    "The 10 best elongated pickleball paddles, ranked by measured swing weight and trending engagement. Elongated = reach + leverage + natural power — best for tennis converts, singles players, and power-oriented baseline players.",
  keywords: [
    "best elongated pickleball paddle",
    "elongated pickleball paddle",
    "power pickleball paddle",
    `elongated paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Elongated Pickleball Paddles (${currentYear()})`,
    description: "10 elongated paddles ranked by power and reach.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(TOP_ELONGATED[0]?.slug ?? "")?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(TOP_ELONGATED[0].slug)?.image}`, alt: "Best elongated pickleball paddles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Elongated Pickleball Paddles (${currentYear()})`, description: "10 elongated paddles ranked by power and reach." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
