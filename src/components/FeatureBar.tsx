import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * FeatureBar — Titan Ball Machine horizontal promotional banner.
 *
 * Image slot: drop a Titan image into /public/images/ and set titanImage below.
 * Set to null to hide the image slot until an image is ready.
 */

// Set to the image path when ready, e.g. "/images/titan-ball-machine.png"
const titanImage: string | null = null;

export default function FeatureBar() {
  return (
    <section
      className="py-6"
      style={{ background: "#163a6a" }}
    >
      <div className="container-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Left — optional image + copy */}
          <div className="flex items-center gap-5">
            {/* Titan image — shown when titanImage is set */}
            {titanImage && (
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden"
                style={{ background: "rgba(10, 100, 188,0.30)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={titanImage}
                  alt="Titan Ball Machine"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Copy */}
            <div>
              <p className="font-extrabold text-white text-sm md:text-base leading-tight tracking-tight">
                Titan Ball Machine
              </p>
              <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                The best training partner.
              </p>
            </div>
          </div>

          {/* Right — CTA */}
          <Link
            href="/categories"
            className="flex-shrink-0 inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
            style={{
              background: "#0a64bc",
              color: "#fff",
            }}
          >
            Learn More
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
