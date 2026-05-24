import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageShell, PageHero, CTABlock } from "../components/PageShell";
import { EngineeringTimeline } from "../components/EngineeringTimeline";
import { EngineeringCarousel } from "../components/EngineeringCarousel";
import { CaseStudies } from "../components/CaseStudies";
import { SmartQuoteForm } from "../components/SmartQuoteForm";
import { useLang } from "../i18n/LangContext";
import { pages as P } from "../i18n/pages";
import { SEO } from "../seo/SEO";
import { useSiteContent } from "../hooks/useSiteContent";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const EngineeringPage = () => {
  const { lang } = useLang();
  const p = P[lang].engineering;
  return (
    <PageShell>
      <SEO pageKey="engineering" path="/engineering" />
      <PageHero {...p} />
      <EngineeringTimeline />
      <EngineeringCarousel />
      <CTABlock />
    </PageShell>
  );
};

export const CasesPage = () => {
  const { lang } = useLang();
  const p = P[lang].cases;
  return (
    <PageShell>
      <SEO pageKey="cases" path="/cases" />
      <PageHero {...p} />
      <CaseStudies />
      <CTABlock />
    </PageShell>
  );
};

export const ContactPage = () => {
  const { lang } = useLang();
  const p = P[lang].contact;
  return (
    <PageShell>
      <SEO pageKey="contact" path="/contact" />
      <PageHero {...p} />
      <SmartQuoteForm />
    </PageShell>
  );
};

