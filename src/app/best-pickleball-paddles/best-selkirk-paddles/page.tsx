import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "best-selkirk-paddles";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Selkirk Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "Selkirk shoppers",
  headline: `Best Selkirk Pickleball Paddles (${currentYear()})`,
  intro:
    "Selkirk is one of the most trusted names in pickleball — and their lineup covers more price points and playing styles than almost any other brand. The SLK line (Selkirk's value sub-brand) starts under $100 while the Labs Project Tesla tops out at $450. The constant across the lineup: build quality that outperforms the price, and consistent lab-measured swing weights across every shape. These are the five Selkirk paddles worth buying right now.",
  trustSignals: ["Lab-Measured Swing Weight", "Full Selkirk Lineup", "Budget to Premium", "Discount Codes Included"],
  accent: "#8b5cf6",
  picks: [
    {
      slug: "slk-halo-pro-elongated",
      label: "Best Budget Selkirk",
      why: "SLK is Selkirk's own value line — same build standards, lower price. The Halo Pro at $100 delivers SW 118.32 in a 14mm elongated frame that plays well above its price. TW 5.83 is competitive. For players who want Selkirk's engineering at an entry price, the Halo Pro is the pick. Use code PLAYBOOK at checkout.",
    },
    {
      slug: "selkirk-project-007-invikta-elongated",
      label: "Best Mid-Range Selkirk",
      why: "SW 117.47 in a 14mm elongated build at $130 — the 007 Invikta is the best-value Selkirk Labs paddle. 14mm gives it a crisper, faster response than the softer 16mm Boomstik. Players who want the Labs Project pedigree without the premium price tag will find the 007 delivers the right specs for the money. Code PLAYBOOK.",
    },
    {
      slug: "selkirk-boomstik-elongated",
      label: "Best Overall Selkirk",
      why: "TW 6.84 — the highest twist weight of any Selkirk Labs paddle and one of the highest in the entire database. The Boomstik is the most forgiving paddle Selkirk makes on off-center hits. SW 120.09 sits in the competitive range for 4.5+ play. For players who want the most complete Selkirk build, the Boomstik is the answer. $332.99 with code PLAYBOOK.",
    },
    {
      slug: "selkirk-luxx-elongated",
      label: "Best Selkirk for Touch Players",
      why: "20mm core thickness is unique in the Selkirk lineup — the LUXX is the softest, most touch-forward Selkirk paddle available. SW 116.94 is lower than the power-oriented Boomstik, which means faster hand speed at the kitchen. For control-first players who want Selkirk's build quality with a premium touch feel, the LUXX at $200 is the pick. Code PLAYBOOK.",
    },
    {
      slug: "selkirk-tesla-elongated",
      label: "Best Premium Selkirk",
      why: "SW 121.52 at $450 — the Tesla is Selkirk's highest-performance, highest-priced Labs Project paddle. The carbon composite construction at this spec level is best-in-class build quality in pickleball. For players who want the absolute best Selkirk builds and price is not a constraint, the Tesla delivers everything the Boomstik does with an additional 1.4 SW points. Code PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "How to pick the right Selkirk paddle",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>SLK vs. Selkirk Labs — understand the difference.</strong>{" "}
        SLK is Selkirk&apos;s value sub-brand: same manufacturing standards, lower price point. The Halo Pro ($100)
        and Halo Control ($100) are SLK paddles — they&apos;re Selkirk-made with Selkirk-quality builds. Selkirk Labs
        paddles (Boomstik, Tesla, LUXX) are their premium engineering line, starting at $200 and going to $450.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>14mm vs. 16mm vs. 20mm in the Selkirk lineup.</strong>{" "}
        The 007 Invikta (14mm) has a snappier response and is faster off the paddle face. The Boomstik (16mm) is
        softer and more consistent for resets. The LUXX (20mm) is the softest and most touch-forward. Choose based
        on whether you prioritize snap and drive speed (14mm) or control and dwell (16mm+).
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Swing weight in the Selkirk lineup spans from SW 116 to SW 122.</strong>{" "}
        The LUXX at SW 116.94 is the arm-friendliest Selkirk Labs paddle. The Tesla at SW 121.52 is the heaviest.
        The sweet spot for most 4.0–5.0 players is SW 117–120 — the 007 Invikta, Halo Pro, and Boomstik all sit
        in that range.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Discount codes for Selkirk and SLK differ.</strong>{" "}
        Selkirk Labs paddles sold through authorized retailers typically work with code PLAYBOOK. SLK paddles
        sold through Locker Room Pickleball also accept PLAYBOOK. Always check the specific paddle&apos;s discount
        link on each product page.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best Selkirk pickleball paddle?",
      a: "The Selkirk Boomstik (SW 120.09, TW 6.84) is the best all-around Selkirk Labs paddle — the highest twist weight in the lineup means off-center hits still land where you aimed. For value, the SLK Halo Pro at $100 delivers SW 118.32 with the same Selkirk build quality.",
    },
    {
      q: "Is Selkirk Labs worth the price?",
      a: "For competitive 4.5+ play, yes. The engineering precision on Selkirk Labs paddles — particularly the measured swing weight consistency — justifies the premium for players who compete regularly. The Boomstik at $332.99 and Tesla at $450 are priced above most competitors, but the build quality and spec consistency hold up over time.",
    },
    {
      q: "What's the difference between SLK and Selkirk?",
      a: "SLK is Selkirk's owned value sub-brand — same manufacturing standards, lower price point. SLK paddles are designed to deliver Selkirk-level quality at $100 instead of $200–$450. The Halo Pro and Halo Control are SLK paddles that outperform many $150+ paddles from other brands.",
    },
    {
      q: "What swing weight do Selkirk paddles have?",
      a: "Selkirk Labs paddles range from SW 116.94 (LUXX, 20mm core) to SW 121.52 (Tesla). The Boomstik sits at SW 120.09. SLK paddles like the Halo Pro are at SW 118.32. Most of the lineup clusters in the SW 116–121 range, which is appropriate for 4.0–5.0 play.",
    },
  ],
  relatedGuides: [
    "for-competitive-players",
    "for-4.5-players",
    "for-5.0-players",
    "thermoformed",
  ],
};

export const metadata: Metadata = {
  title: `Best Selkirk Pickleball Paddles (${currentYear()}) — Ranked by SW & Price`,
  description: `The 5 best Selkirk pickleball paddles ranked by swing weight, price, and playing style. From the $100 SLK Halo Pro to the $450 Tesla — with discount codes.`,
  keywords: ["best Selkirk pickleball paddle", "Selkirk pickleball paddle review", "SLK pickleball paddle", `best Selkirk paddle ${currentYear()}`],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Selkirk Pickleball Paddles (${currentYear()})`,
    description: "5 Selkirk paddles ranked — SLK budget picks to Labs Project premium builds.",
    url: PAGE_URL, type: "article", siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[2].slug)?.image ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[2].slug)?.image}`, alt: "Best Selkirk paddles" }] } : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Selkirk Pickleball Paddles (${currentYear()})`, description: "5 Selkirk paddles ranked by swing weight and price." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
