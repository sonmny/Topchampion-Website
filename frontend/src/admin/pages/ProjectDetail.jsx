import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../../i18n/LangContext";
import { adminI18n } from "../../i18n/admin";
import { api, API_BASE, formatApiError } from "../apiClient";
import { AdminLayout } from "../AdminLayout";
import { toast } from "sonner";
import { Pencil, Trash2, Upload, Download, FileText, ExternalLink } from "lucide-react";

export const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { lang } = useLang();
  const t = adminI18n[lang];
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const isAdmin = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${id}`);
      setP(data);
    } catch (e) {
      toast.error(formatApiError(e));
      navigate("/admin/projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const onPickFile = () => fileRef.current?.click();

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/projects/${id}/files`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(t.common.save_ok);
      load();
    } catch (e2) {
      toast.error(formatApiError(e2));
    } finally {
      setUploading(false);
    }
  };

  const delFile = async (fid) => {
    if (!window.confirm(t.project_detail.confirm_delete_file)) return;
    try {
      await api.delete(`/projects/${id}/files/${fid}`);
      toast.success(t.common.delete_ok);
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const delProject = async () => {
    if (!window.confirm(t.projects.confirm_delete)) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success(t.common.delete_ok);
      navigate("/admin/projects");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const download = async (f) => {
    try {
      const res = await api.get(`/projects/${id}/files/${f.id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = f.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  if (loading || !p) {
    return (
      <AdminLayout>
        <div className="py-20 text-center font-mono text-xs text-zinc-500 tracking-widest uppercase">
          {t.common.loading}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div data-testid="project-detail-root">
        <Link to="/admin/projects" className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500 hover:text-white">
          {t.project_detail.back}
        </Link>

        <div className="flex items-start justify-between gap-6 mt-3 mb-10 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063]">
                {t.projects.status[p.status] || p.status}
              </span>
              {p.industry && <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500">· {t.projects.industries[p.industry]}</span>}
            </div>
            <h1 className="font-heading text-4xl font-bold uppercase tracking-tight" data-testid="project-title">{p.name}</h1>
            {p.client_name && <p className="mt-2 text-zinc-400">{p.client_name}</p>}
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Link to={`/admin/projects/${id}/edit`} data-testid="edit-project-btn" className="inline-flex items-center gap-2 px-5 h-11 border border-white/10 hover:border-[#C9A063] hover:text-[#C9A063] text-zinc-300 text-sm font-medium uppercase tracking-wide transition-colors">
                <Pencil size={14} /> {t.projects.edit}
              </Link>
              <button onClick={delProject} data-testid="delete-project-btn" className="inline-flex items-center gap-2 px-5 h-11 border border-white/10 hover:border-red-400/50 hover:text-red-300 text-zinc-300 text-sm font-medium uppercase tracking-wide transition-colors">
                <Trash2 size={14} /> {t.projects.delete}
              </button>
            </div>
          )}
        </div>

        {/* Meta + Description */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/10 border border-white/10 mb-10">
          {p.description && (
            <div className="bg-[#0A0A0A] p-7 lg:col-span-2">
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-3">
                {t.project_detail.meta}
              </div>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{p.description}</p>
            </div>
          )}
          <div className="bg-[#0A0A0A] p-7 flex flex-col gap-3">
            <MetaLine label={t.projects.th.plc} value={p.plc_brand ? t.projects.plcs[p.plc_brand] : "—"} />
            <MetaLine label={t.projects.th.client} value={p.client_name || "—"} />
            <MetaLine label={t.projects.th.updated} value={new Date(p.updated_at).toLocaleString()} />
          </div>
        </div>

        {/* Parameters */}
        {p.parameters && Object.keys(p.parameters).length > 0 && (
          <section className="mb-10" data-testid="project-parameters">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-4">
              {t.project_detail.params}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-white/10 border border-white/10">
              {Object.entries(p.parameters).map(([k, v]) => (
                <div key={k} className="bg-[#0A0A0A] p-5">
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-1">{k}</div>
                  <div className="text-white text-sm break-words">{String(v)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* External drawing links */}
        {p.drawing_urls && p.drawing_urls.length > 0 && (
          <section className="mb-10" data-testid="project-drawing-urls">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-4">
              {t.project_detail.drawing_links}
            </div>
            <div className="border border-white/10 divide-y divide-white/5">
              {p.drawing_urls.map((u, i) => (
                <a key={i} href={u} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-colors">
                  <ExternalLink size={14} className="text-[#C9A063] shrink-0" />
                  <span className="text-sm text-zinc-300 truncate flex-1">{u}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Files */}
        <section data-testid="project-files">
          <div className="flex items-center justify-between mb-4">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500">
              {t.project_detail.files}
            </div>
            {isAdmin && (
              <>
                <input ref={fileRef} type="file" hidden onChange={onUpload} data-testid="file-input" accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg" />
                <button
                  onClick={onPickFile}
                  disabled={uploading}
                  data-testid="upload-btn"
                  className="inline-flex items-center gap-2 px-4 h-9 border border-white/10 hover:border-[#C9A063] hover:text-[#C9A063] text-zinc-300 text-xs font-mono tracking-wider uppercase transition-colors disabled:opacity-50"
                >
                  <Upload size={12} />
                  {uploading ? t.project_detail.uploading : t.project_detail.upload}
                </button>
              </>
            )}
          </div>
          {(p.files || []).length === 0 ? (
            <div className="border border-white/10 bg-white/[0.02] py-12 text-center text-sm text-zinc-500">
              {t.project_detail.no_files}
            </div>
          ) : (
            <div className="border border-white/10 divide-y divide-white/5">
              {p.files.map((f) => (
                <div key={f.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors" data-testid={`file-row-${f.id}`}>
                  <FileText size={16} className="text-[#C9A063] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{f.filename}</div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      {(f.size / 1024).toFixed(1)} KB · {new Date(f.uploaded_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => download(f)}
                    title={t.project_detail.download}
                    data-testid={`download-${f.id}`}
                    className="w-9 h-9 flex items-center justify-center border border-white/10 text-zinc-300 hover:text-[#C9A063] hover:border-[#C9A063] transition-colors"
                  >
                    <Download size={14} />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => delFile(f.id)}
                      title={t.project_detail.delete_file}
                      data-testid={`delete-file-${f.id}`}
                      className="w-9 h-9 flex items-center justify-center border border-white/10 text-zinc-400 hover:text-red-300 hover:border-red-400/50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};

const MetaLine = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">{label}</span>
    <span className="text-sm text-white text-right truncate">{value}</span>
  </div>
);
