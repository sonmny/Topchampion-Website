import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLang } from "../../i18n/LangContext";
import { adminI18n } from "../../i18n/admin";
import { formatApiError } from "../apiClient";
import { LogIn } from "lucide-react";

export const AdminLogin = () => {
  const { login, user } = useAuth();
  const { lang, setLang } = useLang();
  const t = adminI18n[lang];
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in → redirect
  React.useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate("/admin", { replace: true });
    } catch (e2) {
      const msg = e2?.response?.status === 401 ? t.login.error_invalid : formatApiError(e2, t.login.error_network);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] glow-blue opacity-60 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] glow-green opacity-50 pointer-events-none" />

      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button
          onClick={() => setLang("cn")}
          className={`px-3 h-8 font-mono text-[11px] tracking-wider border ${
            lang === "cn" ? "bg-[#0F6B3F] border-[#0F6B3F] text-white" : "border-white/10 text-zinc-400 hover:text-white"
          }`}
        >
          中文
        </button>
        <button
          onClick={() => setLang("en")}
          className={`px-3 h-8 font-mono text-[11px] tracking-wider border ${
            lang === "en" ? "bg-[#0F6B3F] border-[#0F6B3F] text-white" : "border-white/10 text-zinc-400 hover:text-white"
          }`}
        >
          EN
        </button>
      </div>

      <div className="relative w-full max-w-md" data-testid="admin-login-card">
        <Link to="/" className="flex items-center gap-3 mb-10 group">
          <img src="/logo.png" alt="Topchampion" className="w-12 h-12 object-contain" />
          <div className="leading-tight">
            <div className="font-heading font-bold uppercase tracking-tight">Topchampion</div>
            <div className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase">
              苏州赛冠 · Electric & Automation
            </div>
          </div>
        </Link>

        <div className="border border-white/10 bg-[#0F0F0F]/70 backdrop-blur-md p-8 lg:p-10">
          <div className="mb-8">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-3">Admin Console</div>
            <h1 className="font-heading text-3xl font-bold tracking-tight uppercase">{t.login.title}</h1>
            <p className="text-sm text-zinc-400 mt-3">{t.login.subtitle}</p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5" data-testid="admin-login-form">
            <Field label={t.login.username}>
              <input
                data-testid="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="industrial-input"
              />
            </Field>
            <Field label={t.login.password}>
              <input
                data-testid="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="industrial-input"
              />
            </Field>

            {err && (
              <div data-testid="login-error" className="border border-red-500/40 bg-red-500/10 text-red-300 text-sm px-4 py-3">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit"
              className="group mt-2 inline-flex items-center justify-center gap-3 bg-[#0F6B3F] hover:bg-[#0A5230] disabled:opacity-50 text-white font-bold uppercase tracking-wide text-sm h-12 transition-colors"
            >
              {loading ? t.login.submitting : (<>
                <LogIn size={16} />
                {t.login.submit}
              </>)}
            </button>
          </form>
        </div>

        <style>{`
          .industrial-input { background:#141414; border:1px solid rgba(255,255,255,0.08); color:#fff; height:48px; padding:0 16px; font-family:'IBM Plex Sans',sans-serif; transition:.2s; outline:none; }
          .industrial-input:focus { border-color:#C9A063; box-shadow:0 0 0 1px #C9A063; background:#181818; }
          .industrial-input::placeholder { color:#52525b; }
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
