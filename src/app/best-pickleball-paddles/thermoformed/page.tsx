import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "thermoformed";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Thermoformed Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "players seeking thermoformed paddles",
  headline: `Best Thermoformed Pickleball Paddles (${currentYear()})`,
  intro:
    "Thermoformed paddles are built using a heat-and-pressure molding process that fuses the carbon fiber face directly into the edge and core — eliminating the seam where traditional paddles delaminate. The result: a harder, more uniform hitting surface with more consistent pop, more precise specs, and more durability. The best thermoformed paddles are reviewed as S-tier by Austin; every pick below is on-court tested.",
  trustSignals: ["Thermoformed Construction", "On-Court S-Tier Reviews", "Lab-Measured Specs", "Discount Codes Included"],
  accent: "#0a64bc",
  picks: [
    {
      slug: "bread-and-butter-loco-2-hybrid",
      label: "Best Thermoformed Overall",
      why: "Austin's verdict: 'Arguably the greatest pickleball paddle of all time.' The Loco 2 is a premium thermoformed build — the Space Dust Grit surface is bonded directly to the thermoformed carbon body for a consistent, pop-heavy response across the entire face. SW 111.19, elite spin, exceptional power, full control. At $220 with PLAYBOOK, the benchmark thermoformed paddle.",
    },
    {
      slug: "volair-cmd-hyb-hybrid",
      label: "Best Thermoformed for Aggressive Play",
      why: "Austin reviewed the CMD HYB as 'the ultimate S-tier for aggressive competitive players.' Thermoformed construction with premium hex grit licensed from 11 Pickles. The build creates a stiff, powerful response that rewards aggressive swings. SW 110.66, designed for players who want to attack. 10% off with PLAYBOOK.",
    },
    {
      slug: "honolulu-j2cr-crystal-blue-hybrid",
      seriesSlugs: ["honolulu-j2cr-crystal-blue-hybrid", "honolulu-j6cr-crystal-blue-elongated", "honolulu-j3cr-crystal-blue-widebody"],
      seriesName: "Honolulu Crystal Blue",
      label: "Best Thermoformed Surface",
      why: "The Crystal Blue Endurance Surface over a thermoformed body is Austin's pick for durable grit that actually solves the surface wear problem. Spin holds steady or increases with use. Three shapes in the series — J2CR hybrid (SW 109.61), J3CR widebody (SW 105.21), J6CR elongated (SW 115.09). 10% off with PLAYBOOK.",
    },
    {
      slug: "chorus-coda-harmony-grit-widebody",
      label: "Best Thermoformed Widebody",
      why: "TW 7.41 (second-highest in the database) with a thermoformed body that bonds the Harmony Grit surface directly to the paddle structure. SW 111.81 in a widebody shape. The Coda Harmony is Austin's top pick for players who want thermoformed construction with maximum forgiveness. $199.99 with PLAYBOOK.",
    },
    {
      slug: "gearbox-pressure-x-8e-elongated",
      label: "Best Thermoformed Power Spec",
      why: "Gearbox's thermoformed construction with SpinLock surface — Austin reviewed the 8E as offering 'versatility and balance' with 'impressive forgiveness across the entire hitting surface.' SW 117.78 in an elongated thermoformed build. The SpinLock technology bonds the grit directly into the carbon surface for spin that holds. $279.99 with PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "What thermoformed construction actually does",
    paragraphs: [
      <p key="0">
        Traditional paddles bond the carbon face to a separate edge guard and core with adhesive — over time, the
        seam can delaminate (flex and separate), changing the paddle&apos;s feel and responsiveness. Thermoformed
        paddles heat and pressure-mold the entire structure together, eliminating that seam. The result is a harder,
        more consistent hitting response and a paddle that doesn&apos;t change feel as it ages.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>More pop and a harder feel.</strong>{" "}
        Thermoformed paddles typically play stiffer and with more pop than non-thermoformed builds. If you want a
        softer, more planted kitchen feel, a foam-core non-thermoformed paddle (like the GRUVN LAZR-16HD) may feel
        more natural. If you want pop and power, thermoformed is the construction for you.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Surface bonding is the thermoformed advantage for grit.</strong>{" "}
        When grit surface is applied over a thermoformed body, the bond is more secure — the surface holds longer.
        The Honolulu Crystal Blue&apos;s Endurance Surface specifically takes advantage of this bonding process to
        deliver grit that outlasts standard surfaces.
      </p>,
    ],
  },
  faq: [
    {
      q: "What is a thermoformed pickleball paddle?",
      a: "A thermoformed paddle is built using heat-and-pressure molding that fuses the carbon fiber face directly into the paddle structure — no separate adhesive seams. The result is a harder, more uniform hitting surface with more consistent pop and better surface durability than standard bonded construction.",
    },
    {
      q: "Are thermoformed pickleball paddles better?",
      a: "For pop, consistency, and surface durability — yes. Thermoformed paddles play harder and more uniformly. For soft touch and kitchen feel, some players prefer non-thermoformed foam-core builds (like the GRUVN LAZR-16HD) that naturally absorb more vibration. Neither is universally 'better' — it depends on your game style.",
    },
    {
      q: "What's the best thermoformed pickleball paddle?",
      a: "Austin reviewed the Bread & Butter Loco 2 Hybrid as 'arguably the greatest pickleball paddle of all time' — it's the benchmark thermoformed paddle for all-court play. For aggressive players, the Volair CMD HYB. For durable grit surface, the Honolulu Crystal Blue series.",
    },
    {
      q: "Are thermoformed paddles USAP approved?",
      a: "Thermoformed construction itself is allowed — USAP approval depends on the specific paddle, not the construction method. Check the individual paddle's approval status. The Aireo Cyclone USAP and Honolulu Crystal Blue series are among the thermoformed paddles with USAP approval.",
    },
  ],
  relatedGuides: [
    "raw-carbon-fiber",
    "for-advanced-players",
    "for-4.0-players",
    "for-bangers",
  ],
};

export const metadata: Metadata = {
  title: `Best Thermoformed Pickleball Paddles (${currentYear()}) — S-Tier Picks`,
  description:
    "The 5 best thermoformed pickleball paddles in 2026. Heat-molded construction for consistent pop and surface durability — all on-court reviewed by Austin.",
  keywords: [
    "best thermoformed pickleball paddle",
    "thermoformed pickleball paddle",
    "best thermoformed paddle pickleball",
    `thermoformed pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Thermoformed Pickleball Paddles (${currentYear()})`,
    description: "5 thermoformed paddles ranked — consistent pop, durable surfaces, and S-tier performance.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best thermoformed pickleball paddles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Thermoformed Pickleball Paddles (${currentYear()})`, description: "5 best thermoformed paddles — consistent pop and durable construction." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
