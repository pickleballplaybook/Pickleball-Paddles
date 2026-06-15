// ─────────────────────────────────────────────────────────────────────────────
//  Affiliate admin directory — every paddle brand we earn through, with its
//  affiliate-platform admin URL, commission rate, and any discount offered
//  to our audience. Powers /admin/affiliates (an unlinked admin page).
//
//  IMPORTANT: most of these admin URLs are hosted by shared platforms
//  (Uppromote, Social Snowball, Shopify Collabs) that issue one session
//  cookie per platform domain — so logging into one brand on Uppromote
//  logs you out of every other Uppromote brand in the same browser.
//  The workaround is per-tab cookie isolation: Firefox Multi-Account
//  Containers (right-click → Open in container) or Chrome profiles.
//  /admin/affiliates surfaces that tip in the page header.
// ─────────────────────────────────────────────────────────────────────────────

export type AffiliatePlatform =
  | "Uppromote"
  | "Social Snowball"
  | "Shopify Collabs"
  | "Refersion"
  | "Impact"
  | "Affiliatly"
  | "GoAffPro"
  | "Recomsale"
  | "Direct"
  | "Holbrook";

export interface AffiliateBrand {
  /** Stable slug used as the localStorage key for revenue persistence. */
  id: string;
  /** Display name. */
  name: string;
  /** What the affiliate code gives the customer (e.g. "10% off", "$10 off"). */
  discountOff?: string;
  /** Commission we earn per sale (e.g. "10%", "$20", "25% first 90 → 15%"). */
  commission?: string;
  /** Admin URL. `undefined` when the brand hasn't published one yet. */
  adminUrl?: string;
  /** Which platform hosts the admin — useful for the Container tip and
   *  for grouping brands that share a session cookie. */
  platform?: AffiliatePlatform;
}

