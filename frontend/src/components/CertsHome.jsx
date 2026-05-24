import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, ArrowUpRight } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { useSiteContent } from "../hooks/useSiteContent";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Home-page "Certifications & Compliance" strip.
 * Renders ALL enabled CMS certifications in the configured order. Every tile
 * is the same size: if a cert has an image, the image fills the visual area;
 * otherwise the same area shows code + title + description text. Click any
 * tile to jump to the full /certifications page.
 */
export const CertsHome = () => {
  const { lang } = useLang();
  const { data: certs } = useSiteContent("certifications");

  const items = Array.isArray(certs) ? certs : [];
  if (items.length === 0) return null;

  const labels = lang === "cn"
    ? { overline: "认证与合规", title: "型式试验 · 审计 · 文档化。", cta: "查看全部认证" }
    : { overline: "Certifications & Compliance", title: "Type-tested · Audited · Documented.", cta: "View all certifications" };

  // Use 2 cols on mobile, 4 cols on lg — same as before, but render every item
  const gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <section
      id="compliance"
      data-testid="certs-home-section"
      className="relative bg-[#0A0A0A] py-24 lg:py-32 border-t border-white/10"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-px bg-[#C9A063]" />
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063]">
                {labels.overline}
              </span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter text-white uppercase leading-[1.05]">
              {labels.title}
            </h2>
          </div>
          <Link
            to="/certifications"
            data-testid="certs-home-cta"
            className="group inline-flex items-center gap-2 text-sm text-[#C9A063] hover:text-white font-mono tracking-[0.2em] uppercase transition-colors"
          >
            {labels.cta}
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className={`grid ${gridCols} gap-px bg-white/10 border border-white/10`}>
          {items.map((c, i) => {
            const title = lang === "cn" ? c.title_cn : c.title_en;
            const desc = lang === "cn" ? c.description_cn : c.description_en;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: Math.min(i, 6) * 0.06 }}
                className="bg-[#0A0A0A] hover:bg-[#101010] transition-colors flex flex-col group"
                data-testid={`cert-home-tile-${i}`}
              >
                <Link to="/certifications" className="flex flex-col flex-1">
                  {/* Fixed-aspect visual area: image OR text fallback at same size */}
                  <div className="aspect-[4/3] bg-white/[0.02] overflow-hidden relative flex items-center justify-center p-5">
                    {c.image_url ? (
                      <img
                        src={`${BACKEND_URL}${c.image_url}`}
                        alt={c.code}
                        loading="lazy"
                        className="max-w-full max-h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center gap-3 px-2 w-full h-full">
                        <Award size={32} className="text-[#C9A063]" strokeWidth={1.4} />
                        <div className="font-heading text-sm lg:text-base font-bold text-white leading-tight tracking-tight">
                          {c.code}
                        </div>
                        <div className="text-[10.5px] text-zinc-400 leading-snug line-clamp-5">
                          {desc}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Caption row — same for every card so heights match */}
                  <div className="px-5 py-4 border-t border-white/5 min-h-[88px] flex flex-col justify-center">
                    <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-1 truncate">
                      {c.code}
                    </div>
                    <div className="text-sm text-white font-medium leading-snug line-clamp-2">
                      {title}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
