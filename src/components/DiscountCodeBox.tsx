"use client";

import { useState } from "react";
import { Copy, Check, Gift, Tag } from "lucide-react";

interface Props {
  code: string;
  giftCard?: boolean;
  savings?: string;
  compact?: boolean;
}

export default function DiscountCodeBox({ code, giftCard, savings, compact }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (compact) {
    // Subtitle under the code badge — mirrors what big retailers show.
    // Gift card paddles (Selkirk via INF-PLAYBOOK on selkirk.com) get the
    // free-eGift-card line; everything else with a real % or $ discount
    // gets the "$X off at checkout" reinforcement.
    const subtitle = giftCard
      ? "Free eGift Card after purchase"
      : savings
        ? `${savings.replace(/^Save\s*/i, "")} off at checkout`
        : null;

    return (
      <div className="inline-flex flex-col items-end gap-1">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 active:scale-[0.98]"
          style={{
            border: "2px dashed var(--code-border)",
            background: "var(--code-bg)",
          }}
        >
          <span className="font-mono font-extrabold text-sm tracking-widest" style={{ color: "var(--code-text)" }}>
            {code}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: copied ? "#16a34a" : "var(--code-muted)" }}>
            {copied ? (
              <><Check className="w-3.5 h-3.5 inline" strokeWidth={2.5} /> Copied</>
            ) : (
              <><Copy className="w-3.5 h-3.5 inline" strokeWidth={2} /> Copy</>
            )}
          </span>
        </button>
        {subtitle && (
          <p className="text-[11px] font-medium" style={{ color: "var(--flip-text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  if (giftCard) {
    return (
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.22)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "rgba(20,184,166,0.15)" }}
          >
            <Gift className="w-4 h-4" style={{ color: "#14b8a6" }} strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm mb-2" style={{ color: "var(--flip-text-head)" }}>
              Free eGift Card with Purchase
            </p>
            <p className="text-sm mb-3" style={{ color: "var(--flip-text-body)" }}>
              Enter the code below at checkout to receive a free Selkirk eGift Card with your order.
            </p>
            <button
              onClick={handleCopy}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-150 active:scale-[0.98]"
              style={{
                border: "2px dashed var(--code-border)",
                background: "var(--code-bg)",
              }}
            >
              <span className="font-mono font-extrabold text-lg tracking-widest" style={{ color: "var(--code-text)" }}>
                {code}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: copied ? "#16a34a" : "var(--code-text)" }}>
                {copied ? (
                  <><Check className="w-4 h-4" strokeWidth={2.5} /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" strokeWidth={2} /> Click to copy</>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.22)" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(20,184,166,0.15)" }}
        >
          <Tag className="w-4 h-4" style={{ color: "#14b8a6" }} strokeWidth={1.75} />
        </div>
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--flip-text-muted)" }}>
              Discount Code
            </p>
            {savings && (
              <p className="text-sm font-bold" style={{ color: "var(--code-text)" }}>{savings} off</p>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
        style={{
          border: "2px dashed var(--code-border)",
          background: "var(--code-bg)",
        }}
      >
        <span className="font-mono font-extrabold text-xl tracking-widest" style={{ color: "var(--code-text)" }}>
          {code}
        </span>
        <span
          className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
          style={{ color: copied ? "#16a34a" : "var(--code-muted)" }}
        >
          {copied ? (
            <><Check className="w-4 h-4" strokeWidth={2.5} /> Copied!</>
          ) : (
            <><Copy className="w-4 h-4" strokeWidth={2} /> Click to copy</>
          )}
        </span>
      </button>
    </div>
  );
}
