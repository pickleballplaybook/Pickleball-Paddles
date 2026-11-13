import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-outdoor-play";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Outdoor Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "outdoor players",
  headline: `Best Pickleball Paddles for Outdoor Play (${currentYear()})`,
  intro:
    "Outdoor pickleball puts unique demands on a paddle: UV exposure, humidity, temperature swings, and the rougher bounce of outdoor courts all accelerate wear. The key spec for outdoor play is surface durability — how long the grit and texture hold up under real outdoor conditions. Every pick below prioritizes durable surface treatment, solid build quality, and resistance to the elements, based on Austin's on-court testing.",
  trustSignals: ["Durable Surface Treatments", "Weather-Resistant Builds", "On-Court Tested", "Discount Codes Included"],
  accent: "#4ade80",
  picks: [
    {
      slug: "honolulu-j2cr-crystal-blue-hybrid",
      seriesSlugs: ["honolulu-j2cr-crystal-blue-hybrid", "honolulu-j6cr-crystal-blue-elongated", "honolulu-j3cr-crystal-blue-widebody"],
      seriesName: "Honolulu Crystal Blue",
      label: "Best Outdoor Durability",
      why: "Austin's review specifically noted the Crystal Blue Endurance Surface as solving the durable grit problem — spin holds steady or actually increases RPMs the more you use it. That's exactly the property you need for outdoor play where UV and abrasion would normally degrade standard surfaces in weeks. Three shapes available. 10% off with PLAYBOOK.",
    },
    {
      slug: "enhance-turbo-mpp-armorgrit-elongated",
      label: "Best Budget Outdoor Paddle",
      why: "'ArmorGrit' is named for its durability profile — Austin reviewed it as 'an absolute game-changer for the price, elite power, exceptional control.' The ArmorGrit surface is engineered specifically to resist the wear that standard carbon grit can't. At $119.99 - $20 with PLAYBOOK = ~$100, it's the best outdoor durability per dollar. SW 114.48.",
    },
    {
      slug: "gearbox-pressure-x-8e-elongated",
      label: "Best All-Court Outdoor",
      why: "Gearbox's SpinLock surface is designed to lock spin-generating texture into the carbon surface rather than applying a coating over it. The result: a surface that doesn't chip, peel, or delaminate under outdoor conditions. Austin reviewed the 8E as having 'impressive forgiveness across the entire hitting surface' — that consistency holds outdoors. $279.99 with PLAYBOOK.",
    },
    {
      slug: "holbrook-mav-elongated",
      label: "Best Affordable Outdoor",
      why: "The Holbrook Mav at $99.99 is the most affordable serious outdoor option on this list. Holbrook builds their paddles for durability — solid edge guard, tight construction that resists moisture ingress. SW 118.43 means it plays with power on outdoor courts where you need more pace to overcome the wind. Code PLAYBOOK applies.",
    },
    {
      slug: "bread-and-butter-loco-2-hybrid",
      label: "Best Premium Outdoor Paddle",
      why: "Space Dust Grit is a premium surface treatment that Austin reviewed as lasting 'as long as premium S-tier grit paddles.' For outdoor players who want the best of everything — durability, performance, and Austin's S-tier rating — the Loco 2 is the investment pick. $220 with PLAYBOOK. The paddle that doesn't wear out when you play daily outdoors.",
    },
  ],
  buyingGuide: {
    heading: "What outdoor play does to paddle surfaces",
    paragraphs: [
      <p key="0">
        Outdoor conditions accelerate paddle wear in three ways: UV exposure breaks down grit bonding agents, humidity
        causes materials to expand and contract (which stresses adhesive layers), and the rougher bounce of outdoor
        balls generates more friction at contact — wearing the surface faster than indoor use. Standard carbon grit
        surfaces may last 40+ hours indoors but only 20–25 hours outdoors with heavy use.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Engineered grit surfaces last longer outdoors.</strong>{" "}
        Standard grit coatings are applied over a smooth carbon face — they chip and peel from UV and impact.
        Engineered surfaces (Honolulu Endurance, Gearbox SpinLock, B&B Space Dust) chemically or mechanically bond
        the texture into the carbon for significantly better outdoor durability.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Wind affects lighter paddles more.</strong>{" "}
        Outdoors, light swing weight paddles (SW under 108) can be affected by wind on aggressive swings —
        especially in a cross-court wind. Paddles in the SW 112–118 range are more stable for outdoor play. The
        Holbrook Mav (118.43) and Gearbox 8E (117.78) are particularly well-suited.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for outdoor play?",
      a: "For maximum surface durability outdoors, the Honolulu Crystal Blue Endurance Surface — Austin reviewed it as solving the durable grit problem. For value, the Enhance Turbo MPP ArmorGrit at ~$100 with PLAYBOOK. For premium performance + durability, the Bread & Butter Loco 2 with Space Dust Grit.",
    },
    {
      q: "Can I use my indoor paddle for outdoor play?",
      a: "Yes, but outdoor conditions will degrade the surface faster. Standard carbon grit surfaces last longer indoors. If you play primarily outdoors, choose a paddle with an engineered surface treatment (not just standard carbon grit) that's rated for durability.",
    },
    {
      q: "Does the paddle I use matter more indoors or outdoors?",
      a: "Outdoors adds variables (wind, sun, temperature) that reduce the impact of fine spec differences. What matters more outdoors is durability — you want a surface that holds its spin through a full outdoor season, not a paddle tuned for indoor touch shot precision.",
    },
    {
      q: "What swing weight is best for outdoor pickleball?",
      a: "SW 112–120 is better for outdoor play than under-110 paddles. Wind affects lightweight paddles on aggressive swings — more mass behind the ball means more consistent direction in cross-court or headwinds. The Holbrook Mav (118.43) and Gearbox Pressure X 8E (117.78) are particularly suited.",
    },
  ],
  relatedGuides: [
    "durable-grip",
    "raw-carbon-fiber",
    "for-recreational-players",
    "for-bangers",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Outdoor Play (${currentYear()}) — Durable Surfaces`,
  description:
    "The 5 best pickleball paddles for outdoor play in 2026. Durable surface treatments that hold up to UV, humidity, and abrasion — on-court tested by Austin.",
  keywords: [
    "best pickleball paddle for outdoor",
    "best outdoor pickleball paddle",
    "durable pickleball paddle outdoor",
    "outdoor pickleball paddle",
    `best outdoor pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Outdoor Play (${currentYear()})`,
    description: "5 paddles with durable surfaces for outdoor play — tested for UV, humidity, and abrasion resistance.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for outdoor play" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Outdoor Play (${currentYear()})`, description: "5 durable paddles for outdoor pickleball." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
