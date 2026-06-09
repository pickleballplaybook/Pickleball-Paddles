import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { paddles, getPaddleBySlug } from "@/data/paddles";
import { forgivenessScore, paddleToPick } from "@/lib/specPicks";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "16mm";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

// 16mm cores dominate the catalog (~92 of 124). Ranked by forgiveness score
// — top picks favor TW + balanced SW. The 16mm thickness itself is the
// default for control + touch play; we surface the very best of the format.
const TOP_16MM = paddles
  .filter((p) => p.thickness === "16mm")
  .sort((a, b) => forgivenessScore(b) - forgivenessScore(a))
  .slice(0, 10);

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "16mm Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "16mm players",
  headline: `Best 16mm Pickleball Paddles (${currentYear()})`,
  intro:
    "16mm has become the default core thickness in pickleball for good reason — it's the right balance of plush dwell time, off-center forgiveness, and enough pop for serious play. Thicker than 13–14mm power paddles (more touch, more forgiveness), thinner than 18mm dampened paddles (more responsive). Below are the 10 best 16mm paddles, ranked across every shape by measured twist weight and swing weight balance.",
  trustSignals: ["Lab-Measured Specs", "Forgiveness-Ranked", "All Shapes Included", "Discount Codes Included"],
  accent: "#10b981",
  picks: TOP_16MM.map((p, i) => paddleToPick(p, {
    label: i === 0 ? "Best Overall 16mm" : i === 1 ? "Best 16mm Forgiveness" : `#${i + 1} Best 16mm`,
    angle: "forgiveness",
  })),
  buyingGuide: {
    heading: "Why 16mm — and when to go thinner or thicker",
    paragraphs: [
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>16mm is the default for a reason.</strong> Thicker cores
        absorb more shock, hold the ball longer on contact (dwell time), and forgive off-center hits better than
        thinner cores. The trade-off is slightly less &quot;pop&quot; off the face — but for most players, that
        trade is the right one.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Go thinner (13–14mm) if: you&apos;re a power player who wants maximum pop and minimum dwell.</strong>{" "}
        Thinner cores are stiffer and livelier. See our <a href="/best-pickleball-paddles/13mm" style={{ color: "#10b981" }}>13mm paddle picks</a>{" "}
        or <a href="/best-pickleball-paddles/14mm" style={{ color: "#10b981" }}>14mm paddle picks</a>.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Go thicker (18mm+) if: you have elbow pain or want maximum touch.</strong>{" "}
        18mm cores are the plushest, most dampened option. See our <a href="/best-pickleball-paddles/for-elbow-pain" style={{ color: "#10b981" }}>elbow-friendly paddle picks</a>.
      </p>,
      <p key="4">
        <strong style={{ color: "var(--text-primary)" }}>16mm works for every play style.</strong> Power players,
        control players, beginners, advanced — every category has multiple high-performing 16mm options.
        That&apos;s why it&apos;s the most-stocked thickness in the catalog.
      </p>,
      <p key="5">
        Browse all paddles in our <a href="/paddles" style={{ color: "#10b981" }}>full paddle database</a>, or
        compare 16mm paddles head-to-head with our <a href="/compare" style={{ color: "#10b981" }}>comparison tool</a>.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best 16mm pickleball paddle?",
      a: `Based on our forgiveness score (which weighs twist weight + balanced swing weight), the ${TOP_16MM[0]?.brand} ${TOP_16MM[0]?.name} is currently the top 16mm pick. It combines a high twist weight with a swing weight in the easy-to-handle range.`,
    },
    {
      q: "Is 16mm better than 13mm?",
      a: "For most players, yes. 16mm is more forgiving on mishits, has longer dwell time on contact, and works for touch play. 13mm is livelier and has more pop — better for advanced power players who reliably hit center.",
    },
    {
      q: "Are 16mm paddles good for beginners?",
      a: "Yes — 16mm is the right thickness for nearly every beginner. The softer feel and bigger forgiveness window make consistent contact much easier while you're still developing your stroke.",
    },
    {
      q: "Do pros use 16mm paddles?",
      a: "Many do — especially in doubles. 16mm is the most popular thickness at every level from recreational to pro. Some power-focused singles pros prefer 13mm for the extra pop.",
    },
    {
      q: "What's the trade-off of a 16mm paddle?",
      a: "Slightly less raw pop off the face than 13–14mm options. For touch players the trade is worth it; for pure power players it can feel muted.",
    },
  ],
  relatedGuides: [
    "pickleball-paddle-thickness-explained",
    "13mm-vs-14mm-vs-16mm-paddles",
    "power-vs-control-pickleball-paddles",
    "what-is-a-foam-core-pickleball-paddle",
  ],
};

export const metadata: Metadata = {
  title: `Best 16mm Pickleball Paddles (${currentYear()}) — Ranked Across Every Shape`,
  description:
    "The 10 best 16mm pickleball paddles, ranked by measured twist weight and swing weight. 16mm is the default core thickness in pickleball — best balance of touch, forgiveness, and pop. Discount codes included.",
  keywords: [
    "best 16mm pickleball paddle",
    "16mm pickleball paddle",
    "thick core pickleball paddle",
    `16mm paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best 16mm Pickleball Paddles (${currentYear()})`,
    description: "10 16mm paddles ranked by forgiveness + balance — the default core thickness.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(TOP_16MM[0]?.slug ?? "")?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(TOP_16MM[0].slug)?.image}`, alt: "Best 16mm pickleball paddles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best 16mm Pickleball Paddles (${currentYear()})`, description: "10 16mm paddles ranked by forgiveness + balance." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
