import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-bangers";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Power Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "bangers",
  headline: `Best Pickleball Paddles for Bangers (${currentYear()})`,
  intro:
    "Bangers drive hard from the baseline and rely on pace to end rallies. If that's your game, you need high swing weight (mass behind the ball), elongated shape (leverage for groundstrokes), and a grit surface that holds spin to keep hard drives in play. These five paddles are the highest-swinging, hardest-hitting options in our lab-tested database — all on-court reviewed by Austin.",
  trustSignals: ["Highest Swing Weights", "Lab-Measured Power Specs", "On-Court Tested", "Discount Codes Included"],
  accent: "#fb923c",
  picks: [
    {
      slug: "luzz-tornazo-elongated",
      label: "Hardest-Hitting (SW 121.89)",
      why: "SW 121.89 is among the highest in our entire database. The Tornazo is built for players who win by overpowering — maximum mass behind every drive, elongated shape for leverage, and a 16mm core that still keeps the ball in play. If you bang and you want the paddle that bangs hardest, this is it. 15% off with PLAYBOOK brings the $229 paddle to ~$195.",
    },
    {
      slug: "bread-and-butter-loco-2-elongated",
      label: "Best Power with Premium Surface (SW 119.14)",
      why: "SW 119.14 with Austin's S-tier rating — the Loco 2 Elongated combines hard-hitting swing weight with the Space Dust Grit surface that keeps spin on your aggressive drives. Power with topspin is harder to defend than pure power. Austin's review: exceptional power, elite spin, fantastic pop. At $220 with PLAYBOOK, the best complete banger paddle.",
    },
    {
      slug: "holbrook-mav-elongated",
      label: "Best Value Banger (SW 118.43)",
      why: "SW 118.43 at $99.99 — the Holbrook Mav is the spec leader in the under-$100 category for power play. High swing weight, elongated shape, solid build from Holbrook. TW 6.49 keeps aggressive drives directional even on slight mishits. For a banger on a budget, the Mav is the clear pick. PLAYBOOK applies.",
    },
    {
      slug: "gearbox-pressure-x-8m-elongated",
      label: "Best Power Specialist (SW 116.12)",
      why: "Austin's review: the Pressure X 8M is Gearbox's 'power paddle with a massive sweet spot.' SpinLock surface for durable spin on hard drives, 16mm core, and a forgiving face despite the power spec. SW 116.12 — high enough for real driving pace, combined with a build specifically tuned for power output. $179.99 with PLAYBOOK.",
    },
    {
      slug: "vatic-pro-v-sol-tour-evergrit-elongated",
      label: "Best Budget Banger (SW 119.18)",
      why: "SW 119.18 at $109 list — $10 off with PLAYBOOK = $99. Nearly the same swing weight as the Loco 2 at a fraction of the price. The Evergrit surface adds spin to keep drives in play. For a banger who wants legitimate power without a $200+ investment, the Vatic Pro V-Sol Elongated is the best value in this category.",
    },
  ],
  buyingGuide: {
    heading: "What specs bangers actually need",
    paragraphs: [
      <p key="0">
        Bangers need three things from their paddle: high swing weight (mass behind the ball), elongated shape
        (leverage to generate more arm speed on groundstrokes), and a durable grit surface (topspin on hard drives
        keeps them in — flat drives go out). Every pick above checks all three.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>SW 115+ is the banger zone.</strong>{" "}
        A higher swing weight means more momentum transfer to the ball on a drive. The difference between SW 107 and
        SW 121 is significant — that&apos;s the difference between an all-court paddle and a dedicated power tool.
        Every pick above is SW 116 or higher.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Grit surface adds spin, which keeps drives in.</strong>{" "}
        Hard flat drives go out more often than topspin drives — the grit surface creates RPMs on contact that pull
        the ball down. The Loco 2&apos;s Space Dust Grit, Gearbox&apos;s SpinLock, and Vatic&apos;s Evergrit are
        all specifically engineered for this reason.
      </p>,
      <p key="3">
        Want to convert your banger game to a more complete all-court approach? See our{" "}
        <a href="/best-pickleball-paddles/for-4.0-players" style={{ color: "#fb923c" }}>best paddles for 4.0 players</a>{" "}
        — the Loco 2 Hybrid at SW 111 is a more balanced version of the banger&apos;s favorite paddle.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for bangers?",
      a: "The Luzz Tornazo at SW 121.89 is the hardest-hitting paddle in our database. For S-tier power with premium surface quality, the Bread & Butter Loco 2 Elongated (SW 119.14). For value, the Holbrook Mav at $99.99 (SW 118.43) or the Vatic Pro V-Sol Elongated at $99 with PLAYBOOK (SW 119.18).",
    },
    {
      q: "What swing weight is best for a banger?",
      a: "SW 115+ is the banger range. SW 117–122 is where dedicated power paddles live. Every pick on this page is SW 116 or higher. Higher swing weight means more mass behind the ball on drives — which translates directly to ball speed.",
    },
    {
      q: "Should bangers use elongated or hybrid paddles?",
      a: "Elongated. The longer face gives more leverage on groundstrokes — like using a longer lever in physics, you generate more speed with the same arm swing. Elongated also adds reach for aggressive angles and wider drives.",
    },
    {
      q: "Can bangers still win at 4.0+?",
      a: "Yes, but harder. At 4.0+ players have the reset game to counter pure pace. Bangers who succeed at 4.0+ combine pace with topspin — which is where grit surface matters. High-spin + high-pace drives are significantly harder to defend than flat drives at the same speed.",
    },
  ],
  relatedGuides: [
    "for-singles",
    "for-advanced-players",
    "for-4.0-players",
    "raw-carbon-fiber",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Bangers (${currentYear()}) — Highest Swing Weight`,
  description:
    "The 5 best pickleball paddles for bangers in 2026. Highest swing weights in our database, elongated shapes for leverage, and grit surfaces for spin on hard drives.",
  keywords: [
    "best pickleball paddle for bangers",
    "best power pickleball paddle",
    "high swing weight pickleball paddle",
    "hardest hitting pickleball paddle",
    `best pickleball paddle bangers ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Bangers (${currentYear()}) — Highest Swing Weight`,
    description: "5 high-swing-weight paddles for bangers — the hardest-hitting options in our lab-tested database.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for bangers" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Bangers (${currentYear()})`, description: "5 high-swing-weight paddles for hard-hitting bangers." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
