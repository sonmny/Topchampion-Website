import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../../i18n/LangContext";
import { adminI18n } from "../../i18n/admin";
import { api, formatApiError } from "../apiClient";
import { AdminLayout } from "../AdminLayout";
import { toast } from "sonner";

const INDUSTRIES = ["tire_mfg", "bess", "data_center", "other"];
const PLCS = ["rockwell", "siemens", "schneider", "other"];
const STATUSES = ["draft", "in_design", "in_production", "commissioning", "delivered", "archived"];

const empty = {
  name: "",
  client_name: "",
  customer_user_id: "",
  industry: "",
  plc_brand: "",
  status: "draft",
  description: "",
  parameters_text: "",
  drawing_urls_text: "",
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
    if (user && user.role !== "admin") {
      navigate("/admin/projects");
    }
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
            client_name: data.client_name || "",
            customer_user_id: data.customer_user_id || "",
            industry: data.industry || "",
            plc_brand: data.plc_brand || "",
            status: data.status || "draft",
            description: data.description || "",
            parameters_text: data.parameters ? JSON.stringify(data.parameters, null, 2) : "",
            drawing_urls_text: (data.drawing_urls || []).join("\n"),
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
    let parameters = null;
    if (form.parameters_text.trim()) {
      try {
        parameters = JSON.parse(form.parameters_text);
        if (typeof parameters !== "object" || Array.isArray(parameters)) throw new Error();
      } catch {
        toast.error(t.project_form.params_invalid);
        return;
      }
    }
    const drawing_urls = form.drawing_urls_text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      client_name: form.client_name.trim() || null,
      customer_user_id: form.customer_user_id || null,
      industry: form.industry || null,
      plc_brand: form.plc_brand || null,
      status: form.status,
      description: form.description.trim() || null,
      parameters,
      drawing_urls,
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
          <Field label={t.project_form.f_client}>
            <input data-testid="pf-client" value={form.client_name} onChange={(e) => update("client_name", e.target.value)} className="industrial-input" />
          </Field>

          <Field label={t.project_form.f_customer}>
            <select data-testid="pf-customer" value={form.customer_user_id} onChange={(e) => update("customer_user_id", e.target.value)} className="industrial-input appearance-none">
              <option value="">{t.project_form.f_customer_none}</option>
              {customers.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name || u.username} (@{u.username})</option>
              ))}
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
          <Field label={t.project_form.f_plc}>
            <select data-testid="pf-plc" value={form.plc_brand} onChange={(e) => update("plc_brand", e.target.value)} className="industrial-input appearance-none">
              <option value="">—</option>
              {PLCS.map((s) => <option key={s} value={s}>{t.projects.plcs[s]}</option>)}
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label={t.project_form.f_description}>
              <textarea data-testid="pf-description" rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className="industrial-input" style={{ height: "auto", padding: "12px 16px" }} />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label={t.project_form.f_parameters}>
              <textarea
                data-testid="pf-parameters"
                rows={5}
                value={form.parameters_text}
                onChange={(e) => update("parameters_text", e.target.value)}
                className="industrial-input font-mono text-xs"
                style={{ height: "auto", padding: "12px 16px" }}
                placeholder='{ "capacity_mwh": 80, "voltage_kv": 35 }'
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label={t.project_form.f_drawing_urls}>
              <textarea
                data-testid="pf-drawing-urls"
                rows={3}
                value={form.drawing_urls_text}
                onChange={(e) => update("drawing_urls_text", e.target.value)}
                className="industrial-input font-mono text-xs"
                style={{ height: "auto", padding: "12px 16px" }}
                placeholder="https://drive.google.com/..."
              />
            </Field>
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
