import type { Metadata } from "next";
import { paddles } from "@/data/paddles";
import { readPriceCache } from "@/lib/price-sync";
import PaddlesPage from "./PaddlesPage";

export const metadata: Metadata = {
  title: "All Paddles | Pickleball Playbook",
  description: `Browse all ${paddles.length} pickleball paddles. Filter by brand, shape, price, play style, and more.`,
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
