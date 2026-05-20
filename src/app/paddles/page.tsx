import type { Metadata } from "next";
import { paddles } from "@/data/paddles";
import { readPriceCache } from "@/lib/price-sync";
import { siteConfig } from "@/config/site";
import PaddlesPage from "./PaddlesPage";

export const metadata: Metadata = {
  title: "All Pickleball Paddles — Compare Specs, Prices & Discounts | Pickleball Playbook",
  description: `Browse and compare ${paddles.length}+ pickleball paddles with lab-measured specs. Filter by brand, shape, price, and play style. Every paddle has swing weight, twist weight, and exclusive discount codes.`,
  alternates: { canonical: `${siteConfig.siteUrl}/paddles` },
  openGraph: {
    title: `Browse ${paddles.length}+ Pickleball Paddles — Specs & Discounts`,
    description: "Compare every paddle with lab-measured swing weight, twist weight, and exclusive discount codes.",
    url: `${siteConfig.siteUrl}/paddles`,
    type: "website",
    siteName: siteConfig.name,
  },
};

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Read price cache server-side so the client component never needs
  // to make an API call on initial render.
  const priceCache = readPriceCache();

  // Pass searchParams as a plain record; PaddlesPage reads them on the client
  // via useSearchParams for URL-sync, using these for SSR initial state.
  void searchParams; // consumed via useSearchParams in PaddlesPage

  return <PaddlesPage paddles={paddles} priceCache={priceCache} />;
}
