import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../../i18n/LangContext";
import { adminI18n } from "../../i18n/admin";
import { api, formatApiError } from "../apiClient";
import { AdminLayout } from "../AdminLayout";
import { Plus, Eye, Pencil, Trash2, Search, FileText } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS = {
  draft: "text-zinc-400 bg-zinc-800/40 border-zinc-700/40",
  in_design: "text-blue-300 bg-blue-500/10 border-blue-500/30",
  in_production: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  commissioning: "text-purple-300 bg-purple-500/10 border-purple-500/30",
  delivered: "text-[#00E676] bg-[#00E676]/10 border-[#00E676]/30",
  archived: "text-zinc-500 bg-zinc-900/40 border-zinc-700/30",
};

export const ProjectsList = () => {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = adminI18n[lang];
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const isAdmin = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/projects");
      setItems(data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.client_name || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const del = async (p) => {
    if (!window.confirm(t.projects.confirm_delete)) return;
    try {
      await api.delete(`/projects/${p.id}`);
      toast.success(t.common.delete_ok);
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <AdminLayout>
      <div data-testid="projects-list-root">
        <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-3">
              {t.projects.title}
            </div>
            <h1 className="font-heading text-4xl font-bold uppercase tracking-tight">{t.projects.title}</h1>
            <p className="text-sm text-zinc-400 mt-2">{t.projects.subtitle}</p>
          </div>
          {isAdmin && (
            <Link
              to="/admin/projects/new"
              data-testid="new-project-btn"
              className="inline-flex items-center gap-2 bg-[#0F6B3F] hover:bg-[#0A5230] text-white font-semibold uppercase text-sm tracking-wide px-5 h-11 transition-colors"
            >
              <Plus size={16} />
              {t.projects.new}
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            data-testid="projects-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.projects.search}
            className="w-full bg-[#141414] border border-white/10 focus:border-[#C9A063] outline-none h-10 pl-11 pr-4 text-sm text-white placeholder-zinc-500"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-zinc-500 tracking-widest uppercase">
            {t.common.loading}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border border-white/10 bg-white/[0.02]">
            <p className="text-zinc-400">{t.projects.empty}</p>
            {isAdmin && <p className="text-xs text-zinc-500 mt-2">{t.projects.empty_admin}</p>}
          </div>
        ) : (
          <div className="border border-white/10 overflow-x-auto">
            <table className="w-full text-sm" data-testid="projects-table">
              <thead className="bg-[#0F0F0F] border-b border-white/10">
                <tr className="text-left font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400">
                  <th className="px-5 py-3">{t.projects.th.name}</th>
                  <th className="px-5 py-3">{t.projects.th.client}</th>
                  <th className="px-5 py-3">{t.projects.th.industry}</th>
                  <th className="px-5 py-3">{t.projects.th.plc}</th>
                  <th className="px-5 py-3">{t.projects.th.status}</th>
                  <th className="px-5 py-3">{t.projects.th.files}</th>
                  <th className="px-5 py-3">{t.projects.th.updated}</th>
                  <th className="px-5 py-3 text-right">{t.projects.th.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`project-row-${p.id}`}>
                    <td className="px-5 py-4 font-medium text-white">
                      <Link to={`/admin/projects/${p.id}`} className="hover:text-[#C9A063] transition-colors">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-zinc-300">{p.client_name || "—"}</td>
                    <td className="px-5 py-4 text-zinc-300">
                      {p.industry ? t.projects.industries[p.industry] : "—"}
                    </td>
                    <td className="px-5 py-4 text-zinc-300">
                      {p.plc_brand ? t.projects.plcs[p.plc_brand] : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-[11px] font-mono tracking-wider uppercase border ${STATUS_COLORS[p.status] || STATUS_COLORS.draft}`}>
                        {t.projects.status[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-300">
                      <span className="inline-flex items-center gap-1.5">
                        <FileText size={12} className="text-zinc-500" />
                        {(p.files || []).length}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 font-mono text-xs">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <IconBtn
                          icon={Eye}
                          title={t.projects.view}
                          onClick={() => navigate(`/admin/projects/${p.id}`)}
                          testId={`view-${p.id}`}
                        />
                        {isAdmin && (
                          <>
                            <IconBtn
                              icon={Pencil}
                              title={t.projects.edit}
                              onClick={() => navigate(`/admin/projects/${p.id}/edit`)}
                              testId={`edit-${p.id}`}
                            />
                            <IconBtn
                              icon={Trash2}
                              title={t.projects.delete}
                              onClick={() => del(p)}
                              danger
                              testId={`delete-${p.id}`}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const IconBtn = ({ icon: Icon, title, onClick, danger, testId }) => (
  <button
    onClick={onClick}
    title={title}
    data-testid={testId}
    className={`w-9 h-9 flex items-center justify-center border border-white/10 transition-colors ${
      danger
        ? "text-zinc-400 hover:text-red-300 hover:border-red-400/50"
        : "text-zinc-400 hover:text-[#C9A063] hover:border-[#C9A063]"
    }`}
  >
    <Icon size={14} />
  </button>
);
