import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n/LangContext";
import { useSiteContent } from "../hooks/useSiteContent";
import { MapPin, Mail, Phone, QrCode } from "lucide-react";

export const Footer = () => {
  const { t, lang } = useLang();
  const { data: contact } = useSiteContent("contact-info");

  const address = contact ? (lang === "cn" ? contact.address_cn : contact.address_en) || t.footer.address : t.footer.address;
  const phone = (contact && contact.phone) || "+86 512 5790 0000";
  const emailSales = (contact && contact.email_sales) || "sales@topchampion.cn";

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
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-[#C9A063]" />
                <a href={`mailto:${emailSales}`} className="hover:text-white transition-colors">
                  {emailSales}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={14} className="text-[#C9A063]" />
                <span>{phone}</span>
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

          {/* Connect — official WeChat QR */}
          <div className="lg:col-span-2">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-5 flex items-center gap-2">
              <QrCode size={12} /> {lang === "cn" ? "扫码联系" : "Scan to Connect"}
            </div>
            <div
              data-testid="wechat-qr"
              className="group relative inline-flex flex-col items-center gap-3 p-3 bg-white/[0.03] border border-[#C9A063]/30 hover:border-[#C9A063] hover:bg-[#C9A063]/[0.04] transition-all duration-300"
            >
              {/* Decorative inner gold accent */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{ boxShadow: "inset 0 0 0 1px rgba(201,160,99,0.5), 0 0 24px rgba(201,160,99,0.18)" }} />
              <img
                src="/wechat-qr.jpg"
                alt={lang === "cn" ? "苏州赛冠官方微信二维码" : "Suzhou Topchampion official WeChat QR"}
                loading="lazy"
                className="relative w-32 h-32 lg:w-36 lg:h-36 object-cover bg-white p-1 transition-all duration-300 group-hover:scale-[1.02]"
                style={{ filter: "contrast(1.05) saturate(1.05)" }}
              />
              <div className="relative font-mono text-[9px] tracking-[0.25em] uppercase text-zinc-400 group-hover:text-[#C9A063] transition-colors text-center leading-relaxed">
                {lang === "cn" ? "扫码添加 · 商务咨询" : "Scan · Business Enquiry"}
              </div>
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
