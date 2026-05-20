import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useLang } from "../i18n/LangContext";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { Send, CheckCircle2, ArrowRight } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const initialState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  industry: "",
  plc_brand: "",
  project_description: "",
};

export const SmartQuoteForm = () => {
  const { t } = useLang();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const isValid =
    form.name.trim() &&
    form.company.trim() &&
    form.industry &&
    form.plc_brand &&
    form.project_description.trim().length >= 5;

  const submit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        industry: form.industry,
        plc_brand: form.plc_brand,
        project_description: form.project_description.trim(),
      };
      await axios.post(`${API}/leads`, payload);
      setSuccess(true);
      setForm(initialState);
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
            <span className="w-8 h-px bg-[#00E676]" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#00E676]">
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
              "Senior engineer reply within 1 business day",
              "NDA-ready scoped technical proposal",
            ].map((line, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="w-1.5 h-1.5 bg-[#00E676]" />
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
              className="border border-[#00E676]/30 bg-[#00E676]/[0.04] p-10 lg:p-14 flex flex-col items-start gap-6"
            >
              <CheckCircle2 size={42} className="text-[#00E676]" strokeWidth={1.5} />
              <h3 className="font-heading text-2xl lg:text-3xl font-bold text-white tracking-tight">
                {t.quote.success_title}
              </h3>
              <p className="text-zinc-400 max-w-md">{t.quote.success_sub}</p>
              <button
                onClick={() => setSuccess(false)}
                data-testid="submit-another"
                className="mt-4 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase text-[#00E676] hover:text-white transition-colors"
              >
                Submit another inquiry <ArrowRight size={14} />
              </button>
            </motion.div>
          ) : (
            <form
              onSubmit={submit}
              data-testid="quote-form"
              className="border border-white/10 bg-[#0F0F0F]/60 backdrop-blur-md p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <Field label={t.quote.fields.name} required>
                <Input
                  data-testid="form-name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder={t.quote.placeholders.name}
                  className="industrial-input"
                  required
                />
              </Field>
              <Field label={t.quote.fields.company} required>
                <Input
                  data-testid="form-company"
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  placeholder={t.quote.placeholders.company}
                  className="industrial-input"
                  required
                />
              </Field>

              <Field label={t.quote.fields.email}>
                <Input
                  data-testid="form-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder={t.quote.placeholders.email}
                  className="industrial-input"
                />
              </Field>
              <Field label={t.quote.fields.phone}>
                <Input
                  data-testid="form-phone"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder={t.quote.placeholders.phone}
                  className="industrial-input"
                />
              </Field>

              <Field label={t.quote.fields.industry} required>
                <Select
                  value={form.industry}
                  onValueChange={(v) => update("industry", v)}
                >
                  <SelectTrigger
                    data-testid="form-industry"
                    className="industrial-input justify-between text-left"
                  >
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F0F0F] border border-white/10 text-white rounded-none">
                    {Object.entries(t.quote.industries).map(([k, v]) => (
                      <SelectItem
                        key={k}
                        value={k}
                        data-testid={`industry-${k}`}
                        className="rounded-none focus:bg-[#0055A4] focus:text-white"
                      >
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t.quote.fields.plc} required>
                <Select
                  value={form.plc_brand}
                  onValueChange={(v) => update("plc_brand", v)}
                >
                  <SelectTrigger
                    data-testid="form-plc"
                    className="industrial-input justify-between text-left"
                  >
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F0F0F] border border-white/10 text-white rounded-none">
                    {Object.entries(t.quote.plcs).map(([k, v]) => (
                      <SelectItem
                        key={k}
                        value={k}
                        data-testid={`plc-${k}`}
                        className="rounded-none focus:bg-[#0055A4] focus:text-white"
                      >
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="md:col-span-2">
                <Field label={t.quote.fields.description} required>
                  <Textarea
                    data-testid="form-description"
                    value={form.project_description}
                    onChange={(e) => update("project_description", e.target.value)}
                    placeholder={t.quote.placeholders.description}
                    rows={5}
                    className="industrial-input resize-none"
                    required
                  />
                </Field>
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                <p className="text-xs text-zinc-500 max-w-md font-mono tracking-wide">
                  By submitting, you agree to our processing of inquiry data per our privacy policy.
                </p>
                <button
                  data-testid="form-submit"
                  type="submit"
                  disabled={!isValid || submitting}
                  className="group inline-flex items-center justify-center gap-3 bg-[#00E676] hover:bg-[#00C766] text-black font-bold uppercase tracking-wide text-sm px-8 h-14 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? t.quote.submitting : t.quote.submit}
                  {!submitting && (
                    <Send size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Local input styling */}
      <style>{`
        .industrial-input {
          background-color: #141414 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          color: #fff !important;
          border-radius: 0 !important;
          height: 48px !important;
          padding-left: 16px !important;
          padding-right: 16px !important;
          font-family: 'IBM Plex Sans', sans-serif !important;
          transition: border-color .2s, background-color .2s;
        }
        textarea.industrial-input { height: auto !important; padding-top: 14px !important; padding-bottom: 14px !important; }
        .industrial-input:focus, .industrial-input:focus-visible {
          border-color: #00E676 !important;
          background-color: #181818 !important;
          outline: none !important;
          box-shadow: 0 0 0 1px #00E676 !important;
        }
        .industrial-input::placeholder { color: #52525b !important; }
      `}</style>
    </section>
  );
};

const Field = ({ label, required, children }) => (
  <label className="flex flex-col gap-2">
    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-400">
      {label}
      {required && <span className="text-[#00E676] ml-1">*</span>}
    </span>
    {children}
  </label>
);
