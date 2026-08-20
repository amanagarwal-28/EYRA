import type { Metadata } from "next";
import { LegalDocument } from "@/components/layout/LegalDocument";
import { storeConfig } from "@/config/storeConfig";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "Delivery timelines, charges, tracking, and coverage for EYRA orders across India.",
};

const { contact, policy } = storeConfig;

const freeShipping = policy.freeShippingAbove.toLocaleString("en-IN");

export default function ShippingPolicyPage() {
  return (
    <LegalDocument
      title="Shipping Policy"
      standfirst="Where we deliver, how long it takes, and what it costs."
      updated="20 August 2026"
      sections={[
        {
          heading: "Where we deliver",
          body: [
            "We deliver across India through our courier partners. Serviceability depends on your PIN code, and you can check yours on any product page before you order.",
            "We do not ship internationally at the moment.",
          ],
        },
        {
          heading: "Dispatch and delivery time",
          body: [
            `Orders are packed and handed to the courier within one to two working days. Delivery usually takes a further ${policy.deliveryDaysMin} to ${policy.deliveryDaysMax} working days depending on your location.`,
            "Metro addresses are typically at the faster end of that range. Remote PIN codes, and deliveries during festivals or heavy weather, can take longer.",
          ],
        },
        {
          heading: "Shipping charges",
          body: [
            `Shipping is free on prepaid orders above ₹${freeShipping}. Below that, a flat delivery charge is calculated at checkout from your PIN code and the weight of your order, and shown before you pay.`,
            "Cash on delivery orders may carry an additional handling fee, which is also shown at checkout.",
          ],
        },
        {
          heading: "Tracking your order",
          body: [
            "You get an email as soon as your order is confirmed, and a tracking link once the courier scans the parcel. You can also see live status against each order in your account.",
            "Tracking can take a few hours to start updating after dispatch. That gap is normal and does not mean the parcel is lost.",
          ],
        },
        {
          heading: "Packaging",
          body: [
            "Every piece ships in a protective EYRA box inside a tamper-evident outer bag. If the outer packaging arrives open or visibly tampered with, refuse the delivery and tell us the same day.",
          ],
        },
        {
          heading: "Failed deliveries",
          body: [
            "Couriers attempt delivery up to three times. Please keep the phone number on your order reachable, since most failed deliveries are caused by an unanswered call.",
            "If all attempts fail, the parcel returns to us. For prepaid orders we refund the item value once the parcel is back with us. Repeated refusal of cash on delivery orders may mean we restrict that payment method on your account.",
          ],
        },
        {
          heading: "Incorrect addresses",
          body: [
            "We can only change an address before dispatch. Once the courier has the parcel, the address is fixed. Please check your address carefully at checkout.",
          ],
        },
        {
          heading: "Questions",
          body: [
            `For anything shipping related, email ${contact.supportEmail} with your order number and we will chase the courier on your behalf.`,
          ],
        },
      ]}
    />
  );
}
