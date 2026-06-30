"use client";

import { useEffect, useState } from "react";

// Client-side formatter so timestamps render in the viewer's local timezone
// instead of the Vercel server's UTC. Server-rendered pre-hydration so
// there's no layout shift — uses the raw ISO string until the effect runs.

type Props = {
  iso: string | null | undefined;
  fallback?: string;
};

export default function LocalDateTime({ iso, fallback = "—" }: Props) {
  const [formatted, setFormatted] = useState<string>(iso ?? fallback);

  useEffect(() => {
    if (!iso) {
      setFormatted(fallback);
      return;
    }
    try {
      const d = new Date(iso);
      setFormatted(
        d.toLocaleString("en-US", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    } catch {
      setFormatted(iso);
    }
  }, [iso, fallback]);

  return <span suppressHydrationWarning>{formatted}</span>;
}
