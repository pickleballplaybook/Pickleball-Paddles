import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "best-enhance-paddles";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Enhance Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "Enhance shoppers",
  headline: `Best Enhance Pickleball Paddles (${currentYear()})`,
  intro:
    "Enhance Pickleball makes the most compelling case in pickleball for sub-$120 value: genuine foam core technology (EPP), premium grit surfaces (ArmorGrit), and lab-measured swing weights — all for $99.99–$119.99. At most brands, foam core paddles start at $250. At Enhance, the EPP Hybrid starts at $119.99. Every paddle on this page is under $120, every one has a lab-measured swing weight, and every one uses a technology that would cost twice as much anywhere else.",
  trustSignals: ["EPP & ArmorGrit Technology", "All Under $120", "Lab-Measured Swing Weight", "Discount Codes Included"],
  accent: "#22c55e",
  picks: [
    {
      slug: "enhance-turbo-epp-hybrid",
      label: "Best All-Around Enhance",
      why: "EPP foam core at $119.99 — the Turbo EPP Hybrid is the most arm-friendly, most versatile Enhance paddle. SW 111.74 is light enough for extended sessions without fatigue; TW 6.38 gives you solid off-center stability for a hybrid shape. The EPP core absorbs vibration naturally, making this the best Enhance pick for players with elbow concerns or anyone who wants a soft, planted feel at contact. Code PLAYBOOK.",
    },
    {
      slug: "enhance-turbo-mpp-armorgrit-elongated",
      label: "Best for Spin",
      why: "ArmorGrit is one of the most durable spin surfaces in pickleball — and at $119.99, no other brand puts premium grit this accessible. SW 114.48 with TW 6.45 gives you competitive specs alongside the surface. The MPP ArmorGrit Elongated is the pick for spin-focused players who want a premium grit surface without spending $200+. This is the best spin-surface-per-dollar in any paddle catalog. Code PLAYBOOK.",
    },
    {
      slug: "enhance-turbo-epp-elongated",
      label: "Best Elongated Foam Core",
      why: "SW 115.76 — the highest swing weight of any Enhance EPP paddle, in an elongated shape. Same EPP foam core vibration damping as the hybrid version, but with more reach and higher swing weight for players who prefer a longer frame. TW 6.12. At $119.99, the EPP Elongated is the most cost-effective elongated foam-core paddle available anywhere. Code PLAYBOOK.",
    },
    {
      slug: "enhance-turbo-mpp-elongated",
      label: "Best Balanced Elongated",
      why: "SW 116.06 at $119.99 — the Turbo MPP Elongated is the highest-SW paddle in the entire Enhance lineup. Standard MPP surface (not ArmorGrit) with a more traditional feel than the foam-core EPP builds. For players who want Enhance&apos;s value pricing with a stiffer, more responsive elongated paddle, the MPP Elongated is the pick. TW 6.10. Code PLAYBOOK.",
    },
    {
      slug: "enhance-banger-elongated",
      label: "Best Budget Enhance",
      why: "SW 112.03 at $99.99 — the Banger is the most affordable Enhance paddle and the only one under $100. 14mm core gives a snappier, faster response than the 16mm EPP and MPP builds. TW 6.40. For players who want a budget elongated paddle with a crisper feel and don&apos;t need foam core tech, the Banger at $99.99 with code PLAYBOOK is the most accessible pick.",
    },
  ],
  buyingGuide: {
    heading: "EPP vs MPP vs ArmorGrit — what's different?",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>EPP = foam core. MPP = standard composite core.</strong>{" "}
        The EPP (expanded polypropylene) paddles have a foam core that absorbs vibration and increases dwell
        time for a softer, more planted feel. The MPP paddles use a standard polymer composite core — they feel
        crisper and more responsive. Choose EPP if feel and vibration absorption matter; choose MPP if you
        prefer a traditional paddle response.
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>ArmorGrit is only on the MPP line.</strong>{" "}
        The Turbo MPP ArmorGrit is the only Enhance paddle with ArmorGrit surface — their premium engineered
        grit. The EPP paddles use a different surface. If spin generation is the priority, the MPP ArmorGrit
        is the pick. If vibration damping is the priority, go EPP.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>All Enhance paddles are under $120 — there&apos;s no premium tier.</strong>{" "}
        Unlike Selkirk or Gearbox with tiered pricing from $100 to $450, Enhance keeps everything under $120.
        The &quot;upgrade&quot; within their lineup is about technology preference (EPP vs MPP, ArmorGrit vs standard),
        not price. Every paddle here delivers professional-level technology at a recreational budget.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Best Enhance paddle for elbow pain: Turbo EPP Hybrid.</strong>{" "}
        SW 111.74 (lowest in lineup) + EPP foam core vibration absorption = the most arm-friendly Enhance
        paddle. For players dealing with tennis or pickleball elbow, this is the recommendation. See the{" "}
        <a href="/best-pickleball-paddles/for-elbow-pain" style={{ color: "#22c55e" }}>best paddles for elbow pain guide</a>{" "}
        for more detail.
      </p>,
    ],
  },
  faq: [
    {
      q: "What is the best Enhance pickleball paddle?",
      a: "The Enhance Turbo EPP Hybrid ($119.99) is the best all-around Enhance paddle — EPP foam core, arm-friendly SW 111.74, and solid TW 6.38. For spin-focused players, the Turbo MPP ArmorGrit Elongated delivers the best spin surface in the Enhance lineup at the same price.",
    },
    {
      q: "Is Enhance Pickleball a good brand?",
      a: "Yes — Enhance is the best value story in pickleball. Their EPP foam core and ArmorGrit surface technologies would cost $200–$280 at most other brands. At $119.99, they represent a genuine democratization of premium paddle technology. The specs are accurate and independently verified.",
    },
    {
      q: "What is EPP in Enhance paddles?",
      a: "EPP (expanded polypropylene) is a closed-cell foam used in the Enhance Turbo EPP paddles. It replaces the traditional polymer honeycomb core with a softer foam that absorbs vibration and increases dwell time. This is the same foam technology used in bicycle helmets and automotive bumpers for its impact-absorption properties.",
    },
    {
      q: "What is ArmorGrit in Enhance paddles?",
      a: "ArmorGrit is Enhance's premium engineered grit surface — a textured face designed to maintain spin-generating texture over hundreds of hours of play, unlike standard raw carbon that smooths out. It's on the Turbo MPP ArmorGrit Elongated. At $119.99, it's the most affordable premium grit surface available.",
    },
  ],
  relatedGuides: [
    "foam-core",
    "for-elbow-pain",
    "under-125",
    "for-spin-players",
  ],
};

export const metadata: Metadata = {
  title: `Best Enhance Pickleball Paddles (${currentYear()}) — EPP & ArmorGrit Under $120`,
  description: `The best Enhance pickleball paddles ranked. EPP foam core and ArmorGrit grit surface — all under $120 with lab-measured swing weights and discount codes.`,
  keywords: ["best Enhance pickleball paddle", "Enhance Turbo EPP review", "Enhance ArmorGrit paddle", `best Enhance paddle ${currentYear()}`],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Enhance Pickleball Paddles (${currentYear()})`, description: "5 Enhance paddles ranked — EPP foam core and ArmorGrit, all under $120.", url: PAGE_URL, type: "article", siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best Enhance paddles" }] } : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Enhance Pickleball Paddles (${currentYear()})`, description: "5 Enhance paddles — EPP foam core and ArmorGrit grit, all under $120." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
