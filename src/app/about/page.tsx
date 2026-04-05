import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Target, Heart, Zap } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: `${siteConfig.name} — helping players find the best paddle deals with code ${siteConfig.discountCode}.`,
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-32" style={{ background: "var(--bg-page)" }}>
      <div className="container-xl py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-4">
            Our Story
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            Built for players,
            <br />
            by players.
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed mb-12 max-w-2xl">
            Playbook Pickleball was born out of frustration — too many paddles,
            too little honest information, and no easy way to save money. We
            built the site we wished existed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <Target className="w-5 h-5 text-brand-500" />,
                title: "Our Mission",
                body: "Make it effortless for any pickleball player to find the right paddle and save money doing it.",
              },
              {
                icon: <Heart className="w-5 h-5 text-brand-500" />,
                title: "Our Values",
                body: "Honest reviews, transparent specs, and no hidden agendas — just real information you can trust.",
              },
              {
                icon: <Zap className="w-5 h-5 text-brand-500" />,
                title: "The Code",
                body: "PLAYBOOK works at checkout for every paddle listed. One code, every paddle, every time.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="card p-6">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <Link href="/paddles" className="btn-primary text-base px-8 py-4">
            Start Browsing Paddles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
