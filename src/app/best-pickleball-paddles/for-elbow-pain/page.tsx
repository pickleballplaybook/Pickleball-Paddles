import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { currentYear } from "@/lib/year";
import { getPaddleBySlug } from "@/data/paddles";
import AudiencePillarView, { AudienceConfig } from "../_components/AudiencePillarView";

const ROUTE = "for-elbow-pain";
const PAGE_URL = `${siteConfig.siteUrl}/best-pickleball-paddles/${ROUTE}`;

const CONFIG: AudienceConfig = {
  routeSlug: ROUTE,
  eyebrow: "Elbow-Friendly Picks · Updated " + new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  audienceShort: "elbow pain",
  headline: `Best Pickleball Paddles for Elbow Pain (${currentYear()})`,
  intro:
    "Pickleball elbow (lateral epicondylitis) is real, and the wrong paddle makes it worse — stiff cores, thin honeycomb, and brittle thermoformed builds all transmit shock straight into your forearm. The picks below all use soft foam construction, thicker cores, and dampening materials that reduce ball-impact vibration. Note: this isn't medical advice — if you have persistent elbow pain, see a sports doctor.",
  trustSignals: ["Soft Foam Cores", "Thick Cushioning", "Vibration Dampening", "Discount Codes Included"],
  accent: "#f59e0b",
  picks: [
    {
      slug: "mint-mon-ami-elongated",
      label: "Best Overall — Maximum Dampening",
      why: "The Mon Ami's 18mm core is the thickest soft-feel construction in the catalog. Plush off the face, almost no harsh feedback on contact — the closest thing to a true elbow-friendly paddle we've found. The high TW (~6.9) also means fewer painful off-center hits.",
    },
    {
      slug: "gruvn-muvn-16-hd-full-foam-hybrid",
      label: "Best Full-Foam Build",
      why: "Full-foam construction absorbs vibration in a way honeycomb and thermoformed paddles can't. The MUVN-16HD's planted, soft-on-contact feel is exactly what an elbow-recovery player needs. Hybrid shape keeps it maneuverable for the kitchen game.",
    },
    {
      slug: "friday-aura-elongated",
      seriesSlugs: ["friday-aura-elongated", "friday-aura-hybrid"],
      seriesName: "Friday Aura",
      label: "Best Soft 16mm",
      why: "Among the softest 16mm cores at any price. The Aura has long dwell time on contact, which translates to less shock through the wrist and elbow. Both shapes work — the hybrid is even gentler on the arm because of its lower swing weight (108).",
    },
    {
      slug: "beyond-measure-ronin-hybrid",
      seriesSlugs: ["beyond-measure-ronin-hybrid", "beyond-measure-ronin-elongated"],
      seriesName: "Beyond Measure Ronin",
      label: "Best Thermoformed (Smoother Feedback)",
      why: "If you've ruled out cheap thermoformed paddles because of harsh feedback, the Ronin is the exception. Its build is on the softer end of thermoformed — much smoother than a typical T700 face. At ~$105 with PLAYBOOK, it's also one of the lower-price elbow-friendly picks.",
    },
    {
      slug: "kobo-thunder-axe-infinity-elongated",
      label: "Best for Touch Players",
      why: "Kobo's 18mm core is engineered for soft, controlled play. If your game is built on placement and you want the paddle to absorb almost all the contact shock, this is the spec. Premium-grade build with a touch-first feel that's exceptionally gentle on the arm.",
    },
  ],
  buyingGuide: {
    heading: "How a paddle causes (or prevents) elbow pain",
    paragraphs: [
      <p key="1">
        <strong style={{ color: "var(--text-primary)" }}>Stiffness transmits shock.</strong> Cheap thermoformed paddles
        with thin honeycomb cores are the worst offenders — they feel powerful but every off-center hit sends vibration
        straight up your arm. Soft foam cores absorb most of that energy before it reaches your wrist.
      </p>,
      <p key="2">
        <strong style={{ color: "var(--text-primary)" }}>Thicker cores cushion better.</strong> 16mm is the minimum for
        elbow-conscious play; 18mm (like the Mon Ami and Kobo Infinity) is even better. 13mm paddles are essentially off
        the table — too lively and stiff for someone managing elbow pain.
      </p>,
      <p key="3">
        <strong style={{ color: "var(--text-primary)" }}>Higher twist weight means fewer painful off-center hits.</strong>{" "}
        Off-center contact is the worst for the elbow because the paddle twists in your hand on impact. A high TW (6.0+)
        reduces that twist and keeps stress off the joint.
      </p>,
      <p key="4">
        <strong style={{ color: "var(--text-primary)" }}>Equally important: grip size and overgrip.</strong> A grip
        that&apos;s too small forces you to squeeze harder, which directly aggravates the elbow. Many players resolve
        elbow pain just by adding an overgrip or two to size up. Try that before assuming you need a new paddle.
      </p>,
      <p key="5">
        See your <a href="/best-pickleball-paddles" style={{ color: "#f59e0b" }}>full best-paddles guide</a>{" "}
        or browse all paddles in our <a href="/paddles" style={{ color: "#f59e0b" }}>paddle database</a> to compare specs directly.
      </p>,
    ],
  },
  faq: [
    {
      q: "What's the best pickleball paddle for elbow pain or tennis elbow?",
      a: "The Mint Mon Ami is the cleanest single pick — its 18mm core is the most cushioned construction in the catalog. The GRUVN MUVN-16HD Full Foam and Friday Aura are also excellent choices for softer feedback at lower price points.",
    },
    {
      q: "Are heavy or light paddles better for elbow pain?",
      a: "Heavier paddles do less work for you (more arm fatigue) but absorb more shock. Lighter paddles are easier to swing but transmit more vibration. The sweet spot for elbow-friendly play is 7.9–8.2 oz with a soft foam core — heavy enough to dampen, light enough to swing without strain.",
    },
    {
      q: "Should I switch from a thermoformed paddle if I have elbow pain?",
      a: "Probably, yes — most cheap thermoformed paddles transmit a lot of impact vibration. Foam-core paddles (like the Mon Ami, MUVN, and Kobo Infinity above) are dramatically friendlier on the joint. Some thermoformed builds are smoother — the Ronin is the exception worth trying.",
    },
    {
      q: "Will a softer paddle make me a worse player?",
      a: "No — many top-level touch players use 18mm soft-core paddles by choice. You lose a small amount of pop off the baseline, but you gain better dwell time, more control at the kitchen, and (for elbow players) the ability to play without pain.",
    },
    {
      q: "Is this medical advice?",
      a: "No. We test and review paddles based on specs, not medical outcomes. If you have persistent elbow pain, see a sports doctor or physical therapist. A paddle change can help, but it's not a substitute for proper diagnosis and treatment.",
    },
  ],
  relatedGuides: [
    "best-pickleball-paddle-for-tennis-elbow",
    "how-to-pick-pickleball-paddle-weight",
    "what-is-a-foam-core-pickleball-paddle",
    "what-is-a-kevlar-pickleball-paddle",
  ],
};

