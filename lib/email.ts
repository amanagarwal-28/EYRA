/**
 * Server-only: shared Resend email sending.
 *
 * Required env vars:
 *   RESEND_API_KEY   — from https://resend.com/api-keys
 *   ORDER_EMAIL_FROM — optional, defaults below
 */
import "server-only";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${params.subject}" to ${params.to}`);
    return false;
  }

  const from = params.from ?? process.env.EMAIL_FROM ?? "EYRA <noreply@eyra.org.in>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[email] Resend API error ${res.status}:`, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}
