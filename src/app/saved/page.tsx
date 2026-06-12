"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, ArrowLeft, ArrowRight } from "lucide-react";
import { fetchSavedPaddleIds, useReactions } from "@/hooks/useReactions";
import { paddles } from "@/data/paddles";
import { Paddle } from "@/types";

function SavedCard({ paddle }: { paddle: Paddle }) {
  const { toggle } = useReactions(paddle.id);

  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)" }}
    >
      {/* Image / placeholder */}
      <div
        className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--bg-alt)" }}
      >
        {paddle.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={paddle.image} alt={paddle.name} className="w-12 h-12 object-contain" />
        ) : (
          <svg viewBox="0 0 60 80" fill="none" className="w-7 h-auto opacity-30" aria-hidden>
            <rect x="2" y="2" width="56" height="58" rx="28" fill="#14b8a6" />
            <rect x="22" y="58" width="16" height="20" rx="8" fill="#0d9488" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#14b8a6" }}>
          {paddle.brand}
        </p>
        <Link
          href={`/paddles/${paddle.slug}`}
          className="text-sm font-bold truncate block hover:text-brand-500 transition-colors"
          style={{ color: "var(--text-primary)" }}
        >
          {paddle.name}
        </Link>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {paddle.shape} · {paddle.thickness}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/paddles/${paddle.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:text-brand-500"
          style={{ color: "var(--text-muted)", border: "1px solid var(--card-border)" }}
        >
          View <ArrowRight className="w-3 h-3" />
        </Link>
        <button
          onClick={() => toggle("heart")}
          aria-label="Remove from saved"
          className="p-2 rounded-lg transition-colors"
          style={{ color: "#2dd4bf" }}
        >
          <Bookmark className="w-4 h-4" fill="currentColor" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default function SavedPage() {
  const [savedPaddles, setSavedPaddles] = useState<Paddle[]>([]);
  const [loading, setLoading]           = useState(true);

  async function load() {
    const ids = await fetchSavedPaddleIds();
    setSavedPaddles(paddles.filter((p) => ids.includes(p.id)));
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-12 max-w-2xl">

        <Link
          href="/paddles"
          className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors hover:text-brand-500"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" /> All Paddles
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-5 h-5" style={{ color: "#2dd4bf" }} fill="currentColor" />
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Saved Paddles
          </h1>
          {savedPaddles.length > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(20,184,166,0.10)", color: "#2dd4bf" }}
            >
              {savedPaddles.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--bg-section)" }} />
            ))}
          </div>
        ) : savedPaddles.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark className="w-10 h-10 mx-auto mb-4 opacity-20" style={{ color: "var(--text-muted)" }} />
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Nothing saved yet</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Tap the bookmark on any paddle to save it to your shortlist.
            </p>
            <Link href="/paddles" className="btn-secondary text-sm">
              Browse Paddles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Re-load when a card is un-saved so list updates */
          <div className="flex flex-col gap-3" onClick={load}>
            {savedPaddles.map((p) => (
              <SavedCard key={p.id} paddle={p} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
