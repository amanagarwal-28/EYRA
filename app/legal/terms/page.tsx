import type { Metadata } from "next";
import { LegalDocument } from "@/components/layout/LegalDocument";
import { storeConfig } from "@/config/storeConfig";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms that apply when you browse or buy from EYRA.",
};

const { contact, seller, policy } = storeConfig;

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Use"
      standfirst="These terms apply every time you browse eyra.org.in or place an order with us. Please read them before you buy."
      updated="20 August 2026"
      sections={[
        {
          heading: "Agreement",
          body: [
            `By using this site you agree to these terms. The site is operated by ${seller.legalName}, registered at ${seller.addressLine1}, ${seller.city}, ${seller.state} ${seller.pincode}, India.`,
            "If you do not agree with any part of these terms, please do not use the site.",
          ],
        },
        {
          heading: "Your account",
          body: [
            "You need an account to check out. You are responsible for keeping your sign-in credentials private and for any orders placed through your account.",
            "Tell us straight away if you believe someone else has accessed your account.",
          ],
        },
        {
          heading: "Products and pricing",
          body: [
            "All prices are in Indian Rupees and include GST unless stated otherwise. We show a compare-at price alongside the selling price where one applies.",
            "We photograph our jewellery as accurately as we can, but screens vary and silver catches light differently in person. Minor variation in finish is a characteristic of handmade work, not a defect.",
            "If a product is listed at an obviously incorrect price because of a technical error, we may cancel the order and refund you in full rather than fulfil it at that price.",
          ],
        },
        {
          heading: "Orders",
          body: [
            "Your order is an offer to buy. A contract forms only when we confirm the order by email. Until then we may decline or cancel an order, for example if an item is out of stock, if we cannot verify payment, or if we cannot deliver to your address.",
            "We may limit or cancel orders that appear to be placed by resellers or for fraudulent purposes.",
          ],
        },
        {
          heading: "Payment",
          body: [
            "We accept cards, UPI, net banking, and wallets through Razorpay, and cash on delivery where available. Payment details are handled by our payment provider and never stored by us.",
            "Cash on delivery orders may be verified by phone or message before dispatch.",
          ],
        },
        {
          heading: "Delivery, returns, and refunds",
          body: [
            `Delivery timelines, charges, and the free-shipping threshold are set out in our Shipping Policy. Returns are accepted within ${policy.returnDays} days of delivery and exchanges within ${policy.exchangeDays} days, on the conditions set out in our Returns Policy.`,
            "Those two policies form part of these terms.",
          ],
        },
        {
          heading: "Warranty",
          body: [
            `We warrant our jewellery against manufacturing defects for ${policy.warrantyMonths} months from delivery. The warranty does not cover ordinary tarnish, scratches, bending, stone loss caused by impact, or damage from chemicals, perfume, or water exposure.`,
          ],
        },
        {
          heading: "Intellectual property",
          body: [
            "The EYRA name, logo, product photography, and site content belong to us and may not be copied, resold, or used commercially without written permission.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "Do not attempt to disrupt the site, probe it for vulnerabilities without permission, scrape it at scale, or use it to break the law. We may suspend accounts that do.",
          ],
        },
        {
          heading: "Liability",
          body: [
            "Nothing in these terms limits liability that cannot be limited by law, including for fraud or for death or personal injury caused by negligence.",
            "Subject to that, our total liability for any order is limited to the amount you paid for that order.",
          ],
        },
        {
          heading: "Governing law",
          body: [
            `These terms are governed by the laws of India, and the courts at ${seller.city}, ${seller.state} have exclusive jurisdiction over any dispute.`,
          ],
        },
        {
          heading: "Contact",
          body: [
            `Questions about these terms can go to ${contact.supportEmail}.`,
          ],
        },
      ]}
    />
  );
}
