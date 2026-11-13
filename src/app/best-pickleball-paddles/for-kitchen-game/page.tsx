import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-kitchen-game";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Kitchen Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "kitchen game players",
  headline: `Best Pickleball Paddles for the Kitchen Game (${currentYear()})`,
  intro:
    "The kitchen game is where pickleball is won or lost. Dinks, resets under pressure, hand battles, and precise drop volleys — these require a paddle with low swing weight (fast hands), soft 16mm core (touch and feel), and high twist weight (stability when off-center contact happens at speed). Every pick below is specifically reviewed for kitchen performance by Austin.",
  trustSignals: ["Kitchen-Tested On-Court", "Soft 16mm Cores", "Lab-Measured Specs", "Discount Codes Included"],
  accent: "#60a5fa",
  picks: [
    {
      slug: "mint-ghost-hybrid",
      label: "Best Kitchen Control Paddle",
      why: "Austin's review: 'Control beast. Most forgiving sweet spots on the market. Off-center resets and dinks still come off clean. Genuinely fast in hand battles. Quiet, stable.' SW 113.40 with a 16mm core tuned specifically for touch and feel. USAP approved. At $194.95 with 15% off via PLAYBOOK (~$166), it&apos;s the best dedicated kitchen control paddle in the lineup. Genuine S-tier for control players.",
    },
    {
      slug: "gruvn-lazr-16hd-hybrid",
      label: "Best Kitchen Speed",
      why: "SW 107.07 full foam 16mm hybrid — the softest core build for the most natural dink feel. Foam cores absorb vibration in a way that polymer cores can't match, giving dinks a 'planted' feeling that helps with touch shot consistency. At $169 (~$152 with PLAYBOOK), it&apos;s the best kitchen-speed option: fast hands, soft touch, all in one build.",
    },
    {
      slug: "honolulu-j2cr-crystal-blue-hybrid",
      seriesSlugs: ["honolulu-j2cr-crystal-blue-hybrid", "honolulu-j6cr-crystal-blue-elongated", "honolulu-j3cr-crystal-blue-widebody"],
      seriesName: "Honolulu Crystal Blue",
      label: "Best for Dink Placement",
      why: "The Crystal Blue Endurance Surface gives you consistent spin on every dink, which enables placement over depth. Austin's review: spin holds steady or increases with use — not the typical declining surface. SW 109.61 for fast hands, with grip that shapes the ball on angled and cross-court dinks. At $195 with 10% off via PLAYBOOK (~$176), this is the kitchen spin specialist.",
    },
    {
      slug: "chorus-coda-harmony-grit-hybrid",
      label: "Best All-Around Kitchen (Hybrid)",
      why: "The Coda Harmony Grit hybrid gives you TW 6.61 and SW 112.12 — a kitchen-fast paddle with enough forgiveness for off-center exchanges during hand battles. The Harmony Grit surface keeps dink spin consistent. At $199.99 with PLAYBOOK, it's the most complete all-around kitchen paddle for a player who wants to be excellent in the NVZ without specializing.",
    },
    {
      slug: "volair-cmd-hyb-hybrid",
      label: "Best for Aggressive Kitchen Play",
      why: "The CMD HYB with premium hex grit is for aggressive kitchen players who initiate speed-ups and attack from the NVZ. SW 110.66 is fast for counter-attacks, and the hex grit surface creates spin on aggressive punch volleys. Austin reviewed it as S-tier for competitive players who want to be aggressive. 10% off with PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "What makes a great kitchen paddle",
    paragraphs: [
      <p key="0">
        Kitchen-optimized paddles have three core properties: low swing weight (fast hand speed for exchanges and
        counter-volleys), soft 16mm core (natural feel and dwell time for touch shots), and high twist weight (stability
        when you make contact off-center during a speed-up). The picks above score highly on all three.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Dwell time is a feel concept, not a spec.</strong>{" "}
        Some paddles feel like the ball &apos;sticks&apos; slightly at contact — that&apos;s dwell time, and it helps
        with touch shots. Full foam cores (like the GRUVN LAZR-16HD) have the best dwell feel. Standard polymer
        cores are faster but less responsive. 16mm is better for dwell than 13mm.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Twist weight matters most during hand battles.</strong>{" "}
        When someone speeds up the ball at your body, you have milliseconds to react — and the paddle often catches
        the ball on the edge. TW 6.5+ keeps that reaction shot directional. The Mint Ghost (TW 6.05) has a lower TW
        but compensates with its &quot;quiet, stable&quot; build that Austin noted as unusual.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for the kitchen game?",
      a: "Austin's top kitchen control pick is the Mint Ghost Hybrid — 'control beast, most forgiving sweet spots on the market, off-center resets still come off clean.' For kitchen speed, the GRUVN LAZR-16HD at SW 107 with a foam core. For dink placement with spin, the Honolulu Crystal Blue J2CR.",
    },
    {
      q: "What swing weight is best for kitchen play?",
      a: "SW 107–113 is the kitchen-play range. Fast enough for hand battle reactions without feeling like you're swinging a bat. The Mint Ghost (113.40) is toward the heavier end and still excellent; the GRUVN (107.07) is the fast end.",
    },
    {
      q: "Is a 16mm or 13mm paddle better for the kitchen?",
      a: "16mm, clearly. Thicker cores are softer, give more dwell time, and feel better on touch shots. 13mm paddles add pop for drives but feel stiffer and less forgiving on dinks. Every kitchen-optimized pick above is 16mm.",
    },
    {
      q: "Does paddle surface matter for dinking?",
      a: "Yes — grit surface creates spin on dinks, which enables more precise placement. Smooth carbon faces dink adequately but can't generate the angled spin that makes dinks genuinely difficult to handle. The Honolulu Crystal Blue Endurance Surface and the CMD HYB hex grit are the best surfaces for spin-based dink placement.",
    },
  ],
  relatedGuides: [
    "for-doubles",
    "most-forgiving",
    "lightweight",
    "for-4.0-players",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for the Kitchen Game (${currentYear()}) — NVZ Specialists`,
  description:
    "The 5 best pickleball paddles for kitchen play in 2026. Low swing weight, soft 16mm core, high twist weight — kitchen-tested by Austin on-court.",
  keywords: [
    "best pickleball paddle for kitchen game",
    "best pickleball paddle for dinking",
    "kitchen game pickleball paddle",
    "best control pickleball paddle",
    `best kitchen pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for the Kitchen Game (${currentYear()})`,
    description: "5 kitchen-tested paddles with low swing weight and soft cores for dinking, resets, and hand battles.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for kitchen game" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Kitchen Game (${currentYear()})`, description: "5 NVZ-specialist paddles tested for dinking and hand battles." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
