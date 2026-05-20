import { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Top 10 Trending Pickleball Paddles This Week | Pickleball Playbook",
  description: "See which pickleball paddles are trending right now. Ranked by views, hearts, and community ratings. Updated weekly with the hottest paddles players are buying.",
  alternates: { canonical: `${siteConfig.siteUrl}/trending` },
  openGraph: {
    title: "Top 10 Trending Pickleball Paddles",
    description: "See which paddles are trending this week — ranked by community engagement.",
    url: `${siteConfig.siteUrl}/trending`,
    type: "website",
    siteName: siteConfig.name,
  },
};

export default function TrendingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
