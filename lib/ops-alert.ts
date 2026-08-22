/**
 * Server-only: internal failure notifications for operational issues that
 * currently only surface as server logs, e.g. a Shiprocket step failing
 * silently while the customer-facing order still succeeds. Nobody watches
 * Vercel function logs in real time, so without this the only way to learn
 * a shipment needs manual attention was to go check Medusa admin.
 *
 * Deliberately best-effort: alerting must never itself throw or block the
 * request that triggered it.
 */
import "server-only";
import { sendEmail } from "@/lib/email";
import { storeConfig } from "@/config/storeConfig";

function recipient(): string {
  return process.env.OPS_ALERT_EMAIL || storeConfig.contact.adminEmail;
}

export async function sendOpsAlert(subject: string, lines: string[]): Promise<void> {
  try {
    const html = `
      <div style="font-family: sans-serif; font-size: 14px; color: #222; line-height: 1.6;">
        <p style="margin: 0 0 12px;"><strong>${subject}</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          ${lines.map((l) => `<li>${l}</li>`).join("")}
        </ul>
        <p style="margin: 16px 0 0; color: #888; font-size: 12px;">
          This is an automated operational alert. The customer-facing order was not affected;
          this step needs to be finished manually in Medusa admin or the Shiprocket dashboard.
        </p>
      </div>
    `;
    const sent = await sendEmail({ to: recipient(), subject: `[EYRA ops] ${subject}`, html });
    if (!sent) console.error("[ops-alert] sendEmail returned false for:", subject);
  } catch (err) {
    console.error("[ops-alert] failed to send alert for:", subject, err);
  }
}
