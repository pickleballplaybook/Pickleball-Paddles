import { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Pickleball Paddle Discount Codes — Save on Every Brand | Pickleball Playbook",
  description:
    "Use code PLAYBOOK to save on 30+ pickleball paddle brands. Exclusive discount codes for 11SIX24, Selkirk, Joola, CRBN, Bread & Butter, and more. Updated daily.",
  alternates: { canonical: `${siteConfig.siteUrl}/discounts` },
  openGraph: {
    title: "Pickleball Paddle Discount Codes — Save on Every Brand",
    description: "Use code PLAYBOOK at checkout. Exclusive discounts on 30+ brands.",
    url: `${siteConfig.siteUrl}/discounts`,
    type: "website",
    siteName: siteConfig.name,
  },
};

export default function DiscountsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
