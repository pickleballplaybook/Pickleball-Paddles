import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gearProducts } from "@/data/products";

// Exclude the academy (no image / free) from the scroll
const scrollProducts = gearProducts.filter((p) => p.imageAspect !== "none");

export default function GearScroll() {
  return (
    <section className="py-12" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl">

        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-1">
              Equipment & Accessories
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Shop Gear
            </h2>
          </div>
          <Link
            href="/gear"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-400 transition-colors flex-shrink-0"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Horizontal scroll row */}
        <div
          className="flex gap-4 overflow-x-auto pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {scrollProducts.map((p) => (
            <a
              key={p.id}
              href={p.link}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex-shrink-0 rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:scale-[1.02]"
              style={{
                width: "200px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Image */}
              <div
                className="w-full flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ height: "160px", background: p.bg }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={`${p.brand} ${p.name}`}
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col flex-1">
                {p.badge && (
                  <span
                    className="self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5"
                    style={{
                      background: "rgba(20,184,166,0.12)",
                      color: "#2dd4bf",
                      border: "1px solid rgba(20,184,166,0.3)",
                    }}
                  >
                    {p.badge}
                  </span>
                )}
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500 mb-0.5">
                  {p.brand}
                </p>
                <p className="text-sm font-bold leading-snug mb-1" style={{ color: "var(--text-primary)" }}>
                  {p.name}
                </p>
                {p.price && p.price !== "Free" && (
                  <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{p.price}</p>
                )}
                <div className="mt-auto">
                  <span
                    className="inline-flex items-center justify-center w-full gap-1 text-xs font-bold py-2 rounded-xl text-white"
                    style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)" }}
                  >
                    {p.ctaText}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
