import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-women";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Lighter Setup Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "women",
  headline: `Best Pickleball Paddles for Women (${currentYear()})`,
  intro:
    "Many women players prefer a lighter, more maneuverable setup — moderate static weight, lower-to-mid swing weight, and a balanced spec sheet that doesn't fatigue the wrist or shoulder over long matches. (That said, plenty of women play with heavy power paddles too — if that's you, see our tennis-players or power picks.) These five are the cleanest lighter-spec picks in the catalog.",
  trustSignals: ["Light Static Weight", "Mid Swing Weight", "Lab-Measured Specs", "Discount Codes Included"],
  accent: "#f472b6",
  picks: [
    {
      slug: "6-0-coral-hybrid",
      label: "Best Overall",
      why: "The Coral hits the lightweight sweet spot at 7.6 oz and SW 110.59. Quick at the kitchen, but the all-court hybrid shape gives you reach when you need it. TW 6.62 is forgiving on off-center hits — easily one of the most balanced paddles in the catalog.",
    },
    {
      slug: "gruvn-lazr-16hd-hybrid",
      label: "Best Feel + Foam Core",
      why: "Full-foam 16mm core with SW 107 — quick in the hand without feeling weak. The Lazr-16HD is one of the softest, most planted paddles you can buy under $200, and the lightweight feel makes it especially friendly for longer sessions where wrist fatigue matters.",
    },
    {
      slug: "friday-aura-hybrid",
      seriesSlugs: ["friday-aura-elongated", "friday-aura-hybrid"],
      seriesName: "Friday Aura",
      label: "Best for Control + Dinking",
      why: "If your game is built on placement and touch, the Aura's soft 16mm core and lower SW (108.60 on the hybrid, 7.6 oz) is exactly the right setup. Resets, dinks, and third-shot drops feel locked in. At $119 with PLAYBOOK, it's also one of the better-priced picks here.",
    },
    {
      slug: "enhance-turbo-mpp-hybrid",
      seriesSlugs: ["enhance-turbo-mpp-elongated", "enhance-turbo-mpp-hybrid"],
      seriesName: "Enhance Turbo MPP",
      label: "Best Power Without the Weight",
      why: "Want some pop without going heavy? The Turbo MPP hybrid pairs SW 114.24 with TW 6.48 in a foam-core build that's still maneuverable. Drops to $99.99 with PLAYBOOK — exceptional value for a paddle this well-balanced.",
    },
    {
      slug: "honolulu-j2cr-crystal-blue-hybrid",
      seriesSlugs: ["honolulu-j2cr-crystal-blue-hybrid", "honolulu-j6cr-crystal-blue-elongated", "honolulu-j3cr-crystal-blue-widebody"],
      seriesName: "Honolulu Crystal Blue",
      label: "Best Spec Sheet",
      why: "SW 109.61 and TW 6.57 in a hybrid shape, with Honolulu's Endurance Surface that holds its grip far longer than typical carbon. It's the most pro-grade spec sheet in this lighter-setup bracket. At ~$176 with PLAYBOOK, you can grow into it for years.",
    },
  ],
  buyingGuide: {
    heading: "What lighter pickleball setups have in common",
    paragraphs: [
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Static weight 7.5–8.0 oz</strong> is the lighter range — easier
        on the wrist over long matches and faster to whip around at the kitchen. Above 8.2 oz you start feeling fatigue
        in a 3+ hour playing day.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Swing weight 107–115</strong> keeps the paddle nimble without
        sacrificing pop. The picks above are tuned to this range. Lower than 107 the paddle feels weak; higher than 115
        and your hand speed at the net drops.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>A 16mm core is the right starting point.</strong> Softer
        feel, more forgiveness on mishits, and easier on the elbow than a 13mm. All five picks use 16mm cores.
      </p>,
      <p key="4">
        Want to also see lighter paddles under a price cap? Browse <a href="/best-pickleball-paddles/under-125" style={{ color: "#f472b6" }}>best pickleball paddles under $125</a>{" "}
        or <a href="/best-pickleball-paddles/under-200" style={{ color: "#f472b6" }}>under $200</a>.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for women?",
      a: "There's no inherently 'women's paddle' — the right paddle depends on your game, not your gender. That said, many women prefer a lighter setup (7.5–8.0 oz, SW 107–115). The 6.0 Coral Hybrid is the cleanest single pick — perfectly balanced specs at a fair price.",
    },
    {
      q: "Are there pickleball paddles specifically designed for women?",
      a: "A few brands market 'women's' paddles, but they're usually just slightly smaller grip sizes — the spec sheets aren't different. Better to ignore the marketing and pick based on the specs that match your stroke (swing weight, twist weight, weight).",
    },
    {
      q: "What grip size should women players use?",
      a: "Grip size is about hand size, not gender. Most adult women players are best served by a 4 1/8\" or 4 1/4\" grip. Try both at a pickleball pro shop if possible — too small and the paddle twists in your hand; too big and you can't generate spin.",
    },
    {
      q: "What's a good first paddle if I'm new to pickleball?",
      a: "See our dedicated beginners page — the 6.0 Coral Hybrid here is a strong pick, but the Beyond Measure Ronin (under $125) is the cleanest first paddle for any new player regardless of preferred weight setup.",
    },
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Women (${currentYear()}) — Tested & Ranked`,
  description:
    "The 5 best pickleball paddles for women in 2026 — lighter static weight, balanced swing weight, and tested with lab-measured specs. Discount codes included.",
  keywords: [
    "best pickleball paddle for women",
    "best women's pickleball paddle",
    "lightweight pickleball paddle",
    "pickleball paddle for ladies",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Women (${currentYear()})`,
    description: "5 lighter-setup paddles tested with lab-measured specs.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for women" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Women (${currentYear()})`, description: "5 lighter-setup paddles tested with lab-measured specs." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
