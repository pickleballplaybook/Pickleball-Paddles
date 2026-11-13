import type { Metadata } from "next";
import { paddles } from "@/data/paddles";
import { siteConfig } from "@/config/site";
import ComparePage from "./ComparePage";

export const metadata: Metadata = {
  title: "Compare Paddles",
  description: "Side-by-side comparison of pickleball paddles. Compare specs, ratings, price, and more.",
  alternates: { canonical: `${siteConfig.siteUrl}/compare` },
};

export default function ComparePageWrapper() {
  return <ComparePage paddles={paddles} />;
}
