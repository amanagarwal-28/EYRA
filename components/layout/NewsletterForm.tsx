"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterForm() {
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email") as string;
    if (!email.trim()) return;

    setStatus("loading");

    const res = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setStatus(res.ok ? "success" : "error");
  };

  if (status === "success") {
    return (
      <p className="text-[0.78rem] font-light tracking-[0.1em] text-silver py-3">
        You&apos;re on the list — welcome to EYRA.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex items-stretch max-w-xs">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          placeholder="Your email address"
          required
          disabled={status === "loading"}
          className="flex-1 bg-transparent border border-stone text-white text-[0.8rem] font-light tracking-[0.04em] placeholder:text-stone px-4 py-3 focus:outline-none focus:border-silver transition-colors duration-200 disabled:opacity-50"
        />
        <button
          type="submit"
          aria-label="Subscribe to newsletter"
          disabled={status === "loading"}
          className="border border-l-0 border-stone px-3.5 text-smoke hover:text-white hover:border-silver transition-colors duration-200 disabled:opacity-50"
        >
          <ArrowRight size={15} strokeWidth={1.5} />
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-[0.72rem] tracking-[0.05em] text-red-400">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
