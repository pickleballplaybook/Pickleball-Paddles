import Link from "next/link";
import { Paddle } from "@/types";

interface Props {
  paddle: Paddle;
}

export default function PaddleMiniCard({ paddle }: Props) {
  const hasDiscount = !!paddle.discountLink?.trim();

  return (
    <Link
      href={`/paddles/${paddle.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        background: "var(--flip-bg-card)",
        border: "1px solid var(--flip-card-border)",
      }}
    >
      {/* Paddle image */}
      <div
        className="aspect-square flex items-center justify-center overflow-hidden p-4"
        style={{ background: "var(--bg-section)" }}
      >
        {paddle.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={paddle.image}
            alt={paddle.name}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full rounded-xl" style={{ background: "rgba(90,157,249,0.08)" }} />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <p
          className="text-[9px] font-extrabold uppercase tracking-widest truncate"
          style={{ color: "#5a9df9" }}
        >
          {paddle.brand}
        </p>
        <p
          className="text-xs font-bold leading-snug line-clamp-2"
          style={{ color: "var(--flip-text-head)" }}
        >
          {paddle.name}
        </p>
        {paddle.price && (
          <p className="text-xs font-extrabold tabular-nums mt-0.5" style={{ color: "var(--flip-text-head)" }}>
            {paddle.price}
          </p>
        )}
        <div
          className="mt-2 w-full text-center text-[10px] font-bold py-1.5 rounded-lg transition-colors"
          style={{
            background: hasDiscount ? "rgba(90,157,249,0.15)" : "rgba(255,255,255,0.05)",
            color: hasDiscount ? "#5a9df9" : "var(--flip-text-muted)",
            border: hasDiscount ? "1px solid rgba(90,157,249,0.30)" : "1px solid var(--flip-card-border)",
          }}
        >
          {hasDiscount ? "View Deal" : "View Paddle"}
        </div>
      </div>
    </Link>
  );
}
