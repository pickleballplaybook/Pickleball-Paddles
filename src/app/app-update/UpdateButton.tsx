"use client";

import { useEffect, useState } from "react";

const IOS_URL = "https://apps.apple.com/us/app/pickleball-drills/id6445845357";
const DESKTOP_URL = "https://pballdrills.app";

export function UpdateButton({ large = false }: { large?: boolean }) {
  const [href, setHref] = useState(DESKTOP_URL);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) setHref(IOS_URL);
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-block",
        background: "linear-gradient(135deg, #3cacae 0%, #239a9c 100%)",
        color: "#000",
        fontWeight: 800,
        fontSize: large ? "17px" : "16px",
        letterSpacing: "0.02em",
        padding: large ? "20px 56px" : "18px 48px",
        borderRadius: "100px",
        textDecoration: "none",
        boxShadow: "0 0 48px rgba(60,172,174,0.22), 0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      Update Your App &rarr;
    </a>
  );
}
