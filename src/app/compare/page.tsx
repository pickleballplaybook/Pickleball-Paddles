import type { Metadata } from "next";
import { paddles } from "@/data/paddles";
import ComparePage from "./ComparePage";

export const metadata: Metadata = {
  title: "Compare Paddles | Pickleball Playbook",
  description: "Side-by-side comparison of pickleball paddles. Compare specs, ratings, price, and more.",
};

export default function ComparePageWrapper() {
  return <ComparePage paddles={paddles} />;
}
