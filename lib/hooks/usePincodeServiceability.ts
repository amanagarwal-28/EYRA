"use client";

import { useState } from "react";
import type { ServiceabilityResult } from "@/app/api/shipping/serviceability/route";

export type PincodeCheckStatus = "idle" | "loading" | "success" | "error";

/**
 * Shared client for the real, Shiprocket-backed serviceability check.
 *
 * Extracted because the PDP had its own pincode "checker" that never called
 * this endpoint at all: it derived a fake estimate from the pincode's first
 * digit and always claimed delivery was available, regardless of whether any
 * courier actually serves that pincode. Checkout's ShippingStep already used
 * the real endpoint correctly; this hook is that same logic made reusable so
 * every pincode-check surface in the app is answering with real data.
 */
export function usePincodeServiceability() {
  const [status, setStatus] = useState<PincodeCheckStatus>("idle");
  const [result, setResult] = useState<ServiceabilityResult | null>(null);
  const [error, setError] = useState("");

  async function check(pincode: string) {
    if (!/^\d{6}$/.test(pincode)) {
      setStatus("error");
      setError("Please enter a valid 6-digit pincode.");
      setResult(null);
      return;
    }
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/shipping/serviceability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode }),
      });
      if (!res.ok) throw new Error(`serviceability check returned ${res.status}`);
      const data = (await res.json()) as ServiceabilityResult;
      setResult(data);
      setStatus("success");
    } catch (err) {
      console.warn("[usePincodeServiceability] check failed for", pincode, ":", err);
      setStatus("error");
      setError("Could not check delivery for this pincode right now. Please try again.");
      setResult(null);
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError("");
  }

  return { status, result, error, check, reset };
}
