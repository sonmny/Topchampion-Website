import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
// (LeadsList rows are clickable as a UX improvement; see onClick on <tr> below.)
import { AdminLayout } from "../AdminLayout";
import { api, formatApiError } from "../apiClient";
import { useLang } from "../../i18n/LangContext";
import { adminI18n } from "../../i18n/admin";
import { COUNTRIES } from "../../i18n/countries";
import { Inbox, Mail, Phone, Building2, MapPin, FileDown, Paperclip, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const STATUS_CLR = {
  new: "text-[#1A8A52] bg-[#1A8A52]/10 border-[#1A8A52]/40",
  viewed: "text-zinc-300 bg-white/5 border-zinc-700/40",
  closed: "text-zinc-500 bg-zinc-900/40 border-zinc-700",
};

const countryLabel = (code, lang) => {
  if (!code) return "—";
  const c = COUNTRIES.find((x) => x.code === code);
  return c ? (c[lang] || c.en) : code;
};

export const LeadsList = () => {
  const { lang } = useLang();
  const t = adminI18n[lang];
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/leads");
      setItems(data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <AdminLayout>
      <div data-testid="leads-list-root">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063] mb-3">{t.leads.title}</div>
        <h1 className="font-heading text-4xl font-bold uppercase tracking-tight">{t.leads.title}</h1>
        <p className="text-sm text-zinc-400 mt-2 mb-10">{t.leads.subtitle}</p>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-zinc-500 tracking-widest uppercase">{t.common.loading}</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center border border-white/10 bg-white/[0.02]">
            <Inbox size={32} className="mx-auto text-zinc-600 mb-4" strokeWidth={1.4} />
            <p className="text-zinc-400">{t.leads.empty}</p>
          </div>
        ) : (
          <div className="border border-white/10 overflow-x-auto">
            <table className="w-full text-sm" data-testid="leads-table">
              <thead className="bg-[#0F0F0F] border-b border-white/10">
                <tr className="text-left font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400">
                  <th className="px-5 py-3">{t.leads.th.status}</th>
                  <th className="px-5 py-3">{t.leads.th.name}</th>
                  <th className="px-5 py-3">{t.leads.th.company}</th>
                  <th className="px-5 py-3">{t.leads.th.country}</th>
                  <th className="px-5 py-3">{t.leads.th.industry}</th>
                  <th className="px-5 py-3">{t.leads.th.received}</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((l) => (
                  <tr key={l.id} onClick={() => navigate(`/admin/leads/${l.id}`)} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer" data-testid={`lead-row-${l.id}`}>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono tracking-wider uppercase border ${STATUS_CLR[l.status] || STATUS_CLR.new}`}>
                        {l.status === "new" && <span className="w-1.5 h-1.5 rounded-full bg-[#1A8A52] pulse-dot" />}
                        {t.leads.status[l.status] || l.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white font-medium">
                      <Link to={`/admin/leads/${l.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-[#C9A063] transition-colors">
                        {l.name}
                      </Link>
                      {l.file_meta && <Paperclip size={11} className="inline ml-2 text-[#C9A063]" />}
                    </td>
                    <td className="px-5 py-4 text-zinc-300">{l.company}</td>
                    <td className="px-5 py-4 text-zinc-300">{countryLabel(l.country, lang)}</td>
                    <td className="px-5 py-4 text-zinc-300">{t.leads.industries[l.industry] || l.industry}</td>
                    <td className="px-5 py-4 text-zinc-400 font-mono text-xs">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/admin/leads/${l.id}`} onClick={(e) => e.stopPropagation()} data-testid={`lead-view-${l.id}`} className="inline-flex items-center justify-center w-9 h-9 border border-white/10 text-zinc-400 hover:text-[#C9A063] hover:border-[#C9A063] transition-colors">
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export const LeadDetail = () => {
  const { id } = useParams();
  const { lang } = useLang();
  const t = adminI18n[lang];
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/leads/${id}`);
      setLead(data);
    } catch (e) {
      toast.error(formatApiError(e));
      navigate("/admin/leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const setStatus = async (status) => {
    try {
      const fd = new FormData();
      fd.append("status", status);
      await api.patch(`/leads/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(t.common.save_ok);
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const downloadFile = async () => {
    try {
      const res = await api.get(`/leads/${id}/file`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = lead.file_meta.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  if (loading || !lead) {
    return (
      <AdminLayout>
        <div className="py-20 text-center font-mono text-xs text-zinc-500 tracking-widest uppercase">{t.common.loading}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div data-testid="lead-detail-root">
        <Link to="/admin/leads" className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500 hover:text-white">
          {t.leads.back}
        </Link>

        <div className="flex items-start justify-between gap-6 mt-3 mb-10 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono tracking-wider uppercase border ${STATUS_CLR[lead.status] || STATUS_CLR.new}`}>
                {t.leads.status[lead.status]}
              </span>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500">
                {t.leads.industries[lead.industry] || lead.industry}
              </span>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-500">· {countryLabel(lead.country, lang)}</span>
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight">
              {lead.name} <span className="text-zinc-500 font-light">·</span> <span className="text-[#C9A063]">{lead.company}</span>
            </h1>
            <div className="text-xs text-zinc-500 font-mono mt-2">{new Date(lead.created_at).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setStatus("viewed")} disabled={lead.status === "viewed"} data-testid="lead-mark-viewed" className="px-4 h-10 border border-white/10 text-zinc-300 hover:border-[#C9A063] hover:text-[#C9A063] disabled:opacity-40 text-xs uppercase tracking-wide font-medium transition-colors">
              {t.leads.mark_viewed}
            </button>
            <button onClick={() => setStatus("closed")} disabled={lead.status === "closed"} data-testid="lead-mark-closed" className="px-4 h-10 border border-white/10 text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-40 text-xs uppercase tracking-wide font-medium transition-colors">
              {t.leads.mark_closed}
            </button>
          </div>
        </div>

        {/* Contact + meta cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10 mb-10">
          <ContactCard icon={Building2} label={t.leads.fields.company} value={lead.company} />
          <ContactCard icon={Mail} label={t.leads.fields.email} value={lead.email || "—"} link={lead.email ? `mailto:${lead.email}` : null} />
          <ContactCard icon={Phone} label={t.leads.fields.phone} value={lead.phone || "—"} />
          <ContactCard icon={MapPin} label={t.leads.fields.country} value={countryLabel(lead.country, lang)} />
        </div>

        {/* Description */}
        <section className="mb-10" data-testid="lead-description">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-4">{t.leads.fields.description}</div>
          <div className="border border-white/10 bg-white/[0.02] p-6 lg:p-8">
            <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">{lead.project_description}</p>
          </div>
        </section>

        {/* File attachment */}
        {lead.file_meta && (
          <section data-testid="lead-attachment">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-4">{t.leads.attachment}</div>
            <button
              onClick={downloadFile}
              data-testid="lead-download"
              className="w-full md:max-w-md flex items-center gap-4 border border-white/10 hover:border-[#C9A063] bg-white/[0.02] hover:bg-white/[0.04] p-5 text-left transition-colors group"
            >
              <span className="w-12 h-12 flex items-center justify-center bg-[#0F6B3F]/15 border border-[#0F6B3F]/40 text-[#1A8A52] shrink-0">
                <FileDown size={20} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{lead.file_meta.filename}</div>
                <div className="text-[11px] font-mono text-zinc-500">{(lead.file_meta.size / 1024).toFixed(1)} KB · {new Date(lead.file_meta.uploaded_at).toLocaleString()}</div>
              </div>
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-[#C9A063] group-hover:text-white transition-colors">
                {t.leads.download}
              </span>
            </button>
          </section>
        )}
      </div>
    </AdminLayout>
  );
};

const ContactCard = ({ icon: Icon, label, value, link }) => (
  <div className="bg-[#0A0A0A] p-6 flex flex-col gap-2">
    <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">
      <Icon size={12} className="text-[#C9A063]" />
      {label}
    </div>
    {link ? (
      <a href={link} className="text-sm text-white hover:text-[#C9A063] transition-colors break-all">{value}</a>
    ) : (
      <div className="text-sm text-white break-all">{value}</div>
    )}
  </div>
);
