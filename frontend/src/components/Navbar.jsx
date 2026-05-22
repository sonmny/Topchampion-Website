import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../i18n/LangContext";
import { useAuth } from "../admin/AuthContext";
import { Menu, X, LogIn, LayoutDashboard } from "lucide-react";

export const Navbar = () => {
  const { lang, setLang, t } = useLang();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isSignedIn = !!user;
  const loginTarget = isSignedIn ? "/admin" : "/admin/login";
  const loginLabel = isSignedIn ? t.nav.enter_admin : t.nav.login;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  const navLinks = [
    { id: "home", to: "/", label: t.nav.home },
    { id: "solutions", to: "/solutions", label: t.nav.solutions },
    { id: "engineering", to: "/engineering", label: t.nav.engineering },
    { id: "cases", to: "/cases", label: t.nav.cases },
    { id: "contact", to: "/contact", label: t.nav.contact },
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
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-[72px] lg:h-[88px] flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          data-testid="nav-logo"
          onClick={(e) => {
            e.preventDefault();
            goTo("/");
          }}
          className="flex items-center gap-3 group"
        >
          <img
            src="/logo.png"
            alt="Topchampion logo"
            className="w-11 h-11 lg:w-[52px] lg:h-[52px] object-contain"
          />
          <div className="leading-tight">
            <div className="font-heading font-bold text-white text-[13px] xl:text-[15px] tracking-tight uppercase whitespace-nowrap">
              Topchampion Electric &amp; Automation
            </div>
            <div className="font-mono text-[10px] xl:text-[11px] text-zinc-500 tracking-[0.18em] uppercase whitespace-nowrap">
              苏州赛冠 电气 &amp; 自动化
            </div>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-4">
          {navLinks.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.id}
                to={l.to}
                data-testid={`nav-link-${l.id}`}
                className={`text-sm font-medium transition-colors duration-200 tracking-wide text-center px-3 min-w-[110px] xl:min-w-[130px] whitespace-nowrap ${
                  active ? "text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div
            data-testid="lang-toggle"
            className="hidden sm:flex items-center h-9 lg:h-10 border border-white/10 bg-black/30"
          >
            <button
              data-testid="lang-en"
              onClick={() => setLang("en")}
              className={`h-full w-11 flex items-center justify-center font-mono text-[11px] tracking-wider transition-colors ${
                lang === "en" ? "bg-[#0F6B3F] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              data-testid="lang-cn"
              onClick={() => setLang("cn")}
              className={`h-full w-11 flex items-center justify-center font-mono text-[11px] tracking-wider transition-colors ${
                lang === "cn" ? "bg-[#0F6B3F] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              中文
            </button>
          </div>

          <button
            data-testid="nav-cta-quote"
            onClick={() => goTo("/contact")}
            className="hidden md:inline-flex items-center justify-center gap-2 bg-[#C9A063] hover:bg-[#B58D4F] text-black font-semibold tracking-wide uppercase text-xs lg:text-[12px] px-4 h-9 lg:h-10 min-w-[170px] lg:min-w-[210px] whitespace-nowrap transition-colors"
          >
            {t.nav.quote}
          </button>

          <button
            data-testid="nav-cta-login"
            onClick={() => goTo(loginTarget)}
            className={`hidden md:inline-flex items-center justify-center gap-2 border font-semibold tracking-wide uppercase text-xs lg:text-[12px] px-4 h-9 lg:h-10 min-w-[120px] lg:min-w-[145px] whitespace-nowrap transition-colors ${
              isSignedIn
                ? "bg-[#0F6B3F] border-[#0F6B3F] text-white hover:bg-[#0A5230]"
                : "border-white/15 text-zinc-300 hover:border-[#0F6B3F] hover:text-white hover:bg-[#0F6B3F]"
            }`}
          >
            {isSignedIn ? <LayoutDashboard size={13} /> : <LogIn size={13} />}
            {loginLabel}
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
                onClick={() => goTo(l.to)}
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
              onClick={() => goTo("/contact")}
              className="mt-4 bg-[#C9A063] text-black font-semibold py-3 uppercase text-sm tracking-wide"
              data-testid="mobile-cta-quote"
            >
              {t.nav.quote}
            </button>
            <button
              onClick={() => goTo(loginTarget)}
              className="bg-[#0F6B3F] text-white font-semibold py-3 uppercase text-sm tracking-wide flex items-center justify-center gap-2"
              data-testid="mobile-cta-login"
            >
              {isSignedIn ? <LayoutDashboard size={14} /> : <LogIn size={14} />}
              {loginLabel}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
