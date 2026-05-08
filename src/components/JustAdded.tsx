import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Paddle } from "@/types";

interface JustAddedProps {
  paddles: Paddle[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function JustAdded({ paddles }: JustAddedProps) {
  if (!paddles.length) return null;

  return (
    <section className="section-y bg-white">
      <div className="container-xl">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <p className="text-xs font-bold text-brand-500 uppercase tracking-widest">
                Freshly Added
              </p>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Just Added
            </h2>
          </div>
          <Link href="/paddles" className="btn-secondary text-sm hidden sm:inline-flex">
            All Paddles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Horizontal card list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {paddles.map((paddle, i) => (
            <Link
              key={paddle.id}
              href={`/paddles/${paddle.slug}`}
              className="card group p-4 flex flex-col gap-3"
            >
              {/* Image */}
              <div className="relative aspect-square bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center">
                {paddle.image ? (
                  <Image
                    src={paddle.image}
                    alt={paddle.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <svg viewBox="0 0 120 160" fill="none" className="w-14 h-auto opacity-15" aria-hidden="true">
                    <rect x="5" y="5" width="110" height="115" rx="55" fill="#14b8a6" />
                    <rect x="45" y="116" width="30" height="40" rx="15" fill="#0d9488" />
                  </svg>
                )}
                {i === 0 && (
                  <div className="absolute top-2 left-2">
                    <span className="badge badge-green text-[10px]">New</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest mb-0.5">
                  {paddle.brand}
                </p>
                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
                  {paddle.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-slate-800">
                    {paddle.price ?? ""}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Added {formatDate(paddle.addedAt)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 sm:hidden text-center">
          <Link href="/paddles" className="btn-secondary text-sm">
            All Paddles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
