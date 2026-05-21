import React from "react";
import { motion } from "framer-motion";
import { useLang } from "../i18n/LangContext";
import { ArrowRight, ChevronDown } from "lucide-react";

const HERO_IMG =
  "https://static.prod-images.emergentagent.com/jobs/a29b9958-b26d-437a-87fb-d84afe93c83d/images/08417e2a11619774401ecc46b837cd0a7ffa841e25dbaea428f808abcbbb2107.png";

export const Hero = () => {
  const { t } = useLang();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative min-h-[100vh] w-full overflow-hidden bg-[#0A0A0A] grain"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMG}
          alt="Industrial automation facility"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
      </div>

      {/* Ambient glows */}
      <motion.div
        className="absolute -left-32 top-1/3 w-[420px] h-[420px] glow-blue pointer-events-none"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 bottom-10 w-[360px] h-[360px] glow-green pointer-events-none"
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Content */}
      <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 pt-40 pb-20 lg:pt-48 lg:pb-32">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="w-10 h-px bg-[#C9A063]" />
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-[#C9A063]">
              {t.hero.overline}
            </span>
          </motion.div>

          <motion.h1
            data-testid="hero-headline"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tighter text-white leading-[1.02] uppercase"
          >
            {t.hero.title_a}{" "}
            <span className="text-[#1A8A52]" style={{ textShadow: "0 0 40px rgba(26,138,82,0.45)" }}>
              {t.hero.title_b}
            </span>{" "}
            <span className="text-zinc-500 font-light italic lowercase">{t.hero.andText}</span>{" "}
            <span className="text-[#D4B179]" style={{ textShadow: "0 0 40px rgba(212,177,121,0.35)" }}>
              {t.hero.title_c}
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 max-w-2xl text-base lg:text-lg text-zinc-400 leading-relaxed"
          >
            {t.hero.sub}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <button
              data-testid="hero-cta-primary"
              onClick={() => scrollTo("contact")}
              className="group inline-flex items-center gap-3 bg-[#0F6B3F] hover:bg-[#0A5230] text-white font-semibold tracking-wide uppercase text-sm px-7 h-14 transition-colors"
            >
              {t.hero.cta_primary}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              data-testid="hero-cta-secondary"
              onClick={() => scrollTo("solutions")}
              className="inline-flex items-center gap-3 border border-white/15 hover:border-[#C9A063] hover:text-[#C9A063] text-white font-semibold tracking-wide uppercase text-sm px-7 h-14 transition-colors bg-white/[0.02]"
            >
              {t.hero.cta_secondary}
            </button>
          </motion.div>

          {/* Quick credibility row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl"
          >
            {[t.hero.stat_lead_a, t.hero.stat_lead_b, t.hero.stat_lead_c].map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border border-white/10 bg-white/[0.02] px-4 py-3"
              >
                <span className="w-2 h-2 bg-[#C9A063] block" />
                <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-zinc-300">
                  {s}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-500"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <ChevronDown size={16} />
      </motion.div>
    </section>
  );
};
