/**
 * Server-only: internal operational emails, for things that currently only
 * surface as server logs or a page inside Medusa admin nobody opens
 * proactively. Two kinds:
 *
 *   sendOpsAlert              a step failed silently (AWB/label/pickup/etc)
 *   sendOrderPlacedNotification  a new order needs to be packed and shipped
 *
 * Both are best-effort: alerting must never itself throw or block the
 * request that triggered it.
 */
import "server-only";
import { sendEmail } from "@/lib/email";
import { storeConfig } from "@/config/storeConfig";

function recipient(): string {
  return process.env.OPS_ALERT_EMAIL || storeConfig.contact.adminEmail;
}

/** Minimal HTML-escaping for values that may contain customer-entered text. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendOpsAlert(subject: string, lines: string[]): Promise<void> {
  try {
    const html = `
      <div style="font-family: sans-serif; font-size: 14px; color: #222; line-height: 1.6;">
        <p style="margin: 0 0 12px;"><strong>${esc(subject)}</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          ${lines.map((l) => `<li>${esc(l)}</li>`).join("")}
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

export interface OrderPlacedItem {
  name: string;
  sku: string;
  quantity: number;
}

export interface OrderPlacedAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

/**
 * Sent once per order right after the shipping pipeline finishes, success or
 * not, so a new order is never learned about only by opening Medusa admin.
 * If a label was generated its link is included directly; if not, this still
 * arrives (fulfillment still needs to happen), and the separate sendOpsAlert
 * failure email explains why no label exists yet.
 */
export async function sendOrderPlacedNotification(params: {
  eyraOrderRef: string;
  medusaOrderId?: string;
  paymentMethod: "prepaid" | "cod";
  subtotal: number;
  items: OrderPlacedItem[];
  shipping: OrderPlacedAddress;
  awbCode: string | null;
  courierName: string | null;
  labelUrl: string | null;
}): Promise<void> {
  try {
    const { eyraOrderRef, medusaOrderId, paymentMethod, subtotal, items, shipping, awbCode, courierName, labelUrl } = params;

    const itemRows = items
      .map((i) => `<li>${esc(i.name)} (${esc(i.sku)}) &times; ${i.quantity}</li>`)
      .join("");

    const addressBlock = [
      shipping.fullName,
      shipping.addressLine1,
      shipping.addressLine2,
      `${shipping.city}, ${shipping.state} ${shipping.pincode}`,
      shipping.phone,
    ]
      .filter(Boolean)
      .map((line) => esc(line as string))
      .join("<br/>");

    const html = `
      <div style="font-family: sans-serif; font-size: 14px; color: #222; line-height: 1.6;">
        <p style="margin: 0 0 4px;"><strong>New order: ${esc(eyraOrderRef)}</strong></p>
        <p style="margin: 0 0 16px; color: #666;">
          ${paymentMethod === "cod" ? "Cash on delivery" : "Prepaid"} &middot; ₹${subtotal.toLocaleString("en-IN")}
          ${medusaOrderId ? ` &middot; Medusa order ${esc(medusaOrderId)}` : ""}
        </p>

        <p style="margin: 0 0 4px;"><strong>Items</strong></p>
        <ul style="margin: 0 0 16px; padding-left: 20px;">${itemRows}</ul>

        <p style="margin: 0 0 4px;"><strong>Ship to</strong></p>
        <p style="margin: 0 0 16px;">${addressBlock}</p>

        ${
          labelUrl
            ? `<p style="margin: 0 0 8px;">
                 <a href="${esc(labelUrl)}" style="display: inline-block; padding: 10px 18px; background: #020202; color: #fff; text-decoration: none; border-radius: 6px;">
                   Download shipping label
                 </a>
               </p>
               <p style="margin: 0; color: #666;">
                 ${courierName ? `Courier: ${esc(courierName)}. ` : ""}${awbCode ? `AWB: ${esc(awbCode)}.` : ""}
               </p>`
            : `<p style="margin: 0; color: #b00;">
                 No shipping label yet, a separate alert explains why. Check Medusa admin or the Shiprocket dashboard once it's resolved.
               </p>`
        }
      </div>
    `;

    const subject = labelUrl
      ? `New order ${eyraOrderRef}, label ready`
      : `New order ${eyraOrderRef}, label pending`;

    const sent = await sendEmail({ to: recipient(), subject: `[EYRA] ${subject}`, html });
    if (!sent) console.error("[ops-alert] order-placed email returned false for:", eyraOrderRef);
  } catch (err) {
    console.error("[ops-alert] failed to send order-placed notification:", err);
  }
}
