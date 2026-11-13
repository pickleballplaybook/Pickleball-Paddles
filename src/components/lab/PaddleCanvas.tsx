"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import — no SSR, only loaded after client-side capability checks pass
const PaddleScene = dynamic(() => import("./PaddleScene"), { ssr: false });

// ── SVG paddle silhouette — reduced-motion / low-power / no-WebGL fallback ───
function PaddlePosterSVG() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      aria-hidden
      style={{ padding: "10%" }}
    >
      <svg
        viewBox="0 0 200 340"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", maxWidth: 260, height: "auto", display: "block" }}
      >
        {/* Handle */}
        <rect
          x="88" y="232" width="24" height="88" rx="8"
          fill="none" stroke="rgba(163,230,53,0.3)" strokeWidth="1.5"
        />
        {/* Butt cap accent */}
        <rect
          x="88" y="312" width="24" height="8" rx="4"
          fill="rgba(163,230,53,0.5)"
        />
        {/* Throat taper */}
        <path
          d="M 88 232 L 60 212 M 112 232 L 140 212"
          fill="none" stroke="rgba(163,230,53,0.2)" strokeWidth="1.5"
        />
        {/* Paddle head */}
        <rect
          x="30" y="12" width="140" height="200" rx="34"
          fill="rgba(163,230,53,0.04)" stroke="rgba(163,230,53,0.3)" strokeWidth="1.5"
        />
        {/* Face center lines */}
        <line x1="100" y1="12"  x2="100" y2="212" stroke="rgba(163,230,53,0.1)"  strokeWidth="0.75" strokeDasharray="4 4" />
        <line x1="30"  y1="112" x2="170" y2="112" stroke="rgba(163,230,53,0.1)"  strokeWidth="0.75" strokeDasharray="4 4" />
        {/* Measurement rings */}
        <circle cx="100" cy="112" r="50"  fill="none" stroke="rgba(163,230,53,0.07)" strokeWidth="0.75" />
        <circle cx="100" cy="112" r="90"  fill="none" stroke="rgba(163,230,53,0.05)" strokeWidth="0.75" />
        {/* Balance point dot */}
        <circle cx="100" cy="112" r="4"   fill="rgba(163,230,53,0.55)" />
        {/* Label */}
        <text
          x="100" y="140"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="8"
          fill="rgba(163,230,53,0.2)"
          letterSpacing="3"
        >
          PLAYBOOK LAB
        </text>
      </svg>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PaddleCanvas() {
  const [show3D, setShow3D] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = typeof navigator !== "undefined" && navigator.hardwareConcurrency < 4;

    // WebGL capability check
    let hasWebGL = false;
    try {
      const testCanvas = document.createElement("canvas");
      hasWebGL = !!(
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl")
      );
    } catch {
      hasWebGL = false;
    }

    setShow3D(!reducedMotion && !lowPower && hasWebGL);
    setChecked(true);
  }, []);

  // Show poster while checking or when 3D is not available
  if (!checked || !show3D) {
    return (
      <div
        className="w-full h-full"
        role="img"
        aria-label="Pickleball paddle diagram, decorative"
      >
        <PaddlePosterSVG />
      </div>
    );
  }

  return (
    <div
      className="w-full h-full"
      role="img"
      aria-label="3D rotating pickleball paddle, decorative"
    >
      <PaddleScene />
    </div>
  );
}
