import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../../i18n/LangContext";
import { adminI18n } from "../../i18n/admin";
import { api } from "../apiClient";
import { AdminLayout } from "../AdminLayout";
import { FolderKanban, Users, Plus, ArrowRight } from "lucide-react";

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = adminI18n[lang];
  const [stats, setStats] = useState({ projects: 0, users: 0, myProjects: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [projects, users] = await Promise.all([
          api.get("/projects"),
          user?.role === "admin" ? api.get("/users") : Promise.resolve({ data: [] }),
        ]);
        const all = projects.data || [];
        setStats({
          projects: all.length,
          users: users.data.length,
          myProjects: all.filter((p) => p.created_by === user?.id || p.customer_user_id === user?.id).length,
        });
      } catch { /* ignore */ }
    })();
  }, [user]);

  return (
    <AdminLayout>
      <div data-testid="dashboard-root">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-3">
          {t.dashboard.welcome}, {user?.full_name || user?.username}
        </div>
        <h1 className="font-heading text-4xl font-bold uppercase tracking-tight mb-10">{t.dashboard.title}</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10 border border-white/10 mb-12">
          <StatCard label={t.dashboard.stat_projects} value={stats.projects} testId="stat-projects" />
          {user?.role === "admin" ? (
            <StatCard label={t.dashboard.stat_users} value={stats.users} testId="stat-users" accent />
          ) : (
            <StatCard label={t.dashboard.stat_my_projects} value={stats.myProjects} testId="stat-my-projects" accent />
          )}
          <StatCard label={t.dashboard.role_card} value={t.roles[user?.role] || user?.role} testId="stat-role" small />
        </div>

        {/* Quick actions */}
        <div className="mb-4 font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500">
          {t.dashboard.quick_actions}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
          <ActionTile
            to="/admin/projects"
            icon={FolderKanban}
            label={t.dashboard.qa_view_projects}
            testId="qa-projects"
          />
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

const StatCard = ({ label, value, accent, small, testId }) => (
  <div className="bg-[#0A0A0A] p-7 flex flex-col gap-3" data-testid={testId}>
    <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400">{label}</div>
    <div
      className={`font-heading font-bold tracking-tighter ${
        small ? "text-2xl text-white" : accent ? "text-5xl text-[#C9A063]" : "text-5xl text-white"
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
