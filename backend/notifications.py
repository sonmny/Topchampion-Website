"""Email notifications via Resend.

This module is safe to import even when no API key is configured:
- send_new_lead_email() will simply log and skip if RESEND_API_KEY is missing,
  so leads still persist normally during local dev.
"""
import os
import asyncio
import logging
from typing import Optional

import resend

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev").strip()
SALES_NOTIFY_EMAIL = os.environ.get("SALES_NOTIFY_EMAIL", "").strip()

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


INDUSTRY_LABELS = {
    "tire_mfg": "Tire & Rubber",
    "semiconductor": "Semiconductor / FPD",
    "power_generation": "Power Generation / Gen-Set",
    "auto_ev": "Automotive / EV",
    "data_center": "Data Center",
    "bess": "BESS (legacy)",
    "other": "Other",
}


def _render_lead_email_html(lead: dict) -> str:
    industry = INDUSTRY_LABELS.get(lead.get("industry") or "", lead.get("industry") or "—")
    file_meta = lead.get("file_meta") or {}
    file_row = ""
    if file_meta:
        file_row = (
            f'<tr><td style="padding:8px 14px;color:#888;width:140px;">Attachment</td>'
            f'<td style="padding:8px 14px;color:#111;font-weight:600;">📎 {file_meta.get("filename","file")} '
            f'<span style="color:#888;font-weight:400">({(file_meta.get("size",0)/1024):.0f} KB)</span></td></tr>'
        )

    def row(label: str, value: Optional[str]) -> str:
        if not value:
            return ""
        return (
            f'<tr><td style="padding:8px 14px;color:#888;width:140px;">{label}</td>'
            f'<td style="padding:8px 14px;color:#111;">{value}</td></tr>'
        )

    desc = (lead.get("project_description") or "").replace("\n", "<br>")

    return f"""<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111;">
<table cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f5f5;padding:32px 0;">
  <tr><td align="center">
    <table cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff;border:1px solid #e5e5e5;border-top:4px solid #0F6B3F;">
      <tr><td style="padding:24px 28px;background:#0A0A0A;color:#ffffff;">
        <div style="font-size:11px;letter-spacing:3px;color:#C9A063;text-transform:uppercase;margin-bottom:8px;">
          SUZHOU TOPCHAMPION · NEW LEAD
        </div>
        <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;">
          {lead.get("name","Unnamed contact")} · {lead.get("company","Unknown company")}
        </div>
      </td></tr>
      <tr><td style="padding:24px 14px;">
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:14px;line-height:1.5;">
          {row("Industry", industry)}
          {row("Country", lead.get("country"))}
          {row("Email", lead.get("email"))}
          {row("Phone", lead.get("phone"))}
          {file_row}
        </table>
        <div style="margin:20px 14px 0 14px;padding:16px;background:#fafafa;border-left:3px solid #0F6B3F;font-size:14px;line-height:1.6;color:#222;">
          <div style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:8px;">Project description</div>
          {desc}
        </div>
        <div style="margin:24px 14px 0 14px;font-size:12px;color:#666;">
          Lead ID: <code style="font-family:monospace;color:#0F6B3F;">{lead.get("id","")}</code><br>
          Received: {lead.get("created_at","")}
        </div>
      </td></tr>
      <tr><td style="padding:18px 28px;background:#0A0A0A;color:#888;font-size:11px;letter-spacing:1px;">
        Reply to this lead inside the admin console · topchampion.cn
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""


async def send_new_lead_email(lead: dict) -> None:
    """Fire-and-forget notification for a newly created lead. Never raises."""
    if not RESEND_API_KEY or not SALES_NOTIFY_EMAIL:
        logger.info(
            "[notify] RESEND_API_KEY or SALES_NOTIFY_EMAIL not set; skipping email for lead %s",
            lead.get("id"),
        )
        return

    subject = f"[Topchampion] New lead · {lead.get('company','')} · {lead.get('name','')}"
    params = {
        "from": SENDER_EMAIL,
        "to": [SALES_NOTIFY_EMAIL],
        "subject": subject,
        "html": _render_lead_email_html(lead),
        "reply_to": lead.get("email") or None,
    }
    if not params["reply_to"]:
        params.pop("reply_to")

    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info("[notify] Sent lead-notification email id=%s for lead %s", result.get("id"), lead.get("id"))
    except Exception as exc:  # noqa: BLE001
        logger.exception("[notify] Resend send failed for lead %s: %s", lead.get("id"), exc)
