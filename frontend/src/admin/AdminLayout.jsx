import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Users, LogOut, Globe, UserCircle, Inbox, FileEdit, Bell } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLang } from "../i18n/LangContext";
import { adminI18n } from "../i18n/admin";
import { api } from "./apiClient";

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
        <div className="border-b border-white/10 bg-[#070707] px-8 py-3 flex items-center justify-end">
          <NotificationBell lang={lang} />
        </div>
        <div className="max-w-[1400px] mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
};

const NotificationBell = ({ lang }) => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const fetchItems = async () => {
    try { const { data } = await api.get("/notifications"); setItems(data || []); } catch { /* ignore */ }
  };
  useEffect(() => {
    fetchItems();
    const t = setInterval(fetchItems, 30000); // poll every 30s
    return () => clearInterval(t);
  }, []);
  const unread = items.filter((n) => !n.read).length;
  const markAll = async () => {
    try { await api.post("/notifications/read-all", {}); setItems((xs) => xs.map((x) => ({ ...x, read: true }))); } catch { /* ignore */ }
  };
  const markOne = async (n) => {
    if (n.read) return;
    try { await api.post(`/notifications/${n.id}/read`, {}); setItems((xs) => xs.map((x) => x.id === n.id ? { ...x, read: true } : x)); } catch { /* ignore */ }
  };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="notif-bell"
        className="relative inline-flex items-center justify-center w-9 h-9 border border-white/10 hover:border-[#C9A063] text-zinc-300 hover:text-[#C9A063] transition-colors"
      >
        <Bell size={15} className={unread ? "text-[#C9A063]" : ""} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-[#C9A063] text-black text-[9px] font-bold flex items-center justify-center px-1" data-testid="notif-unread-count">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-[480px] overflow-y-auto bg-[#0A0A0A] border border-white/10 shadow-xl z-50" data-testid="notif-dropdown">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0A0A0A]">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063]">{lang === "cn" ? "通知" : "Notifications"}</span>
            {unread > 0 && (
              <button onClick={markAll} className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 hover:text-[#C9A063]" data-testid="notif-mark-all">
                {lang === "cn" ? "全部已读" : "Mark all"}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500 italic">{lang === "cn" ? "暂无通知" : "No notifications"}</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.slice(0, 30).map((n) => (
                <li
                  key={n.id}
                  onClick={() => markOne(n)}
                  data-testid={`notif-item-${n.id}`}
                  className={`p-3 cursor-pointer ${n.read ? "opacity-60" : "hover:bg-white/[0.03]"}`}
                >
                  <div className="text-xs text-white leading-snug">{n.title}</div>
                  {n.body && <div className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{n.body}</div>}
                  <div className="text-[9px] font-mono text-zinc-600 mt-1.5">{new Date(n.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
