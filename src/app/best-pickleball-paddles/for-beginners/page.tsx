import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-beginners";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

// All picks here are widebody shapes — by far the most forgiving geometry for
// new players. Widebody = wider face = biggest sweet spot = fewer painful
// mishits while you're learning. Ranked by twist weight (forgiveness) first,
// price + measurable specs second.
const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Beginner Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "beginners",
  headline: `Best Pickleball Paddles for Beginners (${currentYear()})`,
  intro:
    "If you're new to pickleball, the single biggest spec mistake is choosing the wrong shape. Elongated paddles look cool but have tiny sweet spots — every off-center hit is punished. Widebody paddles have the largest sweet spot in pickleball, period. Every pick below is a widebody, ranked on twist weight (forgiveness), swing weight, and price. These are the paddles that make pickleball feel easy while you're still learning.",
  trustSignals: ["All Widebody Shapes", "Lab-Measured Specs", "Highest Forgiveness", "Discount Codes Included"],
  accent: "#4ade80",
  picks: [
    {
      slug: "chorus-coda-harmony-grit-widebody",
      label: "Best Overall Widebody",
      why: "The Coda Harmony pairs an elite-tier twist weight (7.41 — among the most forgiving in the entire catalog) with a swing weight (111.8) that's right in the beginner sweet spot. Big sweet spot, easy to swing, premium 16mm build. If you want one paddle that will carry you from week-one beginner through 3.5 play without needing to upgrade, this is it.",
    },
    {
      slug: "bread-and-butter-fat-boy-widebody",
      label: "Biggest Sweet Spot",
      why: "The Fat Boy lives up to its name — TW 7.39 and a true widebody face mean it's almost impossible to mishit. Swing weight (109.5) is light enough to handle quick exchanges at the kitchen, and Bread & Butter's build quality is legitimately premium at $189.99. The most forgiving paddle in this list when paired with the Coda.",
    },
    {
      slug: "honolulu-j3cr-crystal-blue-widebody",
      seriesSlugs: [
        "honolulu-j2cr-crystal-blue-hybrid",
        "honolulu-j6cr-crystal-blue-elongated",
        "honolulu-j3cr-crystal-blue-widebody",
      ],
      seriesName: "Honolulu Crystal Blue",
      label: "Best for Grip & Spin",
      why: "The J3CR pairs the widebody geometry with Honolulu's Endurance Surface — a textured face that holds its grip on the ball for far longer than most paddles. Beginners benefit because grip = control = the ball goes where you aim it. The widebody version of the Crystal Blue is the easiest of the three shapes (J2CR / J3CR / J6CR) to play.",
    },
    {
      slug: "enhance-turbo-epp-widebody",
      label: "Best Under $100",
      why: "Beginners shouldn't have to spend $200. The Turbo EPP delivers a real foam-core widebody with TW 7.07 (very forgiving) at $119.99 — which drops under $100 with code PLAYBOOK. The build is genuinely good — this isn't a 'cheap because it's cheap' paddle. It's the value pick that doesn't compromise on what matters for a beginner.",
    },
    {
      slug: "selkirk-amped-s2-widebody",
      label: "Lightest & Most Maneuverable",
      why: "The Amped S2 has the lowest swing weight on this list (97.7) — meaning if you have any wrist issues, slow reactions, or just want a paddle you can whip around at the kitchen, this is the one. The Selkirk build quality is best-in-class, the price is $100 flat, and the wide face still gives you a forgiving sweet spot. Perfect for older beginners or anyone prioritizing maneuverability over power.",
    },
  ],
  buyingGuide: {
    heading: "Why widebody — and what else actually matters",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>Widebody is the only shape that makes sense for a beginner.</strong>{" "}
        Elongated paddles have a tiny sweet spot — every mishit is a dead paddle. Hybrid is a middle ground. Widebody
        has the largest sweet spot of any shape, which is the single most important thing when you&apos;re still
        developing your contact point. Every pick on this page is widebody for that reason.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Twist weight is the most important spec, and most buyers don&apos;t even know it exists.</strong>{" "}
        Twist weight measures how forgiving the paddle is on off-center hits — a higher number (6.5+) means a mishit
        toward the edge still goes where you intended. Every paddle above has TW 6.4 or higher; the top two are above
        7.3 (elite-tier).
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Swing weight in the 105–115 range is the sweet spot.</strong>{" "}
        Too low and you have to swing hard to generate pace. Too high (120+) and you can&apos;t react fast enough at the
        kitchen yet. Widebody paddles naturally sit in this comfortable range — another reason they&apos;re the right
        starting shape.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Don&apos;t buy a 13mm paddle as your first.</strong> Thinner
        cores have a livelier feel but punish off-center hits and play stiffer. Start at 16mm — softer, more forgiving,
        and better for the touch game you&apos;re learning. Every pick above is 16mm.
      </p>,
      <p key="4">
        Want to go even cheaper? See our <a href="/best-pickleball-paddles/under-125" style={{ color: "#4ade80" }}>best paddles under $125</a> — several beginner picks
        also appear there. Or browse all widebody paddles in our <a href="/paddles" style={{ color: "#4ade80" }}>paddle database</a> to compare specs directly.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for a true beginner?",
      a: "The Chorus Coda Harmony Grit Widebody is the cleanest first paddle: an elite twist weight of 7.41 (extreme forgiveness), an easy-to-swing swing weight of 111.8, and a premium 16mm build that scales with your game. It's a paddle you can keep all the way to 3.5+ play without needing to upgrade.",
    },
    {
      q: "What shape should a beginner buy — widebody, hybrid, or elongated?",
      a: "Widebody, hands-down. Widebody paddles have the largest sweet spot in pickleball — which is the single most important property when your contact point is still inconsistent. Hybrid is a step up in difficulty; elongated is for advanced players who can reliably hit the ball where they want. Every pick on this page is widebody for that reason.",
    },
    {
      q: "Should a beginner buy a 16mm or 13mm paddle?",
      a: "16mm, always. Thicker cores are softer, more forgiving on mishits, and easier to control at the net. 13mm paddles add pop but punish bad mechanics. You can upgrade to 13mm later once your stroke is consistent.",
    },
    {
      q: "How much should a beginner spend?",
      a: "$100–$200 is the right range. Below $80 the build quality drops fast. Above $250 you're paying for spec tuning you can't yet take advantage of. The Enhance Turbo EPP and Selkirk Amped S2 deliver real quality at $100. The Chorus Coda and B&B Fat Boy are worth the step up if your budget allows.",
    },
    {
      q: "Do beginners need a USAP-approved paddle?",
      a: "Only if you plan to play sanctioned tournaments soon. For recreational play, social pickleball, and most leagues, you don't need USAP approval — though almost every paddle on this list has it anyway.",
    },
  ],
  relatedGuides: [
    "how-to-choose-a-pickleball-paddle",
    "cheap-pickleball-paddles-that-dont-suck",
    "pickleball-paddle-grip-size-guide",
    "what-is-a-hybrid-pickleball-paddle",
  ],
};

export const metadata: Metadata = {
  title: `Best Beginner Pickleball Paddles (${currentYear()}) — All Widebody, Ranked`,
  description:
    "The 5 best widebody pickleball paddles for beginners — ranked on twist weight (forgiveness), swing weight, and build. Widebody = biggest sweet spot = fewer mishits while you learn. Discount codes included.",
  keywords: [
    "best pickleball paddle for beginners",
    "best beginner pickleball paddle",
    "best widebody pickleball paddle",
    "most forgiving pickleball paddle",
    `beginner pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Beginner Pickleball Paddles (${currentYear()}) — All Widebody`,
    description: "5 widebody paddles ranked for beginners — biggest sweet spot, highest forgiveness, real lab specs.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best widebody pickleball paddles for beginners" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Beginner Pickleball Paddles (${currentYear()})`, description: "5 widebody paddles ranked for beginners." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
