import React from "react";
import { motion } from "framer-motion";
import { PageShell, PageHero, CTABlock } from "../components/PageShell";
import { EngineeringTimeline } from "../components/EngineeringTimeline";
import { CaseStudies } from "../components/CaseStudies";
import { SmartQuoteForm } from "../components/SmartQuoteForm";
import { useLang } from "../i18n/LangContext";
import { pages as P } from "../i18n/pages";

export const EngineeringPage = () => {
  const { lang } = useLang();
  const p = P[lang].engineering;
  return (
    <PageShell>
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
      <PageHero {...p} />
      <SmartQuoteForm />
    </PageShell>
  );
};

// Generic content page (about / careers / privacy)
const ContentPage = ({ pageKey }) => {
  const { lang } = useLang();
  const p = P[lang][pageKey];
  return (
    <PageShell>
      <PageHero breadcrumb={p.breadcrumb} title={p.title} subtitle={p.subtitle} />
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
  return (
    <PageShell>
      <PageHero breadcrumb={p.breadcrumb} title={p.title} subtitle={p.subtitle} />
      <section className="bg-[#0A0A0A] py-20 lg:py-24">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {p.items.map((it, i) => (
            <motion.div
              key={i}
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
