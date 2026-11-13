import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "best-honolulu-paddles";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Honolulu Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "Honolulu shoppers",
  headline: `Best Honolulu Pickleball Paddles (${currentYear()})`,
  intro:
    "Honolulu Pickleball built their reputation on one thing: the Endurance Surface. Most paddle brands struggle with grit that smooths out after 3–6 months of hard play. Austin's review of the Honolulu Crystal Blue specifically identified the Endurance Surface as genuinely solving the durable grit problem — it holds its spin-generating texture significantly longer than standard raw carbon. All three Crystal Blue shapes (elongated, hybrid, widebody) are uniformly priced at $195 with the same Endurance Surface. Here are the Honolulu picks ranked by playing style.",
  trustSignals: ["Endurance Surface Technology", "Durable Grit Verified", "Three Shapes Available", "Discount Codes Included"],
  accent: "#06b6d4",
  picks: [
    {
      slug: "honolulu-j6cr-elongated",
      label: "Best Honolulu for Competitive Play",
      why: "SW 115.36 — the highest swing weight in the Honolulu lineup. The J6CR Elongated is the pick for advanced players who want Honolulu&apos;s durable Endurance Surface in a competitive elongated frame. TW 6.43 is solid. The J6CR gives you the spin longevity advantage of the Endurance Surface paired with reach and power. $195 with code PLAYBOOK.",
    },
    {
      slug: "honolulu-j2cr-crystal-blue-hybrid",
      label: "Best Honolulu All-Court",
      why: "SW 109.61 with TW 6.57 — the J2CR Crystal Blue Hybrid is the most balanced Honolulu paddle: arm-friendly swing weight, high twist weight stability, and the Endurance Surface. The hybrid shape gives you a larger face than the elongated while keeping more reach than a widebody. For players who want one Honolulu paddle for every situation, the J2CR Hybrid at $195 is the answer. Code PLAYBOOK.",
    },
    {
      slug: "honolulu-j3cr-crystal-blue-widebody",
      label: "Best Honolulu for Touch & Seniors",
      why: "SW 105.21 — the lowest swing weight in the Honolulu lineup, in a widebody shape that maximizes sweet spot. TW 6.4 keeps mishits directional. The J3CR Crystal Blue Widebody is the most arm-friendly Honolulu paddle, making it ideal for senior players or anyone who prioritizes comfort and forgiveness over raw drive power. Same Endurance Surface at the same $195 price. Code PLAYBOOK.",
    },
    {
      slug: "honolulu-j6cr-crystal-blue-elongated",
      label: "Best Honolulu Crystal Blue Elongated",
      why: "SW 115.09 — nearly identical to the J6CR at 115.09 vs 115.36. The J6CR Crystal Blue Elongated is the standard elongated Crystal Blue model featuring the Endurance Surface in Honolulu&apos;s most recognizable colorway. TW 6.27. For players who specifically want the Crystal Blue aesthetic with the Endurance Surface, this is the elongated pick. $195 with code PLAYBOOK.",
    },
    {
      slug: "honolulu-j6cr-m105-crystal-blue-elongated",
      label: "Best Honolulu for Spin Specialists",
      why: "The J6CR M 105 is Honolulu&apos;s elongated model tuned for spin-first players — the M 105 designation references the surface modification for increased spin generation. Swing weight has not been lab-measured yet for this specific variant. For players who have tried the standard J6CR Elongated and want a spin-optimized version of the same frame at $195, this is the dedicated pick. Code PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "Why Honolulu's Endurance Surface is different",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>The grit durability problem — and how Honolulu solves it.</strong>{" "}
        Most raw carbon fiber surfaces start to lose their spin-generating texture after 3–6 months of regular
        play. The texture smooths out, RPMs drop, and you&apos;re left with a paddle that plays differently
        than when you bought it. Austin&apos;s review specifically called out the Endurance Surface as one of
        the few that genuinely holds its texture over time.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>All three Crystal Blue shapes are the same price — $195.</strong>{" "}
        Honolulu doesn&apos;t charge more for one shape over another. The J6CR Elongated, J2CR Hybrid, and J3CR
        Widebody are all $195. This makes the choice purely about playing style and shape preference rather
        than budget. Start with shape — if you&apos;re unsure, the hybrid (J2CR) is the most versatile.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>J6CR vs J2CR vs J3CR — the numbering system.</strong>{" "}
        The number in the model name references the face size classification. J6 = larger elongated face.
        J2 = medium hybrid face. J3 = widebody face. The &quot;CR&quot; stands for Crystal Blue Endurance Surface
        (the surface technology). Simple system — pick your shape number.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Best Honolulu paddle for seniors: the J3CR Widebody.</strong>{" "}
        SW 105.21 with a widebody sweet spot — the J3CR is the most arm-friendly Honolulu paddle and one
        of the more forgiving widebody paddles in the mid-price tier. See the{" "}
        <a href="/best-pickleball-paddles/for-seniors" style={{ color: "#06b6d4" }}>best paddles for seniors guide</a>{" "}
        for a fuller comparison.
      </p>,
    ],
  },
  faq: [
    {
      q: "What is the best Honolulu pickleball paddle?",
      a: "The Honolulu J6CR Elongated (SW 115.36, $195) is the best overall pick for competitive play. For all-court versatility, the J2CR Crystal Blue Hybrid (SW 109.61, TW 6.57) is the most balanced Honolulu paddle. All three Crystal Blue shapes are the same price.",
    },
    {
      q: "What is Honolulu's Endurance Surface?",
      a: "The Endurance Surface is Honolulu's proprietary textured face technology, engineered for long-term grit durability. Unlike standard raw carbon that smooths out in 3–6 months of regular play, the Endurance Surface maintains its spin-generating texture significantly longer. Austin's hands-on review specifically verified this durability claim.",
    },
    {
      q: "Are Honolulu pickleball paddles worth it?",
      a: "Yes — particularly for players who play frequently and have been frustrated by paddle surfaces that lose their grit. At $195, Honolulu's Crystal Blue paddles sit in the competitive mid-tier price range with a genuinely differentiated surface technology. If you play 3+ days per week, the Endurance Surface durability is a meaningful advantage.",
    },
    {
      q: "How much do Honolulu pickleball paddles cost?",
      a: "All Crystal Blue Endurance Surface paddles are uniformly priced at $195. Honolulu does not charge more for one shape over another — elongated, hybrid, and widebody are all the same price. Use code PLAYBOOK at checkout for savings.",
    },
  ],
  relatedGuides: [
    "raw-carbon-fiber",
    "for-seniors",
    "durable-grip",
    "for-competitive-players",
  ],
};

export const metadata: Metadata = {
  title: `Best Honolulu Pickleball Paddles (${currentYear()}) — Endurance Surface Ranked`,
  description: `The best Honolulu pickleball paddles ranked. J6CR, J2CR Crystal Blue, J3CR Widebody — Endurance Surface grit durability with discount codes.`,
  keywords: ["best Honolulu pickleball paddle", "Honolulu Crystal Blue review", "Honolulu Endurance Surface paddle", `best Honolulu paddle ${currentYear()}`],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Honolulu Pickleball Paddles (${currentYear()})`, description: "5 Honolulu paddles ranked — Endurance Surface durability across three shapes.", url: PAGE_URL, type: "article", siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best Honolulu paddles" }] } : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Honolulu Pickleball Paddles (${currentYear()})`, description: "5 Honolulu paddles — Endurance Surface grit durability ranked." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
