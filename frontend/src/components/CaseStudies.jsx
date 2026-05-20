import React from "react";
import { motion } from "framer-motion";
import { useLang } from "../i18n/LangContext";
import { Quote } from "lucide-react";

export const CaseStudies = () => {
  const { t } = useLang();
  return (
    <section
      id="cases"
      data-testid="cases-section"
      className="relative bg-[#0A0A0A] py-24 lg:py-32 border-t border-white/10"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-px bg-[#00E676]" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#00E676]">
              {t.cases.overline}
            </span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter text-white uppercase leading-[1.05] max-w-3xl">
            {t.cases.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {t.cases.items.map((c, i) => (
            <motion.figure
              key={i}
              data-testid={`case-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-[#0A0A0A] hover:bg-[#101010] p-8 lg:p-10 flex flex-col gap-6 transition-colors duration-300 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">
                  {c.industry}
                </span>
                <Quote size={20} className="text-[#0055A4] opacity-60" />
              </div>
              <blockquote className="font-heading text-lg lg:text-xl text-white leading-snug">
                “{c.quote}”
              </blockquote>
              <figcaption className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-zinc-400">{c.author}</span>
                <span className="font-mono text-xs tracking-wider text-[#00E676] uppercase">
                  {c.metric}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
};
