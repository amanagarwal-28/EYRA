import type { Metadata } from "next";
import { LegalDocument } from "@/components/layout/LegalDocument";
import { storeConfig } from "@/config/storeConfig";

export const metadata: Metadata = {
  title: "Returns, Exchanges and Refunds",
  description:
    "EYRA's 15-day return window, eligibility criteria, reverse pickup, refund timelines, and what we need to process a transit damage claim.",
};

const { contact, policy, seller } = storeConfig;

const freeShipping = policy.freeShippingAbove.toLocaleString("en-IN");

export default function RefundPolicyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Returns, Exchanges and Refunds"
      standfirst="Jewellery is personal, and we want you confident with every purchase. Here is exactly how to send a piece back and what happens next."
      updated="August 2026"
      sections={[
        {
          heading: "1. Shipping and order dispatch",
          body: [
            `Standard in-stock orders are dispatched within ${policy.dispatchHoursMin} to ${policy.dispatchHoursMax} hours. Personalised or custom-made designs need an additional ${policy.customExtraDaysMin} to ${policy.customExtraDaysMax} working days. Where an order mixes both, we may split the shipment so your ready-to-wear items arrive without delay.`,
            `Standard shipping is free across India on prepaid orders above ₹${freeShipping}. Orders below that carry a nominal handling fee shown at checkout.`,
            "Once your parcel reaches our logistics partner, you receive automated tracking notifications by SMS, WhatsApp, and email.",
          ],
        },
        {
          heading: `2. ${policy.returnDays}-day return window`,
          body: [
            `We offer a hassle-free ${policy.returnDays}-day return window, starting from the exact date of delivery.`,
            "To qualify for a return or replacement, the jewellery must be in its original, unworn, and unaltered condition, and must come back with all original packaging, tags, warranty and authenticity cards, and any promotional gifts or silver coins included with the order.",
          ],
        },
        {
          heading: "3. Non-returnable and final sale items",
          body: [
            "Some items cannot be taken back because they were made for you specifically or cannot be resold on hygiene grounds.",
          ],
          bullets: [
            "Custom-engraved or personalised jewellery.",
            "Pierced body jewellery and earrings, on hygiene grounds, unless received damaged or defective.",
            "Silver coins, puja articles, and anything marked Clearance or Final Sale.",
          ],
        },
        {
          heading: "4. Purchases made through third parties",
          body: [
            "This policy covers purchases made directly on the official EYRA store at eyra.org.in. Items bought through third-party marketplaces or partner pop-ups are governed by those channels' own return processes.",
          ],
        },
        {
          heading: "5. Returns inspection and deductions",
          body: [
            "Every returned item goes through a mandatory quality assessment at our fulfilment centre, where we confirm purity marks, weight, and condition.",
            "If an approved return arrives with missing components, broken tags, or without the promotional items it shipped with, such as silver coins or branded accessories, we reserve the right to deduct the full retail price of the missing items from your refund.",
          ],
        },
        {
          heading: "6. Refund settlement",
          body: [
            `Refunds are initiated within ${policy.dispatchHoursMin} to ${policy.dispatchHoursMax} hours after the returned parcel passes inspection.`,
            `The amount is credited back to the original payment source, whether UPI, card, or net banking, through Razorpay. Depending on your bank, funds typically reflect within ${policy.refundDaysMin} to ${policy.refundDaysMax} business days.`,
            "Refunds are calculated on the net invoice amount you paid at checkout. Precious metal rate movements and later promotional price changes do not alter the refundable value. Express shipping charges, where paid, are not refundable.",
          ],
        },
        {
          heading: "7. Exchanges and replacements",
          body: [
            `You can exchange a piece for a different ring or chain size, or for a substitute model of equal value, within ${policy.exchangeDays} days of delivery.`,
            "Replacement dispatch begins as soon as the original piece is scanned and picked up by our reverse courier agent.",
          ],
        },
        {
          heading: "8. Reverse pickup and remote PIN codes",
          body: [
            "Once a return is booked, our courier partner attempts a reverse pickup from your address. Please be available to hand over the parcel and to answer the agent's verification call.",
            `Where a rural or non-standard PIN code is not reverse-serviceable, we will ask you to send the package via a reliable tracked service such as India Post Speed Post. We reimburse return postage up to ₹${policy.selfShipReimbursement} against a valid courier receipt. Any amount beyond that is borne by the customer.`,
          ],
        },
        {
          heading: "9. Transit damage, tampered parcels, and missing items",
          body: [
            `High-value shipments are sealed in tamper-evident packaging. If you receive a compromised, empty, or damaged package, notify us within ${policy.damageClaimHours} hours of delivery.`,
            "A continuous, unedited 360-degree unboxing video is required to process any theft, missing-item, or transit-damage claim. It must clearly show the intact courier flyer, the label barcode, the seal being opened, and the contents inside.",
            "Claims without valid video verification, or showing signs of post-delivery tampering, cannot be processed.",
          ],
        },
        {
          heading: "10. How to start a return or replacement",
          body: [
            "Open the order in your account, choose the item and your preferred resolution, then pack the jewellery securely in its original box and hand it to the courier agent at pickup.",
            `If you would rather not use the account flow, email ${contact.supportEmail} with your order number and we will open the request for you.`,
            `${seller.legalName}, ${seller.addressLine1}, ${seller.city}, ${seller.state} ${seller.pincode}, India.`,
          ],
        },
      ]}
    />
  );
}
