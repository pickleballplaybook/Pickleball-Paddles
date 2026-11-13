import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "best-gearbox-paddles";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Gearbox Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "Gearbox shoppers",
  headline: `Best Gearbox Pickleball Paddles (${currentYear()})`,
  intro:
    "Gearbox is the engineering-first pickleball brand — their Pro Ultimate holds the highest swing weight of any paddle in our database at SW 123.14. The Pressure X lineup introduces SpinLock surface technology alongside competitive swing weights across elongated and medium shapes. For players who prioritize measurable engineering specs over brand prestige, Gearbox consistently delivers the numbers. Every paddle in the lineup has lab-measured swing weight, twist weight, and an independently audited SpinLock surface.",
  trustSignals: ["SpinLock Spin Surface", "Highest SW in Database", "Lab-Measured Specs", "Discount Codes Included"],
  accent: "#10b981",
  picks: [
    {
      slug: "gearbox-pro-ultimate-elongated",
      label: "Highest Swing Weight Available",
      why: "SW 123.14 — the highest swing weight of any paddle in our entire database. The Pro Ultimate is the pick for players who want maximum drive mass and are comfortable with the tradeoff in hand speed at the NVZ. TW 5.54 is lower than most at this SW tier, so you sacrifice some off-center forgiveness for the raw power advantage. $274.99 with code PLAYBOOK.",
    },
    {
      slug: "gearbox-pressure-x-8e-elongated",
      label: "Best All-Court Gearbox",
      why: "SW 117.78 with SpinLock surface and Austin's review: 'all-court versatility and impressive forgiveness across the entire hitting surface.' The 8E (elongated) balances the Pressure X power with a swing weight that doesn't sacrifice kitchen hand speed. TW 5.83 is the standout spec across both Pressure X shapes. $279.99 with code PLAYBOOK.",
    },
    {
      slug: "gearbox-pressure-x-8m-elongated",
      label: "Best Gearbox for Touch Players",
      why: "SW 116.12 — the Pressure X 8M ('Medium shape', despite the elongated slug) has the lowest swing weight of the Pressure X line, which translates to faster hand speed at the kitchen and a more comfortable feel for extended sessions. Same SpinLock surface as the 8E. For Gearbox players who prioritize control over raw power, the 8M is the pick. TW 5.88. $279.99 with code PLAYBOOK.",
    },
    {
      slug: "gearbox-gbx-power-elongated",
      label: "Best Value Gearbox",
      why: "SW 116.87 at $179.99 — the GBX Power Elongated is the most accessible Gearbox paddle without the Pressure X price tag. Same elongated shape with solid competitive specs at a $100 discount versus the Pressure X line. TW 6.25 is actually higher than the Pressure X paddles, making it more forgiving on off-center hits. Code PLAYBOOK.",
    },
    {
      slug: "gearbox-gbx-power-hybrid",
      label: "Best Gearbox for Kitchen Game",
      why: "SW 113.44 with TW 6.5 — the GBX Power Hybrid is the most NVZ-friendly paddle in the Gearbox lineup. Lower swing weight means faster hand speed; TW 6.5 is the highest in the Gearbox catalog, making it the most forgiving on mishits. For Gearbox players who play a kitchen-first game, the Hybrid at $179.99 is the right shape. Code PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "Gearbox Pro Ultimate vs Pressure X — what's the difference?",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>Pro Ultimate = maximum swing weight. Pressure X = all-court versatility.</strong>{" "}
        The Pro Ultimate at SW 123.14 is a specialized power tool for players who live at the baseline and win
        with drives. The Pressure X line (SW 116–118) is more balanced — SpinLock surface for spin generation
        with swing weights that work well across baseline and kitchen play.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>SpinLock is Gearbox&apos;s proprietary spin surface.</strong>{" "}
        SpinLock is engineered for consistent topspin generation and grit durability. It&apos;s on every Pressure X
        paddle. The Pro Ultimate and GBX Power paddles use a different carbon fiber construction without the
        SpinLock designation — still good, but different.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>8E vs 8M in the Pressure X line — shape matters.</strong>{" "}
        Both the 8E and 8M are "elongated" paddles (elongated face shape), but the 8M is slightly shorter in
        face length for a more all-court feel. The 8E prioritizes reach; the 8M prioritizes hand speed and
        control. At the same $279.99 price, this is a pure playing-style choice.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>GBX Power saves you $100 with a small spec tradeoff.</strong>{" "}
        The GBX Power line (elongated and hybrid) is $179.99 vs $279.99 for the Pressure X. The tradeoff:
        no SpinLock surface and lower swing weights in the elongated. If SpinLock isn&apos;t a priority for
        your game, the GBX Power is the right budget entry into Gearbox engineering.
      </p>,
    ],
  },
  faq: [
    {
      q: "What is the best Gearbox pickleball paddle?",
      a: "The Gearbox Pro Ultimate Elongated (SW 123.14, $274.99) has the highest swing weight of any paddle in our database — it's the pick for maximum power. For all-court play, the Pressure X 8E (SW 117.78, SpinLock, $279.99) is the most versatile Gearbox paddle.",
    },
    {
      q: "What is SpinLock in Gearbox paddles?",
      a: "SpinLock is Gearbox's proprietary surface technology, engineered for consistent topspin generation and long-term grit durability. It's featured on the Pressure X line and works similarly to ArmorGrit and VantaGrit — a premium spin surface designed to maintain texture over hundreds of hours of play.",
    },
    {
      q: "What swing weight does the Gearbox Pro Ultimate have?",
      a: "SW 123.14 — the highest swing weight of any paddle in our database. For context, most competitive paddles sit at SW 117–121. The Pro Ultimate is a specialized tool for power-first players who want maximum drive mass and are comfortable with reduced hand speed at the kitchen.",
    },
    {
      q: "Is Gearbox a good pickleball brand?",
      a: "Yes — Gearbox is one of the most engineering-focused brands in pickleball. Their specs are accurate, their SW measurements are reliable, and the SpinLock surface on the Pressure X line is a genuinely differentiated technology. They're particularly strong for competitive players who shop by specs rather than brand name.",
    },
  ],
  relatedGuides: [
    "for-competitive-players",
    "for-spin-players",
    "power",
    "elongated",
  ],
};

export const metadata: Metadata = {
  title: `Best Gearbox Pickleball Paddles (${currentYear()}) — Pro Ultimate & Pressure X`,
  description: `The best Gearbox pickleball paddles ranked. Pro Ultimate (SW 123.14), Pressure X 8E, GBX Power — with SpinLock surface guide and discount codes.`,
  keywords: ["best Gearbox pickleball paddle", "Gearbox Pro Ultimate review", "Gearbox Pressure X review", `best Gearbox paddle ${currentYear()}`],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Gearbox Pickleball Paddles (${currentYear()})`, description: "5 Gearbox paddles ranked — Pro Ultimate to GBX Power.", url: PAGE_URL, type: "article", siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best Gearbox paddles" }] } : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Gearbox Pickleball Paddles (${currentYear()})`, description: "5 Gearbox paddles — from highest SW in database to budget picks." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
