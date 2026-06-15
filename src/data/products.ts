export interface GearProduct {
  id: string;
  brand: string;
  name: string;
  price: string;
  badge: string;
  link: string;
  image: string;
  // Optional wide/banner crop — used by PromoBar on the homepage (45%-width
  // image column) and any other banner-style context. Falls back to `image`.
  featuredImage?: string;
  imageAspect: "square" | "wide" | "none";
  subtitle: string;
  features?: string;
  description?: string;
  specs?: { label: string; value: string }[];
  bg: string;
  ctaText: string;
  videoId?: string;
  // Optional non-affiliate product URL for the brand's own customer reviews.
  // Surfaced as a "Read customer reviews" link on the gear detail page so
  // shoppers can see third-party feedback without going through the
  // discount/affiliate URL.
  reviewsUrl?: string;
  // Optional bulleted highlights — rendered as a "Why we love it" card on
  // the gear detail page. Three to six short benefits work best.
  highlights?: string[];
  // Optional FAQ list — rendered as an accordion on the detail page and
  // emitted as FAQPage JSON-LD for SEO.
  faqs?: { q: string; a: string }[];
  // Optional natural-language "best for" line — e.g.
  // "Intermediate players who want better grip feel without changing tack."
  // Rendered as a small callout near the CTA.
  bestFor?: string;
}

