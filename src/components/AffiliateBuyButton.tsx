"use client";

import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";

interface Props {
  href: string;
  code?: string;            // PLAYBOOK / INF-PLAYBOOK / etc. — undefined for paddles without a code
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  // a11y label that overrides the rendered children when reading the button purpose
  ariaLabel?: string;
}

/**
 * AffiliateBuyButton
 * ------------------
 * Wraps a plain `<a target="_blank">` affiliate link with a clipboard copy +
 * toast on click. Drop-in replacement: takes the same className/style/children
 * the original `<a>` had, so it renders identically.
 *
 * Why: the #1 source of confusion when users land on the brand site is "wait,
 * the discount didn't apply." This component copies the code to the clipboard
 * at the moment of click, then surfaces a fixed-position toast confirming
 * "Code XYZ copied — paste at checkout." Removes the friction without
 * changing the button label or layout.
 *
 * Navigation: the underlying `<a>` still opens the brand site in a new tab
 * the moment it's clicked. The clipboard write is fire-and-forget — if the
 * browser blocks it (rare), the link still works, the user just doesn't get
 * the copied-confirmation toast.
 */
export default function AffiliateBuyButton({
  href,
  code,
  className,
  style,
  children,
  ariaLabel,
}: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up the pending toast timeout if the component unmounts mid-toast
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = () => {
    if (!code) return; // no code → nothing to copy
    if (typeof navigator === "undefined" || !navigator.clipboard) return;

    navigator.clipboard.writeText(code).then(
      () => {
        setToast(code);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setToast(null), 3500);
      },
      () => {
        // Clipboard blocked (e.g. insecure context). Silently fall back —
        // the link still navigates, user just won't see the toast.
      },
    );
  };

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className={className}
        style={style}
        aria-label={ariaLabel}
      >
        {children}
      </a>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            top: "max(80px, env(safe-area-inset-top, 0px) + 80px)",
            background: "#0f172a",
            border: "1px solid rgba(10, 100, 188,0.45)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(10, 100, 188,0.30)",
            maxWidth: "calc(100vw - 24px)",
          }}
        >
          <span
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(10, 100, 188,0.30)" }}
          >
            <Check className="w-4 h-4" style={{ color: "#60a5fa" }} strokeWidth={3} />
          </span>
          <div className="text-sm leading-tight">
            <p className="font-bold" style={{ color: "#f8fafc" }}>
              Code <span style={{ color: "#60a5fa" }}>{toast}</span> copied
            </p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              Paste it at checkout to get this price
            </p>
          </div>
        </div>
      )}
    </>
  );
}
