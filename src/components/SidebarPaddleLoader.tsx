"use client";

import { useState, useEffect } from "react";
import type { Paddle } from "@/types";
import PaddleAdSidebar from "./PaddleAdSidebar";

interface Props {
  candidates: Paddle[];  // all paddles with image + discountLink
  count?: number;
}

export default function SidebarPaddleLoader({ candidates, count = 12 }: Props) {
  const [sorted, setSorted] = useState<Paddle[]>(() =>
    [...candidates]
      .sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0))
      .slice(0, count)
  );

  useEffect(() => {
    fetch("/api/views/weighted?days=30&type=paddle")
      .then((r) => r.json())
      .then((weights: Record<string, number>) => {
        const ranked = [...candidates].sort((a, b) => {
          const wa = weights[a.slug] ?? (a.trendingScore ?? 0) / 1000;
          const wb = weights[b.slug] ?? (b.trendingScore ?? 0) / 1000;
          return wb - wa;
        });
        setSorted(ranked.slice(0, count));
      })
      .catch(() => {/* keep initial sort on error */});
  }, [candidates, count]);

  if (!sorted.length) return null;
  return <PaddleAdSidebar paddles={sorted} showProgress={false} />;
}
