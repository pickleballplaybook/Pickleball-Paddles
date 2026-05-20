export interface Brand {
  name: string;
  slug: string;
  logo: string;
  description: string;
  founded?: string;
  headquarters?: string;
}

export const brands: Brand[] = [
  { name: "11SIX24", slug: "11six24", logo: "/images/brands/11SIX24-pickleball.png", description: "11SIX24 is one of the most respected independent paddle brands in competitive pickleball, known for premium build quality and power-oriented designs like the Power 2 series." },
  { name: "6.0", slug: "6-0", logo: "/images/brands/6.0-Pickleball.png", description: "SixZero (6.0) delivers well-spec'd all-court paddles at fair prices. Their Coral series offers balanced performance for players who want versatility." },
  { name: "Aireo", slug: "aireo", logo: "/images/brands/Aireo-Pickleball.png", description: "Aireo brings NanoGraph technology to pickleball, producing ultra-lightweight paddles like the Cyclone that prioritize hand speed and maneuverability." },
  { name: "Beyond Measure", slug: "beyond-measure", logo: "/images/brands/Beyond-measure-pickleball.png", description: "Beyond Measure delivers competitive specs at accessible prices. The Ronin series proves you don't need to spend $200+ to get a serious all-court paddle." },
  { name: "Bread & Butter", slug: "bread-and-butter", logo: "/images/brands/Bread-and-Butter-Pickleball-Co.png", description: "Bread & Butter has become one of the most talked-about brands in competitive pickleball. Their Loco series delivers serious power across three shapes." },
  { name: "Chorus", slug: "chorus", logo: "/images/brands/Chorus-Pickleball.png", description: "Chorus Pickleball brings the Coda Harmony Grit series with all-foam power construction available in three shapes for every play style." },
  { name: "CRBN", slug: "crbn", logo: "/images/brands/CRBN-Pickleball.png", description: "CRBN has built a loyal following with innovative TruFoam core technology. Their Barrage series brings proprietary foam construction to power-oriented play." },
  { name: "Engage", slug: "engage", logo: "/images/brands/Engage-Pickleball.png", description: "Engage has been a staple in competitive pickleball for years. Their X2 represents their latest thinking on all-court elongated design." },
  { name: "Enhance", slug: "enhance", logo: "/images/brands/Enhance-Pickleball.png", description: "Enhance Pickleball proves performance doesn't require a premium price. Their Turbo EPP and MPP series deliver genuine foam core performance under $120." },
  { name: "Flik", slug: "flik", logo: "/images/brands/Flik-Pickleball.png", description: "Flik Pickleball innovates with their proprietary Triple Core construction — three-layer core technology that creates a uniquely versatile playing experience." },
  { name: "Friday", slug: "friday", logo: "/images/brands/Friday-Pickleball.png", description: "Friday Pickleball builds a reputation for well-engineered paddles at honest prices. The Aura and Aura Pro deliver control and power without the markup." },
  { name: "Gearbox", slug: "gearbox", logo: "/images/brands/Gearbox-Pickleball.png", description: "Gearbox is known for engineering excellence, with the Pro Ultimate being one of the highest swing-weight paddles in any database. The GBX Power series brings that DNA to an accessible price." },
  { name: "Gherkin", slug: "gherkin", logo: "/images/brands/Gherkin-Pickleball.png", description: "Gherkin offers the Draco in three shapes that actually feel different — genuine shape differentiation with solid specs at $179.99." },
  { name: "Gruvn", slug: "gruvn", logo: "/images/brands/GRUVN-pickleball.png", description: "Gruvn (including the Muvn line) delivers soft, all-court foam core performance at accessible prices. The Lazr-16hd is a favorite among control-oriented players." },
  { name: "Head", slug: "head", logo: "/images/brands/Head-pickleball.png", description: "Head brings decades of racket sport engineering to pickleball. The Radical Pro 15 features a unique 15mm core that fills a gap between control and power." },
  { name: "Honolulu", slug: "honolulu", logo: "/images/brands/Honolulu-Pickleball-Company.png", description: "Honolulu Pickleball brings island spirit and serious specs. Their Crystal Blue Endurance Surface series features a long-lasting textured face across three shapes." },
  { name: "Hudef", slug: "hudef", logo: "/images/brands/Hudef-Pickleball.png", description: "Hudef delivers power-oriented paddles with solid construction quality at competitive prices." },
  { name: "Joola", slug: "joola", logo: "/images/brands/Joola-pickleball.png", description: "Joola is one of the biggest names in racket sports, bringing European engineering pedigree to pickleball. Their Pro V line is used by tour-level professionals." },
  { name: "Joysent", slug: "joysent", logo: "/images/brands/Joysent-Pickleball.png", description: "Joysent offers the Gearfoam Max with a unique foam core construction at an accessible price point for all-court players." },
  { name: "Kobo", slug: "kobo", logo: "/images/brands/Kobo-Pickleball.png", description: "Kobo's Thunder Axe Infinity uses an 18mm core to deliver control so soft it almost feels like cheating — a premium instrument for NVZ specialists." },
  { name: "Luzz", slug: "luzz", logo: "/images/brands/Luzz-Pickleball.png", description: "Luzz makes waves with paddles that pack serious specs at competitive prices. The Inferno and Cannon deliver high swing weights at prices that undercut the competition." },
  { name: "Mint", slug: "mint", logo: "/images/brands/MINT-SPORT-pickleball.png", description: "Mint Sport takes a unique approach with thick-core paddles (18mm and 20mm) that deliver distinctly soft, touch-forward feel profiles." },
  { name: "Rebl", slug: "rebl", logo: "/images/brands/Rebl-Pickleball.png", description: "Rebl enters the market with the Alliance — a hybrid paddle delivering SW 119.22 with TW 6.68, a rare combination of power and stability." },
  { name: "Reload", slug: "reload", logo: "/images/brands/Reload-Pickleball.png", description: "Reload Pickleball brings the RLD 1 with one of the highest swing weights in any hybrid paddle — serious power for players who want to impose their game." },
  { name: "Rev", slug: "rev", logo: "/images/brands/Rev-Pickleball.png", description: "Rev Pickleball delivers high swing-weight power paddles at aggressive prices. The Aria Pro at $99 and Radiance at $169 offer serious specs with 20% off using PLAYBOOK." },
  { name: "RPM", slug: "rpm", logo: "/images/brands/RPM-Pickleball.png", description: "RPM's Q2 exists in two shapes that play almost nothing alike — a SW-107 widebody for control and a SW-120 elongated for power. Know which one you need." },
  { name: "Selkirk", slug: "selkirk", logo: "/images/brands/selkirk-pickleball.png", description: "Selkirk is one of pickleball's most recognized brands. Their Labs Project line pushes engineering boundaries with paddles like the Boomstik and Tesla Plaid." },
  { name: "Speedup", slug: "speedup", logo: "/images/brands/Speedup-Pickleball.png", description: "Speedup enters the foam core market with the Tide series — two shapes, one mission: balanced all-court performance at a price point that's hard to beat." },
  { name: "Thrive", slug: "thrive", logo: "/images/brands/Thrive-Pickleball.png", description: "Thrive Pickleball brings the Ignite Pro Series with a textured 15.5mm face that excels at spin generation for all-court play." },
];

export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find((b) => b.slug === slug);
}

export function getBrandByName(name: string): Brand | undefined {
  return brands.find((b) => b.name === name || b.name.toLowerCase() === name.toLowerCase());
}
