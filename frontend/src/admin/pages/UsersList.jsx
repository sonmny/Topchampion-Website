import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { useLang } from "../../i18n/LangContext";
import { adminI18n } from "../../i18n/admin";
import { api, formatApiError } from "../apiClient";
import { AdminLayout } from "../AdminLayout";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const ROLES = ["admin", "user", "customer"];

export const UsersList = () => {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = adminI18n[lang];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | userObject

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setItems(data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const del = async (u) => {
    if (!window.confirm(t.users.confirm_delete)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success(t.common.delete_ok);
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <AdminLayout>
      <div data-testid="users-list-root">
        <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-3">
              {t.users.title}
            </div>
            <h1 className="font-heading text-4xl font-bold uppercase tracking-tight">{t.users.title}</h1>
            <p className="text-sm text-zinc-400 mt-2">{t.users.subtitle}</p>
          </div>
          <button
            onClick={() => setEditing("new")}
            data-testid="new-user-btn"
            className="inline-flex items-center gap-2 bg-[#0F6B3F] hover:bg-[#0A5230] text-white font-semibold uppercase text-sm tracking-wide px-5 h-11 transition-colors"
          >
            <Plus size={16} />
            {t.users.new}
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-zinc-500 tracking-widest uppercase">
            {t.common.loading}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center border border-white/10 bg-white/[0.02] text-zinc-400">{t.users.empty}</div>
        ) : (
          <div className="border border-white/10 overflow-x-auto">
            <table className="w-full text-sm" data-testid="users-table">
              <thead className="bg-[#0F0F0F] border-b border-white/10">
                <tr className="text-left font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400">
                  <th className="px-5 py-3">{t.users.th.username}</th>
                  <th className="px-5 py-3">{t.users.th.full_name}</th>
                  <th className="px-5 py-3">{t.users.th.role}</th>
                  <th className="px-5 py-3">{lang === "cn" ? "部门" : "Department"}</th>
                  <th className="px-5 py-3">{t.users.th.created}</th>
                  <th className="px-5 py-3 text-right">{t.users.th.actions}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`user-row-${u.id}`}>
                    <td className="px-5 py-4 font-mono text-white">@{u.username}</td>
                    <td className="px-5 py-4 text-zinc-300">{u.full_name || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-1 text-[11px] font-mono tracking-wider uppercase border ${
                        u.role === "admin" ? "text-[#C9A063] border-[#C9A063]/40 bg-[#C9A063]/10"
                        : u.role === "customer" ? "text-blue-300 border-blue-500/40 bg-blue-500/10"
                        : "text-zinc-300 border-zinc-700"
                      }`}>
                        {t.roles[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-300">{u.department ? t.departments[u.department] : "—"}</td>
                    <td className="px-5 py-4 text-zinc-400 font-mono text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setEditing(u)} title={t.users.edit} data-testid={`edit-user-${u.id}`} className="w-9 h-9 flex items-center justify-center border border-white/10 text-zinc-400 hover:text-[#C9A063] hover:border-[#C9A063] transition-colors">
                          <Pencil size={14} />
                        </button>
                        {u.id !== user?.id && (
                          <button onClick={() => del(u)} title={t.users.delete} data-testid={`delete-user-${u.id}`} className="w-9 h-9 flex items-center justify-center border border-white/10 text-zinc-400 hover:text-red-300 hover:border-red-400/50 transition-colors">
                            <Trash2 size={14} />
                          </button>
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

      {editing && (
        <UserDialog
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </AdminLayout>
  );
};

const UserDialog = ({ item, onClose, onSaved }) => {
  const { lang } = useLang();
  const t = adminI18n[lang];
  const isEdit = !!item;
  const PERMISSIONS = ["view_leads", "edit_projects", "delete_projects", "manage_files", "view_progress"];
  const DEPARTMENTS = ["sales", "design", "engineering", "finance", "it"];
  const [form, setForm] = useState({
    username: item?.username || "",
    password: "",
    full_name: item?.full_name || "",
    role: item?.role || "user",
    department: item?.department || "",
    permissions: item?.permissions || [],
  });
  const [saving, setSaving] = useState(false);

  const togglePerm = (p) =>
    setForm((s) => ({
      ...s,
      permissions: s.permissions.includes(p) ? s.permissions.filter((x) => x !== p) : [...s.permissions, p],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        const payload = {};
        if (form.password) payload.password = form.password;
        if (form.full_name !== (item.full_name || "")) payload.full_name = form.full_name;
        if (form.role !== item.role) payload.role = form.role;
        if ((form.department || "") !== (item.department || "")) payload.department = form.department || null;
        const oldPerms = JSON.stringify((item.permissions || []).slice().sort());
        const newPerms = JSON.stringify(form.permissions.slice().sort());
        if (oldPerms !== newPerms) payload.permissions = form.permissions;
        if (Object.keys(payload).length) {
          await api.patch(`/users/${item.id}`, payload);
        }
      } else {
        await api.post("/users", {
          username: form.username.trim(),
          password: form.password,
          full_name: form.full_name || null,
          role: form.role,
          department: form.department || null,
          permissions: form.permissions,
        });
      }
      toast.success(t.common.save_ok);
      onSaved();
    } catch (e2) {
      toast.error(formatApiError(e2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose} data-testid="user-dialog">
      <div className="bg-[#0F0F0F] border border-white/10 w-full max-w-lg p-8 relative my-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white" data-testid="user-dialog-close">
          <X size={18} />
        </button>
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063] mb-2">
          {isEdit ? "Edit" : "New"}
        </div>
        <h3 className="font-heading text-2xl font-bold uppercase tracking-tight mb-6">
          {isEdit ? t.user_form.title_edit : t.user_form.title_new}
        </h3>

        <form onSubmit={submit} className="flex flex-col gap-5" data-testid="user-form">
          <Field label={t.user_form.f_username}>
            <input data-testid="uf-username" required minLength={2} disabled={isEdit} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="industrial-input disabled:opacity-60" />
          </Field>
          <Field label={isEdit ? t.user_form.f_password_keep : t.user_form.f_password}>
            <input data-testid="uf-password" type="password" minLength={isEdit ? 0 : 6} required={!isEdit} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="industrial-input" />
          </Field>
          <Field label={t.user_form.f_full_name}>
            <input data-testid="uf-full-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="industrial-input" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.user_form.f_role}>
              <select data-testid="uf-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="industrial-input appearance-none">
                {ROLES.map((r) => <option key={r} value={r}>{t.roles[r]}</option>)}
              </select>
            </Field>
            <Field label={lang === "cn" ? "部门" : "Department"}>
              <select data-testid="uf-department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="industrial-input appearance-none">
                <option value="">—</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{t.departments[d]}</option>)}
              </select>
            </Field>
          </div>

          {/* Permissions: only relevant for 'user' role */}
          {form.role === "user" && (
            <Field label={lang === "cn" ? "权限" : "Permissions"}>
              <div className="grid grid-cols-2 gap-2 border border-white/10 bg-white/[0.02] p-4">
                {PERMISSIONS.map((p) => {
                  const on = form.permissions.includes(p);
                  return (
                    <label key={p} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none" data-testid={`uf-perm-${p}-row`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => togglePerm(p)}
                        data-testid={`uf-perm-${p}`}
                        className="w-4 h-4 accent-[#0F6B3F]"
                      />
                      <span>{t.permissions[p]}</span>
                    </label>
                  );
                })}
              </div>
            </Field>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button type="button" onClick={onClose} className="px-5 h-10 border border-white/10 text-zinc-300 hover:text-white text-sm uppercase tracking-wide">
              {t.user_form.cancel}
            </button>
            <button type="submit" disabled={saving} data-testid="uf-submit" className="px-6 h-10 bg-[#0F6B3F] hover:bg-[#0A5230] disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wide transition-colors">
              {saving ? "…" : t.user_form.save}
            </button>
          </div>
        </form>

        <style>{`
          .industrial-input { background:#141414; border:1px solid rgba(255,255,255,0.08); color:#fff; height:44px; padding:0 14px; font-family:'IBM Plex Sans',sans-serif; outline:none; width:100%; border-radius:0; transition:.2s; }
          .industrial-input:focus { border-color:#C9A063; box-shadow:0 0 0 1px #C9A063; background:#181818; }
        `}</style>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-2">
    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400">{label}</span>
    {children}
  </label>
);
