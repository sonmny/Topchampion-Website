import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../../i18n/LangContext";
import { adminI18n } from "../../i18n/admin";
import { api, formatApiError } from "../apiClient";
import { AdminLayout } from "../AdminLayout";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";

const INDUSTRIES = ["tire_mfg", "semiconductor", "power_generation", "auto_ev", "data_center", "other"];
const PLCS = ["rockwell", "siemens", "schneider", "other"];
const STATUSES = ["entry", "design", "procurement", "manufacturing", "testing", "shipping", "archived"];

const empty = {
  name: "",
  work_order_no: "",
  client_name: "",
  customer_user_id: "",
  customer_email: "",
  industry: "",
  plc_brand: "",
  status: "entry",
  description: "",
  is_showcase: false,
  showcase_industry: "",
  showcase_quote: "",
  showcase_author: "",
  showcase_metric: "",
};

export const ProjectForm = ({ mode }) => {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = adminI18n[lang];
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState(empty);
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const isEdit = mode === "edit";

  useEffect(() => {
    if (user && user.role !== "admin") navigate("/admin/projects");
  }, [user, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const { data: users } = await api.get("/users");
        setCustomers(users.filter((u) => u.role === "customer"));
      } catch { /* ignore */ }
      if (isEdit) {
        try {
          const { data } = await api.get(`/projects/${id}`);
          setForm({
            name: data.name || "",
            work_order_no: data.work_order_no || "",
            client_name: data.client_name || "",
            customer_user_id: data.customer_user_id || "",
            customer_email: data.customer_email || "",
            industry: data.industry || "",
            plc_brand: data.plc_brand || "",
            status: data.status || "entry",
            description: data.description || "",
            is_showcase: !!data.is_showcase,
            showcase_industry: data.showcase_industry || "",
            showcase_quote: data.showcase_quote || "",
            showcase_author: data.showcase_author || "",
            showcase_metric: data.showcase_metric || "",
          });
        } catch (e) {
          toast.error(formatApiError(e));
          navigate("/admin/projects");
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [id, isEdit, navigate]);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      work_order_no: form.work_order_no.trim() || null,
      client_name: form.client_name.trim() || null,
      customer_user_id: form.customer_user_id || null,
      customer_email: form.customer_email.trim() || null,
      industry: form.industry || null,
      plc_brand: form.plc_brand || null,
      status: form.status,
      description: form.description.trim() || null,
      is_showcase: form.is_showcase,
      showcase_industry: form.showcase_industry.trim() || null,
      showcase_quote: form.showcase_quote.trim() || null,
      showcase_author: form.showcase_author.trim() || null,
      showcase_metric: form.showcase_metric.trim() || null,
    };
    setSaving(true);
    try {
      if (isEdit) {
        const { data } = await api.patch(`/projects/${id}`, payload);
        toast.success(t.common.save_ok);
        navigate(`/admin/projects/${data.id}`);
      } else {
        const { data } = await api.post("/projects", payload);
        toast.success(t.common.save_ok);
        navigate(`/admin/projects/${data.id}`);
      }
    } catch (e2) {
      toast.error(formatApiError(e2));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
      <div data-testid="project-form-root">
        <Link to="/admin/projects" className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500 hover:text-white">
          {t.project_detail.back}
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-bold uppercase tracking-tight mb-10">
          {isEdit ? t.project_form.title_edit : t.project_form.title_new}
        </h1>

        <form onSubmit={submit} className="border border-white/10 bg-[#0F0F0F]/60 p-8 grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="project-form">
          <Field label={t.project_form.f_name + " *"}>
            <input data-testid="pf-name" required value={form.name} onChange={(e) => update("name", e.target.value)} className="industrial-input" />
          </Field>
          <Field label={lang === "cn" ? "工令号" : "Work Order No."}>
            <input data-testid="pf-work-order" value={form.work_order_no} onChange={(e) => update("work_order_no", e.target.value)} placeholder="TC-2025-0001" className="industrial-input" />
          </Field>
          <Field label={t.project_form.f_client}>
            <input data-testid="pf-client" value={form.client_name} onChange={(e) => update("client_name", e.target.value)} className="industrial-input" />
          </Field>
          <Field label={lang === "cn" ? "客户邮箱(用于自动开通账号 + 阶段通知)" : "Customer Email (auto-account + stage emails)"}>
            <input data-testid="pf-customer-email" type="email" value={form.customer_email} onChange={(e) => update("customer_email", e.target.value)} placeholder="customer@example.com" className="industrial-input" />
          </Field>

          <Field label={t.project_form.f_customer}>
            <select data-testid="pf-customer" value={form.customer_user_id} onChange={(e) => update("customer_user_id", e.target.value)} className="industrial-input appearance-none">
              <option value="">{t.project_form.f_customer_none}</option>
              {customers.map((u) => {
                const label = u.full_name ? `${u.full_name} (@${u.username})` : `@${u.username}`;
                return <option key={u.id} value={u.id}>{label}</option>;
              })}
            </select>
          </Field>

          <Field label={t.project_form.f_status}>
            <select data-testid="pf-status" value={form.status} onChange={(e) => update("status", e.target.value)} className="industrial-input appearance-none">
              {STATUSES.map((s) => <option key={s} value={s}>{t.projects.status[s]}</option>)}
            </select>
          </Field>

          <Field label={t.project_form.f_industry}>
            <select data-testid="pf-industry" value={form.industry} onChange={(e) => update("industry", e.target.value)} className="industrial-input appearance-none">
              <option value="">—</option>
              {INDUSTRIES.map((s) => <option key={s} value={s}>{t.projects.industries[s]}</option>)}
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label={t.project_form.f_description}>
              <textarea data-testid="pf-description" rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className="industrial-input" style={{ height: "auto", padding: "12px 16px" }} />
            </Field>
          </div>

          {/* Showcase section */}
          <div className="md:col-span-2 border-t border-white/10 pt-6 mt-2">
            <div className="flex items-start gap-4 mb-5">
              <Megaphone size={18} className="text-[#C9A063] shrink-0 mt-1" />
              <div className="flex-1">
                <div className="font-heading text-lg font-bold text-white uppercase tracking-tight">{t.project_form.showcase_section}</div>
                <p className="text-xs text-zinc-400 mt-1">{t.project_form.showcase_hint}</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  data-testid="pf-is-showcase"
                  type="checkbox"
                  checked={form.is_showcase}
                  onChange={(e) => update("is_showcase", e.target.checked)}
                  className="sr-only peer"
                />
                <span className="w-11 h-6 bg-zinc-800 border border-white/10 relative transition-colors peer-checked:bg-[#0F6B3F] peer-checked:border-[#0F6B3F] after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:w-4 after:h-4 after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400 whitespace-nowrap">{t.project_form.f_is_showcase}</span>
              </label>
            </div>

            {form.is_showcase && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label={t.project_form.f_showcase_industry}>
                  <input data-testid="pf-sc-industry" value={form.showcase_industry} onChange={(e) => update("showcase_industry", e.target.value)} placeholder={t.project_form.f_showcase_industry_ph} className="industrial-input" />
                </Field>
                <Field label={t.project_form.f_showcase_metric}>
                  <input data-testid="pf-sc-metric" value={form.showcase_metric} onChange={(e) => update("showcase_metric", e.target.value)} placeholder={t.project_form.f_showcase_metric_ph} className="industrial-input" />
                </Field>
                <div className="md:col-span-2">
                  <Field label={t.project_form.f_showcase_quote}>
                    <textarea data-testid="pf-sc-quote" rows={3} value={form.showcase_quote} onChange={(e) => update("showcase_quote", e.target.value)} placeholder={t.project_form.f_showcase_quote_ph} className="industrial-input" style={{ height: "auto", padding: "12px 16px" }} />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label={t.project_form.f_showcase_author}>
                    <input data-testid="pf-sc-author" value={form.showcase_author} onChange={(e) => update("showcase_author", e.target.value)} placeholder={t.project_form.f_showcase_author_ph} className="industrial-input" />
                  </Field>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={() => navigate("/admin/projects")} className="px-6 h-11 border border-white/10 text-zinc-300 hover:text-white hover:border-white/30 transition-colors text-sm uppercase tracking-wide font-medium">
              {t.project_form.cancel}
            </button>
            <button type="submit" disabled={saving} data-testid="pf-submit" className="px-7 h-11 bg-[#0F6B3F] hover:bg-[#0A5230] disabled:opacity-50 text-white font-bold uppercase text-sm tracking-wide transition-colors">
              {saving ? t.project_form.saving : t.project_form.save}
            </button>
          </div>
        </form>

        <style>{`
          .industrial-input { background:#141414; border:1px solid rgba(255,255,255,0.08); color:#fff; height:46px; padding:0 16px; font-family:'IBM Plex Sans',sans-serif; outline:none; transition:.2s; width:100%; border-radius:0; }
          .industrial-input:focus { border-color:#C9A063; box-shadow:0 0 0 1px #C9A063; background:#181818; }
          .industrial-input::placeholder { color:#52525b; }
          select.industrial-input { background-image: linear-gradient(45deg, transparent 50%, #71717a 50%), linear-gradient(135deg, #71717a 50%, transparent 50%); background-position: calc(100% - 18px) 50%, calc(100% - 13px) 50%; background-size: 5px 5px, 5px 5px; background-repeat: no-repeat; padding-right: 36px; }
        `}</style>
      </div>
    </AdminLayout>
  );
};

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-2">
    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400">{label}</span>
    {children}
  </label>
);
