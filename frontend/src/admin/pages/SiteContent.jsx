import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Pencil, Trash2, Award, Quote, Users as UsersIcon,
  Handshake, MapPin, Save, X, Upload, Image as ImageIcon, GripVertical, EyeOff, Eye,
  Hammer,
} from "lucide-react";
import { toast } from "sonner";
import { api, API_BASE, formatApiError } from "../apiClient";
import { useLang } from "../../i18n/LangContext";
import { AdminLayout } from "../AdminLayout";

/**
 * Admin CMS page — manages all editable site content in one tabbed view:
 *   • Certifications (with image upload)
 *   • Case Studies
 *   • Client Groups (industry-grouped customer roster)
 *   • Partners (ABB / Rittal / Rockwell ...)
 *   • Contact Info (singleton — phone / address / emails)
 */

const TABS_CN = {
  certifications: "认证证书",
  "case-studies": "案例研究",
  "client-groups": "客户名单",
  partners: "合作伙伴",
  stats: "数字见证",
  "engineering-images": "工程能力图",
  contact: "联系信息",
};
const TABS_EN = {
  certifications: "Certifications",
  "case-studies": "Case Studies",
  "client-groups": "Client Groups",
  partners: "Partners",
  stats: "Stats",
  "engineering-images": "Engineering Imgs",
  contact: "Contact Info",
};

const TAB_ICONS = {
  certifications: Award,
  "case-studies": Quote,
  "client-groups": UsersIcon,
  partners: Handshake,
  stats: Award,
  "engineering-images": Hammer,
  contact: MapPin,
};

export const SiteContentAdmin = () => {
  const { lang } = useLang();
  const T = lang === "cn" ? TABS_CN : TABS_EN;
  const [active, setActive] = useState("certifications");

  return (
    <AdminLayout>
      <div data-testid="cms-root">
      <header className="mb-10">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-2">
          {lang === "cn" ? "内容管理" : "Content Management"}
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          {lang === "cn" ? "站点内容 CMS" : "Site Content CMS"}
        </h1>
        <p className="text-sm text-zinc-400 mt-3 max-w-2xl leading-relaxed">
          {lang === "cn"
            ? "在此管理网站上展示的认证证书、案例研究、客户名单、合作伙伴与联系信息。修改将立即反映到公开页面。"
            : "Manage certifications, case studies, client roster, partners and contact info shown on the public site. Changes go live immediately."}
        </p>
      </header>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-px bg-white/10 border border-white/10 mb-8" data-testid="cms-tabs">
        {Object.entries(T).map(([key, label]) => {
          const Icon = TAB_ICONS[key];
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              data-testid={`cms-tab-${key}`}
              className={`flex items-center gap-2 px-5 h-12 text-sm font-medium tracking-wide transition-colors ${
                isActive
                  ? "bg-[#0F6B3F]/20 text-white border-b-2 border-[#C9A063]"
                  : "bg-[#0A0A0A] text-zinc-400 hover:text-white hover:bg-[#101010] border-b-2 border-transparent"
              }`}
            >
              <Icon size={15} strokeWidth={1.7} />
              {label}
            </button>
          );
        })}
      </div>

      {active === "certifications" && <CertificationsTab />}
      {active === "case-studies" && <CaseStudiesTab />}
      {active === "client-groups" && <ClientGroupsTab />}
      {active === "partners" && <PartnersTab />}
      {active === "stats" && <StatsTab />}
      {active === "engineering-images" && <EngineeringImagesTab />}
      {active === "contact" && <ContactInfoTab />}
      </div>
    </AdminLayout>
  );
};

// -------------------- Shared bits --------------------
const Section = ({ children, className = "" }) => (
  <div className={`bg-[#070707] border border-white/10 ${className}`}>{children}</div>
);

