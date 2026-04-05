import { ArrowRight } from "lucide-react";

/**
 * PromoBar — reusable horizontal promotional banner.
 *
 * Use for any non-paddle product promotion: ball machines, apps, gear, etc.
 * Configure each instance via props — no edits to this component needed.
 */

export interface PromoBarConfig {
  /** Section heading */
  title: string;
  /** Supporting copy below the title */
  subtitle: string;
  /** CTA button label */
  ctaText: string;
  /** CTA destination URL */
  ctaHref: string;
  /** Open link in new tab (default true for external links) */
  ctaExternal?: boolean;
  /** Optional product image path e.g. "/images/ball%20machines/Titan-Ball-Machine.png" */
  image?: string;
  /** Alt text for the image */
  imageAlt?: string;
  /** Optional badge displayed above the title e.g. "$250 Off" */
  badge?: string;
  /** Fallback icon shown when no image is provided */
  icon?: React.ReactNode;
  /** Section background color (default: dark navy) */
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

  return (
    <section className="py-6" style={{ background: bg }}>
      <div className="container-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Left — image or icon + copy */}
          <div className="flex items-center gap-5">

            {/* Image (when provided) */}
            {image && (
              <div
                className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ background: "rgba(20,184,166,0.1)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={imageAlt ?? title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Icon fallback (when no image) */}
            {!image && icon && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(20,184,166,0.2)", color: "#14b8a6" }}
              >
                {icon}
              </div>
            )}

            {/* Copy */}
            <div>
              {badge && (
                <span
                  className="inline-block mb-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(20,184,166,0.2)",
                    color: "#2dd4bf",
                    border: "1px solid rgba(20,184,166,0.3)",
                  }}
                >
                  {badge}
                </span>
              )}
              <p className="font-extrabold text-white text-sm md:text-base leading-tight tracking-tight">
                {title}
              </p>
              <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right — CTA button */}
          <a
            href={ctaHref}
            {...linkProps}
            className="flex-shrink-0 inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
              color: "#fff",
              boxShadow: "0 0 20px rgba(20,184,166,0.25)",
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
