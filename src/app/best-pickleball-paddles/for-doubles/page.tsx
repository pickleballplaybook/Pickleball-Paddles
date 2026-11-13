import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-doubles";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Doubles Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "doubles players",
  headline: `Best Pickleball Paddles for Doubles (${currentYear()})`,
  intro:
    "Doubles pickleball is a kitchen game. The rally is decided at the non-volley zone — with dinks, resets, hand battles, and third-shot drops. That means you want high twist weight (forgiveness on off-center dinks), lower swing weight (fast hands for exchanges), and a 16mm core (soft feel for touch shots). Every pick below is optimized for the net-game demands of doubles play, based on Austin's on-court reviews.",
  trustSignals: ["Kitchen-Optimized Specs", "Lab-Measured Twist Weight", "On-Court Doubles Testing", "Discount Codes Included"],
  accent: "#60a5fa",
  picks: [
    {
      slug: "selkirk-omni-widebody",
      label: "Highest Twist Weight (TW 7.87)",
      why: "TW 7.87 is the highest twist weight in our entire database — meaning off-center dinks and resets that would die on any other paddle still go where you aim them. The widebody shape combined with Selkirk's build quality makes this the most forgiving kitchen paddle available. At $299.99 with 15% off via code INF-PLAYBOOK, it's a doubles specialist investment. SW 115.24 keeps it lively for hand battles.",
    },
    {
      slug: "chorus-coda-harmony-grit-widebody",
      label: "Best All-Around Doubles Paddle",
      why: "TW 7.41 (elite-tier forgiveness) with SW 111.81 — the Coda Harmony hits both marks that matter for doubles. The widebody shape gives you the biggest sweet spot available, and the Harmony Grit surface provides consistent spin on your dink placement. At $199.99 with PLAYBOOK, it's the most complete kitchen paddle in this range and Austin's pick for all-court doubles play.",
    },
    {
      slug: "bread-and-butter-fat-boy-widebody",
      label: "Biggest Sweet Spot",
      why: "TW 7.39 in a true widebody shape — the Fat Boy is named honestly. The massive face area means mishit dinks and quick hands exchanges still go where intended. SW 109.52 keeps it fast for net battles. B&B's build quality is consistently premium. At $189.99 with PLAYBOOK, it's the widebody specialist for doubles players who want maximum forgiveness at the kitchen.",
    },
    {
      slug: "honolulu-j2cr-crystal-blue-hybrid",
      seriesSlugs: ["honolulu-j2cr-crystal-blue-hybrid", "honolulu-j6cr-crystal-blue-elongated", "honolulu-j3cr-crystal-blue-widebody"],
      seriesName: "Honolulu Crystal Blue",
      label: "Best for Spin Placement",
      why: "Doubles rewards spin placement on dinks — short, angled, or heavy topspin keeps your opponent uncomfortable. The Crystal Blue Endurance Surface delivers durable spin for the life of the paddle. SW 109.61, TW 6.57 in a hybrid shape — fast enough for hand battles with grip that shapes the ball on every dink. 10% off with PLAYBOOK.",
    },
    {
      slug: "gruvn-lazr-16hd-hybrid",
      label: "Best Kitchen Speed",
      why: "SW 107.07 is the fastest-feeling of these five picks — you'll win hand battles by reacting quicker. The full foam 16mm core absorbs vibration naturally, giving you soft hands in the kitchen. At $169 with PLAYBOOK (~$152), the LAZR-16HD is the best value doubles paddle that won't slow you down in fast exchanges.",
    },
  ],
  buyingGuide: {
    heading: "Why doubles specs are different from singles",
    paragraphs: [
      <p key="0">
        In doubles, 80%+ of rallies are decided in the kitchen — not off the baseline. The most important skills are
        dinking, resetting under pressure, and winning hand battles. That means the specs that matter most are twist
        weight (forgiveness on off-center contact at the kitchen) and swing weight (how fast you can react in a speed-up).
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Twist weight is more important in doubles than in singles.</strong>{" "}
        In singles you have time to reset. In doubles, a speed-up to your body at the kitchen gives you milliseconds
        to react — and the ball often catches an edge of the paddle. TW 7.0+ means those shots still stay in.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Widebody and hybrid shapes are preferred for doubles.</strong>{" "}
        Elongated paddles have smaller sweet spots that demand consistent contact — which you don&apos;t always have
        time for at the kitchen. Widebody and hybrid shapes give you a larger reactive zone.
      </p>,
      <p key="3">
        Playing singles too? See our{" "}
        <a href="/best-pickleball-paddles/for-singles" style={{ color: "#60a5fa" }}>best paddles for singles</a>{" "}
        — the spec priorities flip (more swing weight, elongated shape for reach and driving power).
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for doubles play?",
      a: "For pure kitchen domination, the Selkirk Omni Widebody (TW 7.87 — highest in the database) or Chorus Coda Harmony Grit (TW 7.41, SW 111.81). For a balanced all-court doubles pick, the Honolulu J2CR Crystal Blue Hybrid. All three are reviewed by Austin for doubles-specific performance.",
    },
    {
      q: "Should a doubles player use a widebody or hybrid paddle?",
      a: "Widebody for maximum kitchen forgiveness — highest twist weight, biggest sweet spot, best for dink consistency. Hybrid if you also want reach for overheads and occasional drives. Most dedicated doubles specialists at 4.0+ prefer widebody or hybrid over elongated.",
    },
    {
      q: "What's more important for doubles — swing weight or twist weight?",
      a: "Both matter, but twist weight has a higher marginal impact in doubles. Swing weight determines hand speed in exchanges (important). Twist weight determines whether off-center kitchen shots stay in (critical). A 0.5 improvement in TW has more impact at the kitchen line than a 5-point drop in SW.",
    },
    {
      q: "Do pro doubles players use the same paddles as recreational players?",
      a: "The same paddle models, yes — but pros are more likely to weight-customize with lead tape. The Selkirk Omni, B&B Loco series, and Six Zero Coral are all used at the pro level. You can buy the same paddle and play the same tool.",
    },
  ],
  relatedGuides: [
    "for-singles",
    "for-kitchen-game",
    "most-forgiving",
    "for-4.0-players",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Doubles (${currentYear()}) — Kitchen-Optimized`,
  description:
    "The 5 best pickleball paddles for doubles play in 2026. High twist weight, kitchen-optimized specs, and on-court tested for dinking and hand battles.",
  keywords: [
    "best pickleball paddle for doubles",
    "best doubles pickleball paddle",
    "pickleball paddle kitchen game",
    "high twist weight pickleball paddle",
    `best pickleball paddle doubles ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Doubles (${currentYear()}) — Kitchen-Optimized`,
    description: "5 kitchen-optimized doubles paddles with high twist weight and on-court testing.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for doubles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Doubles (${currentYear()})`, description: "5 kitchen-optimized doubles paddles." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