const PrimaryBtn = ({ onClick, children, testId, type = "button", disabled }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    data-testid={testId}
    className="inline-flex items-center gap-2 h-10 px-5 bg-[#0F6B3F] hover:bg-[#1A8A52] text-white text-sm font-semibold tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);
const GhostBtn = ({ onClick, children, testId }) => (
  <button
    onClick={onClick}
    data-testid={testId}
    className="inline-flex items-center gap-2 h-10 px-4 border border-white/10 hover:border-[#C9A063] text-zinc-300 hover:text-white text-sm transition-colors"
  >
    {children}
  </button>
);

const TextField = ({ label, value, onChange, placeholder, testId, multiline, rows = 3 }) => (
  <label className="flex flex-col gap-1.5 text-sm">
    <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500">{label}</span>
    {multiline ? (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        rows={rows}
        className="bg-[#0A0A0A] border border-white/10 focus:border-[#C9A063] outline-none px-3 py-2 text-white text-sm transition-colors resize-y"
      />
    ) : (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        className="bg-[#0A0A0A] border border-white/10 focus:border-[#C9A063] outline-none h-10 px-3 text-white text-sm transition-colors"
      />
    )}
  </label>
);

const RowToolbar = ({ enabled, onToggle, onEdit, onDelete, testIdBase }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={onToggle}
      title={enabled ? "Hide" : "Show"}
      data-testid={`${testIdBase}-toggle`}
      className="w-9 h-9 flex items-center justify-center border border-white/10 hover:border-[#C9A063] text-zinc-400 hover:text-[#C9A063] transition-colors"
    >
      {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
    </button>
    <button
      onClick={onEdit}
      title="Edit"
      data-testid={`${testIdBase}-edit`}
      className="w-9 h-9 flex items-center justify-center border border-white/10 hover:border-[#C9A063] text-zinc-400 hover:text-[#C9A063] transition-colors"
    >
      <Pencil size={14} />
    </button>
    <button
      onClick={onDelete}
      title="Delete"
      data-testid={`${testIdBase}-delete`}
      className="w-9 h-9 flex items-center justify-center border border-white/10 hover:border-red-500 text-zinc-400 hover:text-red-500 transition-colors"
    >
      <Trash2 size={14} />
    </button>
  </div>
);

// -------------------- Certifications --------------------
const CertificationsTab = () => {
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // item or {} for new

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/site/certifications/admin");
      setItems(data);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm(lang === "cn" ? "确认删除此证书？" : "Delete this certification?")) return;
    try {
      await api.delete(`/site/certifications/${id}`);
      toast.success(lang === "cn" ? "已删除" : "Deleted");
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const toggle = async (it) => {
    try {
      const fd = new FormData();
      fd.append("enabled", String(!it.enabled));
      await api.patch(`/site/certifications/${it.id}`, fd);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-zinc-400">
          {loading ? "…" : `${items.length} ${lang === "cn" ? "条" : "items"}`}
        </div>
        <PrimaryBtn onClick={() => setEditing({})} testId="cert-new-btn">
          <Plus size={15} /> {lang === "cn" ? "新增证书" : "New certification"}
        </PrimaryBtn>
      </div>

      <Section>
        {items.map((it, i) => (
          <div
            key={it.id}
            className={`flex flex-col md:flex-row md:items-center gap-4 p-5 ${
              i !== items.length - 1 ? "border-b border-white/5" : ""
            } ${!it.enabled ? "opacity-60" : ""}`}
            data-testid={`cert-row-${it.id}`}
          >
            <div className="w-12 h-16 bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
              {it.image_url ? (
                <img src={`${API_BASE}${it.image_url.replace("/api", "")}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={18} className="text-zinc-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-1">
                {String(it.order || 0).padStart(2, "0")} · {it.code}
              </div>
              <div className="font-heading font-bold text-white">{lang === "cn" ? it.title_cn : it.title_en}</div>
              <div className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                {lang === "cn" ? it.description_cn : it.description_en}
              </div>
            </div>
            <RowToolbar
              enabled={it.enabled}
              onToggle={() => toggle(it)}
              onEdit={() => setEditing(it)}
              onDelete={() => remove(it.id)}
              testIdBase={`cert-${it.id}`}
            />
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="p-10 text-center text-zinc-500 text-sm">
            {lang === "cn" ? "暂无证书。点击右上角新增。" : "No certifications. Click New certification."}
          </div>
        )}
      </Section>

      {editing && (
        <CertificationEditor
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </>
  );
};

const CertificationEditor = ({ item, onClose, onSaved }) => {
  const { lang } = useLang();
  const isNew = !item.id;
  const [form, setForm] = useState({
    code: item.code || "",
    title_en: item.title_en || "",
    title_cn: item.title_cn || "",
    description_en: item.description_en || "",
    description_cn: item.description_cn || "",
    order: item.order ?? 0,
    enabled: item.enabled !== false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (imageFile) fd.append("image", imageFile);
      if (isNew) {
        await api.post("/site/certifications", fd);
      } else {
        await api.patch(`/site/certifications/${item.id}`, fd);
      }
      toast.success(lang === "cn" ? "已保存" : "Saved");
      onSaved();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="cert-editor">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0A0A0A]">
          <h3 className="font-heading text-lg font-bold">
            {isNew ? (lang === "cn" ? "新增证书" : "New certification") : (lang === "cn" ? "编辑证书" : "Edit certification")}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="cert-editor-close"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} placeholder="ISO 9001:2015" testId="cert-f-code" />
          <TextField label="Order" value={form.order} onChange={(v) => setForm({ ...form, order: parseInt(v) || 0 })} testId="cert-f-order" />
          <TextField label="Title (EN)" value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} testId="cert-f-title-en" />
          <TextField label="Title (中文)" value={form.title_cn} onChange={(v) => setForm({ ...form, title_cn: v })} testId="cert-f-title-cn" />
          <div className="sm:col-span-2">
            <TextField label="Description (EN)" multiline value={form.description_en} onChange={(v) => setForm({ ...form, description_en: v })} testId="cert-f-desc-en" />
          </div>
          <div className="sm:col-span-2">
            <TextField label="描述 (中文)" multiline value={form.description_cn} onChange={(v) => setForm({ ...form, description_cn: v })} testId="cert-f-desc-cn" />
          </div>
          <div className="sm:col-span-2 flex flex-col gap-2">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500">
              {lang === "cn" ? "证书图片(可选,JPG/PNG/PDF/WEBP)" : "Image (optional · JPG/PNG/PDF/WEBP)"}
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="inline-flex items-center gap-2 h-10 px-4 border border-white/10 hover:border-[#C9A063] text-zinc-300 text-sm transition-colors">
                <Upload size={14} /> {lang === "cn" ? "选择文件" : "Choose file"}
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="hidden"
                data-testid="cert-f-image"
              />
              <span className="text-xs text-zinc-500">
                {imageFile ? imageFile.name : (item.image_url ? (lang === "cn" ? "保留现有图片" : "Keep existing") : (lang === "cn" ? "未选择" : "None"))}
              </span>
            </label>
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              data-testid="cert-f-enabled"
              className="w-4 h-4 accent-[#0F6B3F]"
            />
            {lang === "cn" ? "在网站上显示" : "Visible on the site"}
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
          <GhostBtn onClick={onClose} testId="cert-cancel">{lang === "cn" ? "取消" : "Cancel"}</GhostBtn>
          <PrimaryBtn onClick={save} disabled={saving} testId="cert-save">
            <Save size={14} /> {saving ? (lang === "cn" ? "保存中…" : "Saving…") : (lang === "cn" ? "保存" : "Save")}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
};

// -------------------- Case Studies --------------------
const CaseStudiesTab = () => {
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/site/case-studies/admin");
      setItems(data);
    } catch (err) { toast.error(formatApiError(err)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm(lang === "cn" ? "确认删除此案例？" : "Delete this case study?")) return;
    try { await api.delete(`/site/case-studies/${id}`); toast.success(lang === "cn" ? "已删除" : "Deleted"); load(); } catch (err) { toast.error(formatApiError(err)); }
  };
  const toggle = async (it) => {
    try { await api.patch(`/site/case-studies/${it.id}`, { enabled: !it.enabled }); load(); } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-zinc-400">{loading ? "…" : `${items.length} ${lang === "cn" ? "条" : "items"}`}</div>
        <PrimaryBtn onClick={() => setEditing({})} testId="case-new-btn"><Plus size={15} /> {lang === "cn" ? "新增案例" : "New case study"}</PrimaryBtn>
      </div>
      <Section>
        {items.map((it, i) => (
          <div key={it.id} className={`p-5 ${i !== items.length - 1 ? "border-b border-white/5" : ""} ${!it.enabled ? "opacity-60" : ""}`} data-testid={`case-row-${it.id}`}>
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-1">
                  {String(it.order || 0).padStart(2, "0")} · {lang === "cn" ? it.industry_cn : it.industry_en}
                </div>
                <blockquote className="font-heading text-sm text-zinc-200 italic line-clamp-2 mb-1">"{lang === "cn" ? it.quote_cn : it.quote_en}"</blockquote>
                <div className="text-xs text-zinc-500">— {lang === "cn" ? it.author_cn : it.author_en} · {lang === "cn" ? it.metric_cn : it.metric_en}</div>
              </div>
              <RowToolbar enabled={it.enabled} onToggle={() => toggle(it)} onEdit={() => setEditing(it)} onDelete={() => remove(it.id)} testIdBase={`case-${it.id}`} />
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && <div className="p-10 text-center text-zinc-500 text-sm">{lang === "cn" ? "暂无案例" : "No case studies"}</div>}
      </Section>
      {editing && <CaseStudyEditor item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
};

const CaseStudyEditor = ({ item, onClose, onSaved }) => {
  const { lang } = useLang();
  const isNew = !item.id;
  const [form, setForm] = useState({
    industry_en: item.industry_en || "", industry_cn: item.industry_cn || "",
    quote_en: item.quote_en || "", quote_cn: item.quote_cn || "",
    author_en: item.author_en || "", author_cn: item.author_cn || "",
    metric_en: item.metric_en || "", metric_cn: item.metric_cn || "",
    order: item.order ?? 0, enabled: item.enabled !== false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) await api.post("/site/case-studies", form);
      else await api.patch(`/site/case-studies/${item.id}`, form);
      toast.success(lang === "cn" ? "已保存" : "Saved"); onSaved();
    } catch (err) { toast.error(formatApiError(err)); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="case-editor">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0A0A0A]">
          <h3 className="font-heading text-lg font-bold">{isNew ? (lang === "cn" ? "新增案例" : "New case study") : (lang === "cn" ? "编辑案例" : "Edit case study")}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="case-editor-close"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Industry (EN)" value={form.industry_en} onChange={(v) => setForm({ ...form, industry_en: v })} placeholder="Power Generation · V-POWER Singapore" testId="case-f-industry-en" />
          <TextField label="行业 (中文)" value={form.industry_cn} onChange={(v) => setForm({ ...form, industry_cn: v })} placeholder="电力生产 · V-POWER 新加坡" testId="case-f-industry-cn" />
          <div className="sm:col-span-2"><TextField label="Quote (EN)" multiline value={form.quote_en} onChange={(v) => setForm({ ...form, quote_en: v })} testId="case-f-quote-en" /></div>
          <div className="sm:col-span-2"><TextField label="引言 (中文)" multiline value={form.quote_cn} onChange={(v) => setForm({ ...form, quote_cn: v })} testId="case-f-quote-cn" /></div>
          <TextField label="Author (EN)" value={form.author_en} onChange={(v) => setForm({ ...form, author_en: v })} testId="case-f-author-en" />
          <TextField label="作者 (中文)" value={form.author_cn} onChange={(v) => setForm({ ...form, author_cn: v })} testId="case-f-author-cn" />
          <TextField label="Metric (EN)" value={form.metric_en} onChange={(v) => setForm({ ...form, metric_en: v })} testId="case-f-metric-en" />
          <TextField label="指标 (中文)" value={form.metric_cn} onChange={(v) => setForm({ ...form, metric_cn: v })} testId="case-f-metric-cn" />
          <TextField label="Order" value={form.order} onChange={(v) => setForm({ ...form, order: parseInt(v) || 0 })} testId="case-f-order" />
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer h-10 mt-6">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} data-testid="case-f-enabled" className="w-4 h-4 accent-[#0F6B3F]" />
            {lang === "cn" ? "在网站上显示" : "Visible on the site"}
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
          <GhostBtn onClick={onClose} testId="case-cancel">{lang === "cn" ? "取消" : "Cancel"}</GhostBtn>
          <PrimaryBtn onClick={save} disabled={saving} testId="case-save"><Save size={14} /> {saving ? "…" : (lang === "cn" ? "保存" : "Save")}</PrimaryBtn>
        </div>
      </div>
    </div>
  );
};

// -------------------- Client Groups --------------------
const ClientGroupsTab = () => {
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/site/client-groups/admin"); setItems(data); }
    catch (err) { toast.error(formatApiError(err)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm(lang === "cn" ? "确认删除此客户组？" : "Delete this group?")) return;
    try { await api.delete(`/site/client-groups/${id}`); load(); } catch (err) { toast.error(formatApiError(err)); }
  };
  const toggle = async (it) => {
    try { await api.patch(`/site/client-groups/${it.id}`, { enabled: !it.enabled }); load(); } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-zinc-400">{loading ? "…" : `${items.length} ${lang === "cn" ? "组" : "groups"}`}</div>
        <PrimaryBtn onClick={() => setEditing({})} testId="cg-new-btn"><Plus size={15} /> {lang === "cn" ? "新增客户组" : "New group"}</PrimaryBtn>
      </div>
      <Section>
        {items.map((it, i) => (
          <div key={it.id} className={`p-5 ${i !== items.length - 1 ? "border-b border-white/5" : ""} ${!it.enabled ? "opacity-60" : ""}`} data-testid={`cg-row-${it.id}`}>
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-1">{String(it.order || 0).padStart(2, "0")} · {lang === "cn" ? it.label_cn : it.label_en}</div>
                <div className="text-sm text-zinc-300 line-clamp-2">{(it.items || []).join(" · ")}</div>
              </div>
              <RowToolbar enabled={it.enabled} onToggle={() => toggle(it)} onEdit={() => setEditing(it)} onDelete={() => remove(it.id)} testIdBase={`cg-${it.id}`} />
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && <div className="p-10 text-center text-zinc-500 text-sm">{lang === "cn" ? "暂无客户组" : "No client groups"}</div>}
      </Section>
      {editing && <ClientGroupEditor item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
};

const ClientGroupEditor = ({ item, onClose, onSaved }) => {
  const { lang } = useLang();
  const isNew = !item.id;
  const [form, setForm] = useState({
    label_en: item.label_en || "", label_cn: item.label_cn || "",
    items_text: (item.items || []).join("\n"),
    order: item.order ?? 0, enabled: item.enabled !== false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        label_en: form.label_en, label_cn: form.label_cn,
        items: form.items_text.split("\n").map((s) => s.trim()).filter(Boolean),
        order: form.order, enabled: form.enabled,
      };
      if (isNew) await api.post("/site/client-groups", payload);
      else await api.patch(`/site/client-groups/${item.id}`, payload);
      toast.success(lang === "cn" ? "已保存" : "Saved"); onSaved();
    } catch (err) { toast.error(formatApiError(err)); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="cg-editor">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0A0A0A]">
          <h3 className="font-heading text-lg font-bold">{isNew ? (lang === "cn" ? "新增客户组" : "New group") : (lang === "cn" ? "编辑客户组" : "Edit group")}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="cg-editor-close"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Label (EN)" value={form.label_en} onChange={(v) => setForm({ ...form, label_en: v })} testId="cg-f-label-en" />
          <TextField label="标签 (中文)" value={form.label_cn} onChange={(v) => setForm({ ...form, label_cn: v })} testId="cg-f-label-cn" />
          <TextField label="Order" value={form.order} onChange={(v) => setForm({ ...form, order: parseInt(v) || 0 })} testId="cg-f-order" />
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer h-10 mt-6">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} data-testid="cg-f-enabled" className="w-4 h-4 accent-[#0F6B3F]" />
            {lang === "cn" ? "在网站上显示" : "Visible"}
          </label>
          <div className="sm:col-span-2">
            <TextField label={lang === "cn" ? "客户列表(每行一个客户)" : "Customers (one per line)"} multiline rows={8} value={form.items_text} onChange={(v) => setForm({ ...form, items_text: v })} placeholder={lang === "cn" ? "固铂 / Goodyear(美国)\n倍耐力 Pirelli\n..." : "Goodyear (USA)\nPirelli\n..."} testId="cg-f-items" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
          <GhostBtn onClick={onClose} testId="cg-cancel">{lang === "cn" ? "取消" : "Cancel"}</GhostBtn>
          <PrimaryBtn onClick={save} disabled={saving} testId="cg-save"><Save size={14} /> {saving ? "…" : (lang === "cn" ? "保存" : "Save")}</PrimaryBtn>
        </div>
      </div>
    </div>
  );
};

// -------------------- Partners --------------------
const PartnersTab = () => {
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/site/partners/admin"); setItems(data); }
    catch (err) { toast.error(formatApiError(err)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm(lang === "cn" ? "确认删除？" : "Delete?")) return;
    try { await api.delete(`/site/partners/${id}`); load(); } catch (err) { toast.error(formatApiError(err)); }
  };
  const toggle = async (it) => {
    try { await api.patch(`/site/partners/${it.id}`, { enabled: !it.enabled }); load(); } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-zinc-400">{loading ? "…" : `${items.length} ${lang === "cn" ? "个" : "items"}`}</div>
        <PrimaryBtn onClick={() => setEditing({})} testId="partner-new-btn"><Plus size={15} /> {lang === "cn" ? "新增合作伙伴" : "New partner"}</PrimaryBtn>
      </div>
      <Section>
        {items.map((it, i) => (
          <div key={it.id} className={`flex items-center gap-4 p-5 ${i !== items.length - 1 ? "border-b border-white/5" : ""} ${!it.enabled ? "opacity-60" : ""}`} data-testid={`partner-row-${it.id}`}>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-1">{String(it.order || 0).padStart(2, "0")}</div>
              <div className="font-heading font-bold text-white">{it.name}</div>
              <div className="text-xs text-zinc-500">{lang === "cn" ? it.role_cn : it.role_en}</div>
            </div>
            <RowToolbar enabled={it.enabled} onToggle={() => toggle(it)} onEdit={() => setEditing(it)} onDelete={() => remove(it.id)} testIdBase={`partner-${it.id}`} />
          </div>
        ))}
        {!loading && items.length === 0 && <div className="p-10 text-center text-zinc-500 text-sm">{lang === "cn" ? "暂无合作伙伴" : "No partners"}</div>}
      </Section>
      {editing && <PartnerEditor item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
};

const PartnerEditor = ({ item, onClose, onSaved }) => {
  const { lang } = useLang();
  const isNew = !item.id;
  const [form, setForm] = useState({
    name: item.name || "", role_en: item.role_en || "", role_cn: item.role_cn || "",
    order: item.order ?? 0, enabled: item.enabled !== false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) await api.post("/site/partners", form);
      else await api.patch(`/site/partners/${item.id}`, form);
      toast.success(lang === "cn" ? "已保存" : "Saved"); onSaved();
    } catch (err) { toast.error(formatApiError(err)); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-xl" data-testid="partner-editor">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-heading text-lg font-bold">{isNew ? (lang === "cn" ? "新增合作伙伴" : "New partner") : (lang === "cn" ? "编辑合作伙伴" : "Edit partner")}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="partner-editor-close"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><TextField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} testId="partner-f-name" placeholder="ABB" /></div>
          <TextField label="Role (EN)" value={form.role_en} onChange={(v) => setForm({ ...form, role_en: v })} placeholder="Authorized Manufacturer · 2007" testId="partner-f-role-en" />
          <TextField label="角色 (中文)" value={form.role_cn} onChange={(v) => setForm({ ...form, role_cn: v })} placeholder="授权制造商 · 2007" testId="partner-f-role-cn" />
          <TextField label="Order" value={form.order} onChange={(v) => setForm({ ...form, order: parseInt(v) || 0 })} testId="partner-f-order" />
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer h-10 mt-6">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} data-testid="partner-f-enabled" className="w-4 h-4 accent-[#0F6B3F]" />
            {lang === "cn" ? "在网站上显示" : "Visible"}
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
          <GhostBtn onClick={onClose} testId="partner-cancel">{lang === "cn" ? "取消" : "Cancel"}</GhostBtn>
          <PrimaryBtn onClick={save} disabled={saving} testId="partner-save"><Save size={14} /> {saving ? "…" : (lang === "cn" ? "保存" : "Save")}</PrimaryBtn>
        </div>
      </div>
    </div>
  );
};

// -------------------- Stats --------------------
const StatsTab = () => {
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/site/stats/admin"); setItems(data); }
    catch (err) { toast.error(formatApiError(err)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm(lang === "cn" ? "确认删除？" : "Delete?")) return;
    try { await api.delete(`/site/stats/${id}`); load(); } catch (err) { toast.error(formatApiError(err)); }
  };
  const toggle = async (it) => {
    try { await api.patch(`/site/stats/${it.id}`, { enabled: !it.enabled }); load(); } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-zinc-400">{loading ? "…" : `${items.length} ${lang === "cn" ? "项" : "items"}`}</div>
        <PrimaryBtn onClick={() => setEditing({})} testId="stat-new-btn"><Plus size={15} /> {lang === "cn" ? "新增数字" : "New stat"}</PrimaryBtn>
      </div>
      <Section>
        {items.map((it, i) => (
          <div key={it.id} className={`flex items-center gap-6 p-5 ${i !== items.length - 1 ? "border-b border-white/5" : ""} ${!it.enabled ? "opacity-60" : ""}`} data-testid={`stat-row-${it.id}`}>
            <div className="font-heading text-4xl font-bold text-[#C9A063] tracking-tighter min-w-[100px]">{it.value}</div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500 mb-1">{String(it.order || 0).padStart(2, "0")}</div>
              <div className="text-sm text-white">{lang === "cn" ? it.label_cn : it.label_en}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{lang === "cn" ? it.label_en : it.label_cn}</div>
            </div>
            <RowToolbar enabled={it.enabled} onToggle={() => toggle(it)} onEdit={() => setEditing(it)} onDelete={() => remove(it.id)} testIdBase={`stat-${it.id}`} />
          </div>
        ))}
        {!loading && items.length === 0 && <div className="p-10 text-center text-zinc-500 text-sm">{lang === "cn" ? "暂无数据" : "No stats"}</div>}
      </Section>
      {editing && <StatEditor item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
};

const StatEditor = ({ item, onClose, onSaved }) => {
  const { lang } = useLang();
  const isNew = !item.id;
  const [form, setForm] = useState({
    value: item.value || "", label_en: item.label_en || "", label_cn: item.label_cn || "",
    order: item.order ?? 0, enabled: item.enabled !== false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) await api.post("/site/stats", form);
      else await api.patch(`/site/stats/${item.id}`, form);
      toast.success(lang === "cn" ? "已保存" : "Saved"); onSaved();
    } catch (err) { toast.error(formatApiError(err)); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-xl" data-testid="stat-editor">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-heading text-lg font-bold">{isNew ? (lang === "cn" ? "新增数字" : "New stat") : (lang === "cn" ? "编辑数字" : "Edit stat")}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="stat-editor-close"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label={lang === "cn" ? "数值 (如 20 · 27+ · 3,000+)" : "Value (e.g. 20 · 27+ · 3,000+)"} value={form.value} onChange={(v) => setForm({ ...form, value: v })} testId="stat-f-value" placeholder="3,000+" />
          <TextField label="Order" value={form.order} onChange={(v) => setForm({ ...form, order: parseInt(v) || 0 })} testId="stat-f-order" />
          <TextField label="Label (EN)" value={form.label_en} onChange={(v) => setForm({ ...form, label_en: v })} testId="stat-f-label-en" placeholder="Tons Shipped Annually" />
          <TextField label="标签 (中文)" value={form.label_cn} onChange={(v) => setForm({ ...form, label_cn: v })} testId="stat-f-label-cn" placeholder="年出货量 (吨)" />
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} data-testid="stat-f-enabled" className="w-4 h-4 accent-[#0F6B3F]" />
            {lang === "cn" ? "在网站上显示" : "Visible"}
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
          <GhostBtn onClick={onClose} testId="stat-cancel">{lang === "cn" ? "取消" : "Cancel"}</GhostBtn>
          <PrimaryBtn onClick={save} disabled={saving} testId="stat-save"><Save size={14} /> {saving ? "…" : (lang === "cn" ? "保存" : "Save")}</PrimaryBtn>
        </div>
      </div>
    </div>
  );
};

// -------------------- Contact Info --------------------
const ContactInfoTab = () => {
  const { lang } = useLang();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const { data } = await api.get("/site/contact-info"); setForm(data); }
    catch (err) { toast.error(formatApiError(err)); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { updated_at, ...payload } = form || {};
      await api.put("/site/contact-info", payload);
      toast.success(lang === "cn" ? "已保存" : "Saved"); load();
    } catch (err) { toast.error(formatApiError(err)); } finally { setSaving(false); }
  };

  if (!form) return <div className="text-sm text-zinc-500">…</div>;

  return (
    <Section className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="contact-form">
        <div className="sm:col-span-2">
          <TextField label="Address (EN)" multiline value={form.address_en} onChange={(v) => setForm({ ...form, address_en: v })} testId="contact-f-address-en" />
        </div>
        <div className="sm:col-span-2">
          <TextField label="地址 (中文)" multiline value={form.address_cn} onChange={(v) => setForm({ ...form, address_cn: v })} testId="contact-f-address-cn" />
        </div>
        <TextField label={lang === "cn" ? "电话" : "Phone"} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} testId="contact-f-phone" placeholder="+86 512 5790 0000" />
        <TextField label={lang === "cn" ? "微信号" : "WeChat handle"} value={form.wechat_handle} onChange={(v) => setForm({ ...form, wechat_handle: v })} testId="contact-f-wechat" />
        <TextField label={lang === "cn" ? "销售邮箱" : "Sales email"} value={form.email_sales} onChange={(v) => setForm({ ...form, email_sales: v })} placeholder="sales@topchampion.cn" testId="contact-f-email-sales" />
        <TextField label={lang === "cn" ? "招聘邮箱" : "Careers email"} value={form.email_careers} onChange={(v) => setForm({ ...form, email_careers: v })} placeholder="careers@topchampion.cn" testId="contact-f-email-careers" />
        <TextField label={lang === "cn" ? "隐私邮箱" : "Privacy email"} value={form.email_privacy} onChange={(v) => setForm({ ...form, email_privacy: v })} placeholder="privacy@topchampion.cn" testId="contact-f-email-privacy" />
      </div>
      <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-white/10">
        <PrimaryBtn onClick={save} disabled={saving} testId="contact-save">
          <Save size={14} /> {saving ? "…" : (lang === "cn" ? "保存" : "Save")}
        </PrimaryBtn>
      </div>
    </Section>
  );
};


// -------------------- Engineering Images (carousel on /engineering) --------------------
const EngineeringImagesTab = () => {
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/site/engineering-images/admin"); setItems(data); }
    catch (err) { toast.error(formatApiError(err)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm(lang === "cn" ? "确认删除此图片？" : "Delete this image?")) return;
    try { await api.delete(`/site/engineering-images/${id}`); toast.success(lang === "cn" ? "已删除" : "Deleted"); load(); }
    catch (err) { toast.error(formatApiError(err)); }
  };

  const toggle = async (it) => {
    try {
      const fd = new FormData();
      fd.append("enabled", String(!it.enabled));
      await api.patch(`/site/engineering-images/${it.id}`, fd);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-zinc-400">{loading ? "…" : `${items.length} ${lang === "cn" ? "张图片" : "images"}`}</div>
        <PrimaryBtn onClick={() => setEditing({})} testId="eng-new-btn">
          <Plus size={15} /> {lang === "cn" ? "新增图片" : "New image"}
        </PrimaryBtn>
      </div>
      <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
        {lang === "cn"
          ? "这些图片将在 /engineering 工程能力页底部自动滚动展示。按 Order 字段排序(数字越小越靠前)。"
          : "Shown in the auto-scrolling carousel at the bottom of the /engineering page, ordered by the Order field (lowest first)."}
      </p>

      <Section>
        {items.map((it, i) => (
          <div
            key={it.id}
            className={`flex flex-col md:flex-row md:items-center gap-4 p-5 ${i !== items.length - 1 ? "border-b border-white/5" : ""} ${!it.enabled ? "opacity-60" : ""}`}
            data-testid={`eng-row-${it.id}`}
          >
            <div className="w-32 h-20 bg-white/5 overflow-hidden shrink-0">
              <img src={`${API_BASE}${it.image_url.replace("/api", "")}`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-1">
                {String(it.order || 0).padStart(2, "0")}
              </div>
              <div className="text-sm text-white">{lang === "cn" ? (it.caption_cn || "—") : (it.caption_en || "—")}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{lang === "cn" ? (it.caption_en || "") : (it.caption_cn || "")}</div>
            </div>
            <RowToolbar enabled={it.enabled} onToggle={() => toggle(it)} onEdit={() => setEditing(it)} onDelete={() => remove(it.id)} testIdBase={`eng-${it.id}`} />
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="p-10 text-center text-zinc-500 text-sm">
            {lang === "cn" ? "暂无图片。点击右上角新增。" : "No images. Click New image."}
          </div>
        )}
      </Section>

      {editing && (
        <EngineeringImageEditor
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </>
  );
};

const EngineeringImageEditor = ({ item, onClose, onSaved }) => {
  const { lang } = useLang();
  const isNew = !item.id;
  const [form, setForm] = useState({
    caption_en: item.caption_en || "",
    caption_cn: item.caption_cn || "",
    order: item.order ?? 0,
    enabled: item.enabled !== false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (isNew && !imageFile) {
      toast.error(lang === "cn" ? "请选择一张图片" : "Please choose an image");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (imageFile) fd.append("image", imageFile);
      if (isNew) await api.post("/site/engineering-images", fd);
      else await api.patch(`/site/engineering-images/${item.id}`, fd);
      toast.success(lang === "cn" ? "已保存" : "Saved");
      onSaved();
    } catch (err) { toast.error(formatApiError(err)); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="eng-editor">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0A0A0A]">
          <h3 className="font-heading text-lg font-bold">
            {isNew ? (lang === "cn" ? "新增工程图片" : "New engineering image") : (lang === "cn" ? "编辑工程图片" : "Edit engineering image")}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="eng-editor-close"><X size={18} /></button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><TextField label="Caption (EN)" value={form.caption_en} onChange={(v) => setForm({ ...form, caption_en: v })} testId="eng-f-cap-en" placeholder="ABB MNS-E assembly line — Kunshan factory" /></div>
          <div className="sm:col-span-2"><TextField label="说明 (中文)" value={form.caption_cn} onChange={(v) => setForm({ ...form, caption_cn: v })} testId="eng-f-cap-cn" placeholder="ABB MNS-E 总装产线 · 昆山工厂" /></div>
          <TextField label="Order" value={form.order} onChange={(v) => setForm({ ...form, order: parseInt(v) || 0 })} testId="eng-f-order" />
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer h-10 mt-6">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} data-testid="eng-f-enabled" className="w-4 h-4 accent-[#0F6B3F]" />
            {lang === "cn" ? "在网站上显示" : "Visible"}
          </label>
          <div className="sm:col-span-2 flex flex-col gap-2">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500">
              {lang === "cn" ? `图片 ${isNew ? "(必选)" : "(留空则保留)"} · JPG/PNG/WEBP` : `Image ${isNew ? "(required)" : "(leave empty to keep)"} · JPG/PNG/WEBP`}
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="inline-flex items-center gap-2 h-10 px-4 border border-white/10 hover:border-[#C9A063] text-zinc-300 text-sm transition-colors">
                <Upload size={14} /> {lang === "cn" ? "选择文件" : "Choose file"}
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="hidden"
                data-testid="eng-f-image"
              />
              <span className="text-xs text-zinc-500">
                {imageFile ? imageFile.name : (item.image_url ? (lang === "cn" ? "保留现有图片" : "Keep existing") : (lang === "cn" ? "未选择" : "None"))}
              </span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
          <GhostBtn onClick={onClose} testId="eng-cancel">{lang === "cn" ? "取消" : "Cancel"}</GhostBtn>
          <PrimaryBtn onClick={save} disabled={saving} testId="eng-save">
            <Save size={14} /> {saving ? (lang === "cn" ? "保存中…" : "Saving…") : (lang === "cn" ? "保存" : "Save")}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
};
