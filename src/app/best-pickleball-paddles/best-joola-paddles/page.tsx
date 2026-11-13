import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "best-joola-paddles";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "JOOLA Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "JOOLA shoppers",
  headline: `Best JOOLA Pickleball Paddles (${currentYear()})`,
  intro:
    "JOOLA brings European racket-sport engineering pedigree to pickleball. Their Pro V series — featuring paddles endorsed by professionals across the Perseus, Graf, Agassi, and Hyperion lines — targets competitive players at the 4.5+ level. The 3S Dual Perseus is their best-value entry into the Pro V ecosystem at $199.95. Every JOOLA Pro V paddle ships with the same carbon fiber construction and Pro V surface used by tour professionals.",
  trustSignals: ["Pro V Carbon Surface", "Tour-Level Build", "Multiple Shape Options", "Discount Codes Included"],
  accent: "#0ea5e9",
  picks: [
    {
      slug: "joola-3s-dual-perseus-elongated",
      label: "Best Value JOOLA",
      why: "SW 116.56 at $199.95 — the 3S Dual Perseus is the most accessible entry into the JOOLA Pro V ecosystem. The 3S Dual carbon face gives you the same Pro V surface feel at a price point $100+ below the signature Pro V line. TW 6.10 is solid for an elongated build. For players who want JOOLA Pro V quality without the signature premium, start here. Code PLAYBOOK.",
    },
    {
      slug: "joola-pro-v-perseus-elongated",
      label: "Best Premium JOOLA (Elongated)",
      why: "The Perseus Rally Rocket at $329.95 — SW 116.29 with TW 6.35 on a Pro V carbon surface used by tour professionals. The higher TW (6.35 vs 6.10 on the 3S) gives the Rally Rocket more directional stability on off-center shots, which matters at the competitive level. For players who want the definitive JOOLA elongated tool, this is it. Code PLAYBOOK.",
    },
    {
      slug: "joola-kosmos-pro-v-hybrid-16mm",
      label: "Best JOOLA for Hybrid Shape",
      why: "The Kosmos Pro V Hybrid pairs JOOLA's Pro V carbon construction with a hybrid shape for players who want a shorter reach but more face coverage than an elongated. The 16mm core is the softer, more touch-friendly choice within the Kosmos line. At $299.95 it's in the same tier as the full Pro V line. Code PLAYBOOK.",
    },
    {
      slug: "joola-scorpeus-pro-v-widebody-16mm",
      label: "Best JOOLA for Widebody Shape",
      why: "The Scorpeus Pro V is JOOLA's widebody option — the largest sweet spot in the Pro V lineup. For JOOLA players who prioritize forgiveness over reach, the Scorpeus 16mm delivers the Pro V carbon surface on a shape that's kinder to mishits. At $299.95, it's the right choice for players coming from a forgiving background who still want JOOLA's premium construction. Code PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "How to choose between JOOLA Pro V paddles",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>All JOOLA Pro V paddles share the same carbon surface — shape is the differentiator.</strong>{" "}
        The Perseus line is elongated, the Kosmos is hybrid, the Scorpeus is widebody, and the Graf is elongated
        (signature). The Pro V carbon fiber face and core construction are consistent across the lineup. Choose
        shape first, then signature vs. non-signature.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>The 3S Dual is the value entry — not a downgrade.</strong>{" "}
        The 3S Dual Perseus at $199.95 uses JOOLA&apos;s 3S Dual carbon face (not the Pro V face), but plays comparably
        for most club-level and advancing recreational players. If you&apos;re not yet playing 4.5+, the 3S is the
        right starting point. It has measured SW 116.56 — the only JOOLA paddle with a published lab measurement
        available at this time.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>JOOLA swing weights are mostly unpublished.</strong>{" "}
        Unlike Selkirk, Bread & Butter, and Luzz, JOOLA does not publish swing weight data for most Pro V paddles.
        The 3S Dual Perseus (SW 116.56) and Perseus Rally Rocket (SW 116.29) are the two measured models in our
        database. The Pro V line paddles are assumed to be in the SW 114–118 range based on construction, but
        this hasn&apos;t been verified.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>14mm vs. 16mm in the JOOLA Kosmos and Scorpeus lines.</strong>{" "}
        Both shapes come in 14mm and 16mm. 14mm gives a crisper, faster response with more pop. 16mm is softer
        and better for touch and reset players. Most players at the club level are better served by 16mm;
        players who win with attacking play can try 14mm.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best JOOLA pickleball paddle?",
      a: "The JOOLA 3S Dual Perseus Elongated (SW 116.56, $199.95) is the best value JOOLA paddle — Pro V-equivalent construction at a more accessible price. For the definitive Pro V tour-level experience, the Perseus Rally Rocket at $329.95 is the elongated flagship.",
    },
    {
      q: "Are JOOLA pickleball paddles good?",
      a: "Yes — JOOLA is one of the most respected names in racket sports globally and their pickleball paddles reflect that engineering pedigree. The Pro V line in particular is used by professional players on tour. For competitive players, JOOLA Pro V paddles are a legitimate top-tier choice.",
    },
    {
      q: "What is the JOOLA Pro V surface?",
      a: "Pro V is JOOLA's premium carbon fiber face technology, engineered for consistent spin generation and durability at the tour level. It's the same surface used by professional players. The 3S Dual surface (on lower-priced JOOLA paddles) is similar but a step below in texture and durability.",
    },
    {
      q: "How much do JOOLA pickleball paddles cost?",
      a: "JOOLA paddles range from $199.95 (3S Dual Perseus) to $329.95 (Pro V signature models). The Pro V line (Perseus, Kosmos, Scorpeus, Graf, Agassi, Hyperion) is uniformly priced at $299.95. Use code PLAYBOOK at checkout for savings.",
    },
  ],
  relatedGuides: [
    "for-competitive-players",
    "for-4.5-players",
    "thermoformed",
    "raw-carbon-fiber",
  ],
};

export const metadata: Metadata = {
  title: `Best JOOLA Pickleball Paddles (${currentYear()}) — Pro V Ranked`,
  description: `The best JOOLA pickleball paddles ranked. Pro V carbon surface picks from $199.95 to $329.95 — with shape guide, buying advice, and discount codes.`,
  keywords: ["best JOOLA pickleball paddle", "JOOLA Pro V pickleball paddle", "JOOLA Perseus pickleball", `best JOOLA paddle ${currentYear()}`],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best JOOLA Pickleball Paddles (${currentYear()})`, description: "4 JOOLA Pro V paddles ranked by shape and price.", url: PAGE_URL, type: "article", siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best JOOLA paddles" }] } : {}),
  },
  twitter: { card: "summary_large_image", title: `Best JOOLA Pickleball Paddles (${currentYear()})`, description: "4 JOOLA Pro V paddles ranked." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