// Generic content page (about / careers / privacy)
const ContentPage = ({ pageKey }) => {
  const { lang } = useLang();
  const p = P[lang][pageKey];
  // pageKey for SEO matches the seoConfig keys
  const seoKey = pageKey;
  const path = `/${pageKey}`;
  return (
    <PageShell>
      <SEO pageKey={seoKey} path={path} />
      <PageHero breadcrumb={p.breadcrumb} title={p.title} subtitle={p.subtitle} />
      {pageKey === "about" && (
        <section className="bg-[#0A0A0A] pb-12" data-testid="about-hero-image">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12">
            <div className="aspect-[16/7] bg-white/5 overflow-hidden border border-white/10">
              <img
                src="/assets/products/control-cabinet-mcc.jpg"
                alt="Topchampion manufactured low-voltage MCC cabinet"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500 mt-3">
              {lang === "cn"
                ? "昆山赛冠车间 · 出货中的低压电机控制中心(MCC)柜体"
                : "Kunshan Topchampion Factory · LV Motor Control Center (MCC) shipping line"}
            </p>
          </div>
        </section>
      )}
      <section className="bg-[#0A0A0A] py-20 lg:py-24">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 flex flex-col gap-12">
          {p.sections.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="border-l border-[#0F6B3F]/40 pl-6"
            >
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-2">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h2 className="font-heading text-2xl lg:text-3xl font-bold text-white tracking-tight mb-4">{s.h}</h2>
              <p className="text-zinc-400 leading-relaxed">{s.p}</p>
            </motion.div>
          ))}
        </div>
      </section>
      {p.timeline && (
        <section className="bg-[#070707] py-20 lg:py-24 border-t border-white/5" data-testid="about-timeline">
          <div className="max-w-[1100px] mx-auto px-6 md:px-12">
            <div className="flex items-center gap-3 mb-12">
              <span className="w-8 h-px bg-[#C9A063]" />
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063]">
                {lang === "cn" ? "公司发展历程" : "Development History"}
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-white/10" />
              <ol className="flex flex-col gap-10">
                {p.timeline.map((tl, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                    className={`relative flex flex-col md:flex-row md:items-start gap-4 md:gap-12 ${
                      i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                    data-testid={`timeline-${tl.year}`}
                  >
                    <div className="md:w-1/2 flex items-center gap-4 md:justify-end">
                      <span className="font-heading text-3xl md:text-4xl font-bold text-[#C9A063] tracking-tight">
                        {tl.year}
                      </span>
                    </div>
                    <span className="absolute left-[22px] md:left-1/2 top-2 -translate-x-1/2 w-3 h-3 bg-[#0F6B3F] border-2 border-[#0A0A0A] rounded-full z-10" />
                    <div className="md:w-1/2 pl-12 md:pl-0">
                      <h3 className="font-heading text-lg font-bold text-white tracking-tight mb-1">{tl.t}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed max-w-md">{tl.d}</p>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}
      <CTABlock />
    </PageShell>
  );
};

export const AboutPage = () => <ContentPage pageKey="about" />;
export const CareersPage = () => <ContentPage pageKey="careers" />;
export const PrivacyPage = () => <ContentPage pageKey="privacy" />;

export const CertificationsPage = () => {
  const { lang } = useLang();
  const p = P[lang].certifications;
  const [zoomed, setZoomed] = React.useState(null);
  const { data: cmsCerts } = useSiteContent("certifications");

  // Use CMS certs as the authoritative source. Falls back to i18n only if CMS is empty.
  const cmsList = Array.isArray(cmsCerts) ? cmsCerts : [];
  const useCMS = cmsList.length > 0;

  return (
    <PageShell>
      <SEO pageKey="certifications" path="/certifications" />
      <PageHero breadcrumb={p.breadcrumb} title={p.title} subtitle={p.subtitle} />

      {/* Unified certification gallery — every CMS cert rendered, in admin-defined order.
          Cards have identical dimensions; image fills visual area when present, otherwise the
          same area carries the cert code + description text. */}
      {useCMS && (
        <section className="bg-[#070707] py-16 lg:py-20 border-t border-white/5" data-testid="certs-gallery">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-8">
              {lang === "cn" ? "证书与认证" : "Certifications"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
              {cmsList.map((c) => {
                const title = lang === "cn" ? c.title_cn : c.title_en;
                const desc = lang === "cn" ? c.description_cn : c.description_en;
                const imgSrc = c.image_url ? `${BACKEND_URL}${c.image_url}` : null;
                return (
                  <div
                    key={c.id}
                    data-testid={`cert-card-${c.id}`}
                    className="bg-[#0A0A0A] flex flex-col"
                  >
                    {/* Visual area — image OR typographic fallback at identical size */}
                    <button
                      onClick={() => imgSrc && setZoomed(imgSrc)}
                      type="button"
                      className={`aspect-[1/1.25] bg-white/[0.02] overflow-hidden relative flex items-center justify-center p-6 group ${imgSrc ? "cursor-zoom-in hover:bg-white/[0.04]" : "cursor-default"} transition-colors`}
                      data-testid={`cert-img-btn-${c.id}`}
                    >
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={c.code}
                          loading="lazy"
                          className="max-w-full max-h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center gap-4 px-2">
                          <div className="w-14 h-14 border border-[#C9A063]/40 rounded-full flex items-center justify-center">
                            <span className="font-heading text-xs font-bold text-[#C9A063] tracking-tighter">CERT</span>
                          </div>
                          <div className="font-heading text-base lg:text-lg font-bold text-white leading-tight tracking-tight max-w-[260px]">
                            {c.code}
                          </div>
                          <div className="text-[11px] text-zinc-400 leading-relaxed max-w-[300px] line-clamp-6">
                            {desc}
                          </div>
                        </div>
                      )}
                    </button>
                    {/* Caption row — identical structure for image & text cards so heights stay uniform */}
                    <div className="p-5 border-t border-white/5 min-h-[110px] flex flex-col justify-center gap-2">
                      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063]">{c.code}</div>
                      <div className="text-sm text-white font-medium leading-snug line-clamp-2">{title}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Zoom overlay */}
      {zoomed && (
        <div
          onClick={() => setZoomed(null)}
          data-testid="cert-zoom-overlay"
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 lg:p-12 cursor-zoom-out"
        >
          <img src={zoomed} alt="Certificate" className="max-w-full max-h-full object-contain shadow-2xl" />
        </div>
      )}

      {/* Fallback: when CMS is empty, render static i18n cards. */}
      {!useCMS && (
        <section className="bg-[#0A0A0A] py-20 lg:py-24">
          <div className="max-w-[1100px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
            {p.items.map((it, i) => (
              <motion.div
                key={it.k || i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="bg-[#0A0A0A] hover:bg-[#101010] p-8 flex flex-col gap-3 transition-colors"
                data-testid={`cert-${i}`}
              >
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063]">{it.k}</div>
                <h3 className="font-heading text-xl font-bold text-white tracking-tight">{it.t}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{it.d}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
      <CTABlock />
    </PageShell>
  );
};

export const NotFoundPage = () => {
  return (
    <PageShell>
      <SEO pageKey="notFound" path="/404" />
      <section className="bg-[#0A0A0A] py-32 lg:py-44">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 text-center">
          <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#C9A063] mb-5">
            Error · 404
          </div>
          <h1 className="font-heading text-5xl lg:text-7xl font-bold tracking-tighter text-white uppercase mb-6">
            Page not found
          </h1>
          <p className="text-zinc-400 max-w-md mx-auto mb-10">
            The page you are looking for has been moved, renamed, or never existed.
          </p>
          <Link
            to="/"
            data-testid="notfound-home-link"
            className="inline-flex items-center gap-3 bg-[#0F6B3F] hover:bg-[#0A5230] text-white font-semibold tracking-wide uppercase text-sm px-7 h-14 transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </section>
    </PageShell>
  );
};
