import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-singles";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Singles Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "singles players",
  headline: `Best Pickleball Paddles for Singles (${currentYear()})`,
  intro:
    "Singles pickleball is a different game. The court is wider relative to coverage, rallies go longer, and you win by creating pace or angles your opponent can't handle — not by kitchen finesse. That means you want higher swing weight for baseline driving power, elongated shape for reach and leverage, and durable grit surface for the extra spins you're generating from the baseline. Every pick below is optimized for singles play.",
  trustSignals: ["Singles-Optimized Specs", "Power + Reach Focused", "On-Court Tested", "Discount Codes Included"],
  accent: "#fb923c",
  picks: [
    {
      slug: "bread-and-butter-loco-2-elongated",
      label: "Best Overall Singles Paddle",
      why: "SW 119.14 with Austin's S-tier rating — the Loco 2 Elongated has the swing weight and shape for singles dominance. Space Dust Grit surface for elite spin on groundstrokes, elongated reach for covering the wider court, and enough pop to drive through a defensive position. Austin's review: exceptional power, elite spin. At $220 with PLAYBOOK, the best complete singles paddle.",
    },
    {
      slug: "gearbox-pressure-x-8e-elongated",
      label: "Best All-Court Singles",
      why: "Austin reviewed the Pressure X 8E as Gearbox's 'all-court offering — versatility and balance.' SW 117.78 with SpinLock surface for durable spin, impressive forgiveness across the entire hitting surface. The elongated shape gives you reach for wide balls and overhead putaways. For singles players who want a paddle that's powerful off the baseline AND still handles net approaches, this is the pick. PLAYBOOK applies.",
    },
    {
      slug: "holbrook-mav-elongated",
      label: "Best Value Singles",
      why: "SW 118.43 at $99.99 — the Holbrook Mav is one of the best singles values in the game. High swing weight for baseline driving, elongated shape for reach, and a price point that leaves budget for court time. TW 6.49 is respectable for an elongated shape. Code PLAYBOOK applies for additional savings.",
    },
    {
      slug: "luzz-tornazo-elongated",
      label: "Highest Swing Weight (SW 121.89)",
      why: "If you win singles by dictating pace and keeping your opponent pinned behind the baseline, the Tornazo is the weapon. SW 121.89 is among the highest in our entire database — every drive has maximum force behind it. 15% off with PLAYBOOK brings the $229 paddle to ~$195. Built for players who win by overpowering, not by finesse.",
    },
    {
      slug: "vatic-pro-v-sol-tour-evergrit-elongated",
      label: "Best Budget Singles",
      why: "SW 119.18 at $109 list — $10 off with PLAYBOOK = $99. The Vatic Pro V-Sol Tour Evergrit Elongated gives you a high-swing-weight singles tool with Evergrit surface for spin at a price that's hard to beat. For singles players who want legitimate driving power without spending $200+, this is the spec-per-dollar leader.",
    },
  ],
  buyingGuide: {
    heading: "Why singles needs different specs than doubles",
    paragraphs: [
      <p key="0">
        Singles is a baseline game — you&apos;re covering more court solo, hitting more groundstrokes, and relying on
        pace and spin to create short balls you can attack. Higher swing weight means more mass behind the ball on
        drives. Elongated shape means more reach for wide balls and a longer lever for overhead put-aways.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Swing weight 115–122 is the singles zone.</strong>{" "}
        In doubles you want SW 107–112 for kitchen speed. In singles, SW 115+ is a weapon — the extra mass drives
        through the ball harder. Every pick above is SW 117 or higher.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Elongated shape is preferred for singles.</strong>{" "}
        The longer face gives more reach for wide balls, a longer lever for groundstrokes, and a more compact hitting
        zone that rewards the consistent contact you develop with baseline practice. Every pick above is elongated.
      </p>,
      <p key="3">
        Playing doubles too? See our{" "}
        <a href="/best-pickleball-paddles/for-doubles" style={{ color: "#fb923c" }}>best paddles for doubles</a>{" "}
        — the specs flip toward lower SW, higher TW, and widebody/hybrid shapes. Most competitive players have
        one paddle for each format.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for singles?",
      a: "The Bread & Butter Loco 2 Elongated (SW 119.14) is Austin's top pick for singles — S-tier power, elite spin surface, and elongated reach. For value, the Holbrook Mav at $99.99 delivers SW 118.43. For pure pace, the Luzz Tornazo at SW 121.89 is the highest-swinging option in our catalog.",
    },
    {
      q: "Should a singles pickleball player use an elongated paddle?",
      a: "Yes, in most cases. Elongated shape gives more reach for covering the wider court solo and a longer lever for groundstroke power. The tradeoff is a slightly smaller sweet spot — which matters less in singles because you have more time to set up than in doubles kitchen battles.",
    },
    {
      q: "What swing weight is best for singles pickleball?",
      a: "SW 115–122 is optimal for singles play. The higher mass behind the ball matters for driving through defensive positions and creating pace. In doubles you'd want SW 107–112 for kitchen speed; in singles, the baseline game rewards higher swing weight.",
    },
    {
      q: "Can I use my doubles paddle for singles?",
      a: "Yes, but you'll likely feel underpowered on drives and outreach on wide balls. A widebody or hybrid doubles paddle at SW 108–112 will feel sluggish against a dedicated singles opponent with SW 117+. If you play both formats regularly, having two paddles is genuinely worth it.",
    },
  ],
  relatedGuides: [
    "for-doubles",
    "for-bangers",
    "for-advanced-players",
    "for-4.0-players",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Singles (${currentYear()}) — Power + Reach`,
  description:
    "The 5 best pickleball paddles for singles play in 2026. High swing weight, elongated shape for reach, and on-court tested for baseline driving power.",
  keywords: [
    "best pickleball paddle for singles",
    "best singles pickleball paddle",
    "pickleball singles paddle",
    "high swing weight pickleball paddle",
    `best pickleball paddle singles ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Singles (${currentYear()}) — Power & Reach`,
    description: "5 singles-optimized paddles with high swing weight, elongated shape, and on-court testing.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for singles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Singles (${currentYear()})`, description: "5 power-and-reach paddles for singles play." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
