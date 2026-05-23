import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLang } from "../i18n/LangContext";
import { Check, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

const IMAGES = [
  // Same images mirrored in SolutionsPages.jsx so home + detail look consistent.
  "https://images.pexels.com/photos/3855962/pexels-photo-3855962.jpeg?w=1400", // 自动化设备 — production line
  "/assets/products/switchgear-rittal.jpg",                                     // 高/低压控制柜 — real Rittal cabinet
  "/assets/products/plc-hmi-panel.jpg",                                         // 自控系统硬件集成 — real PLC/HMI panel
  "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1400&q=80",     // 软件开发 — code/SCADA
];

export const Solutions = () => {
  const { t } = useLang();
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    // Inner track has horizontal padding (px-6 md:px-12) so initial scrollLeft is > 0.
    // Use a generous threshold so prev is properly disabled at start.
    setCanPrev(el.scrollLeft > 64);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [t]);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.85, 600);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section id="solutions" data-testid="solutions-section" className="relative bg-[#0A0A0A] py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
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
          <div className="flex items-center gap-6 max-w-md lg:text-right">
            <p className="text-zinc-400 flex-1">{t.solutions.sub}</p>
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <button
                onClick={() => scrollBy(-1)}
                disabled={!canPrev}
                aria-label="Previous"
                data-testid="solutions-prev"
                className="w-11 h-11 flex items-center justify-center border border-white/10 text-zinc-400 hover:text-[#C9A063] hover:border-[#C9A063] disabled:opacity-30 disabled:hover:text-zinc-400 disabled:hover:border-white/10 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollBy(1)}
                disabled={!canNext}
                aria-label="Next"
                data-testid="solutions-next"
                className="w-11 h-11 flex items-center justify-center border border-white/10 text-zinc-400 hover:text-[#C9A063] hover:border-[#C9A063] disabled:opacity-30 disabled:hover:text-zinc-400 disabled:hover:border-white/10 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Cards: horizontal scroll */}
        <div className="relative -mx-6 md:-mx-12">
          {/* Edge fades */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10" />

          <div
            ref={trackRef}
            data-testid="solutions-track"
            className="overflow-x-auto scroll-smooth snap-x snap-mandatory flex gap-px bg-white/10 px-6 md:px-12"
            style={{ scrollbarWidth: "none" }}
          >
            <style>{`.solutions-track-hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
            {t.solutions.items.map((s, i) => (
              <motion.article
                key={i}
                data-testid={`solution-card-${i}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group bg-[#0A0A0A] hover:bg-[#101010] transition-colors duration-300 flex flex-col snap-start shrink-0 w-[85vw] sm:w-[420px] lg:w-[440px] border border-white/0"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={IMAGES[i] || IMAGES[0]}
                    alt={s.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
                  <span className="absolute top-4 left-4 font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] bg-black/60 backdrop-blur-md px-3 py-1.5 border border-[#C9A063]/30">
                    {s.tag}
                  </span>
                </div>

                <div className="p-8 flex flex-col gap-5 flex-1">
                  <h3 className="font-heading text-xl lg:text-2xl font-bold text-white leading-tight min-h-[3em]">
                    {s.name}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed min-h-[5em]">{s.desc}</p>
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

        {/* Mobile-only swipe hint */}
        <div className="lg:hidden mt-6 text-center font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500">
          ← Swipe →
        </div>
      </div>
    </section>
  );
};
