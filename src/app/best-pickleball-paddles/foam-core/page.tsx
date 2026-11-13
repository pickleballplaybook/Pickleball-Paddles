import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "foam-core";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Foam Core Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "foam core paddle seekers",
  headline: `Best Foam Core Pickleball Paddles (${currentYear()})`,
  intro:
    "Foam core paddles replace the traditional polymer honeycomb structure with a solid or injected foam filling, fundamentally changing how the paddle handles vibration, dwell time, and feel at contact. The result is a softer, more planted feel compared to standard composites — with natural vibration damping that benefits elbow-pain sufferers and touch players alike. EPP (expanded polypropylene) and TruFoam are the two dominant foam technologies. Both are represented here, along with a full-foam build from GRUVN.",
  trustSignals: ["EPP & TruFoam Technology", "Vibration-Damping Builds", "Lab-Measured Swing Weight", "Discount Codes Included"],
  accent: "#10b981",
  picks: [
    {
      slug: "enhance-turbo-epp-hybrid",
      label: "Best Value Foam Core",
      why: "The Enhance Turbo EPP Hybrid is the most accessible foam-core paddle on the market — EPP technology at $119.99 with code PLAYBOOK applied. SW 111.74 keeps it arm-friendly and maneuverable; TW 6.38 is solid for a hybrid shape. The EPP core absorbs vibration naturally, making it one of the best options for players dealing with tennis or pickleball elbow. The hybrid shape gives you a larger sweet spot than an elongated at a lower swing weight. If you&apos;re new to foam core, start here.",
    },
    {
      slug: "enhance-turbo-epp-elongated",
      label: "Best Elongated Foam Core",
      why: "Same EPP technology, elongated shape — SW 115.76 gives you more reach and a higher swing weight than the hybrid version while keeping the foam-core vibration damping intact. At $119.99, the EPP Elongated is the elongated foam-core paddle that most players should buy before spending $279.99 on a TruFoam. The feel is softer and more planted than any polymer-core paddle at this price point. TW 6.12 is accurate for an elongated build.",
    },
    {
      slug: "crbn-trufoam-barrage-1-elongated",
      label: "Best Premium Foam Core",
      why: "TruFoam is CRBN&apos;s proprietary foam injection system, engineered at a molecular level for consistent feel across the entire hitting surface. SW 117.97 is the highest of the foam-core elongated picks here; 14mm thickness adds a crisper pop than the EPP builds while the foam core counterbalances it with planted contact feel. For players who want foam-core damping with competitive-level swing weight and a premium build, the Barrage 1 is the answer. $279.99 with PLAYBOOK.",
    },
    {
      slug: "crbn-trufoam-genesis-3-elongated",
      label: "Best Foam Core for Touch",
      why: "SW 117.75 — nearly identical to the Barrage 1 — but the Genesis 3 is tuned differently for touch and control at the kitchen line. The TruFoam fill creates a consistent dwell time that lets you hold the ball and direct it, rather than having it bounce off quickly like a stiff composite core. TW 6.26 is solid. If your game is built around kitchen patience and reset accuracy, the Genesis 3 is the foam-core paddle for you. $279.99 with PLAYBOOK.",
    },
    {
      slug: "gruvn-lazr-16hd-hybrid",
      label: "Lightest Full-Foam Build",
      why: "The GRUVN LAZR-16HD is a full-foam core — not injection-filled, but built entirely from foam composite. SW 107.07 is the lowest swing weight on this page, making it the most arm-friendly foam-core option for extended play. TW 6.29 is impressive for a hybrid shape at this swing weight. The foam build damps vibration exceptionally well — it&apos;s the most noticeable difference-from-polymer you&apos;ll feel in this category. $169.00 with PLAYBOOK.",
    },
  ],
  buyingGuide: {
    heading: "How foam core changes the way a paddle plays",
    paragraphs: [
      <p key="0">
        <strong style={{ color: "var(--text-primary)" }}>Foam cores change feel, not just vibration.</strong>{" "}
        The biggest difference between a foam-core and polymer-core paddle isn&apos;t just vibration damping — it&apos;s
        dwell time. A foam-core paddle holds the ball on the face slightly longer before releasing it. This gives you
        more time to direct the ball, which translates to better touch and more consistent placement on soft game
        shots. Players describe it as &quot;more connected&quot; or &quot;more planted.&quot;
      </p>,
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>EPP vs TruFoam — the key difference.</strong>{" "}
        EPP (expanded polypropylene) is a closed-cell foam used widely in automotive and sports applications — it&apos;s
        affordable, lightweight, and consistently soft. TruFoam (CRBN) is a proprietary injection-foam system designed
        for consistency across the hitting surface. EPP is the better value; TruFoam is the more refined performance
        build. GRUVN&apos;s full-foam is a third category entirely, built with the entire core made of foam composite
        rather than injected into a traditional frame.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Foam cores are the best choice for elbow and shoulder pain.</strong>{" "}
        The natural vibration absorption of foam reduces impact shock at contact. Players with tennis elbow or
        chronic shoulder pain frequently report immediate improvement after switching from a polymer-core paddle.
        If you&apos;re dealing with arm pain, see our dedicated{" "}
        <a href="/best-pickleball-paddles/for-elbow-pain" style={{ color: "#10b981" }}>best paddles for elbow pain</a>{" "}
        guide — the Enhance EPP paddles appear on both lists.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>14mm foam-core paddles feel different from 14mm polymer paddles.</strong>{" "}
        Normally, 14mm polymer cores feel snappy and fast — they sacrifice dwell time for pop. A 14mm TruFoam paddle
        (like the Barrage 1) retains the power of 14mm while adding the planted feel of foam. It&apos;s a genuinely
        different combination that doesn&apos;t have a polymer equivalent.
      </p>,
    ],
  },
  faq: [
    {
      q: "What is a foam core pickleball paddle?",
      a: "A foam core paddle replaces the traditional polymer honeycomb core with a foam material — either injected (EPP, TruFoam) or full-foam composite. The result is a softer feel at contact, better vibration damping, and longer dwell time compared to standard composite paddles. EPP and CRBN TruFoam are the two leading technologies.",
    },
    {
      q: "Are foam core paddles better than polymer core paddles?",
      a: "For touch players and anyone with arm pain — yes, often dramatically so. For power-first players who want a snappy, fast response, polymer cores can feel more lively. The best foam-core paddles (CRBN TruFoam builds) narrow the gap significantly by pairing foam with competitive swing weights and premium surfaces.",
    },
    {
      q: "What is EPP in pickleball paddles?",
      a: "EPP stands for expanded polypropylene — a closed-cell foam used in the Enhance Turbo EPP paddles. It's the same material class used in bike helmets and automotive bumpers for its vibration-damping and lightweight properties. In pickleball, it delivers soft, consistent feel at contact with natural impact absorption.",
    },
    {
      q: "What is TruFoam in CRBN paddles?",
      a: "TruFoam is CRBN's proprietary foam injection system, designed to fill the core cavity consistently for uniform feel across the entire hitting surface. Unlike EPP which is a standard foam, TruFoam is engineered specifically for pickleball performance. It pairs well with 14mm build for players who want foam-core feel with competitive pop.",
    },
    {
      q: "Are foam core paddles good for elbow pain?",
      a: "Yes — foam cores are among the best choices for players with tennis elbow or shoulder pain. The foam naturally absorbs impact shock and reduces the vibration transferred to your arm at contact. The Enhance Turbo EPP Hybrid (SW 111.74) is the most arm-friendly foam-core option, combining low swing weight with EPP vibration damping.",
    },
  ],
  relatedGuides: [
    "for-elbow-pain",
    "thermoformed",
    "for-seniors",
    "most-forgiving",
  ],
};

export const metadata: Metadata = {
  title: `Best Foam Core Pickleball Paddles (${currentYear()}) — EPP & TruFoam`,
  description:
    "The 5 best foam core pickleball paddles including EPP and TruFoam builds. Lab-measured swing weights, vibration-damping picks, and discount codes included.",
  keywords: [
    "foam core pickleball paddle",
    "EPP pickleball paddle",
    "TruFoam pickleball paddle",
    "best foam pickleball paddle",
    `foam core pickleball paddle ${currentYear()}`,
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Foam Core Pickleball Paddles (${currentYear()}) — EPP & TruFoam Picks`,
    description: "5 foam-core paddles ranked by technology and performance — EPP, TruFoam, and full-foam builds with discount codes.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best foam core pickleball paddles" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Foam Core Pickleball Paddles (${currentYear()})`, description: "5 foam-core paddles — EPP, TruFoam, and full foam builds." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
