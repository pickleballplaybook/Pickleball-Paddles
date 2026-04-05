import { ArrowRight } from "lucide-react";

export interface PromoBarConfig {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  ctaExternal?: boolean;
  image?: string;
  imageAlt?: string;
  badge?: string;
  icon?: React.ReactNode;
  bg?: string;
}

export default function PromoBar({
  title,
  subtitle,
  ctaText,
  ctaHref,
  ctaExternal = true,
  image,
  imageAlt,
  badge,
  icon,
  bg = "#163a6a",
}: PromoBarConfig) {
  const linkProps = ctaExternal
    ? { target: "_blank", rel: "noopener noreferrer sponsored" }
    : {};

  // ── Image layout: large image-forward feature card ─────────────────────────
  if (image) {
    return (
      <section
        style={{
          background: bg,
          overflow: "hidden",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex flex-col md:flex-row">

          {/* Image panel — 45% width on desktop, full-width + 220px tall on mobile */}
          <div
            className="relative overflow-hidden flex-shrink-0 w-full md:w-[45%] h-[220px] md:h-[380px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={imageAlt ?? title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Right-edge gradient blends image into content — desktop only */}
            <div
              className="absolute inset-y-0 right-0 hidden md:block pointer-events-none"
              style={{
                width: "180px",
                background: `linear-gradient(90deg, transparent 0%, ${bg} 100%)`,
              }}
            />
            {/* Bottom-edge gradient — mobile only */}
            <div
              className="absolute inset-x-0 bottom-0 md:hidden pointer-events-none"
              style={{
                height: "100px",
                background: `linear-gradient(180deg, transparent 0%, ${bg} 100%)`,
              }}
            />
          </div>

          {/* Content panel */}
          <div className="flex-1 flex flex-col justify-center px-8 py-10 md:px-12 md:py-0">
            {badge && (
              <span
                className="self-start inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
                style={{
                  background: "rgba(20,184,166,0.15)",
                  color: "#2dd4bf",
                  border: "1px solid rgba(20,184,166,0.35)",
                  boxShadow: "0 0 10px rgba(20,184,166,0.15)",
                }}
              >
                {badge}
              </span>
            )}

            <p
              className="font-extrabold text-white tracking-tight leading-tight mb-3"
              style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.25rem)" }}
            >
              {title}
            </p>

            <p
              className="text-base leading-relaxed mb-8"
              style={{ color: "rgba(255,255,255,0.62)", maxWidth: "38ch" }}
            >
              {subtitle}
            </p>

            <a
              href={ctaHref}
              {...linkProps}
              className="self-start inline-flex items-center gap-2 font-bold text-sm px-7 py-3.5 rounded-2xl text-white transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                boxShadow: "0 0 32px rgba(20,184,166,0.35), 0 4px 12px rgba(0,0,0,0.25)",
              }}
            >
              {ctaText}
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </a>
          </div>

        </div>
      </section>
    );
  }

  // ── Icon-only layout: taller strip with icon, no tiny thumbnail ────────────
  return (
    <section
      style={{
        background: bg,
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="container-xl">
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ minHeight: "160px", paddingTop: "2.5rem", paddingBottom: "2.5rem" }}
        >
          <div className="flex items-center gap-5">
            {icon && (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(20,184,166,0.2)", color: "#14b8a6" }}
              >
                {icon}
              </div>
            )}
            <div>
              {badge && (
                <span
                  className="inline-block mb-2 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{
                    background: "rgba(20,184,166,0.15)",
                    color: "#2dd4bf",
                    border: "1px solid rgba(20,184,166,0.3)",
                  }}
                >
                  {badge}
                </span>
              )}
              <p className="font-extrabold text-white text-xl md:text-2xl leading-tight tracking-tight">
                {title}
              </p>
              <p className="text-sm md:text-base mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                {subtitle}
              </p>
            </div>
          </div>

          <a
            href={ctaHref}
            {...linkProps}
            className="flex-shrink-0 inline-flex items-center gap-2 font-bold text-sm px-7 py-3.5 rounded-2xl text-white transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
              boxShadow: "0 0 28px rgba(20,184,166,0.3)",
            }}
          >
            {ctaText}
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </section>
  );
}
