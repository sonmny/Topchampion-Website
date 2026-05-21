import React from "react";
import { useLang } from "../i18n/LangContext";

export const TrustBar = () => {
  const { t } = useLang();
  const partners = t.trust.partners;
  const loop = [...partners, ...partners];

  return (
    <section
      data-testid="trust-bar"
      className="relative border-y border-white/10 bg-[#0A0A0A] py-10 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-6 flex items-center gap-4">
        <span className="w-8 h-px bg-[#C9A063]" />
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500">
          {t.trust.label}
        </span>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 pointer-events-none" />

        <div className="marquee-track flex gap-12 whitespace-nowrap">
          {loop.map((p, i) => (
            <div
              key={i}
              data-testid={`partner-${i}`}
              className="flex items-center gap-4 shrink-0 group"
            >
              <span className="font-heading font-bold text-2xl lg:text-3xl tracking-tight uppercase text-zinc-500 group-hover:text-white transition-colors duration-300">
                {p.name}
              </span>
              <span className="hidden md:inline font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-600 border-l border-white/10 pl-4">
                {p.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
