"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  CopyableCode
//  "Code: PLAYBOOK 📋" chip — dashed teal outline (intentionally different
//  from solid-pill discount chips elsewhere in the space), small copy icon
//  that briefly turns into a check after a successful clipboard write.
//  Used on every PaddleCard.
// ─────────────────────────────────────────────────────────────────────────────

export default function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    // Stop the click from bubbling into the surrounding <Link> wrapper —
    // copying the code shouldn't navigate to the paddle page.
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Some browsers gate clipboard access — fall back to a manual select.
      // Rare in practice; we just silently no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy discount code ${code}`}
      title={`Copy ${code}`}
      className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-base font-mono font-bold tracking-wider transition-colors"
      style={{
        background: "transparent",
        border: "1.5px dashed rgba(10, 100, 188,0.55)",
        color: "#60a5fa",
      }}
    >
      <span className="font-sans font-semibold tracking-normal text-base" style={{ color: "rgba(10, 100, 188,0.70)" }}>
        Code:
      </span>
      <span>{code}</span>
      {copied ? (
        <Check className="w-4 h-4 ml-1" strokeWidth={2.5} />
      ) : (
        <Copy className="w-4 h-4 ml-1 opacity-80" strokeWidth={2} />
      )}
    </button>
  );
}
