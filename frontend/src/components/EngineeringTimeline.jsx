import React from "react";
import { motion } from "framer-motion";
import { useLang } from "../i18n/LangContext";

export const EngineeringTimeline = () => {
  const { t } = useLang();
  return (
    <section
      id="engineering"
      data-testid="engineering-section"
      className="relative bg-[#0A0A0A] py-24 lg:py-32 border-t border-white/10"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Header column */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-px bg-[#C9A063]" />
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063]">
                {t.engineering.overline}
              </span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter text-white uppercase leading-[1.05] mb-6">
              {t.engineering.title}
            </h2>
            <p className="text-zinc-400 max-w-md">{t.engineering.sub}</p>

            <div className="mt-10 inline-flex items-center gap-3 border border-white/10 px-4 py-3 bg-white/[0.02]">
              <span className="w-2 h-2 bg-[#C9A063] pulse-dot rounded-full" />
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-zinc-300">
                FAT · SAT · 24/7 Support
              </span>
            </div>
          </div>

          {/* Timeline column */}
          <div className="lg:col-span-7 relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-[#0F6B3F] via-[#0F6B3F]/40 to-transparent" />
            <div className="flex flex-col gap-12">
              {t.engineering.steps.map((s, i) => (
                <motion.div
                  key={i}
                  data-testid={`timeline-step-${i}`}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="relative pl-12"
                >
                  <span className="absolute left-0 top-1 w-[31px] h-[31px] flex items-center justify-center">
                    <span className="absolute w-3 h-3 rounded-full bg-[#C9A063] pulse-dot" />
                    <span className="absolute w-[31px] h-[31px] border border-[#C9A063]/30 rounded-full" />
                  </span>

                  <div className="flex items-baseline gap-4 mb-2">
                    <span className="font-mono text-[11px] tracking-[0.25em] text-[#0F6B3F]">
                      {s.k}
                    </span>
                    <h3 className="font-heading text-xl lg:text-2xl font-bold text-white uppercase tracking-tight">
                      {s.t}
                    </h3>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">{s.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
