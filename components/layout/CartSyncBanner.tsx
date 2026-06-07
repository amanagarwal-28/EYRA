"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useStore";

/** Auto-dismiss the banner after this many ms if the user doesn't interact. */
const AUTO_DISMISS_MS = 8000;

function WarningIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function CartSyncBanner() {
  const syncError = useCartStore((s) => s.syncError);
  const clearSyncError = useCartStore((s) => s.clearSyncError);
  const initCart = useCartStore((s) => s.initCart);

  const [retrying, setRetrying] = useState(false);

  // Reset the auto-dismiss timer each time a new error message arrives.
  useEffect(() => {
    if (!syncError) return;
    const timer = setTimeout(clearSyncError, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [syncError, clearSyncError]);

  async function handleRetry() {
    setRetrying(true);
    clearSyncError();   // Hide the error text immediately while we reconnect
    await initCart();   // Re-fetch cart from Medusa to reconcile server state
    setRetrying(false);
  }

  // Keep banner mounted while a retry is in-flight so the user sees feedback.
  if (!syncError && !retrying) return null;

  return (
    <div
      role="alert"
      aria-atomic="true"
      className="fixed bottom-0 inset-x-0 z-50 flex justify-center px-4 pb-5"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="pointer-events-auto w-full max-w-[580px] flex items-center gap-3 pl-4 pr-3 py-3.5 rounded-2xl shadow-2xl"
        style={{ background: "#020202" }}
      >
        {/* Warning icon — amber tint to distinguish from the jet background */}
        <span className="flex-shrink-0" style={{ color: "#E4C23C" }}>
          <WarningIcon />
        </span>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="font-sans font-medium text-[13px] leading-[19px] text-white truncate">
            {retrying ? "Reconnecting to server…" : "Unable to sync cart"}
          </p>
          {!retrying && syncError && (
            <p className="font-sans font-normal text-[11px] leading-[16px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
              {syncError}
            </p>
          )}
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-sans font-medium text-[12px] text-white transition-colors duration-150 disabled:opacity-50"
          style={{ border: "1px solid rgba(255,255,255,0.2)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
        >
          {retrying && (
            <span className="w-3 h-3 rounded-full border border-white/20 border-t-white animate-spin" />
          )}
          {retrying ? "Retrying" : "Retry"}
        </button>

        {/* Dismiss — only available when not mid-retry */}
        {!retrying && (
          <button
            aria-label="Dismiss cart sync error"
            onClick={clearSyncError}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              e.currentTarget.style.background = "";
            }}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}
