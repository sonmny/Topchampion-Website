import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n/LangContext";
import { Linkedin, Twitter, Youtube, Github, MapPin, Mail, Phone } from "lucide-react";

export const Footer = () => {
  const { t } = useLang();

  const solutionLinks = [
    { label: t.footer.links.solutions[0], to: "/solutions/tire-production" },
    { label: t.footer.links.solutions[1], to: "/solutions/control-cabinets" },
    { label: t.footer.links.solutions[2], to: "/solutions/power-generation" },
    { label: t.footer.links.solutions[3], to: "/solutions/data-center" },
  ];
  const companyLinks = [
    { label: t.footer.links.company[0], to: "/about" },
    { label: t.footer.links.company[1], to: "/engineering" },
    { label: t.footer.links.company[2], to: "/careers" },
    { label: t.footer.links.company[3], to: "/contact" },
  ];
  const legalLinks = [
    { label: t.footer.links.legal[0], to: "/certifications" },
    { label: t.footer.links.legal[1], to: "/certifications" },
    { label: t.footer.links.legal[2], to: "/certifications" },
    { label: t.footer.links.legal[3], to: "/certifications" },
    { label: t.footer.links.legal[4], to: "/privacy" },
  ];
  const columns = [
    { title: t.footer.sections.solutions, items: solutionLinks },
    { title: t.footer.sections.company, items: companyLinks },
    { title: t.footer.sections.legal, items: legalLinks },
  ];

  return (
    <footer
      data-testid="site-footer"
      className="relative bg-[#070707] border-t border-white/10 pt-20 pb-10"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Topchampion logo"
                className="w-14 h-14 object-contain"
              />
              <div>
                <div className="font-heading font-bold text-white text-lg tracking-tight">
                  苏州赛冠 电气 &amp; 自动化
                </div>
                <div className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase mt-1">
                  Topchampion Electric &amp; Automation
                </div>
              </div>
            </div>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">{t.footer.tagline}</p>

            <div className="flex flex-col gap-2 mt-3 text-sm text-zinc-400">
              <div className="flex items-center gap-3">
                <MapPin size={14} className="text-[#C9A063]" />
                <span>{t.footer.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-[#C9A063]" />
                <a href="mailto:sales@topchampion.cn" className="hover:text-white transition-colors">
                  sales@topchampion.cn
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={14} className="text-[#C9A063]" />
                <span>+86 512 5790 0000</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col, i) => (
            <div key={i} className="lg:col-span-2" data-testid={`footer-col-${i}`}>
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-5">
                {col.title}
              </div>
              <ul className="flex flex-col gap-3">
                {col.items.map((l, j) => (
                  <li key={j}>
                    <Link
                      to={l.to}
                      data-testid={`footer-link-${i}-${j}`}
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social */}
          <div className="lg:col-span-2">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-5">
              Connect
            </div>
            <div className="flex gap-2 flex-wrap">
              {[Linkedin, Twitter, Youtube, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  data-testid={`social-${i}`}
                  onClick={(e) => e.preventDefault()}
                  className="w-10 h-10 flex items-center justify-center border border-white/10 text-zinc-400 hover:text-[#C9A063] hover:border-[#C9A063] transition-colors"
                  aria-label={Icon.displayName || "social"}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="font-mono text-xs text-zinc-500 tracking-wide">{t.footer.copyright}</p>
          <div className="flex items-center gap-4 font-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase">
            <span>ICP · 苏ICP备2026000000号</span>
            <span className="w-1 h-1 bg-zinc-700" />
            <span>Made in Suzhou</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
