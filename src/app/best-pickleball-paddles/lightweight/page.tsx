import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "lightweight";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Lightweight Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "lightweight paddle seekers",
  headline: `Best Lightweight Pickleball Paddles (${currentYear()})`,
  intro:
    "Lightweight means low swing weight — not just low ounces listed on the box. Swing weight measures how heavy the paddle actually feels when you swing it, which is the number that determines arm fatigue, hand speed at the kitchen, and joint stress over long sessions. Every paddle below has a swing weight under 110. These are the fastest-feeling paddles in our lab-tested database.",
  trustSignals: ["All Under SW 110", "Lab-Measured Swing Weight", "Real Static Weights", "Discount Codes Included"],
  accent: "#4ade80",
  picks: [
    {
      slug: "selkirk-amped-s2-widebody",
      label: "Lightest Swing Weight (SW 97.68)",
      why: "No paddle in our database swings lighter than the Amped S2 at 97.68. It's not just physically light — the balance point is deliberately handle-heavy so the paddle feels almost weightless at the kitchen. If your primary goal is hand speed and arm comfort, nothing beats this. Widebody shape adds forgiveness to the equation. $100 flat, no code needed.",
    },
    {
      slug: "avoura-rhapsody-hybrid",
      label: "Lightest with High Forgiveness (SW 104.47)",
      why: "SW 104.47, TW 7.33 — an unusually high twist weight for such a low swing weight. That combination means the Rhapsody is both fast AND forgiving, which is rare. The 13mm core adds pop and a livelier feel. At $159.99 with PLAYBOOK discount, it&apos;s the best lightweight option for a player who still wants forgiveness on mishits.",
    },
    {
      slug: "aireo-cyclone-upa-hybrid",
      label: "Best USAP-Approved Lightweight (SW 103.79)",
      why: "SW 103.79 with USAP approval for tournament play. Aireo's Cyclone is built for competitive players who want fast hands without sacrificing legality. The 16mm hybrid build keeps touch game soft while the low swing weight enables elite hand speed in fast exchanges. At $199 with 10% off via PLAYBOOK (~$179).",
    },
    {
      slug: "honolulu-j3cr-crystal-blue-widebody",
      label: "Best Lightweight for Durability (SW 105.21)",
      why: "SW 105.21 with Honolulu's Crystal Blue Endurance Surface. Austin's review: the endurance surface actually solves the durable grit problem — spin holds steady or increases with use. You get a lightweight, arm-friendly paddle that won't lose its surface after 40 hours of play. The widebody geometry adds forgiveness alongside the low swing weight. 10% off with PLAYBOOK.",
    },
    {
      slug: "gruvn-lazr-16hd-hybrid",
      label: "Best Lightweight All-Court (SW 107.07)",
      why: "SW 107.07 in a full foam 16mm hybrid — the lowest swing weight with a foam core rather than a standard polymer. Foam cores absorb vibration better than hollow-polymer builds, making this the most joint-friendly option on the list for extended play sessions. The hybrid shape gives you more reach than the widebody picks above. ~$152 with PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "Swing weight vs. static weight — what actually matters",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>Static weight (ounces) ≠ swing weight.</strong>{" "}
        A paddle can be 7.4 oz but feel heavy if weight is concentrated at the head. A 7.9 oz paddle with a
        handle-heavy balance can feel lighter to swing. The swing weight number is what your arm actually experiences.
        Always check the SW column, not just the listed weight in oz.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Under SW 105 is elite lightweight territory.</strong>{" "}
        Three of the five picks above are under SW 105. That range gives you professional-level hand speed at the
        kitchen — reaction-fast exchanges that would feel slow with a SW 115+ paddle.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>The tradeoff: power.</strong>{" "}
        Lower swing weight means less mass behind the ball on drives. Lightweight paddles are most effective for
        players who win points at the kitchen (dinks, resets, hand battles) rather than off the baseline. If
        you&apos;re a baseline power player, SW 113+ will serve you better.
      </p>,
      <p key="3">
        For arm pain specifically, see our{" "}
        <a href="/best-pickleball-paddles/for-elbow-pain" style={{ color: "#4ade80" }}>best paddles for elbow pain</a>{" "}
        guide, which digs deeper into the vibration and torque factors beyond swing weight.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the lightest pickleball paddle by swing weight?",
      a: "The Selkirk Amped S2 at SW 97.68 is the lowest swing weight in our lab-tested database. The next lightest are the Aireo Cyclone (103.79) and Avoura Rhapsody (104.47). All three feel noticeably faster in hand battles than standard paddles.",
    },
    {
      q: "Is a lighter pickleball paddle better?",
      a: "Lighter is better for kitchen speed, hand battles, and arm health — but lower swing weight means less power on drives. The right swing weight depends on your game style. Kitchen-focused players benefit from SW under 110. Baseline power players are better served by SW 114+.",
    },
    {
      q: "What's the difference between a light paddle and a low swing weight paddle?",
      a: "Static weight (oz on the box) measures how heavy the paddle is when sitting still. Swing weight measures how heavy it feels when swinging — which depends on the balance point, not just the total mass. A head-heavy 7.4 oz paddle can have a higher swing weight than a handle-heavy 8.0 oz paddle.",
    },
    {
      q: "Do lightweight paddles help with tennis elbow?",
      a: "Lower swing weight reduces the rotational force on your elbow on contact. Combined with a soft 16mm core (which absorbs vibration), a lightweight paddle significantly reduces repetitive strain. The Selkirk Amped S2 and GRUVN LAZR-16HD are the two best options for elbow-pain prevention.",
    },
  ],
  relatedGuides: [
    "for-seniors",
    "for-elbow-pain",
    "for-kitchen-game",
    "most-forgiving",
  ],
};

export const metadata: Metadata = {
  title: `Best Lightweight Pickleball Paddles (${currentYear()}) — Low Swing Weight, Ranked`,
  description:
    "The 5 lightest pickleball paddles by swing weight in 2026. All under SW 110, lab-measured. Best for kitchen speed, hand battles, and arm-friendly play.",
  keywords: [
    "best lightweight pickleball paddle",
    "lightest pickleball paddle",
    "low swing weight pickleball paddle",
    "arm friendly pickleball paddle",
    `lightweight pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Lightweight Pickleball Paddles (${currentYear()}) — All Under SW 110`,
    description: "5 paddles ranked by swing weight — the lightest, fastest paddles in our lab-tested database.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best lightweight pickleball paddles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Lightweight Pickleball Paddles (${currentYear()})`, description: "5 low swing weight paddles ranked for arm speed and kitchen play." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
