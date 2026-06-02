import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-beginners";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Beginner Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "beginners",
  headline: `Best Pickleball Paddles for Beginners (${currentYear()})`,
  intro:
    "The right beginner paddle does three things at once: it generates power without you having to swing hard, it's forgiving on off-center hits (a high twist weight), and it doesn't lock you into one style. Below are the five paddles we recommend most often to players just starting out — chosen on real spec data, not marketing.",
  trustSignals: ["Lab-Measured Specs", "Unsponsored Reviews", "Beginner-Friendly Picks", "Discount Codes Included"],
  accent: "#4ade80",
  picks: [
    {
      slug: "beyond-measure-ronin-hybrid",
      seriesSlugs: ["beyond-measure-ronin-hybrid", "beyond-measure-ronin-elongated"],
      seriesName: "Beyond Measure Ronin",
      label: "Best Overall",
      why: "The Ronin is the paddle we'd put in any beginner's hand: a high twist weight (6.36–6.53) means mishits stay on target, swing weight (114–115) generates natural pop without forcing a heavy swing, and the thermoformed 16mm core feels premium in a way most beginner paddles don't. At about $105 with PLAYBOOK, it's also one you can grow into for years.",
    },
    {
      slug: "selkirk-boomstik-elongated",
      label: "Best for Natural Power",
      why: "Beginners often over-swing trying to generate pace. The Boomstik solves that with a high natural swing weight (120) and a twist weight (6.84) that's among the most forgiving in any elongated paddle. You don't have to swing hard — let the paddle do the work. Selkirk's build quality is best-in-class too.",
    },
    {
      slug: "friday-aura-elongated",
      seriesSlugs: ["friday-aura-elongated", "friday-aura-hybrid"],
      seriesName: "Friday Aura",
      label: "Best for Control & Dinking",
      why: "If you're learning to dink and reset, the Aura's soft 16mm core gives you the dwell time you need to feel the ball on the face. Both shapes are forgiving for a beginner. At about $119 with code PLAYBOOK, it's the easiest paddle in this list to fall in love with at the kitchen.",
    },
    {
      slug: "honolulu-j3cr-crystal-blue-widebody",
      seriesSlugs: ["honolulu-j2cr-crystal-blue-hybrid", "honolulu-j6cr-crystal-blue-elongated", "honolulu-j3cr-crystal-blue-widebody"],
      seriesName: "Honolulu Crystal Blue",
      label: "Biggest Sweet Spot",
      why: "Widebody shapes have the biggest sweet spots, period — they're forgiving in a way elongated shapes never are. The J3CR pairs that geometry with Honolulu's Endurance Surface, which holds its grip far longer than most paddles. If accuracy is your weak point right now, this is the shape.",
    },
    {
      slug: "enhance-turbo-mpp-elongated",
      seriesSlugs: ["enhance-turbo-mpp-elongated", "enhance-turbo-mpp-hybrid"],
      seriesName: "Enhance Turbo MPP",
      label: "Best Under $100",
      why: "Beginners shouldn't have to spend $200. The Turbo MPP delivers a real floating foam core and SW 116 at $119.99 — and drops under $100 with PLAYBOOK. It's punchier than a beginner-only paddle, which means you won't out-grow it in three months.",
    },
  ],
  buyingGuide: {
    heading: "What actually matters in a beginner's paddle",
    paragraphs: [
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Twist weight is the most important spec for beginners</strong>, and most beginner buyers don&apos;t even know it exists.
        Twist weight measures how forgiving the paddle is on off-center hits — a higher number (6.0+) means a mishit
        toward the edge still goes where you intended. Beginners hit off-center constantly. Prioritize twist weight over
        any other spec.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Swing weight in the 110–118 range is the sweet spot.</strong>{" "}
        Too low and you have to swing hard to generate pace. Too high (120+) and you can&apos;t react fast enough at the
        kitchen yet. The picks above all sit in this comfortable range.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Don&apos;t buy a 13mm paddle as your first.</strong> Thinner
        cores have a livelier feel but punish off-center hits and play stiffer. Start at 16mm — softer, more forgiving,
        and better for the touch game you&apos;re learning.
      </p>,
      <p key="4">
        Want to go even cheaper? See our <a href="/best-pickleball-paddles/under-125" style={{ color: "#4ade80" }}>best paddles under $125</a> —
        every paddle on this beginner list also appears there, plus several budget-only options.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for a true beginner?",
      a: "The Beyond Measure Ronin (about $105 with code PLAYBOOK) is the cleanest first paddle: high twist weight for forgiveness, a moderate swing weight that doesn't require effort, and a premium build that won't feel cheap as your game develops.",
    },
    {
      q: "Should a beginner buy a 16mm or 13mm paddle?",
      a: "16mm, always. Thicker cores are softer, more forgiving on mishits, and easier to control at the net. 13mm paddles add pop but punish bad mechanics. You can upgrade to 13mm later once your stroke is consistent.",
    },
    {
      q: "What shape should beginners choose?",
      a: "Widebody for the largest sweet spot (most forgiving), hybrid for a balanced all-around feel, or elongated only if you played tennis and want the familiar reach. Most beginners do best with widebody or hybrid.",
    },
    {
      q: "How much should a beginner spend?",
      a: "$100–$130 is the sweet spot. Below $80 and the build quality starts to drop fast. Above $150 you're paying for spec tuning you can't yet take advantage of. Every paddle on this list lives in that range with code PLAYBOOK.",
    },
    {
      q: "Do beginners need a USAP-approved paddle?",
      a: "Only if you plan to play sanctioned tournaments soon. For recreational play, social pickleball, and most leagues, you don't need USAP approval — though almost every paddle on this list has it anyway.",
    },
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Beginners (${currentYear()}) — Tested & Ranked`,
  description:
    "The 5 best beginner pickleball paddles, ranked on twist weight (forgiveness), swing weight, and build quality. Tested on court with lab-measured specs. Discount codes included.",
  keywords: [
    "best pickleball paddle for beginners",
    "best beginner pickleball paddle",
    "beginner pickleball paddle 2026",
    "forgiving pickleball paddle",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Beginners (${currentYear()})`,
    description: "5 forgiving paddles ranked for beginners, with lab-measured specs and discount codes.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for beginners" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Beginners (${currentYear()})`, description: "5 forgiving paddles ranked for beginners." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
