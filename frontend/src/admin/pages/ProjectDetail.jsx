import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../../i18n/LangContext";
import { adminI18n } from "../../i18n/admin";
import { api, formatApiError } from "../apiClient";
import { AdminLayout } from "../AdminLayout";
import { toast } from "sonner";
import { Pencil, Trash2, Upload, Download, FileText, FileCode2, FileImage, ExternalLink, Check, X, Megaphone } from "lucide-react";

export const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { lang } = useLang();
  const t = adminI18n[lang];
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null); // "drawing" | "code" | null
  const fileDrawRef = useRef(null);
  const fileCodeRef = useRef(null);
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

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const onUpload = (category) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(category);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);
      await api.post(`/projects/${id}/files`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(t.common.save_ok);
      load();
    } catch (e2) {
      toast.error(formatApiError(e2));
    } finally {
      setUploading(null);
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

  const renameFile = async (fid, newName) => {
    try {
      await api.patch(`/projects/${id}/files/${fid}`, { display_name: newName });
      toast.success(t.common.save_ok);
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

  // Toggle showcase from detail view (admin + user)
  const toggleShowcase = async () => {
    try {
      const next = !p.is_showcase;
      await api.patch(`/projects/${id}/showcase`, {
        is_showcase: next,
        showcase_industry: p.showcase_industry,
        showcase_quote: p.showcase_quote,
        showcase_author: p.showcase_author,
        showcase_metric: p.showcase_metric,
      });
      toast.success(t.common.save_ok);
      load();
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

  const files = p.files || [];
  const drawings = files.filter((f) => f.category !== "code");
  const codes = files.filter((f) => f.category === "code");
  const canShowcase = isAdmin || user?.role === "user";

  return (
    <AdminLayout>
      <div data-testid="project-detail-root">
        <Link to="/admin/projects" className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500 hover:text-white">
          {t.project_detail.back}
        </Link>

        <div className="flex items-start justify-between gap-6 mt-3 mb-10 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063]">
                {t.projects.status[p.status] || p.status}
              </span>
              {p.industry && <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500">· {t.projects.industries[p.industry]}</span>}
              {p.is_showcase && (
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.25em] uppercase text-[#1A8A52] border border-[#1A8A52]/40 bg-[#1A8A52]/10 px-2 py-1">
                  <Megaphone size={11} /> {t.project_detail.showcase_badge}
                </span>
              )}
            </div>
            <h1 className="font-heading text-4xl font-bold uppercase tracking-tight" data-testid="project-title">{p.name}</h1>
            {p.client_name && <p className="mt-2 text-zinc-400">{p.client_name}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canShowcase && (
              <button
                onClick={toggleShowcase}
                data-testid="toggle-showcase-btn"
                className={`inline-flex items-center gap-2 px-5 h-11 border text-sm font-medium uppercase tracking-wide transition-colors ${
                  p.is_showcase
                    ? "border-[#1A8A52]/50 text-[#1A8A52] hover:bg-[#1A8A52]/10"
                    : "border-white/10 text-zinc-300 hover:border-[#C9A063] hover:text-[#C9A063]"
                }`}
              >
                <Megaphone size={14} />
                {p.is_showcase ? t.project_detail.showcase_badge + " ✓" : t.project_detail.showcase_badge}
              </button>
            )}
            {isAdmin && (
              <>
                <Link to={`/admin/projects/${id}/edit`} data-testid="edit-project-btn" className="inline-flex items-center gap-2 px-5 h-11 border border-white/10 hover:border-[#C9A063] hover:text-[#C9A063] text-zinc-300 text-sm font-medium uppercase tracking-wide transition-colors">
                  <Pencil size={14} /> {t.projects.edit}
                </Link>
                <button onClick={delProject} data-testid="delete-project-btn" className="inline-flex items-center gap-2 px-5 h-11 border border-white/10 hover:border-red-400/50 hover:text-red-300 text-zinc-300 text-sm font-medium uppercase tracking-wide transition-colors">
                  <Trash2 size={14} /> {t.projects.delete}
                </button>
              </>
            )}
          </div>
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

        {/* Drawings section */}
        <FileSection
          title={t.project_detail.files_drawing}
          category="drawing"
          items={drawings}
          isAdmin={isAdmin}
          uploadLabel={t.project_detail.upload_drawing}
          uploading={uploading === "drawing"}
          uploadingLabel={t.project_detail.uploading}
          onPick={() => fileDrawRef.current?.click()}
          onDelete={delFile}
          onRename={renameFile}
          onDownload={download}
          t={t}
        />
        <input ref={fileDrawRef} type="file" hidden onChange={onUpload("drawing")} data-testid="file-input-drawing" accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg" />

        {/* Code section */}
        <div className="mt-12">
          <FileSection
            title={t.project_detail.files_code}
            category="code"
            items={codes}
            isAdmin={isAdmin}
            uploadLabel={t.project_detail.upload_code}
            uploading={uploading === "code"}
            uploadingLabel={t.project_detail.uploading}
            onPick={() => fileCodeRef.current?.click()}
            onDelete={delFile}
            onRename={renameFile}
            onDownload={download}
            t={t}
          />
        </div>
        <input ref={fileCodeRef} type="file" hidden onChange={onUpload("code")} data-testid="file-input-code" accept=".txt,.json,.xml,.yaml,.yml,.py,.js,.csv,.zip,.bin" />
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

const FileSection = ({ title, category, items, isAdmin, uploadLabel, uploading, uploadingLabel, onPick, onDelete, onRename, onDownload, t }) => (
  <section data-testid={`section-${category}`}>
    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
      <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500 flex items-center gap-3">
        {category === "code" ? <FileCode2 size={14} className="text-[#C9A063]" /> : <FileImage size={14} className="text-[#C9A063]" />}
        {title}
        <span className="text-zinc-600">·</span>
        <span className="text-zinc-400">{items.length}</span>
      </div>
      {isAdmin && (
        <button
          onClick={onPick}
          disabled={uploading}
          data-testid={`upload-${category}-btn`}
          className="inline-flex items-center gap-2 px-4 h-9 border border-white/10 hover:border-[#C9A063] hover:text-[#C9A063] text-zinc-300 text-xs font-mono tracking-wider uppercase transition-colors disabled:opacity-50"
        >
          <Upload size={12} />
          {uploading ? uploadingLabel : uploadLabel}
        </button>
      )}
    </div>

    {items.length === 0 ? (
      <div className="border border-white/10 bg-white/[0.02] py-10 text-center text-sm text-zinc-500">
        {t.project_detail.no_files}
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
        {items.map((f) => (
          <FileCard
            key={f.id}
            file={f}
            category={category}
            isAdmin={isAdmin}
            onDelete={() => onDelete(f.id)}
            onDownload={() => onDownload(f)}
            onRename={(name) => onRename(f.id, name)}
            t={t}
          />
        ))}
      </div>
    )}
  </section>
);

const FileCard = ({ file, category, isAdmin, onDelete, onDownload, onRename, t }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(file.display_name || "");
  const FallbackIcon = category === "code" ? FileCode2 : FileText;
  const showThumb = file.thumb_b64;

  const save = () => {
    onRename(val.trim());
    setEditing(false);
  };

  return (
    <div className="bg-[#0A0A0A] hover:bg-[#101010] flex flex-col transition-colors" data-testid={`file-card-${file.id}`}>
      {/* Thumbnail / icon area */}
      <div className="relative aspect-[16/10] bg-[#070707] border-b border-white/5 flex items-center justify-center overflow-hidden">
        {showThumb ? (
          <img src={file.thumb_b64} alt={file.filename} className="w-full h-full object-cover" />
        ) : (
          <FallbackIcon size={42} className="text-zinc-700" strokeWidth={1.5} />
        )}
        <span className="absolute top-2 left-2 font-mono text-[9px] tracking-[0.2em] uppercase bg-black/70 backdrop-blur-sm px-2 py-1 text-[#C9A063] border border-[#C9A063]/30">
          {category === "code" ? t.project_detail.file_cat_code : t.project_detail.file_cat_drawing}
        </span>
      </div>

      {/* Meta */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
              placeholder={t.project_detail.rename_placeholder}
              className="flex-1 bg-[#141414] border border-[#C9A063] text-white text-sm h-9 px-3 outline-none"
              data-testid={`rename-input-${file.id}`}
            />
            <button onClick={save} className="w-9 h-9 flex items-center justify-center border border-[#0F6B3F] bg-[#0F6B3F]/10 text-[#1A8A52]" data-testid={`rename-save-${file.id}`}>
              <Check size={14} />
            </button>
            <button onClick={() => setEditing(false)} className="w-9 h-9 flex items-center justify-center border border-white/10 text-zinc-400">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="text-sm text-white truncate font-medium" title={file.filename}>
            {file.display_name || file.filename}
          </div>
        )}
        <div className="text-[11px] font-mono text-zinc-500 truncate">
          {file.filename} · {(file.size / 1024).toFixed(1)} KB
        </div>

        <div className="flex items-center gap-2 mt-auto pt-2">
          <button
            onClick={onDownload}
            data-testid={`download-${file.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 h-9 border border-white/10 hover:border-[#C9A063] hover:text-[#C9A063] text-zinc-300 text-xs font-mono tracking-wider uppercase transition-colors"
          >
            <Download size={12} />
            {t.project_detail.download}
          </button>
          {isAdmin && !editing && (
            <>
              <button
                onClick={() => { setVal(file.display_name || ""); setEditing(true); }}
                title={t.project_detail.rename_file}
                data-testid={`rename-${file.id}`}
                className="w-9 h-9 flex items-center justify-center border border-white/10 text-zinc-400 hover:text-[#C9A063] hover:border-[#C9A063] transition-colors"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={onDelete}
                title={t.project_detail.delete_file}
                data-testid={`delete-file-${file.id}`}
                className="w-9 h-9 flex items-center justify-center border border-white/10 text-zinc-400 hover:text-red-300 hover:border-red-400/50 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