export const metadata: Metadata = {
  title: `Best Pickleball Paddles for Elbow Pain (${currentYear()}) — Tested & Ranked`,
  description:
    "The 5 best pickleball paddles for tennis elbow / arm pain in 2026 — soft foam cores, thicker cushioning, and vibration dampening. Lab-measured specs and discount codes included.",
  keywords: [
    "best pickleball paddle for elbow pain",
    "best pickleball paddle for tennis elbow",
    "soft pickleball paddle",
    "pickleball paddle for arm pain",
    "vibration dampening pickleball paddle",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Best Pickleball Paddles for Elbow Pain (${currentYear()})`,
    description: "5 soft-foam paddles tested for vibration dampening and elbow comfort.",
    url: PAGE_URL,
    type: "article",
    siteName: siteConfig.name,
    ...(getPaddleBySlug(CONFIG.picks[0].slug)?.image
      ? { images: [{ url: `${siteConfig.siteUrl}${getPaddleBySlug(CONFIG.picks[0].slug)?.image}`, alt: "Best pickleball paddles for elbow pain" }] }
      : {}),
  },
  twitter: { card: "summary_large_image", title: `Best Pickleball Paddles for Elbow Pain (${currentYear()})`, description: "5 soft-foam paddles tested for vibration dampening." },
};

export default function Page() {
  return <AudiencePillarView config={CONFIG} />;
}
