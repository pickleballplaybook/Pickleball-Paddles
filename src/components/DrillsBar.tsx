import { ArrowRight, Smartphone } from "lucide-react";

/**
 * DrillsBar — Pickleball Drills App horizontal promotional banner.
 * Compact promo bar, same premium style as FeatureBar.
 */
export default function DrillsBar() {
  return (
    <section
      className="py-6"
      style={{ background: "#0c1a2e" }}
    >
      <div className="container-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Left — icon + copy */}
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(20,184,166,0.2)" }}
            >
              <Smartphone className="w-5 h-5" style={{ color: "#14b8a6" }} strokeWidth={2} />
            </div>
            <div>
              <p className="font-extrabold text-white text-sm md:text-base leading-tight tracking-tight">
                Pickleball Drills App
              </p>
              <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                Start your free trial.
              </p>
            </div>
          </div>

          {/* Right — CTA */}
          <a
            href="#"
            className="flex-shrink-0 inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
              color: "#fff",
              boxShadow: "0 0 20px rgba(20,184,166,0.25)",
            }}
          >
            Try It Free
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </section>
  );
}
