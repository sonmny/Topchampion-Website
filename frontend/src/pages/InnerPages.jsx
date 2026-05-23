import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageShell, PageHero, CTABlock } from "../components/PageShell";
import { EngineeringTimeline } from "../components/EngineeringTimeline";
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

  // Build the cert list: prefer CMS, fallback to static i18n
  const certList = Array.isArray(cmsCerts) && cmsCerts.length > 0
    ? cmsCerts.map((c) => ({
        k: c.code,
        t: lang === "cn" ? c.title_cn : c.title_en,
        d: lang === "cn" ? c.description_cn : c.description_en,
      }))
    : p.items;

  // Pick image-bearing certs for the gallery (first 2 from CMS that have images)
  const cmsCertsWithImage = Array.isArray(cmsCerts) ? cmsCerts.filter((c) => c.image_url) : [];
  const certImgFallback = lang === "cn" ? "/assets/certs/iso9001-cn.jpg" : "/assets/certs/iso9001-en.jpg";
  // first cert image: prefer CMS uploaded image, else static fallback
  const firstCertImg = cmsCertsWithImage[0]
    ? `${BACKEND_URL}${cmsCertsWithImage[0].image_url}`
    : certImgFallback;
  const firstCertCode = cmsCertsWithImage[0] ? cmsCertsWithImage[0].code : "ISO 9001:2015";
  const firstCertTitle = cmsCertsWithImage[0]
    ? (lang === "cn" ? cmsCertsWithImage[0].title_cn : cmsCertsWithImage[0].title_en)
    : (lang === "cn" ? "质量管理体系认证 · CQC 签发" : "Quality Management System · CQC");
  return (
    <PageShell>
      <SEO pageKey="certifications" path="/certifications" />
      <PageHero breadcrumb={p.breadcrumb} title={p.title} subtitle={p.subtitle} />

      {/* Real cert thumbnails */}
      <section className="bg-[#070707] py-16 lg:py-20 border-t border-white/5" data-testid="certs-gallery">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-8">
            {lang === "cn" ? "证书原件" : "Certificate originals"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
            <button
              onClick={() => setZoomed(firstCertImg)}
              data-testid="cert-img-iso"
              className="bg-[#0A0A0A] p-6 flex flex-col gap-4 hover:bg-[#101010] transition-colors text-left group"
            >
              <div className="aspect-[1/1.4] bg-white/5 overflow-hidden">
                <img
                  src={firstCertImg}
                  alt={firstCertCode}
                  loading="lazy"
                  className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-1">{firstCertCode}</div>
                <div className="text-sm text-zinc-300">{firstCertTitle}</div>
              </div>
            </button>
            <div className="bg-[#0A0A0A] p-6 flex flex-col gap-4">
              <div className="aspect-[1/1.4] bg-gradient-to-br from-[#0F6B3F]/15 to-[#0A0A0A] border border-[#0F6B3F]/20 flex flex-col items-center justify-center gap-4 text-center p-6">
                <div className="font-heading text-3xl lg:text-4xl font-bold text-[#C9A063] tracking-tight">
                  GR202432006352
                </div>
                <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-400">
                  {lang === "cn" ? "证书编号" : "Certificate No."}
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed max-w-[260px]">
                  {lang === "cn"
                    ? "江苏省科学技术厅、财政厅、税务局共同认定 · 2024 年 11 月 19 日颁发 · 有效期三年"
                    : "Jointly issued by Jiangsu Provincial Department of Science & Technology, Finance, and Taxation · Nov 19, 2024 · valid 3 years"}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-1">
                  {lang === "cn" ? "国家高新技术企业" : "National High-Tech Enterprise"}
                </div>
                <div className="text-sm text-zinc-300">
                  {lang === "cn" ? "2024 年获颁 · 苏州赛冠工业自动化技术有限公司" : "Awarded 2024 · Suzhou Topchampion Industrial Automation Technology Co., Ltd."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="bg-[#0A0A0A] py-20 lg:py-24">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {certList.map((it, i) => (
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
