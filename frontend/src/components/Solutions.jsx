import React from "react";
import { motion } from "framer-motion";
import { useLang } from "../i18n/LangContext";
import { Check, ArrowUpRight } from "lucide-react";

const IMAGES = [
  "https://images.unsplash.com/photo-1774229637247-3cd45219826c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwcm9ib3QlMjBhcm0lMjBtYW51ZmFjdHVyaW5nfGVufDB8fHx8MTc3OTIzODQ4Mnww&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1563456019560-2b37aa7ad890?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBlbGVjdHJpY2FsJTIwY29udHJvbCUyMHBhbmVsJTIwY2FiaW5ldHxlbnwwfHx8fDE3NzkyMzg0ODJ8MA&ixlib=rb-4.1.0&q=85",
  "https://images.pexels.com/photos/17489160/pexels-photo-17489160.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
];

export const Solutions = () => {
  const { t } = useLang();
  return (
    <section
      id="solutions"
      data-testid="solutions-section"
      className="relative bg-[#0A0A0A] py-24 lg:py-32"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-px bg-[#C9A063]" />
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063]">
                {t.solutions.overline}
              </span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter text-white uppercase leading-[1.05]">
              {t.solutions.title}
            </h2>
          </div>
          <p className="text-zinc-400 max-w-md lg:text-right">{t.solutions.sub}</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {t.solutions.items.map((s, i) => (
            <motion.article
              key={i}
              data-testid={`solution-card-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="group bg-[#0A0A0A] hover:bg-[#101010] transition-colors duration-300 flex flex-col"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={IMAGES[i]}
                  alt={s.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
                <span className="absolute top-4 left-4 font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] bg-black/60 backdrop-blur-md px-3 py-1.5 border border-[#C9A063]/30">
                  {s.tag}
                </span>
              </div>

              <div className="p-8 flex flex-col gap-5 flex-1">
                <h3 className="font-heading text-xl lg:text-2xl font-bold text-white leading-tight">
                  {s.name}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
                <ul className="flex flex-col gap-2.5 mt-2 pt-5 border-t border-white/5">
                  {s.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check size={14} className="text-[#C9A063] shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-6">
                  <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase text-zinc-500 group-hover:text-[#C9A063] transition-colors">
                    Learn more
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
