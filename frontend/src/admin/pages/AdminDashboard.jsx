import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../../i18n/LangContext";
import { adminI18n } from "../../i18n/admin";
import { api } from "../apiClient";
import { AdminLayout } from "../AdminLayout";
import { FolderKanban, Users, Plus, ArrowRight, Mail, BellRing, CalendarDays, Inbox, ClipboardCheck } from "lucide-react";

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = adminI18n[lang];
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        setStats(data);
      } catch { /* ignore */ }
    })();
  }, [user]);

  const L = lang === "cn"
    ? {
        leads_today: "今日咨询",
        leads_unread: "未读咨询",
        leads_total: "咨询总数",
        projects_total: "项目总数",
        projects_pending: "待审批项目",
        users_total: "用户数",
        review_inbox: "客户咨询收件箱",
        view_all: "查看全部",
      }
    : {
        leads_today: "Leads Today",
        leads_unread: "Unread Leads",
        leads_total: "Total Leads",
        projects_total: "Projects",
        projects_pending: "Pending Review",
        users_total: "Team Members",
        review_inbox: "Customer enquiries",
        view_all: "View all",
      };

  return (
    <AdminLayout>
      <div data-testid="dashboard-root">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-3">
          {t.dashboard.welcome}, {user?.full_name || user?.username}
        </div>
        <h1 className="font-heading text-4xl font-bold uppercase tracking-tight mb-10">{t.dashboard.title}</h1>

        {/* Lead metrics (only visible to admin / view_leads users) */}
        {stats?.can_see_leads && (
          <>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500">
                {L.review_inbox}
              </div>
              <Link
                to="/admin/leads"
                data-testid="dashboard-leads-link"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] uppercase text-[#C9A063] hover:text-white transition-colors"
              >
                {L.view_all} <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10 border border-white/10 mb-10">
              <MetricCard icon={CalendarDays} label={L.leads_today} value={stats.leads_today} testId="metric-leads-today" accent />
              <MetricCard icon={BellRing} label={L.leads_unread} value={stats.leads_unread} testId="metric-leads-unread" alert={stats.leads_unread > 0} />
              <MetricCard icon={Inbox} label={L.leads_total} value={stats.leads_total} testId="metric-leads-total" />
            </div>
          </>
        )}

        {/* Project / team metrics */}
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-3">
          {lang === "cn" ? "项目与团队" : "Projects & Team"}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10 border border-white/10 mb-12">
          <MetricCard icon={FolderKanban} label={L.projects_total} value={stats?.projects_total ?? "—"} testId="metric-projects-total" />
          <MetricCard icon={ClipboardCheck} label={L.projects_pending} value={stats?.projects_pending_review ?? 0} testId="metric-projects-pending" alert={(stats?.projects_pending_review ?? 0) > 0} />
          {user?.role === "admin" && (
            <MetricCard icon={Users} label={L.users_total} value={stats?.users_total ?? "—"} testId="metric-users-total" />
          )}
          {user?.role !== "admin" && (
            <MetricCard icon={Users} label={t.dashboard.role_card} value={t.roles[user?.role] || user?.role} testId="stat-role" small />
          )}
        </div>

        {/* Quick actions */}
        <div className="mb-4 font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500">
          {t.dashboard.quick_actions}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
          <ActionTile to="/admin/projects" icon={FolderKanban} label={t.dashboard.qa_view_projects} testId="qa-projects" />
          {stats?.can_see_leads && (
            <ActionTile to="/admin/leads" icon={Mail} label={lang === "cn" ? "查看客户咨询" : "View leads"} testId="qa-leads" />
          )}
          {user?.role === "admin" && (
            <ActionTile to="/admin/projects/new" icon={Plus} label={t.dashboard.qa_new_project} testId="qa-new-project" />
          )}
          {user?.role === "admin" && (
            <ActionTile to="/admin/users" icon={Users} label={t.dashboard.qa_users} testId="qa-users" />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

const MetricCard = ({ icon: Icon, label, value, accent, small, alert, testId }) => (
  <div className="bg-[#0A0A0A] p-7 flex flex-col gap-3 relative" data-testid={testId}>
    <div className="flex items-center justify-between gap-2">
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400">{label}</div>
      {Icon && <Icon size={14} className={alert ? "text-[#C9A063] animate-pulse" : "text-zinc-600"} strokeWidth={1.7} />}
    </div>
    <div
      className={`font-heading font-bold tracking-tighter ${
        small ? "text-2xl text-white" : alert ? "text-5xl text-[#C9A063]" : accent ? "text-5xl text-[#C9A063]" : "text-5xl text-white"
      }`}
    >
      {value}
    </div>
  </div>
);

const ActionTile = ({ to, icon: Icon, label, testId }) => (
  <Link
    to={to}
    data-testid={testId}
    className="bg-[#0A0A0A] hover:bg-[#101010] p-7 flex items-center justify-between gap-4 transition-colors group"
  >
    <div className="flex items-center gap-4">
      <span className="w-10 h-10 border border-white/10 flex items-center justify-center text-[#C9A063] group-hover:border-[#C9A063] transition-colors">
        <Icon size={18} strokeWidth={1.7} />
      </span>
      <span className="font-medium text-white">{label}</span>
    </div>
    <ArrowRight size={16} className="text-zinc-500 group-hover:text-[#C9A063] group-hover:translate-x-1 transition-all" />
  </Link>
);
