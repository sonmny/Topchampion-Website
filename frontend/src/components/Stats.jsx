import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "../i18n/LangContext";
import { useSiteContent } from "../hooks/useSiteContent";

/**
 * AnimatedValue — counts smoothly from 0 to the numeric body of `value`.
 * Robust against stale-closure pitfalls: keeps the latest animation function in a ref
 * and re-runs whenever `value` changes after the element has entered the viewport.
 */
const AnimatedValue = ({ value }) => {
  const str = String(value ?? "");
  const match = str.match(/^([^\d]*)([\d,]+\.?\d*)(.*)$/);
  const target = match ? parseFloat(match[2].replace(/,/g, "")) : 0;
  const hasCommas = !!match && match[2].includes(",");
  const isWhole = target % 1 === 0;
  const prefix = match ? match[1] : "";
  const suffix = match ? match[3] : "";

  const elRef = useRef(null);
  const rafRef = useRef(null);
  const [display, setDisplay] = useState(match ? "0" : str);
  const [inView, setInView] = useState(false);

  // One-shot IntersectionObserver — once visible, set inView = true.
  useEffect(() => {
    if (!elRef.current) return;
    // If IntersectionObserver isn't available (very old browsers / SSR), just play.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(elRef.current);
    return () => obs.disconnect();
  }, []);

  // Whenever the target value changes AND we're already in view, restart the count animation.
  useEffect(() => {
    if (target == null || Number.isNaN(target) || !inView) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const duration = 1600;
    const startTime = performance.now();
    const startVal = 0;
    const fmt = (n) => {
      const numStr = isWhole ? Math.round(n).toString() : n.toFixed(2);
      return hasCommas ? numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : numStr;
    };
    const tick = (now) => {
      const p = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = startVal + (target - startVal) * eased;
      setDisplay(fmt(current));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // NB: `match` (regex result) is a new object every render — exclude it from deps to avoid
    // perpetual reset. `target`, `hasCommas`, and `isWhole` derive from it, so they cover us.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, target, hasCommas, isWhole]);

  if (!match) return <span ref={elRef} data-testid="stat-value-animated">{str}</span>;
  return (
    <span ref={elRef} data-testid="stat-value-animated">
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

export const Stats = () => {
  const { t, lang } = useLang();
  const { data: cmsStats } = useSiteContent("stats");
  const items = Array.isArray(cmsStats) && cmsStats.length > 0
    ? cmsStats.map((s) => ({ value: s.value, label: lang === "cn" ? s.label_cn : s.label_en }))
    : t.stats.items;
  return (
    <section
      data-testid="stats-section"
      className="relative border-b border-white/10 bg-[#0A0A0A]"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 lg:py-20">
        <div className="flex items-center gap-4 mb-10">
          <span className="w-8 h-px bg-[#C9A063]" />
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500">
            {t.stats.label}
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
          {items.map((s, i) => (
            <motion.div
              key={`${s.label}-${i}`}
              data-testid={`stat-${i}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-[#0A0A0A] p-8 lg:p-10 flex flex-col gap-3"
            >
              <div className="font-heading text-5xl lg:text-6xl font-bold tracking-tighter text-[#C9A063]">
                <AnimatedValue value={s.value} />
              </div>
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-zinc-400">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
