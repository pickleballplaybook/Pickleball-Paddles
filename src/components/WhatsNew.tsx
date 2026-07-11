import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Star, Play } from "lucide-react";
import { Paddle } from "@/types";

export interface AnnouncementItem {
  tag: "New Arrival" | "Latest Review" | "Deal Alert";
  title: string;
  desc: string;
  href: string;
}

const TAG_META: Record<string, { color: string; icon: React.ReactNode }> = {
  "New Arrival":   { color: "#60a5fa", icon: <Zap  className="w-3.5 h-3.5" /> },
  "Latest Review": { color: "#818cf8", icon: <Play className="w-3.5 h-3.5" /> },
  "Deal Alert":    { color: "#f59e0b", icon: <Star className="w-3.5 h-3.5" /> },
};

export default function WhatsNew({
  announcements,
  justAdded,
}: {
  announcements: AnnouncementItem[];
  justAdded: Paddle[];
}) {
  return (
    <section id="whats-new" className="section-y" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <p className="text-xs font-bold text-brand-500 uppercase tracking-widest">Fresh Drops</p>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              What&apos;s New
            </h2>
            <p className="mt-2 text-base" style={{ color: "var(--text-muted)" }}>
              Latest arrivals, reviews, and deals — updated regularly.
            </p>
          </div>
          <Link href="/paddles" className="btn-secondary text-sm self-start sm:self-auto whitespace-nowrap">
            All Paddles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: announcement feed */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {announcements.length === 0 ? (
              <div className="card p-6 text-center" style={{ boxShadow: "none" }}>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No new updates right now — check back soon.
                </p>
              </div>
            ) : announcements.map((item) => {
              const meta = TAG_META[item.tag] ?? TAG_META["New Arrival"];
              return (
                <Link
                  key={item.tag + item.href}
                  href={item.href}
                  className="card group p-5 flex items-start gap-4 hover:-translate-y-0"
                  style={{ boxShadow: "none" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${meta.color}18`, color: meta.color }}
                  >
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: `${meta.color}18`, color: meta.color }}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <h3
                      className="text-base font-bold leading-snug mb-1 group-hover:text-brand-500 transition-colors"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {item.desc}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-brand-500" />
                </Link>
              );
            })}
          </div>

          {/* Right: Just Added list */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Just Added
              </p>
              <Link href="/paddles" className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                See all
              </Link>
            </div>

            {justAdded.slice(0, 4).map((paddle) => (
              <Link
                key={paddle.id}
                href={`/paddles/${paddle.slug}`}
                className="card group p-4 flex items-center gap-3"
                style={{ boxShadow: "none" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-alt)" }}
                >
                  {paddle.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={paddle.image} alt={paddle.name} className="w-9 h-9 object-contain" />
                  ) : (
                    <svg viewBox="0 0 60 80" fill="none" className="w-6 h-auto opacity-30" aria-hidden="true">
                      <rect x="2" y="2" width="56" height="58" rx="28" fill="#60a5fa" />
                      <rect x="22" y="58" width="16" height="20" rx="8" fill="#11295f" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500 mb-0.5">
                    {paddle.brand}
                  </p>
                  <p
                    className="text-sm font-bold truncate group-hover:text-brand-500 transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {paddle.name}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {paddle.shape} · {paddle.thickness}
                  </p>
                </div>
                {paddle.amountOff && paddle.amountOff !== "$0" && paddle.amountOff !== "" && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0 font-mono"
                    style={{
                      background: "rgba(10, 100, 188,0.30)",
                      color: "#60a5fa",
                      border: "1px solid rgba(10, 100, 188,0.30)",
                    }}
                  >
                    {paddle.amountOff}
                  </span>
                )}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
