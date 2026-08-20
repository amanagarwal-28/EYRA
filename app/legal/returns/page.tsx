import type { Metadata } from "next";
import { LegalDocument } from "@/components/layout/LegalDocument";
import { storeConfig } from "@/config/storeConfig";

export const metadata: Metadata = {
  title: "Returns and Refunds",
  description:
    "How to return or exchange an EYRA order, what qualifies, and how refunds are processed.",
};

const { contact, policy } = storeConfig;

export default function ReturnsPolicyPage() {
  return (
    <LegalDocument
      title="Returns and Refunds"
      standfirst="If a piece is not right, here is exactly how to send it back and what happens next."
      updated="20 August 2026"
      sections={[
        {
          heading: "Return window",
          body: [
            `You can raise a return within ${policy.returnDays} days of delivery, or an exchange within ${policy.exchangeDays} days. The clock starts on the date the courier marks your order delivered.`,
            "Raise the request from your account, or email us and we will open it for you.",
          ],
        },
        {
          heading: "Condition of returned items",
          body: [
            "Jewellery is a hygiene-sensitive category, so returns are accepted only when the piece comes back exactly as it left us.",
          ],
          bullets: [
            "Unworn, unaltered, and free of scratches or signs of wear.",
            "In the original EYRA box with any tags, pouches, and authenticity cards.",
            "Accompanied by the invoice or order number.",
          ],
        },
        {
          heading: "What we cannot take back",
          body: [
            "Some items are excluded because they cannot be resold or were made specifically for you.",
          ],
          bullets: [
            "Engraved, resized, or otherwise customised pieces.",
            "Earrings, where the seal or hygiene packaging has been opened.",
            "Items bought in a clearance or final-sale promotion, where the listing said so.",
            "Damage caused after delivery, including impact damage, chemical exposure, or ordinary wear.",
          ],
        },
        {
          heading: "How to raise a return",
          body: [
            `Open your order in your account and choose the item you want to return, or email ${contact.supportEmail} with your order number and a photo of the piece. Tell us whether you want a refund or an exchange.`,
            "We arrange a reverse pickup where the courier services your PIN code. If it does not, we will ask you to self-ship and reimburse reasonable postage.",
          ],
        },
        {
          heading: "Refunds",
          body: [
            "Once your return reaches us we inspect it, usually within two working days. If it passes, we approve the refund immediately.",
            "Prepaid refunds go back to the original payment method and typically appear within five to seven working days, depending on your bank. Cash on delivery refunds are sent by bank transfer to the account details you share with us.",
            "Shipping charges already paid are refunded only when the return is our fault, for example a wrong or defective item.",
          ],
        },
        {
          heading: "Exchanges",
          body: [
            `Exchanges are available within ${policy.exchangeDays} days for a different size or a different piece of equal value. If the new piece costs more, we send a payment link for the difference. If it costs less, we refund the balance.`,
            "Ring sizing is the most common exchange, and we are happy to help you get it right the first time. Ask us for the size guide before you order.",
          ],
        },
        {
          heading: "Damaged or wrong items",
          body: [
            "If something arrives damaged, faulty, or simply is not what you ordered, tell us within 48 hours of delivery with photos. We cover the return cost and send a replacement or a full refund, whichever you prefer.",
            `Manufacturing defects are covered for ${policy.warrantyMonths} months from delivery under our warranty, separately from this return window.`,
          ],
        },
        {
          heading: "Cancellations",
          body: [
            "You can cancel any order free of charge before it is dispatched. Once the courier has collected it, treat it as a return.",
          ],
        },
      ]}
    />
  );
}
