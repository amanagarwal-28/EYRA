"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "order", label: "Order status" },
  { value: "return", label: "Return or exchange" },
  { value: "product", label: "Product question" },
  { value: "payment", label: "Payment or refund" },
  { value: "custom", label: "Custom or engraved piece" },
  { value: "other", label: "Something else" },
] as const;

interface FieldErrors {
  name?: string;
  email?: string;
  category?: string;
  message?: string;
  root?: string;
}

const inputClass =
  "w-full bg-white border border-[#CFCFCF] px-4 py-3 font-sans font-light text-[16px] text-black placeholder:text-[#909090] focus:outline-none focus:border-black transition-colors duration-200";

const labelClass =
  "block font-sans font-normal text-[0.68rem] tracking-[0.2em] uppercase text-[#626262] mb-2";

/**
 * Contact form. Posts to the same validated, rate-limited support endpoint the
 * support page uses, so there is one intake path for customer messages.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, message }),
      });

      if (res.ok) {
        setSent(true);
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        errors?: { field: string; message: string }[];
        error?: string;
      } | null;

      if (data?.errors?.length) {
        const mapped: FieldErrors = {};
        for (const err of data.errors) {
          mapped[err.field as keyof FieldErrors] = err.message;
        }
        setErrors(mapped);
      } else {
        setErrors({
          root: data?.error ?? "Something went wrong. Please try again.",
        });
      }
    } catch {
      setErrors({
        root: "We could not reach the server. Check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div
        className="border border-[#CFCFCF] bg-white px-6 py-10 text-center"
        role="status"
      >
        <h3 className="font-display font-light italic text-[1.75rem] leading-tight text-black mb-3">
          Message received
        </h3>
        <p className="font-sans font-light text-[16px] leading-[26px] text-[#505050]">
          Thanks for writing in. We reply to everything within one working day,
          usually sooner. Check your inbox for our response.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {errors.root && (
        <p
          role="alert"
          className="font-sans font-light text-[14px] text-[#D93025] border border-[#D93025]/30 bg-[#D93025]/5 px-4 py-3"
        >
          {errors.root}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Your name
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={inputClass}
            placeholder="Ananya Sharma"
          />
          {errors.name && (
            <p id="contact-name-error" className="mt-2 font-sans font-light text-[13px] text-[#D93025]">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email address
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={inputClass}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p id="contact-email-error" className="mt-2 font-sans font-light text-[13px] text-[#D93025]">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="contact-category" className={labelClass}>
          What is this about
        </label>
        <select
          id="contact-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? "contact-category-error" : undefined}
          className={`${inputClass} appearance-none cursor-pointer`}
        >
          <option value="">Select a topic</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p id="contact-category-error" className="mt-2 font-sans font-light text-[13px] text-[#D93025]">
            {errors.category}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="contact-message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={`${inputClass} resize-y`}
          placeholder="Tell us what you need. If it is about an order, include the order number so we can look it up."
        />
        <div className="flex items-center justify-between mt-2 gap-4">
          {errors.message ? (
            <p id="contact-message-error" className="font-sans font-light text-[13px] text-[#D93025]">
              {errors.message}
            </p>
          ) : (
            <span />
          )}
          <span className="font-sans font-light text-[13px] text-[#909090] shrink-0">
            {message.trim().length}/2000
          </span>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="px-9 py-3.5 rounded-full bg-black text-white font-sans font-normal text-[0.72rem] tracking-[0.2em] uppercase hover:bg-[#3d3d3d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {submitting ? "Sending" : "Send message"}
        </button>
      </div>
    </form>
  );
}
