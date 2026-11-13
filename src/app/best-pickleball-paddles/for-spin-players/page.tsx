import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-spin-players";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Spin Paddle Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "spin-focused players",
  headline: `Best Pickleball Paddles for Spin Players (${currentYear()})`,
  intro:
    "Spin in pickleball comes from two things: surface texture and swing mechanics. A premium grit surface — ArmorGrit, VantaGrit, Space Dust Grit — can add 200–400 RPM to a topspin drive compared to a smooth or cheap-textured face. Swing weight matters too: a higher-SW elongated paddle gives you more leverage on a topspin stroke. Every paddle below was chosen for a combination of durable premium grit, proven spin generation, and the mechanics to let you put it to use.",
  trustSignals: ["Premium Grit Surfaces", "Spin-Optimized Builds", "Lab-Measured Swing Weight", "Discount Codes Included"],
  accent: "#a855f7",
  picks: [
    {
      slug: "enhance-turbo-mpp-armorgrit-elongated",
      label: "Best Value Spin Paddle",
      why: "ArmorGrit is one of the most durable spin surfaces on the market — engineered to maintain texture through thousands of rallies where cheaper grit starts to smooth out. At SW 114.48 and $119.99, the Turbo MPP ArmorGrit gives you a premium spin surface at a price that most paddle brands charge for a basic raw carbon paddle. TW 6.45 keeps shots directional when you brush up on wide balls. If spin is the priority and budget matters, start here.",
    },
    {
      slug: "holbrook-fuze-vantagrit-elongated",
      label: "Best Premium Spin Paddle",
      why: "VantaGrit is Holbrook's top-tier nano-texture surface — it generates more spin than standard raw carbon, and it holds that spin capability over time rather than wearing smooth. SW 119.71 gives you the swing leverage to execute a full-brush topspin loop; TW 6.04 keeps the paddle honest when you miss the sweet spot. At $229.99 with PLAYBOOK, the Fuze Vantagrit is the pick for players who make spin the centerpiece of their game.",
    },
    {
      slug: "bread-and-butter-loco-2-elongated",
      label: "Best Spin + Power Combo",
      why: "Space Dust Grit on a SW 119.14 frame — the Loco 2 gives you the surface texture of a dedicated spin paddle with the swing weight to attack. Where pure spin paddles sometimes sacrifice drive depth for surface feel, the Loco 2 lets you use spin as a weapon while still owning the baseline. Austin's S-tier pick for advanced players. At $220 with PLAYBOOK, this is the pick for players who won't choose between spin and power.",
    },
    {
      slug: "selkirk-boomstik-elongated",
      label: "Best Spin + Topspin Stability",
      why: "TW 6.84 is the key number on the Boomstik — the highest twist weight on this list, meaning when you brush up at an angle on a topspin drive, the paddle resists rolling in your hand and the shot lands where you meant it. Spin players lose shots from paddle twist as much as from bad technique. SW 120.09 gives you plenty of leverage for topspin loops. Selkirk's surface quality holds grit longer than most competitors. $332.99 with PLAYBOOK.",
    },
    {
      slug: "chorus-coda-harmony-grit-elongated",
      label: "Best Spin + Control",
      why: "SW 116.59 sits slightly lower than the others — giving faster hand speed for spin redirection at the kitchen line. The Harmony Grit surface generates reliable topspin while the 16mm core provides the softness needed to drop spin-heavy third shots accurately into the NVZ. TW 6.22 is solid. For spin players who win at the kitchen rather than off the baseline, this is the most balanced choice. $199.99 with PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "How to actually evaluate a spin paddle",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>The grit surface is everything — and most brands lie about durability.</strong>{" "}
        Raw carbon fiber generates spin because of its texture, but cheap raw carbon smooths out in 3–6 months of hard
        play. ArmorGrit, VantaGrit, and Space Dust Grit are engineered to maintain texture over time. When evaluating
        a spin paddle, ask: what is the surface actually made of, and does the brand have a track record of grit that
        lasts?
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Swing weight amplifies spin — it doesn&apos;t create it.</strong>{" "}
        A higher-SW paddle gives you more leverage on a topspin stroke, which translates to higher RPMs. But the
        surface still does the gripping work. A SW 120 paddle with a smooth face generates less spin than a SW 110
        paddle with ArmorGrit. You need both: durable grit and a swing weight high enough to generate brush speed.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Elongated shapes are better for topspin drives off the baseline.</strong>{" "}
        More reach means more swing arc, which means more brush contact at the ball. All five picks above are
        elongated for this reason. If you play primarily kitchen-game spin (roll volleys, spin dinks), a hybrid shape
        can also work — but elongated is the standard for spin-first players.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Twist weight matters more for spin than people realize.</strong>{" "}
        A topspin drive hits the ball slightly off-center by design — you&apos;re brushing past it, not driving through
        the middle. At any off-center contact point, the paddle wants to rotate. Higher twist weight (above 6.0)
        keeps the paddle square and your spin shot on target. Check TW before buying.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for spin?",
      a: "The Holbrook Fuze Vantagrit Elongated is the best dedicated spin paddle — VantaGrit surface with SW 119.71 for the swing leverage to generate elite RPMs. For value, the Enhance Turbo MPP ArmorGrit at $119.99 delivers a premium spin surface at a fraction of the price of most competitors.",
    },
    {
      q: "What surface generates the most spin in pickleball?",
      a: "Engineered grit surfaces like ArmorGrit, VantaGrit, and Space Dust Grit generate more spin than standard raw carbon fiber and maintain that capability longer. The difference is durability — cheap raw carbon might match them initially but wears smooth. If you play 3+ days per week, surface longevity is the metric that matters.",
    },
    {
      q: "Does swing weight affect spin generation?",
      a: "Yes — a higher swing weight gives you more leverage on a brush stroke, which translates to more angular velocity and higher RPMs at the ball. SW 117–121 is the practical spin-player range. Above that, hand speed at the kitchen line starts to suffer. The grit surface still does the actual gripping work; SW amplifies what the surface can do.",
    },
    {
      q: "Is raw carbon fiber or engineered grit better for spin?",
      a: "Engineered grit (ArmorGrit, VantaGrit, Space Dust Grit) generally outperforms standard raw carbon for spin generation and durability. Raw carbon can be premium too (some brands use higher-grade weaves), but the term has become so broadly used that it&apos;s not reliable as a quality signal. Ask specifically about grit durability and surface technology.",
    },
  ],
  relatedGuides: [
    "for-4.5-players",
    "for-competitive-players",
    "raw-carbon-fiber",
    "for-advanced-players",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Spin Players (${currentYear()}) — ArmorGrit & VantaGrit`,
  description:
    "The 5 best pickleball paddles for spin players. Lab-tested grit surfaces — ArmorGrit, VantaGrit, Space Dust Grit — with lab-measured swing weights and discount codes.",
  keywords: [
    "best pickleball paddle for spin",
    "spin pickleball paddle",
    "armorgrit pickleball paddle",
    "raw carbon spin paddle",
    `best spin pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Spin Players (${currentYear()}) — Premium Grit Surfaces`,
    description: "5 spin-optimized paddles ranked by surface quality and swing weight — lab-measured specs and discount codes.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for spin" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Spin (${currentYear()})`, description: "5 spin-optimized paddles with premium grit surfaces." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
