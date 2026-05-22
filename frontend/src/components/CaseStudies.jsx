import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useLang } from "../i18n/LangContext";
import { Quote } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CaseStudies = () => {
  const { t } = useLang();
  const [liveCases, setLiveCases] = useState(null); // null = loading, [] = none, [...] = live

  useEffect(() => {
    let alive = true;
    axios
      .get(`${API}/cases`)
      .then((r) => {
        if (alive) setLiveCases(r.data || []);
      })
      .catch(() => alive && setLiveCases([]));
    return () => {
      alive = false;
    };
  }, []);

  // Build display list: live cases first, fallback to static if none
  const items =
    liveCases && liveCases.length > 0
      ? liveCases.map((c) => ({
          industry: c.showcase_industry || c.name,
          quote: c.showcase_quote || "",
          author: c.showcase_author || "",
          metric: c.showcase_metric || "",
        }))
      : t.cases.items;

  return (
    <section
      id="cases"
      data-testid="cases-section"
      className="relative bg-[#0A0A0A] py-24 lg:py-32 border-t border-white/10"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-px bg-[#C9A063]" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063]">
              {t.cases.overline}
            </span>
            {liveCases && liveCases.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.25em] uppercase text-[#1A8A52] border border-[#1A8A52]/30 px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A8A52] pulse-dot" />
                LIVE
              </span>
            )}
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter text-white uppercase leading-[1.05] max-w-3xl">
            {t.cases.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10 min-h-[280px]">
          {items.slice(0, 6).map((c, i) => (
            <motion.figure
              key={i}
              data-testid={`case-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-[#0A0A0A] hover:bg-[#101010] p-8 lg:p-10 flex flex-col gap-6 transition-colors duration-300 group min-h-[280px]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500 truncate max-w-[70%]">
                  {c.industry}
                </span>
                <Quote size={20} className="text-[#0F6B3F] opacity-60 shrink-0" />
              </div>
              <blockquote className="font-heading text-base lg:text-lg text-white leading-snug flex-1">
                {c.quote ? `“${c.quote}”` : <span className="text-zinc-600 italic">—</span>}
              </blockquote>
              <figcaption className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-400 truncate">{c.author || ""}</span>
                {c.metric && (
                  <span className="font-mono text-xs tracking-wider text-[#C9A063] uppercase shrink-0">
                    {c.metric}
                  </span>
                )}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
};
