import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "raw-carbon-fiber";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Raw Carbon Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "players seeking raw carbon fiber paddles",
  headline: `Best Raw Carbon Fiber Pickleball Paddles (${currentYear()})`,
  intro:
    "Raw carbon fiber surfaces are unfinished — the carbon weave texture is left exposed rather than sanded smooth, creating a naturally rough surface that grips the ball and generates more spin than painted or laminated faces. The best raw carbon paddles pair this textured face with an engineered grit treatment to add even more RPMs. Every pick below has been reviewed by Austin on-court for spin generation and surface performance.",
  trustSignals: ["Raw Carbon Surfaces", "Lab-Measured Specs", "On-Court Spin Testing", "Discount Codes Included"],
  accent: "#60a5fa",
  picks: [
    {
      slug: "volair-cmd-hyb-hybrid",
      label: "Best Raw Carbon for Aggressive Play",
      why: "Austin reviewed the CMD HYB as S-tier: 'ultimate for aggressive competitive players.' Premium hex grit applied to a raw carbon fiber face — the combination creates elite spin on aggressive swings. The hex pattern licensed from 11 Pickles is one of the best engineered grit surfaces in the game. SW 110.66. 10% off with PLAYBOOK.",
    },
    {
      slug: "bread-and-butter-loco-2-hybrid",
      label: "Best Raw Carbon Overall",
      why: "Space Dust Grit over a raw carbon body — Austin reviewed the Loco 2 as 'arguably the greatest pickleball paddle of all time' with 'elite spin, exceptional power.' The raw carbon base creates maximum surface texture, and the Space Dust Grit adds another layer of spin generation. S-tier across all metrics. $220 with PLAYBOOK.",
    },
    {
      slug: "gearbox-pressure-x-8m-elongated",
      label: "Best Raw Carbon Power",
      why: "Austin: 'power paddle with a massive sweet spot. SpinLock surface for elite spin and control.' SpinLock is Gearbox's engineered surface treatment over the raw carbon fiber face — designed specifically to lock spin onto the ball at contact. SW 116.12 with premium grit durability. $179.99 with PLAYBOOK.",
    },
    {
      slug: "honolulu-j6cr-crystal-blue-elongated",
      seriesSlugs: ["honolulu-j2cr-crystal-blue-hybrid", "honolulu-j6cr-crystal-blue-elongated", "honolulu-j3cr-crystal-blue-widebody"],
      seriesName: "Honolulu Crystal Blue",
      label: "Best Raw Carbon for Durability",
      why: "Crystal Blue Endurance Surface over a raw carbon body — Austin's review: the endurance surface 'actually solves the durable grit problem. Spin holds steady or actually increases RPMs the more you use it.' Raw carbon + endurance surface = the best combination of spin generation and longevity. SW 115.09 elongated shape. 10% off with PLAYBOOK.",
    },
    {
      slug: "enhance-turbo-mpp-armorgrit-elongated",
      label: "Best Budget Raw Carbon",
      why: "ArmorGrit surface over a raw carbon face at $119.99 - $20 with PLAYBOOK = ~$100. Austin reviewed the ArmorGrit as an 'absolute game-changer for the price — elite power, exceptional control, incredible feel. Hits with rocket-like pace, pockets the ball effortlessly.' SW 114.48 at a price that makes raw carbon accessible. Best spec-per-dollar in this category.",
    },
  ],
  buyingGuide: {
    heading: "What raw carbon fiber actually means for your game",
    paragraphs: [
      <p key="0">
        Raw carbon fiber refers to a paddle face where the carbon weave is left textured rather than sanded or
        painted smooth. The exposed weave naturally grips the ball and creates more friction at contact — which
        translates to more spin on serves, groundstrokes, and dinks. Most premium pickleball paddles use raw carbon
        as the base; what differentiates them is the additional grit treatment applied on top.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Grit treatment is the upgrade over bare raw carbon.</strong>{" "}
        Raw carbon alone adds spin, but grit-treated surfaces (SpinLock, Space Dust, ArmorGrit, Crystal Blue) add
        significantly more RPMs. The best raw carbon paddles layer grit over the carbon weave texture for maximum
        spin generation. Every pick above uses an engineered grit surface.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Surface durability varies widely.</strong>{" "}
        Raw carbon grit surfaces wear faster than smooth carbon faces — the texture that creates spin also wears down
        with use. Premium grit treatments (Honolulu Endurance, Gearbox SpinLock) outlast standard grit coatings.
        Casual players lose surface grip after 6–9 months; heavy players may notice sooner with budget grit.
      </p>,
    ],
  },
  faq: [
    {
      q: "What is a raw carbon fiber pickleball paddle?",
      a: "A raw carbon fiber paddle has an unfinished carbon weave face — the texture is left exposed rather than sanded smooth. This natural texture grips the ball and generates more spin than painted or smooth carbon faces. Most premium paddles add an engineered grit treatment on top of the raw carbon for even more RPMs.",
    },
    {
      q: "Do raw carbon fiber paddles generate more spin?",
      a: "Yes — consistently. The exposed carbon weave creates friction at ball contact that generates more RPMs than smooth surfaces. When combined with an engineered grit treatment (SpinLock, Space Dust Grit, ArmorGrit), raw carbon paddles are among the highest-spin options available.",
    },
    {
      q: "What's the best raw carbon fiber pickleball paddle?",
      a: "Austin reviewed the Bread & Butter Loco 2 Hybrid as the best all-around raw carbon paddle — S-tier spin, power, and control. For aggressive play, the Volair CMD HYB. For value, the Enhance Turbo MPP ArmorGrit at ~$100 with PLAYBOOK.",
    },
    {
      q: "Are raw carbon paddles more expensive?",
      a: "Generally yes — raw carbon construction with quality grit treatment is a premium process. Budget raw carbon paddles exist but use lower-quality grit that wears faster. The $119–$220 range on this page covers genuine premium raw carbon from brands Austin has reviewed as delivering lasting quality.",
    },
  ],
  relatedGuides: [
    "thermoformed",
    "for-advanced-players",
    "for-4.0-players",
    "spin",
  ],
};

export const metadata: Metadata = {
  title: `Best Raw Carbon Fiber Pickleball Paddles (${currentYear()}) — Spin Specialists`,
  description:
    "The 5 best raw carbon fiber pickleball paddles in 2026. Exposed carbon weave texture for maximum spin — all on-court reviewed with lab-measured specs.",
  keywords: [
    "best raw carbon fiber pickleball paddle",
    "raw carbon pickleball paddle",
    "best carbon fiber pickleball paddle",
    "high spin pickleball paddle",
    `raw carbon pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Raw Carbon Fiber Pickleball Paddles (${currentYear()})`,
    description: "5 raw carbon fiber paddles ranked for spin generation — on-court reviewed with lab specs.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best raw carbon fiber pickleball paddles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Raw Carbon Fiber Pickleball Paddles (${currentYear()})`, description: "5 raw carbon paddles ranked for spin." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
