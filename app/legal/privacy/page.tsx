import type { Metadata } from "next";
import { LegalDocument } from "@/components/layout/LegalDocument";
import { storeConfig } from "@/config/storeConfig";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How EYRA collects, uses, and protects your personal information.",
};

const { contact, seller } = storeConfig;

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      standfirst="This policy explains what we collect when you shop with EYRA, why we collect it, and the choices you have."
      updated="20 August 2026"
      sections={[
        {
          heading: "Who we are",
          body: [
            `${seller.legalName} operates eyra.org.in and is the data controller for the information described in this policy. Our registered office is at ${seller.addressLine1}, ${seller.city}, ${seller.state} ${seller.pincode}, India.`,
            `If you have a question about this policy or want to exercise any of the rights below, write to us at ${contact.supportEmail}.`,
          ],
        },
        {
          heading: "Information we collect",
          body: [
            "We only collect what we need to take an order, deliver it, and support you afterwards.",
          ],
          bullets: [
            "Account details: your name, email address, and phone number, held by our authentication provider.",
            "Order details: the items you buy, your delivery and billing address, and your order history.",
            "Payment details: handled entirely by Razorpay. We receive a payment reference and status, never your full card number or UPI credentials.",
            "Delivery details: your address and phone number are shared with our courier so they can complete the delivery.",
            "Usage data: basic analytics and error reports that tell us which pages break, so we can fix them.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "We process your information to accept and fulfil orders, issue GST invoices, arrange delivery, handle returns and refunds, respond to support requests, and prevent fraud.",
            "We send order and delivery updates because they are part of the service you asked for. Marketing email is separate: we only send it if you subscribe, and every message carries an unsubscribe link.",
          ],
        },
        {
          heading: "Who we share it with",
          body: [
            "We do not sell your personal information. We share it only with the service providers that make the store work, and only to the extent each one needs.",
          ],
          bullets: [
            "Razorpay, to take and verify payments.",
            "Shiprocket and its courier partners, to pick up and deliver your order.",
            "Clerk, to run account sign-in and keep your session secure.",
            "Resend, to send transactional email such as order confirmations.",
            "Government authorities, where the law requires disclosure.",
          ],
        },
        {
          heading: "How long we keep it",
          body: [
            "Order and invoice records are retained for as long as Indian tax law requires. Account information is kept while your account is open. Support correspondence is kept for two years so we have context if you write back.",
            "You can ask us to close your account and delete the information we are not legally required to keep.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You can ask for a copy of the personal information we hold about you, ask us to correct anything inaccurate, ask us to delete information we no longer need, and withdraw consent for marketing at any time.",
            `To make any of these requests, email ${contact.supportEmail} from the address on your account. We respond within 30 days.`,
          ],
        },
        {
          heading: "Cookies",
          body: [
            "We use cookies and browser storage to keep you signed in, remember your cart and wishlist between visits, and measure whether pages are loading correctly. Blocking them in your browser will stop the cart and sign-in from working.",
          ],
        },
        {
          heading: "Security",
          body: [
            "Traffic to and from the site is encrypted in transit. Payment credentials never reach our servers. Access to order data is limited to the people who need it to run the store.",
            "No system is perfect. If we ever discover a breach that affects you, we will tell you and the relevant authority without undue delay.",
          ],
        },
        {
          heading: "Changes to this policy",
          body: [
            "If we change how we handle your information, we will update this page and move the date at the top. Material changes will also be emailed to account holders.",
          ],
        },
      ]}
    />
  );
}
