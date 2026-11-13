import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "under-100";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Budget Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "budget shoppers",
  headline: `Best Pickleball Paddles Under $100 (${currentYear()})`,
  intro:
    "You don't need to spend $200 to play with real gear. These five paddles are all under $100 — either at list price or after applying code PLAYBOOK — and every one has legitimate specs backed by lab measurements. No filler picks, no plastic trash. These are the paddles that deliver actual performance at the price point where most players start.",
  trustSignals: ["All Under $100", "Lab-Measured Specs", "Real Build Quality", "Discount Codes Included"],
  accent: "#4ade80",
  picks: [
    {
      slug: "warping-point-neon-hybrid",
      label: "Best Overall Under $100",
      why: "SW 109.32 with TW 5.93 in a 16mm hybrid at $99.99 — then 10% off with PLAYBOOK brings it to $89.99. The Neon is not a budget paddle that plays like one. It sits in the same swing weight range as paddles costing $200+, has a real carbon fiber face, and a 16mm foam core. The best spec sheet available under $100.",
    },
    {
      slug: "qranc-q18-1-elongated",
      label: "Best Power Under $100",
      why: "SW 118.28, TW 6.92 — at $79.95 list (minus $10 with PLAYBOOK = $69.95), the Q18^1 might be the most absurd spec-per-dollar paddle in our entire database. High swing weight for power, unusually high twist weight (6.92) for an elongated paddle, and a build that plays like a $180 option. If you're a power player on a tight budget, this is the one.",
    },
    {
      slug: "selkirk-amped-s2-widebody",
      label: "Best Widebody Under $100",
      why: "The Selkirk Amped S2 is $100 flat with no code needed — and it's built by one of the most respected paddle companies in pickleball. SW 97.68 makes it the lightest-swinging paddle in our database, and the widebody shape is the most forgiving geometry available. At exactly $100 from Selkirk directly, this is the best brand-name widebody you can buy in this price range.",
    },
    {
      slug: "vatic-pro-v-sol-tour-evergrit-widebody",
      label: "Best for Spin Under $100",
      why: "Vatic Pro's Evergrit surface is one of the better textured faces in this price range — designed to hold spin longer than standard carbon. The widebody shape at SW 107.06 and TW 7.06 is forgiving and stable. At $109 list minus $10 with PLAYBOOK = $99. Best combination of spin surface and forgiveness available under $100.",
    },
    {
      slug: "enhance-turbo-epp-widebody",
      label: "Best Premium-Feel Under $100",
      why: "The Turbo EPP is $119.99 list — but $20 off with PLAYBOOK brings it to $99.99. Real foam-core widebody with TW 7.07 (highly forgiving), 16mm construction, and a build quality that genuinely competes with $150 paddles. Austin reviewed the Turbo EPP line as delivering authentic quality without premium price. The widebody version is the most forgiving of the three shapes.",
    },
  ],
  buyingGuide: {
    heading: "What you actually get under $100 — and what you give up",
    paragraphs: [
      <p key="0">
        At under $100 you can still get: a real carbon fiber face, a 16mm foam or polymer core, and lab-measured specs
        that compete with paddles twice the price. What you give up: premium grit surfaces (like Space Dust or
        ArmorGrit), thermoformed construction, and surface longevity. Budget paddles are real paddles — they just wear
        faster.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Discount codes are real discounts.</strong>{" "}
        Every pick above uses code PLAYBOOK for 10–20% off. The Enhance Turbo EPP goes from $119.99 to $99.99 — a
        genuine 16.7% reduction, not a inflated list price with a fake sale. Apply the code at checkout.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Widebody is the right shape for a budget buy.</strong>{" "}
        If you&apos;re buying a first paddle or a backup paddle under $100, go widebody. The larger sweet spot covers
        more of your mechanics, meaning you get more out of a less-optimized build than with elongated or hybrid.
      </p>,
      <p key="3">
        Ready to step up? See our{" "}
        <a href="/best-pickleball-paddles/under-125" style={{ color: "#4ade80" }}>best paddles under $125</a>{" "}
        — the next price tier adds meaningful spec improvements that are worth the extra $25.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle under $100?",
      a: "The Warping Point Neon at $89.99 after PLAYBOOK is the best all-around spec sheet under $100 — SW 109.32 in a 16mm hybrid build. For power, the Qranc Q18^1 at $69.95 after code is absurd value. For widebody forgiveness, the Selkirk Amped S2 at exactly $100 is the most trusted brand-name option.",
    },
    {
      q: "Is a cheap pickleball paddle worth buying?",
      a: "The paddles on this list aren't 'cheap' in the derogatory sense — they're entry-to-mid-tier paddles with real specs and real builds. Below $50 the quality drops significantly: plastic composites, foam faces, and no real carbon. The picks above are all $70–$100 and deliver genuine performance.",
    },
    {
      q: "Can a beginner use a paddle under $100?",
      a: "Absolutely. The Selkirk Amped S2 ($100) and Enhance Turbo EPP Widebody (~$100 with PLAYBOOK) are both excellent beginner paddles. Widebody shape, 16mm core, real carbon face. You won't need to upgrade until you reach 3.5+ play.",
    },
    {
      q: "Do discount codes for pickleball paddles actually work?",
      a: "Yes — code PLAYBOOK saves 10–20% at most of the brands listed above. The discount is applied at checkout on the brand's direct website. The Enhance discount ($20 off) and Qranc discount ($10 off) are the most significant in this price range.",
    },
  ],
  relatedGuides: [
    "under-125",
    "for-beginners",
    "for-recreational-players",
    "for-3.0-players",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles Under $100 (${currentYear()}) — Real Specs, Real Quality`,
  description:
    "The 5 best pickleball paddles under $100 in 2026 — all with lab-measured specs and real carbon fiber builds. Discount codes bring premium paddles down to this price range.",
  keywords: [
    "best pickleball paddle under 100",
    "best cheap pickleball paddle",
    "pickleball paddle under $100",
    "affordable pickleball paddle",
    `best budget pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles Under $100 (${currentYear()})`,
    description: "5 budget-friendly paddles with real specs — all under $100 after discount codes.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles under $100" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles Under $100 (${currentYear()})`, description: "5 budget paddles with real specs under $100." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
