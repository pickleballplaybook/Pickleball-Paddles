import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "most-forgiving";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Forgiveness Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "players wanting forgiveness",
  headline: `Most Forgiving Pickleball Paddles (${currentYear()})`,
  intro:
    "Forgiveness is measured by twist weight — how well the paddle resists twisting when you hit off-center. Higher twist weight means mishits toward the edge of the paddle still go where you aimed them. The paddles below have the five highest twist weights in our lab-tested database. Every one is a widebody shape: the combination of wide face and high TW creates the most forgiving geometry in pickleball.",
  trustSignals: ["Highest Lab-Measured Twist Weights", "All Widebody Shapes", "Off-Center Stability", "Discount Codes Included"],
  accent: "#4ade80",
  picks: [
    {
      slug: "selkirk-omni-widebody",
      label: "Most Forgiving Paddle (TW 7.87)",
      why: "TW 7.87 is the highest twist weight in our entire database — not even close to second place. The Selkirk Omni Widebody is the most forgiving paddle in pickleball, full stop. An off-center hit toward the edge that would fly unpredictably on any other paddle stays directional on the Omni. At $299.99 (15% off with INF-PLAYBOOK), it&apos;s a serious investment — but if forgiveness is your priority, nothing beats it.",
    },
    {
      slug: "chorus-coda-harmony-grit-widebody",
      label: "Best Forgiveness + Performance (TW 7.41)",
      why: "TW 7.41 (second-highest in the catalog) with SW 111.81 and a premium Harmony Grit surface. The Coda Harmony isn't just forgiving — it's a complete paddle. You don't sacrifice performance for forgiveness here. Beginners can carry this paddle to 3.5+ play without needing to upgrade. $199.99 with PLAYBOOK.",
    },
    {
      slug: "bread-and-butter-fat-boy-widebody",
      label: "Best All-Around Forgiving (TW 7.39)",
      why: "TW 7.39, SW 109.52 — the B&B Fat Boy is the most forgiving paddle from Bread & Butter, one of the most respected brands in the game. The widebody face is as large as any paddle face in the catalog. Fast at the kitchen (SW 109), forgiving on mishits (TW 7.39), premium build ($189.99). Three checks against the criteria for a forgiving player paddle.",
    },
    {
      slug: "bread-and-butter-loco-widebody",
      label: "Forgiving with Power (TW 7.29)",
      why: "The original Loco in widebody shape delivers TW 7.29 — high forgiveness — with SW 108.06 for kitchen speed. If you want a forgiving paddle that still has Bread & Butter's characteristic power and pop, the Loco Widebody bridges both. At $199 with PLAYBOOK. Note: the Loco 2 is the newer model with a premium surface upgrade; the original Loco is still excellent.",
    },
    {
      slug: "engage-pursuit-pro-2-widebody",
      label: "Best Value Forgiving (TW 7.21)",
      why: "TW 7.21 with SW 108.79 at $129.99 — the best twist weight you can get under $130. Engage's Pursuit Pro 2 widebody is a genuine all-around paddle at a price point that doesn't demand justification. Code PLAYBOOK applies. For a player on a budget who wants real forgiveness, this is the pick.",
    },
  ],
  buyingGuide: {
    heading: "What twist weight actually measures — and why it matters",
    paragraphs: [
      <p key="0">
        Twist weight is the rotational resistance of the paddle when it gets hit off its central axis. When you dink
        and catch the ball slightly toward the edge, a low-TW paddle twists in your hand — the ball flies in the
        wrong direction. A high-TW paddle resists that twist and keeps the ball on line.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>The spec most paddle buyers don&apos;t know exists.</strong>{" "}
        Most paddle listings show weight and sometimes swing weight, but not twist weight. We lab-measure TW on every
        paddle in our database. TW 6.5 is baseline solid. TW 7.0+ is notably forgiving. TW 7.5+ is elite-tier —
        only the Selkirk Omni exceeds this.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Widebody shape multiplies the TW effect.</strong>{" "}
        A wider face has more mass distributed toward the edges, which inherently raises twist weight. That&apos;s
        why every paddle on this page is a widebody — widebody + high TW is the forgiveness stack that makes
        mishits forgiving.
      </p>,
      <p key="3">
        For new players specifically, see our{" "}
        <a href="/best-pickleball-paddles/for-beginners" style={{ color: "#4ade80" }}>best paddles for beginners</a>{" "}
        — most of the same picks appear there, plus guidance on other beginner-relevant specs beyond twist weight.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the most forgiving pickleball paddle?",
      a: "By lab-measured twist weight, the Selkirk Omni Widebody at TW 7.87 is the most forgiving paddle in our database. Second is the Chorus Coda Harmony Grit Widebody at TW 7.41. Third is the Bread & Butter Fat Boy at TW 7.39.",
    },
    {
      q: "What twist weight should I look for in a forgiving paddle?",
      a: "TW 6.5+ is solid. TW 7.0+ is notably forgiving — you'll feel the stability on mishits. TW 7.5+ is elite-tier. The Selkirk Omni at 7.87 is the high watermark; the Chorus Coda at 7.41 is the best combination of extreme forgiveness with real performance.",
    },
    {
      q: "Are forgiving paddles only for beginners?",
      a: "No — high-TW paddles are used at all skill levels for doubles kitchen play. A fast speed-up at the kitchen gives you milliseconds to react; a forgiving paddle means that reaction hit on the edge of the paddle still stays in. The Selkirk Omni is used at the 4.0+ level specifically for this reason.",
    },
    {
      q: "Is swing weight or twist weight more important for forgiveness?",
      a: "Twist weight is the direct forgiveness measurement. Swing weight affects how heavy or light the paddle feels to swing — which is about arm fatigue and hand speed, not about off-center stability. Both matter, but TW is the specific spec you should check when choosing a forgiving paddle.",
    },
  ],
  relatedGuides: [
    "for-beginners",
    "for-seniors",
    "lightweight",
    "for-doubles",
  ],
};

export const metadata: Metadata = {
  title: `Most Forgiving Pickleball Paddles (${currentYear()}) — Highest Twist Weight`,
  description:
    "The 5 most forgiving pickleball paddles by lab-measured twist weight in 2026. All widebody shapes with TW 7.0+. Off-center mishits still go where you aim.",
  keywords: [
    "most forgiving pickleball paddle",
    "highest twist weight pickleball paddle",
    "forgiving pickleball paddle",
    "pickleball paddle sweet spot",
    `most forgiving pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Most Forgiving Pickleball Paddles (${currentYear()}) — Highest Twist Weight`,
    description: "5 paddles ranked by twist weight — the most forgiving paddles in our lab-tested database.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Most forgiving pickleball paddles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Most Forgiving Pickleball Paddles (${currentYear()})`, description: "5 paddles ranked by twist weight for maximum forgiveness." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
