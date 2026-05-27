import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../../i18n/LangContext";
import { api, formatApiError } from "../apiClient";
import { toast } from "sonner";
import { LogOut, Download, BellRing, CheckCircle2, FolderKanban, ChevronRight, FileText, ClipboardList } from "lucide-react";

const STAGE_FLOW = ["entry", "design", "procurement", "manufacturing", "testing", "shipping", "archived"];
const STAGE_LABEL_CN = {
  entry: "项目录入", design: "设计阶段", procurement: "备料阶段",
  manufacturing: "制造阶段", testing: "测试阶段", shipping: "包装出厂", archived: "已归档",
  // legacy fallbacks
  draft: "项目录入", in_design: "设计阶段", in_production: "制造阶段", commissioning: "测试阶段", delivered: "包装出厂",
};
const STAGE_LABEL_EN = {
  entry: "Order Entry", design: "Design", procurement: "Procurement",
  manufacturing: "Manufacturing", testing: "Testing", shipping: "Shipping", archived: "Archived",
  draft: "Order Entry", in_design: "Design", in_production: "Manufacturing", commissioning: "Testing", delivered: "Shipping",
};
const LEGACY_TO_NEW = { draft: "entry", in_design: "design", in_production: "manufacturing", commissioning: "testing", delivered: "shipping" };