// ── All gear / affiliate products ─────────────────────────────────────────────
// imageAspect: "wide" = 16:9, "square" = 1:1, "none" = icon fallback
export const gearProducts: GearProduct[] = [
  {
    id: "titan",
    brand: "Titan",
    name: "Ball Machine",
    price: "$2,299.00",
    badge: "$250 Off",
    link: "https://titanballmachines.com/products/titan-pickleball-machine?sca_ref=5510919.3e3QLH63Ya",
    image: "/images/products/Titan-Ball-Machine.png",
    imageAspect: "square",
    subtitle: "The best training partner. Hit more balls and improve faster — on your own schedule.",
    description: "The Titan One is one of the two best pickleball ball machines on the market right now, and it's the one I personally use. After testing it head-to-head against the Titan Ace, I chose the Titan One because it holds all the balls inside — no separate ball basket needed. You just wheel it out, turn it on, and start drilling.\n\nWhat makes this machine special is the consistency. Most ball machines are 1–2 feet off from shot to shot. The Titan is only about 2–5 inches off — that's a massive difference when you're drilling third-shot drops or resets. And the consistency holds whether you're at 100% battery or 2%.\n\nThe Titan Drills app is where things get really powerful. You can program up to 24 custom drills where each ball goes to a different location — baseline, kitchen, overhead — and control the speed (up to 75 mph), spin, and feed rate (1–10 seconds between balls) for every single ball. The app just got a major update that made it way more user-friendly. You can also download drills from other Titan users via QR code.\n\nIt holds 85 balls internally (or 240 with the add-on hopper), uses a Ryobi-compatible lithium-ion battery that lasts weeks on a single charge, and the machine auto-shuts off between drills to save power. The battery charges separately — no lugging the whole machine inside.\n\nThe 60° oscillation covers the entire court. For almost every drill, you just park the machine at center baseline and it stays there. Delivery typically arrives within 3–5 business days.\n\nAt $2,299 with $250 off through our link, it's a serious investment — but if you want to get better faster without relying on a drilling partner, this is the machine that does it.",
    specs: [
      { label: "Ball Capacity", value: "85 (240 with add-on)" },
      { label: "Max Speed", value: "75 mph" },
      { label: "Oscillation", value: "60°" },
      { label: "Weight", value: "48 lbs (56 lbs with balls)" },
      { label: "Battery", value: "Lithium-ion (Ryobi compatible)" },
      { label: "Battery Life", value: "Multiple weeks per charge" },
      { label: "Feed Rate", value: "1–10 seconds between balls" },
      { label: "Custom Drills", value: "24 via Titan Drills app" },
      { label: "Delivery", value: "3–5 business days" },
    ],
    bg: "#163a6a",
    ctaText: "Get $250 Off",
    videoId: "H7ylk_NQYUQ",
  },
  {
    id: "r4lly",
    brand: "Joola",
    name: "R4LLY Pickleball Court Shoe",
    price: "$129.95",
    badge: "15% Off",
    link: "https://lockerroompickleball.com/products/r4lly?_pos=3&_sid=6232e6191&_ss=r&sca_ref=8334840.yY4rLJi7oU9HDNHD",
    image: "/images/products/Joola-R4LLY-Pickleball-Court-Shoe.png",
    featuredImage: "/images/products/Joola-R4LLY-Pickleball-Court-Shoe-featured.png",
    imageAspect: "square",
    subtitle: "Joola's dedicated pickleball court shoe — built for the lateral movement, quick stops, and explosive starts the kitchen demands.",
    bg: "#1a2942",
    ctaText: "Get Discount",
  },
  {
    id: "tennibot",
    brand: "Tennibot",
    name: "PicklePartner Ball Machine",
    price: "$2,245.00",
    badge: "$100 Off",
    link: "https://tennibot.pxf.io/c/5936621/3798790/46840",
    image: "/images/products/Tennibot-PicklePartner.png",
    imageAspect: "square",
    subtitle: "The smart ball machine built specifically for pickleball. Train smarter, play better.",
    bg: "#0f2437",
    ctaText: "Get Discount",
  },
  {
    id: "redmond",
    brand: "Redmond",
    name: "Re-lyte Electrolytes",
    price: "$45.99",
    badge: "15% Off",
    link: "https://glnk.io/oq72y/pickleballplaybook",
    image: "/images/products/Redmond-Re-lyte.png",
    imageAspect: "square",
    subtitle: "Real salt electrolyte drink mix. Stay hydrated on and off the court.",
    bg: "#0f2a18",
    ctaText: "Get Discount",
  },
  {
    id: "slyce",
    brand: "Slyce",
    name: "Slydr Paddle Weights",
    price: "$29.95",
    badge: "10% Off",
    link: "https://slycesport.com/products/slyce-slydrs%E2%84%A2-adjustable-clamp-on-pickleball-paddle-weights?sca_ref=8895698.m2HnOfUFuL",
    image: "/images/products/Slyce-Slydr.png",
    imageAspect: "wide",
    subtitle: "Adjustable clamp-on paddle weights. Fine-tune your swing weight in seconds.",
    bg: "#1e1040",
    ctaText: "Get Discount",
  },
  {
    id: "vktry",
    brand: "VKTRY",
    name: "Carbon Fiber Insoles",
    price: "$149.00",
    badge: "20% Off",
    link: "https://rstr.co/vktrygear/pickleballplaybook/oja",
    image: "/images/products/VKTRY-Insoles.png",
    imageAspect: "square",
    subtitle: "Carbon fiber insoles that boost performance and reduce fatigue on the court.",
    bg: "#1a0e00",
    ctaText: "Get Discount",
  },
  {
    id: "picklr",
    brand: "",
    name: "Picklr",
    price: "$30.00/mo",
    badge: "15-Day Trial",
    link: "https://tinyurl.com/49fe7ma5",
    image: "/images/products/Picklr.png",
    imageAspect: "wide",
    subtitle: "Find courts, book lessons, and connect with players near you.",
    bg: "#0c1a2e",
    ctaText: "Start Free Trial",
  },
  {
    id: "court-ranger",
    brand: "FORWRD",
    name: "Court Ranger V2",
    price: "$149.00",
    badge: "Free Shipping",
    link: "https://tinyurl.com/ycd55t7h",
    image: "/images/products/Court-Ranger-V2.png",
    imageAspect: "square",
    subtitle: "Premium pickleball footwear engineered for lateral support and court grip.",
    bg: "#0a1e1a",
    ctaText: "Get Free Shipping",
  },
  {
    id: "grips",
    brand: "Pickleball Playbook",
    name: "Pro Tack Over Grips (3 Pack)",
    price: "$9.99",
    badge: "",
    link: "https://amzn.to/3NMhTEl",
    image: "/images/products/Pickleball-Playbook-Pro-Tack-Over-Grips-3-Pack.png",
    imageAspect: "wide",
    subtitle: "The grip we use on every paddle. Exceptional tack, comfort, and durability.",
    bg: "#152510",
    ctaText: "Buy on Amazon",
  },
  {
    id: "vuori",
    brand: "Vuori",
    name: "Pickleball Clothing",
    price: "",
    badge: "",
    link: "https://tidd.ly/48rlDSM",
    image: "/images/products/Vuori-Pickleball-Clothing.png",
    imageAspect: "wide",
    subtitle: "High-performance clothing built for movement. Made for the pickleball court.",
    bg: "#1a1035",
    ctaText: "Shop Now",
  },
  {
    id: "tesla",
    brand: "Tesla",
    name: "Cybertruck",
    price: "$69,990.00",
    badge: "$1,000 Off",
    link: "https://www.tesla.com/cybertruck/design?referral=austin520636&redirect=no#overview",
    image: "/images/products/Tesla-Cybertruck.png",
    imageAspect: "square",
    subtitle: "Because every serious pickleball player needs a seriously serious truck.",
    bg: "#111111",
    ctaText: "Order Now",
  },
  {
    id: "cuurt",
    brand: "Cuurt",
    name: "Muuv Shoes",
    price: "$149.00",
    badge: "10% Off",
    link: "https://cuurt.com/?ref=PLAYBOOK",
    image: "/images/products/Cuurt-Muuv-Shoes.png",
    imageAspect: "wide",
    subtitle: "Court shoes built for natural movement. Designed specifically for the demands of pickleball.",
    features: "CUURT SHOES ARE:\n✓ Wide toe box (natural stability)\n✓ Zero drop (proper alignment)\n✓ Firm cushioning (court protection)\n✓ Mild arch-support (foot strengthening)\n\nCUURT SHOES ARE NOT:\n❌ Narrow fitting\n❌ Heavily cushioned\n❌ Heavy arch-supporting\n❌ Orthopedic/medical",
    bg: "#0f1e2e",
    ctaText: "Get Discount",
  },
  {
    id: "pickle-clips",
    brand: "Pickle Clips",
    name: "Pickle Clips",
    price: "$19.99",
    badge: "",
    link: "https://www.pickleclips.shop?sca_ref=10963780.z20nVKRfLAl1fn",
    image: "/images/products/Pickle-Clips.png",
    imageAspect: "wide",
    subtitle: "The easiest way to keep your paddle secure. Clips onto any bag in seconds.",
    bg: "#111827",
    ctaText: "Shop Now",
  },
  {
    id: "trigger-grip",
    brand: "TriggerGrip",
    name: "Pro",
    price: "$24.99",
    badge: "15% Off",
    link: "https://www.triggergrippro.com/discount/playbook",
    image: "/images/products/Trigger-Grip.png",
    imageAspect: "square",
    subtitle: "Engineered for comfort and control. The grip upgrade serious pickleball players swear by.",
    bg: "#1a0a0a",
    ctaText: "Get Discount",
  },
  {
    id: "ethos-pro-undergrip",
    brand: "Ethos",
    name: "Pro Undergrip",
    price: "",
    badge: "10% Off",
    link: "https://www.ethospickleball.com/discount/PLAYBOOK?redirect=/?sca_ref=11559688.Hf8GGHu0NO",
    image: "/images/products/Ethos-Pro-Undergrip.png",
    // Wide hero crop — used by the homepage PromoBar's 45% image column
    // and any other banner-style context.
    featuredImage: "/images/products/Hero/ethos-pro-undergrip.png",
    imageAspect: "square",
    subtitle: "Tour-quality undergrip from Ethos — built for comfort, tack, and feel on every shot.",
    bg: "#0d1f1f",
    ctaText: "Get 10% Off",
    // Brand's own product page — surfaces their on-site customer reviews
    // without sending the click through the affiliate/discount link.
    reviewsUrl: "https://www.ethospickleball.com/products/pro-undergrip-right-hand-lightweight",
    bestFor: "Players who want a tour-quality grip feel without adding weight or losing tack mid-match.",
    highlights: [
      "Tour-quality tack — holds up through sweat, humidity, and long sessions without going slick.",
      "Ergonomic underlayer designed for natural hand position, reduces wrist fatigue on drives.",
      "Lightweight construction so paddle balance stays where you tuned it.",
      "Hand-specific (right or left) build for a contoured fit that overgrips can't replicate.",
      "Premium materials — clean install, no slippage over time.",
    ],
    faqs: [
      {
        q: "Is this an overgrip or a replacement grip?",
        a: "It's a replacement undergrip — you remove your paddle's stock grip and install the Ethos Pro in its place. You can still add an overgrip on top if you want extra tack or cushion.",
      },
      {
        q: "Will it change the swing weight of my paddle?",
        a: "Marginally. The Ethos Pro Undergrip is engineered to be lightweight so your paddle's balance and swing weight stay close to factory spec. Most players don't feel a difference.",
      },
      {
        q: "Right-hand or left-hand — what's the difference?",
        a: "The grip is contoured to the dominant hand's natural finger and palm position. Pick the version that matches the hand you hold the paddle with for the best feel. Order the opposite if you're left-handed.",
      },
      {
        q: "How long does the tack last?",
        a: "Significantly longer than most stock grips. Most players get several months of regular play before noticing any meaningful drop in tack, depending on humidity and sweat level.",
      },
      {
        q: "Does the 10% discount stack with sales on the Ethos site?",
        a: "Use code PLAYBOOK at checkout — it works on the full Ethos catalog. Sale stacking depends on the brand's current promo rules; PLAYBOOK reliably gets you the 10% on regular-priced items.",
      },
    ],
  },
  {
    id: "academy",
    brand: "Pickleball Playbook Academy",
    name: "FREE 6-Week Program",
    price: "Free",
    badge: "100% Free",
    link: "https://skool.com/pickleballplaybook",
    image: "",
    imageAspect: "none",
    subtitle: "Go from beginner to competitive in 6 structured weeks. Drills, lessons, and community.",
    bg: "#0a1828",
    ctaText: "Join Free",
  },
];
