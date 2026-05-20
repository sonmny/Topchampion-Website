import React from "react";
import { useLang } from "../i18n/LangContext";
import { Linkedin, Twitter, Youtube, Github, MapPin, Mail, Phone } from "lucide-react";

export const Footer = () => {
  const { t } = useLang();
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
              <div className="w-10 h-10 bg-[#0055A4] flex items-center justify-center relative">
                <div className="absolute inset-0 border border-[#00E676]/40 translate-x-[3px] translate-y-[3px]" />
                <span className="font-heading font-bold text-white text-xl relative">T</span>
              </div>
              <div>
                <div className="font-heading font-bold text-white text-base tracking-tight uppercase">
                  Topchampion Automation
                </div>
                <div className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase">
                  苏州赛冠 · 自动化
                </div>
              </div>
            </div>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">{t.footer.tagline}</p>

            <div className="flex flex-col gap-2 mt-3 text-sm text-zinc-400">
              <div className="flex items-center gap-3">
                <MapPin size={14} className="text-[#00E676]" />
                <span>{t.footer.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-[#00E676]" />
                <a href="mailto:sales@topchampion.cn" className="hover:text-white transition-colors">
                  sales@topchampion.cn
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={14} className="text-[#00E676]" />
                <span>+86 512 0000 0000</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {[
            { title: t.footer.sections.solutions, items: t.footer.links.solutions },
            { title: t.footer.sections.company, items: t.footer.links.company },
            { title: t.footer.sections.legal, items: t.footer.links.legal },
          ].map((col, i) => (
            <div
              key={i}
              className="lg:col-span-2 lg:col-start-auto"
              data-testid={`footer-col-${i}`}
            >
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#00E676] mb-5">
                {col.title}
              </div>
              <ul className="flex flex-col gap-3">
                {col.items.map((l, j) => (
                  <li key={j}>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social */}
          <div className="lg:col-span-2">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#00E676] mb-5">
              Connect
            </div>
            <div className="flex gap-2 flex-wrap">
              {[Linkedin, Twitter, Youtube, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  data-testid={`social-${i}`}
                  onClick={(e) => e.preventDefault()}
                  className="w-10 h-10 flex items-center justify-center border border-white/10 text-zinc-400 hover:text-[#00E676] hover:border-[#00E676] transition-colors"
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
