/**
 * Transactional email (invites, MFA codes, etc.).
 *
 * **Option A — Company SMTP (on-prem / Office 365 / any relay)**  
 * Set one of:
 * - `SMTP_URL` — e.g. `smtps://user:pass@smtp.office365.com:587` (encode special chars in password)
 * - or `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_USER`, `SMTP_PASSWORD` (or `SMTP_PASS`),
 *   optional `SMTP_SECURE=true` for port 465.
 * Optional: `SMTP_TLS_REJECT_UNAUTHORIZED=0` only for dev / self-signed relays (not recommended in prod).
 * Always set `EMAIL_FROM` and optional `EMAIL_FROM_NAME` (used as the From header).
 *
 * **Option B — Resend** (https://resend.com)  
 * If SMTP is not configured: `RESEND_API_KEY`, `EMAIL_FROM`, optional `EMAIL_FROM_NAME`.
 */

import nodemailer from "nodemailer";

const RESEND_API = "https://api.resend.com/emails";

function fromAddress() {
  const name = (process.env.EMAIL_FROM_NAME || "FleetShare").trim();
  const email = (process.env.EMAIL_FROM || "").trim();
  if (!email) return null;
  return `${name} <${email}>`;
}

function smtpConfigured() {
  const url = process.env.SMTP_URL?.trim();
  if (url) return true;
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "").trim();
  return Boolean(host && user && pass);
}

/**
 * @param {{ to: string | string[], subject: string, html?: string, text?: string, replyTo?: string }} opts
 * @returns {Promise<{ ok: boolean, id?: string, error?: string }>}
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  const from = fromAddress();
  if (!from) {
    return { ok: false, error: "not_configured" };
  }

  const toList = Array.isArray(to) ? to : [to];
  if (!html && !text) {
    return { ok: false, error: "missing_body" };
  }

  if (smtpConfigured()) {
    try {
      const url = process.env.SMTP_URL?.trim();
      const transport = url
        ? nodemailer.createTransport(url)
        : nodemailer.createTransport({
            host: process.env.SMTP_HOST?.trim(),
            port: parseInt(process.env.SMTP_PORT || "587", 10),
            secure:
              process.env.SMTP_SECURE === "1" ||
              process.env.SMTP_SECURE === "true" ||
              parseInt(process.env.SMTP_PORT || "587", 10) === 465,
            auth: {
              user: process.env.SMTP_USER?.trim(),
              pass: (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "").trim(),
            },
            ...(process.env.SMTP_TLS_REJECT_UNAUTHORIZED === "0"
              ? { tls: { rejectUnauthorized: false } }
              : {}),
          });

      const info = await transport.sendMail({
        from,
        to: toList.join(", "),
        subject,
        ...(html ? { html } : {}),
        ...(text ? { text } : {}),
        ...(replyTo ? { replyTo } : {}),
      });
      return { ok: true, id: info.messageId || undefined };
    } catch (e) {
      const msg = e?.message || String(e);
      return { ok: false, error: msg };
    }
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "not_configured" };
  }

  const body = {
    from,
    to: toList,
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || data?.error || res.statusText || "send_failed";
    return { ok: false, error: String(msg) };
  }

  const id = data?.id;
  return { ok: true, id };
}

/**
 * Invite email with optional join link (set NEXT_PUBLIC_APP_URL for a full URL).
 */
export async function sendInviteEmail({ to, token, inviteeName, appBaseUrl }) {
  const base = (appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const link = base
    ? `${base}/register?invite=${encodeURIComponent(token)}`
    : null;

  const greeting = inviteeName ? `Hi ${inviteeName},` : "Hi,";

  const text = [
    greeting,
    "",
    "You’ve been invited to join the company on FleetShare.",
    link ? `Open this link to accept and set your password:\n${link}` : `Your invite token (paste where the app asks for it):\n${token}`,
    "",
    "If you didn’t expect this, you can ignore this email.",
  ].join("\n");

  const html = `
    <p>${greeting}</p>
    <p>You’ve been invited to join the company on <strong>FleetShare</strong>.</p>
    ${
      link
        ? `<p><a href="${link}">Accept invitation and set password</a></p>`
        : `<p>Your invite token:</p><pre style="font-size:14px;word-break:break-all">${token}</pre>`
    }
    <p style="color:#64748b;font-size:13px">If you didn’t expect this, you can ignore this email.</p>
  `.trim();

  return sendEmail({ to, subject: "You’re invited to FleetShare", html, text });
}

/**
 * 6-digit code after password when MFA is enabled.
 */
export async function sendMfaLoginCodeEmail({ to, code }) {
  const text = [
    "Your FleetShare sign-in code is:",
    "",
    String(code),
    "",
    "It expires in 10 minutes. If you didn’t try to sign in, ignore this email.",
  ].join("\n");
  const html = `
    <p>Your FleetShare sign-in code is:</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:6px;font-family:ui-monospace,monospace">${String(code)}</p>
    <p style="color:#64748b;font-size:13px">It expires in 10 minutes. If you didn’t try to sign in, ignore this email.</p>
  `.trim();
  return sendEmail({ to, subject: "Your FleetShare sign-in code", html, text });
}
