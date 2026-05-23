import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLang } from "../i18n/LangContext";
import { useSiteContent } from "../hooks/useSiteContent";

const AnimatedValue = ({ value }) => {
  // Animates trailing number; preserves prefix/suffix like "+", "MW", "%"
  const match = value.match(/^([^\d]*)(\d+\.?\d*)(.*)$/);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(match ? "0" : value);

  useEffect(() => {
    if (!match || !inView) return;
    const target = parseFloat(match[2]);
    const dur = 1400;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const curr = target * eased;
      setDisplay(
        target % 1 === 0 ? Math.round(curr).toString() : curr.toFixed(2)
      );
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, match]);

  if (!match) return <span>{value}</span>;
  return (
    <span ref={ref}>
      {match[1]}
      {display}
      {match[3]}
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
              key={i}
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