export const CustomerPortal = () => {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Only customers should see this portal — everyone else gets routed to admin
  useEffect(() => {
    if (user && user.role !== "customer") navigate("/admin");
  }, [user, navigate]);

  const L = lang === "cn" ? STAGE_LABEL_CN : STAGE_LABEL_EN;
  const labels = lang === "cn"
    ? { title: "客户门户", projects: "我的项目", notifications: "通知", no_projects: "暂无项目", no_notifications: "暂无通知", logout: "退出", lang_btn: "EN", select_project: "请选择左侧项目以查看详情", files: "项目资料", no_files: "暂无可下载文件", stage: "当前阶段", mark_read: "全部标记已读", materials: "甲供料清单" }
    : { title: "Customer Portal", projects: "My Projects", notifications: "Notifications", no_projects: "No projects assigned", no_notifications: "No notifications yet", logout: "Log out", lang_btn: "中", select_project: "Select a project from the left", files: "Project Files", no_files: "No files available", stage: "Current stage", mark_read: "Mark all read", materials: "Customer-Supplied Materials" };

  const load = async () => {
    setLoading(true);
    try {
      const [pr, nr] = await Promise.all([
        api.get("/projects"),
        api.get("/notifications"),
      ]);
      setProjects(pr.data || []);
      setNotifications(nr.data || []);
      if (!selectedId && (pr.data || []).length > 0) setSelectedId(pr.data[0].id);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const selected = projects.find((p) => p.id === selectedId);
  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all", {});
      setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const markRead = async (n) => {
    if (n.read) return;
    try {
      await api.post(`/notifications/${n.id}/read`, {});
      setNotifications((ns) => ns.map((x) => x.id === n.id ? { ...x, read: true } : x));
    } catch { /* ignore */ }
  };

  const downloadFile = async (pid, f) => {
    try {
      const res = await api.get(`/projects/${pid}/files/${f.id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = f.filename;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { toast.error(formatApiError(e)); }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white" data-testid="customer-portal-root">
      {/* Top bar */}
      <header className="border-b border-white/10 bg-[#0A0A0A] sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-heading text-lg font-bold tracking-tighter text-[#C9A063]">TOPCHAMPION</Link>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500 hidden sm:inline">{labels.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-300 hidden md:inline">{user?.full_name || user?.username}</span>
            <button onClick={() => setLang(lang === "cn" ? "en" : "cn")} data-testid="portal-lang-btn" className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400 hover:text-[#C9A063] transition-colors">
              {labels.lang_btn}
            </button>
            <button onClick={() => { logout(); navigate("/admin/login"); }} data-testid="portal-logout" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs">
              <LogOut size={14} /> {labels.logout}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <section data-testid="portal-projects-list">
            <div className="flex items-center gap-2 mb-3">
              <FolderKanban size={14} className="text-[#C9A063]" />
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063]">{labels.projects}</span>
            </div>
            {loading ? (
              <div className="text-xs text-zinc-500">…</div>
            ) : projects.length === 0 ? (
              <div className="text-xs text-zinc-500 italic">{labels.no_projects}</div>
            ) : (
              <ul className="divide-y divide-white/5 border border-white/10 bg-[#0A0A0A]">
                {projects.map((p) => {
                  const stage = LEGACY_TO_NEW[p.status] || p.status;
                  const isSel = p.id === selectedId;
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => setSelectedId(p.id)}
                        data-testid={`portal-project-${p.id}`}
                        className={`w-full text-left p-4 transition-colors ${isSel ? "bg-[#0F6B3F]/15 border-l-2 border-l-[#C9A063]" : "hover:bg-white/[0.03]"}`}
                      >
                        <div className="text-sm font-medium text-white truncate">{p.name}</div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mt-1">
                          {L[stage] || stage}
                        </div>
                        {p.work_order_no && <div className="text-[10px] font-mono text-zinc-600 mt-0.5">#{p.work_order_no}</div>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section data-testid="portal-notifications">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BellRing size={14} className={unread ? "text-[#C9A063] animate-pulse" : "text-zinc-500"} />
                <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063]">{labels.notifications}{unread > 0 && <span className="text-[#C9A063] ml-1">({unread})</span>}</span>
              </div>
              {unread > 0 && (
                <button onClick={markAllRead} data-testid="portal-mark-all-read" className="font-mono text-[9px] tracking-[0.2em] uppercase text-zinc-500 hover:text-[#C9A063] transition-colors">
                  {labels.mark_read}
                </button>
              )}
            </div>
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {notifications.length === 0 ? (
                <li className="text-xs text-zinc-500 italic">{labels.no_notifications}</li>
              ) : notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => { markRead(n); if (n.project_id) setSelectedId(n.project_id); }}
                  data-testid={`portal-notif-${n.id}`}
                  className={`p-3 border cursor-pointer transition-colors ${n.read ? "border-white/5 bg-[#0A0A0A] opacity-70" : "border-[#C9A063]/30 bg-[#0F0F0F] hover:bg-[#121212]"}`}
                >
                  <div className="text-xs text-white leading-snug">{n.title}</div>
                  {n.body && <div className="text-[11px] text-zinc-500 mt-1 leading-relaxed line-clamp-2">{n.body}</div>}
                  <div className="text-[9px] font-mono text-zinc-600 mt-1.5">{new Date(n.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        {/* Main pane */}
        <main className="lg:col-span-9">
          {!selected ? (
            <div className="border border-white/10 bg-[#0A0A0A] p-20 text-center text-sm text-zinc-500">
              {labels.select_project}
            </div>
          ) : (
            <ProjectDetailView project={selected} L={L} lang={lang} labels={labels} onDownload={downloadFile} />
          )}
        </main>
      </div>
    </div>
  );
};

const ProjectDetailView = ({ project: p, L, lang, labels, onDownload }) => {
  const stage = LEGACY_TO_NEW[p.status] || p.status;
  const currentIdx = STAGE_FLOW.indexOf(stage);
  const files = p.files || [];
  // Group files by category for the customer-facing view (skip legacy "code" files)
  const groups = [
    { key: "approval_drawing", title: lang === "cn" ? "承认图" : "Approval Drawing" },
    { key: "design_output", title: lang === "cn" ? "设计输出" : "Design Output" },
    { key: "product_photo", title: lang === "cn" ? "产品照片" : "Product Photos" },
    { key: "inspection_report", title: lang === "cn" ? "检验报告" : "Inspection Report" },
    { key: "as_built_drawing", title: lang === "cn" ? "竣工图" : "As-Built Drawing" },
    { key: "drawing", title: lang === "cn" ? "其他图纸" : "Other Drawings" },
    { key: "photo", title: lang === "cn" ? "现场照片" : "Site Photos" },
  ];
  return (
    <div data-testid={`portal-detail-${p.id}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-2">
          {labels.stage}: {L[stage] || stage}
          {p.work_order_no && <span className="text-zinc-500"> · #{p.work_order_no}</span>}
        </div>
        <h1 className="font-heading text-3xl lg:text-4xl font-bold uppercase tracking-tight">{p.name}</h1>
        {p.description && <p className="mt-3 text-zinc-400 leading-relaxed max-w-2xl">{p.description}</p>}
      </div>

      {/* Stage stepper */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-px bg-white/10 border border-white/10 mb-10" data-testid="portal-stepper">
        {STAGE_FLOW.map((s, i) => {
          const done = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={s} className={`px-3 py-3 ${isCurrent ? "bg-[#0F6B3F]/15" : done ? "bg-white/[0.04]" : "bg-[#0A0A0A]"}`}>
              <div className={`font-mono text-[9px] tracking-[0.2em] uppercase ${done ? "text-[#C9A063]" : "text-zinc-600"} flex items-center gap-1`}>
                {String(i + 1).padStart(2, "0")} {done && <CheckCircle2 size={10} className="text-[#1A8A52]" />}
              </div>
              <div className={`text-[11px] font-medium mt-1 ${isCurrent ? "text-white" : done ? "text-zinc-300" : "text-zinc-600"}`}>{L[s]}</div>
            </div>
          );
        })}
      </div>

      {/* Materials */}
      {(p.customer_materials || []).length > 0 && (
        <section className="mb-10" data-testid="portal-materials">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={14} className="text-[#C9A063]" />
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063]">{labels.materials}</span>
          </div>
          <ul className="border border-white/10 bg-[#0A0A0A] divide-y divide-white/5">
            {(p.customer_materials || []).map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-2 h-2 ${m.supplied ? "bg-[#1A8A52]" : "bg-yellow-400 animate-pulse"}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${m.supplied ? "text-zinc-500 line-through" : "text-white"}`}>{m.name}</div>
                  {m.note && <div className="text-[11px] text-zinc-500">{m.note}</div>}
                </div>
                <span className={`font-mono text-[10px] tracking-[0.2em] uppercase ${m.supplied ? "text-[#1A8A52]" : "text-yellow-400"}`}>
                  {m.supplied ? (lang === "cn" ? "已到货" : "Supplied") : (lang === "cn" ? "待客户提供" : "Awaiting")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Files grouped by category */}
      <section data-testid="portal-files">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={14} className="text-[#C9A063]" />
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063]">{labels.files}</span>
        </div>
        {files.length === 0 ? (
          <div className="border border-white/10 bg-[#0A0A0A] p-8 text-center text-xs text-zinc-500 italic">{labels.no_files}</div>
        ) : (
          <div className="space-y-5">
            {groups.map((g) => {
              const list = files.filter((f) => f.category === g.key);
              if (list.length === 0) return null;
              return (
                <div key={g.key} className="border border-white/10 bg-[#0A0A0A]" data-testid={`portal-group-${g.key}`}>
                  <div className="px-4 py-3 border-b border-white/10 text-sm font-medium text-white flex items-center justify-between">
                    <span>{g.title}</span>
                    <span className="font-mono text-[10px] text-zinc-500">{list.length}</span>
                  </div>
                  <ul className="divide-y divide-white/5">
                    {list.map((f) => (
                      <li key={f.id} className="px-4 py-3 flex items-center gap-3" data-testid={`portal-file-${f.id}`}>
                        <FileText size={14} className="text-zinc-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{f.display_name || f.filename}</div>
                          <div className="text-[10px] font-mono text-zinc-500">
                            {(f.size / 1024).toFixed(1)} KB · {f.uploaded_by_name || ""} · {new Date(f.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button onClick={() => onDownload(p.id, f)} className="inline-flex items-center gap-1 h-8 px-3 border border-white/10 hover:border-[#C9A063] text-zinc-300 hover:text-[#C9A063] text-xs transition-colors" data-testid={`portal-dl-${f.id}`}>
                          <Download size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
