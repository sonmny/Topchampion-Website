import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Users, LogOut, Globe, UserCircle, Inbox, FileEdit } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLang } from "../i18n/LangContext";
import { adminI18n } from "../i18n/admin";

export const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const t = adminI18n[lang];
  const navigate = useNavigate();

  const links = [
    { to: "/admin", label: t.nav.dashboard, icon: LayoutDashboard, end: true },
    { to: "/admin/projects", label: t.nav.projects, icon: FolderKanban },
  ];
  const canViewLeads = user?.role === "admin" || (user?.permissions || []).includes("view_leads");
  if (canViewLeads) {
    links.push({ to: "/admin/leads", label: t.nav.leads || "客户咨询", icon: Inbox });
  }
  if (user?.role === "admin") {
    links.push({ to: "/admin/cms", label: t.nav.site_content || (lang === "cn" ? "站点内容" : "Site Content"), icon: FileEdit });
    links.push({ to: "/admin/users", label: t.nav.users, icon: Users });
  }
  links.push({ to: "/admin/profile", label: t.nav.profile, icon: UserCircle });

  const doLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex" data-testid="admin-layout">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/10 bg-[#070707] flex flex-col">
        <div className="px-6 py-6 border-b border-white/10 flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="w-9 h-9 object-contain" />
          <div className="leading-tight">
            <div className="font-heading font-bold text-sm uppercase tracking-tight">{t.brand}</div>
            <div className="font-mono text-[9px] text-zinc-500 tracking-[0.2em] uppercase">
              苏州赛冠 · Topchampion
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={`admin-nav-${l.to.split("/").pop() || "dashboard"}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 h-11 text-sm tracking-wide transition-colors ${
                  isActive
                    ? "bg-[#0F6B3F]/15 text-white border-l-2 border-[#C9A063]"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.03] border-l-2 border-transparent"
                }`
              }
            >
              <l.icon size={16} strokeWidth={1.7} />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 flex flex-col gap-2">
          {/* User card */}
          <div className="px-4 py-3 border border-white/10 bg-white/[0.02]">
            <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">
              {t.roles[user?.role] || user?.role}
            </div>
            <div className="text-sm text-white font-medium truncate">{user?.full_name || user?.username}</div>
            <div className="text-[11px] text-zinc-500 font-mono truncate">@{user?.username}</div>
          </div>

          {/* Lang + actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "cn" ? "en" : "cn")}
              className="flex-1 h-9 flex items-center justify-center gap-2 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-[#C9A063] transition-colors font-mono tracking-wider"
              data-testid="admin-lang-toggle"
            >
              <Globe size={12} />
              {lang === "cn" ? "EN" : "中文"}
            </button>
          </div>

          <Link
            to="/"
            className="text-center text-[11px] text-zinc-500 hover:text-white py-2 tracking-wide transition-colors"
            data-testid="admin-back-to-site"
          >
            {t.nav.back_to_site}
          </Link>

          <button
            onClick={doLogout}
            data-testid="admin-logout"
            className="flex items-center justify-center gap-2 h-10 bg-white/[0.04] hover:bg-[#C9A063] hover:text-black text-zinc-300 text-sm font-semibold tracking-wide transition-colors"
          >
            <LogOut size={14} />
            {t.nav.logout}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
};
