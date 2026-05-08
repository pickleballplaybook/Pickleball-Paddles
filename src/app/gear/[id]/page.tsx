import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { gearProducts } from "@/data/products";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import ViewCounter from "@/components/ViewCounter";

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return gearProducts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = gearProducts.find((p) => p.id === params.id);
  if (!product) return {};
  return {
    title: `${product.brand} ${product.name} | Pickleball Playbook`,
    description: product.subtitle,
  };
}

export default function GearProductPage({ params }: Props) {
  const product = gearProducts.find((p) => p.id === params.id);
  if (!product) notFound();

  return (
    <div className="min-h-screen pt-[156px]" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-10">

        {/* Back nav */}
        <Link
          href="/gear"
          className="inline-flex items-center gap-1.5 text-sm mb-10 transition-colors hover:text-brand-500"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          All Gear
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Image */}
          <div
            className="rounded-3xl overflow-hidden w-full"
            style={{ background: product.bg, aspectRatio: "1/1" }}
          >
            {product.imageAspect !== "none" && product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={`${product.brand} ${product.name}`}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                  No image
                </p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">

            {product.badge && (
              <span
                className="self-start text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
                style={{
                  background: "rgba(20,184,166,0.15)",
                  color: "#2dd4bf",
                  border: "1px solid rgba(20,184,166,0.35)",
                }}
              >
                {product.badge}
              </span>
            )}

            <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">
              {product.brand}
            </p>

            <h1
              className="font-extrabold tracking-tight leading-tight mb-3"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--text-primary)" }}
            >
              {product.name}
            </h1>

            {product.price && product.price !== "Free" && (
              <p className="text-xl font-semibold mb-5" style={{ color: "var(--text-secondary)" }}>
                {product.price}
              </p>
            )}

            <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
              {product.subtitle}
            </p>

            <div className="mb-6">
              <ViewCounter slug={product.id} type="gear" />
            </div>

            {product.features && (
              <pre
                className="text-sm leading-relaxed mb-8 whitespace-pre-wrap font-sans p-5 rounded-2xl"
                style={{
                  color: "var(--text-secondary)",
                  background: "var(--bg-section)",
                  border: "1px solid var(--border)",
                }}
              >
                {product.features}
              </pre>
            )}

            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="self-start inline-flex items-center gap-2 font-bold text-base px-8 py-4 rounded-2xl text-white transition-all duration-200 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                boxShadow: "0 0 32px rgba(20,184,166,0.35), 0 4px 12px rgba(0,0,0,0.25)",
              }}
            >
              {product.ctaText}
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </a>

          </div>
        </div>

        {/* Video review */}
        {product.videoId && (
          <div className="mt-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#14b8a6" }}>
              Video Review
            </p>
            <YouTubeEmbed videoId={product.videoId} title={`${product.brand} ${product.name} Review`} />
          </div>
        )}

      </div>
    </div>
  );
}
