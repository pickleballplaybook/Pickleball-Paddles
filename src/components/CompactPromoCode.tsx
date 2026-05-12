"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  code: string;
  savings?: string;
}

export default function CompactPromoCode({ code, savings }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="text-right">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all active:scale-95"
        style={{ border: "1.5px dashed rgba(45,212,191,0.5)", color: "#2dd4bf" }}
      >
        {code}
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
      {savings && (
        <p className="text-[10px] mt-1" style={{ color: "var(--flip-text-muted)" }}>{savings} at checkout</p>
      )}
    </div>
  );
}
