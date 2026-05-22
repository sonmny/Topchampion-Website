import React, { useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useLang } from "../i18n/LangContext";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { Send, CheckCircle2, ArrowRight, Paperclip, X } from "lucide-react";
import { COUNTRIES } from "../i18n/countries";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const ALLOWED_EXT = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".dwg", ".doc", ".docx", ".xls", ".xlsx", ".zip"];
const MAX_BYTES = 25 * 1024 * 1024;

const initialState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  industry: "",
  country: "",
  project_description: "",
};

export const SmartQuoteForm = () => {
  const { lang, t } = useLang();
  const [form, setForm] = useState(initialState);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef(null);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const isValid =
    form.name.trim() &&
    form.company.trim() &&
    form.industry &&
    form.country &&
    form.project_description.trim().length >= 5;

  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      toast.error(lang === "cn" ? `不支持的文件类型 ${ext}` : `Unsupported file type ${ext}`);
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error(lang === "cn" ? "文件超过 25MB" : "File exceeds 25MB");
      return;
    }
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("company", form.company.trim());
      fd.append("industry", form.industry);
      fd.append("country", form.country);
      fd.append("project_description", form.project_description.trim());
      if (form.email.trim()) fd.append("email", form.email.trim());
      if (form.phone.trim()) fd.append("phone", form.phone.trim());
      if (file) fd.append("file", file);
      await axios.post(`${API}/leads`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess(true);
      setForm(initialState);
      setFile(null);
      toast.success(t.quote.success_title);
    } catch (err) {
      console.error(err);
      toast.error(t.quote.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      data-testid="quote-section"
      className="relative bg-[#0A0A0A] py-24 lg:py-32 border-t border-white/10 overflow-hidden"
    >
      <div className="absolute -right-40 top-20 w-[500px] h-[500px] glow-blue opacity-50 pointer-events-none" />
      <div className="absolute -left-40 bottom-0 w-[400px] h-[400px] glow-green opacity-30 pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Header */}
        <div className="lg:col-span-5 lg:sticky lg:top-32 self-start">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-px bg-[#C9A063]" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063]">
              {t.quote.overline}
            </span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter text-white uppercase leading-[1.05] mb-6">
            {t.quote.title}
          </h2>
          <p className="text-zinc-400 max-w-md mb-10">{t.quote.sub}</p>

          <div className="space-y-3 max-w-md">
            {[
              "ISO 9001:2015 · IEC 61439 · UL 891",
              lang === "cn" ? "资深工程师 1 个工作日内回复" : "Senior engineer reply within 1 business day",
              lang === "cn" ? "可签 NDA 的有范围技术建议书" : "NDA-ready scoped technical proposal",
            ].map((line, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="w-1.5 h-1.5 bg-[#C9A063]" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-7">
          {success ? (
            <motion.div
              data-testid="quote-success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="border border-[#C9A063]/30 bg-[#C9A063]/[0.04] p-10 lg:p-14 flex flex-col items-start gap-6"
            >
              <CheckCircle2 size={42} className="text-[#1A8A52]" strokeWidth={1.5} />
              <h3 className="font-heading text-2xl lg:text-3xl font-bold text-white tracking-tight">
                {t.quote.success_title}
              </h3>
              <p className="text-zinc-400 max-w-md">{t.quote.success_sub}</p>
              <button
                onClick={() => setSuccess(false)}
                data-testid="submit-another"
                className="mt-4 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase text-[#C9A063] hover:text-white transition-colors"
              >
                {lang === "cn" ? "继续提交另一条" : "Submit another inquiry"} <ArrowRight size={14} />
              </button>
            </motion.div>
          ) : (
            <form
              onSubmit={submit}
              data-testid="quote-form"
              className="border border-white/10 bg-[#0F0F0F]/60 backdrop-blur-md p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <Field label={t.quote.fields.name} required>
                <Input data-testid="form-name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder={t.quote.placeholders.name} className="industrial-input" required />
              </Field>
              <Field label={t.quote.fields.company} required>
                <Input data-testid="form-company" value={form.company} onChange={(e) => update("company", e.target.value)} placeholder={t.quote.placeholders.company} className="industrial-input" required />
              </Field>

              <Field label={t.quote.fields.email}>
                <Input data-testid="form-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder={t.quote.placeholders.email} className="industrial-input" />
              </Field>
              <Field label={t.quote.fields.phone}>
                <Input data-testid="form-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder={t.quote.placeholders.phone} className="industrial-input" />
              </Field>

              <Field label={t.quote.fields.industry} required>
                <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
                  <SelectTrigger data-testid="form-industry" className="industrial-input justify-between text-left">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F0F0F] border border-white/10 text-white rounded-none max-h-[260px]">
                    {Object.entries(t.quote.industries).map(([k, v]) => (
                      <SelectItem key={k} value={k} data-testid={`industry-${k}`} className="rounded-none focus:bg-[#0F6B3F] focus:text-white">
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t.quote.fields.country} required>
                <Select value={form.country} onValueChange={(v) => update("country", v)}>
                  <SelectTrigger data-testid="form-country" className="industrial-input justify-between text-left">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F0F0F] border border-white/10 text-white rounded-none max-h-[280px]">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} data-testid={`country-${c.code}`} className="rounded-none focus:bg-[#0F6B3F] focus:text-white">
                        {c[lang] || c.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="md:col-span-2">
                <Field label={t.quote.fields.description} required>
                  <Textarea data-testid="form-description" value={form.project_description} onChange={(e) => update("project_description", e.target.value)} placeholder={t.quote.placeholders.description} rows={5} className="industrial-input resize-none" required />
                </Field>
              </div>

              {/* File upload */}
              <div className="md:col-span-2">
                <Field label={t.quote.fields.attachment}>
                  <input ref={fileRef} type="file" hidden onChange={onFile} accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.doc,.docx,.xls,.xlsx,.zip" data-testid="form-file-input" />
                  {file ? (
                    <div className="flex items-center gap-3 border border-white/10 bg-white/[0.02] px-4 h-12">
                      <Paperclip size={14} className="text-[#C9A063] shrink-0" />
                      <span className="text-sm text-white truncate flex-1" data-testid="form-file-name">{file.name}</span>
                      <span className="text-xs font-mono text-zinc-500 shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                      <button type="button" onClick={() => setFile(null)} className="text-zinc-400 hover:text-red-300" data-testid="form-file-clear">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      data-testid="form-file-pick"
                      className="flex items-center gap-3 border border-dashed border-white/10 hover:border-[#C9A063] bg-white/[0.02] hover:bg-white/[0.04] px-4 h-12 text-sm text-zinc-300 hover:text-white transition-colors"
                    >
                      <Paperclip size={14} className="text-zinc-400" />
                      <span>{t.quote.attachment_pick}</span>
                      <span className="ml-auto text-xs font-mono text-zinc-500">{t.quote.attachment_hint}</span>
                    </button>
                  )}
                </Field>
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                <p className="text-xs text-zinc-500 max-w-md font-mono tracking-wide">
                  {lang === "cn" ? "提交即表示您同意我们按隐私政策处理咨询数据。" : "By submitting, you agree to our processing of inquiry data per our privacy policy."}
                </p>
                <button data-testid="form-submit" type="submit" disabled={!isValid || submitting} className="group inline-flex items-center justify-center gap-3 bg-[#C9A063] hover:bg-[#B58D4F] text-black font-bold uppercase tracking-wide text-sm px-8 h-14 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {submitting ? t.quote.submitting : t.quote.submit}
                  {!submitting && <Send size={16} className="group-hover:translate-x-0.5 transition-transform" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .industrial-input { background-color:#141414 !important; border:1px solid rgba(255,255,255,0.08) !important; color:#fff !important; border-radius:0 !important; height:48px !important; padding-left:16px !important; padding-right:16px !important; font-family:'IBM Plex Sans', sans-serif !important; transition: border-color .2s, background-color .2s; }
        textarea.industrial-input { height:auto !important; padding-top:14px !important; padding-bottom:14px !important; }
        .industrial-input:focus, .industrial-input:focus-visible { border-color:#C9A063 !important; background-color:#181818 !important; outline:none !important; box-shadow:0 0 0 1px #C9A063 !important; }
        .industrial-input::placeholder { color:#52525b !important; }
      `}</style>
    </section>
  );
};

const Field = ({ label, required, children }) => (
  <label className="flex flex-col gap-2">
    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400">
      {label}
      {required && <span className="text-[#C9A063] ml-1">*</span>}
    </span>
    {children}
  </label>
);
