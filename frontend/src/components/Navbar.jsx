import React, { useEffect, useState } from "react";
import { useLang } from "../i18n/LangContext";
import { Menu, X } from "lucide-react";

export const Navbar = () => {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navLinks = [
    { id: "solutions", label: t.nav.solutions },
    { id: "engineering", label: t.nav.engineering },
    { id: "cases", label: t.nav.cases },
    { id: "contact", label: t.nav.contact },
  ];

  return (
    <header
      data-testid="site-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/70 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <a
          href="#top"
          data-testid="nav-logo"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-3 group"
        >
          <img
            src="https://customer-assets.emergentagent.com/job_green-automation-pro/artifacts/im0tm1zz_Gemini_Generated_Image_6tbew96tbew96tbe.png"
            alt="Topchampion logo"
            className="w-11 h-11 object-contain"
          />
          <div className="leading-tight">
            <div className="font-heading font-bold text-white text-sm tracking-tight uppercase">
              Topchampion
            </div>
            <div className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase">
              苏州赛冠 · Automation
            </div>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-10">
          {navLinks.map((l) => (
            <button
              key={l.id}
              data-testid={`nav-link-${l.id}`}
              onClick={() => scrollTo(l.id)}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 tracking-wide"
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div
            data-testid="lang-toggle"
            className="hidden sm:flex items-center h-9 border border-white/10 bg-black/30"
          >
            <button
              data-testid="lang-en"
              onClick={() => setLang("en")}
              className={`px-3 h-full font-mono text-[11px] tracking-wider transition-colors ${
                lang === "en" ? "bg-[#0F6B3F] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              data-testid="lang-cn"
              onClick={() => setLang("cn")}
              className={`px-3 h-full font-mono text-[11px] tracking-wider transition-colors ${
                lang === "cn" ? "bg-[#0F6B3F] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              中文
            </button>
          </div>

          <button
            data-testid="nav-cta-quote"
            onClick={() => scrollTo("contact")}
            className="hidden md:inline-flex items-center gap-2 bg-[#C9A063] hover:bg-[#B58D4F] text-black font-semibold tracking-wide uppercase text-xs px-5 h-9 transition-colors"
          >
            {t.nav.quote}
          </button>

          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden w-9 h-9 flex items-center justify-center border border-white/10 text-white"
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-white/10" data-testid="mobile-menu-panel">
          <div className="px-6 py-6 flex flex-col gap-4">
            {navLinks.map((l) => (
              <button
                key={l.id}
                data-testid={`mobile-nav-${l.id}`}
                onClick={() => scrollTo(l.id)}
                className="text-left text-zinc-300 hover:text-white py-2 border-b border-white/5"
              >
                {l.label}
              </button>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 font-mono text-xs border ${
                  lang === "en"
                    ? "bg-[#0F6B3F] border-[#0F6B3F] text-white"
                    : "border-white/10 text-zinc-400"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("cn")}
                className={`px-3 py-1.5 font-mono text-xs border ${
                  lang === "cn"
                    ? "bg-[#0F6B3F] border-[#0F6B3F] text-white"
                    : "border-white/10 text-zinc-400"
                }`}
              >
                中文
              </button>
            </div>
            <button
              onClick={() => scrollTo("contact")}
              className="mt-4 bg-[#C9A063] text-black font-semibold py-3 uppercase text-sm tracking-wide"
              data-testid="mobile-cta-quote"
            >
              {t.nav.quote}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
