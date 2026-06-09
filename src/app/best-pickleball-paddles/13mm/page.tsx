import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { paddles, getPaddleBySlug } from "@/data/paddles";
import { powerScore, paddleToPick } from "@/lib/specPicks";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "13mm";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

// 13mm is the rarest production thickness — only ~6 paddles in the catalog.
// All of them are tuned for max pop and stiff power play. Power-leaning sort.
const TOP_13MM = paddles
  .filter((p) => p.thickness === "13mm")
  .sort((a, b) => powerScore(b) - powerScore(a))
  .slice(0, 6);

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "13mm Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "13mm power players",
  headline: `Best 13mm Pickleball Paddles (${currentYear()})`,
  intro:
    "13mm is the thinnest production core thickness in pickleball — and the most polarizing. Stiffer, louder, livelier off the face. Maximum pop on drives, almost no dwell time on dinks. Best for advanced power players who play singles, drive every third shot, and value pace over plush feel. Below are the best 13mm paddles in the catalog, ranked by power-leaning score.",
  trustSignals: ["Lab-Measured Specs", "Max Pop · Min Dwell", "Power-Player Geometry", "Discount Codes Included"],
  accent: "#dc2626",
  picks: TOP_13MM.map((p, i) => paddleToPick(p, {
    label: i === 0 ? "Best Overall 13mm" : i === 1 ? "Best 13mm Power" : `#${i + 1} Best 13mm`,
    angle: "power",
  })),
  buyingGuide: {
    heading: "Why 13mm — and who should absolutely avoid it",
    paragraphs: [
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>13mm = maximum pop, maximum stiffness.</strong> The
        thinnest core in pickleball delivers the liveliest face. Drives jump off, serves come hot, and the
        feel is firm and direct. The trade-off is dwell time — there isn&apos;t much, which makes touch shots
        and resets noticeably harder.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>13mm is unforgiving.</strong> The stiff face transmits
        every off-center hit straight up your arm. Players with elbow pain should avoid 13mm entirely. Players
        who mishit frequently will hate the feedback.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Best for: advanced singles players, power baseline players, anyone who values pace over touch.</strong>{" "}
        If you reliably hit center, play singles or aggressive doubles, and your game is built on drives and
        serves rather than dinks and drops, 13mm is the right thickness.
      </p>,
      <p key="4">
        <strong style={{ color: "var(--text-primary)" }}>Skip 13mm if: you&apos;re developing your stroke, you have arm pain, or you play touch-heavy doubles.</strong>{" "}
        See our <a href="/best-pickleball-paddles/16mm" style={{ color: "#dc2626" }}>16mm paddle picks</a> (default
        thickness) or <a href="/best-pickleball-paddles/14mm" style={{ color: "#dc2626" }}>14mm paddle picks</a>{" "}
        (lively without going extreme).
      </p>,
      <p key="5">
        Browse all paddles in our <a href="/paddles" style={{ color: "#dc2626" }}>full paddle database</a> or compare
        13mm options directly with our <a href="/compare" style={{ color: "#dc2626" }}>comparison tool</a>.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best 13mm pickleball paddle?",
      a: `Based on power-leaning score (swing weight + trending), the ${TOP_13MM[0]?.brand} ${TOP_13MM[0]?.name} is currently the top 13mm pick.`,
    },
    {
      q: "Is a 13mm paddle better than 16mm?",
      a: "Different, not better. 13mm gives you more pop and a stiffer, livelier feel — best for power play. 16mm gives you more dwell time, forgiveness, and touch — best for control play and the majority of recreational players.",
    },
    {
      q: "Should beginners use a 13mm paddle?",
      a: "No. 13mm punishes off-center hits and transmits more shock to the arm. Beginners should start at 16mm and consider 13mm only after their stroke is consistent enough to reliably hit center.",
    },
    {
      q: "Will a 13mm paddle cause elbow pain?",
      a: "It can, especially if you mishit often. The thinner stiffer core transmits more vibration than a 16mm or 18mm paddle. If you have any history of tennis elbow, avoid 13mm and see our elbow-friendly picks instead.",
    },
    {
      q: "Why are there so few 13mm paddles?",
      a: "It's a niche thickness — only a small slice of buyers prefer the stiff lively feel. Most brands stock more 16mm SKUs than any other thickness because 16mm has the widest buyer appeal.",
    },
  ],
  relatedGuides: [
    "pickleball-paddle-thickness-explained",
    "13mm-vs-14mm-vs-16mm-paddles",
    "power-vs-control-pickleball-paddles",
    "what-is-swing-weight",
  ],
};

export const metadata: Metadata = {
  title: `Best 13mm Pickleball Paddles (${currentYear()}) — Max Pop, Max Stiffness`,
  description:
    "The best 13mm pickleball paddles — the thinnest production core thickness in pickleball. Maximum pop, lively face, stiff feel. Best for advanced power players. Lab-measured specs and discount codes.",
  keywords: [
    "best 13mm pickleball paddle",
    "13mm pickleball paddle",
    "thin core pickleball paddle",
    `13mm paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best 13mm Pickleball Paddles (${currentYear()})`,
    description: "The thinnest production cores in pickleball — ranked.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(TOP_13MM[0]?.slug ?? "")?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(TOP_13MM[0].slug)?.image}`, alt: "Best 13mm pickleball paddles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best 13mm Pickleball Paddles (${currentYear()})`, description: "The thinnest production cores in pickleball." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
