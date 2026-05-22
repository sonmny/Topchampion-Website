import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight } from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useLang } from "../i18n/LangContext";

export const PageShell = ({ children }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  return (
    <div className="App relative bg-[#0A0A0A] text-white min-h-screen" data-testid="inner-page-root">
      <Navbar />
      <main className="pt-[72px] lg:pt-[88px]">{children}</main>
      <Footer />
    </div>
  );
};

export const PageHero = ({ breadcrumb = [], title, subtitle }) => (
  <section className="relative bg-[#0A0A0A] border-b border-white/10 overflow-hidden">
    <div className="absolute -right-32 -top-20 w-[420px] h-[420px] glow-blue pointer-events-none" />
    <div className="absolute -left-20 bottom-0 w-[300px] h-[300px] glow-green pointer-events-none opacity-60" />
    <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 py-20 lg:py-28">
      <nav className="flex items-center gap-2 mb-8 font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500" data-testid="breadcrumb">
        {breadcrumb.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={12} className="opacity-50" />}
            <span className={i === breadcrumb.length - 1 ? "text-[#C9A063]" : ""}>{b}</span>
          </React.Fragment>
        ))}
      </nav>
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-white uppercase leading-[1.02] max-w-4xl"
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 max-w-2xl text-base lg:text-lg text-zinc-400 leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  </section>
);

export const CTABlock = () => {
  const { t } = useLang();
  return (
    <section className="bg-[#0A0A0A] border-t border-white/10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-20 lg:py-24 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-3">
            {t.quote.cta_overline}
          </div>
          <h3 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white uppercase tracking-tight max-w-xl leading-tight">
            {t.quote.title}
          </h3>
        </div>
        <Link
          to="/contact"
          data-testid="cta-block-link"
          className="group inline-flex items-center gap-3 bg-[#0F6B3F] hover:bg-[#0A5230] text-white font-semibold tracking-wide uppercase text-sm px-7 h-14 transition-colors shrink-0"
        >
          {t.nav.quote}
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
};