// Always kept alphabetical by `name.toLowerCase()` so the on-page list,
// keyboard navigation, and search results match a single canonical order.
export const affiliateBrands: AffiliateBrand[] = [
  { id: "11six24",         name: "11SIX24",        discountOff: "$10 off", commission: "10%",                  adminUrl: "https://af.uppromote.com/11six24-pickleball/dashboard",                                   platform: "Uppromote" },
  { id: "six-zero",        name: "6.0",            discountOff: "10%",     commission: "10%",                  adminUrl: "https://af.uppromote.com/six-zero-usa/login",                                              platform: "Uppromote" },
  { id: "aireo",           name: "Aireo",          discountOff: "15%",     commission: "15%" },
  { id: "battle-paddles",  name: "Battle Paddles",                          commission: "10%",                  adminUrl: "https://af.uppromote.com/battle-paddles/login",                                            platform: "Uppromote" },
  { id: "beyond-measure",  name: "Beyond Measure", discountOff: "10%",     commission: "10%",                  adminUrl: "https://collabs.shopify.com/collab/5891607",                                               platform: "Shopify Collabs" },
  { id: "bread-and-butter",name: "Bread & Butter", discountOff: "10%",     commission: "10%",                  adminUrl: "https://app.impact.com/secure/mediapartner/user-settings-flow.ihtml?execution=e2s1",        platform: "Impact" },
  { id: "crbn",            name: "CRBN",           discountOff: "10% off", commission: "10%",                  adminUrl: "https://affiliates.socialsnowball.io/affiliate/dashboard/home",                            platform: "Social Snowball" },
  { id: "engage",          name: "Engage",         discountOff: "10% off (code PLAYBOOK)", commission: "40%",  adminUrl: "https://www.affiliatly.com/af-106821/affiliate.panel",                                     platform: "Affiliatly" },
  { id: "enhance",         name: "Enhance",        discountOff: "15% off", commission: "15%",                  adminUrl: "https://affiliates.socialsnowball.io/affiliate/dashboard/home",                            platform: "Social Snowball" },
  { id: "flik",            name: "Flik Pickleball",                                                              adminUrl: "https://flikpickleball.goaffpro.com/",                                                     platform: "GoAffPro" },
  { id: "friday",          name: "Friday",         discountOff: "$10 off", commission: "$20",                  adminUrl: "https://www.fridaypickle.com/PLAYBOOK",                                                    platform: "Direct" },
  { id: "gearbox",         name: "Gearbox",        discountOff: "10%",     commission: "20%",                  adminUrl: "https://gearbox.refersion.com/affiliate/login",                                            platform: "Refersion" },
  { id: "gherkin",         name: "Gherkin",                                 commission: "12.5%",                adminUrl: "https://af.uppromote.com/GherkinUSA/login",                                                platform: "Uppromote" },
  { id: "gruvn",           name: "Gruvn",          discountOff: "10%",     commission: "15%",                  adminUrl: "https://af.uppromote.com/gruvn/login",                                                     platform: "Uppromote" },
  { id: "holbrook",        name: "Holbrook",       discountOff: "15% off", commission: "15%",                  adminUrl: "https://ambassadors.holbrookpickleball.com/holbrookpickleball/dashboard",                  platform: "Holbrook" },
  { id: "honolulu",        name: "Honolulu",       discountOff: "10%",     commission: "25%",                  adminUrl: "https://af.uppromote.com/4009c8-2/dashboard",                                              platform: "Uppromote" },
  { id: "hudef",           name: "Hudef",          discountOff: "10%",     commission: "15%",                  adminUrl: "https://af.uppromote.com/hudefsport/login",                                                platform: "Uppromote" },
  { id: "joysent",         name: "Joysent",        discountOff: "10%",     commission: "10%",                  adminUrl: "https://af.uppromote.com/rxs5jd-ah/login",                                                 platform: "Uppromote" },
  { id: "kobo",            name: "Kobo",           discountOff: "15%",     commission: "15%",                  adminUrl: "https://collabs.shopify.com/collab/5927970",                                               platform: "Shopify Collabs" },
  { id: "locker-room",     name: "Locker Room",                                                                  adminUrl: "https://af.uppromote.com/93a2a6-07/login",                                                 platform: "Uppromote" },
  { id: "marlo",           name: "Marlo",          discountOff: "20%",     commission: "15%",                  adminUrl: "https://marlosport.goaffpro.com/login",                                                    platform: "GoAffPro" },
  { id: "mint-sport",      name: "Mint Sport",     discountOff: "15% off", commission: "10%",                  adminUrl: "https://af.uppromote.com/6be4fc-7c/dashboard",                                             platform: "Uppromote" },
  { id: "nox",             name: "Nox Pickleball", discountOff: "10% off", commission: "25% first 90 → 15%",   adminUrl: "https://af.uppromote.com/nox-usa/login",                                                   platform: "Uppromote" },
  { id: "paddletek",       name: "PaddleTek",      discountOff: "10%",     commission: "10%",                  adminUrl: "https://af.uppromote.com/paddletek-2/dashboard",                                           platform: "Uppromote" },
  { id: "pakle",           name: "Pakle",                                                                       adminUrl: "https://paklepickleball.recomsale.com/program",                                            platform: "Recomsale" },
  { id: "pickle-poppers",  name: "Pickle Poppers",                          commission: "10%",                  adminUrl: "https://af.uppromote.com/pdeeqc-bv/login",                                                 platform: "Uppromote" },
  { id: "rpm",             name: "RPM",            discountOff: "15%",     commission: "15%",                  adminUrl: "https://collabs.shopify.com/collab/5947513",                                               platform: "Shopify Collabs" },
  { id: "selkirk",         name: "Selkirk",                                                                     adminUrl: "https://af.uppromote.com/selkirk-sport/login",                                             platform: "Uppromote" },
  { id: "speed-up",        name: "Speed Up",       discountOff: "10%",     commission: "15%",                  adminUrl: "https://af.uppromote.com/speeduppickle/login",                                             platform: "Uppromote" },
  { id: "thrive",          name: "Thrive",         discountOff: "10%",     commission: "10%",                  adminUrl: "https://af.uppromote.com/thrive-pickleball/dashboard",                                     platform: "Uppromote" },
  { id: "volair",          name: "Volair",         discountOff: "10%",     commission: "10%",                  adminUrl: "https://volair.refersion.com/affiliate",                                                   platform: "Refersion" },
];
