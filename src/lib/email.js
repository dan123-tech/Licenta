/**
 * Transactional email from a no-reply style address.
 *
 * Uses Resend’s REST API (no extra package): https://resend.com
 * 1. Create API key, verify your domain (SPF/DKIM handled by Resend).
 * 2. Set RESEND_API_KEY, EMAIL_FROM (e.g. no-reply@yourdomain.com), optional EMAIL_FROM_NAME.
 *
 * Alternative: use Nodemailer + SMTP (Gmail, SendGrid SMTP, etc.) if you prefer one SMTP_URL.
 */

const RESEND_API = "https://api.resend.com/emails";

function fromAddress() {
  const name = (process.env.EMAIL_FROM_NAME || "FleetShare").trim();
  const email = (process.env.EMAIL_FROM || "").trim();
  if (!email) return null;
  return `${name} <${email}>`;
}

/**
 * @param {{ to: string | string[], subject: string, html?: string, text?: string, replyTo?: string }} opts
 * @returns {Promise<{ ok: boolean, id?: string, error?: string }>}
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = fromAddress();

  if (!apiKey || !from) {
    return { ok: false, error: "not_configured" };
  }

  const toList = Array.isArray(to) ? to : [to];

  const body = {
    from,
    to: toList,
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  if (!body.html && !body.text) {
    return { ok: false, error: "missing_body" };
  }

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
export async function sendInviteEmail({ to, token, inviteeName }) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
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
