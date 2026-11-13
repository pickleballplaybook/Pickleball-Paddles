import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-seniors";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Senior Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "senior players",
  headline: `Best Pickleball Paddles for Seniors (${currentYear()})`,
  intro:
    "For senior players, the two numbers that matter most are swing weight and static weight. A lower swing weight means less arm fatigue over a long session — and less stress on shoulders, elbows, and wrists. Every paddle below has a swing weight under 112 and a physical weight under 8.1 oz. Lightweight doesn't mean cheap: all five are premium builds with widebody or hybrid shapes that maximize forgiveness alongside their low weight.",
  trustSignals: ["Lab-Measured Swing Weight", "Arm-Friendly Builds", "All Under 8.1 oz", "Discount Codes Included"],
  accent: "#4ade80",
  picks: [
    {
      slug: "selkirk-amped-s2-widebody",
      label: "Lightest & Most Maneuverable",
      why: "The Amped S2 has the lowest swing weight of any paddle in our database at 97.68 — it's genuinely easier on the arm than everything else we've tested. Selkirk build quality is best-in-class, the widebody shape gives you a forgiving sweet spot, and at $100 flat it's the most accessible premium option on this list. If wrist or shoulder pain is your main concern, start here.",
    },
    {
      slug: "honolulu-j3cr-crystal-blue-widebody",
      seriesSlugs: [
        "honolulu-j2cr-crystal-blue-hybrid",
        "honolulu-j6cr-crystal-blue-elongated",
        "honolulu-j3cr-crystal-blue-widebody",
      ],
      seriesName: "Honolulu Crystal Blue",
      label: "Best for Spin & Touch",
      why: "The J3CR widebody pairs a comfortable SW 105.21 with Honolulu's Endurance Surface — a textured face that Austin reviewed as genuinely solving the durable grit problem. Spin holds steady (or actually increases) the more you play with it. At only 105 swing weight, it's easy on the arm while still generating the kind of spin and control that makes the kitchen game enjoyable.",
    },
    {
      slug: "gruvn-lazr-16hd-hybrid",
      label: "Best All-Court Lightweight",
      why: "The LAZR-16HD full foam core has a SW of 107.07 — light enough for extended play without arm fatigue, with a foam build that naturally absorbs vibration. Less vibration means less joint stress over time. The hybrid shape balances sweet spot size with a bit more reach than a widebody. At $169, it's the best all-around lightweight pick for a senior who wants one paddle that does everything.",
    },
    {
      slug: "engage-pursuit-pro-2-widebody",
      label: "Best Value Widebody",
      why: "SW 108.79 with TW 7.21 — a genuinely forgiving paddle at a price most seniors will find reasonable at $129.99. The widebody shape means the sweet spot is large and the paddle is easy to time. Engage builds solid paddles with consistent specs, and the Pursuit Pro 2 is their most accessible widebody. Code PLAYBOOK applies.",
    },
    {
      slug: "chorus-coda-harmony-grit-widebody",
      label: "Best Overall (Premium)",
      why: "TW 7.41 is among the most forgiving twist weights in the entire catalog — meaning off-center hits still go where you aim them. The Coda Harmony pairs this with a comfortable SW 111.81 that's still low enough for a senior to handle multiple games without fatigue. If budget allows, this is the most complete senior paddle: forgiving, durable premium surface, and a build quality that scales with your improving game.",
    },
  ],
  buyingGuide: {
    heading: "What specs matter most for senior players",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>Swing weight is the most important spec for seniors — and most paddle listings don&apos;t show it.</strong>{" "}
        Swing weight measures how heavy the paddle feels when you swing it. Lower numbers mean less arm fatigue, less
        torque on your elbow, and faster hand speed at the kitchen. Every paddle on this page is under SW 112; the
        best picks are in the 97–108 range.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Static weight and swing weight are different.</strong>{" "}
        A paddle can be physically light (7.3 oz) but have a high swing weight if the weight is concentrated in the
        head. Always check the swing weight number — that&apos;s what your arm actually feels.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Widebody shapes reduce wrist strain on mishits.</strong>{" "}
        When you hit off-center, a widebody paddle twists less (measured by twist weight). Less twist = less sudden
        torque = less repetitive strain on tendons over time. If you play three or more days per week, this matters.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>16mm cores absorb more vibration than 13mm.</strong>{" "}
        Thicker cores are softer and dampen impact better. Every pick above is 16mm. The Selkirk Amped S2 in
        particular is known for an unusually soft, planted feel at contact despite its low swing weight.
      </p>,
      <p key="4">
        If elbow pain is your primary concern, see our dedicated{" "}
        <a href="/best-pickleball-paddles/for-elbow-pain" style={{ color: "#4ade80" }}>best paddles for elbow pain</a>{" "}
        guide — it covers the same low-SW picks but in more detail for that specific issue.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for seniors?",
      a: "The Selkirk Amped S2 (SW 97.68) is the most arm-friendly paddle we've tested — the lowest swing weight in the entire database. For a premium all-court option, the GRUVN LAZR-16HD at SW 107 balances lightness with enough performance to keep up with competitive club play.",
    },
    {
      q: "What swing weight is best for a senior pickleball player?",
      a: "Under 110 is the right target for most seniors. Under 105 is ideal if you have any elbow or shoulder concerns. Every pick on this page is under 112; our top picks are in the 97–109 range. Swing weight is different from static weight — a paddle can feel heavier or lighter than it looks depending on where the mass is distributed.",
    },
    {
      q: "Is a lighter pickleball paddle better for seniors?",
      a: "Generally yes — but swing weight matters more than static weight. A 7.4 oz paddle with a head-heavy balance point can feel harder to swing than a 7.9 oz paddle with a handle-heavy balance. Focus on the swing weight number over the listed weight in ounces.",
    },
    {
      q: "Can seniors play with an elongated paddle?",
      a: "Yes, but elongated paddles typically have higher swing weights — which means more arm fatigue over time. The Honolulu J6CR Crystal Blue is an exception at SW 115.09, but widebody shapes (S2, J3CR) are generally kinder for senior play. Try widebody first.",
    },
    {
      q: "Do seniors need a USAP-approved paddle?",
      a: "Only for sanctioned tournaments. For club play, recreational leagues, and social games, approval doesn't matter. The Selkirk Amped S2, GRUVN LAZR-16HD, and several others on this list are USAP-approved anyway.",
    },
  ],
  relatedGuides: [
    "for-elbow-pain",
    "lightweight",
    "most-forgiving",
    "for-beginners",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Seniors (${currentYear()}) — Lightweight, Arm-Friendly`,
  description:
    "The 5 best pickleball paddles for senior players in 2026. All under SW 112 with lab-measured swing weight, widebody shapes for forgiveness, and discount codes included.",
  keywords: [
    "best pickleball paddle for seniors",
    "lightweight pickleball paddle for seniors",
    "arm friendly pickleball paddle",
    "best senior pickleball paddle",
    `pickleball paddle for seniors ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Seniors (${currentYear()}) — Lightweight & Arm-Friendly`,
    description: "5 arm-friendly paddles ranked for senior players — lab-measured swing weights, widebody shapes, and discount codes.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for seniors" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Seniors (${currentYear()})`, description: "5 arm-friendly paddles ranked for seniors." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
