"use client";

import { useEffect } from "react";

// Fires once per mount on the client. Best-effort — swallows errors.
// Server component parent renders it; keepalive lets the request survive
// same-tab navigation, and the null render keeps DOM clean.
export default function LandingViewBeacon({ page }: { page: string }) {
  useEffect(() => {
    try {
      fetch("/api/landing-event", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "view", page }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* noop */
    }
  }, [page]);

  return null;
}
