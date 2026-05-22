import React from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { PageShell, PageHero, CTABlock } from "../components/PageShell";
import { useLang } from "../i18n/LangContext";
import { pages as P } from "../i18n/pages";
import { SEO } from "../seo/SEO";
import { serviceSchema } from "../seo/seoConfig";

const IMG = {
  "tire-production": "https://images.unsplash.com/photo-1774229637247-3cd45219826c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwcm9ib3QlMjBhcm0lMjBtYW51ZmFjdHVyaW5nfGVufDB8fHx8MTc3OTIzODQ4Mnww&ixlib=rb-4.1.0&q=85",
  "control-cabinets": "/assets/products/cabinet-row-factory.jpg",
  "power-generation": "/assets/products/plc-hmi-panel.jpg",
  "data-center": "/assets/products/switchgear-rittal.jpg",
};

export const SolutionsHub = () => {
  const { lang, t } = useLang();
  const p = P[lang].solutionsHub;
  const slugs = ["tire-production", "control-cabinets", "power-generation", "data-center"];
  return (
    <PageShell>
      <SEO pageKey="solutionsHub" path="/solutions" />
      <PageHero {...p} />
      <section className="bg-[#0A0A0A] py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {slugs.map((slug, i) => {
            const item = P[lang].solutions[slug];
            return (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-[#0A0A0A] hover:bg-[#101010] transition-colors group"
                data-testid={`hub-card-${slug}`}
              >
                <Link to={`/solutions/${slug}`} className="block">
                  <div className="relative h-56 overflow-hidden">
                    <img src={IMG[slug]} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
                  </div>
                  <div className="p-8 flex flex-col gap-4">
                    <h3 className="font-heading text-xl lg:text-2xl font-bold text-white leading-tight">{item.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{item.subtitle}</p>
                    <span className="mt-2 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase text-[#C9A063] group-hover:text-white transition-colors">
                      {t.nav.solutions} →
                      <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
      <CTABlock />
    </PageShell>
  );
};

export const SolutionDetail = ({ slug }) => {
  const { lang, t } = useLang();
  const p = P[lang].solutions[slug];
  if (!p) return <Navigate to="/404" replace />;
  return (
    <PageShell>
      <SEO
        pageKey={`solution.${slug}`}
        path={`/solutions/${slug}`}
        schema={serviceSchema(slug, lang)}
      />
      <PageHero breadcrumb={p.breadcrumb} title={p.title} subtitle={p.subtitle} />
      <section className="bg-[#0A0A0A] py-20 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 flex flex-col gap-12">
            {p.sections.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-3">
                  {String(i + 1).padStart(2, "0")} / Section
                </div>
                <h2 className="font-heading text-2xl lg:text-3xl font-bold text-white tracking-tight mb-4">{s.h}</h2>
                <p className="text-zinc-400 leading-relaxed">{s.p}</p>
              </motion.div>
            ))}
          </div>
          <aside className="lg:col-span-5">
            <div className="border border-white/10 bg-white/[0.02] p-8 sticky top-28">
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-4">Key capabilities</div>
              <ul className="flex flex-col gap-3">
                {p.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-200">
                    <Check size={14} className="text-[#C9A063] shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="mt-8 inline-flex items-center gap-2 bg-[#C9A063] hover:bg-[#B58D4F] text-black font-bold uppercase text-xs tracking-wide px-5 h-11 transition-colors"
                data-testid="detail-cta"
              >
                {t.nav.quote} →
              </Link>
            </div>
          </aside>
        </div>
      </section>
      <CTABlock />
    </PageShell>
  );
};
