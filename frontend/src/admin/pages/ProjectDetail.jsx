import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../../i18n/LangContext";
import { adminI18n } from "../../i18n/admin";
import { api, formatApiError } from "../apiClient";
import { AdminLayout } from "../AdminLayout";
import { toast } from "sonner";
import { Pencil, Trash2, Upload, Download, FileText, FileCode2, FileImage, Camera, ExternalLink, Check, X, Megaphone } from "lucide-react";

export const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { lang } = useLang();
  const t = adminI18n[lang];
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null); // "drawing" | "code" | "photo" | null
  const [advanceModal, setAdvanceModal] = useState(false);
  const fileDrawRef = useRef(null);
  const fileCodeRef = useRef(null);
  const filePhotoRef = useRef(null);
  // refs for new phase-bound categories
  const approvalRef = useRef(null);
  const designInRef = useRef(null);
  const designOutRef = useRef(null);
  const asBuiltRef = useRef(null);
  const prodPhotoRef = useRef(null);
  const inspRef = useRef(null);
  const isAdmin = user?.role === "admin";
  const canManageFiles = isAdmin || (user?.permissions || []).includes("manage_files");
  const canRequestAdvance = isAdmin || (user?.permissions || []).includes("edit_projects") || (user?.permissions || []).includes("view_progress");

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
  // Legacy categories (kept for backward compat)
  const photos = files.filter((f) => f.category === "photo");
  const drawings = files.filter((f) => f.category === "drawing");
  const codes = files.filter((f) => f.category === "code");
  // New phase-bound categories
  const approvalDrawings = files.filter((f) => f.category === "approval_drawing");
  const designInputs = files.filter((f) => f.category === "design_input");
  const designOutputs = files.filter((f) => f.category === "design_output");
  const asBuiltDrawings = files.filter((f) => f.category === "as_built_drawing");
  const productPhotos = files.filter((f) => f.category === "product_photo");
  const inspectionReports = files.filter((f) => f.category === "inspection_report");
  const canShowcase = isAdmin || user?.role === "user";

  const STATUS_FLOW = ["entry", "design", "procurement", "manufacturing", "testing", "shipping", "archived"];
  // Map legacy values defensively so existing pages keep working
  const LEGACY_TO_NEW = { draft: "entry", in_design: "design", in_production: "manufacturing", commissioning: "testing", delivered: "shipping" };
  const normalizedStatus = LEGACY_TO_NEW[p.status] || p.status || "entry";
  const currentStatusIdx = STATUS_FLOW.indexOf(normalizedStatus);
  const nextStatus = currentStatusIdx >= 0 && currentStatusIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentStatusIdx + 1] : null;

  const requestAdvance = async (toStatus, note) => {
    try {
      await api.post(`/projects/${id}/request-advance`, { to_status: toStatus, note });
      toast.success(lang === "cn" ? "已提交审核" : "Submitted for review");
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };
  const approveAdvance = async () => {
    try {
      await api.post(`/projects/${id}/approve-advance`, {});
      toast.success(lang === "cn" ? "已批准" : "Approved");
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };
  const rejectAdvance = async () => {
    try {
      await api.post(`/projects/${id}/reject-advance`, {});
      toast.success(lang === "cn" ? "已驳回" : "Rejected");
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  // Provision a customer login for this project (uses project.customer_email)
  const provisionCustomer = async () => {
    if (!p.customer_email) {
      toast.error(lang === "cn" ? "请先在项目设置中填写客户邮箱" : "Set customer_email in project settings first");
      return;
    }
    try {
      const { data } = await api.post(`/projects/${id}/customer-account`, {});
      // Show credentials inline so business can relay manually if Resend disabled
      const msg = data.email_sent
        ? (lang === "cn" ? `已创建账号并发送邮件至 ${data.email}` : `Account created and email sent to ${data.email}`)
        : (lang === "cn"
            ? `账号:${data.username} · 临时密码:${data.temporary_password}(邮件管道未配置)`
            : `Account: ${data.username} · Temp password: ${data.temporary_password} (email pipeline disabled)`);
      toast.success(msg, { duration: 12000 });
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  // Add/toggle a customer-supplied material entry
  const addMaterial = async (name, note = "") => {
    if (!name?.trim()) return;
    try {
      await api.post(`/projects/${id}/materials`, { name: name.trim(), note, supplied: false });
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  };
  const toggleMaterial = async (mat) => {
    try {
      await api.patch(`/projects/${id}/materials/${mat.id}`, { name: mat.name, note: mat.note || "", supplied: !mat.supplied });
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  };
  const deleteMaterial = async (mat) => {
    if (!window.confirm(lang === "cn" ? `确认删除甲供料"${mat.name}"?` : `Delete material "${mat.name}"?`)) return;
    try { await api.delete(`/projects/${id}/materials/${mat.id}`); load(); }
    catch (e) { toast.error(formatApiError(e)); }
  };

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
            <MetaLine label={t.projects.th.client} value={p.client_name || "—"} />
            {p.work_order_no && <MetaLine label={lang === "cn" ? "工令号" : "Work Order"} value={p.work_order_no} />}
            {p.customer_email && <MetaLine label={lang === "cn" ? "客户邮箱" : "Customer Email"} value={p.customer_email} />}
            <MetaLine label={t.projects.th.updated} value={new Date(p.updated_at).toLocaleString()} />
          </div>
        </div>

        {/* Status workflow card */}
        <ProjectStatusCard
          p={p}
          isAdmin={isAdmin}
          canRequestAdvance={canRequestAdvance}
          nextStatus={nextStatus}
          STATUS_FLOW={STATUS_FLOW}
          currentStatusIdx={currentStatusIdx}
          t={t}
          lang={lang}
          onRequest={() => setAdvanceModal(true)}
          onApprove={approveAdvance}
          onReject={rejectAdvance}
        />

        {/* Customer access — admin-only, only shows if customer_email is set */}
        {isAdmin && (
          <CustomerAccessCard p={p} lang={lang} onProvision={provisionCustomer} />
        )}

        {/* Customer-supplied materials (甲供料) — required before procurement → manufacturing */}
        <CustomerMaterialsCard
          materials={p.customer_materials || []}
          canEdit={isAdmin || (user?.permissions || []).includes("edit_projects")}
          onAdd={addMaterial}
          onToggle={toggleMaterial}
          onDelete={deleteMaterial}
          lang={lang}
        />

        {/* Phase deliverables — 6-stage workflow file uploads */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-px bg-[#C9A063]" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063]">
              {lang === "cn" ? "各阶段交付物 / Phase Deliverables" : "Phase Deliverables"}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PhaseFileSection
              category="approval_drawing" items={approvalDrawings}
              titleCn="承认图 (设计录入)" titleEn="Approval Drawing"
              stageHintCn="设计阶段需上传" stageHintEn="Required for Design stage"
              canManage={canManageFiles} uploadingActive={uploading === "approval_drawing"}
              fileRef={approvalRef} accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg"
              onPick={() => approvalRef.current?.click()} onDelete={delFile} onRename={renameFile} onDownload={download} t={t} lang={lang}
            />
            <PhaseFileSection
              category="design_input" items={designInputs}
              titleCn="设计输入 (业务录入)" titleEn="Design Input"
              stageHintCn="项目录入/设计起始" stageHintEn="Order entry / design kickoff"
              canManage={canManageFiles} uploadingActive={uploading === "design_input"}
              fileRef={designInRef} accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.docx,.xlsx"
              onPick={() => designInRef.current?.click()} onDelete={delFile} onRename={renameFile} onDownload={download} t={t} lang={lang}
            />
            <PhaseFileSection
              category="design_output" items={designOutputs}
              titleCn="设计输出 (设计录入)" titleEn="Design Output"
              stageHintCn="设计阶段完成时录入" stageHintEn="Submit at end of Design stage"
              canManage={canManageFiles} uploadingActive={uploading === "design_output"}
              fileRef={designOutRef} accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.docx,.xlsx,.zip"
              onPick={() => designOutRef.current?.click()} onDelete={delFile} onRename={renameFile} onDownload={download} t={t} lang={lang}
            />
            <PhaseFileSection
              category="product_photo" items={productPhotos}
              titleCn="产品照片 (品检录入)" titleEn="Product Photo"
              stageHintCn="测试阶段必上传" stageHintEn="Required for Testing stage"
              canManage={canManageFiles} uploadingActive={uploading === "product_photo"}
              fileRef={prodPhotoRef} accept=".png,.jpg,.jpeg,.webp,.heic,.heif"
              onPick={() => prodPhotoRef.current?.click()} onDelete={delFile} onRename={renameFile} onDownload={download} t={t} lang={lang}
            />
            <PhaseFileSection
              category="inspection_report" items={inspectionReports}
              titleCn="检验报告 (品检录入)" titleEn="Inspection Report"
              stageHintCn="测试阶段必上传" stageHintEn="Required for Testing stage"
              canManage={canManageFiles} uploadingActive={uploading === "inspection_report"}
              fileRef={inspRef} accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
              onPick={() => inspRef.current?.click()} onDelete={delFile} onRename={renameFile} onDownload={download} t={t} lang={lang}
            />
            <PhaseFileSection
              category="as_built_drawing" items={asBuiltDrawings}
              titleCn="竣工图 (设计录入)" titleEn="As-Built Drawing"
              stageHintCn="出厂前必上传" stageHintEn="Required before Archive"
              canManage={canManageFiles} uploadingActive={uploading === "as_built_drawing"}
              fileRef={asBuiltRef} accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.zip"
              onPick={() => asBuiltRef.current?.click()} onDelete={delFile} onRename={renameFile} onDownload={download} t={t} lang={lang}
            />
          </div>
        </div>
        {/* Hidden file inputs for new categories */}
        <input ref={approvalRef} type="file" hidden onChange={onUpload("approval_drawing")} data-testid="file-input-approval_drawing" accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg" />
        <input ref={designInRef} type="file" hidden onChange={onUpload("design_input")} data-testid="file-input-design_input" accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.docx,.xlsx" />
        <input ref={designOutRef} type="file" hidden onChange={onUpload("design_output")} data-testid="file-input-design_output" accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.docx,.xlsx,.zip" />
        <input ref={prodPhotoRef} type="file" hidden onChange={onUpload("product_photo")} data-testid="file-input-product_photo" accept=".png,.jpg,.jpeg,.webp,.heic,.heif" />
        <input ref={inspRef} type="file" hidden onChange={onUpload("inspection_report")} data-testid="file-input-inspection_report" accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg" />
        <input ref={asBuiltRef} type="file" hidden onChange={onUpload("as_built_drawing")} data-testid="file-input-as_built_drawing" accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.zip" />

        {/* Photos section */}
        <div className="mt-12">
          <FileSection
            title={lang === "cn" ? "工程照片" : "Engineering Photos"}
            category="photo"
            items={photos}
            isAdmin={canManageFiles}
            uploadLabel={lang === "cn" ? "上传照片" : "Upload Photo"}
            uploading={uploading === "photo"}
            uploadingLabel={t.project_detail.uploading}
            onPick={() => filePhotoRef.current?.click()}
            onDelete={delFile}
            onRename={renameFile}
            onDownload={download}
            t={t}
            lang={lang}
          />
        </div>
        <input ref={filePhotoRef} type="file" hidden onChange={onUpload("photo")} data-testid="file-input-photo" accept=".png,.jpg,.jpeg,.webp,.heic,.heif" />

        {/* Drawings section */}
        <div className="mt-12">
          <FileSection
            title={t.project_detail.files_drawing}
            category="drawing"
            items={drawings}
            isAdmin={canManageFiles}
            uploadLabel={t.project_detail.upload_drawing}
            uploading={uploading === "drawing"}
            uploadingLabel={t.project_detail.uploading}
            onPick={() => fileDrawRef.current?.click()}
            onDelete={delFile}
            onRename={renameFile}
            onDownload={download}
            t={t}
            lang={lang}
          />
        </div>
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

        {/* Status history timeline */}
        <ProjectTimeline events={p.status_history || []} t={t} lang={lang} />
      </div>

      {advanceModal && (
        <AdvanceModal
          nextStatus={nextStatus}
          allFlow={STATUS_FLOW}
          currentIdx={currentStatusIdx}
          t={t}
          lang={lang}
          onClose={() => setAdvanceModal(false)}
          onSubmit={async (s, n) => { await requestAdvance(s, n); setAdvanceModal(false); }}
        />
      )}
    </AdminLayout>
  );
};

// ---------------- Status workflow card ----------------
const STAGE_LABEL_CN = {
  // legacy values (kept so old data still renders)
  draft: "草稿", in_design: "设计中", in_production: "生产中", commissioning: "调试中", delivered: "已交付",
  // canonical 6-stage flow
  entry: "项目录入", design: "设计阶段", procurement: "备料阶段",
  manufacturing: "制造阶段", testing: "测试阶段", shipping: "包装出厂",
  archived: "已归档",
};
const STAGE_LABEL_EN = {
  draft: "Draft", in_design: "In Design", in_production: "In Production", commissioning: "Commissioning", delivered: "Delivered",
  entry: "Order Entry", design: "Design", procurement: "Procurement",
  manufacturing: "Manufacturing", testing: "Testing", shipping: "Shipping",
  archived: "Archived",
};

const ProjectStatusCard = ({ p, isAdmin, canRequestAdvance, nextStatus, STATUS_FLOW, currentStatusIdx, t, lang, onRequest, onApprove, onReject }) => {
  const L = lang === "cn" ? STAGE_LABEL_CN : STAGE_LABEL_EN;
  return (
    <div className="bg-[#070707] border border-white/10 mb-10 p-7" data-testid="project-status-card">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063]">
          {lang === "cn" ? "项目进度" : "Project Progress"}
        </div>
        <div className="flex items-center gap-2">
          {p.pending_status && isAdmin && (
            <>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-yellow-400 mr-2" data-testid="pending-badge">
                {lang === "cn" ? "待审核 →" : "PENDING →"} {L[p.pending_status]}
              </span>
              <button onClick={onApprove} data-testid="approve-advance-btn" className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#0F6B3F] hover:bg-[#1A8A52] text-white text-xs font-semibold tracking-wide transition-colors">
                <Check size={12} /> {lang === "cn" ? "批准" : "Approve"}
              </button>
              <button onClick={onReject} data-testid="reject-advance-btn" className="inline-flex items-center gap-1.5 h-9 px-4 border border-white/10 hover:border-red-400/50 hover:text-red-300 text-zinc-300 text-xs font-semibold tracking-wide transition-colors">
                <X size={12} /> {lang === "cn" ? "驳回" : "Reject"}
              </button>
            </>
          )}
          {p.pending_status && !isAdmin && (
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-yellow-400" data-testid="pending-badge">
              {lang === "cn" ? "待管理员审核 →" : "AWAITING REVIEW →"} {L[p.pending_status]}
            </span>
          )}
          {!p.pending_status && nextStatus && canRequestAdvance && (
            <button onClick={onRequest} data-testid="request-advance-btn" className="inline-flex items-center gap-1.5 h-9 px-4 border border-[#C9A063]/50 text-[#C9A063] hover:bg-[#C9A063] hover:text-black text-xs font-semibold tracking-wide transition-colors">
              {lang === "cn" ? "申请推进至 →" : "Request advance to →"} {L[nextStatus]}
            </button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-white/10 border border-white/10" data-testid="status-stepper">
        {STATUS_FLOW.map((s, i) => {
          const done = i <= currentStatusIdx;
          const isCurrent = i === currentStatusIdx;
          const pending = p.pending_status === s;
          return (
            <div
              key={s}
              data-testid={`stage-${s}`}
              className={`px-4 py-4 flex flex-col items-start gap-1 transition-colors ${
                isCurrent ? "bg-[#0F6B3F]/15" : pending ? "bg-yellow-500/10" : done ? "bg-white/[0.03]" : "bg-[#0A0A0A]"
              }`}
            >
              <span className={`font-mono text-[10px] tracking-[0.2em] uppercase ${
                isCurrent ? "text-white" : pending ? "text-yellow-400" : done ? "text-[#C9A063]" : "text-zinc-600"
              }`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={`text-sm font-medium ${
                isCurrent ? "text-white" : pending ? "text-yellow-400" : done ? "text-zinc-300" : "text-zinc-600"
              }`}>
                {L[s]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------- Status timeline (audit log) ----------------
const ProjectTimeline = ({ events, t, lang }) => {
  if (!events || events.length === 0) return null;
  const L = lang === "cn" ? STAGE_LABEL_CN : STAGE_LABEL_EN;
  const KIND_LABEL = lang === "cn"
    ? { created: "项目创建", request_advance: "提交审核", approved: "已批准", rejected: "已驳回" }
    : { created: "Project created", request_advance: "Advance requested", approved: "Approved", rejected: "Rejected" };
  const sorted = [...events].sort((a, b) => new Date(b.at) - new Date(a.at));
  return (
    <section className="mt-12" data-testid="project-timeline">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-7 h-px bg-[#C9A063]" />
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063]">
          {lang === "cn" ? "活动时间线" : "Activity Timeline"}
        </span>
      </div>
      <div className="bg-[#0A0A0A] border border-white/10">
        <ol className="divide-y divide-white/5">
          {sorted.map((e) => (
            <li key={e.id} className="p-5 flex items-start gap-4" data-testid={`timeline-event-${e.id}`}>
              <div className={`mt-1 w-2 h-2 shrink-0 ${
                e.kind === "approved" ? "bg-[#1A8A52]" :
                e.kind === "rejected" ? "bg-red-500" :
                e.kind === "request_advance" ? "bg-yellow-400" : "bg-zinc-500"
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">
                  {KIND_LABEL[e.kind]}
                  {e.to_status && (
                    <span className="text-zinc-400">
                      {" "}· {e.from_status ? `${L[e.from_status]} → ` : ""}<span className="text-white font-medium">{L[e.to_status]}</span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono mt-1">
                  {(e.by_user_name || "—")} · {new Date(e.at).toLocaleString()}
                </div>
                {e.note && (
                  <div className="text-xs text-zinc-400 mt-2 leading-relaxed italic">
                    "{e.note}"
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

// ---------------- Advance request modal ----------------
const AdvanceModal = ({ nextStatus, allFlow, currentIdx, t, lang, onClose, onSubmit }) => {
  const L = lang === "cn" ? STAGE_LABEL_CN : STAGE_LABEL_EN;
  const options = allFlow.slice(currentIdx + 1);
  const [to, setTo] = useState(nextStatus);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md" data-testid="advance-modal">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold">{lang === "cn" ? "申请推进项目阶段" : "Request stage advance"}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500">
              {lang === "cn" ? "目标阶段" : "Target stage"}
            </span>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              data-testid="advance-to-select"
              className="bg-[#0A0A0A] border border-white/10 focus:border-[#C9A063] outline-none h-10 px-3 text-white text-sm"
            >
              {options.map((s) => <option key={s} value={s}>{L[s]}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500">
              {lang === "cn" ? "备注 (可选)" : "Note (optional)"}
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              data-testid="advance-note"
              rows={3}
              placeholder={lang === "cn" ? "例如:图纸已通过内部审核,可推进至生产..." : "e.g. Drawings have passed internal review, ready for production..."}
              className="bg-[#0A0A0A] border border-white/10 focus:border-[#C9A063] outline-none px-3 py-2 text-white text-sm resize-y"
            />
          </label>
        </div>
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-10 px-4 border border-white/10 hover:border-[#C9A063] text-zinc-300 hover:text-white text-sm">{lang === "cn" ? "取消" : "Cancel"}</button>
          <button
            disabled={!to || busy}
            onClick={async () => { setBusy(true); await onSubmit(to, note || null); setBusy(false); }}
            data-testid="advance-submit"
            className="h-10 px-5 bg-[#0F6B3F] hover:bg-[#1A8A52] text-white text-sm font-semibold tracking-wide transition-colors disabled:opacity-50"
          >
            {busy ? "…" : (lang === "cn" ? "提交审核" : "Submit for review")}
          </button>
        </div>
      </div>
    </div>
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
        {category === "code" ? <FileCode2 size={14} className="text-[#C9A063]" /> : category === "photo" ? <Camera size={14} className="text-[#C9A063]" /> : <FileImage size={14} className="text-[#C9A063]" />}
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
          {category === "code" ? t.project_detail.file_cat_code : category === "photo" ? (t.project_detail.file_cat_photo || (t.common && t.common.photo) || "PHOTO") : t.project_detail.file_cat_drawing}
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
        {(file.uploaded_by_name || file.uploaded_at) && (
          <div className="text-[11px] text-zinc-500 truncate" data-testid={`uploader-${file.id}`}>
            {file.uploaded_by_name && (
              <span className="text-zinc-400">{file.uploaded_by_name}</span>
            )}
            {file.uploaded_by_name && file.uploaded_at && <span className="mx-1.5 text-zinc-700">·</span>}
            {file.uploaded_at && (
              <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
            )}
          </div>
        )}

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


// ---------------- Phase deliverable file section (reuses existing FileSection card layout) ----------------
const PhaseFileSection = ({
  category, items, titleCn, titleEn, stageHintCn, stageHintEn,
  canManage, uploadingActive, accept, onPick, onDelete, onRename, onDownload, t, lang,
}) => {
  const title = lang === "cn" ? titleCn : titleEn;
  const hint = lang === "cn" ? stageHintCn : stageHintEn;
  return (
    <section data-testid={`phase-section-${category}`} className="bg-[#0A0A0A] border border-white/10">
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div>
          <div className="text-sm font-bold text-white">{title}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">{hint}{items.length > 0 ? ` · ${items.length}` : ""}</div>
        </div>
        {canManage && (
          <button
            onClick={onPick}
            disabled={uploadingActive}
            data-testid={`upload-${category}`}
            className="inline-flex items-center gap-1.5 h-9 px-3 border border-[#C9A063]/40 text-[#C9A063] hover:bg-[#C9A063] hover:text-black text-xs font-semibold tracking-wide transition-colors disabled:opacity-50"
          >
            <Upload size={13} /> {uploadingActive ? t.project_detail.uploading : (lang === "cn" ? "上传" : "Upload")}
          </button>
        )}
      </header>
      <div className="p-4">
        {items.length === 0 ? (
          <div className="text-center text-[11px] text-zinc-600 italic py-6">
            {lang === "cn" ? "暂无文件" : "No files yet"}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((f) => (
              <PhaseFileCard
                key={f.id} file={f} canManage={canManage}
                onDelete={onDelete} onRename={onRename} onDownload={onDownload}
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const PhaseFileCard = ({ file, canManage, onDelete, onRename, onDownload, lang }) => {
  const isImage = (file.content_type || "").startsWith("image/");
  return (
    <div className="bg-[#070707] border border-white/5 flex flex-col" data-testid={`phase-file-${file.id}`}>
      <div className="aspect-square bg-white/[0.02] flex items-center justify-center overflow-hidden">
        {file.thumb_b64 ? (
          <img src={file.thumb_b64} alt={file.filename} className="w-full h-full object-cover" />
        ) : isImage ? (
          <FileImage size={28} className="text-zinc-600" />
        ) : (
          <FileText size={28} className="text-zinc-600" />
        )}
      </div>
      <div className="p-2.5 flex flex-col gap-1.5">
        <div className="text-[11px] text-white truncate" title={file.display_name || file.filename}>
          {file.display_name || file.filename}
        </div>
        {file.uploaded_by_name && (
          <div className="text-[10px] text-zinc-500 truncate" data-testid={`phase-uploader-${file.id}`}>
            {file.uploaded_by_name} · {new Date(file.uploaded_at).toLocaleDateString()}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <button onClick={() => onDownload(file)} className="flex-1 inline-flex items-center justify-center h-7 border border-white/10 hover:border-[#C9A063] text-zinc-300 hover:text-[#C9A063] text-[10px] transition-colors" data-testid={`download-${file.id}`}>
            <Download size={11} />
          </button>
          {canManage && (
            <>
              <button onClick={() => { const n = window.prompt(lang === "cn" ? "重命名" : "Rename", file.display_name || file.filename); if (n) onRename(file.id, n); }} className="inline-flex items-center justify-center w-7 h-7 border border-white/10 hover:border-[#C9A063] text-zinc-300 hover:text-[#C9A063] transition-colors" data-testid={`rename-${file.id}`}>
                <Pencil size={11} />
              </button>
              <button onClick={() => onDelete(file.id)} className="inline-flex items-center justify-center w-7 h-7 border border-white/10 hover:border-red-400 hover:text-red-300 text-zinc-300 transition-colors" data-testid={`del-${file.id}`}>
                <Trash2 size={11} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------- Customer-access card (admin-only) ----------------
const CustomerAccessCard = ({ p, lang, onProvision }) => {
  if (!p.customer_email) {
    return (
      <div className="mt-6 bg-[#0A0A0A] border border-white/10 p-5 flex items-center justify-between gap-4" data-testid="customer-access-card">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500 mb-1">
            {lang === "cn" ? "客户访问" : "Customer Access"}
          </div>
          <div className="text-sm text-zinc-400">
            {lang === "cn" ? "项目尚未设置客户邮箱。在「编辑」中填写后,可一键生成客户登录账号。" : "Add a customer_email in Edit to provision a customer login."}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-6 bg-[#0A0A0A] border border-white/10 p-5 flex items-center justify-between gap-4 flex-wrap" data-testid="customer-access-card">
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-1">
          {lang === "cn" ? "客户访问" : "Customer Access"}
        </div>
        <div className="text-sm text-white">
          {lang === "cn" ? "客户邮箱:" : "Customer email:"} <span className="font-mono">{p.customer_email}</span>
        </div>
        <div className="text-[11px] text-zinc-500 mt-1">
          {p.customer_user_id
            ? (lang === "cn" ? "已开通账号,阶段更新时自动通知。" : "Account active — notified on each stage update.")
            : (lang === "cn" ? "尚未开通账号,点击右侧按钮自动创建并发送凭据。" : "No account yet — click to provision and send credentials.")}
        </div>
      </div>
      {!p.customer_user_id && (
        <button
          onClick={onProvision}
          data-testid="provision-customer-btn"
          className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#0F6B3F] hover:bg-[#1A8A52] text-white text-xs font-semibold tracking-wide transition-colors"
        >
          {lang === "cn" ? "开通客户账号" : "Provision account"}
        </button>
      )}
    </div>
  );
};

// ---------------- Customer-supplied materials (甲供料) ----------------
const CustomerMaterialsCard = ({ materials, canEdit, onAdd, onToggle, onDelete, lang }) => {
  const [newName, setNewName] = useState("");
  return (
    <div className="mt-6 bg-[#0A0A0A] border border-white/10" data-testid="customer-materials-card">
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-wrap gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063]">
            {lang === "cn" ? "甲供料清单" : "Customer-Supplied Materials"}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {lang === "cn" ? "全部勾选到货后,方可推进至「制造阶段」" : "All items must be marked supplied before advancing to Manufacturing"}
          </div>
        </div>
        {canEdit && (
          <form
            onSubmit={(e) => { e.preventDefault(); onAdd(newName); setNewName(""); }}
            className="flex items-center gap-2"
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={lang === "cn" ? "新增材料名" : "New material name"}
              data-testid="material-input"
              className="bg-[#070707] border border-white/10 px-3 h-9 text-xs text-white focus:border-[#C9A063] outline-none w-48"
            />
            <button type="submit" data-testid="material-add-btn" className="h-9 px-3 border border-[#C9A063]/40 text-[#C9A063] hover:bg-[#C9A063] hover:text-black text-xs font-semibold tracking-wide transition-colors">
              {lang === "cn" ? "添加" : "Add"}
            </button>
          </form>
        )}
      </header>
      {materials.length === 0 ? (
        <div className="px-5 py-6 text-center text-[11px] text-zinc-600 italic">
          {lang === "cn" ? "暂无甲供料 — 推进至制造阶段时无需等待。" : "None — no customer-supplied materials required."}
        </div>
      ) : (
        <ul className="divide-y divide-white/5" data-testid="materials-list">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3" data-testid={`material-${m.id}`}>
              <input
                type="checkbox"
                checked={!!m.supplied}
                onChange={() => canEdit && onToggle(m)}
                disabled={!canEdit}
                className="w-4 h-4 accent-[#0F6B3F]"
                data-testid={`material-check-${m.id}`}
              />
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${m.supplied ? "text-zinc-500 line-through" : "text-white"}`}>{m.name}</div>
                {m.note && <div className="text-[11px] text-zinc-500 mt-0.5">{m.note}</div>}
              </div>
              {m.supplied && m.supplied_at && (
                <span className="font-mono text-[10px] text-[#1A8A52]">{new Date(m.supplied_at).toLocaleDateString()}</span>
              )}
              {canEdit && (
                <button onClick={() => onDelete(m)} className="text-zinc-500 hover:text-red-400" data-testid={`material-del-${m.id}`}>
                  <Trash2 size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
