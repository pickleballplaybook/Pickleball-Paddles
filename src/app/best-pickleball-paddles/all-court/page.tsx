import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { paddles, getPaddleBySlug } from "@/data/paddles";
import { forgivenessScore, paddleToPick } from "@/lib/specPicks";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "all-court";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

// All-court paddles: balanced specs, no extremes. Sorted by forgiveness
// since balance + forgiveness is exactly what all-court buyers want.
const TOP_ALL_COURT = paddles
  .filter((p) => p.playStyle === "all-court")
  .sort((a, b) => forgivenessScore(b) - forgivenessScore(a))
  .slice(0, 10);

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "All-Court Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "all-court players",
  headline: `Best All-Court Pickleball Paddles (${currentYear()})`,
  intro:
    "All-court paddles don't specialize — they handle every part of the game without weakness. Power drives, kitchen dinks, transition exchanges, reset shots — none of them feel like a compromise. This is the right play-style category for the majority of players, especially anyone who plays both singles and doubles or hasn't settled into a dominant style yet. Below are the 10 best all-court paddles, ranked by measured twist weight and balanced swing weight.",
  trustSignals: ["Lab-Measured Specs", "No Weaknesses", "Singles + Doubles Ready", "Discount Codes Included"],
  accent: "#fbbf24",
  picks: TOP_ALL_COURT.map((p, i) => paddleToPick(p, {
    label: i === 0 ? "Best Overall All-Court" : i === 1 ? "Most Balanced" : `#${i + 1} All-Court`,
    angle: "forgiveness",
  })),
  buyingGuide: {
    heading: "Why all-court — and when to pick a specialist instead",
    paragraphs: [
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>All-court = no weaknesses, no extreme strengths.</strong>{" "}
        Power and touch both work. Drives feel solid; dinks feel plush. You don&apos;t get the explosive pace of
        a dedicated power paddle, but you also don&apos;t get punished at the kitchen the way a stiff power
        paddle will punish you.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>All-court is the right answer for most players.</strong>{" "}
        Unless your game has a clear bias (you bang every third shot, or you live and die at the kitchen),
        all-court will fit your play style better than any specialist option.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Best for: intermediate players, recreational doubles, anyone playing both singles and doubles.</strong>{" "}
        If you don&apos;t know what your style is yet — pick all-court. It&apos;ll work while you figure it out.
      </p>,
      <p key="4">
        <strong style={{ color: "var(--text-primary)" }}>Pick a specialist if: your style is clear.</strong>{" "}
        Heavy hitter? See <a href="/best-pickleball-paddles/power" style={{ color: "#fbbf24" }}>best power paddles</a>.
        Touch-first? See <a href="/best-pickleball-paddles/control" style={{ color: "#fbbf24" }}>best control paddles</a>.
        Spin-heavy topspin player? See <a href="/best-pickleball-paddles/spin" style={{ color: "#fbbf24" }}>best spin paddles</a>.
      </p>,
      <p key="5">
        Browse all paddles in our <a href="/paddles" style={{ color: "#fbbf24" }}>full paddle database</a>, or take
        the <a href="/" style={{ color: "#fbbf24" }}>Find My Paddle Quiz</a> to get matched to a specific paddle in 60 seconds.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best all-court pickleball paddle?",
      a: `Based on our forgiveness score (twist weight + balanced swing weight), the ${TOP_ALL_COURT[0]?.brand} ${TOP_ALL_COURT[0]?.name} is currently the top all-court pick. It handles every part of the game without sacrificing in any area.`,
    },
    {
      q: "What does 'all-court' actually mean?",
      a: "An all-court paddle has balanced specs across power, touch, and forgiveness — no single trait dominates. The result is a paddle that handles drives, dinks, drops, and resets equally well, without specializing.",
    },
    {
      q: "Is all-court better than power or control?",
      a: "Not better, just different. All-court is best when you don't have a strongly biased game. Power is better if you're a baseline banger; control is better if your game is built on touch and resets at the kitchen.",
    },
    {
      q: "Are all-court paddles good for beginners?",
      a: "Yes — all-court is one of the safest starting categories. The balanced specs mean you don't have to adapt your game to the paddle's strengths or weaknesses while you're still developing.",
    },
    {
      q: "What's the trade-off of an all-court paddle?",
      a: "You give up the extreme of any single trait. A specialist power paddle will always hit harder; a specialist control paddle will always feel softer at the kitchen. For most players, the trade is worth it.",
    },
  ],
};

export const metadata: Metadata = {
  title: `Best All-Court Pickleball Paddles (${currentYear()}) — Most Versatile Picks, Ranked`,
  description:
    "The 10 best all-court pickleball paddles — balanced specs that handle power drives, kitchen dinks, and transition exchanges without weakness. The right play-style category for most intermediate players.",
  keywords: [
    "best all-court pickleball paddle",
    "all-court pickleball paddle",
    "versatile pickleball paddle",
    "balanced pickleball paddle",
    `all court paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best All-Court Pickleball Paddles (${currentYear()})`,
    description: "10 all-court paddles ranked by balance — no weaknesses.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(TOP_ALL_COURT[0]?.slug ?? "")?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(TOP_ALL_COURT[0].slug)?.image}`, alt: "Best all-court pickleball paddles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best All-Court Pickleball Paddles (${currentYear()})`, description: "10 all-court paddles ranked by balance." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
