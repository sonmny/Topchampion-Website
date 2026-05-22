import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { useLang } from "../../i18n/LangContext";
import { adminI18n } from "../../i18n/admin";
import { api, formatApiError } from "../apiClient";
import { AdminLayout } from "../AdminLayout";
import { toast } from "sonner";
import { UserCircle, Key } from "lucide-react";

export const AdminProfile = () => {
  const { user, refresh } = useAuth();
  const { lang } = useLang();
  const t = adminI18n[lang];

  const [basic, setBasic] = useState({ username: "", full_name: "" });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (user) setBasic({ username: user.username || "", full_name: user.full_name || "" });
  }, [user]);

  const saveBasic = async (e) => {
    e.preventDefault();
    setSavingBasic(true);
    try {
      const payload = {};
      if (basic.username.trim() && basic.username.trim() !== user.username) payload.new_username = basic.username.trim();
      if ((basic.full_name || "") !== (user.full_name || "")) payload.full_name = basic.full_name;
      if (Object.keys(payload).length === 0) {
        toast.message(lang === "cn" ? "无变更" : "No changes");
        setSavingBasic(false);
        return;
      }
      await api.patch("/auth/me", payload);
      await refresh();
      toast.success(t.common.save_ok);
    } catch (e2) {
      toast.error(formatApiError(e2));
    } finally {
      setSavingBasic(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwd.next.length < 6) { toast.error(t.profile.err_password_short); return; }
    if (pwd.next !== pwd.confirm) { toast.error(t.profile.err_password_mismatch); return; }
    setSavingPwd(true);
    try {
      await api.patch("/auth/me", { current_password: pwd.current, new_password: pwd.next });
      toast.success(t.common.save_ok);
      setPwd({ current: "", next: "", confirm: "" });
    } catch (e2) {
      toast.error(formatApiError(e2));
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <AdminLayout>
      <div data-testid="profile-root">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-3">
          {t.profile.title}
        </div>
        <h1 className="font-heading text-4xl font-bold uppercase tracking-tight mb-3">{t.profile.title}</h1>
        <p className="text-sm text-zinc-400 mb-10">{t.profile.subtitle}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic info */}
          <form onSubmit={saveBasic} className="border border-white/10 bg-[#0F0F0F]/60 p-8 flex flex-col gap-5" data-testid="profile-basic-form">
            <div className="flex items-center gap-3 mb-2">
              <UserCircle size={18} className="text-[#C9A063]" />
              <h2 className="font-heading text-lg font-bold uppercase tracking-tight">{t.profile.section_basic}</h2>
            </div>
            <Field label={t.profile.f_username}>
              <input
                data-testid="profile-username"
                value={basic.username}
                onChange={(e) => setBasic({ ...basic, username: e.target.value })}
                minLength={2}
                required
                className="industrial-input"
              />
            </Field>
            <Field label={t.profile.f_full_name}>
              <input
                data-testid="profile-fullname"
                value={basic.full_name}
                onChange={(e) => setBasic({ ...basic, full_name: e.target.value })}
                className="industrial-input"
              />
            </Field>
            <div className="flex justify-end pt-3 border-t border-white/5">
              <button
                type="submit"
                disabled={savingBasic}
                data-testid="profile-save-basic"
                className="px-6 h-11 bg-[#0F6B3F] hover:bg-[#0A5230] disabled:opacity-50 text-white font-bold uppercase text-sm tracking-wide transition-colors"
              >
                {savingBasic ? "…" : t.profile.save_basic}
              </button>
            </div>
          </form>

          {/* Password */}
          <form onSubmit={savePassword} className="border border-white/10 bg-[#0F0F0F]/60 p-8 flex flex-col gap-5" data-testid="profile-password-form">
            <div className="flex items-center gap-3 mb-2">
              <Key size={18} className="text-[#C9A063]" />
              <h2 className="font-heading text-lg font-bold uppercase tracking-tight">{t.profile.section_password}</h2>
            </div>
            <Field label={t.profile.f_current_password}>
              <input
                type="password"
                data-testid="profile-current-password"
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                required
                className="industrial-input"
                autoComplete="current-password"
              />
            </Field>
            <Field label={t.profile.f_new_password}>
              <input
                type="password"
                data-testid="profile-new-password"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                minLength={6}
                required
                className="industrial-input"
                autoComplete="new-password"
              />
            </Field>
            <Field label={t.profile.f_confirm_password}>
              <input
                type="password"
                data-testid="profile-confirm-password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                minLength={6}
                required
                className="industrial-input"
                autoComplete="new-password"
              />
            </Field>
            <div className="flex justify-end pt-3 border-t border-white/5">
              <button
                type="submit"
                disabled={savingPwd}
                data-testid="profile-save-password"
                className="px-6 h-11 bg-[#C9A063] hover:bg-[#B58D4F] disabled:opacity-50 text-black font-bold uppercase text-sm tracking-wide transition-colors"
              >
                {savingPwd ? "…" : t.profile.save_password}
              </button>
            </div>
          </form>
        </div>

        <style>{`
          .industrial-input { background:#141414; border:1px solid rgba(255,255,255,0.08); color:#fff; height:46px; padding:0 16px; font-family:'IBM Plex Sans',sans-serif; outline:none; transition:.2s; width:100%; border-radius:0; }
          .industrial-input:focus { border-color:#C9A063; box-shadow:0 0 0 1px #C9A063; background:#181818; }
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
