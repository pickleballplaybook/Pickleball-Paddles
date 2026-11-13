import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
      "/admin",
      "/api",
      "/*?ref=",          // referral tracking params — no unique content
      "/paddles?",        // client-side filter params (?playStyle=, ?q=)
      "/pickleball-101?", // category filter params
    ],
    },
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
  };
}
